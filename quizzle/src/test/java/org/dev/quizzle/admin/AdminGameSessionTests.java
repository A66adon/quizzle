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
import org.dev.quizzle.quiz.catalog.QuizEditorService;
import org.dev.quizzle.quiz.catalog.QuizYamlParser;

@SpringBootTest(properties = {
		"quiz.session.public-base-url=https://quiz.example.test/events",
		"quiz.snapshot.interval-ms=3600000"
})
@AutoConfigureMockMvc
class AdminGameSessionTests extends org.dev.quizzle.persistence.PostgresIntegrationSupport {

	@Autowired
	MockMvc mockMvc;

	@Autowired
	ObjectMapper objectMapper;

	@Autowired
	QuizEditorService editorService;

	@Autowired
	QuizYamlParser parser;

	@Autowired org.dev.quizzle.account.AccountService accountService;
	@Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

	@Test
	void protectsCreationFromUnauthenticatedRequests() throws Exception {
		mockMvc.perform(post("/admin/api/sessions")
				.with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
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
				.content("{\"quizFileName\":\"" + adminSession.getAttribute("testQuizFileName") + "\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.quizTitle").value("Workplace Safety Basics"))
				.andReturn();
		return objectMapper.readTree(result.getResponse().getContentAsString()).get("codehash").asString();
	}

	private MockHttpSession login() throws Exception {
		String username = "admin-" + UUID.randomUUID().toString().substring(0, 16)+"@example.test";
		MockHttpSession session = new MockHttpSession();
		mockMvc.perform(get("/register").session(session)).andExpect(status().isOk());
		String csrfToken = CsrfToken.getOrCreate(session);

		var account=accountService.register(username,"phase-two-secret-password");
		jdbc.update("UPDATE accounts SET status='ACTIVE' WHERE id=?",UUID.fromString(account.id()));

		session = new MockHttpSession();
		mockMvc.perform(get("/login").session(session)).andExpect(status().isOk());
		csrfToken = CsrfToken.getOrCreate(session);
		MvcResult result = mockMvc.perform(post("/login")
				.session(session)
				.param("email", username)
				.param("password", "phase-two-secret-password")
				.param("_csrf", csrfToken))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin"))
				.andReturn();
		MockHttpSession authenticatedSession = (MockHttpSession) result.getRequest().getSession(false);
		String fileName=editorService.create(AccountSession.currentAccountId(authenticatedSession),
				parser.parse(Files.readString(Path.of("quizzes", "safety-basics.yaml"))
						.replace("Workplace Safety Basics", "Safety Basics")));
		authenticatedSession.setAttribute("testQuizFileName",fileName);
		return authenticatedSession;
	}
}
