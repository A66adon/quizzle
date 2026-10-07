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

	private static final String ACCOUNT_ID = "catalog-account";

	@TempDir
	Path temporaryDirectory;

	@Test
	void keepsWorkingQuizzesWhenOtherFilesAreBroken() throws IOException {
		Path accountDirectory = Files.createDirectories(temporaryDirectory.resolve(ACCOUNT_ID));
		Files.writeString(accountDirectory.resolve("working.YML"), QuizTestFixtures.validYaml(), StandardCharsets.UTF_8);
		Files.writeString(
				accountDirectory.resolve("invalid.yaml"),
				QuizTestFixtures.validYaml().replace("correct: true", "correct: false"),
				StandardCharsets.UTF_8);
		Files.writeString(accountDirectory.resolve("malformed.yaml"), "title: [", StandardCharsets.UTF_8);
		Files.writeString(accountDirectory.resolve("notes.txt"), "not a quiz", StandardCharsets.UTF_8);

		QuizCatalog catalog = createCatalog(temporaryDirectory);
		QuizCatalogSnapshot snapshot = assertDoesNotThrow(() -> catalog.snapshotFor(ACCOUNT_ID));
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

		QuizCatalogSnapshot snapshot = assertDoesNotThrow(() -> catalog.snapshotFor(ACCOUNT_ID));

		assertTrue(Files.isDirectory(missingDirectory.resolve(ACCOUNT_ID)));
		assertTrue(snapshot.quizzes().isEmpty());
		assertTrue(snapshot.issues().isEmpty());
	}

	@Test
	void onlyLoadsQuizzesOwnedByTheRequestedAccount() throws IOException {
		Path accountDirectory = Files.createDirectories(temporaryDirectory.resolve(ACCOUNT_ID));
		Files.writeString(accountDirectory.resolve("owned.yaml"), QuizTestFixtures.validYaml());
		Files.writeString(temporaryDirectory.resolve("shared.yaml"), QuizTestFixtures.validYaml());
		Path otherDirectory = Files.createDirectories(temporaryDirectory.resolve("other-account"));
		Files.writeString(otherDirectory.resolve("private.yaml"), QuizTestFixtures.validYaml());
		QuizCatalog catalog = createCatalog(temporaryDirectory);

		assertEquals(1, catalog.snapshotFor(ACCOUNT_ID).quizzes().size());
		assertTrue(catalog.findByFileName(ACCOUNT_ID, "owned.yaml").isPresent());
		assertTrue(catalog.findByFileName(ACCOUNT_ID, "private.yaml").isEmpty());
		assertTrue(catalog.findByFileName(ACCOUNT_ID, "shared.yaml").isEmpty());
		assertTrue(catalog.findByFileName("other-account", "owned.yaml").isEmpty());
	}

	private QuizCatalog createCatalog(Path directory) {
		return new QuizCatalog(
				new QuizCatalogProperties(directory),
				new QuizYamlParser(QuizTestFixtures.limits()),
				new QuizDefinitionValidator(QuizTestFixtures.limits()));
	}
}
