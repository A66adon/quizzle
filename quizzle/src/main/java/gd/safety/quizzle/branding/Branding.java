package gd.safety.quizzle.branding;

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
		DarkColors darkColors,
		List<String> answerColors) {

	public static final int ANSWER_COLOR_COUNT = 6;

	/** How {@link #mark()} should be presented: plain wording, a hosted image file, or a remote image. */
	public enum MarkKind { TEXT, IMAGE_FILE, IMAGE_URL }

	/** Semantic colors used when the user selects the dark theme. */
	public record DarkColors(
			String primary,
			String primaryHover,
			String primarySoft,
			String accent,
			String surface,
			String surfaceRaised,
			String background,
			String text,
			String heading,
			String muted,
			String border,
			String controlBorder,
			String danger,
			String dangerSoft,
			String success,
			String onPrimary,
			String onAccent,
			String onDanger,
			String focusRing,
			String disabledSurface,
			String disabledText,
			String qrSurface,
			String shadow) {
	}

	private static final Set<String> IMAGE_EXTENSIONS =
			Set.of(".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp");

	public Branding {
		darkColors = darkColors == null ? defaultDarkColors() : darkColors;
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
				"Quizzle",
				"qizzle.svg",
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
				defaultDarkColors(),
				List.of("#c52f42", "#1664ad", "#b28200", "#26824b", "#7a3fa0", "#c2660a"));
	}

	private static DarkColors defaultDarkColors() {
		return new DarkColors(
				"#a9c9ff",
				"#c2d9ff",
				"#293549",
				"#00d4ff",
				"#141d2b",
				"#1a2637",
				"#090f19",
				"#e9eff8",
				"#f6f8fc",
				"#a7b3c6",
				"#2d3a50",
				"#53657f",
				"#ff9cac",
				"#3b1f31",
				"#7ae3ac",
				"#081221",
				"#071622",
				"#2b0e14",
				"#38ddff",
				"#2b3545",
				"#8290a5",
				"#ffffff",
				"#000000");
	}
}
