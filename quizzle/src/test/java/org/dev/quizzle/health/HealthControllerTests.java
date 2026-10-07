package org.dev.quizzle.health;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HealthControllerTests {

	@Test
	void publicHealthExposesOnlyStatus() throws Exception {
		MockMvcBuilders.standaloneSetup(new HealthController()).build()
				.perform(get("/health"))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"status\":\"UP\"}"));
	}
}
