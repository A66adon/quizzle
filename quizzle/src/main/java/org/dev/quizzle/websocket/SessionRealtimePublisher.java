package org.dev.quizzle.websocket;

import java.io.IOException;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.socket.CloseStatus;

import org.dev.quizzle.session.GameSessionSnapshot;

@Component
public final class SessionRealtimePublisher {

	private static final CloseStatus REMOVED_BY_PRESENTER = new CloseStatus(4003, "Removed by presenter");

	private final WebSocketConnectionHub connectionHub;
	private final PresenterEventHub presenterHub;
	private final WebSocketProtocol protocol;

	public SessionRealtimePublisher(
			WebSocketConnectionHub connectionHub,
			PresenterEventHub presenterHub,
			WebSocketProtocol protocol) {
		this.connectionHub = connectionHub;
		this.presenterHub = presenterHub;
		this.protocol = protocol;
	}

	public SseEmitter subscribePresenter(GameSessionSnapshot snapshot) {
		SseEmitter emitter = presenterHub.register(snapshot.codehash());
		presenterHub.send(emitter, snapshot.codehash(), protocol.state(snapshot));
		return emitter;
	}

	public String stateJson(GameSessionSnapshot snapshot) {
		return protocol.state(snapshot);
	}

	public void disconnectKickedPlayer(String codehash, UUID playerId) {
		connectionHub.findPlayer(codehash, playerId).ifPresent(connection -> {
			try {
				connectionHub.sendText(connection, protocol.error(
						"PLAYER_KICKED", "You were removed from this quiz.", false));
			} catch (IOException ignored) {
				// The participant is already gone; the KICKED status still blocks reconnects.
			}
			connectionHub.closeQuietly(connection, REMOVED_BY_PRESENTER);
		});
	}

	public void publish(GameSessionSnapshot snapshot) {
		String payload = protocol.state(snapshot);
		connectionHub.broadcast(snapshot.codehash(), payload);
		presenterHub.publish(snapshot.codehash(), payload);
	}
}
