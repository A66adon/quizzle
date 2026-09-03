package org.dev.quizzle.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
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
import org.junit.jupiter.api.io.TempDir;

import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.config.QuizCatalogProperties;
import org.dev.quizzle.config.SnapshotProperties;
import org.dev.quizzle.persistence.SqliteSnapshotRepository;
import org.dev.quizzle.quiz.catalog.QuizCatalog;
import org.dev.quizzle.quiz.catalog.QuizDefinitionValidator;
import org.dev.quizzle.quiz.catalog.QuizYamlParser;
import org.dev.quizzle.quiz.model.AnswerDefinition;
import org.dev.quizzle.session.GameSessionRegistry.PlayerConnection;
import org.dev.quizzle.session.GameSessionRegistry.ReconnectRejectedException;
import tools.jackson.databind.json.JsonMapper;

class GameSessionRegistryTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void createsUniqueSessionsConcurrentlyAndSnapshotsEveryOne() throws Exception {
		Path quizDirectory = prepareQuizDirectory();
		SqliteSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(quizDirectory), repository);
		registry.rehydrate();

		List<Callable<GameSessionSnapshot>> creations = IntStream.range(0, 40)
				.mapToObj(ignored -> (Callable<GameSessionSnapshot>) () -> registry.create("safety.yaml"))
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
		SqliteSnapshotRepository repository = createRepository();
		GameSessionRegistry firstRegistry = createRegistry(createCatalog(quizDirectory), repository);
		firstRegistry.rehydrate();
		GameSessionSnapshot created = firstRegistry.create("safety.yaml");
		GameSessionSnapshot opened = firstRegistry.transition(created.codehash(), GameCommand.START);
		long oldTimer = opened.serverStartEpochMs();

		Thread.sleep(5);
		Files.delete(quizDirectory.resolve("safety.yaml"));
		QuizCatalog emptyCatalog = createCatalog(quizDirectory);
		long rebootStartedAt = System.currentTimeMillis();
		GameSessionRegistry restoredRegistry = createRegistry(emptyCatalog, repository);
		restoredRegistry.rehydrate();

		GameSessionSnapshot restored = restoredRegistry.find(created.codehash()).orElseThrow();
		assertEquals(GameState.QUESTION_OPEN, restored.state());
		assertEquals(0, restored.currentQuestionIndex());
		assertEquals("Safety", restored.quiz().title());
		assertTrue(restored.serverStartEpochMs() >= rebootStartedAt);
		assertNotEquals(oldTimer, restored.serverStartEpochMs());
		assertEquals(restored, repository.loadAll().getFirst());
	}

	@Test
	void kickedPlayerIsMarkedFinalAndCannotReconnect() throws Exception {
		SqliteSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(prepareQuizDirectory()), repository);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create("safety.yaml");
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
		GameSessionSnapshot created = registry.create("safety.yaml");
		registry.transition(created.codehash(), GameCommand.START);

		assertThrows(GameSessionRegistry.JoinNotAllowedException.class,
				() -> registry.joinPlayer(created.codehash(), "Late"));
		assertTrue(registry.isJoinOpen(GameState.LOBBY));
		assertTrue(!registry.isJoinOpen(GameState.QUESTION_OPEN));
	}

	@Test
	void allowsJoinAfterStartWhenConfigured() throws Exception {
		GameSessionRegistry registry = createRegistry(
				createCatalog(prepareQuizDirectory()), createRepository(), true);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create("safety.yaml");
		registry.transition(created.codehash(), GameCommand.START);

		PlayerConnection joined = registry.joinPlayer(created.codehash(), "Late");

		assertEquals("Late", joined.player().name());
		assertEquals(GameState.QUESTION_OPEN, joined.session().state());
		assertTrue(registry.isJoinOpen(GameState.QUESTION_OPEN));
		assertTrue(!registry.isJoinOpen(GameState.CLOSED));
	}

	@Test
	void closingASessionRemovesItFromMemoryAndFromTheSnapshotStore() throws Exception {
		SqliteSnapshotRepository repository = createRepository();
		GameSessionRegistry registry = createRegistry(createCatalog(prepareQuizDirectory()), repository);
		registry.rehydrate();
		GameSessionSnapshot created = registry.create("safety.yaml");

		GameSessionSnapshot closed = registry.transition(created.codehash(), GameCommand.ABORT);

		assertEquals(GameState.CLOSED, closed.state());
		assertTrue(registry.find(created.codehash()).isEmpty());
		assertTrue(registry.list().isEmpty());
		assertTrue(repository.loadAll().isEmpty());
	}

	@Test
	void shufflesAnswersPerSessionUnlessTheQuestionOptsOut() throws Exception {
		Path quizDirectory = Files.createDirectories(temporaryDirectory.resolve("shuffled"));
		Files.writeString(
				quizDirectory.resolve("shuffled.yaml"),
				shuffledQuizYaml(),
				StandardCharsets.UTF_8);
		GameSessionRegistry registry = createRegistry(createCatalog(quizDirectory), createRepository());
		registry.rehydrate();

		Set<List<String>> shuffledOrders = new HashSet<>();
		for (int attempt = 0; attempt < 30; attempt++) {
			GameSessionSnapshot created = registry.create("shuffled.yaml");
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
		Path quizDirectory = Files.createDirectories(temporaryDirectory.resolve("quizzes"));
		Files.writeString(
				quizDirectory.resolve("safety.yaml"),
				SessionTestFixtures.yaml(),
				StandardCharsets.UTF_8);
		return quizDirectory;
	}

	private QuizCatalog createCatalog(Path quizDirectory) {
		QuizCatalog catalog = new QuizCatalog(
				new QuizCatalogProperties(quizDirectory),
				new QuizYamlParser(SessionTestFixtures.validationLimits()),
				new QuizDefinitionValidator(SessionTestFixtures.validationLimits()));
		catalog.loadAtStartup();
		return catalog;
	}

	private SqliteSnapshotRepository createRepository() {
		SqliteSnapshotRepository repository = new SqliteSnapshotRepository(
				new SnapshotProperties(temporaryDirectory.resolve("registry.db"), 60_000, 10_000),
				JsonMapper.builder().build());
		repository.initialize();
		return repository;
	}

	private GameSessionRegistry createRegistry(
			QuizCatalog catalog,
			SqliteSnapshotRepository repository) {
		return createRegistry(catalog, repository, false);
	}

	private GameSessionRegistry createRegistry(
			QuizCatalog catalog,
			SqliteSnapshotRepository repository,
			boolean allowJoinAfterStart) {
		return new GameSessionRegistry(
				new GameSessionProperties(
						URI.create("https://quiz.example.test"), 10, 5_000L, allowJoinAfterStart),
				catalog,
				new GameStateMachine(),
				repository);
	}
}
