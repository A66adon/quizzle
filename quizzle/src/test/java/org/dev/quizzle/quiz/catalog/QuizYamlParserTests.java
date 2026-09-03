package org.dev.quizzle.quiz.catalog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import org.dev.quizzle.config.QuizValidationProperties;
import org.dev.quizzle.quiz.model.QuizDefinition;

class QuizYamlParserTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void parsesACompleteQuiz() throws Exception {
		Path quizFile = write("valid.yaml", QuizTestFixtures.validYaml());

		QuizDefinition quiz = new QuizYamlParser(QuizTestFixtures.limits()).parse(quizFile);

		assertEquals("Safety", quiz.title());
		assertEquals(1, quiz.questions().size());
		assertEquals(2, quiz.questions().getFirst().answers().size());
		assertTrue(quiz.questions().getFirst().answers().getFirst().correct());
	}

	@Test
	void shuffleAnswersDefaultsToTrueAndCanBeTurnedOff() throws Exception {
		Path defaulted = write("defaulted.yaml", QuizTestFixtures.validYaml());
		Path fixed = write("fixed.yaml", QuizTestFixtures.validYaml().replace(
				"    multiple: false",
				"    multiple: false\n    shuffle_answers: false"));
		QuizYamlParser parser = new QuizYamlParser(QuizTestFixtures.limits());

		assertTrue(parser.parse(defaulted).questions().getFirst().shuffleAnswers());
		assertFalse(parser.parse(fixed).questions().getFirst().shuffleAnswers());
	}

	@Test
	void rejectsDuplicateYamlKeysWithLocation() throws IOException {
		Path quizFile = write("duplicate.yaml", QuizTestFixtures.validYaml().replace(
				"title: Safety",
				"title: Safety\ntitle: Duplicate"));

		QuizFileException exception = assertThrows(
				QuizFileException.class,
				() -> new QuizYamlParser(QuizTestFixtures.limits()).parse(quizFile));

		assertTrue(exception.getMessage().startsWith("Malformed YAML at line"));
	}

	@Test
	void reportsUnknownFieldsAndWrongTypes() throws IOException {
		String invalidYaml = QuizTestFixtures.validYaml()
				.replace("author: Safety Team", "author: Safety Team\nunknown: value")
				.replace("multiple: false", "multiple: \"false\"");
		Path quizFile = write("strict.yaml", invalidYaml);

		QuizFileException exception = assertThrows(
				QuizFileException.class,
				() -> new QuizYamlParser(QuizTestFixtures.limits()).parse(quizFile));

		assertTrue(exception.getMessage().contains("quiz.unknown is not allowed"));
		assertTrue(exception.getMessage().contains("questions[0].multiple must be true or false"));
	}

	@Test
	void rejectsFilesAboveTheConfiguredLimit() throws IOException {
		QuizValidationProperties smallLimit = new QuizValidationProperties(
				10, 160, 2_000, 120, 80, 500, 300, 200, 6, 100_000, 600);
		Path quizFile = write("large.yaml", QuizTestFixtures.validYaml());

		QuizFileException exception = assertThrows(
				QuizFileException.class,
				() -> new QuizYamlParser(smallLimit).parse(quizFile));

		assertTrue(exception.getMessage().contains("maximum is 10 bytes"));
	}

	private Path write(String fileName, String content) throws IOException {
		return Files.writeString(temporaryDirectory.resolve(fileName), content, StandardCharsets.UTF_8);
	}
}
