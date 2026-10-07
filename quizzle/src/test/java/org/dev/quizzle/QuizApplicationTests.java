package org.dev.quizzle;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "quiz.snapshot.interval-ms=3600000")
class QuizApplicationTests extends org.dev.quizzle.persistence.PostgresIntegrationSupport {

	@Test
	void contextLoads() {
	}

}
