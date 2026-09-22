package org.dev.quizzle.admin;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.quiz.catalog.QuizEditorException;
import org.dev.quizzle.quiz.catalog.QuizEditorService;
import org.dev.quizzle.quiz.catalog.QuizEditorValidationException;
import org.dev.quizzle.quiz.model.QuizDefinition;
import jakarta.servlet.http.HttpSession;

/**
 * Backs the visual quiz editor. Every operation reads/writes only inside the current account's
 * own quiz folder ({@link QuizEditorService}); there is no way to name another account's file.
 */
@RestController
@RequestMapping("/admin/api/quizzes")
public final class AdminQuizEditorController {

	private final QuizEditorService editorService;

	public AdminQuizEditorController(QuizEditorService editorService) {
		this.editorService = editorService;
	}

	@GetMapping("/{fileName}")
	public EditorQuizResponse get(HttpSession session, @PathVariable String fileName) {
		try {
			return new EditorQuizResponse(fileName, editorService.load(accountId(session), fileName));
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public EditorQuizResponse create(HttpSession session, @RequestBody QuizDefinition quiz) {
		try {
			String fileName = editorService.create(accountId(session), quiz);
			return new EditorQuizResponse(fileName, quiz);
		} catch (QuizEditorValidationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@PutMapping("/{fileName}")
	public EditorQuizResponse update(
			HttpSession session,
			@PathVariable String fileName,
			@RequestBody QuizDefinition quiz) {
		try {
			editorService.update(accountId(session), fileName, quiz);
			return new EditorQuizResponse(fileName, quiz);
		} catch (QuizEditorValidationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	@DeleteMapping("/{fileName}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(HttpSession session, @PathVariable String fileName) {
		try {
			editorService.delete(accountId(session), fileName);
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	private String accountId(HttpSession session) {
		return AccountSession.currentAccountId(session);
	}

	public record EditorQuizResponse(String fileName, QuizDefinition quiz) {
	}
}
