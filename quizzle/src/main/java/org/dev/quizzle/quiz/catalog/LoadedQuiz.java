package org.dev.quizzle.quiz.catalog;

import org.dev.quizzle.quiz.model.QuizDefinition;

public record LoadedQuiz(String fileName, QuizDefinition quiz) {
}
