package org.dev.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.auth.rate-limit")
public record AuthRateLimitProperties(int ipLimit) {
	public AuthRateLimitProperties {
		if(ipLimit<1 || ipLimit>1000)
			throw new IllegalArgumentException("AUTH_RATE_LIMIT_IP_LIMIT must be between 1 and 1000");
	}
}
