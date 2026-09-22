package org.dev.quizzle.quiz.catalog;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.representer.Representer;

import org.dev.quizzle.quiz.model.AnswerDefinition;
import org.dev.quizzle.quiz.model.QuestionDefinition;
import org.dev.quizzle.quiz.model.QuizDefinition;

/**
 * Writes a {@link QuizDefinition} back to the same YAML shape {@link QuizYamlParser} reads, so
 * quizzes built in the editor are indistinguishable from hand-written quiz files.
 */
@Component
public final class QuizYamlWriter {

	public void write(Path file, QuizDefinition quiz) {
		Map<String, Object> root = new LinkedHashMap<>();
		root.put("title", quiz.title());
		root.put("description", quiz.description());
		root.put("author", quiz.author());
		root.put("questions", toQuestionMaps(quiz.questions()));

		try {
			Path parent = file.toAbsolutePath().normalize().getParent();
			if (parent != null) {
				Files.createDirectories(parent);
			}
			Path tempFile = file.resolveSibling(file.getFileName() + ".tmp");
			try (var output = Files.newOutputStream(tempFile)) {
				createDumperYaml().dump(root, new OutputStreamWriter(output, StandardCharsets.UTF_8));
			}
			Files.move(tempFile, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
		} catch (IOException exception) {
			throw new QuizEditorException("Could not write quiz file: " + exception.getMessage());
		}
	}

	private List<Map<String, Object>> toQuestionMaps(List<QuestionDefinition> questions) {
		List<Map<String, Object>> result = new ArrayList<>(questions.size());
		for (QuestionDefinition question : questions) {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("id", question.id());
			map.put("text", question.text());
			map.put("points", question.points());
			map.put("timeSeconds", question.timeSeconds());
			map.put("multiple", question.multiple());
			map.put("shuffle_answers", question.shuffleAnswers());
			map.put("answers", toAnswerMaps(question.answers()));
			result.add(map);
		}
		return result;
	}

	private List<Map<String, Object>> toAnswerMaps(List<AnswerDefinition> answers) {
		List<Map<String, Object>> result = new ArrayList<>(answers.size());
		for (AnswerDefinition answer : answers) {
			Map<String, Object> map = new LinkedHashMap<>();
			map.put("id", answer.id());
			map.put("text", answer.text());
			map.put("correct", answer.correct());
			result.add(map);
		}
		return result;
	}

	private Yaml createDumperYaml() {
		DumperOptions options = new DumperOptions();
		options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
		options.setPrettyFlow(true);
		return new Yaml(new Representer(options), options);
	}
}
