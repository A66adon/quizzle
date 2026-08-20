package gd.safety.Quiz.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import gd.safety.Quiz.config.GameSessionProperties;
import gd.safety.Quiz.config.QuizCatalogProperties;
import gd.safety.Quiz.config.SnapshotProperties;
import gd.safety.Quiz.persistence.SqliteSnapshotRepository;
import gd.safety.Quiz.quiz.catalog.QuizCatalog;
import gd.safety.Quiz.quiz.catalog.QuizDefinitionValidator;
import gd.safety.Quiz.quiz.catalog.QuizYamlParser;
import gd.safety.Quiz.session.GameSessionRegistry.PlayerConnection;
import gd.safety.Quiz.session.GameSessionRegistry.ReconnectRejectedException;
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
		return new GameSessionRegistry(
				new GameSessionProperties(URI.create("https://quiz.example.test"), 10),
				catalog,
				new GameStateMachine(),
				repository);
	}
}

