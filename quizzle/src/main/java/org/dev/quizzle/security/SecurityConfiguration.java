package org.dev.quizzle.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.dev.quizzle.account.AccountService;
import org.dev.quizzle.account.AccountStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
public class SecurityConfiguration {
	@Bean
	AuthenticationProvider localAuthentication(AccountService service, AccountStore store) {
		return new AuthenticationProvider() {
			@Override public Authentication authenticate(Authentication authentication) {
				var principal = service.authenticatePrincipal(authentication.getName(), (String) authentication.getCredentials())
						.orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
				return UsernamePasswordAuthenticationToken.authenticated(
						principal, null,
						List.of(new SimpleGrantedAuthority("ROLE_USER")));
			}
			@Override public boolean supports(Class<?> type) {
				return UsernamePasswordAuthenticationToken.class.isAssignableFrom(type);
			}
		};
	}

	@Bean
	SecurityFilterChain security(HttpSecurity http, AuthenticationProvider localAuthentication,
			AccountStore store, AuthRateLimiter limiter, org.dev.quizzle.config.AuthProperties properties,
			org.springframework.beans.factory.ObjectProvider<GoogleIdentityService> googleIdentityService) throws Exception {
		if(properties.googleEnabled()) GoogleLogin.configure(http,GoogleLogin.registrations(properties),googleIdentityService.getObject());
		http.addFilterBefore(new OncePerRequestFilter() {
			@Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
					throws ServletException, IOException {
				if(request.getRequestURI().startsWith("/login/oauth2/code/")
						&& !limiter.allow("callback",request.getRemoteAddr(),"")) {
					response.sendRedirect("/login?error"); return;
				}
				chain.doFilter(request,response);
			}
		},org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter.class);
		http.authenticationProvider(localAuthentication)
				.csrf(csrf -> csrf.csrfTokenRepository(new SessionCsrfRepository())
						.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/admin", "/admin/**", "/admin.html", "/editor", "/editor.html",
								"/settings", "/settings.html", "/presenter.html", "/reauthenticate").authenticated()
						.anyRequest().permitAll())
				.requestCache(cache -> cache.disable())
				.exceptionHandling(errors -> errors.authenticationEntryPoint((request, response, error) -> {
					response.setHeader("Cache-Control", "no-store");
					if (request.getRequestURI().startsWith("/admin/api/")) response.sendError(401);
					else response.sendRedirect("/login");
				}))
				.formLogin(form -> form.loginPage("/login").usernameParameter("email")
						.loginProcessingUrl("/login").failureUrl("/login?error")
						.successHandler((request, response, authentication) ->
								response.sendRedirect(safeReturnTo(request.getParameter("returnTo")))))
				.logout(logout -> logout.logoutUrl("/logout").logoutSuccessUrl("/login")
						.addLogoutHandler((request, response, authentication) ->
								response.setHeader("Clear-Site-Data", "\"cache\"")))
				.headers(headers -> headers
						.referrerPolicy(policy -> policy.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
						.contentSecurityPolicy(csp -> csp.policyDirectives(
								"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
								+ "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")));
		http.addFilterBefore(new OncePerRequestFilter() {
			@Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
					throws ServletException, IOException {
				response.setHeader("Cache-Control", "no-store");
				var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
				if (auth != null && auth.getPrincipal() instanceof AccountPrincipal principal
						&& !store.isCurrentActive(principal.accountId(), principal.credentialVersion())) {
					org.springframework.security.core.context.SecurityContextHolder.clearContext();
					if (request.getSession(false) != null) request.getSession(false).invalidate();
				}
				if (request.getMethod().equals("POST") && request.getRequestURI().equals("/login")
						&& !limiter.allow("login", request.getRemoteAddr(), request.getParameter("email"))) {
					response.sendRedirect("/login?error"); return;
				}
				chain.doFilter(request, response);
			}
		}, UsernamePasswordAuthenticationFilter.class);
		http.addFilterAfter(new OncePerRequestFilter() {
			@Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
					throws ServletException, IOException {
				Object value = request.getAttribute("_csrf");
				if (value instanceof org.springframework.security.web.csrf.CsrfToken token) {
					response.addHeader("Set-Cookie", org.springframework.http.ResponseCookie.from("XSRF-TOKEN", token.getToken())
							.path("/").httpOnly(false).secure(request.isSecure()).sameSite("Lax").build().toString());
				}
				chain.doFilter(request, response);
			}
		}, CsrfFilter.class);
		return http.build();
	}

	public static String safeReturnTo(String value) {
		if (value == null || value.contains("\\") || value.contains("\r") || value.contains("\n")) return "/admin";
		return value.matches("^/(admin|editor|settings)(\\.html)?(?:\\?[A-Za-z0-9_=&.-]*)?$") ? value : "/admin";
	}
}
