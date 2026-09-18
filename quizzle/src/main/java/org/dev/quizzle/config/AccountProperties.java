package org.dev.quizzle.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.account")
public record AccountProperties(Path file, int minPasswordLength) {

	public AccountProperties {
		Objects.requireNonNull(file, "quiz.account.file must be configured");
		if (minPasswordLength <= 0) {
			minPasswordLength = 8;
		}
	}
}
