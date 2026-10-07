package org.dev.quizzle.quiz.catalog;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.dev.quizzle.quiz.model.QuizDefinition;
import tools.jackson.databind.ObjectMapper;

@Component
public final class QuizCatalog {
	private final JdbcTemplate jdbc;
	private final ObjectMapper mapper;

	public QuizCatalog(JdbcTemplate jdbc, ObjectMapper mapper) {
		this.jdbc = jdbc;
		this.mapper = mapper;
	}

	public QuizCatalogSnapshot snapshotFor(String accountId) {
		List<LoadedQuiz> quizzes = jdbc.query("""
				SELECT slug,title,description,author,question_count,version FROM quizzes
				WHERE owner_account_id=? ORDER BY lower(slug),slug
				""", (row, index) -> new LoadedQuiz(row.getString("slug"), null,
				row.getString("title"), row.getString("description"), row.getString("author"),
				row.getInt("question_count"), row.getLong("version")), UUID.fromString(accountId));
		return new QuizCatalogSnapshot(Instant.now(), quizzes, List.of());
	}

	public Optional<LoadedQuiz> findByFileName(String accountId, String fileName) {
		return jdbc.query("""
				SELECT slug,content,version FROM quizzes WHERE owner_account_id=? AND slug=?
				""", (row, index) -> new LoadedQuiz(row.getString("slug"),
				mapper.readValue(row.getString("content"), QuizDefinition.class), row.getLong("version")),
				UUID.fromString(accountId), fileName).stream().findFirst();
	}
}
