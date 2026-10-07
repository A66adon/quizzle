package org.dev.quizzle.account;

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

	public SettingsController(
			AccountService accountService,
			GameSessionRegistry sessionRegistry) {
		this.accountService = accountService;
		this.sessionRegistry = sessionRegistry;
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
		accountService.deleteAccount(accountId);
		session.invalidate();
		response.setHeader("Clear-Site-Data", "\"cache\"");
	}

	private Account requireAccount(HttpSession session) {
		String accountId = AccountSession.currentAccountId(session);
		return accountService.findById(accountId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	public record SettingsResponse(String accountId, String email, String username,
			boolean allowLateJoin, long autoAdvanceDelayMs) {
		static SettingsResponse from(Account account) {
			return new SettingsResponse(account.id(), account.email(), account.email(),
					account.allowLateJoin(), account.autoAdvanceDelayMs());
		}
	}

	public record UpdateSettingsRequest(boolean allowLateJoin, long autoAdvanceDelayMs) {
	}

	public record ChangePasswordRequest(String currentPassword, String newPassword) {
	}
}
