package org.dev.quizzle.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

public final class DotEnvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	private static final String PROPERTY_SOURCE_NAME = "localDotEnv";
	private static final Pattern KEY_PATTERN = Pattern.compile("[A-Za-z_][A-Za-z0-9_.-]*");

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path dotEnvPath = Path.of(System.getProperty("user.dir"), ".env").toAbsolutePath().normalize();
		if (!Files.isRegularFile(dotEnvPath)) {
			return;
		}

		Map<String, Object> values = readValues(dotEnvPath);
		if (values.isEmpty()) {
			return;
		}

		MapPropertySource propertySource = new MapPropertySource(PROPERTY_SOURCE_NAME, values);
		if (environment.getPropertySources().contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
			environment.getPropertySources().addAfter(
					StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
					propertySource);
		} else {
			environment.getPropertySources().addFirst(propertySource);
		}
	}

	private Map<String, Object> readValues(Path dotEnvPath) {
		List<String> lines;
		try {
			lines = Files.readAllLines(dotEnvPath, StandardCharsets.UTF_8);
		} catch (IOException exception) {
			throw new IllegalStateException("Could not read .env configuration", exception);
		}

		Map<String, Object> values = new LinkedHashMap<>();
		for (int index = 0; index < lines.size(); index++) {
			String line = stripByteOrderMark(lines.get(index), index).strip();
			if (line.isEmpty() || line.startsWith("#")) {
				continue;
			}

			if (line.startsWith("export ")) {
				line = line.substring("export ".length()).stripLeading();
			}

			int separatorIndex = line.indexOf('=');
			if (separatorIndex < 1) {
				throw malformedLine(index);
			}

			String key = line.substring(0, separatorIndex).strip();
			if (!KEY_PATTERN.matcher(key).matches()) {
				throw malformedLine(index);
			}

			String rawValue = line.substring(separatorIndex + 1).strip();
			values.put(key, parseValue(rawValue, index));
		}
		return values;
	}

	private String parseValue(String rawValue, int lineIndex) {
		if (rawValue.isEmpty()) {
			return "";
		}

		char quote = rawValue.charAt(0);
		if (quote != '\'' && quote != '"') {
			return rawValue;
		}
		if (rawValue.length() < 2 || rawValue.charAt(rawValue.length() - 1) != quote) {
			throw malformedLine(lineIndex);
		}

		String value = rawValue.substring(1, rawValue.length() - 1);
		return quote == '"' ? decodeDoubleQuotedValue(value, lineIndex) : value;
	}

	private String decodeDoubleQuotedValue(String value, int lineIndex) {
		StringBuilder decoded = new StringBuilder(value.length());
		for (int index = 0; index < value.length(); index++) {
			char character = value.charAt(index);
			if (character != '\\') {
				decoded.append(character);
				continue;
			}
			if (++index >= value.length()) {
				throw malformedLine(lineIndex);
			}

			decoded.append(switch (value.charAt(index)) {
				case 'n' -> '\n';
				case 'r' -> '\r';
				case 't' -> '\t';
				case '\\' -> '\\';
				case '"' -> '"';
				default -> value.charAt(index);
			});
		}
		return decoded.toString();
	}

	private String stripByteOrderMark(String line, int lineIndex) {
		return lineIndex == 0 && line.startsWith("\uFEFF") ? line.substring(1) : line;
	}

	private IllegalStateException malformedLine(int lineIndex) {
		return new IllegalStateException("Malformed .env configuration at line " + (lineIndex + 1));
	}
}
