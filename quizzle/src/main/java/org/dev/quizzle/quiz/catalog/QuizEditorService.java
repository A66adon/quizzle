package org.dev.quizzle.quiz.catalog;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.dev.quizzle.quiz.model.QuizDefinition;
import tools.jackson.databind.ObjectMapper;

@Service
public final class QuizEditorService {
	private static final Pattern SAFE_FILE_NAME = Pattern.compile("^[A-Za-z0-9_-]{1,115}\\.ya?ml$");
	private final JdbcTemplate jdbc;
	private final QuizCatalog catalog;
	private final ObjectMapper mapper;
	private final QuizYamlParser parser;
	private final QuizYamlWriter writer;
	private final QuizDefinitionValidator validator;

	public QuizEditorService(JdbcTemplate jdbc, QuizCatalog catalog, ObjectMapper mapper,
			QuizYamlParser parser, QuizYamlWriter writer, QuizDefinitionValidator validator) {
		this.jdbc = jdbc;
		this.catalog = catalog;
		this.mapper = mapper;
		this.parser = parser;
		this.writer = writer;
		this.validator = validator;
	}

	public LoadedQuiz loadRevision(String accountId, String fileName) {
		checkFileName(fileName);
		return catalog.findByFileName(accountId, fileName)
				.orElseThrow(() -> new QuizEditorException("Quiz not found"));
	}

	public QuizDefinition load(String accountId, String fileName) {
		return loadRevision(accountId, fileName).quiz();
	}

	public String create(String accountId, QuizDefinition quiz) {
		validate(quiz);
		String slug = slugify(quiz.title());
		for (int attempt = 0; attempt < 500; attempt++) {
			UUID id=UUID.randomUUID();
			String fileName = slug + "-" + id + ".yaml";
			int created = jdbc.update("""
					INSERT INTO quizzes(id,owner_account_id,slug,title,description,author,question_count,content)
					VALUES (?,?,?,?,?,?,?,?::jsonb) ON CONFLICT(owner_account_id,slug) DO NOTHING
					""", id, UUID.fromString(accountId), fileName, quiz.title(),
					quiz.description(), quiz.author(), quiz.questions().size(), mapper.writeValueAsString(quiz));
			if (created == 1) return fileName;
		}
		throw new QuizEditorException("Could not allocate a unique quiz name");
	}

	public LoadedQuiz update(String accountId, String fileName, QuizDefinition quiz, long version) {
		if (version < 1 || version == Long.MAX_VALUE) throw new IllegalArgumentException("Invalid version");
		checkFileName(fileName);
		validate(quiz);
		int updated = jdbc.update("""
				UPDATE quizzes SET title=?,description=?,author=?,question_count=?,content=?::jsonb,
				    version=version+1,updated_at=now() WHERE owner_account_id=? AND slug=? AND version=?
				""", quiz.title(), quiz.description(), quiz.author(), quiz.questions().size(),
				mapper.writeValueAsString(quiz), UUID.fromString(accountId), fileName, version);
		if (updated != 1) {
			throw new QuizRevisionConflictException(loadRevision(accountId, fileName).version());
		}
		return new LoadedQuiz(fileName, quiz, version + 1);
	}

	public void delete(String accountId, String fileName) {
		checkFileName(fileName);
		if (jdbc.update("DELETE FROM quizzes WHERE owner_account_id=? AND slug=?",
				UUID.fromString(accountId), fileName) != 1) throw new QuizEditorException("Quiz not found");
	}

	public LoadedQuiz importYaml(String accountId, String yaml) throws QuizFileException {
		QuizDefinition quiz = parser.parse(yaml);
		String fileName = create(accountId, quiz);
		return new LoadedQuiz(fileName, quiz, 1);
	}

	public String exportYaml(String accountId, String fileName) {
		return writer.write(load(accountId, fileName));
	}

	private void validate(QuizDefinition quiz) {
		List<String> errors = validator.validate(quiz);
		if (!errors.isEmpty()) throw new QuizEditorValidationException(errors);
	}

	private void checkFileName(String name) {
		if (name == null || !SAFE_FILE_NAME.matcher(name).matches()) throw new QuizEditorException("Quiz not found");
	}

	private String slugify(String title) {
		String normalized = Normalizer.normalize(title == null ? "" : title, Normalizer.Form.NFKD)
				.replaceAll("[^\\p{ASCII}]", "").toLowerCase(Locale.ROOT)
				.replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
		return normalized.isBlank() ? "quiz" : normalized.substring(0, Math.min(60, normalized.length()));
	}
}
