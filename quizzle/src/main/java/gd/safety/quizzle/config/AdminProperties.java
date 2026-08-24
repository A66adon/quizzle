package gd.safety.quizzle.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("quiz.admin")
public record AdminProperties(String password) {
}
