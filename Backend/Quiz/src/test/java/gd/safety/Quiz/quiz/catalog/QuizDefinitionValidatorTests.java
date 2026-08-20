package gd.safety.Quiz.quiz.catalog;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import gd.safety.Quiz.quiz.model.AnswerDefinition;
import gd.safety.Quiz.quiz.model.QuestionDefinition;
import gd.safety.Quiz.quiz.model.QuizDefinition;

class QuizDefinitionValidatorTests {

	private final QuizDefinitionValidator validator = new QuizDefinitionValidator(QuizTestFixtures.limits());

	@Test
	void acceptsAValidQuiz() {
		assertTrue(validator.validate(QuizTestFixtures.validQuiz()).isEmpty());
	}

	@Test
	void rejectsBlankMetadataAndAnEmptyQuestionList() {
		List<String> errors = validator.validate(new QuizDefinition(" ", "", null, List.of()));

		assertContains(errors, "title must not be blank");
		assertContains(errors, "description must not be blank");
		assertContains(errors, "author must not be blank");
		assertContains(errors, "questions must contain at least one question");
	}

	@Test
	void enforcesUniqueIdsBoundsAndCorrectAnswerRules() {
		QuestionDefinition firstQuestion = new QuestionDefinition(
				"duplicate-question",
				"First",
				0,
				601,
				false,
				List.of(
						new AnswerDefinition("shared-answer", "One", false),
						new AnswerDefinition("first-other", "Two", false)));
		QuestionDefinition secondQuestion = new QuestionDefinition(
				"duplicate-question",
				"Second",
				100_001,
				20,
				false,
				List.of(
						new AnswerDefinition("shared-answer", "Three", true),
						new AnswerDefinition("second-other", "Four", true)));

		List<String> errors = validator.validate(new QuizDefinition(
				"Safety", "Description", "Author", List.of(firstQuestion, secondQuestion)));

		assertContains(errors, "questions[0].points must be positive");
		assertContains(errors, "questions[0].timeSeconds is 601; maximum is 600");
		assertContains(errors, "questions[0].answers must contain at least one correct answer");
		assertContains(errors, "questions[1].id duplicates question id 'duplicate-question'");
		assertContains(errors, "questions[1].points is 100001; maximum is 100000");
		assertContains(errors, "questions[1].answers[0].id duplicates answer id 'shared-answer'");
		assertContains(errors, "questions[1] has multiple=false and must contain exactly one correct answer");
	}

	@Test
	void requiresTwoAnswersAndEnforcesConfiguredTextLengths() {
		QuestionDefinition question = new QuestionDefinition(
				" padded-id ",
				"Q".repeat(501),
				1,
				1,
				true,
				List.of(new AnswerDefinition("answer", "A".repeat(301), true)));

		List<String> errors = validator.validate(new QuizDefinition(
				"T".repeat(161), "Description", "Author", List.of(question)));

		assertContains(errors, "title is 161 characters; maximum is 160");
		assertContains(errors, "questions[0].id must not start or end with whitespace");
		assertContains(errors, "questions[0].text is 501 characters; maximum is 500");
		assertContains(errors, "questions[0].answers must contain at least two answers");
		assertContains(errors, "questions[0].answers[0].text is 301 characters; maximum is 300");
	}

	private void assertContains(List<String> errors, String expectedError) {
		assertTrue(errors.contains(expectedError), () -> "Expected error not found: " + expectedError + " in " + errors);
	}
}
