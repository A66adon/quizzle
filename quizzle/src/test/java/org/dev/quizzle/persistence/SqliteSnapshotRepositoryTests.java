package org.dev.quizzle.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.dev.quizzle.session.GameState;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import org.dev.quizzle.config.SnapshotProperties;
import org.dev.quizzle.session.ConnectionStatus;
import org.dev.quizzle.session.GameCommand;
import org.dev.quizzle.session.GameSessionSnapshot;
import org.dev.quizzle.session.GameSessionSnapshot.PlayerSnapshot;
import org.dev.quizzle.session.GameSessionSnapshot.SubmittedAnswerSnapshot;
import org.dev.quizzle.session.GameStateMachine;
import org.dev.quizzle.session.SessionTestFixtures;
import tools.jackson.databind.json.JsonMapper;

class SqliteSnapshotRepositoryTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void roundTripsTheCompleteSnapshotAndReplacesItOnStateChange() {
		SqliteSnapshotRepository repository = createRepository();
		UUID playerId = UUID.randomUUID();
		GameSessionSnapshot lobby = new GameSessionSnapshot(
				"RoundTrip25",
				"safety.yaml",
				SessionTestFixtures.quiz(),
				GameState.LOBBY,
				-1,
				0,
				false,
				1_000,
				1_000,
				List.of(new PlayerSnapshot(
						playerId,
						UUID.randomUUID(),
						"Alex",
						"bottts",
						ConnectionStatus.TEMPORARILY_DISCONNECTED,
						850,
						1_234,
						1_234L,
						2_000)),
				List.of(new SubmittedAnswerSnapshot(
						playerId,
						"q1",
						Set.of("a1"),
						2_234,
						1_234,
						true,
						850)),
				true);

		repository.save(lobby);
		assertEquals(lobby, repository.loadAll().getFirst());

		GameStateMachine stateMachine = new GameStateMachine();
		GameSessionSnapshot open = lobby.withTransition(
				stateMachine.apply(lobby, GameCommand.START, 3_000), 3_000);
		repository.save(open);

		assertEquals(List.of(open), repository.loadAll());
	}

	@Test
	void skipsACorruptedRowWithoutBlockingWorkingSnapshots() throws Exception {
		SqliteSnapshotRepository repository = createRepository();
		GameSessionSnapshot valid = SessionTestFixtures.lobbySnapshot("Working235", 1_000);
		repository.save(valid);

		String jdbcUrl = "jdbc:sqlite:" + temporaryDirectory.resolve("snapshots.db")
				.toAbsolutePath().toString().replace('\\', '/');
		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				PreparedStatement statement = connection.prepareStatement("""
						INSERT INTO session_snapshots (
						    codehash, schema_version, state, current_question_index,
						    server_start_epoch_ms, updated_at_epoch_ms, payload_json
						) VALUES (?, 1, 'LOBBY', -1, 0, 1, ?)
						""")) {
			statement.setString(1, "BrokenRow25");
			statement.setString(2, "{not-json");
			statement.executeUpdate();
		}

		List<GameSessionSnapshot> restored = repository.loadAll();

		assertEquals(1, restored.size());
		assertEquals(valid, restored.getFirst());
		assertTrue(restored.stream().noneMatch(snapshot -> snapshot.codehash().equals("BrokenRow25")));
	}

	private SqliteSnapshotRepository createRepository() {
		SqliteSnapshotRepository repository = new SqliteSnapshotRepository(
				new SnapshotProperties(temporaryDirectory.resolve("snapshots.db"), 60_000, 5_000),
				JsonMapper.builder().build());
		repository.initialize();
		return repository;
	}
}
