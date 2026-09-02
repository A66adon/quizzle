package gd.safety.quizzle.branding;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Optional;

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
		markImageUrl(branding).ifPresent(url -> css.append("\t--mark: url(\"").append(url).append("\");\n"));
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
		// Raw brand hues kept under their own names so the dark theme (theme.css) can derive readable
		// foreground colours from them without redefining a token in terms of itself.
		appendVariable(css, "brand-primary", branding.primary());
		appendVariable(css, "brand-accent", branding.accent());
		appendVariable(css, "brand-danger", branding.danger());
		appendVariable(css, "brand-success", branding.success());
		for (int index = 0; index < branding.answerColors().size(); index++) {
			appendVariable(css, "answer-" + (index + 1), branding.answerColors().get(index));
		}
		css.append("}\n\n:root[data-theme=\"dark\"] {\n");
		Branding.DarkColors dark = branding.darkColors();
		appendVariable(css, "primary", dark.primary());
		appendVariable(css, "primary-hover", dark.primaryHover());
		appendVariable(css, "primary-soft", dark.primarySoft());
		appendVariable(css, "accent", dark.accent());
		appendVariable(css, "surface", dark.surface());
		appendVariable(css, "surface-raised", dark.surfaceRaised());
		appendVariable(css, "background", dark.background());
		appendVariable(css, "text", dark.text());
		appendVariable(css, "heading", dark.heading());
		appendVariable(css, "muted", dark.muted());
		appendVariable(css, "border", dark.border());
		appendVariable(css, "control-border", dark.controlBorder());
		appendVariable(css, "danger", dark.danger());
		appendVariable(css, "danger-soft", dark.dangerSoft());
		appendVariable(css, "green", dark.success());
		appendVariable(css, "on-primary", dark.onPrimary());
		appendVariable(css, "on-accent", dark.onAccent());
		appendVariable(css, "on-danger", dark.onDanger());
		appendVariable(css, "focus-ring", dark.focusRing());
		appendVariable(css, "disabled-surface", dark.disabledSurface());
		appendVariable(css, "disabled-text", dark.disabledText());
		appendVariable(css, "qr-surface", dark.qrSurface());
		appendVariable(css, "dark-shadow", dark.shadow());
		css.append("\t--shadow: 0 20px 48px color-mix(in srgb, var(--dark-shadow) 32%, transparent);\n");
		css.append("}\n");
		return respond(css.toString(), MediaType.parseMediaType("text/css;charset=UTF-8"));
	}

	@GetMapping(value = "/assets/branding.js", produces = "text/javascript")
	public ResponseEntity<String> module() {
		Branding branding = catalog.branding();
		boolean markIsImage = markImageUrl(branding).isPresent();
		String json = objectMapper.writeValueAsString(
				new BrandingView(branding.name(), branding.mark(), markIsImage));
		String module = """
				export const branding = %s;

				for (const element of document.querySelectorAll("[data-brand-name]")) {
					element.textContent = branding.name;
				}
				for (const element of document.querySelectorAll("[data-brand-mark]")) {
					if (branding.markIsImage) {
						element.classList.add("brand-mark--image");
					} else {
						element.textContent = branding.mark;
					}
				}
				const pageTitle = document.querySelector("title")?.dataset.pageTitle;
				document.title = pageTitle ? `${pageTitle} \u00b7 ${branding.name}` : branding.name;
				""".formatted(json);
		return respond(module, JAVASCRIPT);
	}

	@GetMapping("/assets/branding-mark")
	public ResponseEntity<byte[]> markImage() throws IOException {
		Path file = catalog.markImageFile().orElse(null);
		if (file == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok()
				.contentType(mediaTypeForImage(file))
				.cacheControl(CacheControl.noCache())
				.header("X-Content-Type-Options", "nosniff")
				.body(Files.readAllBytes(file));
	}

	/** The URL to use for the CSS {@code --mark} variable, absent when the mark is plain text. */
	private Optional<String> markImageUrl(Branding branding) {
		return switch (branding.markKind()) {
			case IMAGE_URL -> Optional.of(branding.mark());
			case IMAGE_FILE -> catalog.markImageFile().isPresent()
					? Optional.of("/assets/branding-mark")
					: Optional.empty();
			case TEXT -> Optional.empty();
		};
	}

	private MediaType mediaTypeForImage(Path file) {
		String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
		if (name.endsWith(".png")) {
			return MediaType.IMAGE_PNG;
		}
		if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
			return MediaType.IMAGE_JPEG;
		}
		if (name.endsWith(".gif")) {
			return MediaType.IMAGE_GIF;
		}
		if (name.endsWith(".svg")) {
			return MediaType.parseMediaType("image/svg+xml");
		}
		if (name.endsWith(".webp")) {
			return MediaType.parseMediaType("image/webp");
		}
		return MediaType.APPLICATION_OCTET_STREAM;
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

	private record BrandingView(String name, String mark, boolean markIsImage) {
	}
}
