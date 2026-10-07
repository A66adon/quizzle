package org.dev.quizzle.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.dev.quizzle.session.GameState;
import org.junit.jupiter.api.Test;

import org.dev.quizzle.session.ConnectionStatus;
import org.dev.quizzle.session.GameCommand;
import org.dev.quizzle.session.GameSessionSnapshot;
import org.dev.quizzle.session.GameSessionSnapshot.PlayerSnapshot;
import org.dev.quizzle.session.GameSessionSnapshot.SubmittedAnswerSnapshot;
import org.dev.quizzle.session.GameStateMachine;
import org.dev.quizzle.session.SessionTestFixtures;

@org.springframework.boot.test.context.SpringBootTest(properties = "quiz.snapshot.interval-ms=3600000")
class PostgresSnapshotRepositoryTests extends PostgresIntegrationSupport {
	@org.springframework.beans.factory.annotation.Autowired
	PostgresSnapshotRepository repository;
	@org.springframework.beans.factory.annotation.Autowired
	org.springframework.jdbc.core.JdbcTemplate jdbc;

	@org.junit.jupiter.api.BeforeEach
	void prepareOwner() {
		jdbc.update("DELETE FROM accounts");
		jdbc.update("INSERT INTO accounts(id,email,normalized_email,status) VALUES (?,'snapshot@test','snapshot@test','ACTIVE')",
				UUID.fromString(SessionTestFixtures.OWNER_ACCOUNT_ID));
	}

	@Test
	void roundTripsTheCompleteSnapshotAndReplacesItOnStateChange() {
		UUID playerId = UUID.randomUUID();
		GameSessionSnapshot lobby = new GameSessionSnapshot(
				"RoundTrip25",
				SessionTestFixtures.OWNER_ACCOUNT_ID,
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
	void rejectsUnsupportedOrMismatchedSnapshotsRatherThanSilentlyDiscardingData() throws Exception {
		GameSessionSnapshot valid = SessionTestFixtures.lobbySnapshot("Working235", 1_000);
		repository.save(valid);

		jdbc.update("UPDATE session_snapshots SET schema_version=1 WHERE codehash=?", valid.codehash());
		org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, repository::loadAll);
		jdbc.update("UPDATE session_snapshots SET schema_version=2, codehash='Mismatch235' WHERE codehash=?", valid.codehash());
		org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class, repository::loadAll);
	}
}
