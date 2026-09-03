package org.dev.quizzle.websocket;

import java.text.Normalizer;

import org.springframework.stereotype.Component;

import org.dev.quizzle.config.WebSocketProperties;

@Component
public final class PlayerNamePolicy {

	private final int maximumLength;

	public PlayerNamePolicy(WebSocketProperties properties) {
		maximumLength = properties.maxNameLength();
	}

	public String validate(String suppliedName, String codehash) {
		if (suppliedName == null) {
			throw new InvalidPlayerNameException("Enter a name to join.");
		}
		String name = Normalizer.normalize(suppliedName, Normalizer.Form.NFKC).strip();
		if (name.isBlank()) {
			throw new InvalidPlayerNameException("Enter a name to join.");
		}
		int length = name.codePointCount(0, name.length());
		if (length > maximumLength) {
			throw new InvalidPlayerNameException("Names may contain at most " + maximumLength + " characters.");
		}
		// The room codehash is the session identifier, never a real display name. Rejecting it here stops an
		// automated or misdirected JOIN (which only tends to appear once there are many participants) from
		// ever registering a "player" whose name is identical to the session ID.
		if (codehash != null && name.equalsIgnoreCase(codehash)) {
			throw new InvalidPlayerNameException("That name is reserved. Please choose a different one.");
		}
		for (int offset = 0; offset < name.length();) {
			int codePoint = name.codePointAt(offset);
			int type = Character.getType(codePoint);
			if (Character.isISOControl(codePoint)
					|| type == Character.FORMAT
					|| type == Character.PRIVATE_USE
					|| codePoint == '<'
					|| codePoint == '>'
					|| codePoint == '&') {
				throw new InvalidPlayerNameException("The name contains unsupported characters.");
			}
			offset += Character.charCount(codePoint);
		}
		return name;
	}

	public static final class InvalidPlayerNameException extends RuntimeException {

		public InvalidPlayerNameException(String message) {
			super(message);
		}
	}
}
