package gd.safety.Quiz.websocket;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public final class WebSocketConnectionHub {

	private final Map<String, ClientConnection> connectionsBySocket = new ConcurrentHashMap<>();
	private final Map<String, Map<UUID, ClientConnection>> activePlayersByRoom = new ConcurrentHashMap<>();

	public ClientConnection register(WebSocketSession socket, String codehash) {
		ClientConnection connection = new ClientConnection(socket, codehash, System.currentTimeMillis());
		connectionsBySocket.put(socket.getId(), connection);
		return connection;
	}

	public Optional<ClientConnection> find(WebSocketSession socket) {
		return Optional.ofNullable(connectionsBySocket.get(socket.getId()));
	}

	public Optional<ClientConnection> bindPlayer(ClientConnection connection, UUID playerId) {
		connection.playerId = playerId;
		Map<UUID, ClientConnection> room = activePlayersByRoom.computeIfAbsent(
				connection.codehash, ignored -> new ConcurrentHashMap<>());
		ClientConnection previous = room.put(playerId, connection);
		return previous == null || previous == connection ? Optional.empty() : Optional.of(previous);
	}

	public UnbindResult unregister(WebSocketSession socket) {
		ClientConnection connection = connectionsBySocket.remove(socket.getId());
		if (connection == null || connection.playerId == null) {
			return new UnbindResult(connection, false);
		}
		Map<UUID, ClientConnection> room = activePlayersByRoom.get(connection.codehash);
		boolean wasActive = room != null && room.remove(connection.playerId, connection);
		if (room != null && room.isEmpty()) {
			activePlayersByRoom.remove(connection.codehash, room);
		}
		return new UnbindResult(connection, wasActive);
	}

	public List<ClientConnection> allConnections() {
		return List.copyOf(connectionsBySocket.values());
	}

	public void broadcast(String codehash, String payload) {
		Map<UUID, ClientConnection> room = activePlayersByRoom.get(codehash);
		if (room == null) {
			return;
		}
		for (ClientConnection connection : List.copyOf(room.values())) {
			try {
				sendText(connection, payload);
			} catch (IOException exception) {
				closeQuietly(connection, CloseStatus.SERVER_ERROR);
			}
		}
	}

	public void sendText(ClientConnection connection, String payload) throws IOException {
		connection.sendLock.lock();
		try {
			if (connection.socket.isOpen()) {
				connection.socket.sendMessage(new TextMessage(payload));
			}
		} finally {
			connection.sendLock.unlock();
		}
	}

	public void sendPing(ClientConnection connection) throws IOException {
		connection.sendLock.lock();
		try {
			if (connection.socket.isOpen()) {
				connection.socket.sendMessage(new PingMessage());
			}
		} finally {
			connection.sendLock.unlock();
		}
	}

	public void markPong(WebSocketSession socket) {
		ClientConnection connection = connectionsBySocket.get(socket.getId());
		if (connection != null) {
			connection.lastPongEpochMs = System.currentTimeMillis();
		}
	}

	public void closeQuietly(ClientConnection connection, CloseStatus status) {
		try {
			if (connection.socket.isOpen()) {
				connection.socket.close(status);
			}
		} catch (IOException ignored) {
			// The socket is already unusable.
		}
	}

	public static final class ClientConnection {

		private final WebSocketSession socket;
		private final String codehash;
		private final long connectedAtEpochMs;
		private final ReentrantLock sendLock = new ReentrantLock();
		private volatile long lastPongEpochMs;
		private volatile UUID playerId;

		private ClientConnection(WebSocketSession socket, String codehash, long connectedAtEpochMs) {
			this.socket = socket;
			this.codehash = codehash;
			this.connectedAtEpochMs = connectedAtEpochMs;
			this.lastPongEpochMs = connectedAtEpochMs;
		}

		public WebSocketSession socket() {
			return socket;
		}

		public String codehash() {
			return codehash;
		}

		public long connectedAtEpochMs() {
			return connectedAtEpochMs;
		}

		public long lastPongEpochMs() {
			return lastPongEpochMs;
		}

		public UUID playerId() {
			return playerId;
		}

		public boolean authenticated() {
			return playerId != null;
		}
	}

	public record UnbindResult(ClientConnection connection, boolean wasActivePlayerSocket) {
	}
}
