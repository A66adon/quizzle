package org.dev.quizzle.quiz.catalog;

import java.util.List;

/** Raised when a quiz submitted from the editor fails the same rules the player catalog enforces. */
public final class QuizEditorValidationException extends RuntimeException {

	private final List<String> errors;

	public QuizEditorValidationException(List<String> errors) {
		super("Validation failed: " + String.join("; ", errors));
		this.errors = List.copyOf(errors);
	}

	public List<String> errors() {
		return errors;
	}
}
