package gd.safety.Quiz.websocket;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;

import gd.safety.Quiz.session.ConnectionStatus;
import gd.safety.Quiz.session.GameSessionRegistry.PlayerConnection;
import gd.safety.Quiz.session.GameSessionRegistry.AnswerSubmissionResult;
import gd.safety.Quiz.session.GameSessionSnapshot;
import gd.safety.Quiz.session.GameSessionSnapshot.PlayerSnapshot;
import gd.safety.Quiz.quiz.model.QuestionDefinition;
import tools.jackson.databind.ObjectMapper;

@Component
public final class WebSocketProtocol {

	private final ObjectMapper objectMapper;

	public WebSocketProtocol(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public JoinRequest parseJoin(String json) {
		ClientMessage message = parseClientMessage(json);
		if (message == null || !"JOIN".equals(message.type())) {
			throw new ProtocolException("JOIN_REQUIRED", "The first message must be JOIN.");
		}

		boolean hasName = message.name() != null && !message.name().isBlank();
		boolean hasToken = message.reconnectToken() != null && !message.reconnectToken().isBlank();
		if (hasName == hasToken) {
			throw new ProtocolException(
					"INVALID_JOIN", "JOIN must contain either a name or a reconnectToken, but not both.");
		}
		if (hasToken) {
			try {
				return new JoinRequest(null, UUID.fromString(message.reconnectToken()));
			} catch (IllegalArgumentException exception) {
				throw new ProtocolException(
						"RECONNECT_TOKEN_INVALID", "The reconnect token is not a valid UUID.");
			}
		}
		return new JoinRequest(message.name(), null);
	}

	public AnswerRequest parseAnswer(String json) {
		ClientMessage message = parseClientMessage(json);
		if (!"ANSWER".equals(message.type())) {
			throw new ProtocolException("UNSUPPORTED_MESSAGE", "Only ANSWER is accepted after joining.");
		}
		if (message.questionId() == null || message.questionId().isBlank()
				|| message.questionId().length() > 80) {
			throw new ProtocolException("INVALID_ANSWER", "A valid questionId is required.");
		}
		Set<String> answerIds;
		try {
			answerIds = message.answerIds() == null ? Set.of() : Set.copyOf(message.answerIds());
		} catch (RuntimeException exception) {
			throw new ProtocolException("INVALID_ANSWER", "answerIds must contain valid option IDs.");
		}
		if (answerIds.size() > 64 || answerIds.stream().anyMatch(
				answerId -> answerId == null || answerId.isBlank() || answerId.length() > 80)) {
			throw new ProtocolException("INVALID_ANSWER", "answerIds contains an invalid option ID.");
		}
		return new AnswerRequest(message.questionId(), answerIds);
	}

	public String joined(PlayerConnection connection, boolean reconnected) {
		return write(new ServerMessage(
				"JOINED",
				new JoinPayload(
						ParticipantView.from(connection.player()),
						connection.player().reconnectToken(),
						reconnected,
						System.currentTimeMillis(),
						connection.session().answers().stream()
								.filter(answer -> answer.playerId().equals(connection.player().playerId()))
								.map(answer -> new OwnAnswerView(answer.questionId(), answer.answerIds()))
								.toList(),
						SessionView.from(connection.session()))));
	}

	public String state(GameSessionSnapshot snapshot) {
		return write(new ServerMessage("STATE", SessionView.from(snapshot)));
	}

	public String answerAccepted(AnswerSubmissionResult result) {
		return write(new ServerMessage("ANSWER_ACCEPTED", new AnswerAcceptedPayload(
				result.answer().questionId(), result.receivedAnswerCount())));
	}

	public String error(String code, String message, boolean retryable) {
		return write(new ServerMessage("ERROR", new ErrorPayload(code, message, retryable)));
	}

	private String write(Object message) {
		try {
			return objectMapper.writeValueAsString(message);
		} catch (RuntimeException exception) {
			throw new IllegalStateException("Could not serialize a WebSocket message", exception);
		}
	}

	private ClientMessage parseClientMessage(String json) {
		try {
			return objectMapper.readValue(json, ClientMessage.class);
		} catch (RuntimeException exception) {
			throw new ProtocolException("INVALID_MESSAGE", "The message is not valid JSON.");
		}
	}

	private record ClientMessage(
			String type,
			String name,
			String reconnectToken,
			String questionId,
			Set<String> answerIds) {
	}

	public record JoinRequest(String name, UUID reconnectToken) {

		public boolean isReconnect() {
			return reconnectToken != null;
		}
	}

	public record AnswerRequest(String questionId, Set<String> answerIds) {
	}

	private record ServerMessage(String type, Object payload) {
	}

	private record JoinPayload(
			ParticipantView participant,
			UUID reconnectToken,
			boolean reconnected,
			long serverEpochMs,
			List<OwnAnswerView> answeredQuestions,
			SessionView session) {
	}

	private record OwnAnswerView(String questionId, Set<String> answerIds) {
	}

	private record ErrorPayload(String code, String message, boolean retryable) {
	}

	private record AnswerAcceptedPayload(String questionId, long receivedAnswerCount) {
	}

	public record SessionView(
			String codehash,
			String state,
			String quizTitle,
			String quizDescription,
			int currentQuestionIndex,
			long serverStartEpochMs,
			long durationMs,
			long receivedAnswerCount,
			QuestionView question,
			ResultsView results,
			List<ParticipantView> participants,
			List<StandingView> standings) {

		static SessionView from(GameSessionSnapshot snapshot) {
			long durationMs = snapshot.currentQuestionIndex() < 0
					? 0
					: snapshot.quiz().questions().get(snapshot.currentQuestionIndex()).timeSeconds() * 1_000L;
			List<ParticipantView> participants = snapshot.players().stream()
					.filter(player -> player.connectionStatus() != ConnectionStatus.KICKED)
					.map(ParticipantView::from)
					.toList();
			QuestionDefinition currentQuestion = snapshot.currentQuestionIndex() < 0
					? null
					: snapshot.quiz().questions().get(snapshot.currentQuestionIndex());
			long receivedAnswerCount = currentQuestion == null ? 0 : snapshot.answers().stream()
					.filter(answer -> answer.questionId().equals(currentQuestion.id()))
					.count();
			return new SessionView(
					snapshot.codehash(),
					snapshot.state().name(),
					snapshot.quiz().title(),
					snapshot.quiz().description(),
					snapshot.currentQuestionIndex(),
					snapshot.serverStartEpochMs(),
					durationMs,
					receivedAnswerCount,
					currentQuestion == null ? null : QuestionView.from(currentQuestion),
					snapshot.state() == gd.safety.Quiz.session.GameState.RESULTS
							? ResultsView.from(snapshot, currentQuestion) : null,
					participants,
					snapshot.state() == gd.safety.Quiz.session.GameState.FINAL_RESULTS
							? StandingView.from(snapshot) : List.of());
		}
	}

	public record QuestionView(
			String id,
			String text,
			int maximumPoints,
			long durationMs,
			boolean multiple,
			List<AnswerOptionView> answers) {

		static QuestionView from(QuestionDefinition question) {
			return new QuestionView(
					question.id(),
					question.text(),
					question.points(),
					question.timeSeconds() * 1_000L,
					question.multiple(),
					question.answers().stream()
							.map(answer -> new AnswerOptionView(answer.id(), answer.text()))
							.toList());
		}
	}

	public record AnswerOptionView(String id, String text) {
	}

	public record ResultsView(String questionId, List<OptionResultView> options) {

		static ResultsView from(GameSessionSnapshot snapshot, QuestionDefinition question) {
			List<OptionResultView> options = question.answers().stream()
					.map(option -> new OptionResultView(
							option.id(),
							option.text(),
							option.correct(),
							snapshot.answers().stream()
									.filter(answer -> answer.questionId().equals(question.id()))
									.filter(answer -> answer.answerIds().contains(option.id()))
									.count()))
					.toList();
			return new ResultsView(question.id(), options);
		}
	}

	public record OptionResultView(String answerId, String text, boolean correct, long voteCount) {
	}

	public record StandingView(
			int rank,
			UUID playerId,
			String name,
			double totalPoints,
			long cumulativeCorrectElapsedMs) {

		static List<StandingView> from(GameSessionSnapshot snapshot) {
			List<PlayerSnapshot> ordered = snapshot.players().stream()
					.sorted(java.util.Comparator.comparingDouble(PlayerSnapshot::totalPoints).reversed()
							.thenComparingLong(PlayerSnapshot::cumulativeCorrectElapsedMs)
							.thenComparing(player -> player.fastestAnswerElapsedMs() == null
									? Long.MAX_VALUE : player.fastestAnswerElapsedMs())
							.thenComparing(player -> player.playerId().toString()))
					.toList();
			java.util.ArrayList<StandingView> standings = new java.util.ArrayList<>(ordered.size());
			for (int index = 0; index < ordered.size(); index++) {
				PlayerSnapshot player = ordered.get(index);
				standings.add(new StandingView(
						index + 1,
						player.playerId(),
						player.name(),
						player.totalPoints(),
						player.cumulativeCorrectElapsedMs()));
			}
			return List.copyOf(standings);
		}
	}

	public record ParticipantView(
			UUID playerId,
			String name,
			String avatarStyle,
			String avatarUrl,
			String connectionStatus) {

		static ParticipantView from(PlayerSnapshot player) {
			return new ParticipantView(
					player.playerId(),
					player.name(),
					player.avatarStyle(),
					"https://api.dicebear.com/9.x/" + player.avatarStyle()
							+ "/svg?seed=" + player.playerId(),
					player.connectionStatus().name());
		}
	}

	public static final class ProtocolException extends RuntimeException {

		private final String code;

		public ProtocolException(String code, String message) {
			super(message);
			this.code = code;
		}

		public String code() {
			return code;
		}
	}
}




