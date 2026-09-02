package gd.safety.quizzle.quiz.catalog;

import gd.safety.quizzle.quiz.model.QuizDefinition;

public record LoadedQuiz(String fileName, QuizDefinition quiz) {
}
