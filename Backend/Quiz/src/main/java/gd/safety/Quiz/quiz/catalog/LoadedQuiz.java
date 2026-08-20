package gd.safety.Quiz.quiz.catalog;

import gd.safety.Quiz.quiz.model.QuizDefinition;

public record LoadedQuiz(String fileName, QuizDefinition quiz) {
}
