package org.dev.quizzle.account;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.Optional;
import org.dev.quizzle.config.AccountProperties;
import org.dev.quizzle.config.AuthProperties;
import org.dev.quizzle.security.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

@WebMvcTest(AccountAuthController.class)
@Import({SecurityConfiguration.class, AuthSecurityTests.Config.class})
class AuthSecurityTests {
	@Autowired MockMvc mvc;
	@MockitoBean AccountService service;
	@MockitoBean AccountTokens tokens;
	@MockitoBean AccountStore store;
	@TestConfiguration static class Config {
		@Bean AuthRateLimiter limiter() { return new AuthRateLimiter(); }
		@Bean AuthProperties auth() { return new AuthProperties("", 1440, 30, "", "", "test@example.test"); }
		@Bean AccountProperties properties() { return new AccountProperties(8); }
	}
	@Test void protectsHtmlAndApiAndRejectsCsrf() throws Exception {
		for (String path : new String[]{"/admin", "/admin.html", "/editor", "/editor.html", "/settings", "/settings.html"})
			mvc.perform(get(path)).andExpect(status().is3xxRedirection()).andExpect(redirectedUrl("/login"));
		mvc.perform(get("/admin/api/quizzes")).andExpect(status().isUnauthorized());
		mvc.perform(post("/register").param("email", "a@example.test")).andExpect(status().isForbidden());
		mvc.perform(get("/auth/options")).andExpect(status().isOk()).andExpect(jsonPath("$.googleEnabled").value(false))
				.andExpect(header().string("Referrer-Policy", "no-referrer")).andExpect(header().string("X-Frame-Options", "DENY"));
	}
	@Test void rawSessionBoundCookieAcceptsFormAndRejectsAnotherSession() throws Exception {
		var session = new MockHttpSession();
		mvc.perform(get("/login").session(session)).andExpect(cookie().exists("XSRF-TOKEN"));
		String csrf = CsrfToken.getOrCreate(session);
		mvc.perform(post("/forgot-password").session(session).param("_csrf", csrf).param("email", "private@example.test"))
				.andExpect(redirectedUrl("/forgot-password?sent"));
		mvc.perform(post("/forgot-password").session(new MockHttpSession()).header("X-XSRF-TOKEN", csrf))
				.andExpect(status().isForbidden());
	}
	@Test void verificationAndResetNeverAuthenticate() throws Exception {
		when(tokens.verify("raw")).thenReturn(true);
		mvc.perform(get("/verify-email").param("token", "raw")).andExpect(redirectedUrl("/login?verified"));
		mvc.perform(get("/admin")).andExpect(redirectedUrl("/login"));
		var session = new MockHttpSession();
		mvc.perform(get("/login").session(session));
		when(tokens.reset("raw", "long-password")).thenReturn(true);
		mvc.perform(post("/reset-password").session(session).param("_csrf", CsrfToken.getOrCreate(session))
				.param("token", "raw").param("password", "long-password").param("passwordConfirmation", "long-password"))
				.andExpect(redirectedUrl("/login?reset"));
	}
	@Test void loginRotatesSessionAndRejectsOpenRedirect() throws Exception {
		when(service.authenticatePrincipal("a@example.test", "password")).thenReturn(Optional.of(new AccountPrincipal("account", 2, 0)));
		var session = new MockHttpSession(); mvc.perform(get("/login").session(session));
		String previous = session.getId();
		var result = mvc.perform(post("/login").session(session).param("_csrf", CsrfToken.getOrCreate(session))
				.param("email", "a@example.test").param("password", "password").param("returnTo", "//evil.test"))
				.andExpect(redirectedUrl("/admin")).andReturn();
		org.junit.jupiter.api.Assertions.assertNotEquals(previous, result.getRequest().getSession().getId());
	}
	@Test void legacyAttributeIsNotAnAuthenticationBypass() {
		var session = new MockHttpSession(); session.setAttribute(AccountSession.class.getName() + ".accountId", "evil");
		org.junit.jupiter.api.Assertions.assertFalse(AccountSession.isAuthenticated(session));
	}
}
