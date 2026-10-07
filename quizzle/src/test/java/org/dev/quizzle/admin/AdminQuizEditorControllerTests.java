package org.dev.quizzle.admin;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.List;
import org.dev.quizzle.account.AccountSession;
import org.dev.quizzle.quiz.catalog.*;
import org.dev.quizzle.quiz.model.QuizDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AdminQuizEditorControllerTests {
	private static final String OWNER = "402f6b19-5115-4370-a38d-c5eb0d11f728";
	private static final String QUIZ_JSON = "{\"title\":\"Draft\",\"description\":\"\",\"author\":\"\",\"questions\":[]}";
	private final QuizDefinition quiz = new QuizDefinition("Draft", "", "", List.of());
	private final QuizEditorService editor = mock(QuizEditorService.class);
	private final MockHttpSession session = new MockHttpSession();
	private MockMvc mvc;

	@BeforeEach
	void setup() {
		AccountSession.authenticate(session, OWNER);
		mvc = MockMvcBuilders.standaloneSetup(new AdminQuizEditorController(editor)).build();
	}

	@Test
	void createAndGetExposeRevisionAndAcceptDirectDefinition() throws Exception {
		when(editor.create(OWNER, quiz)).thenReturn("draft.yaml");
		when(editor.loadRevision(OWNER, "draft.yaml")).thenReturn(new LoadedQuiz("draft.yaml", quiz, 4));
		mvc.perform(post("/admin/api/quizzes").session(session).contentType(MediaType.APPLICATION_JSON).content(QUIZ_JSON))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.fileName").value("draft.yaml"))
				.andExpect(jsonPath("$.version").value(1)).andExpect(jsonPath("$.quiz.title").value("Draft"));
		mvc.perform(get("/admin/api/quizzes/draft.yaml").session(session))
				.andExpect(status().isOk()).andExpect(jsonPath("$.version").value(4));
	}

	@Test
	void missingAndInvalidRevisionsAreBadRequestsWithoutWriting() throws Exception {
		for (String version : List.of("null", "0", "-1", "1.5", "\"1\"", "true", "{}", "[]", "9223372036854775808")) {
			mvc.perform(put("/admin/api/quizzes/draft.yaml").session(session).contentType(MediaType.APPLICATION_JSON)
					.content("{\"quiz\":" + QUIZ_JSON + ",\"version\":" + version + "}"))
					.andExpect(status().isBadRequest());
		}
		mvc.perform(put("/admin/api/quizzes/draft.yaml").session(session).contentType(MediaType.APPLICATION_JSON)
				.content("{\"quiz\":" + QUIZ_JSON + "}")).andExpect(status().isBadRequest());
		mvc.perform(put("/admin/api/quizzes/draft.yaml").session(session).contentType(MediaType.APPLICATION_JSON)
				.content(QUIZ_JSON)).andExpect(status().isBadRequest());
		verifyNoInteractions(editor);
	}

	@Test
	void staleRevisionHasMachineReadableConflictAndSuccessfulSaveIncrementsVersion() throws Exception {
		when(editor.update(OWNER, "draft.yaml", quiz, 1)).thenThrow(new QuizRevisionConflictException(3));
		mvc.perform(put("/admin/api/quizzes/draft.yaml").session(session).contentType(MediaType.APPLICATION_JSON)
				.content("{\"quiz\":" + QUIZ_JSON + ",\"version\":1}"))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("REVISION_CONFLICT"))
				.andExpect(jsonPath("$.currentVersion").value(3));
		when(editor.update(OWNER, "draft.yaml", quiz, 3)).thenReturn(new LoadedQuiz("draft.yaml", quiz, 4));
		mvc.perform(put("/admin/api/quizzes/draft.yaml").session(session).contentType(MediaType.APPLICATION_JSON)
				.content("{\"quiz\":" + QUIZ_JSON + ",\"version\":3}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.version").value(4));
	}

	@Test
	void importIsRawYamlAndExportIsAnAttachment() throws Exception {
		String yaml = "title: Draft\ndescription: ''\nauthor: ''\nquestions: []\n";
		when(editor.importYaml(OWNER, yaml)).thenReturn(new LoadedQuiz("draft.yaml", quiz, 1));
		mvc.perform(post("/admin/api/quizzes/import").session(session).contentType("application/yaml").content(yaml))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.version").value(1));
		when(editor.exportYaml(OWNER, "draft.yaml")).thenReturn(yaml);
		mvc.perform(get("/admin/api/quizzes/draft.yaml/export").session(session))
				.andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith("application/yaml"))
				.andExpect(header().string("Content-Disposition", "attachment; filename=\"draft.yaml\""))
				.andExpect(content().string(yaml));
		when(editor.importYaml(OWNER, "bad")).thenThrow(new QuizFileException("Malformed YAML"));
		mvc.perform(post("/admin/api/quizzes/import").session(session).contentType("application/yaml").content("bad"))
				.andExpect(status().isBadRequest());
	}
}
