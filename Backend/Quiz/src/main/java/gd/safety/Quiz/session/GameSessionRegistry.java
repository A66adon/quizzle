package gd.safety.Quiz.session;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import gd.safety.Quiz.config.GameSessionProperties;
import gd.safety.Quiz.persistence.SqliteSnapshotRepository;
import gd.safety.Quiz.quiz.catalog.LoadedQuiz;
import gd.safety.Quiz.quiz.catalog.QuizCatalog;
import gd.safety.Quiz.quiz.model.QuestionDefinition;
import gd.safety.Quiz.session.AnswerGradingService.Grade;
import gd.safety.Quiz.session.AnswerGradingService.InvalidAnswerSelectionException;
import gd.safety.Quiz.session.GameSessionSnapshot.PlayerSnapshot;
import gd.safety.Quiz.session.GameSessionSnapshot.SubmittedAnswerSnapshot;
import jakarta.annotation.PostConstruct;

@Component
public final class GameSessionRegistry {

	private static final Logger LOGGER = LoggerFactory.getLogger(GameSessionRegistry.class);
	private static final char[] CODEHASH_ALPHABET =
			"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789".toCharArray();
	private static final int MAX_CODEHASH_ATTEMPTS = 100;

	private final Map<String, GameSessionAggregate> sessions = new ConcurrentHashMap<>();
	private final SecureRandom secureRandom = new SecureRandom();
	private final int codehashLength;
	private final QuizCatalog quizCatalog;
	private final GameStateMachine stateMachine;
	private final AnswerGradingService gradingService;
	private final SqliteSnapshotRepository snapshotRepository;

	public GameSessionRegistry(
			GameSessionProperties properties,
			QuizCatalog quizCatalog,
			GameStateMachine stateMachine,
			SqliteSnapshotRepository snapshotRepository) {
		this.codehashLength = properties.codehashLength();
		this.quizCatalog = quizCatalog;
		this.stateMachine = stateMachine;
		this.gradingService = new AnswerGradingService();
		this.snapshotRepository = snapshotRepository;
	}

	@PostConstruct
	public void rehydrate() {
		long nowEpochMs = System.currentTimeMillis();
		int restoredCount = 0;
		for (GameSessionSnapshot storedSnapshot : snapshotRepository.loadAll()) {
			GameSessionSnapshot restoredSnapshot = storedSnapshot.prepareForRehydration(nowEpochMs);
			GameSessionAggregate previous = sessions.putIfAbsent(
					restoredSnapshot.codehash(), new GameSessionAggregate(restoredSnapshot));
			if (previous != null) {
				LOGGER.warn("Skipped duplicate restored session: {}", restoredSnapshot.codehash());
				continue;
			}
			if (restoredSnapshot != storedSnapshot) {
				snapshotRepository.save(restoredSnapshot);
			}
			restoredCount++;
		}
		LOGGER.info("Session registry ready: {} restored", restoredCount);
	}

	public GameSessionSnapshot create(String quizFileName) {
		LoadedQuiz loadedQuiz = quizCatalog.findByFileName(quizFileName)
				.orElseThrow(() -> new QuizNotFoundException(quizFileName));

		for (int attempt = 0; attempt < MAX_CODEHASH_ATTEMPTS; attempt++) {
			String codehash = generateCodehash();
			long nowEpochMs = System.currentTimeMillis();
			GameSessionSnapshot snapshot = GameSessionSnapshot.create(
					codehash, loadedQuiz.fileName(), loadedQuiz.quiz(), nowEpochMs);
			GameSessionAggregate aggregate = new GameSessionAggregate(snapshot);
			if (sessions.putIfAbsent(codehash, aggregate) != null) {
				continue;
			}
			try {
				snapshotRepository.save(snapshot);
				return snapshot;
			} catch (RuntimeException exception) {
				sessions.remove(codehash, aggregate);
				throw exception;
			}
		}
		throw new IllegalStateException("Could not allocate a unique session codehash");
	}

	public GameSessionSnapshot transition(String codehash, GameCommand command) {
		GameSessionAggregate aggregate = requireAggregate(codehash);
		long nowEpochMs = System.currentTimeMillis();
		try {
			return aggregate.update(
					current -> current.withTransition(stateMachine.apply(current, command, nowEpochMs), nowEpochMs),
					snapshotRepository::save);
		} catch (InvalidGameTransitionException exception) {
			LOGGER.warn("Rejected session command: codehash={}, command={}", codehash, command);
			throw exception;
		}
	}

	public AnswerSubmissionResult submitAnswer(
			String codehash,
			UUID playerId,
			String questionId,
			Set<String> selectedAnswerIds,
			long serverReceivedAtEpochMs,
			boolean receivedWhileQuestionOpen) {
		GameSessionAggregate aggregate = requireAggregate(codehash);
		Set<String> submittedIds = selectedAnswerIds == null ? Set.of() : Set.copyOf(selectedAnswerIds);
		AtomicReference<SubmittedAnswerSnapshot> acceptedAnswer = new AtomicReference<>();
		GameSessionSnapshot updated = aggregate.updateInMemory(current -> {
			boolean revealRacedWithTimelyAnswer = receivedWhileQuestionOpen
					&& current.state() == GameState.RESULTS;
			if (current.state() != GameState.QUESTION_OPEN && !revealRacedWithTimelyAnswer) {
				throw new AnswerRejectedException("ANSWER_CLOSED", "Answers are not accepted right now.");
			}
			QuestionDefinition question = current.quiz().questions().get(current.currentQuestionIndex());
			if (!question.id().equals(questionId)) {
				throw new AnswerRejectedException("QUESTION_MISMATCH", "The answer is not for the open question.");
			}
			long durationMs = question.timeSeconds() * 1_000L;
			long elapsedMs = Math.max(0, serverReceivedAtEpochMs - current.serverStartEpochMs());
			if (elapsedMs >= durationMs) {
				throw new AnswerRejectedException("ANSWER_TOO_LATE", "The answer arrived after the deadline.");
			}
			boolean duplicate = current.answers().stream().anyMatch(answer ->
					answer.playerId().equals(playerId) && answer.questionId().equals(questionId));
			if (duplicate) {
				throw new AnswerRejectedException("DUPLICATE_ANSWER", "Only the first answer counts.");
			}

			List<PlayerSnapshot> players = new ArrayList<>(current.players());
			int playerIndex = findPlayerIndexById(players, playerId);
			if (playerIndex < 0 || players.get(playerIndex).connectionStatus() != ConnectionStatus.CONNECTED) {
				throw new AnswerRejectedException("PLAYER_NOT_CONNECTED", "The participant is not connected.");
			}
			Grade grade;
			try {
				grade = gradingService.grade(question, submittedIds, elapsedMs);
			} catch (InvalidAnswerSelectionException exception) {
				throw new AnswerRejectedException("INVALID_ANSWER", exception.getMessage());
			}
			if (grade.fullyCorrect()) {
				players.set(playerIndex, players.get(playerIndex).withCorrectAnswer(
						grade.awardedPoints(), elapsedMs));
			}
			SubmittedAnswerSnapshot answer = new SubmittedAnswerSnapshot(
					playerId,
					questionId,
					submittedIds,
					serverReceivedAtEpochMs,
					elapsedMs,
					grade.fullyCorrect(),
					grade.awardedPoints());
			acceptedAnswer.set(answer);
			return current.withAcceptedAnswer(answer, players, serverReceivedAtEpochMs);
		});
		long receivedAnswerCount = updated.answers().stream()
				.filter(answer -> answer.questionId().equals(questionId))
				.count();
		return new AnswerSubmissionResult(updated, acceptedAnswer.get(), receivedAnswerCount);
	}

	public List<GameSessionSnapshot> transitionExpiredQuestions(long nowEpochMs) {
		List<GameSessionSnapshot> transitioned = new ArrayList<>();
		for (GameSessionAggregate aggregate : sessions.values()) {
			GameSessionSnapshot before = aggregate.snapshot();
			GameSessionSnapshot after = aggregate.update(current -> {
				if (current.state() != GameState.QUESTION_OPEN) {
					return current;
				}
				QuestionDefinition question = current.quiz().questions().get(current.currentQuestionIndex());
				long deadlineEpochMs = current.serverStartEpochMs() + question.timeSeconds() * 1_000L;
				if (nowEpochMs < deadlineEpochMs) {
					return current;
				}
				return current.withTransition(stateMachine.apply(current, GameCommand.REVEAL, nowEpochMs), nowEpochMs);
			}, snapshotRepository::save);
			if (after != before) {
				transitioned.add(after);
			}
		}
		return List.copyOf(transitioned);
	}

	public PlayerConnection joinPlayer(String codehash, String name) {
		GameSessionAggregate aggregate = requireAggregate(codehash);
		long nowEpochMs = System.currentTimeMillis();
		UUID playerId = UUID.randomUUID();
		UUID reconnectToken = UUID.randomUUID();
		GameSessionSnapshot updated = aggregate.update(current -> {
			if (current.state() != GameState.LOBBY) {
				throw new JoinNotAllowedException(current.state());
			}
			List<PlayerSnapshot> players = new ArrayList<>(current.players());
			players.add(new PlayerSnapshot(
					playerId,
					reconnectToken,
					name,
					"bottts-neutral",
					ConnectionStatus.CONNECTED,
					0,
					0,
					null,
					0));
			return current.withPlayers(players, nowEpochMs);
		}, snapshotRepository::save);
		return new PlayerConnection(updated, findPlayerByToken(updated, reconnectToken));
	}

	public PlayerConnection reconnectPlayer(String codehash, UUID reconnectToken) {
		GameSessionAggregate aggregate = requireAggregate(codehash);
		long nowEpochMs = System.currentTimeMillis();
		GameSessionSnapshot updated = aggregate.update(current -> {
			if (current.state() == GameState.CLOSED) {
				throw new ReconnectRejectedException("SESSION_CLOSED", "This quiz session is closed.");
			}
			List<PlayerSnapshot> players = new ArrayList<>(current.players());
			int playerIndex = findPlayerIndexByToken(players, reconnectToken);
			if (playerIndex < 0) {
				throw new ReconnectRejectedException(
						"RECONNECT_TOKEN_INVALID", "The saved reconnect token is not valid for this session.");
			}
			PlayerSnapshot player = players.get(playerIndex);
			if (player.connectionStatus() == ConnectionStatus.KICKED) {
				throw new ReconnectRejectedException("PLAYER_KICKED", "You were removed from this quiz.");
			}
			if (player.connectionStatus() == ConnectionStatus.EXPIRED) {
				throw new ReconnectRejectedException(
						"RECONNECT_EXPIRED", "The reconnect grace period has expired.");
			}
			players.set(playerIndex, player.withConnectionStatus(ConnectionStatus.CONNECTED, 0));
			return current.withPlayers(players, nowEpochMs);
		}, snapshotRepository::save);
		return new PlayerConnection(updated, findPlayerByToken(updated, reconnectToken));
	}

	public Optional<GameSessionSnapshot> disconnectPlayer(String codehash, UUID playerId) {
		GameSessionAggregate aggregate = sessions.get(codehash);
		if (aggregate == null) {
			return Optional.empty();
		}
		long nowEpochMs = System.currentTimeMillis();
		GameSessionSnapshot updated = aggregate.update(current -> {
			List<PlayerSnapshot> players = new ArrayList<>(current.players());
			int playerIndex = findPlayerIndexById(players, playerId);
			if (playerIndex < 0 || players.get(playerIndex).connectionStatus() != ConnectionStatus.CONNECTED) {
				return current;
			}
			players.set(playerIndex, players.get(playerIndex).withConnectionStatus(
					ConnectionStatus.TEMPORARILY_DISCONNECTED, nowEpochMs));
			return current.withPlayers(players, nowEpochMs);
		}, snapshotRepository::save);
		return Optional.of(updated);
	}

	public List<String> expireDisconnectedPlayers(long nowEpochMs, long disconnectGraceMs) {
		List<String> changedSessions = new ArrayList<>();
		for (Map.Entry<String, GameSessionAggregate> entry : sessions.entrySet()) {
			GameSessionAggregate aggregate = entry.getValue();
			GameSessionSnapshot before = aggregate.snapshot();
			GameSessionSnapshot after = aggregate.update(current -> {
				List<PlayerSnapshot> players = new ArrayList<>(current.players());
				boolean changed = false;
				for (int index = 0; index < players.size(); index++) {
					PlayerSnapshot player = players.get(index);
					if (player.connectionStatus() == ConnectionStatus.TEMPORARILY_DISCONNECTED
							&& nowEpochMs - player.disconnectedAtEpochMs() >= disconnectGraceMs) {
						players.set(index, player.withConnectionStatus(
								ConnectionStatus.EXPIRED, player.disconnectedAtEpochMs()));
						changed = true;
					}
				}
				return changed ? current.withPlayers(players, nowEpochMs) : current;
			}, snapshotRepository::save);
			if (after != before) {
				changedSessions.add(entry.getKey());
			}
		}
		return List.copyOf(changedSessions);
	}

	public Optional<GameSessionSnapshot> find(String codehash) {
		GameSessionAggregate aggregate = sessions.get(codehash);
		return aggregate == null ? Optional.empty() : Optional.of(aggregate.snapshot());
	}

	public List<GameSessionSnapshot> list() {
		return sessions.values().stream()
				.map(GameSessionAggregate::snapshot)
				.sorted(Comparator.comparingLong(GameSessionSnapshot::createdAtEpochMs).reversed())
				.toList();
	}

	@Scheduled(fixedDelayString = "${quiz.snapshot.interval-ms}")
	public void snapshotPeriodically() {
		for (GameSessionAggregate aggregate : sessions.values()) {
			try {
				aggregate.persistCurrent(snapshotRepository::save);
			} catch (RuntimeException exception) {
				LOGGER.error("Periodic session snapshot failed: {}", aggregate.snapshot().codehash(), exception);
			}
		}
	}

	private GameSessionAggregate requireAggregate(String codehash) {
		GameSessionAggregate aggregate = sessions.get(codehash);
		if (aggregate == null) {
			throw new SessionNotFoundException(codehash);
		}
		return aggregate;
	}

	private PlayerSnapshot findPlayerByToken(GameSessionSnapshot snapshot, UUID reconnectToken) {
		return snapshot.players().stream()
				.filter(player -> player.reconnectToken().equals(reconnectToken))
				.findFirst()
				.orElseThrow();
	}

	private int findPlayerIndexByToken(List<PlayerSnapshot> players, UUID reconnectToken) {
		for (int index = 0; index < players.size(); index++) {
			if (players.get(index).reconnectToken().equals(reconnectToken)) {
				return index;
			}
		}
		return -1;
	}

	private int findPlayerIndexById(List<PlayerSnapshot> players, UUID playerId) {
		for (int index = 0; index < players.size(); index++) {
			if (players.get(index).playerId().equals(playerId)) {
				return index;
			}
		}
		return -1;
	}

	private String generateCodehash() {
		char[] codehash = new char[codehashLength];
		for (int index = 0; index < codehash.length; index++) {
			codehash[index] = CODEHASH_ALPHABET[secureRandom.nextInt(CODEHASH_ALPHABET.length)];
		}
		return new String(codehash);
	}

	public static final class QuizNotFoundException extends RuntimeException {

		public QuizNotFoundException(String quizFileName) {
			super("No validated quiz exists for file " + quizFileName);
		}
	}

	public static final class SessionNotFoundException extends RuntimeException {

		public SessionNotFoundException(String codehash) {
			super("No session exists for codehash " + codehash);
		}
	}

	public record PlayerConnection(GameSessionSnapshot session, PlayerSnapshot player) {
	}

	public record AnswerSubmissionResult(
			GameSessionSnapshot session,
			SubmittedAnswerSnapshot answer,
			long receivedAnswerCount) {
	}

	public static final class AnswerRejectedException extends RuntimeException {

		private final String errorCode;

		public AnswerRejectedException(String errorCode, String clientMessage) {
			super(clientMessage);
			this.errorCode = errorCode;
		}

		public String errorCode() {
			return errorCode;
		}
	}

	public static final class JoinNotAllowedException extends RuntimeException {

		private final GameState state;

		public JoinNotAllowedException(GameState state) {
			super("New players cannot join while the session is " + state);
			this.state = state;
		}

		public GameState state() {
			return state;
		}
	}

	public static final class ReconnectRejectedException extends RuntimeException {

		private final String errorCode;
		private final String clientMessage;

		public ReconnectRejectedException(String errorCode, String clientMessage) {
			super(errorCode);
			this.errorCode = errorCode;
			this.clientMessage = clientMessage;
		}

		public String errorCode() {
			return errorCode;
		}

		public String clientMessage() {
			return clientMessage;
		}
	}
}




