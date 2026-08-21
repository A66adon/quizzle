package gd.safety.Quiz.session;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import gd.safety.Quiz.quiz.model.QuizDefinition;

public record GameSessionSnapshot(
		String codehash,
		String quizFileName,
		QuizDefinition quiz,
		GameState state,
		int currentQuestionIndex,
		long serverStartEpochMs,
		boolean podiumOpen,
		long createdAtEpochMs,
		long updatedAtEpochMs,
		List<PlayerSnapshot> players,
		List<SubmittedAnswerSnapshot> answers) {

	public GameSessionSnapshot {
		Objects.requireNonNull(codehash, "codehash is required");
		Objects.requireNonNull(quizFileName, "quizFileName is required");
		Objects.requireNonNull(quiz, "quiz is required");
		Objects.requireNonNull(state, "state is required");
		if (!codehash.matches("[A-Za-z0-9_-]{8,32}")) {
			throw new IllegalArgumentException("codehash has an invalid format");
		}
		if (currentQuestionIndex < -1 || currentQuestionIndex >= quiz.questions().size()) {
			throw new IllegalArgumentException("currentQuestionIndex is outside the quiz");
		}
		if ((state == GameState.QUESTION_OPEN || state == GameState.RESULTS
				|| state == GameState.LEADERBOARD || state == GameState.FINAL_RESULTS)
				&& currentQuestionIndex < 0) {
			throw new IllegalArgumentException("active states require a current question");
		}
		if (state == GameState.QUESTION_OPEN && serverStartEpochMs <= 0) {
			throw new IllegalArgumentException("QUESTION_OPEN requires a positive serverStartEpochMs");
		}
		if (createdAtEpochMs <= 0 || updatedAtEpochMs < createdAtEpochMs) {
			throw new IllegalArgumentException("session timestamps are invalid");
		}
		players = players == null ? List.of() : List.copyOf(players);
		answers = answers == null ? List.of() : List.copyOf(answers);
	}

	public static GameSessionSnapshot create(
			String codehash,
			String quizFileName,
			QuizDefinition quiz,
			long nowEpochMs) {
		return new GameSessionSnapshot(
				codehash,
				quizFileName,
				quiz,
				GameState.LOBBY,
				-1,
				0,
				false,
				nowEpochMs,
				nowEpochMs,
				List.of(),
				List.of());
	}

	public GameSessionSnapshot withTransition(GameStateMachine.Transition transition, long nowEpochMs) {
		return new GameSessionSnapshot(
				codehash,
				quizFileName,
				quiz,
				transition.state(),
				transition.currentQuestionIndex(),
				transition.serverStartEpochMs(),
				transition.podiumOpen(),
				createdAtEpochMs,
				nowEpochMs,
				players,
				answers);
	}

	public GameSessionSnapshot withPlayers(List<PlayerSnapshot> updatedPlayers, long nowEpochMs) {
		return new GameSessionSnapshot(
				codehash,
				quizFileName,
				quiz,
				state,
				currentQuestionIndex,
				serverStartEpochMs,
				podiumOpen,
				createdAtEpochMs,
				nowEpochMs,
				updatedPlayers,
				answers);
	}

	public GameSessionSnapshot withAcceptedAnswer(
			SubmittedAnswerSnapshot acceptedAnswer,
			List<PlayerSnapshot> updatedPlayers,
			long nowEpochMs) {
		List<SubmittedAnswerSnapshot> updatedAnswers = new java.util.ArrayList<>(answers);
		updatedAnswers.add(acceptedAnswer);
		return new GameSessionSnapshot(
				codehash,
				quizFileName,
				quiz,
				state,
				currentQuestionIndex,
				serverStartEpochMs,
				podiumOpen,
				createdAtEpochMs,
				nowEpochMs,
				updatedPlayers,
				updatedAnswers);
	}

	public GameSessionSnapshot prepareForRehydration(long nowEpochMs) {
		List<PlayerSnapshot> restoredPlayers = players.stream()
				.map(player -> player.connectionStatus() == ConnectionStatus.CONNECTED
						? player.withConnectionStatus(ConnectionStatus.TEMPORARILY_DISCONNECTED, nowEpochMs)
						: player)
				.toList();
		boolean refreshQuestionTimer = state == GameState.QUESTION_OPEN;
		if (!refreshQuestionTimer && restoredPlayers.equals(players)) {
			return this;
		}
		return new GameSessionSnapshot(
				codehash,
				quizFileName,
				quiz,
				state,
				currentQuestionIndex,
				refreshQuestionTimer ? nowEpochMs : serverStartEpochMs,
				podiumOpen,
				createdAtEpochMs,
				nowEpochMs,
				restoredPlayers,
				answers);
	}

	public record PlayerSnapshot(
			UUID playerId,
			UUID reconnectToken,
			String name,
			String avatarStyle,
			ConnectionStatus connectionStatus,
			double totalPoints,
			long cumulativeCorrectElapsedMs,
			Long fastestAnswerElapsedMs,
			long disconnectedAtEpochMs) {

		public PlayerSnapshot {
			Objects.requireNonNull(playerId, "playerId is required");
			Objects.requireNonNull(reconnectToken, "reconnectToken is required");
			Objects.requireNonNull(name, "name is required");
			Objects.requireNonNull(avatarStyle, "avatarStyle is required");
			Objects.requireNonNull(connectionStatus, "connectionStatus is required");
		}

		public PlayerSnapshot withConnectionStatus(ConnectionStatus status, long disconnectedAtEpochMs) {
			return new PlayerSnapshot(
					playerId,
					reconnectToken,
					name,
					avatarStyle,
					status,
					totalPoints,
					cumulativeCorrectElapsedMs,
					fastestAnswerElapsedMs,
					disconnectedAtEpochMs);
		}

		public PlayerSnapshot withCorrectAnswer(double awardedPoints, long elapsedMs) {
			long fastestElapsedMs = fastestAnswerElapsedMs == null
					? elapsedMs
					: Math.min(fastestAnswerElapsedMs, elapsedMs);
			return new PlayerSnapshot(
					playerId,
					reconnectToken,
					name,
					avatarStyle,
					connectionStatus,
					totalPoints + awardedPoints,
					cumulativeCorrectElapsedMs + elapsedMs,
					fastestElapsedMs,
					disconnectedAtEpochMs);
		}
	}

	public record SubmittedAnswerSnapshot(
			UUID playerId,
			String questionId,
			Set<String> answerIds,
			long serverReceivedAtEpochMs,
			long elapsedMs,
			boolean fullyCorrect,
			double awardedPoints) {

		public SubmittedAnswerSnapshot {
			Objects.requireNonNull(playerId, "playerId is required");
			Objects.requireNonNull(questionId, "questionId is required");
			answerIds = answerIds == null ? Set.of() : Set.copyOf(answerIds);
		}
	}
}



