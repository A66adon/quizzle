package org.dev.quizzle.security;

import java.util.concurrent.ConcurrentHashMap;
import jakarta.servlet.http.*;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

/** Only tracks real servlet sessions; container expiry and logout remove entries. */
@Component
public final class AccountSessions implements HttpSessionListener {
	private final ConcurrentHashMap<String,HttpSession> sessions=new ConcurrentHashMap<>();
	@Override public void sessionCreated(HttpSessionEvent event) {sessions.put(event.getSession().getId(),event.getSession());}
	@Override public void sessionDestroyed(HttpSessionEvent event) {
		sessions.values().removeIf(session->session==event.getSession());
	}
	@Bean ServletListenerRegistrationBean<AccountSessions> accountSessionListener() {
		return new ServletListenerRegistrationBean<>(this);
	}
	public void revoke(String accountId,long version,String retainSessionId) {
		for(HttpSession session:sessions.values()) {
			try {
				if(session.getId().equals(retainSessionId)) continue;
				Object stored=session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);
				if(stored instanceof SecurityContext context && context.getAuthentication()!=null
						&& context.getAuthentication().getPrincipal() instanceof AccountPrincipal principal
						&& principal.accountId().equals(accountId) && principal.credentialVersion()<version) session.invalidate();
			} catch(IllegalStateException alreadyExpired) {sessions.values().removeIf(value->value==session);}
		}
	}
}
