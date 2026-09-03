package org.dev.quizzle.quiz.catalog;

import java.util.List;

import org.dev.quizzle.config.QuizValidationProperties;
import org.dev.quizzle.quiz.model.AnswerDefinition;
import org.dev.quizzle.quiz.model.QuestionDefinition;
import org.dev.quizzle.quiz.model.QuizDefinition;

final class QuizTestFixtures {

	private QuizTestFixtures() {
	}

	static QuizValidationProperties limits() {
		return new QuizValidationProperties(1_048_576, 160, 2_000, 120, 80, 500, 300, 200, 6,
				100_000, 600);
	}

	static QuizDefinition validQuiz() {
		return new QuizDefinition(
				"Safety",
				"A valid quiz",
				"Safety Team",
				List.of(new QuestionDefinition(
						"q1",
						"Choose the safe action",
						1_000,
						20,
						false,
						true,
						List.of(
								new AnswerDefinition("a1", "Leave safely", true),
								new AnswerDefinition("a2", "Ignore the alarm", false)))));
	}

	static String validYaml() {
		return """
				title: Safety
				description: A valid quiz
				author: Safety Team
				questions:
				  - id: q1
				    text: Choose the safe action
				    points: 1000
				    timeSeconds: 20
				    multiple: false
				    answers:
				      - id: a1
				        text: Leave safely
				        correct: true
				      - id: a2
				        text: Ignore the alarm
				        correct: false
				""";
	}
}
