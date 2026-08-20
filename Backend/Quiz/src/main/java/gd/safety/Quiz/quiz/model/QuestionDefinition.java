package gd.safety.Quiz.quiz.model;

import java.util.List;

public record QuestionDefinition(
		String id,
		String text,
		int points,
		int timeSeconds,
		boolean multiple,
		List<AnswerDefinition> answers) {

	public QuestionDefinition {
		answers = answers == null ? List.of() : List.copyOf(answers);
	}
}
