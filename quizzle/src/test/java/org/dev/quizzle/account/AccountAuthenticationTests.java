package org.dev.quizzle.account;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.dev.quizzle.security.CsrfToken;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties={"quiz.snapshot.interval-ms=3600000"})
@AutoConfigureMockMvc
class AccountAuthenticationTests extends org.dev.quizzle.persistence.PostgresIntegrationSupport {
	@Autowired MockMvc mvc;
	@Autowired AccountService accounts;
	@Autowired AccountStore store;
	@Autowired AccountTokens tokens;
	@Autowired JdbcTemplate jdbc;
	@Autowired org.dev.quizzle.session.GameSessionRegistry registry;
	@Autowired org.dev.quizzle.quiz.catalog.QuizEditorService editor;
	@Autowired org.dev.quizzle.websocket.WebSocketConnectionHub connections;
	@Autowired org.dev.quizzle.websocket.SessionRealtimePublisher publisher;
	@org.springframework.test.context.bean.override.mockito.MockitoSpyBean
	org.dev.quizzle.persistence.PostgresSnapshotRepository snapshots;
	@MockitoBean AccountMailer mailer;
	private final String password="correct horse battery staple";

	private Account pending() {return accounts.register(UUID.randomUUID()+"@example.test",password);}
	private String verification(Account account) {
		AtomicReference<String> captured=new AtomicReference<>();
		doAnswer(call->{captured.set(call.getArgument(2));return true;}).when(mailer).sendLink(eq(account),eq("/verify-email"),anyString());
		assertTrue(tokens.verification(account));
		return captured.get();
	}
	private String resetToken(Account account) {
		AtomicReference<String> captured=new AtomicReference<>();
		doAnswer(call->{captured.set(call.getArgument(2));return true;}).when(mailer).sendLinkLater(any(),eq("/reset-password"),anyString());
		tokens.forgot(account.email()); return captured.get();
	}
	private MockHttpSession login(Account account) throws Exception {
		var session=new MockHttpSession(); mvc.perform(get("/login").session(session));
		return (MockHttpSession)mvc.perform(post("/login").session(session).param("_csrf",CsrfToken.getOrCreate(session))
				.param("email",account.email()).param("password",password)).andExpect(redirectedUrl("/admin"))
				.andReturn().getRequest().getSession();
	}
	@Test void pendingCannotLoginUntilSingleUseVerification() {
		Account account=pending(); assertTrue(accounts.authenticate(account.email(),password).isEmpty());
		String raw=verification(account);
		assertEquals(AccountTokens.digest(raw),jdbc.queryForObject("SELECT token_digest FROM email_verification_tokens WHERE account_id=?",String.class,UUID.fromString(account.id())));
		assertTrue(tokens.verify(raw)); assertFalse(tokens.verify(raw));
		assertTrue(accounts.authenticate(account.email(),password).isPresent());
	}
	@Test void resendInvalidatesOlderTokenAndExpiredTokensFail() {
		Account account=pending(); String old=verification(account); String current=verification(account);
		assertFalse(tokens.verify(old));
		jdbc.update("UPDATE email_verification_tokens SET expires_at=now()-interval '1 second' WHERE account_id=?",UUID.fromString(account.id()));
		assertFalse(tokens.verify(current));
	}
	@Test void concurrentVerificationConsumesOnlyOnce() throws Exception {
		String raw=verification(pending()); var pool=Executors.newFixedThreadPool(2);
		try {
			var gate=new CountDownLatch(1);
			Callable<Boolean> consume=()->{gate.await();return tokens.verify(raw);};
			Future<Boolean> first=pool.submit(consume),second=pool.submit(consume);gate.countDown();
			assertNotEquals(first.get(10,TimeUnit.SECONDS),second.get(10,TimeUnit.SECONDS));
		} finally {pool.shutdownNow();}
	}
	@Test void resetRevokesAllSessionsAndTokensAndNeverAuthenticates() throws Exception {
		Account account=pending();assertTrue(tokens.verify(verification(account)));
		var session=login(account);String raw=resetToken(account);
		assertNotNull(raw);assertTrue(tokens.reset(raw,"replacement-password"));assertFalse(tokens.reset(raw,"replacement-password"));
		assertTrue(accounts.authenticate(account.email(),password).isEmpty());
		assertTrue(accounts.authenticate(account.email(),"replacement-password").isPresent());
		mvc.perform(get("/admin/api/account/settings").session(session)).andExpect(status().isUnauthorized());
		verify(mailer).passwordChanged(any());
	}
	@Test void oauthOnlyAndUnknownForgotHaveIdenticalHttpResponsesWithoutResetMail() throws Exception {
		Account oauth=new Account(UUID.randomUUID().toString(),"oauth-"+UUID.randomUUID()+"@example.test",null,true,java.util.List.of(),1,false,5000);
		store.create(oauth);
		for(String email:new String[]{oauth.email(),"missing@example.test"}) {
			var session=new MockHttpSession();mvc.perform(get("/forgot-password").session(session));
			mvc.perform(post("/forgot-password").session(session).param("_csrf",CsrfToken.getOrCreate(session)).param("email",email))
					.andExpect(redirectedUrl("/forgot-password?sent"));
		}
		verify(mailer,never()).sendLinkLater(any(),eq("/reset-password"),anyString());
	}
	@Test void passwordChangeRetainsCurrentSessionRevokesOthersAndDeleteRequiresProof() throws Exception {
		Account account=pending();assertTrue(tokens.verify(verification(account)));
		var current=login(account);var other=login(account);
		mvc.perform(post("/admin/api/account/change-password").session(current).header("X-XSRF-TOKEN",CsrfToken.getOrCreate(current))
				.contentType("application/json").content("{\"currentPassword\":\""+password+"\",\"newPassword\":\"replacement-password\"}"))
				.andExpect(status().isNoContent());
		mvc.perform(get("/admin/api/account/settings").session(current)).andExpect(status().isOk()).andExpect(jsonPath("$.hasLocalPassword").value(true));
		mvc.perform(get("/admin/api/account/settings").session(other)).andExpect(status().isUnauthorized());
		mvc.perform(delete("/admin/api/account").session(current).header("X-XSRF-TOKEN",CsrfToken.getOrCreate(current)))
				.andExpect(status().isForbidden());
		mvc.perform(delete("/admin/api/account").session(current).header("X-XSRF-TOKEN",CsrfToken.getOrCreate(current))
				.contentType("application/json").content("{\"currentPassword\":\"replacement-password\"}")).andExpect(status().isNoContent());
		assertTrue(store.findById(account.id()).isEmpty());
	}
	@Test void deletionClosesOwnedRoomsDisconnectsSocketsAndLeavesAnotherOwnerUntouched() throws Exception {
		Account account=pending(),other=pending();
		assertTrue(tokens.verify(verification(account)));assertTrue(tokens.verify(verification(other)));
		String slug=editor.create(account.id(),org.dev.quizzle.session.SessionTestFixtures.quiz());
		String otherSlug=editor.create(other.id(),org.dev.quizzle.session.SessionTestFixtures.quiz());
		var room=registry.create(account.id(),slug);var otherRoom=registry.create(other.id(),otherSlug);
		var player=registry.joinPlayer(room.codehash(),"Participant");
		var socket=mock(org.springframework.web.socket.WebSocketSession.class);
		when(socket.getId()).thenReturn("socket-"+UUID.randomUUID());when(socket.isOpen()).thenReturn(true);
		var connection=connections.register(socket,room.codehash());connections.bindPlayer(connection,player.player().playerId());
		var session=login(account);
		clearInvocations(snapshots);
		mvc.perform(delete("/admin/api/account").session(session).header("X-XSRF-TOKEN",CsrfToken.getOrCreate(session))
				.contentType("application/json").content("{\"currentPassword\":\""+password+"\"}")).andExpect(status().isNoContent());
		assertTrue(registry.find(room.codehash()).isEmpty());assertTrue(connections.find(socket).isEmpty());
		verify(snapshots,never()).save(any());verify(snapshots,never()).delete(anyString());
		verify(socket).close(any(org.springframework.web.socket.CloseStatus.class));
		assertTrue(registry.find(otherRoom.codehash()).isPresent());assertTrue(store.findById(other.id()).isPresent());
		assertEquals(0,jdbc.queryForObject("SELECT count(*) FROM quizzes WHERE owner_account_id=?",Integer.class,UUID.fromString(account.id())));
		assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM quizzes WHERE owner_account_id=?",Integer.class,UUID.fromString(other.id())));
		registry.closeAllOwnedBy(other.id());
	}
	@Test void deferredDeletionCommitFailurePreservesDatabaseRoomAndSocket() throws Exception {
		Account account=pending();assertTrue(tokens.verify(verification(account)));
		String slug=editor.create(account.id(),org.dev.quizzle.session.SessionTestFixtures.quiz());
		var room=registry.create(account.id(),slug);
		var player=registry.joinPlayer(room.codehash(),"Participant");
		var socket=mock(org.springframework.web.socket.WebSocketSession.class);
		when(socket.getId()).thenReturn("rollback-socket-"+UUID.randomUUID());when(socket.isOpen()).thenReturn(true);
		var connection=connections.register(socket,room.codehash());connections.bindPlayer(connection,player.player().playerId());
		String function="deny_delete_"+UUID.randomUUID().toString().replace("-","");
		String trigger="deny_delete_trigger_"+UUID.randomUUID().toString().replace("-","");
		jdbc.execute("CREATE FUNCTION "+function+"() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Test-only deletion rollback'; END; $$");
		try {
			jdbc.execute("CREATE CONSTRAINT TRIGGER "+trigger+" AFTER DELETE ON accounts DEFERRABLE INITIALLY DEFERRED "
					+"FOR EACH ROW WHEN (OLD.id='"+account.id()+"'::uuid) EXECUTE FUNCTION "+function+"()");
			clearInvocations(snapshots);
			RuntimeException failure=assertThrows(RuntimeException.class,()-> {
				synchronized(registry) {
					accounts.deleteAccount(account.id(),password,0,
							()->registry.removeOwnedAfterDeletion(account.id(),publisher::publishAndDisconnect));
				}
			});
			assertTrue(java.util.stream.Stream.iterate((Throwable)failure,java.util.Objects::nonNull,Throwable::getCause)
					.anyMatch(cause->cause.getMessage()!=null && cause.getMessage().contains("Test-only deletion rollback")));
			assertTrue(store.findById(account.id()).isPresent());
			assertTrue(registry.find(room.codehash()).isPresent());
			assertTrue(connections.find(socket).isPresent());
			assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM session_snapshots WHERE codehash=?",Integer.class,room.codehash()));
			assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM quizzes WHERE owner_account_id=?",Integer.class,UUID.fromString(account.id())));
			verify(socket,never()).close(any(org.springframework.web.socket.CloseStatus.class));
			verify(snapshots,never()).save(any());verify(snapshots,never()).delete(anyString());
		} finally {
			jdbc.execute("DROP TRIGGER IF EXISTS "+trigger+" ON accounts");
			jdbc.execute("DROP FUNCTION "+function+"()");
			registry.closeAllOwnedBy(account.id(),publisher::publishAndDisconnect);
		}
	}
}
