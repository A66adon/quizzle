package gd.safety.Quiz.branding;

import java.util.List;

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

	public static final int ANSWER_COLOR_COUNT = 4;

	public Branding {
		answerColors = answerColors == null ? List.of() : List.copyOf(answerColors);
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
				List.of("#c52f42", "#1664ad", "#b28200", "#26824b"));
	}
}
