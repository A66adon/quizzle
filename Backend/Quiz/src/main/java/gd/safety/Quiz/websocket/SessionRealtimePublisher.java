package gd.safety.Quiz.websocket;

import org.springframework.stereotype.Component;

import gd.safety.Quiz.session.GameSessionSnapshot;

@Component
public final class SessionRealtimePublisher {

	private final WebSocketConnectionHub connectionHub;
	private final WebSocketProtocol protocol;

	public SessionRealtimePublisher(
			WebSocketConnectionHub connectionHub,
			WebSocketProtocol protocol) {
		this.connectionHub = connectionHub;
		this.protocol = protocol;
	}

	public void publish(GameSessionSnapshot snapshot) {
		connectionHub.broadcast(snapshot.codehash(), protocol.state(snapshot));
	}
}
