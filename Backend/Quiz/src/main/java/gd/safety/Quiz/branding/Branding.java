package gd.safety.Quiz.branding;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Colors and wording that make the quiz look like a specific organisation. */
public record Branding(
		String name,
		String mark,
		String primary,
		String primarySoft,
		String accent,
		String surface,
		String background,
		String text,
		String muted,
		String border,
		String danger,
		String dangerSoft,
		String success,
		List<String> answerColors) {

	public static final int ANSWER_COLOR_COUNT = 6;

	/** How {@link #mark()} should be presented: plain wording, a hosted image file, or a remote image. */
	public enum MarkKind { TEXT, IMAGE_FILE, IMAGE_URL }

	private static final Set<String> IMAGE_EXTENSIONS =
			Set.of(".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp");

	public Branding {
		answerColors = answerColors == null ? List.of() : List.copyOf(answerColors);
	}

	/** Classifies {@link #mark()} without touching the filesystem or network. */
	public MarkKind markKind() {
		if (mark.startsWith("http://") || mark.startsWith("https://")) {
			return MarkKind.IMAGE_URL;
		}
		String lower = mark.toLowerCase(Locale.ROOT);
		for (String extension : IMAGE_EXTENSIONS) {
			if (lower.endsWith(extension)) {
				return MarkKind.IMAGE_FILE;
			}
		}
		return MarkKind.TEXT;
	}

	public static Branding defaults() {
		return new Branding(
				"Safety Quiz",
				"G+D",
				"#040066",
				"#ececff",
				"#00d4ff",
				"#ffffff",
				"#f5f7fb",
				"#17162d",
				"#66687a",
				"#e3e6ef",
				"#a32035",
				"#fff3f5",
				"#13854e",
				List.of("#c52f42", "#1664ad", "#b28200", "#26824b", "#7a3fa0", "#c2660a"));
	}
}
