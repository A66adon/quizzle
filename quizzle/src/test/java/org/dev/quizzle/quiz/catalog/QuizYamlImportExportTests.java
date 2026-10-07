package org.dev.quizzle.quiz.catalog;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class QuizYamlImportExportTests {
	private final QuizYamlParser parser = new QuizYamlParser(QuizTestFixtures.limits());

	@Test
	void exportedDefinitionRoundTripsWithoutAnyFiles() throws Exception {
		var definition = parser.parse(QuizTestFixtures.validYaml());
		assertEquals(definition, parser.parse(new QuizYamlWriter().write(definition)));
	}

	@Test
	void importRejectsOversizeUtf8BytesAliasesAndExcessNesting() {
		assertThrows(QuizFileException.class,
				() -> parser.parse("#" + "é".repeat((int) QuizTestFixtures.limits().maxFileBytes())));
		assertThrows(QuizFileException.class, () -> parser.parse("""
				title: Alias bomb
				description: ''
				author: ''
				questions: &a [*a]
				"""));
		assertThrows(QuizFileException.class, () -> parser.parse("a: " + "[".repeat(25) + "0" + "]".repeat(25)));
	}

	@Test
	void rejectsDuplicateKeysAndUntrustedTags() {
		assertThrows(QuizFileException.class, () -> parser.parse(QuizTestFixtures.validYaml() + "\ntitle: Duplicate"));
		assertThrows(QuizFileException.class, () -> parser.parse("!!java.lang.ProcessBuilder {}"));
	}
}
