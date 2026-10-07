package org.dev.quizzle.persistence;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.dev.quizzle.session.GameSessionSnapshot;
import tools.jackson.databind.ObjectMapper;

@Repository
public final class PostgresSnapshotRepository {
	private static final int SCHEMA_VERSION = 2;
	private final JdbcTemplate jdbc;
	private final ObjectMapper mapper;

	public PostgresSnapshotRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
		this.jdbc = jdbc;
		this.mapper = mapper;
	}

	public void save(GameSessionSnapshot snapshot) {
		int changed = jdbc.update("""
				INSERT INTO session_snapshots(codehash,owner_account_id,schema_version,state,quiz_slug,
				    current_question_index,server_start_epoch_ms,payload,updated_at)
				VALUES (?,?,?,?,?,?,?,?::jsonb,?)
				ON CONFLICT(codehash) DO UPDATE SET schema_version=excluded.schema_version,
				    state=excluded.state,quiz_slug=excluded.quiz_slug,
				    current_question_index=excluded.current_question_index,
				    server_start_epoch_ms=excluded.server_start_epoch_ms,
				    payload=excluded.payload,updated_at=excluded.updated_at
				WHERE session_snapshots.owner_account_id=excluded.owner_account_id
				""", snapshot.codehash(), UUID.fromString(snapshot.ownerAccountId()), SCHEMA_VERSION,
				snapshot.state().name(), snapshot.quizFileName(), snapshot.currentQuestionIndex(),
				snapshot.serverStartEpochMs(), mapper.writeValueAsString(snapshot),
				Timestamp.from(Instant.ofEpochMilli(snapshot.updatedAtEpochMs())));
		if (changed != 1) throw new IllegalStateException("Snapshot code belongs to another account");
	}

	public void delete(String codehash) {
		jdbc.update("DELETE FROM session_snapshots WHERE codehash=?", codehash);
	}

	public List<GameSessionSnapshot> loadAll() {
		return jdbc.query("SELECT codehash,owner_account_id,schema_version,payload FROM session_snapshots ORDER BY updated_at",
				(row, index) -> {
					if (row.getInt("schema_version") != SCHEMA_VERSION) {
						throw new IllegalStateException("Unsupported snapshot schema: " + row.getString("codehash"));
					}
					GameSessionSnapshot snapshot = mapper.readValue(row.getString("payload"), GameSessionSnapshot.class);
					if (!snapshot.codehash().equals(row.getString("codehash"))) {
						throw new IllegalStateException("Snapshot code does not match its row");
					}
					if (!snapshot.ownerAccountId().equals(row.getString("owner_account_id"))) {
						throw new IllegalStateException("Snapshot owner does not match its row");
					}
					return snapshot;
				});
	}
}
