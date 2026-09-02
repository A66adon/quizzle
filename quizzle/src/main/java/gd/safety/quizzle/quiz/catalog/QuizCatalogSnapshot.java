package gd.safety.quizzle.quiz.catalog;

import java.time.Instant;
import java.util.List;

public record QuizCatalogSnapshot(
		Instant loadedAt,
		List<LoadedQuiz> quizzes,
		List<CatalogIssue> issues) {

	public QuizCatalogSnapshot {
		quizzes = List.copyOf(quizzes);
		issues = List.copyOf(issues);
	}

	public static QuizCatalogSnapshot empty() {
		return new QuizCatalogSnapshot(Instant.EPOCH, List.of(), List.of());
	}
}
