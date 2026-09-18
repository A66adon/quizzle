package org.dev.quizzle.admin;

import java.util.List;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import org.dev.quizzle.account.AccountService;
import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.session.GameSessionRegistry;
import org.dev.quizzle.session.GameSessionRegistry.PlayerNotFoundException;
import org.dev.quizzle.session.GameSessionRegistry.QuizNotFoundException;
import org.dev.quizzle.session.GameSessionRegistry.SessionNotFoundException;
import org.dev.quizzle.session.GameSessionSnapshot;
import org.dev.quizzle.session.GameCommand;
import org.dev.quizzle.session.InvalidGameTransitionException;
import org.dev.quizzle.session.QrCodeService;
import org.dev.quizzle.session.SessionAddressService;
import org.dev.quizzle.websocket.SessionRealtimePublisher;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/admin/api/sessions")
public final class AdminGameSessionController {

	private static final MediaType SVG_MEDIA_TYPE = MediaType.parseMediaType("image/svg+xml");

	private final GameSessionRegistry sessionRegistry;
	private final SessionAddressService addressService;
	private final QrCodeService qrCodeService;
	private final SessionRealtimePublisher realtimePublisher;
	private final GameSessionProperties sessionProperties;
	private final AccountService accountService;

	public AdminGameSessionController(
			GameSessionRegistry sessionRegistry,
			SessionAddressService addressService,
			QrCodeService qrCodeService,
			SessionRealtimePublisher realtimePublisher,
			GameSessionProperties sessionProperties,
			AccountService accountService) {
		this.sessionRegistry = sessionRegistry;
		this.addressService = addressService;
		this.qrCodeService = qrCodeService;
		this.realtimePublisher = realtimePublisher;
		this.sessionProperties = sessionProperties;
		this.accountService = accountService;
	}

	@GetMapping
	public List<AdminGameSessionResponse> sessions(HttpSession session) {
		return sessionRegistry.list(accountId(session)).stream()
				.map(this::toResponse)
				.toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminGameSessionResponse create(
			HttpSession session,
			@RequestBody(required = false) CreateSessionRequest request) {
		if (request == null || request.quizFileName() == null || request.quizFileName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		try {
			return toResponse(sessionRegistry.create(accountId(session), request.quizFileName()));
		} catch (QuizNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
	}

	@GetMapping("/{codehash}")
	public AdminGameSessionResponse session(HttpSession session, @PathVariable String codehash) {
		return toResponse(requireOwnedSession(session, codehash));
	}

	@GetMapping(value = "/{codehash}/qr.svg", produces = "image/svg+xml")
	public ResponseEntity<String> qrCode(HttpSession session, @PathVariable String codehash) {
		GameSessionSnapshot ownedSession = requireOwnedSession(session, codehash);
		String svg = qrCodeService.createSvg(addressService.joinUrl(ownedSession.codehash()));
		return ResponseEntity.ok()
				.contentType(SVG_MEDIA_TYPE)
				.header("X-Content-Type-Options", "nosniff")
				.body(svg);
	}

	@PostMapping("/{codehash}/commands")
	public AdminGameSessionResponse command(
			HttpSession session,
			@PathVariable String codehash,
			@RequestBody(required = false) LifecycleCommandRequest request) {
		if (request == null || request.command() == null || request.command().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		requireOwnedSession(session, codehash);
		GameCommand command;
		try {
			command = GameCommand.valueOf(request.command().strip().toUpperCase(java.util.Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		try {
			GameSessionSnapshot updated = sessionRegistry.transition(codehash, command);
			realtimePublisher.publish(updated);
			return toResponse(updated);
		} catch (SessionNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		} catch (InvalidGameTransitionException exception) {
			throw new ResponseStatusException(HttpStatus.CONFLICT);
		}
	}

	@GetMapping(value = "/{codehash}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public ResponseEntity<SseEmitter> events(HttpSession session, @PathVariable String codehash) {
		GameSessionSnapshot ownedSession = requireOwnedSession(session, codehash);
		return ResponseEntity.ok()
				.header("X-Accel-Buffering", "no")
				.body(realtimePublisher.subscribePresenter(ownedSession));
	}

	// Fallback for networks where a proxy buffers or blocks the SSE stream.
	@GetMapping(value = "/{codehash}/state", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<String> state(HttpSession session, @PathVariable String codehash) {
		GameSessionSnapshot ownedSession = requireOwnedSession(session, codehash);
		return ResponseEntity.ok()
				.cacheControl(CacheControl.noStore())
				// Some corporate proxies only honour the legacy header, and would otherwise
				// keep serving a stale snapshot to a polling presenter forever.
				.header("Pragma", "no-cache")
				.body(realtimePublisher.stateJson(ownedSession));
	}

	@PostMapping("/{codehash}/players/{playerId}/kick")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void kickPlayer(HttpSession session, @PathVariable String codehash, @PathVariable UUID playerId) {
		requireOwnedSession(session, codehash);
		try {
			GameSessionSnapshot updated = sessionRegistry.kickPlayer(codehash, playerId);
			realtimePublisher.disconnectKickedPlayer(codehash, playerId);
			realtimePublisher.publish(updated);
		} catch (SessionNotFoundException | PlayerNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
	}

	@PostMapping("/{codehash}/leaderboard")
	public AdminGameSessionResponse leaderboard(
			HttpSession session,
			@PathVariable String codehash,
			@RequestBody(required = false) LeaderboardSettingRequest request) {
		if (request == null || request.enabled() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		requireOwnedSession(session, codehash);
		try {
			GameSessionSnapshot updated = sessionRegistry.setLeaderboardEnabled(codehash, request.enabled());
			realtimePublisher.publish(updated);
			return toResponse(updated);
		} catch (SessionNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		} catch (GameSessionRegistry.LeaderboardSettingLockedException exception) {
			throw new ResponseStatusException(HttpStatus.CONFLICT);
		}
	}

	private AdminGameSessionResponse toResponse(GameSessionSnapshot snapshot) {
		long autoAdvanceDelayMs = accountService.findById(snapshot.ownerAccountId())
				.map(account -> account.autoAdvanceDelayMs())
				.orElse(sessionProperties.autoAdvanceDelayMs());
		return AdminGameSessionResponse.from(snapshot, addressService, autoAdvanceDelayMs);
	}

	private String accountId(HttpSession session) {
		return AccountSession.currentAccountId(session);
	}

	// Returns 404 (not 403) for sessions owned by someone else, so a guess never confirms
	// that a given codehash exists.
	private GameSessionSnapshot requireOwnedSession(HttpSession session, String codehash) {
		return sessionRegistry.findOwned(codehash, accountId(session))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	public record CreateSessionRequest(String quizFileName) {
	}

	public record LifecycleCommandRequest(String command) {
	}

	public record LeaderboardSettingRequest(Boolean enabled) {
	}
}
