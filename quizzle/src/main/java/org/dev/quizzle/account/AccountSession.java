package org.dev.quizzle.account;

import jakarta.servlet.http.HttpSession;

public final class AccountSession {

	private AccountSession() {
	}

	public static void authenticate(HttpSession session, String accountId) {
		var context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
		context.setAuthentication(org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(
				new org.dev.quizzle.security.AccountPrincipal(accountId, 0, 0), null,
				java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))));
		session.setAttribute(org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
	}

	public static boolean isAuthenticated(HttpSession session) {
		return currentAccountId(session) != null;
	}

	public static String currentAccountId(HttpSession session) {
		if (session == null) return null;
		Object stored = session.getAttribute(org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
		if (!(stored instanceof org.springframework.security.core.context.SecurityContext context)) return null;
		var authentication = context.getAuthentication();
		return authentication != null && authentication.isAuthenticated()
				&& authentication.getPrincipal() instanceof org.dev.quizzle.security.AccountPrincipal principal
				? principal.accountId() : null;
	}
}
