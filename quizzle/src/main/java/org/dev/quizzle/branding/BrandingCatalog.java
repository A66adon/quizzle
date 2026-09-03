package org.dev.quizzle.branding;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import org.dev.quizzle.config.BrandingProperties;
import jakarta.annotation.PostConstruct;

@Component
public final class BrandingCatalog {

	private static final Logger LOGGER = LoggerFactory.getLogger(BrandingCatalog.class);

	private final Path file;
	private final BrandingYamlParser parser;
	private volatile Branding branding = Branding.defaults();
	private volatile Path markImageFile;

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
			markImageFile = resolveMarkImageFile(branding);
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

	/** The logo file to serve for {@link Branding.MarkKind#IMAGE_FILE}, if the mark names one that actually exists. */
	public Optional<Path> markImageFile() {
		return Optional.ofNullable(markImageFile);
	}

	private Path resolveMarkImageFile(Branding branding) {
		if (branding.markKind() != Branding.MarkKind.IMAGE_FILE) {
			return null;
		}
		Path directory = file.getParent();
		Path candidate = directory.resolve("./images/" + branding.mark()).normalize();
		if (!candidate.startsWith(directory) || !Files.isRegularFile(candidate)) {
			LOGGER.warn("Branding mark names an image that was not found next to the branding file: {}", branding.mark());
			return null;
		}
		return candidate;
	}
}
