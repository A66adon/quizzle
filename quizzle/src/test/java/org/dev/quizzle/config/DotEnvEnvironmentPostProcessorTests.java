package org.dev.quizzle.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.ResourceLock;
import org.springframework.core.env.StandardEnvironment;

class DotEnvEnvironmentPostProcessorTests {

	@TempDir
	Path temporaryDirectory;

	@Test
	@ResourceLock("system-properties")
	void loadsDotEnvValuesWhileKeepingSystemPropertiesHigherPriority() throws IOException {
		Files.writeString(temporaryDirectory.resolve(".env"), """
				# Local configuration
				ADMIN_PASSWORD="quoted local secret"
				export QUIZ_FOLDER='./custom quizzes'
				DOT_ENV_PRECEDENCE=from-file
				""", StandardCharsets.UTF_8);

		String originalUserDirectory = System.getProperty("user.dir");
		String originalPrecedence = System.getProperty("DOT_ENV_PRECEDENCE");
		try {
			System.setProperty("user.dir", temporaryDirectory.toString());
			System.setProperty("DOT_ENV_PRECEDENCE", "from-system");
			StandardEnvironment environment = new StandardEnvironment();

			new DotEnvEnvironmentPostProcessor().postProcessEnvironment(environment, null);

			assertEquals("quoted local secret", environment.getProperty("ADMIN_PASSWORD"));
			assertEquals("./custom quizzes", environment.getProperty("QUIZ_FOLDER"));
			assertEquals("from-system", environment.getProperty("DOT_ENV_PRECEDENCE"));
		} finally {
			restoreSystemProperty("user.dir", originalUserDirectory);
			restoreSystemProperty("DOT_ENV_PRECEDENCE", originalPrecedence);
		}
	}

	@Test
	@ResourceLock("system-properties")
	void malformedErrorsNeverContainTheSecretValue() throws IOException {
		String privateValue = "must-never-appear-in-an-error";
		Files.writeString(
				temporaryDirectory.resolve(".env"),
				"ADMIN_PASSWORD=\"" + privateValue,
				StandardCharsets.UTF_8);

		String originalUserDirectory = System.getProperty("user.dir");
		try {
			System.setProperty("user.dir", temporaryDirectory.toString());
			IllegalStateException exception = assertThrows(
					IllegalStateException.class,
					() -> new DotEnvEnvironmentPostProcessor().postProcessEnvironment(
							new StandardEnvironment(), null));

			assertEquals("Malformed .env configuration at line 1", exception.getMessage());
			assertFalse(exception.getMessage().contains(privateValue));
		} finally {
			restoreSystemProperty("user.dir", originalUserDirectory);
		}
	}

	private void restoreSystemProperty(String key, String value) {
		if (value == null) {
			System.clearProperty(key);
		} else {
			System.setProperty(key, value);
		}
	}
}
