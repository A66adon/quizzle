package org.dev.quizzle.quiz.catalog;

public final class QuizRevisionConflictException extends RuntimeException {
	private final long currentVersion;
	public QuizRevisionConflictException(long currentVersion) {
		super("Quiz has changed since it was loaded");
		this.currentVersion = currentVersion;
	}
	public long currentVersion() { return currentVersion; }
}
