package org.dev.quizzle.admin;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import tools.jackson.databind.ObjectMapper;

import org.dev.quizzle.security.CsrfToken;
import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.config.QuizCatalogProperties;

@SpringBootTest(properties = {
		"quiz.account.file=./build/test-data/admin-accounts-${random.uuid}.yml",
		"quiz.catalog.directory=./build/test-data/admin-quizzes-${random.uuid}",
		"quiz.session.public-base-url=https://quiz.example.test/events",
		"quiz.snapshot.database-path=./build/test-data/admin-sessions-${random.uuid}.db",
		"quiz.snapshot.interval-ms=3600000"
})
@AutoConfigureMockMvc
class AdminGameSessionTests {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	ObjectMapper objectMapper;

	@Autowired
	QuizCatalogProperties catalogProperties;

	@Test
	void protectsCreationFromUnauthenticatedRequests() throws Exception {
		mockMvc.perform(post("/admin/api/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"quizFileName\":\"safety-basics.yaml\"}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void createsUniqueSessionsAndServesSafeSummariesAndLocalQrCodes() throws Exception {
		MockHttpSession adminSession = login();
		String firstCodehash = createSession(adminSession);
		String secondCodehash = createSession(adminSession);

		assertNotEquals(firstCodehash, secondCodehash);
		assertTrue(firstCodehash.matches("[A-Za-z0-9_-]{10}"));

		mockMvc.perform(get("/admin/api/sessions/{codehash}", firstCodehash).session(adminSession))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.state").value("LOBBY"))
				.andExpect(jsonPath("$.currentQuestionIndex").value(-1))
				.andExpect(jsonPath("$.serverStartEpochMs").value(0))
				.andExpect(jsonPath("$.joinUrl")
						.value("https://quiz.example.test/events/" + firstCodehash + "/"))
				.andExpect(jsonPath("$.qrUrl")
						.value("/admin/api/sessions/" + firstCodehash + "/qr.svg"))
				.andExpect(jsonPath("$.autoAdvanceDelayMs").value(5000))
				.andExpect(jsonPath("$.quiz").doesNotExist())
				.andExpect(jsonPath("$.players").doesNotExist())
				.andExpect(content().string(not(containsString("correct"))))
				.andExpect(content().string(not(containsString("phase-two-secret"))));

		mockMvc.perform(get("/admin/api/sessions").session(adminSession))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].codehash").exists())
				.andExpect(jsonPath("$[1].codehash").exists());

		mockMvc.perform(get("/admin/api/sessions/{codehash}/qr.svg", firstCodehash).session(adminSession))
				.andExpect(status().isOk())
				.andExpect(header().string("Content-Type", containsString("image/svg+xml")))
				.andExpect(header().string("X-Content-Type-Options", "nosniff"))
				.andExpect(content().string(containsString("<svg")))
				.andExpect(content().string(containsString("<path")));
	}

	@Test
	void rejectsMissingOrUnknownQuizSelections() throws Exception {
		MockHttpSession adminSession = login();

		mockMvc.perform(post("/admin/api/sessions")
				.session(adminSession)
				.header(CsrfToken.HEADER_NAME, CsrfToken.getOrCreate(adminSession))
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isBadRequest());
		mockMvc.perform(post("/admin/api/sessions")
				.session(adminSession)
				.header(CsrfToken.HEADER_NAME, CsrfToken.getOrCreate(adminSession))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"quizFileName\":\"missing.yaml\"}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void servesThePresenterPageAndRejectsUnknownParticipants() throws Exception {
		MockHttpSession adminSession = login();
		String codehash = createSession(adminSession);

		mockMvc.perform(get("/admin/sessions/{codehash}", codehash).session(adminSession))
				.andExpect(status().isOk())
				.andExpect(forwardedUrl("/presenter.html"));
		mockMvc.perform(get("/admin/sessions/{codehash}", codehash))
				.andExpect(status().is3xxRedirection());
		mockMvc.perform(post("/admin/api/sessions/{codehash}/players/{playerId}/kick",
				codehash, UUID.randomUUID())
				.session(adminSession)
				.header(CsrfToken.HEADER_NAME, CsrfToken.getOrCreate(adminSession)))
				.andExpect(status().isNotFound());
	}

	private String createSession(MockHttpSession adminSession) throws Exception {
		MvcResult result = mockMvc.perform(post("/admin/api/sessions")
				.session(adminSession)
				.header(CsrfToken.HEADER_NAME, CsrfToken.getOrCreate(adminSession))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"quizFileName\":\"safety-basics.yaml\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.quizTitle").value("Workplace Safety Basics"))
				.andReturn();
		return objectMapper.readTree(result.getResponse().getContentAsString()).get("codehash").asString();
	}

	private MockHttpSession login() throws Exception {
		String username = "admin-" + UUID.randomUUID().toString().substring(0, 16);
		MockHttpSession session = new MockHttpSession();
		mockMvc.perform(get("/register").session(session)).andExpect(status().isOk());
		String csrfToken = CsrfToken.getOrCreate(session);

		mockMvc.perform(post("/register")
				.session(session)
				.param("username", username)
				.param("password", "phase-two-secret-password")
				.param("_csrf", csrfToken))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin?welcome"));

		session = new MockHttpSession();
		mockMvc.perform(get("/login").session(session)).andExpect(status().isOk());
		csrfToken = CsrfToken.getOrCreate(session);
		MvcResult result = mockMvc.perform(post("/login")
				.session(session)
				.param("username", username)
				.param("password", "phase-two-secret-password")
				.param("_csrf", csrfToken))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin"))
				.andReturn();
		MockHttpSession authenticatedSession = (MockHttpSession) result.getRequest().getSession(false);
		Path quizDirectory = Files.createDirectories(
				catalogProperties.directory().resolve(AccountSession.currentAccountId(authenticatedSession)));
		Files.copy(Path.of("quizzes", "safety-basics.yaml"), quizDirectory.resolve("safety-basics.yaml"));
		return authenticatedSession;
	}
}
