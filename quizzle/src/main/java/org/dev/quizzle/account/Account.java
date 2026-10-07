package org.dev.quizzle.account;

import java.util.List;
import java.util.Objects;

/**
 * A registered user identity. Status is persisted; verified is a compatibility view of ACTIVE.
 * OAuth-only identities have no password hash. {@code roles} is reserved and empty for now.
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
		long autoAdvanceDelayMs,
		Status status) {

	public enum Status { PENDING_VERIFICATION, ACTIVE, DISABLED }

	public Account(String id, String email, String passwordHash, boolean verified, List<String> roles,
			long createdAtEpochMs, boolean allowLateJoin, long autoAdvanceDelayMs) {
		this(id, email, passwordHash, verified, roles, createdAtEpochMs, allowLateJoin,
				autoAdvanceDelayMs, verified ? Status.ACTIVE : Status.PENDING_VERIFICATION);
	}

	public Account {
		Objects.requireNonNull(id, "id");
		Objects.requireNonNull(email, "email");
		Objects.requireNonNull(status, "status");
		verified = status == Status.ACTIVE;
		roles = roles == null ? List.of() : List.copyOf(roles);
	}

	public Account withPasswordHash(String newPasswordHash) {
		return new Account(id, email, newPasswordHash, verified, roles, createdAtEpochMs,
				allowLateJoin, autoAdvanceDelayMs, status);
	}

	public Account withGameSettings(boolean newAllowLateJoin, long newAutoAdvanceDelayMs) {
		return new Account(id, email, passwordHash, verified, roles, createdAtEpochMs,
				newAllowLateJoin, newAutoAdvanceDelayMs, status);
	}
}
