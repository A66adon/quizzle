package org.dev.quizzle.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.quiz.catalog.QuizCatalog;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/admin/api")
public final class AdminCatalogController {

	private final QuizCatalog quizCatalog;

	public AdminCatalogController(QuizCatalog quizCatalog) {
		this.quizCatalog = quizCatalog;
	}

	@GetMapping("/quizzes")
	public AdminCatalogResponse quizzes(HttpSession session) {
		String accountId = AccountSession.currentAccountId(session);
		return AdminCatalogResponse.from(quizCatalog.snapshotFor(accountId));
	}
}
