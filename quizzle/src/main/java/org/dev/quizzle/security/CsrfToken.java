package org.dev.quizzle.security;

import java.security.SecureRandom;
import java.util.Base64;

import jakarta.servlet.http.HttpSession;

/**
 * Issues and reads the per-session CSRF token. The token is stored server-side in the
 * {@link HttpSession} and mirrored to the browser as a readable (non-HttpOnly) cookie so
 * page scripts can attach it to state-changing requests (double-submit-cookie pattern).
 */
public final class CsrfToken {

	public static final String SESSION_ATTRIBUTE = CsrfToken.class.getName() + ".token";
	public static final String COOKIE_NAME = "XSRF-TOKEN";
	public static final String HEADER_NAME = "X-XSRF-TOKEN";
	public static final String FORM_FIELD_NAME = "_csrf";

	private static final SecureRandom RANDOM = new SecureRandom();

	private CsrfToken() {
	}

	public static String getOrCreate(HttpSession session) {
		String existing = (String) session.getAttribute(SESSION_ATTRIBUTE);
		if (existing != null) {
			return existing;
		}
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		session.setAttribute(SESSION_ATTRIBUTE, token);
		return token;
	}
}
