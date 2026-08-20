package gd.safety.Quiz.admin;

import java.util.List;

import gd.safety.Quiz.quiz.catalog.QuizCatalogSnapshot;

public record AdminCatalogResponse(
		long loadedAtEpochMs,
		List<QuizSummary> quizzes,
		List<QuizIssue> issues) {

	public AdminCatalogResponse {
		quizzes = List.copyOf(quizzes);
		issues = List.copyOf(issues);
	}

	public static AdminCatalogResponse from(QuizCatalogSnapshot snapshot) {
		List<QuizSummary> quizSummaries = snapshot.quizzes().stream()
				.map(loadedQuiz -> new QuizSummary(
						loadedQuiz.fileName(),
						loadedQuiz.quiz().title(),
						loadedQuiz.quiz().description(),
						loadedQuiz.quiz().author(),
						loadedQuiz.quiz().questions().size()))
				.toList();
		List<QuizIssue> quizIssues = snapshot.issues().stream()
				.map(issue -> new QuizIssue(issue.fileName(), issue.reason()))
				.toList();
		return new AdminCatalogResponse(snapshot.loadedAt().toEpochMilli(), quizSummaries, quizIssues);
	}

	public record QuizSummary(
			String fileName,
			String title,
			String description,
			String author,
			int questionCount) {
	}

	public record QuizIssue(String fileName, String reason) {
	}
}
