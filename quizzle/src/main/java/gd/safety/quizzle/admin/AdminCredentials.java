package gd.safety.quizzle.admin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.stereotype.Component;

import gd.safety.quizzle.config.AdminProperties;

@Component
public final class AdminCredentials {

	private final byte[] expectedPassword;

	public AdminCredentials(AdminProperties properties) {
		if (properties.password() == null || properties.password().isBlank()) {
			throw new IllegalStateException("ADMIN_PASSWORD must be set in .env or the process environment");
		}
		expectedPassword = properties.password().getBytes(StandardCharsets.UTF_8);
	}

	public boolean matches(String candidate) {
		byte[] suppliedPassword = candidate == null
				? new byte[0]
				: candidate.getBytes(StandardCharsets.UTF_8);
		return MessageDigest.isEqual(expectedPassword, suppliedPassword);
	}
}
