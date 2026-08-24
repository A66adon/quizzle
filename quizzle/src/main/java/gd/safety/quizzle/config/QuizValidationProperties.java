package gd.safety.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.validation")
public record QuizValidationProperties(
		long maxFileBytes,
		int maxTitleLength,
		int maxDescriptionLength,
		int maxAuthorLength,
		int maxIdLength,
		int maxQuestionTextLength,
		int maxAnswerTextLength,
		int maxQuestions,
		int maxAnswersPerQuestion,
		int maxPoints,
		int maxTimeSeconds) {

	public QuizValidationProperties {
		requirePositive(maxFileBytes, "max-file-bytes");
		requirePositive(maxTitleLength, "max-title-length");
		requirePositive(maxDescriptionLength, "max-description-length");
		requirePositive(maxAuthorLength, "max-author-length");
		requirePositive(maxIdLength, "max-id-length");
		requirePositive(maxQuestionTextLength, "max-question-text-length");
		requirePositive(maxAnswerTextLength, "max-answer-text-length");
		requirePositive(maxQuestions, "max-questions");
		if (maxAnswersPerQuestion < 2) {
			throw new IllegalArgumentException("quiz.validation.max-answers-per-question must be at least 2");
		}
		requirePositive(maxPoints, "max-points");
		requirePositive(maxTimeSeconds, "max-time-seconds");
	}

	private static void requirePositive(long value, String propertyName) {
		if (value <= 0) {
			throw new IllegalArgumentException("quiz.validation." + propertyName + " must be positive");
		}
	}
}
