package org.dev.quizzle.admin;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public final class AdminPageController {

	@GetMapping("/")
	public String root() {
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

	@GetMapping({"/editor", "/editor/"})
	public String editorPage() {
		return "forward:/editor.html";
	}

	@GetMapping({"/settings", "/settings/"})
	public String settingsPage() {
		return "forward:/settings.html";
	}
}
