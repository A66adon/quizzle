package org.dev.quizzle.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SecurityWebConfiguration implements WebMvcConfigurer {

	private final CsrfInterceptor csrfInterceptor;

	public SecurityWebConfiguration(CsrfInterceptor csrfInterceptor) {
		this.csrfInterceptor = csrfInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(csrfInterceptor).addPathPatterns("/**");
	}
}
