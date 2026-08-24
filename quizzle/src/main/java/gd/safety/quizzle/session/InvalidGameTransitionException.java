package gd.safety.quizzle.session;

public final class InvalidGameTransitionException extends RuntimeException {

	public InvalidGameTransitionException(GameState state, GameCommand command) {
		super("Command " + command + " is not allowed while session is " + state);
	}
}
