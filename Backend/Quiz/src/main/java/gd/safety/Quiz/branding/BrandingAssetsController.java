package gd.safety.Quiz.branding;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.databind.ObjectMapper;

/** Serves the configured branding as the stylesheet and module every page loads. */
@RestController
public final class BrandingAssetsController {

	private static final MediaType JAVASCRIPT = MediaType.parseMediaType("text/javascript;charset=UTF-8");

	private final BrandingCatalog catalog;
	private final ObjectMapper objectMapper;

	public BrandingAssetsController(BrandingCatalog catalog, ObjectMapper objectMapper) {
		this.catalog = catalog;
		this.objectMapper = objectMapper;
	}

	@GetMapping(value = "/assets/branding.css", produces = "text/css")
	public ResponseEntity<String> stylesheet() {
		Branding branding = catalog.branding();
		StringBuilder css = new StringBuilder(":root {\n");
		// Special case to get correct path of mark
		css.append("    --mark: url(\"./images/")
				.append(branding.mark())
				.append("\");\n");
		appendVariable(css, "primary", branding.primary());
		appendVariable(css, "primary-soft", branding.primarySoft());
		appendVariable(css, "accent", branding.accent());
		appendVariable(css, "surface", branding.surface());
		appendVariable(css, "background", branding.background());
		appendVariable(css, "text", branding.text());
		appendVariable(css, "muted", branding.muted());
		appendVariable(css, "border", branding.border());
		appendVariable(css, "danger", branding.danger());
		appendVariable(css, "danger-soft", branding.dangerSoft());
		appendVariable(css, "green", branding.success());
		for (int index = 0; index < branding.answerColors().size(); index++) {
			appendVariable(css, "answer-" + (index + 1), branding.answerColors().get(index));
		}
		css.append("}\n");
		return respond(css.toString(), MediaType.parseMediaType("text/css;charset=UTF-8"));
	}

	@GetMapping(value = "/assets/branding.js", produces = "text/javascript")
	public ResponseEntity<String> module() {
		Branding branding = catalog.branding();
		String json = objectMapper.writeValueAsString(
				new BrandingView(branding.name(), branding.mark()));
		String module = """
				export const branding = %s;

				for (const element of document.querySelectorAll("[data-brand-name]")) {
					element.textContent = branding.name;
				}
				for (const element of document.querySelectorAll("[data-brand-mark]")) {
					element.textContent = branding.mark;
				}
				const pageTitle = document.querySelector("title")?.dataset.pageTitle;
				document.title = pageTitle ? `${pageTitle} \u00b7 ${branding.name}` : branding.name;
				""".formatted(json);
		return respond(module, JAVASCRIPT);
	}

	private void appendVariable(StringBuilder css, String name, String value) {
		css.append('\t').append("--").append(name).append(": ").append(value).append(";\n");
	}

	private ResponseEntity<String> respond(String body, MediaType mediaType) {
		return ResponseEntity.ok()
				.contentType(mediaType)
				.cacheControl(CacheControl.noCache())
				.header("X-Content-Type-Options", "nosniff")
				.body(body);
	}

	private record BrandingView(String name, String mark) {
	}
}
