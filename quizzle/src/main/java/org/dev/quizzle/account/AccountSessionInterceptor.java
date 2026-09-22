package org.dev.quizzle.account;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public final class AccountSessionInterceptor implements HandlerInterceptor {

	@Override
	public boolean preHandle(
			HttpServletRequest request,
			HttpServletResponse response,
			Object handler) throws IOException {
		response.setHeader("Cache-Control", "no-store");
		if (AccountSession.isAuthenticated(request.getSession(false))) {
			return true;
		}

		String applicationPath = request.getRequestURI().substring(request.getContextPath().length());
		if (applicationPath.startsWith("/admin/api/")) {
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
		} else {
			response.sendRedirect(request.getContextPath() + "/login");
		}
		return false;
	}
}
