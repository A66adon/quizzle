package org.dev.quizzle.websocket;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import org.dev.quizzle.session.GameSessionRegistry;

@Component
public final class CodehashHandshakeInterceptor implements HandshakeInterceptor {

	public static final String CODEHASH_ATTRIBUTE = CodehashHandshakeInterceptor.class.getName() + ".codehash";
	private static final Pattern ENDPOINT_PATTERN = Pattern.compile("/([A-Za-z0-9_-]{8,32})/data$");

	private final GameSessionRegistry sessionRegistry;

	public CodehashHandshakeInterceptor(GameSessionRegistry sessionRegistry) {
		this.sessionRegistry = sessionRegistry;
	}

	@Override
	public boolean beforeHandshake(
			ServerHttpRequest request,
			ServerHttpResponse response,
			WebSocketHandler wsHandler,
			Map<String, Object> attributes) {
		Matcher matcher = ENDPOINT_PATTERN.matcher(request.getURI().getPath());
		if (!matcher.find()) {
			response.setStatusCode(HttpStatus.BAD_REQUEST);
			return false;
		}
		String codehash = matcher.group(1);
		if (sessionRegistry.find(codehash).isEmpty()) {
			response.setStatusCode(HttpStatus.NOT_FOUND);
			return false;
		}
		attributes.put(CODEHASH_ATTRIBUTE, codehash);
		return true;
	}

	@Override
	public void afterHandshake(
			ServerHttpRequest request,
			ServerHttpResponse response,
			WebSocketHandler wsHandler,
			Exception exception) {
		// No handshake resources need cleanup.
	}
}
