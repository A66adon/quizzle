package org.dev.quizzle;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"quiz.account.file=${java.io.tmpdir}/safety-quiz-context-accounts-${random.uuid}.yml",
		"quiz.catalog.directory=${java.io.tmpdir}/safety-quiz-context-test",
		"quiz.snapshot.database-path=${java.io.tmpdir}/safety-quiz-context-${random.uuid}.db",
		"quiz.snapshot.interval-ms=3600000"
})
class QuizApplicationTests {

	@Test
	void contextLoads() {
	}

}
