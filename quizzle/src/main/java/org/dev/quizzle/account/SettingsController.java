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
	private final org.dev.quizzle.websocket.SessionRealtimePublisher publisher;
	private final AccountStore store;
	private final AccountMailer mailer;
	private final org.dev.quizzle.security.AccountSessions accountSessions;

	public SettingsController(
			AccountService accountService,
			GameSessionRegistry sessionRegistry, org.dev.quizzle.websocket.SessionRealtimePublisher publisher,
			AccountStore store, AccountMailer mailer, org.dev.quizzle.security.AccountSessions accountSessions) {
		this.accountService = accountService;
		this.sessionRegistry = sessionRegistry;
		this.publisher=publisher;
		this.store=store;
		this.mailer=mailer;
		this.accountSessions=accountSessions;
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
			long version=accountService.changePassword(accountId, request.currentPassword(), request.newPassword());
			var context=(org.springframework.security.core.context.SecurityContext)session.getAttribute(
					org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
			context.setAuthentication(org.springframework.security.authentication.UsernamePasswordAuthenticationToken.authenticated(
					new org.dev.quizzle.security.AccountPrincipal(accountId,version,0),null,
					java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"))));
			accountSessions.revoke(accountId,version,session.getId());
			mailer.passwordChanged(requireAccount(session));
		} catch (AccountRegistrationException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAccount(HttpSession session, HttpServletResponse response,
			@RequestBody(required=false) DeleteAccountRequest request) {
		String accountId = AccountSession.currentAccountId(session);
		var context=(org.springframework.security.core.context.SecurityContext)session.getAttribute(
				org.springframework.security.web.context.HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
		var principal=(org.dev.quizzle.security.AccountPrincipal)context.getAuthentication().getPrincipal();
		try {
			// Serialize creation and deletion through the same registry monitor; no live room can escape the cascade.
			synchronized(sessionRegistry) {
				accountService.deleteAccount(accountId,request==null ? null : request.currentPassword(),
						principal.providerAuthenticatedAt(),()->sessionRegistry.closeAllOwnedBy(accountId,publisher::publishAndDisconnect));
			}
		} catch(AccountRegistrationException exception) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Reauthentication is required");
		}
		session.invalidate();
		accountSessions.revoke(accountId,Long.MAX_VALUE,null);
		response.setHeader("Clear-Site-Data", "\"cache\"");
	}

	private Account requireAccount(HttpSession session) {
		String accountId = AccountSession.currentAccountId(session);
		return accountService.findById(accountId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	public record SettingsResponse(String accountId, String email, boolean hasLocalPassword,
			boolean allowLateJoin, long autoAdvanceDelayMs) {
		static SettingsResponse from(Account account) {
			return new SettingsResponse(account.id(), account.email(), account.passwordHash()!=null,
					account.allowLateJoin(), account.autoAdvanceDelayMs());
		}
	}

	public record UpdateSettingsRequest(boolean allowLateJoin, long autoAdvanceDelayMs) {
	}

	public record ChangePasswordRequest(String currentPassword, String newPassword) {
	}
	public record DeleteAccountRequest(String currentPassword) {}
}
