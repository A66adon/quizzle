package gd.safety.Quiz.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.websocket")
public record WebSocketProperties(
		long heartbeatIntervalMs,
		long heartbeatTimeoutMs,
		long disconnectGraceMs,
		int maxNameLength,
		int maxMessageBytes) {

	public WebSocketProperties {
		if (heartbeatIntervalMs < 10_000 || heartbeatIntervalMs > 20_000) {
			throw new IllegalArgumentException("quiz.websocket.heartbeat-interval-ms must be between 10000 and 20000");
		}
		if (heartbeatTimeoutMs <= heartbeatIntervalMs || heartbeatTimeoutMs > 120_000) {
			throw new IllegalArgumentException(
					"quiz.websocket.heartbeat-timeout-ms must exceed the interval and be at most 120000");
		}
		if (disconnectGraceMs < 10_000 || disconnectGraceMs > 86_400_000) {
			throw new IllegalArgumentException(
					"quiz.websocket.disconnect-grace-ms must be between 10000 and 86400000");
		}
		if (maxNameLength < 1 || maxNameLength > 100) {
			throw new IllegalArgumentException("quiz.websocket.max-name-length must be between 1 and 100");
		}
		if (maxMessageBytes < 1_024 || maxMessageBytes > 65_536) {
			throw new IllegalArgumentException("quiz.websocket.max-message-bytes must be between 1024 and 65536");
		}
	}
}
