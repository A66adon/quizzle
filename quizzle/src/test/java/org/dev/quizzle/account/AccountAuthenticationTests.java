package org.dev.quizzle.account;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import org.dev.quizzle.security.CsrfToken;

@SpringBootTest(properties = {
		"quiz.account.file=${java.io.tmpdir}/safety-quiz-accounts-${random.uuid}.yml",
		"quiz.catalog.directory=./quizzes",
		"quiz.session.public-base-url=https://quiz.example.test",
		"quiz.snapshot.database-path=${java.io.tmpdir}/safety-quiz-admin-${random.uuid}.db",
		"quiz.snapshot.interval-ms=3600000"
})
@AutoConfigureMockMvc
class AccountAuthenticationTests {

	@Autowired
	MockMvc mockMvc;

	@Test
	void protectsAdminPagesAndDataWithoutASession() throws Exception {
		mockMvc.perform(get("/admin"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"));
		mockMvc.perform(get("/admin.html"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"));
		mockMvc.perform(get("/admin/api/quizzes"))
				.andExpect(status().isUnauthorized())
				.andExpect(header().string("Cache-Control", "no-store"));
	}

	@Test
	void rejectsRegistrationWithAnInvalidUsername() throws Exception {
		MockHttpSession session = new MockHttpSession();
		String token = obtainCsrfToken(session);

		mockMvc.perform(post("/register")
				.session(session)
				.param("username", "no spaces allowed")
				.param("password", "correct horse battery staple")
				.param("_csrf", token))
				.andExpect(status().is3xxRedirection())
				.andExpect(header().string("Location", containsString("/register?error=")));
	}

	@Test
	void rejectsADuplicateUsername() throws Exception {
		registerAccount("taken-name", "correct horse battery staple");
		MockHttpSession session = new MockHttpSession();
		String token = obtainCsrfToken(session);

		mockMvc.perform(post("/register")
				.session(session)
				.param("username", "taken-name")
				.param("password", "correct horse battery staple")
				.param("_csrf", token))
				.andExpect(status().is3xxRedirection())
				.andExpect(header().string("Location", containsString("/register?error=")));
	}

	@Test
	void rejectsAnIncorrectPasswordWithoutReflectingIt() throws Exception {
		MockHttpSession session = registerAccount("wrong-and-private-test", "correct horse battery staple");

		mockMvc.perform(post("/login")
				.session(session)
				.param("username", "wrong-and-private-test")
				.param("password", "not-the-password")
				.param("_csrf", CsrfToken.getOrCreate(session)))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login?error"))
				.andExpect(content().string(not(containsString("not-the-password"))));
	}

	@Test
	void authenticatedSessionCanReadOnlySafeCatalogData() throws Exception {
		MockHttpSession session = login("phase-one-account", "correct horse battery staple");

		mockMvc.perform(get("/admin").session(session))
				.andExpect(status().isOk())
				.andExpect(forwardedUrl("/admin.html"));
		mockMvc.perform(get("/admin.html").session(session))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Quiz sessions")));
		mockMvc.perform(get("/admin/api/quizzes").session(session))
				.andExpect(status().isOk())
				.andExpect(header().string("Cache-Control", "no-store"))
				.andExpect(jsonPath("$.quizzes[?(@.fileName=='safety-basics.yaml')].questionCount").value(2))
				.andExpect(jsonPath("$.quizzes[*].questions").doesNotExist())
				.andExpect(content().string(not(containsString("phase-one-secret"))))
				.andExpect(content().string(not(containsString("correct"))));
	}

	@Test
	void logoutInvalidatesTheAccountSession() throws Exception {
		MockHttpSession session = login("phase-one-logout", "correct horse battery staple");

		mockMvc.perform(post("/logout")
				.session(session)
				.param("_csrf", CsrfToken.getOrCreate(session)))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login"))
				.andExpect(header().string("Clear-Site-Data", "\"cache\""));
		mockMvc.perform(get("/admin/api/quizzes"))
				.andExpect(status().isUnauthorized());
	}

	private String obtainCsrfToken(MockHttpSession session) throws Exception {
		mockMvc.perform(get("/register").session(session)).andExpect(status().isOk());
		return CsrfToken.getOrCreate(session);
	}

	private MockHttpSession registerAccount(String username, String password) throws Exception {
		MockHttpSession session = new MockHttpSession();
		String token = obtainCsrfToken(session);
		mockMvc.perform(post("/register")
				.session(session)
				.param("username", username)
				.param("password", password)
				.param("_csrf", token))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/login?registered"));
		return session;
	}

	private MockHttpSession login(String username, String password) throws Exception {
		registerAccount(username, password);

		MockHttpSession session = new MockHttpSession();
		String token = obtainCsrfToken(session);
		MvcResult result = mockMvc.perform(post("/login")
				.session(session)
				.param("username", username)
				.param("password", password)
				.param("_csrf", token))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin"))
				.andReturn();
		MockHttpSession authenticatedSession = (MockHttpSession) result.getRequest().getSession(false);
		assertNotNull(authenticatedSession);
		return authenticatedSession;
	}
}
