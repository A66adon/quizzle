package gd.safety.quizzle.branding;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import gd.safety.quizzle.config.BrandingProperties;

class BrandingCatalogTests {

	@TempDir
	Path temporaryDirectory;

	private final BrandingYamlParser parser = new BrandingYamlParser();

	@Test
	void appliesTheConfiguredValuesAndKeepsDefaultsForOmittedOnes() throws Exception {
		write("""
				name: "Acme Quiz"
				colors:
				  primary: "#123456"
				""");

		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();

		Branding branding = catalog.branding();
		assertEquals("Acme Quiz", branding.name());
		assertEquals("#123456", branding.primary());
		assertEquals(Branding.defaults().mark(), branding.mark());
		assertEquals(Branding.defaults().answerColors(), branding.answerColors());
	}

	@Test
	void appliesConfiguredDarkColorsAndKeepsOmittedDarkDefaults() throws Exception {
		write("""
				darkColors:
				  primary: "#abcdef"
				  surfaceRaised: "#123456"
				""");

		Branding branding = parser.parse(temporaryDirectory.resolve("branding.yaml"));

		assertEquals("#abcdef", branding.darkColors().primary());
		assertEquals("#123456", branding.darkColors().surfaceRaised());
		assertEquals(Branding.defaults().darkColors().accent(), branding.darkColors().accent());
	}

	@Test
	void rejectsInvalidDarkColors() throws Exception {
		write("""
				darkColors:
				  focusRing: "transparent"
				""");

		BrandingFileException exception = assertThrows(BrandingFileException.class,
				() -> parser.parse(temporaryDirectory.resolve("branding.yaml")));

		assertTrue(exception.getMessage().contains("branding.darkColors.focusRing"));
	}

	@Test
	void servesParsedDarkColorsAsThemeVariables() throws Exception {
		write("""
				darkColors:
				  background: "#112233"
				  onPrimary: "#ddeeff"
				""");
		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();
		BrandingAssetsController controller = new BrandingAssetsController(catalog, null);

		String stylesheet = controller.stylesheet().getBody();

		assertNotNull(stylesheet);
		assertTrue(stylesheet.contains(":root[data-theme=\"dark\"]"));
		assertTrue(stylesheet.contains("--background: #112233;"));
		assertTrue(stylesheet.contains("--on-primary: #ddeeff;"));
	}

	@Test
	void fallsBackToDefaultsWhenTheFileIsMissingOrRejected() throws Exception {
		BrandingCatalog missing = createCatalog();
		missing.loadAtStartup();
		assertEquals(Branding.defaults(), missing.branding());

		write("""
				name: "Acme Quiz"
				colors:
				  primary: "not-a-color"
				""");
		BrandingCatalog rejected = createCatalog();
		rejected.loadAtStartup();
		assertEquals(Branding.defaults(), rejected.branding());
	}

	@Test
	void refusesWordingThatWouldLeakIntoGeneratedAssets() throws IOException {
		write("""
				name: "</style><script>"
				""");

		BrandingFileException exception = assertThrows(BrandingFileException.class,
				() -> parser.parse(temporaryDirectory.resolve("branding.yaml")));
		assertTrue(exception.getMessage().contains("not allowed"));
	}

	@Test
	void resolvesAMarkImageThatSitsNextToTheBrandingFile() throws Exception {
		write("""
				mark: "logo.png"
				""");
		Files.write(temporaryDirectory.resolve("logo.png"), new byte[] { 1, 2, 3 });

		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();

		assertEquals(Branding.MarkKind.IMAGE_FILE, catalog.branding().markKind());
		assertEquals(temporaryDirectory.resolve("logo.png"), catalog.markImageFile().orElseThrow());
	}

	@Test
	void fallsBackWhenTheMarkImageIsMissing() throws Exception {
		write("""
				mark: "missing-logo.png"
				""");

		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();

		assertEquals(Branding.MarkKind.IMAGE_FILE, catalog.branding().markKind());
		assertTrue(catalog.markImageFile().isEmpty());
	}

	@Test
	void refusesToResolveAMarkImageOutsideTheBrandingDirectory() throws Exception {
		write("""
				mark: "../escape.png"
				""");

		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();

		assertTrue(catalog.markImageFile().isEmpty());
	}

	@Test
	void treatsAnHttpUrlAsAnImageMark() throws Exception {
		write("""
				mark: "https://example.com/logo.png"
				""");

		BrandingCatalog catalog = createCatalog();
		catalog.loadAtStartup();

		assertEquals(Branding.MarkKind.IMAGE_URL, catalog.branding().markKind());
	}

	private BrandingCatalog createCatalog() {
		return new BrandingCatalog(
				new BrandingProperties(temporaryDirectory, "branding.yaml"), parser);
	}

	private void write(String yaml) throws IOException {
		Files.writeString(temporaryDirectory.resolve("branding.yaml"), yaml, StandardCharsets.UTF_8);
	}
}
