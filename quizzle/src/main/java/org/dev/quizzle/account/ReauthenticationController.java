package org.dev.quizzle.account;

import org.dev.quizzle.config.AuthProperties;
import org.dev.quizzle.security.GoogleLogin;
import org.dev.quizzle.security.SecurityConfiguration;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpSession;

@Controller
public final class ReauthenticationController {
	private final AuthProperties properties;
	public ReauthenticationController(AuthProperties properties) {this.properties=properties;}
	@GetMapping("/reauthenticate")
	public String reauthenticate(@RequestParam(defaultValue="/settings") String returnTo,HttpSession session) {
		if(!properties.googleEnabled()) return "redirect:/settings?error";
		session.setAttribute(GoogleLogin.REAUTH,new GoogleLogin.Reauth(AccountSession.currentAccountId(session),
				SecurityConfiguration.safeReturnTo(returnTo),java.time.Instant.now().getEpochSecond()));
		return "redirect:/oauth2/authorization/google";
	}
}
