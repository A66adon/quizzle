package org.dev.quizzle.quiz.catalog;

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

/** Produces portable YAML exports in the same shape the import parser reads. */
@Component
public final class QuizYamlWriter {

	public String write(QuizDefinition quiz) {
		Map<String, Object> root = new LinkedHashMap<>();
		root.put("title", quiz.title());
		root.put("description", quiz.description());
		root.put("author", quiz.author());
		root.put("questions", toQuestionMaps(quiz.questions()));

		return createDumperYaml().dump(root);
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
