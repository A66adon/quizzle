package gd.safety.Quiz.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.catalog")
public record QuizCatalogProperties(Path directory) {

	public QuizCatalogProperties {
		Objects.requireNonNull(directory, "quiz.catalog.directory must be configured");
	}
}
