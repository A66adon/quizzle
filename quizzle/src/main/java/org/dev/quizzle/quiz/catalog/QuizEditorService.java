package org.dev.quizzle.quiz.catalog;

import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import org.dev.quizzle.config.QuizCatalogProperties;
import org.dev.quizzle.quiz.model.QuizDefinition;

/**
 * Create/update/delete operations for an account's own quiz files, backing the visual editor.
 * Every operation is scoped to {@code data/quizzes/<accountId>/} and re-validates the quiz
 * against the same rules the player-facing catalog enforces before writing anything to disk.
 */
@Service
public final class QuizEditorService {

	private static final Pattern SAFE_ACCOUNT_ID = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");
	private static final Pattern SAFE_FILE_NAME = Pattern.compile("^[A-Za-z0-9_-]{1,120}\\.ya?ml$");
	private static final int MAX_FILENAME_ATTEMPTS = 500;

	private final Path baseDirectory;
	private final QuizYamlParser parser;
	private final QuizYamlWriter writer;
	private final QuizDefinitionValidator validator;

	public QuizEditorService(
			QuizCatalogProperties properties,
			QuizYamlParser parser,
			QuizYamlWriter writer,
			QuizDefinitionValidator validator) {
		this.baseDirectory = properties.directory().toAbsolutePath().normalize();
		this.parser = parser;
		this.writer = writer;
		this.validator = validator;
	}

	public QuizDefinition load(String accountId, String fileName) {
		Path file = resolveExistingFile(accountId, fileName);
		try {
			return parser.parse(file);
		} catch (QuizFileException exception) {
			throw new QuizEditorException("Could not read quiz file: " + exception.getMessage());
		}
	}

	/** Creates a new quiz file, deriving its name from the title, and returns the file name. */
	public String create(String accountId, QuizDefinition quiz) {
		validate(quiz);
		Path directory = accountDirectory(accountId);
		try {
			Files.createDirectories(directory);
		} catch (java.io.IOException exception) {
			throw new QuizEditorException("Could not create the account's quiz folder: " + exception.getMessage());
		}
		String fileName = generateFileName(directory, quiz.title());
		writer.write(directory.resolve(fileName), quiz);
		return fileName;
	}

	/** Overwrites an existing quiz file in place. */
	public void update(String accountId, String fileName, QuizDefinition quiz) {
		validate(quiz);
		Path file = resolveExistingFile(accountId, fileName);
		writer.write(file, quiz);
	}

	public void delete(String accountId, String fileName) {
		Path file = resolveExistingFile(accountId, fileName);
		try {
			Files.deleteIfExists(file);
		} catch (java.io.IOException exception) {
			throw new QuizEditorException("Could not delete quiz file: " + exception.getMessage());
		}
	}

	private void validate(QuizDefinition quiz) {
		List<String> errors = validator.validate(quiz);
		if (!errors.isEmpty()) {
			throw new QuizEditorValidationException(errors);
		}
	}

	private Path accountDirectory(String accountId) {
		if (accountId == null || !SAFE_ACCOUNT_ID.matcher(accountId).matches()) {
			throw new IllegalArgumentException("accountId is invalid");
		}
		return baseDirectory.resolve(accountId).normalize();
	}

	private Path resolveExistingFile(String accountId, String fileName) {
		if (fileName == null || !SAFE_FILE_NAME.matcher(fileName).matches()) {
			throw new QuizEditorException("Quiz not found");
		}
		Path directory = accountDirectory(accountId);
		Path file = directory.resolve(fileName).normalize();
		if (!file.getParent().equals(directory) || !Files.isRegularFile(file)) {
			throw new QuizEditorException("Quiz not found");
		}
		return file;
	}

	private String generateFileName(Path directory, String title) {
		String slug = slugify(title);
		for (int attempt = 0; attempt < MAX_FILENAME_ATTEMPTS; attempt++) {
			String candidate = attempt == 0 ? slug + ".yaml" : slug + "-" + (attempt + 1) + ".yaml";
			if (!Files.exists(directory.resolve(candidate))) {
				return candidate;
			}
		}
		throw new QuizEditorException("Could not allocate a unique quiz file name");
	}

	private String slugify(String title) {
		String normalized = Normalizer.normalize(title == null ? "" : title, Normalizer.Form.NFKD)
				.replaceAll("[^\\p{ASCII}]", "")
				.toLowerCase(Locale.ROOT)
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("^-+|-+$", "");
		if (normalized.isBlank()) {
			return "quiz";
		}
		return normalized.length() > 60 ? normalized.substring(0, 60) : normalized;
	}
}
