package org.dev.quizzle.admin;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ExceptionHandler;
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
import org.dev.quizzle.quiz.catalog.QuizRevisionConflictException;
import org.dev.quizzle.quiz.catalog.QuizFileException;
import org.dev.quizzle.quiz.catalog.LoadedQuiz;
import org.dev.quizzle.quiz.model.QuizDefinition;
import jakarta.servlet.http.HttpSession;
import tools.jackson.databind.JsonNode;

/** Every editor operation is scoped to the current account's database rows. */
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
			return EditorQuizResponse.from(editorService.loadRevision(accountId(session), fileName));
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public EditorQuizResponse create(HttpSession session, @RequestBody QuizDefinition quiz) {
		try {
			String fileName = editorService.create(accountId(session), quiz);
			return new EditorQuizResponse(fileName, quiz, 1);
		} catch (QuizEditorValidationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@PutMapping("/{fileName}")
	public EditorQuizResponse update(
			HttpSession session,
			@PathVariable String fileName,
			@RequestBody UpdateQuizRequest request) {
		if (request == null || request.quiz() == null || request.version() == null
				|| !request.version().isIntegralNumber() || !request.version().canConvertToLong()
				|| request.version().longValue() < 1 || request.version().longValue() == Long.MAX_VALUE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "quiz and a positive version are required");
		}
		try {
			return EditorQuizResponse.from(editorService.update(accountId(session), fileName,
					request.quiz(), request.version().longValue()));
		} catch (QuizEditorValidationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	@PostMapping(value = "/import", consumes = {"application/yaml", "text/yaml", "application/x-yaml"})
	@ResponseStatus(HttpStatus.CREATED)
	public EditorQuizResponse importYaml(HttpSession session, @RequestBody String yaml) {
		try {
			return EditorQuizResponse.from(editorService.importYaml(accountId(session), yaml));
		} catch (QuizFileException | QuizEditorValidationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@GetMapping(value = "/{fileName}/export", produces = "application/yaml")
	public ResponseEntity<String> exportYaml(HttpSession session, @PathVariable String fileName) {
		try {
			String yaml = editorService.exportYaml(accountId(session), fileName);
			return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/yaml"))
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
					.body(yaml);
		} catch (QuizEditorException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		}
	}

	@ExceptionHandler(QuizRevisionConflictException.class)
	public ResponseEntity<RevisionConflictResponse> conflict(QuizRevisionConflictException exception) {
		return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(new RevisionConflictResponse("REVISION_CONFLICT", exception.currentVersion()));
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

	public record EditorQuizResponse(String fileName, QuizDefinition quiz, long version) {
		static EditorQuizResponse from(LoadedQuiz quiz) {
			return new EditorQuizResponse(quiz.fileName(), quiz.quiz(), quiz.version());
		}
	}
	public record UpdateQuizRequest(QuizDefinition quiz, JsonNode version) {}
	public record RevisionConflictResponse(String error, long currentVersion) {}
}
