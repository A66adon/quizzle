package org.dev.quizzle.account;

import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.AuthProperties;
import org.dev.quizzle.security.AuthRateLimiter;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public final class AccountAuthController {
	private final AccountService service;
	private final AccountTokens tokens;
	private final AuthRateLimiter limiter;
	private final AuthProperties auth;
	private final AccountProperties properties;
	public AccountAuthController(AccountService service, AccountTokens tokens, AuthRateLimiter limiter,
			AuthProperties auth, AccountProperties properties) {
		this.service = service; this.tokens = tokens; this.limiter = limiter; this.auth = auth; this.properties = properties;
	}
	@GetMapping({"/login", "/register", "/forgot-password", "/resend-verification", "/reset-password"})
	public String page(HttpServletRequest request) {
		return "forward:" + request.getRequestURI() + ".html";
	}
	@GetMapping("/auth/options")
	@ResponseBody
	public Options options() { return new Options(auth.googleEnabled(), auth.allowedEmailDomain(), properties.minPasswordLength()); }
	@PostMapping("/register")
	public String register(@RequestParam(defaultValue = "") String email, @RequestParam(defaultValue = "") String password,
			@RequestParam(defaultValue = "") String passwordConfirmation, HttpServletRequest request) {
		try {
			if (!limiter.allow("register", request.getRemoteAddr(), email)) throw new AccountRegistrationException("Please try again later");
			if (!password.equals(passwordConfirmation)) throw new AccountRegistrationException("Passwords do not match");
			Account account = service.register(email, password);
			if (!tokens.verification(account))
				return "redirect:/resend-verification?error=" + encode("Verification email could not be sent. Please try resending.");
			return "redirect:/login?registered";
		} catch (AccountRegistrationException exception) { return "redirect:/register?error=" + encode(exception.getMessage()); }
	}
	@GetMapping("/verify-email")
	public String verify(@RequestParam(defaultValue = "") String token, HttpServletRequest request) {
		return limiter.allow("verification", request.getRemoteAddr(), "") && tokens.verify(token)
				? "redirect:/login?verified" : "redirect:/resend-verification?error";
	}
	@PostMapping("/forgot-password")
	public String forgot(@RequestParam(defaultValue = "") String email, HttpServletRequest request) {
		if (limiter.allow("forgot", request.getRemoteAddr(), email)) tokens.forgot(email);
		return "redirect:/forgot-password?sent";
	}
	@PostMapping("/resend-verification")
	public String resend(@RequestParam(defaultValue = "") String email, HttpServletRequest request) {
		if (limiter.allow("resend", request.getRemoteAddr(), email)) tokens.resend(email);
		return "redirect:/resend-verification?sent";
	}
	@PostMapping("/reset-password")
	public String reset(@RequestParam(defaultValue = "") String token, @RequestParam(defaultValue = "") String password,
			@RequestParam(defaultValue = "") String passwordConfirmation, HttpServletRequest request) {
		try {
			if (limiter.allow("reset", request.getRemoteAddr(), "") && password.equals(passwordConfirmation) && tokens.reset(token, password))
				return "redirect:/login?reset";
		} catch (AccountRegistrationException exception) { /* safe generic error */ }
		return "redirect:/reset-password?error";
	}
	private static String encode(String value) { return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8); }
	public record Options(boolean googleEnabled, String allowedEmailDomain, int minPasswordLength) {}
}
