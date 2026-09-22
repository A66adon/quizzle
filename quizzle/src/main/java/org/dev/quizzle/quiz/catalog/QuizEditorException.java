package org.dev.quizzle.quiz.catalog;

/** Raised for editor-facing quiz errors that are not raw YAML/validation failures. */
public final class QuizEditorException extends RuntimeException {

	public QuizEditorException(String message) {
		super(message);
	}
}
