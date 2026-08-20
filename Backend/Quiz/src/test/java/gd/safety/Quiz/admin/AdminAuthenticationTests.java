package gd.safety.Quiz.admin;

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

@SpringBootTest(properties = {
		"quiz.admin.password=phase-one-secret",
		"quiz.catalog.directory=./quizzes",
		"quiz.session.public-base-url=https://quiz.example.test",
		"quiz.snapshot.database-path=${java.io.tmpdir}/safety-quiz-admin-${random.uuid}.db",
		"quiz.snapshot.interval-ms=3600000"
})
@AutoConfigureMockMvc
class AdminAuthenticationTests {

	@Autowired
	MockMvc mockMvc;

	@Test
	void protectsAdminPagesAndDataWithoutASession() throws Exception {
		mockMvc.perform(get("/admin"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/login"));
		mockMvc.perform(get("/admin.html"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/login"));
		mockMvc.perform(get("/admin/api/quizzes"))
				.andExpect(status().isUnauthorized())
				.andExpect(header().string("Cache-Control", "no-store"));
	}

	@Test
	void rejectsAnIncorrectPasswordWithoutReflectingIt() throws Exception {
		mockMvc.perform(post("/admin/login").param("password", "wrong-and-private"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/login?error"))
				.andExpect(content().string(not(containsString("wrong-and-private"))));
	}

	@Test
	void authenticatedSessionCanReadOnlySafeCatalogData() throws Exception {
		MockHttpSession session = login();

		mockMvc.perform(get("/admin").session(session))
				.andExpect(status().isOk())
				.andExpect(forwardedUrl("/admin.html"));
		mockMvc.perform(get("/admin.html").session(session))
				.andExpect(status().isOk())
				.andExpect(content().string(containsString("Quiz sessions")));
		mockMvc.perform(get("/admin/api/quizzes").session(session))
				.andExpect(status().isOk())
				.andExpect(header().string("Cache-Control", "no-store"))
				.andExpect(jsonPath("$.quizzes[0].fileName").value("safety-basics.yaml"))
				.andExpect(jsonPath("$.quizzes[0].questionCount").value(2))
				.andExpect(jsonPath("$.quizzes[0].questions").doesNotExist())
				.andExpect(content().string(not(containsString("phase-one-secret"))))
				.andExpect(content().string(not(containsString("correct"))));
	}

	@Test
	void logoutInvalidatesTheAdminSession() throws Exception {
		MockHttpSession session = login();

		mockMvc.perform(post("/admin/logout").session(session))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin/login"))
				.andExpect(header().string("Clear-Site-Data", "\"cache\""));
		mockMvc.perform(get("/admin/api/quizzes"))
				.andExpect(status().isUnauthorized());
	}

	private MockHttpSession login() throws Exception {
		MvcResult result = mockMvc.perform(post("/admin/login").param("password", "phase-one-secret"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/admin"))
				.andReturn();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
		assertNotNull(session);
		return session;
	}
}



