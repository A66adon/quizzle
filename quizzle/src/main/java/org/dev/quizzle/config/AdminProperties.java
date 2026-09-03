package org.dev.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.admin")
public record AdminProperties(String password) {
}
