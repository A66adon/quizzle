package gd.safety.quizzle.config;

import java.nio.file.Path;
import java.util.Objects;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.branding")
public record BrandingProperties(Path directory, String file) {

	public BrandingProperties {
		Objects.requireNonNull(directory, "quiz.branding.directory must be configured");
		if (file == null || file.isBlank()) {
			throw new IllegalArgumentException("quiz.branding.file must be configured");
		}
	}
}
