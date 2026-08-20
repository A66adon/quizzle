package gd.safety.Quiz.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public final class PresenterEventHub {

	private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1_000L;

	private final Map<String, Set<SseEmitter>> presentersByCodehash = new ConcurrentHashMap<>();

	public SseEmitter register(String codehash) {
		SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
		Set<SseEmitter> room = presentersByCodehash.computeIfAbsent(
				codehash, ignored -> ConcurrentHashMap.newKeySet());
		room.add(emitter);
		emitter.onCompletion(() -> remove(codehash, emitter));
		emitter.onTimeout(emitter::complete);
		emitter.onError(ignored -> remove(codehash, emitter));
		return emitter;
	}

	public void send(SseEmitter emitter, String codehash, String statePayload) {
		try {
			emitter.send(SseEmitter.event().name("state").data(statePayload));
		} catch (IOException | IllegalStateException exception) {
			remove(codehash, emitter);
			emitter.complete();
		}
	}

	public void publish(String codehash, String statePayload) {
		Set<SseEmitter> room = presentersByCodehash.get(codehash);
		if (room == null) {
			return;
		}
		for (SseEmitter emitter : Set.copyOf(room)) {
			send(emitter, codehash, statePayload);
		}
	}

	@Scheduled(fixedDelay = 20_000)
	public void keepPresentersAlive() {
		for (Map.Entry<String, Set<SseEmitter>> room : presentersByCodehash.entrySet()) {
			for (SseEmitter emitter : Set.copyOf(room.getValue())) {
				try {
					emitter.send(SseEmitter.event().comment("keep-alive"));
				} catch (IOException | IllegalStateException exception) {
					remove(room.getKey(), emitter);
					emitter.complete();
				}
			}
		}
	}

	private void remove(String codehash, SseEmitter emitter) {
		Set<SseEmitter> room = presentersByCodehash.get(codehash);
		if (room == null) {
			return;
		}
		room.remove(emitter);
		if (room.isEmpty()) {
			presentersByCodehash.remove(codehash, room);
		}
	}
}
