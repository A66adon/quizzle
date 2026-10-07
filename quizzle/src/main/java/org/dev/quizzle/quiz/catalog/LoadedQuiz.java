package org.dev.quizzle.quiz.catalog;

import org.dev.quizzle.quiz.model.QuizDefinition;

public record LoadedQuiz(String fileName, QuizDefinition quiz, String title, String description,
		String author, int questionCount, long version) {
	public LoadedQuiz(String fileName, QuizDefinition quiz) {
		this(fileName, quiz, 1);
	}
	public LoadedQuiz(String fileName, QuizDefinition quiz, long version) {
		this(fileName, quiz, quiz.title(), quiz.description(), quiz.author(), quiz.questions().size(), version);
	}
}
