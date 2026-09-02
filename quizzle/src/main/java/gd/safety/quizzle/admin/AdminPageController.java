package gd.safety.quizzle.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Controller
public final class AdminPageController {

	private final AdminCredentials credentials;

	public AdminPageController(AdminCredentials credentials) {
		this.credentials = credentials;
	}

	@GetMapping("/")
	public String root() {
		return "redirect:/admin";
	}

	@GetMapping("/admin/login")
	public String loginPage(HttpServletRequest request, HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		if (AdminSession.isAuthenticated(request.getSession(false))) {
			return "redirect:/admin";
		}
		return "forward:/admin-login.html";
	}

	@PostMapping("/admin/login")
	public String login(
			@RequestParam(name = "password", defaultValue = "") String password,
			HttpServletRequest request,
			HttpServletResponse response) {
		response.setHeader("Cache-Control", "no-store");
		if (!credentials.matches(password)) {
			return "redirect:/admin/login?error";
		}

		HttpSession existingSession = request.getSession(false);
		if (existingSession != null) {
			existingSession.invalidate();
		}
		HttpSession adminSession = request.getSession(true);
		AdminSession.authenticate(adminSession);
		return "redirect:/admin";
	}

	@GetMapping({"/admin", "/admin/"})
	public String adminPage() {
		return "forward:/admin.html";
	}

	@GetMapping("/admin/sessions/{codehash}")
	public String presenterPage() {
		return "forward:/presenter.html";
	}

	@PostMapping("/admin/logout")
	public String logout(HttpServletRequest request, HttpServletResponse response) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		response.setHeader("Clear-Site-Data", "\"cache\"");
		return "redirect:/admin/login";
	}
}
