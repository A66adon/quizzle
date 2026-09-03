package org.dev.quizzle.quiz.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.error.MarkedYAMLException;
import org.yaml.snakeyaml.error.YAMLException;

import org.dev.quizzle.config.QuizValidationProperties;
import org.dev.quizzle.quiz.model.AnswerDefinition;
import org.dev.quizzle.quiz.model.QuestionDefinition;
import org.dev.quizzle.quiz.model.QuizDefinition;

@Component
public final class QuizYamlParser {

	private static final int MAX_REPORTED_STRUCTURE_ERRORS = 30;
	private static final Set<String> QUIZ_FIELDS = Set.of("title", "description", "author", "questions");
	private static final Set<String> QUESTION_FIELDS = Set.of(
			"id", "text", "points", "timeSeconds", "multiple", "answers");
	private static final Set<String> OPTIONAL_QUESTION_FIELDS = Set.of("shuffle_answers");
	private static final Set<String> ANSWER_FIELDS = Set.of("id", "text", "correct");

	private final QuizValidationProperties limits;

	public QuizYamlParser(QuizValidationProperties limits) {
		this.limits = limits;
	}

	public QuizDefinition parse(Path file) throws QuizFileException {
		ensureAllowedSize(file);

		Object document;
		try (InputStream input = Files.newInputStream(file)) {
			document = createYaml().load(input);
		} catch (MarkedYAMLException exception) {
			throw new QuizFileException(formatMarkedError(exception), exception);
		} catch (YAMLException exception) {
			throw new QuizFileException("Malformed YAML: parser rejected the document", exception);
		} catch (IOException exception) {
			throw new QuizFileException("Could not read file", exception);
		}

		List<String> errors = new ArrayList<>();
		Map<String, Object> root = readMap(document, "quiz", errors);
		checkFields(root, QUIZ_FIELDS, Set.of(), "quiz", errors);

		String title = readString(root, "title", "quiz.title", errors);
		String description = readString(root, "description", "quiz.description", errors);
		String author = readString(root, "author", "quiz.author", errors);
		List<QuestionDefinition> questions = readQuestions(root, errors);

		if (!errors.isEmpty()) {
			throw new QuizFileException(formatValidationErrors(errors));
		}
		return new QuizDefinition(title, description, author, questions);
	}

	private Yaml createYaml() {
		LoaderOptions options = new LoaderOptions();
		options.setAllowDuplicateKeys(false);
		options.setMaxAliasesForCollections(0);
		options.setNestingDepthLimit(20);
		options.setCodePointLimit((int) Math.min(limits.maxFileBytes(), Integer.MAX_VALUE));
		return new Yaml(new SafeConstructor(options));
	}

	private void ensureAllowedSize(Path file) throws QuizFileException {
		try {
			long fileSize = Files.size(file);
			if (fileSize > limits.maxFileBytes()) {
				throw new QuizFileException(
						"File is " + fileSize + " bytes; maximum is " + limits.maxFileBytes() + " bytes");
			}
		} catch (IOException exception) {
			throw new QuizFileException("Could not inspect file", exception);
		}
	}

	private List<QuestionDefinition> readQuestions(Map<String, Object> root, List<String> errors) {
		List<?> values = readList(root, "questions", "quiz.questions", errors);
		List<QuestionDefinition> questions = new ArrayList<>(values.size());
		for (int questionIndex = 0; questionIndex < values.size(); questionIndex++) {
			String path = "questions[" + questionIndex + "]";
			Map<String, Object> question = readMap(values.get(questionIndex), path, errors);
			checkFields(question, QUESTION_FIELDS, OPTIONAL_QUESTION_FIELDS, path, errors);

			String id = readString(question, "id", path + ".id", errors);
			String text = readString(question, "text", path + ".text", errors);
			int points = readInteger(question, "points", path + ".points", errors);
			int timeSeconds = readInteger(question, "timeSeconds", path + ".timeSeconds", errors);
			boolean multiple = readBoolean(question, "multiple", path + ".multiple", false, errors);
			boolean shuffleAnswers = readBoolean(
					question, "shuffle_answers", path + ".shuffle_answers", true, errors);
			List<AnswerDefinition> answers = readAnswers(question, path, errors);
			questions.add(new QuestionDefinition(
					id, text, points, timeSeconds, multiple, shuffleAnswers, answers));
		}
		return questions;
	}

	private List<AnswerDefinition> readAnswers(
			Map<String, Object> question,
			String questionPath,
			List<String> errors) {
		String answersPath = questionPath + ".answers";
		List<?> values = readList(question, "answers", answersPath, errors);
		List<AnswerDefinition> answers = new ArrayList<>(values.size());
		for (int answerIndex = 0; answerIndex < values.size(); answerIndex++) {
			String path = answersPath + "[" + answerIndex + "]";
			Map<String, Object> answer = readMap(values.get(answerIndex), path, errors);
			checkFields(answer, ANSWER_FIELDS, Set.of(), path, errors);
			answers.add(new AnswerDefinition(
					readString(answer, "id", path + ".id", errors),
					readString(answer, "text", path + ".text", errors),
					readBoolean(answer, "correct", path + ".correct", false, errors)));
		}
		return answers;
	}

	private Map<String, Object> readMap(Object value, String path, List<String> errors) {
		if (!(value instanceof Map<?, ?> rawMap)) {
			addError(errors, path + " must be an object");
			return Map.of();
		}

		Map<String, Object> map = new LinkedHashMap<>();
		for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
			if (entry.getKey() instanceof String key) {
				map.put(key, entry.getValue());
			} else {
				addError(errors, path + " contains a non-text field name");
			}
		}
		return map;
	}

	private void checkFields(
			Map<String, Object> values,
			Set<String> requiredFields,
			Set<String> optionalFields,
			String path,
			List<String> errors) {
		for (String requiredField : requiredFields) {
			if (!values.containsKey(requiredField)) {
				addError(errors, path + "." + requiredField + " is required");
			}
		}
		for (String field : values.keySet()) {
			if (!requiredFields.contains(field) && !optionalFields.contains(field)) {
				addError(errors, path + "." + field + " is not allowed");
			}
		}
	}

	private String readString(
			Map<String, Object> values,
			String field,
			String path,
			List<String> errors) {
		Object value = values.get(field);
		if (value == null && !values.containsKey(field)) {
			return null;
		}
		if (!(value instanceof String text)) {
			addError(errors, path + " must be text");
			return null;
		}
		return text;
	}

	private int readInteger(
			Map<String, Object> values,
			String field,
			String path,
			List<String> errors) {
		Object value = values.get(field);
		if (value == null && !values.containsKey(field)) {
			return 0;
		}
		if (!(value instanceof Byte || value instanceof Short || value instanceof Integer
				|| value instanceof Long || value instanceof BigInteger)) {
			addError(errors, path + " must be a whole number");
			return 0;
		}
		try {
			return new BigInteger(value.toString()).intValueExact();
		} catch (ArithmeticException exception) {
			addError(errors, path + " is outside the supported whole-number range");
			return 0;
		}
	}

	private boolean readBoolean(
			Map<String, Object> values,
			String field,
			String path,
			boolean defaultValue,
			List<String> errors) {
		Object value = values.get(field);
		if (value == null && !values.containsKey(field)) {
			return defaultValue;
		}
		if (!(value instanceof Boolean booleanValue)) {
			addError(errors, path + " must be true or false");
			return defaultValue;
		}
		return booleanValue;
	}

	private List<?> readList(
			Map<String, Object> values,
			String field,
			String path,
			List<String> errors) {
		Object value = values.get(field);
		if (value == null && !values.containsKey(field)) {
			return List.of();
		}
		if (!(value instanceof List<?> list)) {
			addError(errors, path + " must be a list");
			return List.of();
		}
		return list;
	}

	private void addError(List<String> errors, String error) {
		if (errors.size() < MAX_REPORTED_STRUCTURE_ERRORS) {
			errors.add(error);
		}
	}

	private String formatValidationErrors(List<String> errors) {
		return "Validation failed: " + String.join("; ", errors);
	}

	private String formatMarkedError(MarkedYAMLException exception) {
		String problem = exception.getProblem() == null ? "invalid syntax" : exception.getProblem();
		problem = problem.replaceAll("[\\r\\n\\t]+", " ").strip();
		if (problem.length() > 220) {
			problem = problem.substring(0, 220) + "…";
		}
		if (exception.getProblemMark() == null) {
			return "Malformed YAML: " + problem;
		}
		return "Malformed YAML at line " + (exception.getProblemMark().getLine() + 1)
				+ ", column " + (exception.getProblemMark().getColumn() + 1) + ": " + problem;
	}
}
