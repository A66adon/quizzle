package org.dev.quizzle.health;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.CannotGetJdbcConnectionException;

class HealthControllerTests {

	@Test
	void publicHealthExposesOnlyStatus() throws Exception {
		JdbcTemplate jdbc = mock(JdbcTemplate.class);
		when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
		MockMvcBuilders.standaloneSetup(new HealthController(jdbc)).build()
				.perform(get("/health"))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"status\":\"UP\"}"));
	}

	@Test
	void databaseFailureReturnsUnavailableWithoutPublicDetails() throws Exception {
		JdbcTemplate jdbc = mock(JdbcTemplate.class);
		when(jdbc.queryForObject("SELECT 1", Integer.class))
				.thenThrow(new CannotGetJdbcConnectionException("private-database-address"));
		MockMvcBuilders.standaloneSetup(new HealthController(jdbc)).build()
				.perform(get("/health"))
				.andExpect(status().isServiceUnavailable())
				.andExpect(content().json("{\"status\":\"DOWN\"}"));
	}
}
