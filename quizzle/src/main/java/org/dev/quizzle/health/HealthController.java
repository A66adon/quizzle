package org.dev.quizzle.health;

import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public final class HealthController {
	private final JdbcTemplate jdbc;

	public HealthController(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@GetMapping("/health")
	public ResponseEntity<Map<String, String>> health() {
		try {
			if (Integer.valueOf(1).equals(jdbc.queryForObject("SELECT 1", Integer.class))) {
				return ResponseEntity.ok(Map.of("status", "UP"));
			}
		} catch (DataAccessException exception) {
			// Readiness is public: never expose database addresses or connection errors.
		}
		return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
	}
}
