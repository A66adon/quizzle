package org.dev.quizzle.admin;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminWebConfiguration implements WebMvcConfigurer {

	private final AdminSessionInterceptor adminSessionInterceptor;

	public AdminWebConfiguration(AdminSessionInterceptor adminSessionInterceptor) {
		this.adminSessionInterceptor = adminSessionInterceptor;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(adminSessionInterceptor)
				.addPathPatterns("/admin", "/admin/", "/admin.html", "/presenter.html", "/admin/**")
				.excludePathPatterns("/admin/login");
	}
}
