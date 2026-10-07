package org.dev.quizzle.quiz.catalog;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import java.sql.ResultSet;
import java.util.List;
import java.util.UUID;
import org.dev.quizzle.admin.AdminCatalogResponse;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import tools.jackson.databind.ObjectMapper;

class QuizCatalogTests {
	@Test
	@SuppressWarnings("unchecked")
	void listsOnlyMetadataWithoutDeserializingContent() throws Exception {
		JdbcTemplate jdbc = mock(JdbcTemplate.class);
		ObjectMapper mapper = mock(ObjectMapper.class);
		UUID owner = UUID.randomUUID();
		when(jdbc.query(anyString(), any(RowMapper.class), eq(owner))).thenAnswer(call -> {
			String sql = call.getArgument(0);
			assertFalse(sql.contains("content"));
			assertTrue(sql.contains("WHERE owner_account_id=?"));
			ResultSet row = mock(ResultSet.class);
			when(row.getString("slug")).thenReturn("safety.yaml");
			when(row.getString("title")).thenReturn("Safety");
			when(row.getString("description")).thenReturn("Description");
			when(row.getString("author")).thenReturn("Author");
			when(row.getInt("question_count")).thenReturn(2);
			when(row.getLong("version")).thenReturn(3L);
			RowMapper<LoadedQuiz> rowMapper = call.getArgument(1);
			return List.of(rowMapper.mapRow(row, 0));
		});
		var snapshot = new QuizCatalog(jdbc, mapper).snapshotFor(owner.toString());
		assertNull(snapshot.quizzes().getFirst().quiz());
		assertEquals(3, snapshot.quizzes().getFirst().version());
		assertEquals(2, AdminCatalogResponse.from(snapshot).quizzes().getFirst().questionCount());
		verifyNoInteractions(mapper);
	}
}
