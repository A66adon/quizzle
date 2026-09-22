package org.dev.quizzle.security;

import java.io.IOException;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * Bare-minimum CSRF protection: every request gets a session-bound token mirrored into a
 * readable cookie; state-changing requests (POST/PUT/PATCH/DELETE) must echo that token back
 * via a header or a form field, or they are rejected. This is the only protection layered on
 * top of the session cookie's SameSite=Strict attribute.
 */
@Component
public final class CsrfInterceptor implements HandlerInterceptor {

	private static final Set<String> UNSAFE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

	private final boolean secureCookie;

	public CsrfInterceptor(@Value("${server.servlet.session.cookie.secure:false}") boolean secureCookie) {
		this.secureCookie = secureCookie;
	}

	@Override
	public boolean preHandle(
			HttpServletRequest request,
			HttpServletResponse response,
			Object handler) throws IOException {
		HttpSession session = request.getSession(true);
		String token = CsrfToken.getOrCreate(session);
		ensureCookie(request, response, token);

		if (!UNSAFE_METHODS.contains(request.getMethod())) {
			return true;
		}

		String suppliedToken = request.getHeader(CsrfToken.HEADER_NAME);
		if (suppliedToken == null) {
			suppliedToken = request.getParameter(CsrfToken.FORM_FIELD_NAME);
		}
		if (suppliedToken == null || !suppliedToken.equals(token)) {
			response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing CSRF token");
			return false;
		}
		return true;
	}

	private void ensureCookie(HttpServletRequest request, HttpServletResponse response, String token) {
		if (request.getCookies() != null) {
			for (Cookie cookie : request.getCookies()) {
				if (cookie.getName().equals(CsrfToken.COOKIE_NAME) && token.equals(cookie.getValue())) {
					return;
				}
			}
		}
		String cookieHeader = CsrfToken.COOKIE_NAME + "=" + token
				+ "; Path=/"
				+ "; SameSite=Strict"
				+ (secureCookie ? "; Secure" : "");
		response.addHeader("Set-Cookie", cookieHeader);
	}
}
