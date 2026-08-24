package gd.safety.quizzle.branding;

import java.nio.file.Files;
import java.nio.file.Path;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import gd.safety.quizzle.config.BrandingProperties;
import jakarta.annotation.PostConstruct;

@Component
public final class BrandingCatalog {

	private static final Logger LOGGER = LoggerFactory.getLogger(BrandingCatalog.class);

	private final Path file;
	private final BrandingYamlParser parser;
	private volatile Branding branding = Branding.defaults();

	public BrandingCatalog(BrandingProperties properties, BrandingYamlParser parser) {
		this.file = properties.directory().resolve(properties.file()).toAbsolutePath().normalize();
		this.parser = parser;
	}

	@PostConstruct
	public void loadAtStartup() {
		if (!Files.isRegularFile(file)) {
			LOGGER.info("Branding ready: built-in defaults ({} not found)", file);
			return;
		}
		try {
			branding = parser.parse(file);
			LOGGER.info("Branding ready: {}", file);
		} catch (BrandingFileException exception) {
			LOGGER.warn("Branding file rejected, using defaults: {}", exception.getMessage());
		} catch (RuntimeException exception) {
			LOGGER.error("Unexpected error while loading the branding file, using defaults", exception);
		}
	}

	public Branding branding() {
		return branding;
	}
}
