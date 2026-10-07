package org.dev.quizzle.security;

import static org.mockito.Mockito.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.dev.quizzle.account.*;
import org.dev.quizzle.config.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

@WebMvcTest(ReauthenticationController.class)
@Import({SecurityConfiguration.class,GoogleSecurityTests.Config.class})
class GoogleSecurityTests {
	@Autowired MockMvc mvc;
	@MockitoBean AccountService accounts;
	@MockitoBean AccountStore store;
	@MockitoBean GoogleIdentityService identities;
	@TestConfiguration static class Config {
		@Bean AuthProperties auth() {return new AuthProperties("",1440,30,"test-client","test-secret","from@example.test");}
		@Bean AuthRateLimiter limiter() {return new AuthRateLimiter();}
	}
	@Test void configuredGoogleRedirectIncludesStateNonceAndReauthRequiresForcedLogin() throws Exception {
		mvc.perform(get("/oauth2/authorization/google")).andExpect(status().is3xxRedirection())
				.andExpect(header().string("Location",containsString("state=")))
				.andExpect(header().string("Location",containsString("nonce=")));
		var session=new MockHttpSession(); AccountSession.authenticate(session,"account");
		when(store.isCurrentActive("account",0)).thenReturn(true);
		mvc.perform(get("/reauthenticate").session(session).param("returnTo","/settings"))
				.andExpect(redirectedUrl("/oauth2/authorization/google"));
		mvc.perform(get("/oauth2/authorization/google").session(session))
				.andExpect(header().string("Location",containsString("prompt=login")))
				.andExpect(header().string("Location",containsString("max_age=0")));
	}
	@Test void callbackWithoutBoundStateFailsGenerically() throws Exception {
		mvc.perform(get("/login/oauth2/code/google").param("code","untrusted").param("state","untrusted"))
				.andExpect(redirectedUrl("/login?error"));
		verifyNoInteractions(identities);
	}
}
