package org.dev.quizzle.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * {@code directory} is the base folder that holds one subfolder per account id
 * (e.g. {@code data/quizzes/<accountId>/}); it is no longer a flat, shared quiz folder.
 */
@ConfigurationProperties("quiz.catalog")
public record QuizCatalogProperties(Path directory) {

	public QuizCatalogProperties {
		Objects.requireNonNull(directory, "quiz.catalog.directory must be configured");
	}
}
