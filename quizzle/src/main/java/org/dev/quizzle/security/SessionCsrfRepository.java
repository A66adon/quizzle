package org.dev.quizzle.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.csrf.DefaultCsrfToken;

/** The readable cookie is a mirror, not the authority: validation uses the server session. */
public final class SessionCsrfRepository implements CsrfTokenRepository {
	private final boolean secure;
	public SessionCsrfRepository(boolean secure) {this.secure=secure;}
	@Override
	public org.springframework.security.web.csrf.CsrfToken generateToken(HttpServletRequest request) {
		return new DefaultCsrfToken(CsrfToken.HEADER_NAME, "_csrf", CsrfToken.getOrCreate(request.getSession()));
	}
	@Override
	public void saveToken(org.springframework.security.web.csrf.CsrfToken token,
			HttpServletRequest request, HttpServletResponse response) {
		var session = request.getSession(false);
		if (token == null) {
			if (session != null) session.removeAttribute(CsrfToken.SESSION_ATTRIBUTE);
		} else request.getSession().setAttribute(CsrfToken.SESSION_ATTRIBUTE, token.getToken());
		response.addHeader("Set-Cookie", ResponseCookie.from("XSRF-TOKEN", token == null ? "" : token.getToken())
				.path("/").httpOnly(false).secure(secure || request.isSecure()).sameSite("Lax")
				.maxAge(token == null ? 0 : -1).build().toString());
	}
	@Override
	public org.springframework.security.web.csrf.CsrfToken loadToken(HttpServletRequest request) {
		var session = request.getSession(false);
		Object token = session == null ? null : session.getAttribute(CsrfToken.SESSION_ATTRIBUTE);
		return token instanceof String value ? new DefaultCsrfToken(CsrfToken.HEADER_NAME, "_csrf", value) : null;
	}
}
