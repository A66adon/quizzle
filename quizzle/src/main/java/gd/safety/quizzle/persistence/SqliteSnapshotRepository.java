package gd.safety.quizzle.persistence;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import gd.safety.quizzle.config.SnapshotProperties;
import gd.safety.quizzle.session.GameSessionSnapshot;
import jakarta.annotation.PostConstruct;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Repository
public final class SqliteSnapshotRepository {

	private static final Logger LOGGER = LoggerFactory.getLogger(SqliteSnapshotRepository.class);
	private static final int SNAPSHOT_SCHEMA_VERSION = 1;
	private static final String UPSERT_SQL = """
			INSERT INTO session_snapshots (
			    codehash, schema_version, state, current_question_index,
			    server_start_epoch_ms, updated_at_epoch_ms, payload_json
			) VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(codehash) DO UPDATE SET
			    schema_version = excluded.schema_version,
			    state = excluded.state,
			    current_question_index = excluded.current_question_index,
			    server_start_epoch_ms = excluded.server_start_epoch_ms,
			    updated_at_epoch_ms = excluded.updated_at_epoch_ms,
			    payload_json = excluded.payload_json
			""";

	private final Path databasePath;
	private final String jdbcUrl;
	private final int busyTimeoutMs;
	private final ObjectMapper objectMapper;
	private final ReentrantLock databaseWriterLock = new ReentrantLock();

	public SqliteSnapshotRepository(SnapshotProperties properties, ObjectMapper objectMapper) {
		databasePath = properties.databasePath().toAbsolutePath().normalize();
		jdbcUrl = "jdbc:sqlite:" + databasePath.toString().replace('\\', '/');
		busyTimeoutMs = properties.busyTimeoutMs();
		this.objectMapper = objectMapper;
	}

	@PostConstruct
	public void initialize() {
		try {
			Path parent = databasePath.getParent();
			if (parent != null) {
				Files.createDirectories(parent);
			}
		} catch (IOException exception) {
			throw new SnapshotPersistenceException("Could not create the SQLite snapshot directory", exception);
		}

		databaseWriterLock.lock();
		try (Connection connection = openConnection(); Statement statement = connection.createStatement()) {
			statement.execute("PRAGMA journal_mode=WAL");
			statement.execute("PRAGMA synchronous=NORMAL");
			statement.execute("""
					CREATE TABLE IF NOT EXISTS session_snapshots (
					    codehash TEXT PRIMARY KEY,
					    schema_version INTEGER NOT NULL,
					    state TEXT NOT NULL,
					    current_question_index INTEGER NOT NULL,
					    server_start_epoch_ms INTEGER NOT NULL,
					    updated_at_epoch_ms INTEGER NOT NULL,
					    payload_json TEXT NOT NULL
					)
					""");
		} catch (SQLException exception) {
			throw new SnapshotPersistenceException("Could not initialize the SQLite snapshot store", exception);
		} finally {
			databaseWriterLock.unlock();
		}
	}

	public void save(GameSessionSnapshot snapshot) {
		String payload = serialize(snapshot);
		databaseWriterLock.lock();
		try (Connection connection = openConnection()) {
			connection.setAutoCommit(false);
			try (PreparedStatement statement = connection.prepareStatement(UPSERT_SQL)) {
				statement.setString(1, snapshot.codehash());
				statement.setInt(2, SNAPSHOT_SCHEMA_VERSION);
				statement.setString(3, snapshot.state().name());
				statement.setInt(4, snapshot.currentQuestionIndex());
				statement.setLong(5, snapshot.serverStartEpochMs());
				statement.setLong(6, snapshot.updatedAtEpochMs());
				statement.setString(7, payload);
				statement.executeUpdate();
				connection.commit();
			} catch (SQLException exception) {
				rollback(connection);
				throw exception;
			}
		} catch (SQLException exception) {
			throw new SnapshotPersistenceException(
					"Could not snapshot session " + snapshot.codehash(), exception);
		} finally {
			databaseWriterLock.unlock();
		}
	}

	public void delete(String codehash) {
		databaseWriterLock.lock();
		try (Connection connection = openConnection();
				PreparedStatement statement = connection.prepareStatement(
						"DELETE FROM session_snapshots WHERE codehash = ?")) {
			statement.setString(1, codehash);
			statement.executeUpdate();
		} catch (SQLException exception) {
			throw new SnapshotPersistenceException("Could not delete session " + codehash, exception);
		} finally {
			databaseWriterLock.unlock();
		}
	}

	public List<GameSessionSnapshot> loadAll() {
		List<GameSessionSnapshot> snapshots = new ArrayList<>();
		try (Connection connection = openConnection();
				PreparedStatement statement = connection.prepareStatement(
						"SELECT codehash, schema_version, payload_json FROM session_snapshots "
								+ "ORDER BY updated_at_epoch_ms ASC");
				ResultSet resultSet = statement.executeQuery()) {
			while (resultSet.next()) {
				String codehash = resultSet.getString("codehash");
				int schemaVersion = resultSet.getInt("schema_version");
				if (schemaVersion != SNAPSHOT_SCHEMA_VERSION) {
					LOGGER.warn("Skipped session snapshot with unsupported schema: {}", codehash);
					continue;
				}
				try {
					GameSessionSnapshot snapshot = objectMapper.readValue(
							resultSet.getString("payload_json"), GameSessionSnapshot.class);
					if (!codehash.equals(snapshot.codehash())) {
						LOGGER.warn("Skipped session snapshot with mismatched codehash: {}", codehash);
						continue;
					}
					snapshots.add(snapshot);
				} catch (RuntimeException exception) {
					LOGGER.warn("Skipped unreadable session snapshot: {}", codehash);
				}
			}
		} catch (SQLException exception) {
			throw new SnapshotPersistenceException("Could not load SQLite session snapshots", exception);
		}
		return List.copyOf(snapshots);
	}

	private Connection openConnection() throws SQLException {
		Connection connection = DriverManager.getConnection(jdbcUrl);
		try (Statement statement = connection.createStatement()) {
			statement.execute("PRAGMA busy_timeout=" + busyTimeoutMs);
			statement.execute("PRAGMA foreign_keys=ON");
		}
		return connection;
	}

	private String serialize(GameSessionSnapshot snapshot) {
		try {
			return objectMapper.writeValueAsString(snapshot);
		} catch (JacksonException exception) {
			throw new SnapshotPersistenceException(
					"Could not serialize session " + snapshot.codehash(), exception);
		}
	}

	private void rollback(Connection connection) {
		try {
			connection.rollback();
		} catch (SQLException rollbackException) {
			LOGGER.error("Could not roll back SQLite snapshot transaction", rollbackException);
		}
	}

	public static final class SnapshotPersistenceException extends RuntimeException {

		private SnapshotPersistenceException(String message, Throwable cause) {
			super(message, cause);
		}
	}
}

