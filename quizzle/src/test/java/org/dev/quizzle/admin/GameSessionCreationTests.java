package org.dev.quizzle.admin;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import java.net.URI;
import java.util.List;
import java.util.Optional;
import org.dev.quizzle.account.AccountService;
import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.config.GameSessionProperties;
import org.dev.quizzle.persistence.PostgresSnapshotRepository;
import org.dev.quizzle.quiz.catalog.LoadedQuiz;
import org.dev.quizzle.quiz.catalog.QuizCatalog;
import org.dev.quizzle.quiz.model.QuizDefinition;
import org.dev.quizzle.session.*;
import org.dev.quizzle.websocket.SessionRealtimePublisher;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class GameSessionCreationTests {
	@Test void emptyDraftReturnsControlledBadRequestWithoutCreatingRoomOrSnapshot() throws Exception {
		String owner=SessionTestFixtures.OWNER_ACCOUNT_ID;
		var catalog=mock(QuizCatalog.class);
		when(catalog.findByFileName(owner,"draft.yaml")).thenReturn(Optional.of(new LoadedQuiz("draft.yaml",
				new QuizDefinition("Draft","Description","Author",List.of()))));
		var snapshots=mock(PostgresSnapshotRepository.class);
		var accounts=mock(AccountService.class);
		var properties=new GameSessionProperties(URI.create("https://quiz.example.test"),10,5000,false);
		var registry=new GameSessionRegistry(properties,catalog,new GameStateMachine(),snapshots,accounts);
		var mvc=MockMvcBuilders.standaloneSetup(new AdminGameSessionController(registry,
				mock(SessionAddressService.class),mock(QrCodeService.class),mock(SessionRealtimePublisher.class),properties,accounts)).build();
		var session=new MockHttpSession();AccountSession.authenticate(session,owner);
		mvc.perform(post("/admin/api/sessions").session(session).contentType("application/json")
				.content("{\"quizFileName\":\"draft.yaml\"}")).andExpect(status().isBadRequest());
		assertTrue(registry.list(owner).isEmpty());
		verify(snapshots,never()).save(any());
	}
}
