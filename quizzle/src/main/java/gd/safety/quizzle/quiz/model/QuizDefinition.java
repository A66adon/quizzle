package gd.safety.quizzle.quiz.model;

import java.util.List;

public record QuizDefinition(
		String title,
		String description,
		String author,
		List<QuestionDefinition> questions) {

	public QuizDefinition {
		questions = questions == null ? List.of() : List.copyOf(questions);
	}
}
