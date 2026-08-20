package gd.safety.Quiz.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gd.safety.Quiz.quiz.catalog.QuizCatalog;

@RestController
@RequestMapping("/admin/api")
public final class AdminCatalogController {

	private final QuizCatalog quizCatalog;

	public AdminCatalogController(QuizCatalog quizCatalog) {
		this.quizCatalog = quizCatalog;
	}

	@GetMapping("/quizzes")
	public AdminCatalogResponse quizzes() {
		return AdminCatalogResponse.from(quizCatalog.snapshot());
	}
}
