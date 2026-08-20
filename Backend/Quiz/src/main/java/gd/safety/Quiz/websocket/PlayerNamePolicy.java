package gd.safety.Quiz.websocket;

import java.text.Normalizer;

import org.springframework.stereotype.Component;

import gd.safety.Quiz.config.WebSocketProperties;

@Component
public final class PlayerNamePolicy {

	private final int maximumLength;

	public PlayerNamePolicy(WebSocketProperties properties) {
		maximumLength = properties.maxNameLength();
	}

	public String validate(String suppliedName) {
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
