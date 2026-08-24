package gd.safety.quizzle.websocket;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import gd.safety.quizzle.config.WebSocketProperties;
import gd.safety.quizzle.session.GameSessionRegistry;
import gd.safety.quizzle.session.GameSessionRegistry.AnswerRejectedException;
import gd.safety.quizzle.session.GameSessionRegistry.AnswerSubmissionResult;
import gd.safety.quizzle.session.GameSessionRegistry.JoinNotAllowedException;
import gd.safety.quizzle.session.GameSessionRegistry.PlayerConnection;
import gd.safety.quizzle.session.GameSessionRegistry.ReconnectRejectedException;
import gd.safety.quizzle.session.GameSessionSnapshot;
import gd.safety.quizzle.websocket.PlayerNamePolicy.InvalidPlayerNameException;
import gd.safety.quizzle.websocket.WebSocketConnectionHub.ClientConnection;
import gd.safety.quizzle.websocket.WebSocketConnectionHub.UnbindResult;
import gd.safety.quizzle.websocket.WebSocketProtocol.JoinRequest;
import gd.safety.quizzle.websocket.WebSocketProtocol.AnswerRequest;
import gd.safety.quizzle.websocket.WebSocketProtocol.ProtocolException;

@Component
public final class GameSessionWebSocketHandler extends AbstractWebSocketHandler {

	private static final Logger LOGGER = LoggerFactory.getLogger(GameSessionWebSocketHandler.class);
	private static final CloseStatus HEARTBEAT_TIMEOUT = new CloseStatus(4000, "Heartbeat timeout");
	private static final CloseStatus REPLACED_CONNECTION = new CloseStatus(4001, "Connection replaced");
	private static final CloseStatus FATAL_JOIN_ERROR = new CloseStatus(4002, "Join rejected");

	private final GameSessionRegistry sessionRegistry;
	private final WebSocketProtocol protocol;
	private final PlayerNamePolicy playerNamePolicy;
	private final WebSocketConnectionHub connectionHub;
	private final SessionRealtimePublisher realtimePublisher;
	private final WebSocketProperties properties;

	public GameSessionWebSocketHandler(
			GameSessionRegistry sessionRegistry,
			WebSocketProtocol protocol,
			PlayerNamePolicy playerNamePolicy,
			WebSocketConnectionHub connectionHub,
			SessionRealtimePublisher realtimePublisher,
			WebSocketProperties properties) {
		this.sessionRegistry = sessionRegistry;
		this.protocol = protocol;
		this.playerNamePolicy = playerNamePolicy;
		this.connectionHub = connectionHub;
		this.realtimePublisher = realtimePublisher;
		this.properties = properties;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws IOException {
		Object codehash = session.getAttributes().get(CodehashHandshakeInterceptor.CODEHASH_ATTRIBUTE);
		if (!(codehash instanceof String roomCodehash)) {
			session.close(CloseStatus.BAD_DATA);
			return;
		}
		connectionHub.register(session, roomCodehash);
	}

	@Override
	protected void handleTextMessage(WebSocketSession socket, TextMessage message) {
		long serverReceivedAtEpochMs = System.currentTimeMillis();
		ClientConnection connection = connectionHub.find(socket).orElse(null);
		if (connection == null) {
			closeSocket(socket, CloseStatus.SERVER_ERROR);
			return;
		}
		if (message.getPayload().getBytes(StandardCharsets.UTF_8).length > properties.maxMessageBytes()) {
			sendError(connection, "MESSAGE_TOO_LARGE", "The message exceeds the allowed size.", false);
			connectionHub.closeQuietly(connection, CloseStatus.TOO_BIG_TO_PROCESS);
			return;
		}
		if (connection.authenticated()) {
			boolean receivedWhileQuestionOpen = sessionRegistry.find(connection.codehash())
					.map(snapshot -> snapshot.state() == gd.safety.quizzle.session.GameState.QUESTION_OPEN)
					.orElse(false);
			handleAnswer(
					connection, message.getPayload(), serverReceivedAtEpochMs, receivedWhileQuestionOpen);
			return;
		}

		try {
			JoinRequest request = protocol.parseJoin(message.getPayload());
			PlayerConnection playerConnection = request.isReconnect()
					? sessionRegistry.reconnectPlayer(connection.codehash(), request.reconnectToken())
					: sessionRegistry.joinPlayer(connection.codehash(), playerNamePolicy.validate(request.name()));
			completeJoin(connection, playerConnection, request.isReconnect());
		} catch (ProtocolException exception) {
			sendError(connection, exception.code(), exception.getMessage(), true);
		} catch (InvalidPlayerNameException exception) {
			sendError(connection, "INVALID_NAME", exception.getMessage(), true);
		} catch (JoinNotAllowedException exception) {
			sendError(connection, "JOIN_CLOSED",
					"This quiz has already started; new players cannot join.", false);
			connectionHub.closeQuietly(connection, FATAL_JOIN_ERROR);
		} catch (ReconnectRejectedException exception) {
			sendError(connection, exception.errorCode(), exception.clientMessage(), false);
			connectionHub.closeQuietly(connection, FATAL_JOIN_ERROR);
		} catch (RuntimeException exception) {
			LOGGER.error("WebSocket message failed in session {}", connection.codehash(), exception);
			sendError(connection, "INTERNAL_ERROR", "The message could not be processed.", true);
		}
	}

	@Scheduled(fixedDelay = 100)
	public void revealExpiredQuestions() {
		for (GameSessionSnapshot snapshot : sessionRegistry.transitionExpiredQuestions(
				System.currentTimeMillis())) {
			broadcastState(snapshot);
		}
	}

	@Override
	protected void handleBinaryMessage(WebSocketSession socket, BinaryMessage message) {
		connectionHub.find(socket).ifPresent(connection ->
				sendError(connection, "TEXT_REQUIRED", "Only JSON text messages are accepted.", true));
	}

	@Override
	protected void handlePongMessage(WebSocketSession session, PongMessage message) {
		connectionHub.markPong(session);
	}

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) {
		connectionHub.find(session).ifPresent(connection ->
				connectionHub.closeQuietly(connection, CloseStatus.SERVER_ERROR));
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		UnbindResult unbound = connectionHub.unregister(session);
		if (unbound.connection() == null || !unbound.wasActivePlayerSocket()) {
			return;
		}
		ClientConnection connection = unbound.connection();
		sessionRegistry.disconnectPlayer(connection.codehash(), connection.playerId())
				.ifPresent(this::broadcastState);
	}

	@Scheduled(fixedDelayString = "${quiz.websocket.heartbeat-interval-ms}")
	public void heartbeatAndExpireDisconnectedPlayers() {
		long nowEpochMs = System.currentTimeMillis();
		for (ClientConnection connection : connectionHub.allConnections()) {
			boolean joinTimedOut = !connection.authenticated()
					&& nowEpochMs - connection.connectedAtEpochMs() > properties.heartbeatTimeoutMs();
			boolean heartbeatTimedOut = nowEpochMs - connection.lastPongEpochMs()
					> properties.heartbeatTimeoutMs();
			if (joinTimedOut || heartbeatTimedOut) {
				connectionHub.closeQuietly(connection, HEARTBEAT_TIMEOUT);
				continue;
			}
			try {
				connectionHub.sendPing(connection);
			} catch (IOException exception) {
				connectionHub.closeQuietly(connection, CloseStatus.SERVER_ERROR);
			}
		}
		for (String codehash : sessionRegistry.expireDisconnectedPlayers(
				nowEpochMs, properties.disconnectGraceMs())) {
			sessionRegistry.find(codehash).ifPresent(this::broadcastState);
		}
	}

	private void completeJoin(
			ClientConnection connection,
			PlayerConnection playerConnection,
			boolean reconnected) {
		try {
			connectionHub.sendText(connection, protocol.joined(playerConnection, reconnected));
		} catch (IOException exception) {
			sessionRegistry.disconnectPlayer(connection.codehash(), playerConnection.player().playerId());
			connectionHub.closeQuietly(connection, CloseStatus.SERVER_ERROR);
			return;
		}

		Optional<ClientConnection> previous = connectionHub.bindPlayer(
				connection, playerConnection.player().playerId());
		previous.ifPresent(oldConnection ->
				connectionHub.closeQuietly(oldConnection, REPLACED_CONNECTION));
		broadcastState(playerConnection.session());
	}

	private void handleAnswer(
			ClientConnection connection,
			String payload,
			long serverReceivedAtEpochMs,
			boolean receivedWhileQuestionOpen) {
		try {
			AnswerRequest request = protocol.parseAnswer(payload);
			AnswerSubmissionResult result = sessionRegistry.submitAnswer(
					connection.codehash(),
					connection.playerId(),
					request.questionId(),
					request.answerIds(),
					serverReceivedAtEpochMs,
					receivedWhileQuestionOpen);
			connectionHub.sendText(connection, protocol.answerAccepted(result));
			sessionRegistry.find(connection.codehash()).ifPresent(this::broadcastState);
		} catch (ProtocolException exception) {
			sendError(connection, exception.code(), exception.getMessage(), true);
		} catch (AnswerRejectedException exception) {
			boolean retryable = "INVALID_ANSWER".equals(exception.errorCode())
					|| "QUESTION_MISMATCH".equals(exception.errorCode());
			sendError(connection, exception.errorCode(), exception.getMessage(), retryable);
		} catch (IOException exception) {
			connectionHub.closeQuietly(connection, CloseStatus.SERVER_ERROR);
		} catch (RuntimeException exception) {
			LOGGER.error("Answer processing failed in session {}", connection.codehash(), exception);
			sendError(connection, "INTERNAL_ERROR", "The answer could not be processed.", true);
		}
	}

	private void broadcastState(GameSessionSnapshot snapshot) {
		realtimePublisher.publish(snapshot);
	}

	private void sendError(ClientConnection connection, String code, String message, boolean retryable) {
		try {
			connectionHub.sendText(connection, protocol.error(code, message, retryable));
		} catch (IOException exception) {
			connectionHub.closeQuietly(connection, CloseStatus.SERVER_ERROR);
		}
	}

	private void closeSocket(WebSocketSession socket, CloseStatus status) {
		try {
			if (socket.isOpen()) {
				socket.close(status);
			}
		} catch (IOException ignored) {
			// The socket is already unusable.
		}
	}
}






