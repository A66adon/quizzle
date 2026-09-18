package org.dev.quizzle.account;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AccountWebConfiguration implements WebMvcConfigurer {

	private final AccountSessionInterceptor accountSessionInterceptor;

	public AccountWebConfiguration(AccountSessionInterceptor accountSessionInterceptor) {
		this.accountSessionInterceptor = accountSessionInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(accountSessionInterceptor)
				.addPathPatterns(
						"/admin", "/admin/", "/admin.html", "/presenter.html", "/admin/**",
						"/editor", "/editor.html",
						"/settings", "/settings.html");
	}
}
