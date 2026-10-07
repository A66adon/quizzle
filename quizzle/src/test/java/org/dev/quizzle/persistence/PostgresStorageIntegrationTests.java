package org.dev.quizzle.persistence;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.dev.quizzle.account.Account;
import org.dev.quizzle.account.AccountStore;
import org.dev.quizzle.account.AccountService;
import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.quiz.catalog.*;
import org.dev.quizzle.quiz.model.QuizDefinition;
import org.dev.quizzle.session.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = "quiz.snapshot.interval-ms=3600000")
class PostgresStorageIntegrationTests extends PostgresIntegrationSupport {
	@Autowired JdbcTemplate jdbc;
	@Autowired Flyway flyway;
	@Autowired AccountStore accounts;
	@Autowired AccountService accountService;
	@Autowired QuizEditorService editor;
	@Autowired QuizCatalog catalog;
	@Autowired QuizYamlParser parser;
	@Autowired PostgresSnapshotRepository snapshots;
	@Autowired GameSessionProperties sessionProperties;
	private Account owner;
	private Account other;

	@BeforeEach
	void cleanRows() {
		jdbc.update("DELETE FROM accounts");
		owner = account("Original@Example.com");
		other = account("other@example.com");
	}

	private Account account(String email) {
		return accounts.create(new Account(UUID.randomUUID().toString(), email, null, true,
				List.of(), System.currentTimeMillis(), false, 5000));
	}

	@Test
	void migratesEmptyPostgresqlAndEnforcesAllConstraints() {
		assertEquals("2", flyway.info().current().getVersion().getVersion());
		assertTrue(flyway.validateWithResult().validationSuccessful);
		assertEquals(7, jdbc.queryForObject("""
				SELECT count(*) FROM information_schema.tables WHERE table_schema='public'
				AND table_name IN ('accounts','external_identities','email_verification_tokens',
				    'password_reset_tokens','quizzes','session_snapshots','flyway_schema_history')
				""", Integer.class));
		assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
				"UPDATE accounts SET status='INVALID' WHERE id=?", UUID.fromString(owner.id())));
		assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
				"UPDATE accounts SET auto_advance_delay_ms=-1 WHERE id=?", UUID.fromString(owner.id())));
		assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
				INSERT INTO external_identities(id,account_id,provider,provider_subject,provider_email)
				VALUES (?,?,'google','sub','x@example.com')
				""", UUID.randomUUID(), UUID.randomUUID()));
		jdbc.update("""
				INSERT INTO external_identities(id,account_id,provider,provider_subject,provider_email)
				VALUES (?,?,'google','sub','x@example.com')
				""", UUID.randomUUID(), UUID.fromString(owner.id()));
		assertThrows(DuplicateKeyException.class, () -> jdbc.update("""
				INSERT INTO external_identities(id,account_id,provider,provider_subject,provider_email)
				VALUES (?,?,'google','sub','other@example.com')
				""", UUID.randomUUID(), UUID.fromString(other.id())));
		for (String table : List.of("email_verification_tokens", "password_reset_tokens")) {
			jdbc.update("INSERT INTO " + table + "(id,account_id,token_digest,expires_at) VALUES (?,?,?,now()+interval '1 hour')",
					UUID.randomUUID(), UUID.fromString(owner.id()), "a".repeat(64));
			assertThrows(DuplicateKeyException.class, () -> jdbc.update(
					"INSERT INTO " + table + "(id,account_id,token_digest,expires_at) VALUES (?,?,?,now())",
					UUID.randomUUID(), UUID.fromString(other.id()), "a".repeat(64)));
			assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
					"INSERT INTO " + table + "(id,account_id,token_digest,expires_at) VALUES (?,?,?,now())",
					UUID.randomUUID(), UUID.fromString(owner.id()), "plaintext-token"));
		}
	}

	@Test
	void concurrentNormalizedEmailsHaveOneWinnerAndSettingsPersist() throws Exception {
		try (var executor = Executors.newFixedThreadPool(2)) {
			var results = executor.invokeAll(List.<Callable<Boolean>>of(
					() -> tryCreate("  Race@Example.COM  "), () -> tryCreate("race@example.com")));
			assertEquals(1, results.stream().filter(result -> {
				try { return result.get(); } catch (Exception failure) { throw new AssertionError(failure); }
			}).count());
		}
		Account loaded = accounts.findByEmail(" ORIGINAL@example.com ").orElseThrow();
		assertEquals("Original@Example.com", loaded.email());
		assertNull(loaded.passwordHash());
		accountService.updateGameSettings(owner.id(), true, 1234);
		AccountStore restarted = new AccountStore(jdbc);
		assertTrue(restarted.findById(owner.id()).orElseThrow().allowLateJoin());
		assertEquals(1234, restarted.findById(owner.id()).orElseThrow().autoAdvanceDelayMs());
		assertFalse(restarted.findById(other.id()).orElseThrow().allowLateJoin());
	}

	private boolean tryCreate(String email) {
		try { account(email); return true; }
		catch (DuplicateKeyException expected) { return false; }
	}

	@Test
	void credentialVersionMustMatchExactlyAndAccountMustRemainActive() {
		assertTrue(accounts.isCurrentActive(owner.id(),0));
		accounts.revokeCredentials(owner.id());
		assertEquals(1,accounts.credentialVersion(owner.id()));
		assertFalse(accounts.isCurrentActive(owner.id(),0));
		assertTrue(accounts.isCurrentActive(owner.id(),1));
		assertFalse(accounts.isCurrentActive(owner.id(),2));
		jdbc.update("UPDATE accounts SET status='DISABLED' WHERE id=?",UUID.fromString(owner.id()));
		assertFalse(accounts.isCurrentActive(owner.id(),1));
	}

	@Test
	void staleSettingsSnapshotCannotRestoreAnOldPasswordOrReactivateDisabledAccount() {
		accounts.updatePassword(owner.id(),"old-hash");
		Account stale=accounts.findById(owner.id()).orElseThrow();
		long version=accounts.updatePassword(owner.id(),"replacement-hash");
		jdbc.update("UPDATE accounts SET status='DISABLED' WHERE id=?",UUID.fromString(owner.id()));
		accounts.updateGameSettings(stale.id(),true,1234);
		Account stored=accounts.findById(owner.id()).orElseThrow();
		assertEquals("replacement-hash",stored.passwordHash());
		assertEquals(Account.Status.DISABLED,stored.status());
		assertEquals(version,accounts.credentialVersion(owner.id()));
		assertEquals(stale.email(),stored.email());
		assertTrue(stored.allowLateJoin());
		assertEquals(1234,stored.autoAdvanceDelayMs());
		assertFalse(accounts.isCurrentActive(owner.id(),version));
	}

	@Test
	void concurrentSettingsAndPasswordWritesRetainBothChanges() throws Exception {
		long originalVersion=accounts.credentialVersion(owner.id());
		try(var executor=Executors.newFixedThreadPool(2)) {
			var gate=new java.util.concurrent.CountDownLatch(1);
			var settings=executor.submit(()->{gate.await();accounts.updateGameSettings(owner.id(),true,4321);return true;});
			var password=executor.submit(()->{gate.await();return accounts.updatePassword(owner.id(),"replacement-hash");});
			gate.countDown();
			assertTrue(settings.get(10,java.util.concurrent.TimeUnit.SECONDS));
			assertEquals(originalVersion+1,password.get(10,java.util.concurrent.TimeUnit.SECONDS));
		}
		Account stored=accounts.findById(owner.id()).orElseThrow();
		assertEquals("replacement-hash",stored.passwordHash());
		assertTrue(stored.allowLateJoin());
		assertEquals(4321,stored.autoAdvanceDelayMs());
		assertEquals(Account.Status.ACTIVE,stored.status());
		assertEquals(originalVersion+1,accounts.credentialVersion(owner.id()));
	}

	@Test
	void deletedQuizIdentityCannotAddressASameTitleReplacementOrImport() throws Exception {
		var original=SessionTestFixtures.quiz();
		String staleFile=editor.create(owner.id(),original);
		editor.delete(owner.id(),staleFile);
		String replacement=editor.create(owner.id(),original);
		assertNotEquals(staleFile,replacement);
		assertThrows(QuizEditorException.class,()->editor.update(owner.id(),staleFile,
				new QuizDefinition("Stale tab overwrite","Description","Author",List.of()),1));
		assertEquals(original,editor.load(owner.id(),replacement));
		assertEquals(1,editor.loadRevision(owner.id(),replacement).version());
		editor.delete(owner.id(),replacement);
		var imported=editor.importYaml(owner.id(),new QuizYamlWriter().write(original));
		assertNotEquals(staleFile,imported.fileName());assertNotEquals(replacement,imported.fileName());
		assertThrows(QuizEditorException.class,()->editor.update(owner.id(),replacement,
				new QuizDefinition("Stale imported overwrite","Description","Author",List.of()),1));
		assertEquals(original,editor.load(owner.id(),imported.fileName()));
		assertEquals(1,editor.loadRevision(owner.id(),imported.fileName()).version());
		assertEquals(jdbc.queryForObject("SELECT id::text FROM quizzes WHERE owner_account_id=? AND slug=?",String.class,
						UUID.fromString(owner.id()),imported.fileName()),
				imported.fileName().substring(imported.fileName().length()-41,imported.fileName().length()-5));
	}

	@Test
	void storedLateJoinDefaultsAffectNewGamesAndRemainOwnerSpecific() {
		String slug=editor.create(owner.id(),SessionTestFixtures.quiz());
		String otherSlug=editor.create(other.id(),SessionTestFixtures.quiz());
		accountService.updateGameSettings(owner.id(),true,1200);
		var registry=new GameSessionRegistry(sessionProperties,catalog,new GameStateMachine(),snapshots,accountService);
		var owned=registry.create(owner.id(),slug);var foreign=registry.create(other.id(),otherSlug);
		registry.transition(owned.codehash(),GameCommand.START);registry.transition(foreign.codehash(),GameCommand.START);
		assertDoesNotThrow(()->registry.joinPlayer(owned.codehash(),"Late participant"));
		assertThrows(GameSessionRegistry.JoinNotAllowedException.class,()->registry.joinPlayer(foreign.codehash(),"Late participant"));
		assertEquals(1200,accounts.findById(owner.id()).orElseThrow().autoAdvanceDelayMs());
	}

	@Test
	void accountDeletionAndCreationCannotLeaveAnOrphanLiveRoom() throws Exception {
		String slug=editor.create(owner.id(),SessionTestFixtures.quiz());
		var registry=new GameSessionRegistry(sessionProperties,catalog,new GameStateMachine(),snapshots,accountService);
		try(var executor=Executors.newFixedThreadPool(2)) {
			var gate=new java.util.concurrent.CountDownLatch(1);
			var create=executor.submit(()-> {
				gate.await();
				try {registry.create(owner.id(),slug);}
				catch(GameSessionRegistry.QuizNotFoundException deletedBeforeCreate) {}
				return true;
			});
			var delete=executor.submit(()-> {
				gate.await();
				synchronized(registry) {
					accountService.deleteAccount(owner.id(),null,java.time.Instant.now().getEpochSecond(),
							()->registry.removeOwnedAfterDeletion(owner.id(),snapshot -> {}));
				}
				return true;
			});
			gate.countDown();
			assertTrue(create.get(10,java.util.concurrent.TimeUnit.SECONDS));
			assertTrue(delete.get(10,java.util.concurrent.TimeUnit.SECONDS));
		}
		assertTrue(registry.list(owner.id()).isEmpty());assertTrue(accounts.findById(owner.id()).isEmpty());
		assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM session_snapshots WHERE owner_account_id=?",Integer.class,UUID.fromString(owner.id())));
	}

	@Test
	void crudImportExportOwnershipAndOptimisticRevisions() throws Exception {
		QuizDefinition quiz = SessionTestFixtures.quiz();
		String slug = editor.create(owner.id(), quiz);
		assertEquals(1, editor.loadRevision(owner.id(), slug).version());
		assertThrows(QuizEditorException.class, () -> editor.load(other.id(), slug));
		assertThrows(QuizEditorException.class, () -> editor.delete(other.id(), slug));
		assertThrows(QuizEditorException.class, () -> editor.update(other.id(), slug, quiz, 1));
		assertEquals(2, editor.update(owner.id(), slug, quiz, 1).version());
		var conflict = assertThrows(QuizRevisionConflictException.class,
				() -> editor.update(owner.id(), slug, new QuizDefinition("Stale", "Description", "Author", List.of()), 1));
		assertEquals(2, conflict.currentVersion());
		assertEquals(quiz, editor.load(owner.id(), slug));
		assertThrows(IllegalArgumentException.class, () -> editor.update(owner.id(), slug, quiz, 0));
		assertEquals(2, editor.loadRevision(owner.id(), slug).version());
		LoadedQuiz imported = editor.importYaml(owner.id(), editor.exportYaml(owner.id(), slug));
		assertNotEquals(slug, imported.fileName());
		assertEquals(quiz, imported.quiz());
		assertEquals(1, imported.version());
		assertEquals(quiz, parser.parse(editor.exportYaml(owner.id(), imported.fileName())));
		String draft = editor.create(owner.id(), new QuizDefinition("Draft", "Description", "Author", List.of()));
		assertEquals(0, editor.load(owner.id(), draft).questions().size());
		var registry = new GameSessionRegistry(sessionProperties, catalog, new GameStateMachine(), snapshots, accountService);
		assertThrows(GameSessionRegistry.UnplayableQuizException.class, () -> registry.create(owner.id(), draft));
		assertTrue(registry.list(owner.id()).isEmpty());
		assertEquals(0, editor.load(owner.id(), draft).questions().size());
		assertTrue(catalog.snapshotFor(other.id()).quizzes().isEmpty());
		assertEquals(3, catalog.snapshotFor(owner.id()).quizzes().size());
		editor.delete(owner.id(), imported.fileName());
		assertThrows(QuizEditorException.class, () -> editor.load(owner.id(), imported.fileName()));
	}

	@Test
	void concurrentEditsHaveOneWinnerWithoutOverwritingTheWinningRevision() throws Exception {
		String slug = editor.create(owner.id(), SessionTestFixtures.quiz());
		try (var executor = Executors.newFixedThreadPool(2)) {
			var results = executor.invokeAll(List.<Callable<Boolean>>of(
					() -> tryEdit(slug, "First"), () -> tryEdit(slug, "Second")));
			assertEquals(1, results.stream().filter(result -> {
				try { return result.get(); } catch (Exception failure) { throw new AssertionError(failure); }
			}).count());
		}
		assertEquals(2, editor.loadRevision(owner.id(), slug).version());
		assertTrue(List.of("First", "Second").contains(editor.load(owner.id(), slug).title()));
		assertEquals(1, catalog.snapshotFor(owner.id()).quizzes().size());
	}

	private boolean tryEdit(String slug, String title) {
		try {
			editor.update(owner.id(), slug, new QuizDefinition(title, "Description", "Author", List.of()), 1);
			return true;
		} catch (QuizRevisionConflictException expected) {
			assertEquals(2, expected.currentVersion());
			return false;
		}
	}

	@Test
	void foreignKeysCascadeOwnedRowsAndLeaveAnotherAccountUntouched() {
		String slug = editor.create(owner.id(), SessionTestFixtures.quiz());
		String otherSlug = editor.create(other.id(), SessionTestFixtures.quiz());
		snapshots.save(GameSessionSnapshot.create("OwnerSnapshot", owner.id(), slug, SessionTestFixtures.quiz(), 1000));
		snapshots.save(GameSessionSnapshot.create("OtherSnapshot", other.id(), otherSlug, SessionTestFixtures.quiz(), 1000));
		for (Account account : List.of(owner, other)) {
			jdbc.update("""
					INSERT INTO external_identities(id,account_id,provider,provider_subject,provider_email)
					VALUES (?,?,'google',?,?)
					""", UUID.randomUUID(), UUID.fromString(account.id()), account.id(), account.email());
			for (String table : List.of("email_verification_tokens", "password_reset_tokens")) {
				jdbc.update("INSERT INTO " + table + "(id,account_id,token_digest,expires_at) VALUES (?,?,?,now())",
						UUID.randomUUID(), UUID.fromString(account.id()),
						(account == owner ? "a" : "b").repeat(64));
			}
		}
		accounts.delete(owner.id());
		assertTrue(catalog.snapshotFor(owner.id()).quizzes().isEmpty());
		assertEquals(other.id(), snapshots.loadAll().getFirst().ownerAccountId());
		assertEquals(1, snapshots.loadAll().size());
		for (String table : List.of("external_identities", "email_verification_tokens", "password_reset_tokens")) {
			assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class));
			assertEquals(other.id(), jdbc.queryForObject("SELECT account_id FROM " + table, String.class));
		}
		assertEquals(1, catalog.snapshotFor(other.id()).quizzes().size());
	}

	@Test
	void metadataListingDoesNotReadEvenInvalidStoredContent() {
		String slug = editor.create(owner.id(), SessionTestFixtures.quiz());
		jdbc.update("UPDATE quizzes SET content='{}'::jsonb WHERE owner_account_id=? AND slug=?",
				UUID.fromString(owner.id()), slug);
		var listed = catalog.snapshotFor(owner.id()).quizzes().getFirst();
		assertEquals(SessionTestFixtures.quiz().title(), listed.title());
		assertEquals(SessionTestFixtures.quiz().questions().size(), listed.questionCount());
		assertNull(listed.quiz());
	}

	@Test
	void restartRestoresPayloadWithoutQuizAndDeletionCascadesOnlyOwnedData() {
		String slug = editor.create(owner.id(), SessionTestFixtures.quiz());
		String otherSlug = editor.create(other.id(), SessionTestFixtures.quiz());
		var registry = new GameSessionRegistry(sessionProperties, catalog, new GameStateMachine(), snapshots, accountService);
		var created = registry.create(owner.id(), slug);
		registry.joinPlayer(created.codehash(), "Alex");
		var open = registry.transition(created.codehash(), GameCommand.START);
		editor.delete(owner.id(), slug);
		var restarted = new GameSessionRegistry(sessionProperties, catalog, new GameStateMachine(),
				new PostgresSnapshotRepository(jdbc, tools.jackson.databind.json.JsonMapper.builder().build()), accountService);
		long reboot = System.currentTimeMillis();
		restarted.rehydrate();
		var restored = restarted.find(created.codehash()).orElseThrow();
		assertEquals(GameState.QUESTION_OPEN, restored.state());
		assertEquals(open.quiz(), restored.quiz());
		assertEquals(1, restored.players().size());
		assertTrue(restored.serverStartEpochMs() >= reboot);
		assertEquals(ConnectionStatus.TEMPORARILY_DISCONNECTED, restored.players().getFirst().connectionStatus());
		var otherSession = registry.create(other.id(), otherSlug);
		registry.closeAllOwnedBy(owner.id());
		accounts.delete(owner.id());
		assertTrue(registry.find(created.codehash()).isEmpty());
		assertEquals(List.of(otherSession), snapshots.loadAll());
		assertTrue(accounts.findById(owner.id()).isEmpty());
		assertTrue(accounts.findById(other.id()).isPresent());
		assertEquals(1, catalog.snapshotFor(other.id()).quizzes().size());
	}
}
