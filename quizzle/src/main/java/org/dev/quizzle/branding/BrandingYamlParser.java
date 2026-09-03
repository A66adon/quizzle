package org.dev.quizzle.branding;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.error.MarkedYAMLException;
import org.yaml.snakeyaml.error.YAMLException;

@Component
public final class BrandingYamlParser {

	private static final long MAX_FILE_BYTES = 32_768;
	private static final int MAX_NAME_LENGTH = 60;
	// Long enough for an image filename or a short logo URL, in addition to plain wording.
	private static final int MAX_MARK_LENGTH = 200;
	private static final Pattern COLOR = Pattern.compile("#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})");
	// Wording ends up in generated CSS and JavaScript, so quoting and markup characters are refused.
	private static final Pattern FORBIDDEN_IN_TEXT = Pattern.compile("[<>&\"'\\\\\\u0000-\\u001f\\u007f]");
	private static final Set<String> ROOT_FIELDS = Set.of(
			"name", "mark", "colors", "darkColors", "answerColors");
	private static final Set<String> COLOR_FIELDS = Set.of(
			"primary", "primarySoft", "accent", "surface", "background",
			"text", "muted", "border", "danger", "dangerSoft", "success");
	private static final Set<String> DARK_COLOR_FIELDS = Set.of(
			"primary", "primaryHover", "primarySoft", "accent", "surface", "surfaceRaised",
			"background", "text", "heading", "muted", "border", "controlBorder", "danger",
			"dangerSoft", "success", "onPrimary", "onAccent", "onDanger", "focusRing",
			"disabledSurface", "disabledText", "qrSurface", "shadow");

	public Branding parse(Path file) throws BrandingFileException {
		ensureAllowedSize(file);

		Object document;
		try (InputStream input = Files.newInputStream(file)) {
			document = createYaml().load(input);
		} catch (MarkedYAMLException exception) {
			throw new BrandingFileException("Malformed YAML in line "
					+ (exception.getProblemMark() == null ? "?" : exception.getProblemMark().getLine() + 1),
					exception);
		} catch (YAMLException exception) {
			throw new BrandingFileException("Malformed YAML: parser rejected the document", exception);
		} catch (IOException exception) {
			throw new BrandingFileException("Could not read file", exception);
		}

		Branding defaults = Branding.defaults();
		List<String> errors = new ArrayList<>();
		Map<String, Object> root = readMap(document, "branding", errors);
		checkFields(root, ROOT_FIELDS, "branding", errors);
		Map<String, Object> colors = root.containsKey("colors")
				? readMap(root.get("colors"), "branding.colors", errors)
				: Map.of();
		checkFields(colors, COLOR_FIELDS, "branding.colors", errors);
		Map<String, Object> darkColors = root.containsKey("darkColors")
				? readMap(root.get("darkColors"), "branding.darkColors", errors)
				: Map.of();
		checkFields(darkColors, DARK_COLOR_FIELDS, "branding.darkColors", errors);

		Branding branding = new Branding(
				readText(root, "name", MAX_NAME_LENGTH, defaults.name(), errors),
				readText(root, "mark", MAX_MARK_LENGTH, defaults.mark(), errors),
				readColor(colors, "primary", defaults.primary(), errors),
				readColor(colors, "primarySoft", defaults.primarySoft(), errors),
				readColor(colors, "accent", defaults.accent(), errors),
				readColor(colors, "surface", defaults.surface(), errors),
				readColor(colors, "background", defaults.background(), errors),
				readColor(colors, "text", defaults.text(), errors),
				readColor(colors, "muted", defaults.muted(), errors),
				readColor(colors, "border", defaults.border(), errors),
				readColor(colors, "danger", defaults.danger(), errors),
				readColor(colors, "dangerSoft", defaults.dangerSoft(), errors),
				readColor(colors, "success", defaults.success(), errors),
				readDarkColors(darkColors, defaults.darkColors(), errors),
				readAnswerColors(root, defaults.answerColors(), errors));

		if (!errors.isEmpty()) {
			throw new BrandingFileException(String.join("; ", errors));
		}
		return branding;
	}

	private Branding.DarkColors readDarkColors(
			Map<String, Object> colors,
			Branding.DarkColors defaults,
			List<String> errors) {
		return new Branding.DarkColors(
				readDarkColor(colors, "primary", defaults.primary(), errors),
				readDarkColor(colors, "primaryHover", defaults.primaryHover(), errors),
				readDarkColor(colors, "primarySoft", defaults.primarySoft(), errors),
				readDarkColor(colors, "accent", defaults.accent(), errors),
				readDarkColor(colors, "surface", defaults.surface(), errors),
				readDarkColor(colors, "surfaceRaised", defaults.surfaceRaised(), errors),
				readDarkColor(colors, "background", defaults.background(), errors),
				readDarkColor(colors, "text", defaults.text(), errors),
				readDarkColor(colors, "heading", defaults.heading(), errors),
				readDarkColor(colors, "muted", defaults.muted(), errors),
				readDarkColor(colors, "border", defaults.border(), errors),
				readDarkColor(colors, "controlBorder", defaults.controlBorder(), errors),
				readDarkColor(colors, "danger", defaults.danger(), errors),
				readDarkColor(colors, "dangerSoft", defaults.dangerSoft(), errors),
				readDarkColor(colors, "success", defaults.success(), errors),
				readDarkColor(colors, "onPrimary", defaults.onPrimary(), errors),
				readDarkColor(colors, "onAccent", defaults.onAccent(), errors),
				readDarkColor(colors, "onDanger", defaults.onDanger(), errors),
				readDarkColor(colors, "focusRing", defaults.focusRing(), errors),
				readDarkColor(colors, "disabledSurface", defaults.disabledSurface(), errors),
				readDarkColor(colors, "disabledText", defaults.disabledText(), errors),
				readDarkColor(colors, "qrSurface", defaults.qrSurface(), errors),
				readDarkColor(colors, "shadow", defaults.shadow(), errors));
	}

	private Yaml createYaml() {
		LoaderOptions options = new LoaderOptions();
		options.setAllowDuplicateKeys(false);
		options.setMaxAliasesForCollections(0);
		options.setNestingDepthLimit(10);
		options.setCodePointLimit((int) MAX_FILE_BYTES);
		return new Yaml(new SafeConstructor(options));
	}

	private void ensureAllowedSize(Path file) throws BrandingFileException {
		try {
			long fileSize = Files.size(file);
			if (fileSize > MAX_FILE_BYTES) {
				throw new BrandingFileException(
						"File is " + fileSize + " bytes; maximum is " + MAX_FILE_BYTES + " bytes");
			}
		} catch (IOException exception) {
			throw new BrandingFileException("Could not inspect file", exception);
		}
	}

	private List<String> readAnswerColors(
			Map<String, Object> root,
			List<String> fallback,
			List<String> errors) {
		Object value = root.get("answerColors");
		if (value == null) {
			return fallback;
		}
		if (!(value instanceof List<?> values) || values.size() != Branding.ANSWER_COLOR_COUNT) {
			errors.add("branding.answerColors must list exactly "
					+ Branding.ANSWER_COLOR_COUNT + " colors");
			return fallback;
		}
		List<String> answerColors = new ArrayList<>(values.size());
		for (int index = 0; index < values.size(); index++) {
			String path = "branding.answerColors[" + index + "]";
			if (values.get(index) instanceof String color && COLOR.matcher(color).matches()) {
				answerColors.add(color);
			} else {
				errors.add(path + " must be a hex color such as #1664ad");
				answerColors.add(fallback.get(index));
			}
		}
		return answerColors;
	}

	private String readColor(
			Map<String, Object> colors,
			String field,
			String fallback,
			List<String> errors) {
		Object value = colors.get(field);
		if (value == null) {
			return fallback;
		}
		if (value instanceof String color && COLOR.matcher(color).matches()) {
			return color;
		}
		errors.add("branding.colors." + field + " must be a hex color such as #1664ad");
		return fallback;
	}

	private String readDarkColor(
			Map<String, Object> colors,
			String field,
			String fallback,
			List<String> errors) {
		Object value = colors.get(field);
		if (value == null) {
			return fallback;
		}
		if (value instanceof String color && COLOR.matcher(color).matches()) {
			return color;
		}
		errors.add("branding.darkColors." + field + " must be a hex color such as #1664ad");
		return fallback;
	}

	private String readText(
			Map<String, Object> root,
			String field,
			int maxLength,
			String fallback,
			List<String> errors) {
		Object value = root.get(field);
		if (value == null) {
			return fallback;
		}
		if (!(value instanceof String text) || text.isBlank()) {
			errors.add("branding." + field + " must be non-empty text");
			return fallback;
		}
		if (text.length() > maxLength) {
			errors.add("branding." + field + " is longer than " + maxLength + " characters");
			return fallback;
		}
		if (FORBIDDEN_IN_TEXT.matcher(text).find()) {
			errors.add("branding." + field + " contains characters that are not allowed");
			return fallback;
		}
		return text;
	}

	private Map<String, Object> readMap(Object value, String path, List<String> errors) {
		if (value == null) {
			errors.add(path + " is empty");
			return Map.of();
		}
		if (!(value instanceof Map<?, ?> rawMap)) {
			errors.add(path + " must be an object");
			return Map.of();
		}
		Map<String, Object> map = new LinkedHashMap<>();
		for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
			if (entry.getKey() instanceof String key) {
				map.put(key, entry.getValue());
			} else {
				errors.add(path + " contains a non-text field name");
			}
		}
		return map;
	}

	private void checkFields(
			Map<String, Object> values,
			Set<String> allowedFields,
			String path,
			List<String> errors) {
		for (String field : values.keySet()) {
			if (!allowedFields.contains(field)) {
				errors.add(path + "." + field + " is not allowed");
			}
		}
	}
}
