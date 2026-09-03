package org.dev.quizzle.quiz.catalog;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import org.dev.quizzle.config.QuizCatalogProperties;

class QuizCatalogTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	void keepsWorkingQuizzesWhenOtherFilesAreBroken() throws IOException {
		Files.writeString(temporaryDirectory.resolve("working.YML"), QuizTestFixtures.validYaml(), StandardCharsets.UTF_8);
		Files.writeString(
				temporaryDirectory.resolve("invalid.yaml"),
				QuizTestFixtures.validYaml().replace("correct: true", "correct: false"),
				StandardCharsets.UTF_8);
		Files.writeString(temporaryDirectory.resolve("malformed.yaml"), "title: [", StandardCharsets.UTF_8);
		Files.writeString(temporaryDirectory.resolve("notes.txt"), "not a quiz", StandardCharsets.UTF_8);

		QuizCatalog catalog = createCatalog(temporaryDirectory);
		assertDoesNotThrow(catalog::loadAtStartup);

		QuizCatalogSnapshot snapshot = catalog.snapshot();
		assertEquals(1, snapshot.quizzes().size());
		assertEquals("working.YML", snapshot.quizzes().getFirst().fileName());
		assertEquals(2, snapshot.issues().size());
		Map<String, String> issuesByFile = snapshot.issues().stream()
				.collect(Collectors.toMap(CatalogIssue::fileName, CatalogIssue::reason));
		assertTrue(issuesByFile.get("invalid.yaml").contains("at least one correct answer"));
		assertTrue(issuesByFile.get("malformed.yaml").startsWith("Malformed YAML"));
	}

	@Test
	void createsAMissingQuizDirectory() {
		Path missingDirectory = temporaryDirectory.resolve("new-quizzes");
		QuizCatalog catalog = createCatalog(missingDirectory);

		assertDoesNotThrow(catalog::loadAtStartup);

		assertTrue(Files.isDirectory(missingDirectory));
		assertTrue(catalog.snapshot().quizzes().isEmpty());
		assertTrue(catalog.snapshot().issues().isEmpty());
	}

	private QuizCatalog createCatalog(Path directory) {
		return new QuizCatalog(
				new QuizCatalogProperties(directory),
				new QuizYamlParser(QuizTestFixtures.limits()),
				new QuizDefinitionValidator(QuizTestFixtures.limits()));
	}
}
