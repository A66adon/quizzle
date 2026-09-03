package org.dev.quizzle.admin;

import jakarta.servlet.http.HttpSession;

public final class AdminSession {

	private static final String AUTHENTICATED_ATTRIBUTE = AdminSession.class.getName() + ".authenticated";

	private AdminSession() {
	}

	public static void authenticate(HttpSession session) {
		session.setAttribute(AUTHENTICATED_ATTRIBUTE, Boolean.TRUE);
	}

	public static boolean isAuthenticated(HttpSession session) {
		return session != null && Boolean.TRUE.equals(session.getAttribute(AUTHENTICATED_ATTRIBUTE));
	}
}
