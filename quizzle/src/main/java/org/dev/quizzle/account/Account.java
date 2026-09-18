package org.dev.quizzle.account;

import java.util.List;
import java.util.Objects;

/**
 * A registered user identity. {@code verified} defaults to {@code true} today because no
 * email-verification step exists yet; a future phase can start issuing unverified accounts
 * without changing this shape. {@code roles} is reserved and always empty for now.
 * {@code allowLateJoin} and {@code autoAdvanceDelayMs} are per-account game defaults, editable
 * from the Settings screen, applied to games this account creates.
 */
public record Account(
		String id,
		String email,
		String passwordHash,
		boolean verified,
		List<String> roles,
		long createdAtEpochMs,
		boolean allowLateJoin,
		long autoAdvanceDelayMs) {

	public Account {
		Objects.requireNonNull(id, "id");
		Objects.requireNonNull(email, "email");
		Objects.requireNonNull(passwordHash, "passwordHash");
		roles = roles == null ? List.of() : List.copyOf(roles);
	}

	public Account withPasswordHash(String newPasswordHash) {
		return new Account(id, email, newPasswordHash, verified, roles, createdAtEpochMs,
				allowLateJoin, autoAdvanceDelayMs);
	}

	public Account withGameSettings(boolean newAllowLateJoin, long newAutoAdvanceDelayMs) {
		return new Account(id, email, passwordHash, verified, roles, createdAtEpochMs,
				newAllowLateJoin, newAutoAdvanceDelayMs);
	}
}
