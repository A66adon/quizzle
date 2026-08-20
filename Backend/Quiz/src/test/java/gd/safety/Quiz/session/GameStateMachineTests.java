package gd.safety.Quiz.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class GameStateMachineTests {

	private final GameStateMachine stateMachine = new GameStateMachine();

	@Test
	void followsTheCompleteAuthoritativeStateGraph() {
		GameSessionSnapshot session = SessionTestFixtures.lobbySnapshot("Abcdef2345", 1_000);

		session = transition(session, GameCommand.START, 2_000);
		assertEquals(GameState.QUESTION_OPEN, session.state());
		assertEquals(0, session.currentQuestionIndex());
		assertEquals(2_000, session.serverStartEpochMs());

		session = transition(session, GameCommand.REVEAL, 3_000);
		assertEquals(GameState.RESULTS, session.state());

		session = transition(session, GameCommand.NEXT, 4_000);
		assertEquals(GameState.QUESTION_OPEN, session.state());
		assertEquals(1, session.currentQuestionIndex());
		assertEquals(4_000, session.serverStartEpochMs());

		session = transition(session, GameCommand.END_EARLY, 5_000);
		session = transition(session, GameCommand.NEXT, 6_000);
		assertEquals(GameState.FINAL_RESULTS, session.state());
		assertFalse(session.podiumOpen());

		session = transition(session, GameCommand.OPEN_PODIUM, 7_000);
		assertTrue(session.podiumOpen());

		session = transition(session, GameCommand.CLOSE, 8_000);
		assertEquals(GameState.CLOSED, session.state());
	}

	@Test
	void abortClosesAnyNonClosedSession() {
		GameSessionSnapshot lobby = SessionTestFixtures.lobbySnapshot("Abcdef2345", 1_000);
		GameSessionSnapshot open = transition(lobby, GameCommand.START, 2_000);

		assertEquals(GameState.CLOSED, transition(lobby, GameCommand.ABORT, 3_000).state());
		assertEquals(GameState.CLOSED, transition(open, GameCommand.ABORT, 3_000).state());
	}

	@Test
	void rejectsCommandsOutsideTheirStatesWithoutChangingTheSnapshot() {
		GameSessionSnapshot lobby = SessionTestFixtures.lobbySnapshot("Abcdef2345", 1_000);

		assertThrows(InvalidGameTransitionException.class,
				() -> stateMachine.apply(lobby, GameCommand.NEXT, 2_000));
		assertEquals(GameState.LOBBY, lobby.state());

		GameSessionSnapshot open = transition(lobby, GameCommand.START, 2_000);
		assertThrows(InvalidGameTransitionException.class,
				() -> stateMachine.apply(open, GameCommand.START, 3_000));

		GameSessionSnapshot closed = transition(open, GameCommand.ABORT, 3_000);
		assertThrows(InvalidGameTransitionException.class,
				() -> stateMachine.apply(closed, GameCommand.ABORT, 4_000));
	}

	private GameSessionSnapshot transition(
			GameSessionSnapshot session,
			GameCommand command,
			long nowEpochMs) {
		return session.withTransition(stateMachine.apply(session, command, nowEpochMs), nowEpochMs);
	}
}
