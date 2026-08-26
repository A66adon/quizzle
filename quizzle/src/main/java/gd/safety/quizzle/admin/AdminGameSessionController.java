package gd.safety.quizzle.admin;

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

import gd.safety.quizzle.session.GameSessionRegistry;
import gd.safety.quizzle.session.GameSessionRegistry.PlayerNotFoundException;
import gd.safety.quizzle.session.GameSessionRegistry.QuizNotFoundException;
import gd.safety.quizzle.session.GameSessionRegistry.SessionNotFoundException;
import gd.safety.quizzle.session.GameSessionSnapshot;
import gd.safety.quizzle.session.GameCommand;
import gd.safety.quizzle.session.InvalidGameTransitionException;
import gd.safety.quizzle.session.QrCodeService;
import gd.safety.quizzle.session.SessionAddressService;
import gd.safety.quizzle.websocket.SessionRealtimePublisher;

@RestController
@RequestMapping("/admin/api/sessions")
public final class AdminGameSessionController {

	private static final MediaType SVG_MEDIA_TYPE = MediaType.parseMediaType("image/svg+xml");

	private final GameSessionRegistry sessionRegistry;
	private final SessionAddressService addressService;
	private final QrCodeService qrCodeService;
	private final SessionRealtimePublisher realtimePublisher;

	public AdminGameSessionController(
			GameSessionRegistry sessionRegistry,
			SessionAddressService addressService,
			QrCodeService qrCodeService,
			SessionRealtimePublisher realtimePublisher) {
		this.sessionRegistry = sessionRegistry;
		this.addressService = addressService;
		this.qrCodeService = qrCodeService;
		this.realtimePublisher = realtimePublisher;
	}

	@GetMapping
	public List<AdminGameSessionResponse> sessions() {
		return sessionRegistry.list().stream()
				.map(snapshot -> AdminGameSessionResponse.from(snapshot, addressService))
				.toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminGameSessionResponse create(@RequestBody(required = false) CreateSessionRequest request) {
		if (request == null || request.quizFileName() == null || request.quizFileName().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		try {
			return AdminGameSessionResponse.from(sessionRegistry.create(request.quizFileName()), addressService);
		} catch (QuizNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
	}

	@GetMapping("/{codehash}")
	public AdminGameSessionResponse session(@PathVariable String codehash) {
		return AdminGameSessionResponse.from(requireSession(codehash), addressService);
	}

	@GetMapping(value = "/{codehash}/qr.svg", produces = "image/svg+xml")
	public ResponseEntity<String> qrCode(@PathVariable String codehash) {
		GameSessionSnapshot session = requireSession(codehash);
		String svg = qrCodeService.createSvg(addressService.joinUrl(session.codehash()));
		return ResponseEntity.ok()
				.contentType(SVG_MEDIA_TYPE)
				.header("X-Content-Type-Options", "nosniff")
				.body(svg);
	}

	@PostMapping("/{codehash}/commands")
	public AdminGameSessionResponse command(
			@PathVariable String codehash,
			@RequestBody(required = false) LifecycleCommandRequest request) {
		if (request == null || request.command() == null || request.command().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		GameCommand command;
		try {
			command = GameCommand.valueOf(request.command().strip().toUpperCase(java.util.Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
		}
		try {
			GameSessionSnapshot updated = sessionRegistry.transition(codehash, command);
			realtimePublisher.publish(updated);
			return AdminGameSessionResponse.from(updated, addressService);
		} catch (SessionNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		} catch (InvalidGameTransitionException exception) {
			throw new ResponseStatusException(HttpStatus.CONFLICT);
		}
	}

	@GetMapping(value = "/{codehash}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public ResponseEntity<SseEmitter> events(@PathVariable String codehash) {
		GameSessionSnapshot session = requireSession(codehash);
		return ResponseEntity.ok()
				.header("X-Accel-Buffering", "no")
				.body(realtimePublisher.subscribePresenter(session));
	}

	// Fallback for networks where a proxy buffers or blocks the SSE stream.
	@GetMapping(value = "/{codehash}/state", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<String> state(@PathVariable String codehash) {
		GameSessionSnapshot session = requireSession(codehash);
		return ResponseEntity.ok()
				.cacheControl(CacheControl.noStore())
				// Some corporate proxies only honour the legacy header, and would otherwise
				// keep serving a stale snapshot to a polling presenter forever.
				.header("Pragma", "no-cache")
				.body(realtimePublisher.stateJson(session));
	}

	@PostMapping("/{codehash}/players/{playerId}/kick")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void kickPlayer(@PathVariable String codehash, @PathVariable UUID playerId) {
		try {
			GameSessionSnapshot updated = sessionRegistry.kickPlayer(codehash, playerId);
			realtimePublisher.disconnectKickedPlayer(codehash, playerId);
			realtimePublisher.publish(updated);
		} catch (SessionNotFoundException | PlayerNotFoundException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
	}

	private GameSessionSnapshot requireSession(String codehash) {
		return sessionRegistry.find(codehash)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	public record CreateSessionRequest(String quizFileName) {
	}

	public record LifecycleCommandRequest(String command) {
	}
}

