package org.dev.quizzle.account;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import org.dev.quizzle.config.QuizCatalogProperties;
import org.dev.quizzle.session.GameSessionRegistry;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * The only account-management surface exposed to a signed-in user: their own late-join /
 * auto-advance defaults, changing their password, and deleting their own account. There is
 * deliberately no administrator equivalent of this controller.
 */
@RestController
@RequestMapping("/admin/api/account")
public final class SettingsController {

	private final AccountService accountService;
	private final GameSessionRegistry sessionRegistry;
	private final Path quizBaseDirectory;

	public SettingsController(
			AccountService accountService,
			GameSessionRegistry sessionRegistry,
			QuizCatalogProperties quizCatalogProperties) {
		this.accountService = accountService;
		this.sessionRegistry = sessionRegistry;
		this.quizBaseDirectory = quizCatalogProperties.directory().toAbsolutePath().normalize();
	}

	@GetMapping("/settings")
	public SettingsResponse settings(HttpSession session) {
		Account account = requireAccount(session);
		return SettingsResponse.from(account);
	}

	@PutMapping("/settings")
	public SettingsResponse updateSettings(HttpSession session, @RequestBody(required = false) UpdateSettingsRequest request) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		String accountId = AccountSession.currentAccountId(session);
		try {
			accountService.updateGameSettings(accountId, request.allowLateJoin(), request.autoAdvanceDelayMs());
		} catch (AccountRegistrationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		return SettingsResponse.from(requireAccount(session));
	}

	@PostMapping("/change-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(HttpSession session, @RequestBody(required = false) ChangePasswordRequest request) {
		if (request == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		String accountId = AccountSession.currentAccountId(session);
		try {
			accountService.changePassword(accountId, request.currentPassword(), request.newPassword());
		} catch (AccountRegistrationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAccount(HttpSession session, HttpServletResponse response) {
		String accountId = AccountSession.currentAccountId(session);
		sessionRegistry.closeAllOwnedBy(accountId);
		deleteQuizFolder(accountId);
		accountService.deleteAccount(accountId);
		session.invalidate();
		response.setHeader("Clear-Site-Data", "\"cache\"");
	}

	private Account requireAccount(HttpSession session) {
		String accountId = AccountSession.currentAccountId(session);
		return accountService.findById(accountId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	private void deleteQuizFolder(String accountId) {
		Path directory = quizBaseDirectory.resolve(accountId).normalize();
		if (!directory.startsWith(quizBaseDirectory) || !Files.isDirectory(directory)) {
			return;
		}
		try {
			Files.walkFileTree(directory, new SimpleFileVisitor<>() {
				@Override
				public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
					Files.delete(file);
					return FileVisitResult.CONTINUE;
				}

				@Override
				public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
					Files.delete(dir);
					return FileVisitResult.CONTINUE;
				}
			});
		} catch (IOException exception) {
			throw new UncheckedIOException("Could not delete the account's quiz folder", exception);
		}
	}

	public record SettingsResponse(String username, boolean allowLateJoin, long autoAdvanceDelayMs) {
		static SettingsResponse from(Account account) {
			return new SettingsResponse(account.email(), account.allowLateJoin(), account.autoAdvanceDelayMs());
		}
	}

	public record UpdateSettingsRequest(boolean allowLateJoin, long autoAdvanceDelayMs) {
	}

	public record ChangePasswordRequest(String currentPassword, String newPassword) {
	}
}
