package org.dev.quizzle.session;

import org.springframework.stereotype.Component;

@Component
public final class GameStateMachine {

	public Transition apply(GameSessionSnapshot session, GameCommand command, long nowEpochMs) {
		if (command == GameCommand.ABORT && session.state() != GameState.CLOSED) {
			return new Transition(GameState.CLOSED, session.currentQuestionIndex(), 0, false);
		}

		return switch (session.state()) {
			case LOBBY -> command == GameCommand.START
					? new Transition(GameState.QUESTION_OPEN, 0, nowEpochMs, false)
					: rejected(session, command);
			case QUESTION_OPEN -> command == GameCommand.REVEAL || command == GameCommand.END_EARLY
					? new Transition(GameState.RESULTS, session.currentQuestionIndex(),
							session.serverStartEpochMs(), false)
					: rejected(session, command);
			case RESULTS -> command == GameCommand.NEXT
					? advanceAfterResults(session, nowEpochMs)
					: rejected(session, command);
			case LEADERBOARD -> command == GameCommand.NEXT
					? new Transition(GameState.QUESTION_OPEN,
							session.currentQuestionIndex() + 1, nowEpochMs, false)
					: rejected(session, command);
			case FINAL_RESULTS -> switch (command) {
				case OPEN_PODIUM -> new Transition(GameState.FINAL_RESULTS,
						session.currentQuestionIndex(), 0, true);
				case CLOSE -> new Transition(GameState.CLOSED,
						session.currentQuestionIndex(), 0, session.podiumOpen());
				default -> rejected(session, command);
			};
			case CLOSED -> rejected(session, command);
		};
	}

	// The leaderboard is only worth showing when another question follows it, and only when the
	// presenter enabled the mid-quiz leaderboard in the lobby. Otherwise the next question opens directly.
	private Transition advanceAfterResults(GameSessionSnapshot session, long nowEpochMs) {
		int nextQuestionIndex = session.currentQuestionIndex() + 1;
		if (nextQuestionIndex >= session.quiz().questions().size()) {
			return new Transition(GameState.FINAL_RESULTS, session.currentQuestionIndex(), 0, true);
		}
		if (session.leaderboardEnabled()) {
			return new Transition(GameState.LEADERBOARD, session.currentQuestionIndex(), 0, false);
		}
		return new Transition(GameState.QUESTION_OPEN, nextQuestionIndex, nowEpochMs, false);
	}

	private Transition rejected(GameSessionSnapshot session, GameCommand command) {
		throw new InvalidGameTransitionException(session.state(), command);
	}

	public record Transition(
			GameState state,
			int currentQuestionIndex,
			long serverStartEpochMs,
			boolean podiumOpen) {
	}
}
