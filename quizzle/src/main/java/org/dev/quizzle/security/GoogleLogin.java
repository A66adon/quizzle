package org.dev.quizzle.security;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.Collection;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.client.web.*;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.oidc.*;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

public final class GoogleLogin {
	public static final String REAUTH = GoogleLogin.class.getName()+".reauth";
	public record Reauth(String accountId, String returnTo, long initiatedAt) implements java.io.Serializable {}
	private GoogleLogin() {}
	public static ClientRegistrationRepository registrations(org.dev.quizzle.config.AuthProperties properties) {
		return new InMemoryClientRegistrationRepository(ClientRegistration.withRegistrationId("google")
				.clientId(properties.googleClientId()).clientSecret(properties.googleClientSecret())
				.clientAuthenticationMethod(org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
				.authorizationGrantType(org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE)
				.redirectUri("{baseUrl}/login/oauth2/code/{registrationId}").scope("openid","email","profile")
				.authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
				.tokenUri("https://oauth2.googleapis.com/token").jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
				.issuerUri("https://accounts.google.com").userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
				.userNameAttributeName("sub").clientName("Google").build());
	}
	public static void configure(HttpSecurity http, ClientRegistrationRepository registrations, GoogleIdentityService identities) throws Exception {
		var delegate = new DefaultOAuth2AuthorizationRequestResolver(registrations,"/oauth2/authorization");
		OAuth2AuthorizationRequestResolver resolver=new OAuth2AuthorizationRequestResolver() {
			public OAuth2AuthorizationRequest resolve(HttpServletRequest request) { return customize(delegate.resolve(request),request); }
			public OAuth2AuthorizationRequest resolve(HttpServletRequest request,String id) { return customize(delegate.resolve(request,id),request); }
			private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest original,HttpServletRequest request) {
				if(original==null) return null;
				if(request.getSession(false)!=null && request.getSession(false).getAttribute(REAUTH) instanceof Reauth) {
					Map<String,Object> extra=new HashMap<>(original.getAdditionalParameters());
					extra.put("prompt","login"); extra.put("max_age","0");
					return OAuth2AuthorizationRequest.from(original).additionalParameters(extra).build();
				}
				return original;
			}
		};
		var oidc = new OidcUserService();
		http.oauth2Login(login -> login.clientRegistrationRepository(registrations)
				.authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(resolver))
				.userInfoEndpoint(endpoint -> endpoint.oidcUserService(request -> {
					OidcUser verified=oidc.loadUser(request);
					return new LinkedUser(verified,identities.resolve(verified));
				}))
				.failureHandler((request,response,error) -> {
					if(request.getSession(false)!=null) request.getSession(false).removeAttribute(REAUTH);
					response.sendRedirect("/login?error");
				})
				.successHandler((request,response,authentication) -> {
					LinkedUser user=(LinkedUser)authentication.getPrincipal();
					var session=request.getSession();
					Object expected=session.getAttribute(REAUTH); session.removeAttribute(REAUTH);
					String destination="/admin";
					if(expected instanceof Reauth reauth) {
						if(!validReauthentication(reauth,user.principal,user.getIdToken(),Instant.now())) {
							SecurityContextHolder.clearContext(); session.invalidate(); response.sendRedirect("/login?error"); return;
						}
						destination=SecurityConfiguration.safeReturnTo(reauth.returnTo());
					}
					var context=SecurityContextHolder.createEmptyContext();
					context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.principal,null,
							List.of(new SimpleGrantedAuthority("ROLE_USER"))));
					SecurityContextHolder.setContext(context);
					session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,context);
					response.sendRedirect(destination);
				}));
	}
	static boolean validReauthentication(Reauth expected,AccountPrincipal principal,OidcIdToken token,Instant now) {
		Instant authTime=token.getAuthenticatedAt();
		return expected.accountId().equals(principal.accountId()) && authTime!=null
				&& authTime.getEpochSecond()>=expected.initiatedAt()-60 && !authTime.isAfter(now.plusSeconds(60))
				&& now.getEpochSecond()-expected.initiatedAt()<=600;
	}
	private static final class LinkedUser implements OidcUser {
		private final OidcUser delegate;
		private final AccountPrincipal principal;
		LinkedUser(OidcUser delegate,AccountPrincipal principal) {this.delegate=delegate;this.principal=principal;}
		public Map<String,Object> getClaims(){return delegate.getClaims();}
		public OidcUserInfo getUserInfo(){return delegate.getUserInfo();}
		public OidcIdToken getIdToken(){return delegate.getIdToken();}
		public Map<String,Object> getAttributes(){return delegate.getAttributes();}
		public Collection<? extends GrantedAuthority> getAuthorities(){return delegate.getAuthorities();}
		public String getName(){return principal.accountId();}
	}
}
