package org.dev.quizzle.account;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public final class AccountAuthController {

	private final AccountService accountService;

	public AccountAuthController(AccountService accountService) {
		this.accountService = accountService;
	}

	@GetMapping("/register")
	public String registerPage(HttpServletRequest request, HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		if (AccountSession.isAuthenticated(request.getSession(false))) {
			return "redirect:/admin";
		}
		return "forward:/register.html";
	}

	@PostMapping("/register")
	public String register(
			@RequestParam(name = "username", defaultValue = "") String username,
			@RequestParam(name = "password", defaultValue = "") String password,
			HttpServletRequest request,
			HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		Account account;
		try {
			account = accountService.register(username, password);
		} catch (AccountRegistrationException exception) {
			return "redirect:/register?error=" + encode(exception.getMessage());
		}

		// A fresh account is signed straight in, so the first thing a new presenter sees is their
		// own admin page instead of a second login form.
		HttpSession existingSession = request.getSession(false);
		if (existingSession != null) {
			existingSession.invalidate();
		}
		HttpSession session = request.getSession(true);
		AccountSession.authenticate(session, account.id());
		return "redirect:/admin?welcome";
	}

	@GetMapping("/login")
	public String loginPage(HttpServletRequest request, HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		if (AccountSession.isAuthenticated(request.getSession(false))) {
			return "redirect:/admin";
		}
		return "forward:/login.html";
	}

	@PostMapping("/login")
	public String login(
			@RequestParam(name = "username", defaultValue = "") String username,
			@RequestParam(name = "password", defaultValue = "") String password,
			HttpServletRequest request,
			HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		var account = accountService.authenticate(username, password);
		if (account.isEmpty()) {
			return "redirect:/login?error";
		}

		HttpSession existingSession = request.getSession(false);
		if (existingSession != null) {
			existingSession.invalidate();
		}
		HttpSession session = request.getSession(true);
		AccountSession.authenticate(session, account.get().id());
		return "redirect:/admin";
	}

	@PostMapping("/logout")
	public String logout(HttpServletRequest request, HttpServletResponse response) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		response.setHeader("Clear-Site-Data", "\"cache\"");
		return "redirect:/login";
	}

	private String encode(String message) {
		return java.net.URLEncoder.encode(message == null ? "" : message, java.nio.charset.StandardCharsets.UTF_8);
	}
}
