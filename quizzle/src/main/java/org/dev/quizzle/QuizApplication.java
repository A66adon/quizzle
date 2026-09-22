package org.dev.quizzle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class QuizApplication {

	public static void main(String[] args) {
		// Session IDs come from SecureRandom; without a fast entropy source the first
		// session blocks for seconds on some hosts. This default is a no-op where the
		// property is already set.
		System.setProperty("java.security.egd",
				System.getProperty("java.security.egd", "file:/dev/urandom"));
		SpringApplication.run(QuizApplication.class, args);
	}

}
