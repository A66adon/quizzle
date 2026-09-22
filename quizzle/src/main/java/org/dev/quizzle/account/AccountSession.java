package org.dev.quizzle.account;

import jakarta.servlet.http.HttpSession;

public final class AccountSession {

	private static final String ACCOUNT_ID_ATTRIBUTE = AccountSession.class.getName() + ".accountId";

	private AccountSession() {
	}

	public static void authenticate(HttpSession session, String accountId) {
		session.setAttribute(ACCOUNT_ID_ATTRIBUTE, accountId);
	}

	public static boolean isAuthenticated(HttpSession session) {
		return currentAccountId(session) != null;
	}

	public static String currentAccountId(HttpSession session) {
		return session == null ? null : (String) session.getAttribute(ACCOUNT_ID_ATTRIBUTE);
	}
}
