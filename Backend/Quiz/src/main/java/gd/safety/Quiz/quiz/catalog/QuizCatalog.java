package gd.safety.Quiz.quiz.catalog;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import gd.safety.Quiz.config.QuizCatalogProperties;
import gd.safety.Quiz.quiz.model.QuizDefinition;
import jakarta.annotation.PostConstruct;

@Component
public final class QuizCatalog {

	private static final Logger LOGGER = LoggerFactory.getLogger(QuizCatalog.class);

	private final Path directory;
	private final QuizYamlParser parser;
	private final QuizDefinitionValidator validator;
	private volatile QuizCatalogSnapshot snapshot = QuizCatalogSnapshot.empty();

	public QuizCatalog(
			QuizCatalogProperties properties,
			QuizYamlParser parser,
			QuizDefinitionValidator validator) {
		this.directory = properties.directory().toAbsolutePath().normalize();
		this.parser = parser;
		this.validator = validator;
	}

	@PostConstruct
	public void loadAtStartup() {
		List<LoadedQuiz> quizzes = new ArrayList<>();
		List<CatalogIssue> issues = new ArrayList<>();
		List<Path> quizFiles = discoverQuizFiles(issues);

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

		snapshot = new QuizCatalogSnapshot(Instant.now(), quizzes, issues);
		LOGGER.info("Quiz catalog ready: {} valid, {} invalid", quizzes.size(), issues.size());
	}

	public QuizCatalogSnapshot snapshot() {
		return snapshot;
	}

	public Optional<LoadedQuiz> findByFileName(String fileName) {
		return snapshot.quizzes().stream()
				.filter(loadedQuiz -> loadedQuiz.fileName().equals(fileName))
				.findFirst();
	}

	private List<Path> discoverQuizFiles(List<CatalogIssue> issues) {
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

