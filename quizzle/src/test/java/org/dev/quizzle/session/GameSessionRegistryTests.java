package org.dev.quizzle.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.account.AccountService;
import org.dev.quizzle.persistence.PostgresSnapshotRepository;
import org.dev.quizzle.quiz.catalog.QuizCatalog;
import org.dev.quizzle.quiz.catalog.QuizYamlParser;
import org.dev.quizzle.quiz.model.AnswerDefinition;
import org.dev.quizzle.session.GameSessionRegistry.PlayerConnection;
import org.dev.quizzle.session.GameSessionRegistry.ReconnectRejectedException;

class GameSessionRegistryTests {

	Path temporaryDirectory = Path.of("build", "registry-fixtures");

	@Test
	void rejectsEmptyDraftBeforeAllocatingOrPersistingALiveGame() {
		var catalog=org.mockito.Mockito.mock(QuizCatalog.class);
		org.mockito.Mockito.when(catalog.findByFileName(SessionTestFixtures.OWNER_ACCOUNT_ID,"draft.yaml"))
				.thenReturn(java.util.Optional.of(new org.dev.quizzle.quiz.catalog.LoadedQuiz("draft.yaml",
						new org.dev.quizzle.quiz.model.QuizDefinition("Draft","Description","Author",List.of()))));
		var repository=createRepository();
		var registry=createRegistry(catalog,repository);
		assertThrows(IllegalArgumentException.class,()->registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID,"draft.yaml"));
		assertTrue(registry.list().isEmpty());
		org.mockito.Mockito.verify(repository,org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void createsUniqueSessionsConcurrentlyAndSnapshotsEveryOne() throws Exception {
		Path quizDirectory = prepareQuizDirectory();
		PostgresSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(quizDirectory), repository);
		registry.rehydrate();

		List<Callable<GameSessionSnapshot>> creations = IntStream.range(0, 40)
				.mapToObj(ignored -> (Callable<GameSessionSnapshot>) () ->
						registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml"))
				.toList();
		try (var executor = Executors.newFixedThreadPool(12)) {
			List<GameSessionSnapshot> created = executor.invokeAll(creations).stream()
					.map(future -> {
						try {
							return future.get(10, TimeUnit.SECONDS);
						} catch (Exception exception) {
							throw new AssertionError(exception);
						}
					})
					.toList();
			Set<String> codehashes = created.stream()
					.map(GameSessionSnapshot::codehash)
					.collect(Collectors.toSet());

			assertEquals(40, codehashes.size());
			assertTrue(codehashes.stream().allMatch(codehash -> codehash.matches("[A-Za-z0-9_-]{10}")));
			assertEquals(40, repository.loadAll().size());
		}
	}

	@Test
	void rehydratesWithoutYamlAndRefreshesAnOpenQuestionTimer() throws Exception {
		Path quizDirectory = prepareQuizDirectory();
		PostgresSnapshotRepository repository = createRepository();
		GameSessionRegistry firstRegistry = createRegistry(createCatalog(quizDirectory), repository);
		firstRegistry.rehydrate();
		GameSessionSnapshot created = firstRegistry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml");
		GameSessionSnapshot opened = firstRegistry.transition(created.codehash(), GameCommand.START);
		long oldTimer = opened.serverStartEpochMs();

		Thread.sleep(5);
		QuizCatalog emptyCatalog = org.mockito.Mockito.mock(QuizCatalog.class);
		long rebootStartedAt = System.currentTimeMillis();
		GameSessionRegistry restoredRegistry = createRegistry(emptyCatalog, repository);
		restoredRegistry.rehydrate();

		GameSessionSnapshot restored = restoredRegistry.find(created.codehash()).orElseThrow();
		assertEquals(GameState.QUESTION_OPEN, restored.state());
		assertEquals(0, restored.currentQuestionIndex());
		assertEquals("Safety", restored.quiz().title());
		assertEquals(SessionTestFixtures.OWNER_ACCOUNT_ID, restored.ownerAccountId());
		assertTrue(restored.serverStartEpochMs() >= rebootStartedAt);
		assertNotEquals(oldTimer, restored.serverStartEpochMs());
		assertEquals(restored, repository.loadAll().getFirst());
	}

	@Test
	void kickedPlayerIsMarkedFinalAndCannotReconnect() throws Exception {
		PostgresSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(prepareQuizDirectory()), repository);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml");
		PlayerConnection joined = registry.joinPlayer(created.codehash(), "Robin");

		GameSessionSnapshot kicked = registry.kickPlayer(created.codehash(), joined.player().playerId());

		assertEquals(ConnectionStatus.KICKED, kicked.players().getFirst().connectionStatus());
		assertEquals(kicked, repository.loadAll().getFirst());
		assertThrows(ReconnectRejectedException.class, () ->
				registry.reconnectPlayer(created.codehash(), joined.player().reconnectToken()));
	}

	@Test
	void rejectsJoinAfterTheLobbyByDefault() throws Exception {
		GameSessionRegistry registry = createRegistry(createCatalog(prepareQuizDirectory()), createRepository());
		registry.rehydrate();
		GameSessionSnapshot created = registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml");
		GameSessionSnapshot opened = registry.transition(created.codehash(), GameCommand.START);

		assertThrows(GameSessionRegistry.JoinNotAllowedException.class,
				() -> registry.joinPlayer(created.codehash(), "Late"));
		assertTrue(registry.isJoinOpen(created));
		assertTrue(!registry.isJoinOpen(opened));
	}

	@Test
	void allowsJoinAfterStartWhenConfigured() throws Exception {
		GameSessionRegistry registry = createRegistry(
				createCatalog(prepareQuizDirectory()), createRepository(), true);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml");
		GameSessionSnapshot opened = registry.transition(created.codehash(), GameCommand.START);

		PlayerConnection joined = registry.joinPlayer(created.codehash(), "Late");

		assertEquals("Late", joined.player().name());
		assertEquals(GameState.QUESTION_OPEN, joined.session().state());
		assertTrue(registry.isJoinOpen(opened));
		GameSessionSnapshot closed = registry.transition(created.codehash(), GameCommand.ABORT);
		assertTrue(!registry.isJoinOpen(closed));
	}

	@Test
	void closingASessionRemovesItFromMemoryAndFromTheSnapshotStore() throws Exception {
		PostgresSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(prepareQuizDirectory()), repository);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml");

		GameSessionSnapshot closed = registry.transition(created.codehash(), GameCommand.ABORT);

		assertEquals(GameState.CLOSED, closed.state());
		assertTrue(registry.find(created.codehash()).isEmpty());
		assertTrue(registry.list().isEmpty());
		assertTrue(repository.loadAll().isEmpty());
	}

	@Test
	void shufflesAnswersPerSessionUnlessTheQuestionOptsOut() throws Exception {
		Path quizDirectory = temporaryDirectory.resolve("shuffled");
		GameSessionRegistry registry = createRegistry(createCatalog(quizDirectory), createRepository());
		registry.rehydrate();

		Set<List<String>> shuffledOrders = new HashSet<>();
		for (int attempt = 0; attempt < 30; attempt++) {
			GameSessionSnapshot created = registry.create(SessionTestFixtures.OWNER_ACCOUNT_ID, "shuffled.yaml");
			shuffledOrders.add(answerIds(created, 0));
			assertEquals(List.of("f1", "f2", "f3", "f4", "f5", "f6"), answerIds(created, 1));
		}

		assertTrue(shuffledOrders.size() > 1, "the shuffled question kept a single answer order");
	}

	private List<String> answerIds(GameSessionSnapshot snapshot, int questionIndex) {
		return snapshot.quiz().questions().get(questionIndex).answers().stream()
				.map(AnswerDefinition::id)
				.toList();
	}

	private String shuffledQuizYaml() {
		return """
				title: Safety
				description: Shuffle rules
				author: Safety Team
				questions:
				  - id: shuffled
				    text: Shuffled question
				    points: 1000
				    timeSeconds: 20
				    multiple: false
				    answers:
				      - id: s1
				        text: Correct
				        correct: true
				      - id: s2
				        text: Wrong
				        correct: false
				      - id: s3
				        text: Wrong
				        correct: false
				      - id: s4
				        text: Wrong
				        correct: false
				      - id: s5
				        text: Wrong
				        correct: false
				      - id: s6
				        text: Wrong
				        correct: false
				  - id: fixed
				    text: Fixed question
				    points: 1000
				    timeSeconds: 20
				    multiple: false
				    shuffle_answers: false
				    answers:
				      - id: f1
				        text: Correct
				        correct: true
				      - id: f2
				        text: Wrong
				        correct: false
				      - id: f3
				        text: Wrong
				        correct: false
				      - id: f4
				        text: Wrong
				        correct: false
				      - id: f5
				        text: Wrong
				        correct: false
				      - id: f6
				        text: Wrong
				        correct: false
				""";
	}

	private Path prepareQuizDirectory() throws Exception {
		return temporaryDirectory.resolve("quizzes");
	}

	private QuizCatalog createCatalog(Path quizDirectory) throws org.dev.quizzle.quiz.catalog.QuizFileException {
		QuizCatalog catalog = org.mockito.Mockito.mock(QuizCatalog.class);
		QuizYamlParser parser = new QuizYamlParser(SessionTestFixtures.validationLimits());
		org.mockito.Mockito.when(catalog.findByFileName(SessionTestFixtures.OWNER_ACCOUNT_ID, "safety.yaml"))
				.thenReturn(java.util.Optional.of(new org.dev.quizzle.quiz.catalog.LoadedQuiz("safety.yaml",
						parser.parse(SessionTestFixtures.yaml()))));
		org.mockito.Mockito.when(catalog.findByFileName(SessionTestFixtures.OWNER_ACCOUNT_ID, "shuffled.yaml"))
				.thenReturn(java.util.Optional.of(new org.dev.quizzle.quiz.catalog.LoadedQuiz("shuffled.yaml",
						parser.parse(shuffledQuizYaml()))));
		return catalog;
	}

	private PostgresSnapshotRepository createRepository() {
		PostgresSnapshotRepository repository = org.mockito.Mockito.mock(PostgresSnapshotRepository.class);
		var snapshots = new java.util.concurrent.ConcurrentHashMap<String, GameSessionSnapshot>();
		org.mockito.Mockito.doAnswer(call -> {
			GameSessionSnapshot snapshot = call.getArgument(0);
			snapshots.put(snapshot.codehash(), snapshot);
			return null;
		}).when(repository).save(org.mockito.ArgumentMatchers.any());
		org.mockito.Mockito.doAnswer(call -> {
			snapshots.remove((String) call.getArgument(0));
			return null;
		}).when(repository).delete(org.mockito.ArgumentMatchers.anyString());
		org.mockito.Mockito.when(repository.loadAll()).thenAnswer(call -> List.copyOf(snapshots.values()));
		return repository;
	}

	private GameSessionRegistry createRegistry(
			QuizCatalog catalog,
			PostgresSnapshotRepository repository) {
		return createRegistry(catalog, repository, false);
	}

	private GameSessionRegistry createRegistry(
			QuizCatalog catalog,
			PostgresSnapshotRepository repository,
			boolean allowJoinAfterStart) {
		GameSessionProperties sessionProperties = new GameSessionProperties(
				URI.create("https://quiz.example.test"), 10, 5_000L, allowJoinAfterStart);
		AccountService accountService = org.mockito.Mockito.mock(AccountService.class);
		return new GameSessionRegistry(
				sessionProperties,
				catalog,
				new GameStateMachine(),
				repository,
				accountService);
	}
}
