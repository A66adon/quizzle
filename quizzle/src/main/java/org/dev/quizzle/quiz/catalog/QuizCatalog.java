package org.dev.quizzle.quiz.catalog;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import org.dev.quizzle.config.QuizCatalogProperties;
import org.dev.quizzle.quiz.model.QuizDefinition;

/**
 * Loads each account's quizzes from its own subdirectory under the configured base directory
 * (e.g. {@code data/quizzes/<accountId>/}), so accounts never see one another's quizzes. There is
 * no in-memory cache: quiz files are re-scanned on every call, which keeps the catalog accurate
 * for the (small, per-user) quiz sets this application manages and lets a future editor write a
 * file and have it show up immediately.
 */
@Component
public final class QuizCatalog {

	private static final Logger LOGGER = LoggerFactory.getLogger(QuizCatalog.class);
	// Account ids are server-generated UUIDs; this guards against path traversal regardless.
	private static final Pattern SAFE_ACCOUNT_ID = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

	private final Path baseDirectory;
	private final QuizYamlParser parser;
	private final QuizDefinitionValidator validator;

	public QuizCatalog(
			QuizCatalogProperties properties,
			QuizYamlParser parser,
			QuizDefinitionValidator validator) {
		this.baseDirectory = properties.directory().toAbsolutePath().normalize();
		this.parser = parser;
		this.validator = validator;
	}

	public QuizCatalogSnapshot snapshotFor(String accountId) {
		Path directory = accountDirectory(accountId);
		List<LoadedQuiz> quizzes = new ArrayList<>();
		List<CatalogIssue> issues = new ArrayList<>();
		List<Path> quizFiles = discoverQuizFiles(directory, issues);

		for (Path quizFile : quizFiles) {
			String fileName = quizFile.getFileName().toString();
			try {
				QuizDefinition quiz = parser.parse(quizFile);
				List<String> validationErrors = validator.validate(quiz);
				if (validationErrors.isEmpty()) {
					quizzes.add(new LoadedQuiz(fileName, quiz));
				} else {
					issues.add(new CatalogIssue(fileName, "Validation failed: "
							+ String.join("; ", validationErrors)));
					LOGGER.warn("Skipped invalid quiz file: {}", fileName);
				}
			} catch (QuizFileException exception) {
				issues.add(new CatalogIssue(fileName, exception.getMessage()));
				LOGGER.warn("Skipped unreadable quiz file: {}", fileName);
			} catch (RuntimeException exception) {
				issues.add(new CatalogIssue(fileName, "Unexpected loader error"));
				LOGGER.error("Unexpected error while loading quiz file: {}", fileName, exception);
			}
		}

		return new QuizCatalogSnapshot(Instant.now(), quizzes, issues);
	}

	public Optional<LoadedQuiz> findByFileName(String accountId, String fileName) {
		return snapshotFor(accountId).quizzes().stream()
				.filter(loadedQuiz -> loadedQuiz.fileName().equals(fileName))
				.findFirst();
	}

	private Path accountDirectory(String accountId) {
		if (accountId == null || !SAFE_ACCOUNT_ID.matcher(accountId).matches()) {
			throw new IllegalArgumentException("accountId is invalid");
		}
		return baseDirectory.resolve(accountId).normalize();
	}

	private List<Path> discoverQuizFiles(Path directory, List<CatalogIssue> issues) {
		try {
			Files.createDirectories(directory);
			if (!Files.isDirectory(directory)) {
				issues.add(new CatalogIssue("<quiz folder>", "Configured path is not a directory"));
				return List.of();
			}

			try (Stream<Path> paths = Files.list(directory)) {
				return paths
						.filter(Files::isRegularFile)
						.filter(this::isYamlFile)
						.sorted(Comparator.comparing(path -> path.getFileName().toString(),
								String.CASE_INSENSITIVE_ORDER))
						.toList();
			}
		} catch (IOException | SecurityException exception) {
			issues.add(new CatalogIssue("<quiz folder>", "Could not access configured quiz folder"));
			LOGGER.error("Could not access configured quiz folder", exception);
			return List.of();
		}
	}

	private boolean isYamlFile(Path path) {
		String fileName = path.getFileName().toString().toLowerCase(Locale.ROOT);
		return fileName.endsWith(".yaml") || fileName.endsWith(".yml");
	}
}
