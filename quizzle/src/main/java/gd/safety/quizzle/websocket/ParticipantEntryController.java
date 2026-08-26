package gd.safety.quizzle.websocket;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ResponseStatusException;

import gd.safety.quizzle.session.GameState;
import gd.safety.quizzle.session.GameSessionRegistry;

@Controller
public final class ParticipantEntryController {

	private final GameSessionRegistry sessionRegistry;

	public ParticipantEntryController(GameSessionRegistry sessionRegistry) {
		this.sessionRegistry = sessionRegistry;
	}

	@GetMapping("/{codehash:[A-Za-z0-9_-]{8,32}}/")
	public String participantEntry(@PathVariable String codehash) {
		if (sessionRegistry.find(codehash).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		return "forward:/participant.html";
	}

	// The reconnect cookie is scoped to /{codehash}/, so the trailing slash stays the canonical form.
	@GetMapping("/{codehash:[A-Za-z0-9_-]{8,32}}")
	public String participantEntryWithoutTrailingSlash(@PathVariable String codehash) {
		if (sessionRegistry.find(codehash).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		return "redirect:/" + codehash + "/";
	}

	// Lets the join form check eligibility before a name is entered, instead of only after submitting it.
	@GetMapping("/{codehash:[A-Za-z0-9_-]{8,32}}/status")
	@ResponseBody
	public ResponseEntity<StatusResponse> status(@PathVariable String codehash) {
		return sessionRegistry.find(codehash)
				.map(snapshot -> ResponseEntity.ok()
						.cacheControl(CacheControl.noStore())
						.body(new StatusResponse(snapshot.state() == GameState.LOBBY)))
				.orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
	}

	public record StatusResponse(boolean joinable) {
	}
}

