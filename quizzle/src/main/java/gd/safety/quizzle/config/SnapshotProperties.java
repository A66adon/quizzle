package gd.safety.quizzle.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.snapshot")
public record SnapshotProperties(Path databasePath, long intervalMs, int busyTimeoutMs) {

	public SnapshotProperties {
		Objects.requireNonNull(databasePath, "quiz.snapshot.database-path must be configured");
		if (intervalMs < 1_000) {
			throw new IllegalArgumentException("quiz.snapshot.interval-ms must be at least 1000");
		}
		if (busyTimeoutMs < 0 || busyTimeoutMs > 60_000) {
			throw new IllegalArgumentException("quiz.snapshot.busy-timeout-ms must be between 0 and 60000");
		}
	}
}
