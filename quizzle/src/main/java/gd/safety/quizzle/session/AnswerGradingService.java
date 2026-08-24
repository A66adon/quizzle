package gd.safety.quizzle.session;

import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import gd.safety.quizzle.quiz.model.QuestionDefinition;

@Component
public final class AnswerGradingService {

	private static final int POINT_STEP = 10;

	public Grade grade(QuestionDefinition question, Set<String> selectedAnswerIds, long elapsedMs) {
		Set<String> availableAnswerIds = question.answers().stream()
				.map(answer -> answer.id())
				.collect(Collectors.toUnmodifiableSet());
		if (!availableAnswerIds.containsAll(selectedAnswerIds)) {
			throw new InvalidAnswerSelectionException();
		}

		Set<String> correctAnswerIds = question.answers().stream()
				.filter(answer -> answer.correct())
				.map(answer -> answer.id())
				.collect(Collectors.toUnmodifiableSet());
		boolean fullyCorrect = !selectedAnswerIds.isEmpty() && selectedAnswerIds.equals(correctAnswerIds);
		if (!fullyCorrect) {
			return new Grade(false, 0);
		}

		long durationMs = question.timeSeconds() * 1_000L;
		long remainingMs = Math.max(0, durationMs - elapsedMs);
		double rawPoints = ((double) question.points() * remainingMs) / durationMs;
		double steppedPoints = Math.round(rawPoints / POINT_STEP) * (double) POINT_STEP;
		return new Grade(true, Math.min(question.points(), steppedPoints));
	}

	public record Grade(boolean fullyCorrect, double awardedPoints) {
	}

	public static final class InvalidAnswerSelectionException extends RuntimeException {

		public InvalidAnswerSelectionException() {
			super("The answer contains an option that does not belong to this question.");
		}
	}
}

