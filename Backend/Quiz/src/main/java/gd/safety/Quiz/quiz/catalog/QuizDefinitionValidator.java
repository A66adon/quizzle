package gd.safety.Quiz.quiz.catalog;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import gd.safety.Quiz.config.QuizValidationProperties;
import gd.safety.Quiz.quiz.model.AnswerDefinition;
import gd.safety.Quiz.quiz.model.QuestionDefinition;
import gd.safety.Quiz.quiz.model.QuizDefinition;

@Component
public final class QuizDefinitionValidator {

	private static final int MAX_REPORTED_ERRORS = 50;

	private final QuizValidationProperties limits;

	public QuizDefinitionValidator(QuizValidationProperties limits) {
		this.limits = limits;
	}

	public List<String> validate(QuizDefinition quiz) {
		List<String> errors = new ArrayList<>();
		validateRequiredText(quiz.title(), "title", limits.maxTitleLength(), errors);
		validateRequiredText(quiz.description(), "description", limits.maxDescriptionLength(), errors);
		validateRequiredText(quiz.author(), "author", limits.maxAuthorLength(), errors);

		if (quiz.questions().isEmpty()) {
			addError(errors, "questions must contain at least one question");
		}
		if (quiz.questions().size() > limits.maxQuestions()) {
			addError(errors, "questions contains " + quiz.questions().size()
					+ " entries; maximum is " + limits.maxQuestions());
		}

		Set<String> questionIds = new HashSet<>();
		for (int questionIndex = 0; questionIndex < quiz.questions().size(); questionIndex++) {
			validateQuestion(quiz.questions().get(questionIndex), questionIndex, questionIds, errors);
		}
		return List.copyOf(errors);
	}

	private void validateQuestion(
			QuestionDefinition question,
			int questionIndex,
			Set<String> questionIds,
			List<String> errors) {
		String path = "questions[" + questionIndex + "]";
		validateId(question.id(), path + ".id", questionIds, "question", errors);
		validateRequiredText(question.text(), path + ".text", limits.maxQuestionTextLength(), errors);
		validatePositiveBound(question.points(), path + ".points", limits.maxPoints(), errors);
		validatePositiveBound(question.timeSeconds(), path + ".timeSeconds", limits.maxTimeSeconds(), errors);

		if (question.answers().size() < 2) {
			addError(errors, path + ".answers must contain at least two answers");
		}
		if (question.answers().size() > limits.maxAnswersPerQuestion()) {
			addError(errors, path + ".answers contains " + question.answers().size()
					+ " entries; maximum is " + limits.maxAnswersPerQuestion());
		}

		int correctAnswerCount = 0;
		Set<String> answerIds = new HashSet<>();
		for (int answerIndex = 0; answerIndex < question.answers().size(); answerIndex++) {
			AnswerDefinition answer = question.answers().get(answerIndex);
			String answerPath = path + ".answers[" + answerIndex + "]";
			validateId(answer.id(), answerPath + ".id", answerIds, "answer", errors);
			validateRequiredText(answer.text(), answerPath + ".text", limits.maxAnswerTextLength(), errors);
			if (answer.correct()) {
				correctAnswerCount++;
			}
		}

		if (correctAnswerCount == 0) {
			addError(errors, path + ".answers must contain at least one correct answer");
		}
		if (!question.multiple() && correctAnswerCount != 1) {
			addError(errors, path + " has multiple=false and must contain exactly one correct answer");
		}
	}

	private void validateId(
			String value,
			String path,
			Set<String> seenIds,
			String idType,
			List<String> errors) {
		if (!validateRequiredText(value, path, limits.maxIdLength(), errors)) {
			return;
		}
		if (!value.equals(value.strip())) {
			addError(errors, path + " must not start or end with whitespace");
		}
		if (!seenIds.add(value)) {
			addError(errors, path + " duplicates " + idType + " id '" + value + "'");
		}
	}

	private boolean validateRequiredText(
			String value,
			String path,
			int maximumLength,
			List<String> errors) {
		if (value == null || value.isBlank()) {
			addError(errors, path + " must not be blank");
			return false;
		}

		int length = value.codePointCount(0, value.length());
		if (length > maximumLength) {
			addError(errors, path + " is " + length + " characters; maximum is " + maximumLength);
			return false;
		}
		return true;
	}

	private void validatePositiveBound(int value, String path, int maximum, List<String> errors) {
		if (value <= 0) {
			addError(errors, path + " must be positive");
		} else if (value > maximum) {
			addError(errors, path + " is " + value + "; maximum is " + maximum);
		}
	}

	private void addError(List<String> errors, String error) {
		if (errors.size() < MAX_REPORTED_ERRORS) {
			errors.add(error);
		}
	}
}
