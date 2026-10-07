package org.dev.quizzle.quiz.catalog;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;

class QuizGenerationTests {
	@Test void deletingAndRecreatingOrImportingTheSameTitleNeverReusesItsClientIdentity() throws Exception {
		var jdbc=mock(JdbcTemplate.class);
		when(jdbc.update(anyString(),any(Object[].class))).thenReturn(1);
		var parser=new QuizYamlParser(QuizTestFixtures.limits());
		var service=new QuizEditorService(jdbc,mock(QuizCatalog.class),JsonMapper.builder().build(),parser,
				new QuizYamlWriter(),new QuizDefinitionValidator(QuizTestFixtures.limits()));
		String owner=UUID.randomUUID().toString();
		var quiz=parser.parse(QuizTestFixtures.validYaml());
		String old=service.create(owner,quiz);
		service.delete(owner,old);
		String replacement=service.create(owner,quiz);
		String imported=service.importYaml(owner,QuizTestFixtures.validYaml()).fileName();
		assertNotEquals(old,replacement);
		assertNotEquals(old,imported);
		assertNotEquals(replacement,imported);
		for(String identity:java.util.List.of(old,replacement,imported))
			assertTrue(identity.matches("[a-z0-9-]+-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\\.yaml"));
	}
}
