package gd.safety.quizzle.session;

import java.util.List;

import gd.safety.quizzle.config.QuizValidationProperties;
import gd.safety.quizzle.quiz.model.AnswerDefinition;
import gd.safety.quizzle.quiz.model.QuestionDefinition;
import gd.safety.quizzle.quiz.model.QuizDefinition;

public final class SessionTestFixtures {

	private SessionTestFixtures() {
	}

	public static QuizDefinition quiz() {
		return new QuizDefinition(
				"Safety",
				"Reboot-safe quiz",
				"Safety Team",
				List.of(
						question("q1", "First question", "a1", "a2"),
						question("q2", "Second question", "a3", "a4")));
	}

	public static GameSessionSnapshot lobbySnapshot(String codehash, long nowEpochMs) {
		return GameSessionSnapshot.create(codehash, "safety.yaml", quiz(), nowEpochMs);
	}

	public static QuizValidationProperties validationLimits() {
		return new QuizValidationProperties(1_048_576, 160, 2_000, 120, 80, 500, 300, 200, 6,
				100_000, 600);
	}

	public static String yaml() {
		return """
				title: Safety
				description: Reboot-safe quiz
				author: Safety Team
				questions:
				  - id: q1
				    text: First question
				    points: 1000
				    timeSeconds: 20
				    multiple: false
				    shuffle_answers: false
				    answers:
				      - id: a1
				        text: Correct
				        correct: true
				      - id: a2
				        text: Wrong
				        correct: false
				  - id: q2
				    text: Second question
				    points: 2000
				    timeSeconds: 30
				    multiple: false
				    shuffle_answers: false
				    answers:
				      - id: a3
				        text: Correct
				        correct: true
				      - id: a4
				        text: Wrong
				        correct: false
				""";
	}

	private static QuestionDefinition question(String id, String text, String correctId, String wrongId) {
		return new QuestionDefinition(
				id,
				text,
				id.equals("q1") ? 1_000 : 2_000,
				id.equals("q1") ? 20 : 30,
				false,
				false,
				List.of(
						new AnswerDefinition(correctId, "Correct", true),
						new AnswerDefinition(wrongId, "Wrong", false)));
	}
}
