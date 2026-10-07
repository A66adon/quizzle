(() => {
	"use strict";

	const params = new URLSearchParams(window.location.search);
	let editingFileName = params.get("file");

	const status = document.querySelector("#details-status");
	const errorBox = document.querySelector("#details-error");
	const questionStatus = document.querySelector("#question-status");
	const questionErrorBox = document.querySelector("#question-error");
	const detailsView = document.querySelector("#details-view");
	const questionView = document.querySelector("#question-view");
	const titleInput = document.querySelector("#quiz-title");
	const descriptionInput = document.querySelector("#quiz-description");
	const authorEmailLabel = document.querySelector("#quiz-author-email");
	const detailsQuestionCount = document.querySelector("#details-question-count");
	const questionCountButton = document.querySelector("#details-question-count-button");
	const questionJumpList = document.querySelector("#question-jump-list");
	const detailsContinue = document.querySelector("#details-continue");
	const saveDetailsButton = document.querySelector("#save-details");
	const deleteButton = document.querySelector("#delete-quiz");

	const questionProgress = document.querySelector("#question-progress");
	const questionText = document.querySelector("#question-text");
	const questionPoints = document.querySelector("#question-points");
	const questionTime = document.querySelector("#question-time");
	const questionOptions = document.querySelector("#question-options");
	const backToDetailsButton = document.querySelector("#back-to-details");
	const reorderButton = document.querySelector("#reorder-button");
	const removeQuestionButton = document.querySelector("#remove-question");
	const saveQuizButton = document.querySelector("#save-quiz");
	const prevQuestionButton = document.querySelector("#prev-question");
	const nextQuestionButton = document.querySelector("#next-question");

	const reorderDialog = document.querySelector("#reorder-dialog");
	const reorderList = document.querySelector("#reorder-list");

	const deleteQuizDialog = document.querySelector("#delete-quiz-dialog");
	const deleteQuizName = document.querySelector("#delete-quiz-name");
	const deleteQuizError = document.querySelector("#delete-quiz-error");
	const cancelDeleteQuiz = document.querySelector("#cancel-delete-quiz");
	const confirmDeleteQuiz = document.querySelector("#confirm-delete-quiz");

	const leaveDialog = document.querySelector("#leave-dialog");
	const stayHereButton = document.querySelector("#stay-here");
	const leaveWithoutSavingButton = document.querySelector("#leave-without-saving");
	const saveStatus = document.querySelector("#save-status");
	const draftWarning = document.querySelector("#draft-warning");
	const recoveryDialog = document.querySelector("#recovery-dialog");
	const conflictDialog = document.querySelector("#conflict-dialog");

	const answerTemplate = document.querySelector("#editor-answer-template");
	const phantomTemplate = document.querySelector("#editor-phantom-template");

	const MIN_ANSWERS = 2;
	const MAX_ANSWERS = 6;

	const state = {
		title: "",
		description: "",
		author: "",
		questions: [],
		currentIndex: 0
	};
	let accountEmail = "";
	let accountId = null;
	let version = null;
	let ready = false;
	let serverUnavailable = false;
	let savePromise = null;
	let autosaveTimer = null;
	let sentSnapshot = null;
	let recoveryDraft = null;
	let conflicted = false;
	let storageFailed = false;
	const writerId = crypto.randomUUID();
	let activeDraftKey = null;
	let exportedRawSnapshot = null;
	const recoveredRecords = new Map();
	const ignoredRecords = new Map();
	let lastSavedSnapshot = null;
	let pendingLeaveUrl = null;
	let pendingLeaveForm = null;
	let discardOnLeave = false;

	init();

	async function init() {
		setEditorDisabled(true);
		setSaveStatus("Loading", "Loading account and quiz…");
		try {
			await loadAccountEmail();
			if (editingFileName) {
				try { await loadExistingQuiz(editingFileName); }
				catch (error) {
					if (error.status !== 404) throw error;
					serverUnavailable = true;
				}
			}
			document.querySelector("#export-server").hidden = !editingFileName;
			lastSavedSnapshot = rawSnapshot();
			activeDraftKey = `${draftPrefix()}${writerId}`;
			ready = true;
			showDetailsView();
			const drafts = readDrafts();
			if (drafts.length) {
				recoveryDraft = drafts[0];
				document.querySelector("#recovery-copy").textContent =
					`A local draft from ${formatTime(recoveryDraft.updatedAt)} is available${drafts.length > 1 ? ` (${drafts.length} drafts; showing the newest)` : ""}. ${serverUnavailable ? "The server quiz was deleted or is no longer accessible. Restore for local export only." : `Server revision: ${version ?? "new quiz"}.`} ${!editingFileName && recoveryDraft.sent ? "An earlier create request may already have created a quiz. Check the catalog before creating a copy." : ""} Restore it or dismiss recovery in this tab before editing. Other tabs' drafts will be kept.`;
				setSaveStatus("Unsaved", "Unsaved: local draft awaiting recovery");
				recoveryDialog.showModal();
			} else {
				setEditorDisabled(serverUnavailable);
				setSaveStatus(serverUnavailable ? "Conflict" : "Saved", serverUnavailable ? "Quiz unavailable: return to the catalog" : "Saved");
				if (serverUnavailable) showError("The server quiz was deleted or is no longer accessible. No recoverable draft was found. Return to the quiz catalog.");
			}
		} catch (error) {
			setSaveStatus("Unsaved", "Editor unavailable. Reload to retry.");
			showDetailsView();
			showError(error.message || "Account and quiz could not be loaded. Editing is blocked.");
		}
	}

	async function loadAccountEmail() {
		const settings = await requestJson("/admin/api/account/settings");
		if (!settings.accountId || !settings.email) throw new Error("Account identity is unavailable. Reload to retry.");
		accountId = String(settings.accountId);
		accountEmail = settings.email;
		renderAuthor();
	}

	function renderAuthor() {
		const isOwnQuiz = !state.author
			|| (accountEmail && state.author.toLowerCase() === accountEmail.toLowerCase());
		authorEmailLabel.textContent = isOwnQuiz ? "You" : state.author;
	}

	async function loadExistingQuiz(fileName) {
		status.hidden = false;
		status.textContent = "Loading quiz…";
		try {
			const response = await requestJson(`/admin/api/quizzes/${encodeURIComponent(fileName)}`);
			if (!Number.isInteger(response.version)) throw new Error("The server did not provide a quiz revision.");
			version = response.version;
			const quiz = response.quiz;
			state.title = quiz.title || "";
			state.description = quiz.description || "";
			state.author = quiz.author || "";
			state.questions = (quiz.questions || []).map(normalizeQuestion);
			deleteButton.hidden = false;
			status.hidden = true;
		} catch (error) {
			status.hidden = true;
			throw error;
		}
	}

	function normalizeQuestion(question) {
		return {
			id: question.id || "",
			text: question.text || "",
			points: Number(question.points ?? 1000),
			timeSeconds: Number(question.timeSeconds ?? 20),
			shuffleAnswers: question.shuffleAnswers !== false,
			answers: (Array.isArray(question.answers) ? question.answers : []).map(answer => ({
				id: answer.id || "",
				text: answer.text || "",
				correct: Boolean(answer.correct)
			}))
		};
	}

	function createEmptyQuestion() {
		return {
			id: "",
			text: "",
			points: 1000,
			timeSeconds: 20,
			shuffleAnswers: true,
			answers: [
				{ id: "", text: "", correct: false },
				{ id: "", text: "", correct: false }
			]
		};
	}

	// --- Details view ---------------------------------------------------

	titleInput.addEventListener("input", () => {
		state.title = titleInput.value;
		autosizeField(titleInput);
		autoSave();
	});
	descriptionInput.addEventListener("input", () => {
		state.description = descriptionInput.value;
		autosizeField(descriptionInput);
		autoSave();
	});
	questionCountButton.addEventListener("click", () => {
		questionJumpList.scrollIntoView({ behavior: "smooth", block: "nearest" });
	});

	function autosizeField(field) {
		field.style.height = "auto";
		field.style.height = `${field.scrollHeight}px`;
	}

	// The lobby grid is the primary way around the quiz: every question is visible, and each card
	// can be dragged to any other slot. A plain CSS grid reflows on its own once the underlying
	// order changes, so a card dropped in another column simply lands there.
	function renderQuestionJumpList() {
		questionJumpList.replaceChildren(...state.questions.map((question, index) => {
			const item = document.createElement("li");
			item.className = "question-jump-card";
			item.draggable = true;
			item.dataset.index = String(index);

			const button = document.createElement("button");
			button.type = "button";
			button.className = "question-jump-item";
			const number = document.createElement("span");
			number.className = "question-jump-number";
			number.textContent = `${index + 1}.`;
			const text = document.createElement("span");
			text.className = "question-jump-snippet";
			text.textContent = question.text.trim() || "(empty question)";
			button.append(number, text);
			button.addEventListener("click", () => {
				state.currentIndex = index;
				autoSave();
				showQuestionView();
			});
			item.append(button);

			item.addEventListener("dragstart", event => {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("text/plain", String(index));
				item.classList.add("is-dragging");
			});
			item.addEventListener("dragend", () => {
				item.classList.remove("is-dragging");
				clearDragTargets(questionJumpList, ".question-jump-card");
			});
			item.addEventListener("dragover", event => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				item.classList.add("drag-over");
			});
			item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
			item.addEventListener("drop", event => {
				event.preventDefault();
				clearDragTargets(questionJumpList, ".question-jump-card");
				if (!moveQuestion(Number(event.dataTransfer.getData("text/plain")), index)) return;
				renderQuestionJumpList();
			});

			return item;
		}));
	}

	function clearDragTargets(container, selector) {
		container.querySelectorAll(selector).forEach(element => element.classList.remove("drag-over"));
	}

	function moveQuestion(from, to) {
		if (!Number.isInteger(from) || from === to || !state.questions[from]) return false;
		const [moved] = state.questions.splice(from, 1);
		state.questions.splice(to, 0, moved);
		if (state.currentIndex === from) state.currentIndex = to;
		else if (from < state.currentIndex && to >= state.currentIndex) state.currentIndex -= 1;
		else if (from > state.currentIndex && to <= state.currentIndex) state.currentIndex += 1;
		autoSave();
		return true;
	}

	detailsContinue.addEventListener("click", () => {
		// Creating the first question here is an explicit request, unlike seeding one on load.
		if (state.questions.length === 0) state.questions.push(createEmptyQuestion());
		state.currentIndex = Math.min(state.currentIndex, state.questions.length - 1);
		autoSave();
		showQuestionView();
	});
	saveDetailsButton.addEventListener("click", () => saveQuiz());
	deleteButton.addEventListener("click", askToDeleteQuiz);
	backToDetailsButton.addEventListener("click", () => {
		autoSave();
		showDetailsView();
	});

	function showDetailsView() {
		titleInput.value = state.title;
		descriptionInput.value = state.description;
		detailsQuestionCount.textContent = String(state.questions.length);
		renderAuthor();
		renderQuestionJumpList();
		questionView.hidden = true;
		detailsView.hidden = false;
		window.requestAnimationFrame(() => {
			autosizeField(titleInput);
			autosizeField(descriptionInput);
		});
	}

	// --- Question view --------------------------------------------------

	questionText.addEventListener("input", () => {
		if (!currentQuestion()) return;
		currentQuestion().text = questionText.value;
		autoSave();
	});
	questionPoints.addEventListener("input", () => {
		questionPoints.value = questionPoints.value.replace(/\D/g, "");
		if (!currentQuestion()) return;
		currentQuestion().points = Number(questionPoints.value) || 0;
		autoSave();
	});
	questionTime.addEventListener("input", () => {
		questionTime.value = questionTime.value.replace(/\D/g, "");
		if (!currentQuestion()) return;
		currentQuestion().timeSeconds = Number(questionTime.value) || 0;
		autoSave();
	});

	prevQuestionButton.addEventListener("click", () => {
		if (state.currentIndex === 0) return;
		state.currentIndex -= 1;
		autoSave();
		renderQuestion();
	});

	nextQuestionButton.addEventListener("click", () => {
		if (state.currentIndex >= state.questions.length - 1) {
			state.questions.push(createEmptyQuestion());
			state.currentIndex = state.questions.length - 1;
		} else {
			state.currentIndex += 1;
		}
		autoSave();
		renderQuestion();
	});

	removeQuestionButton.addEventListener("click", () => {
		state.questions.splice(state.currentIndex, 1);
		autoSave();
		// A quiz without questions is a legitimate state, so the editor falls back to the details
		// view instead of inventing a replacement question.
		if (state.questions.length === 0) {
			state.currentIndex = 0;
			showDetailsView();
			return;
		}
		state.currentIndex = Math.min(state.currentIndex, state.questions.length - 1);
		renderQuestion();
	});

	saveQuizButton.addEventListener("click", () => saveQuiz());

	function currentQuestion() {
		return state.questions[state.currentIndex];
	}

	function showQuestionView() {
		detailsView.hidden = true;
		questionView.hidden = false;
		renderQuestion();
	}

	function renderQuestion() {
		const question = currentQuestion();
		if (!question) {
			showDetailsView();
			return;
		}
		questionProgress.textContent = `Question ${state.currentIndex + 1} of ${state.questions.length}`;
		questionText.value = question.text;
		questionPoints.value = question.points;
		questionTime.value = question.timeSeconds;
		prevQuestionButton.disabled = state.currentIndex === 0;
		const isLast = state.currentIndex >= state.questions.length - 1;
		setButtonLabels(nextQuestionButton, isLast ? "Add question" : "Next question", isLast ? "Add" : "Next");
		renderAnswers(question);
	}

	// Each action button carries both its full and its short label as real text; the stylesheet
	// shows exactly one of them, so the visible label is always the announced one.
	function setButtonLabels(button, wide, narrow) {
		button.querySelector(".label-wide").textContent = wide;
		button.querySelector(".label-narrow").textContent = narrow;
	}

	function renderAnswers(question, focusLastReal) {
		questionOptions.replaceChildren();
		question.answers.forEach((answer, index) => {
			questionOptions.append(createAnswerTile(question, answer, index));
		});
		if (question.answers.length < MAX_ANSWERS) {
			questionOptions.append(createPhantomTile(question));
		}
		if (focusLastReal) {
			const tiles = questionOptions.querySelectorAll(".editor-option:not(.editor-phantom) .editor-answer-input");
			const last = tiles[tiles.length - 1];
			if (last) {
				last.focus();
				last.setSelectionRange(last.value.length, last.value.length);
			}
		}
	}

	function createAnswerTile(question, answer, index) {
		const tile = answerTemplate.content.firstElementChild.cloneNode(true);
		const input = tile.querySelector(".editor-answer-input");
		const removeButton = tile.querySelector(".editor-remove-answer");
		input.value = answer.text;
		updateTile(tile, answer.correct);
		const toggleCorrect = () => {
			answer.correct = !answer.correct;
			updateTile(tile, answer.correct);
			autoSave();
		};
		tile.addEventListener("click", event => {
			if (event.target.closest(".editor-answer-input, .editor-remove-answer")) return;
			toggleCorrect();
		});
		tile.addEventListener("keydown", event => {
			if (event.target !== tile) return;
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				toggleCorrect();
			}
		});
		input.addEventListener("input", () => {
			answer.text = input.value;
			autoSave();
		});
		removeButton.hidden = question.answers.length <= MIN_ANSWERS;
		removeButton.addEventListener("click", () => {
			if (question.answers.length <= MIN_ANSWERS) return;
			question.answers.splice(index, 1);
			renderAnswers(question);
			autoSave();
		});
		return tile;
	}

	function updateTile(tile, correct) {
		tile.classList.toggle("is-correct", correct);
		tile.setAttribute("aria-pressed", String(correct));
		tile.setAttribute("aria-label", correct ? "Correct answer" : "Mark answer as correct");
	}

	function createPhantomTile(question) {
		const tile = phantomTemplate.content.firstElementChild.cloneNode(true);
		const addAnswer = () => {
			question.answers.push({ id: "", text: "", correct: false });
			renderAnswers(question, true);
			autoSave();
		};
		tile.addEventListener("click", addAnswer);
		tile.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				addAnswer();
			}
		});
		return tile;
	}

	// --- Reorder dialog -------------------------------------------------

	reorderButton.addEventListener("click", openReorderDialog);

	function openReorderDialog() {
		renderReorderList();
		reorderDialog.showModal();
	}

	function renderReorderList() {
		reorderList.replaceChildren();
		state.questions.forEach((question, index) => {
			const item = document.createElement("li");
			item.className = "reorder-item";
			item.draggable = true;
			item.dataset.index = String(index);

			const row = document.createElement("button");
			row.type = "button";
			row.className = "reorder-row";
			const snippet = question.text.trim();
			row.innerHTML = "";
			const number = document.createElement("span");
			number.className = "reorder-number";
			number.textContent = `${index + 1}.`;
			const text = document.createElement("span");
			text.className = "reorder-snippet";
			text.textContent = snippet.length > 60 ? `${snippet.slice(0, 60)}…` : (snippet || "(empty question)");
			row.append(number, text);
			row.addEventListener("click", () => {
				item.querySelector(".reorder-preview")?.classList.toggle("is-open");
			});

			const preview = document.createElement("div");
			preview.className = "reorder-preview";
			const previewInner = document.createElement("div");
			previewInner.className = "reorder-preview-inner";
			const previewText = document.createElement("p");
			previewText.className = "reorder-preview-text";
			previewText.textContent = question.text || "(empty question)";
			const previewAnswers = document.createElement("ul");
			question.answers.forEach(answer => {
				const li = document.createElement("li");
				li.textContent = `${answer.correct ? "✓ " : ""}${answer.text || "(empty answer)"}`;
				if (answer.correct) li.className = "is-correct";
				previewAnswers.append(li);
			});
			previewInner.append(previewText, previewAnswers);
			preview.append(previewInner);

			item.append(row, preview);

			item.addEventListener("dragstart", event => {
				event.dataTransfer.effectAllowed = "move";
				event.dataTransfer.setData("text/plain", String(index));
				item.classList.add("is-dragging");
			});
			item.addEventListener("dragend", () => {
				item.classList.remove("is-dragging");
				clearDragTargets(reorderList, ".reorder-item");
			});
			item.addEventListener("dragover", event => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				item.classList.add("drag-over");
			});
			item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
			item.addEventListener("drop", event => {
				event.preventDefault();
				clearDragTargets(reorderList, ".reorder-item");
				const from = Number(event.dataTransfer.getData("text/plain"));
				const to = Number(item.dataset.index);
				if (!moveQuestion(from, to)) return;
				renderReorderList();
				renderQuestion();
			});

			reorderList.append(item);
		});
	}

	// --- Persistence ----------------------------------------------------

	function collectQuiz() {
		return {
			title: state.title.trim(),
			description: state.description.trim(),
			author: accountEmail || state.author,
			questions: state.questions.map((question, questionIndex) => {
				const answers = question.answers.map((answer, answerIndex) => ({
					id: answer.id || `a${questionIndex + 1}-${answerIndex + 1}`,
					text: answer.text.trim(),
					correct: answer.correct
				}));
				return {
					id: question.id || `q${questionIndex + 1}`,
					text: question.text.trim(),
					points: Number(question.points) || 0,
					timeSeconds: Number(question.timeSeconds) || 0,
					multiple: answers.filter(answer => answer.correct).length > 1,
					shuffleAnswers: question.shuffleAnswers !== false,
					answers
				};
			})
		};
	}

	function isValidEnough() {
		return firstProblem() === null;
	}

	function isQuestionFinished(question) {
		return Boolean(question.text.trim())
			&& question.answers.length >= MIN_ANSWERS
			&& question.answers.every(answer => answer.text.trim())
			&& question.answers.some(answer => answer.correct)
			&& Number(question.points) > 0
			&& Number(question.timeSeconds) > 0;
	}

	// The first thing standing between the quiz and a successful save, in the order the author
	// would work through it. Recomputed on every attempt, so fixing one problem surfaces the next.
	function firstProblem() {
		if (!state.title.trim()) return { view: "details", field: "title" };
		if (!state.description.trim()) return { view: "details", field: "description" };
		for (let index = 0; index < state.questions.length; index++) {
			const question = state.questions[index];
			if (!question.text.trim()) return { view: "question", index, field: "text" };
			if (question.answers.length < MIN_ANSWERS || question.answers.length > MAX_ANSWERS) return { view: "question", index, field: "answers" };
			const emptyAnswer = question.answers.findIndex(answer => !answer.text.trim());
			if (emptyAnswer >= 0) return { view: "question", index, field: "answer", answerIndex: emptyAnswer };
			if (!question.answers.some(answer => answer.correct)) {
				return { view: "question", index, field: "answers" };
			}
			if (!Number.isSafeInteger(question.points) || question.points <= 0) return { view: "question", index, field: "points" };
			if (!Number.isSafeInteger(question.timeSeconds) || question.timeSeconds <= 0) return { view: "question", index, field: "time" };
		}
		return null;
	}

	function problemMessage(problem) {
		if (problem.view === "details") return problem.field === "description"
			? "Give the quiz a description before saving." : "Give the quiz a title before saving.";
		const where = `Question ${problem.index + 1}`;
		switch (problem.field) {
			case "text": return `${where} still needs its question text.`;
			case "answer": return `${where} has an answer without any text.`;
			case "points": return `${where} needs points above zero.`;
			case "time": return `${where} needs a time limit above zero.`;
			default: return `${where} needs ${MIN_ANSWERS}–${MAX_ANSWERS} answers and at least one correct answer.`;
		}
	}

	function focusProblem(problem) {
		if (problem.view === "details") {
			showDetailsView();
			highlightInvalid(problem.field === "description" ? descriptionInput : titleInput);
			return;
		}
		state.currentIndex = problem.index;
		showQuestionView();
		const tiles = questionOptions.querySelectorAll(".editor-option:not(.editor-phantom)");
		const target = problem.field === "text" ? questionText
			: problem.field === "points" ? questionPoints
				: problem.field === "time" ? questionTime
					: problem.field === "answer" ? tiles[problem.answerIndex]
						: questionOptions;
		highlightInvalid(target);
	}

	function highlightInvalid(element) {
		if (!element) return;
		element.classList.add("field-invalid");
		element.scrollIntoView({ behavior: "smooth", block: "center" });
		const focusable = element.matches("input, textarea") ? element : element.querySelector("input, textarea");
		if (focusable) focusable.focus({ preventScroll: true });
		const clear = () => {
			window.clearTimeout(timer);
			element.classList.remove("field-invalid");
		};
		element.addEventListener("input", clear, { once: true });
		const timer = window.setTimeout(clear, 4_000);
	}

	function rawSnapshot() {
		return JSON.stringify({
			title: state.title, description: state.description,
			author: state.author, questions: state.questions
		});
	}

	function setEditorDisabled(disabled) {
		document.querySelectorAll("#details-view input, #details-view textarea, #details-view button, #question-view input, #question-view textarea, #question-view button")
			.forEach(element => { element.disabled = disabled; });
	}

	function setSaveStatus(value, message = value) {
		saveStatus.dataset.state = value;
		saveStatus.textContent = message;
	}

	function formatTime(time) {
		return new Date(time).toLocaleString();
	}

	function draftPrefix() {
		return `quizzle-editor-draft:v1:${encodeURIComponent(accountId)}:${encodeURIComponent(editingFileName || "new")}:`;
	}

	function warnStorage() {
		storageFailed = true;
		draftWarning.hidden = false;
		draftWarning.textContent = "Local draft storage is unavailable or full. Keep this tab open and save or export your changes before leaving.";
	}

	function validRawDraft(raw) {
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
		if (!["title", "description", "author"].every(field => typeof raw[field] === "string")) return false;
		return Array.isArray(raw.questions) && raw.questions.every(question =>
			question && typeof question === "object"
			&& typeof question.id === "string" && typeof question.text === "string"
			&& Number.isFinite(question.points) && Number.isFinite(question.timeSeconds)
			&& typeof question.shuffleAnswers === "boolean"
			&& Array.isArray(question.answers) && question.answers.every(answer =>
				answer && typeof answer === "object"
				&& typeof answer.id === "string" && typeof answer.text === "string"
				&& typeof answer.correct === "boolean"));
	}

	function ignoreRecord(key, stored) {
		ignoredRecords.set(key, stored);
		try {
			sessionStorage.setItem(`${draftPrefix()}ignored`, JSON.stringify([...ignoredRecords]));
		} catch (error) { warnStorage(); }
	}

	function readDrafts() {
		const drafts = [];
		try {
			const ignored = JSON.parse(sessionStorage.getItem(`${draftPrefix()}ignored`) || "[]");
			if (Array.isArray(ignored)) {
				ignored.forEach(entry => {
					if (Array.isArray(entry) && entry.length === 2 && entry.every(value => typeof value === "string")) {
						ignoredRecords.set(...entry);
					}
				});
			}
		} catch (error) { warnStorage(); }
		try {
			for (let index = 0; index < localStorage.length; index++) {
				const key = localStorage.key(index);
				if (!key?.startsWith(draftPrefix()) || key.endsWith(":ignored")) continue;
				const stored = localStorage.getItem(key);
				if (ignoredRecords.get(key) === stored) continue;
				try {
					const data = JSON.parse(stored);
					if (!data || data.schemaVersion !== 1 || data.accountId !== accountId || data.fileName !== editingFileName
						|| typeof data.raw !== "string" || !validRawDraft(JSON.parse(data.raw))
						|| !(data.baseVersion === null || (Number.isSafeInteger(data.baseVersion) && data.baseVersion > 0))
						|| !Number.isFinite(data.updatedAt) || !Number.isInteger(data.currentIndex)
						|| typeof data.writerId !== "string"
						|| (data.sent != null && (typeof data.sent.raw !== "string"
							|| !validRawDraft(JSON.parse(data.sent.raw))
							|| data.sent.version !== data.baseVersion))) {
						throw new Error("Invalid draft record");
					}
					drafts.push({ ...data, key, stored });
					recoveredRecords.set(key, stored);
				} catch (error) {
					draftWarning.hidden = false;
					draftWarning.textContent = "An unreadable local draft was left untouched. Other valid drafts can still be recovered. Keep this browser's stored data if you need to recover the unreadable record.";
				}
			}
		} catch (error) {
			warnStorage();
		}
		return drafts.sort((left, right) => right.updatedAt - left.updatedAt);
	}

	function persistDraft() {
		if (!ready || recoveryDraft || discardOnLeave || !activeDraftKey) return false;
		if (!hasUnsavedChanges() && !sentSnapshot) return true;
		try {
			localStorage.setItem(activeDraftKey, JSON.stringify({
				schemaVersion: 1, accountId, fileName: editingFileName,
				baseVersion: version, updatedAt: Date.now(), writerId,
				raw: rawSnapshot(), currentIndex: state.currentIndex,
				sent: sentSnapshot
			}));
			return true;
		} catch (error) {
			warnStorage();
			return false;
		}
	}

	// Acknowledgements may only clear the exact raw content they wrote, never later edits
	// or another tab's draft. Each tab has its own key to avoid local last-write-wins.
	function clearAcknowledgedDrafts(snapshot, baseVersion, ownKey = activeDraftKey) {
		for (const key of new Set([ownKey, ...recoveredRecords.keys()])) {
			try {
				const stored = localStorage.getItem(key);
				const data = stored && JSON.parse(stored);
				if (data && data.raw === snapshot && data.baseVersion === baseVersion) {
					if (key === ownKey) localStorage.removeItem(key);
					else if (recoveredRecords.get(key) === stored) ignoreRecord(key, stored);
					recoveredRecords.delete(key);
				}
			} catch (error) { warnStorage(); }
		}
	}

	function autoSave() {
		if (!ready || recoveryDraft || discardOnLeave) return;
		persistDraft();
		clearTimeout(autosaveTimer);
		if (conflicted) {
			setSaveStatus("Conflict");
			return;
		}
		if (!savePromise) setSaveStatus(hasUnsavedChanges() ? "Unsaved" : "Saved");
		if (hasUnsavedChanges() && isValidEnough()) {
			autosaveTimer = setTimeout(() => {
				persistQuiz().catch(() => {});
			}, 800);
		}
	}

	function persistQuiz() {
		if (savePromise) return savePromise;
		if (!ready || recoveryDraft || serverUnavailable) return Promise.reject(new Error("Resolve draft recovery or server availability before saving."));
		if (conflicted) {
			if (!conflictDialog.open) conflictDialog.showModal();
			return Promise.reject(new Error("Resolve the revision conflict before saving. Local changes were kept."));
		}
		if (!hasUnsavedChanges()) return Promise.resolve();
		savePromise = savePendingChanges().finally(() => { savePromise = null; });
		return savePromise;
	}

	async function savePendingChanges() {
		while (hasUnsavedChanges()) {
			if (conflicted || recoveryDraft) throw new Error("Saving is paused until the draft conflict is resolved.");
			if (firstProblem()) {
				persistDraft();
				setSaveStatus("Unsaved", "Unsaved: finish the incomplete fields to save");
				return;
			}
			const raw = rawSnapshot();
			const quiz = collectQuiz();
			const baseVersion = version;
			const creating = !editingFileName;
			sentSnapshot = { raw, quiz, version: baseVersion, method: creating ? "POST" : "PUT" };
			persistDraft();
			setSaveStatus("Saving", "Saving…");
			try {
				const response = await requestJson(editingFileName
					? `/admin/api/quizzes/${encodeURIComponent(editingFileName)}`
					: "/admin/api/quizzes", {
					method: editingFileName ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(editingFileName ? { quiz, version } : quiz)
				});
				if (!response || !Number.isSafeInteger(response.version)
					|| response.version !== (creating ? 1 : baseVersion + 1)
					|| typeof response.fileName !== "string" || !response.fileName
					|| (!creating && response.fileName !== editingFileName)
					|| !sameQuiz(response.quiz, quiz)) {
					throw new Error("The server save acknowledgement is incomplete. Local changes were kept.");
				}
				const oldKey = activeDraftKey;
				clearAcknowledgedDrafts(raw, baseVersion, oldKey);
				version = response.version;
				editingFileName = response.fileName;
				activeDraftKey = `${draftPrefix()}${writerId}`;
				lastSavedSnapshot = raw;
				sentSnapshot = null;
				deleteButton.hidden = false;
				document.querySelector("#export-server").hidden = false;
				window.history.replaceState(null, "", `/editor?file=${encodeURIComponent(editingFileName)}`);
				if (oldKey !== activeDraftKey) {
					// First write subsequent edits under their permanent quiz identity.
					if (persistDraft()) {
						try {
							const old = localStorage.getItem(oldKey);
							if (old && JSON.parse(old).writerId === writerId) localStorage.removeItem(oldKey);
						} catch (error) { warnStorage(); }
					}
				}
				persistDraft();
			} catch (error) {
				if (error.status && error.status < 500) sentSnapshot = null;
				persistDraft();
				if (creating && (!error.status || error.status >= 500)) {
					enterConflict("The create request may have reached the server, but its acknowledgement was lost. Check the quiz catalog before creating another copy. Export this draft; automatic retries are blocked to avoid duplicates.");
				} else if (error.status === 409) {
					enterConflict(`The server revision changed${Number.isInteger(error.currentVersion) ? ` to ${error.currentVersion}` : ""}. Local changes were kept.`);
				} else {
					setSaveStatus(error.status ? "Unsaved" : "Offline draft",
						error.status ? "Unsaved: server rejected the save"
							: storageFailed ? "Offline: local storage unavailable" : "Offline draft: stored locally");
				}
				showError(error.message || "Saving failed. Local changes were kept.");
				throw error;
			}
		}
		setSaveStatus("Saved", `Saved at ${formatTime(Date.now())}`);
	}

	function sameQuiz(left, right) {
		if (!left || typeof left !== "object") return false;
		const comparable = quiz => ({
			title: quiz.title, description: quiz.description, author: quiz.author,
			questions: Array.isArray(quiz.questions) ? quiz.questions.map(question => ({
				id: question.id, text: question.text, points: question.points, timeSeconds: question.timeSeconds,
				multiple: question.multiple, shuffleAnswers: question.shuffleAnswers,
				answers: Array.isArray(question.answers) ? question.answers.map(answer => ({
					id: answer.id, text: answer.text, correct: answer.correct
				})) : null
			})) : null
		});
		return JSON.stringify(comparable(left)) === JSON.stringify(comparable(right));
	}

	function hasUnsavedChanges() {
		return !discardOnLeave && (Boolean(recoveryDraft) || Boolean(sentSnapshot) || (ready && rawSnapshot() !== lastSavedSnapshot));
	}

	function enterConflict(message) {
		conflicted = true;
		clearTimeout(autosaveTimer);
		persistDraft();
		setSaveStatus("Conflict", "Conflict: automatic saving paused");
		document.querySelector("#conflict-copy").textContent = message;
		if (!conflictDialog.open) conflictDialog.showModal();
	}

	async function saveQuiz() {
		hideMessages();
		clearTimeout(autosaveTimer);
		if (!ready || recoveryDraft || conflicted) {
			if (conflicted && !conflictDialog.open) conflictDialog.showModal();
			showError("Resolve loading, recovery, or conflict before saving.");
			return;
		}
		persistDraft();
		const problem = firstProblem();
		if (problem) {
			showError(problemMessage(problem));
			focusProblem(problem);
			return;
		}
		saveQuizButton.disabled = true;
		saveDetailsButton.disabled = true;
		try {
			await persistQuiz();
			if (!hasUnsavedChanges()) {
				showSuccess("Quiz saved.");
				if (window.showToast) window.showToast("Quiz saved.");
			} else showError("The latest edits are incomplete. They remain unsaved.");
		} catch (error) {
			if (error.status === 400) {
				const rejected = firstProblem();
				if (rejected) focusProblem(rejected);
			}
			showError(error.message || "The quiz could not be saved. Check the fields and try again.");
		} finally {
			saveQuizButton.disabled = false;
			saveDetailsButton.disabled = false;
		}
	}

	confirmDeleteQuiz.addEventListener("click", deleteQuiz);
	cancelDeleteQuiz.addEventListener("click", () => deleteQuizDialog.close("cancel"));
	deleteQuizDialog.addEventListener("close", () => {
		deleteQuizError.hidden = true;
		confirmDeleteQuiz.disabled = false;
	});

	function askToDeleteQuiz() {
		if (!editingFileName) return;
		deleteQuizName.textContent = state.title.trim() || "Untitled quiz";
		deleteQuizError.hidden = true;
		deleteQuizDialog.showModal();
	}

	async function deleteQuiz() {
		if (!editingFileName) return;
		confirmDeleteQuiz.disabled = true;
		setEditorDisabled(true);
		clearTimeout(autosaveTimer);
		try {
			if (savePromise) await savePromise;
			await requestJson(`/admin/api/quizzes/${encodeURIComponent(editingFileName)}`, { method: "DELETE" });
			clearAcknowledgedDrafts(rawSnapshot(), version);
			discardOnLeave = true;
			lastSavedSnapshot = null;
			window.location.assign("/admin");
		} catch (error) {
			deleteQuizError.textContent = "The quiz could not be deleted.";
			deleteQuizError.hidden = false;
			confirmDeleteQuiz.disabled = false;
			setEditorDisabled(false);
		}
	}

	// Messages belong to the view the author is looking at, directly above that view's buttons.
	function activeMessages() {
		return questionView.hidden
			? { status, error: errorBox }
			: { status: questionStatus, error: questionErrorBox };
	}

	function showError(message) {
		hideMessages();
		const target = activeMessages().error;
		target.textContent = message;
		target.hidden = false;
	}

	function showSuccess(message) {
		hideMessages();
		const target = activeMessages().status;
		target.textContent = message;
		target.dataset.success = "true";
		target.hidden = false;
		window.setTimeout(() => {
			target.hidden = true;
		}, 2_500);
	}

	function hideMessages() {
		for (const element of [status, errorBox, questionStatus, questionErrorBox]) {
			element.hidden = true;
			delete element.dataset.success;
		}
	}

	document.addEventListener("click", event => {
		const link = event.target.closest("a[href]");
		if (!link || link.hasAttribute("download") || link.target === "_blank") return;
		const target = new URL(link.href, window.location.href);
		if (target.pathname === window.location.pathname && target.search === window.location.search) return;
		if (!hasUnsavedChanges()) return;
		event.preventDefault();
		persistDraft();
		pendingLeaveUrl = link.href;
		pendingLeaveForm = null;
		if (!leaveDialog.open) leaveDialog.showModal();
	});
	document.addEventListener("submit", event => {
		if (!event.target.matches('form[action="/logout"]') || discardOnLeave || !hasUnsavedChanges()) return;
		event.preventDefault();
		persistDraft();
		pendingLeaveForm = event.target;
		pendingLeaveUrl = null;
		if (!leaveDialog.open) leaveDialog.showModal();
	});

	stayHereButton.addEventListener("click", () => leaveDialog.close("stay"));
	leaveWithoutSavingButton.addEventListener("click", () => {
		const target = pendingLeaveUrl;
		const form = pendingLeaveForm;
		persistDraft();
		clearTimeout(autosaveTimer);
		discardOnLeave = true;
		leaveDialog.close("leave");
		if (form) form.requestSubmit();
		else if (target) window.location.assign(target);
	});
	leaveDialog.addEventListener("close", () => {
		if (leaveDialog.returnValue !== "leave") {
			pendingLeaveUrl = null;
			pendingLeaveForm = null;
		}
	});

	// Refresh and tab close stay silent unless there is really something to lose.
	window.addEventListener("beforeunload", event => {
		if (!hasUnsavedChanges()) return;
		persistDraft();
		event.preventDefault();
		event.returnValue = "";
	});

	window.addEventListener("pagehide", persistDraft);
	window.addEventListener("online", () => {
		if (ready && !conflicted && !recoveryDraft) autoSave();
	});
	window.addEventListener("storage", event => {
		if (!ready || conflicted || !event.key?.startsWith(draftPrefix()) || event.key === activeDraftKey) return;
		// Never apply another tab's data over this tab, even when its local edits are invalid.
		if (recoveryDraft) {
			conflicted = true;
			return;
		}
		enterConflict("Another tab changed a local draft for this quiz. Saving is paused. Keep your local work or reload the server version.");
	});

	document.querySelector("#restore-draft").addEventListener("click", () => {
		if (!recoveryDraft) return;
		const draft = recoveryDraft;
		const loadedVersion = version;
		const raw = JSON.parse(draft.raw);
		state.title = raw.title;
		state.description = raw.description;
		state.author = raw.author;
		state.questions = raw.questions;
		version = draft.baseVersion;
		state.currentIndex = Math.max(0, Math.min(draft.currentIndex || 0, state.questions.length - 1));
		recoveryDraft = null;
		sentSnapshot = draft.sent || null;
		recoveryDialog.close();
		setEditorDisabled(false);
		showDetailsView();
		persistDraft();
		if (serverUnavailable) {
			enterConflict("The server quiz was deleted or is no longer accessible. Your draft was restored locally for export; it cannot recreate or overwrite the server quiz.");
		} else if (!editingFileName && draft.sent) {
			enterConflict("This draft includes a create request with no confirmed quiz identity. It may already exist in the catalog. Export the draft and check the catalog before creating another copy; automatic retries are blocked.");
		} else if (draft.baseVersion !== loadedVersion || conflicted) {
			enterConflict("This draft belongs to an older server revision. It was restored locally, but cannot overwrite the newer quiz.");
		} else autoSave();
	});
	document.querySelector("#discard-draft").addEventListener("click", () => {
		// Dismissing recovery never deletes another writer's data. Only the exact records
		// offered here are ignored in this tab; a subsequent update remains recoverable.
		for (const [key, stored] of recoveredRecords) {
			try {
				if (localStorage.getItem(key) === stored) ignoreRecord(key, stored);
			} catch (error) { warnStorage(); }
		}
		recoveredRecords.clear();
		recoveryDraft = null;
		recoveryDialog.close();
		setEditorDisabled(serverUnavailable);
		setSaveStatus(serverUnavailable ? "Conflict" : "Saved", serverUnavailable
			? "Quiz unavailable: recovery dismissed; return to the catalog"
			: "Saved: draft recovery dismissed in this tab; other tabs' drafts kept");
		if (conflicted) enterConflict("Another tab changed this quiz while recovery was pending. Reload the server before editing.");
	});
	recoveryDialog.addEventListener("cancel", event => event.preventDefault());

	document.querySelector("#keep-local").addEventListener("click", () => {
		conflictDialog.close();
		persistDraft();
		setSaveStatus("Conflict", "Conflict: local changes kept; export or reload before saving");
	});
	document.querySelector("#reload-server").addEventListener("click", async () => {
		const button = document.querySelector("#reload-server");
		button.disabled = true;
		setEditorDisabled(true);
		const conflictError = document.querySelector("#conflict-error");
		conflictError.hidden = true;
		const localPreserved = persistDraft();
		try {
			if (!localPreserved && exportedRawSnapshot !== rawSnapshot()) {
				throw new Error("Local storage is unavailable. Export the local YAML before reloading the server.");
			}
			if (savePromise) {
				try { await savePromise; } catch (error) { /* The draft is preserved above. */ }
			}
			if (!editingFileName) throw new Error("This new quiz has no server version. Export your local draft first.");
			// Keep the old draft under its tab key; the reloaded server starts a fresh key.
			await loadExistingQuiz(editingFileName);
			serverUnavailable = false;
			activeDraftKey = `${draftPrefix()}${crypto.randomUUID()}`;
			recoveredRecords.clear();
			lastSavedSnapshot = rawSnapshot();
			sentSnapshot = null;
			conflicted = false;
			state.currentIndex = 0;
			conflictDialog.close();
			showDetailsView();
			setSaveStatus("Saved", "Saved: server reloaded; previous local draft remains recoverable");
		} catch (error) {
			conflictError.textContent = error.message;
			conflictError.hidden = false;
		}
		finally {
			button.disabled = false;
			setEditorDisabled(false);
		}
	});

	function downloadYaml(quiz, fileName) {
		// JSON is valid YAML 1.2, retaining exact strings and incomplete drafts without
		// unsafe interpolation or a second parser/serializer dependency.
		const url = URL.createObjectURL(new Blob([JSON.stringify(quiz, null, 2) + "\n"], { type: "application/yaml" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function exportLocalDraft() {
		const raw = recoveryDraft ? JSON.parse(recoveryDraft.raw) : JSON.parse(rawSnapshot());
		const quiz = {
			title: raw.title, description: raw.description, author: accountEmail || raw.author,
			questions: raw.questions.map((question, questionIndex) => ({
				id: question.id || `q${questionIndex + 1}`,
				text: question.text, points: question.points, timeSeconds: question.timeSeconds,
				multiple: question.answers.filter(answer => answer.correct).length > 1,
				shuffle_answers: question.shuffleAnswers !== false,
				answers: question.answers.map((answer, answerIndex) => ({
					id: answer.id || `a${questionIndex + 1}-${answerIndex + 1}`,
					text: answer.text, correct: answer.correct
				}))
			}))
		};
		downloadYaml(quiz, "quiz-local-draft.yaml");
		exportedRawSnapshot = JSON.stringify(raw);
	}
	document.querySelectorAll("[data-export-local]").forEach(button => button.addEventListener("click", exportLocalDraft));
	document.querySelector("#export-server").addEventListener("click", async () => {
		if (!editingFileName) return;
		try {
			const response = await fetch(`/admin/api/quizzes/${encodeURIComponent(editingFileName)}/export`, {
				credentials: "same-origin", cache: "no-store", headers: { Accept: "application/yaml" }
			});
			if (response.status === 401) {
				redirectToLogin();
				return;
			}
			if (!response.ok) throw new Error("The server quiz could not be exported. Local draft export is still available.");
			const url = URL.createObjectURL(await response.blob());
			const link = document.createElement("a");
			link.href = url;
			link.download = `${editingFileName.replace(/\.ya?ml$/i, "")}.yaml`;
			document.body.append(link);
			link.click();
			link.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (error) { showError(error.message); }
	});

	function redirectToLogin() {
		const preserved = recoveryDraft ? true : persistDraft();
		clearTimeout(autosaveTimer);
		setSaveStatus("Unsaved", "Unsaved: session expired; local draft kept");
		if (!preserved && hasUnsavedChanges() && exportedRawSnapshot !== rawSnapshot()) {
			const signIn = document.querySelector("#session-sign-in");
			signIn.href = `/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
			signIn.hidden = false;
			enterConflict("Your session expired and local storage is unavailable. Export your local YAML before signing in again.");
			return;
		}
		discardOnLeave = true;
		window.location.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
	}

	async function requestJson(url, options = {}) {
		const response = await fetch(url, {
			credentials: "same-origin",
			cache: "no-store",
			...options,
			headers: {
				Accept: "application/json",
				"X-XSRF-TOKEN": window.getCsrfToken() || "",
				...(options.headers || {})
			}
		});
		if (response.status === 401) {
			redirectToLogin();
			throw new Error("Session expired");
		}
		if (!response.ok) {
			let details = null;
			try { details = await response.json(); } catch (error) { /* Non-JSON server errors use the status fallback. */ }
			let message = response.status === 400
				? "The quiz data is invalid. Check titles, points, and that every question has a correct answer."
				: response.status === 404
					? "Quiz not found."
					: `Request failed with status ${response.status}`;
			const error = new Error(message);
			error.status = response.status;
			error.currentVersion = details?.currentVersion;
			throw error;
		}
		if (response.status === 204) return null;
		return response.json();
	}
})();
