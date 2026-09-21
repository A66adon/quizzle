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
	const brandLink = document.querySelector(".site-header .brand");

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
	let saveInFlight = false;
	// Everything that was last written to the server, so leaving is only interrupted when the
	// in-memory quiz really differs from the persisted one.
	let lastSavedSnapshot = null;
	let pendingLeaveUrl = null;
	// Set when the author deliberately drops their changes, so the best-effort save on pagehide
	// does not write them back out anyway.
	let discardOnLeave = false;

	init();

	async function init() {
		loadAccountEmail();
		if (editingFileName) {
			await loadExistingQuiz(editingFileName);
		}
		markSaved();
		showDetailsView();
	}

	async function loadAccountEmail() {
		try {
			const settings = await requestJson("/admin/api/account/settings");
			accountEmail = settings.username || "";
		} catch (error) {
			accountEmail = "";
		}
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
			const quiz = response.quiz;
			state.title = quiz.title || "";
			state.description = quiz.description || "";
			state.author = quiz.author || "";
			state.questions = (quiz.questions || []).map(normalizeQuestion);
			deleteButton.hidden = false;
			status.hidden = true;
		} catch (error) {
			status.hidden = true;
			showError("This quiz could not be loaded.");
		}
	}

	function normalizeQuestion(question) {
		return {
			id: question.id || "",
			text: question.text || "",
			points: Number(question.points) || 1000,
			timeSeconds: Number(question.timeSeconds) || 20,
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
	});
	descriptionInput.addEventListener("input", () => {
		state.description = descriptionInput.value;
		autosizeField(descriptionInput);
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
	});
	questionPoints.addEventListener("input", () => {
		questionPoints.value = questionPoints.value.replace(/\D/g, "");
		if (!currentQuestion()) return;
		currentQuestion().points = Number(questionPoints.value) || 0;
	});
	questionTime.addEventListener("input", () => {
		questionTime.value = questionTime.value.replace(/\D/g, "");
		if (!currentQuestion()) return;
		currentQuestion().timeSeconds = Number(questionTime.value) || 0;
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
		});
		removeButton.hidden = question.answers.length <= MIN_ANSWERS;
		removeButton.addEventListener("click", () => {
			if (question.answers.length <= MIN_ANSWERS) return;
			question.answers.splice(index, 1);
			renderAnswers(question);
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
		if (!state.title.trim()) return false;
		// A quiz with no questions is valid to save; every() is vacuously true for an empty list.
		return state.questions.every(isQuestionFinished);
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
		for (let index = 0; index < state.questions.length; index++) {
			const question = state.questions[index];
			if (!question.text.trim()) return { view: "question", index, field: "text" };
			if (question.answers.length < MIN_ANSWERS) return { view: "question", index, field: "answers" };
			const emptyAnswer = question.answers.findIndex(answer => !answer.text.trim());
			if (emptyAnswer >= 0) return { view: "question", index, field: "answer", answerIndex: emptyAnswer };
			if (!question.answers.some(answer => answer.correct)) {
				return { view: "question", index, field: "answers" };
			}
			if (!(Number(question.points) > 0)) return { view: "question", index, field: "points" };
			if (!(Number(question.timeSeconds) > 0)) return { view: "question", index, field: "time" };
		}
		return null;
	}

	function problemMessage(problem) {
		if (problem.view === "details") return "Give the quiz a title before saving.";
		const where = `Question ${problem.index + 1}`;
		switch (problem.field) {
			case "text": return `${where} still needs its question text.`;
			case "answer": return `${where} has an answer without any text.`;
			case "points": return `${where} needs points above zero.`;
			case "time": return `${where} needs a time limit above zero.`;
			default: return `${where} needs at least ${MIN_ANSWERS} answers and one correct answer.`;
		}
	}

	function focusProblem(problem) {
		if (problem.view === "details") {
			showDetailsView();
			highlightInvalid(titleInput);
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

	async function autoSave() {
		if (!isValidEnough()) return;
		try {
			await persistQuiz();
		} catch (error) {
			// Auto-save is best-effort; validation issues surface on manual save.
		}
	}

	async function persistQuiz() {
		if (saveInFlight) return;
		saveInFlight = true;
		try {
			const quiz = collectQuiz();
			const response = editingFileName
				? await requestJson(`/admin/api/quizzes/${encodeURIComponent(editingFileName)}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(quiz)
				})
				: await requestJson("/admin/api/quizzes", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(quiz)
				});
			if (!editingFileName && response && response.fileName) {
				editingFileName = response.fileName;
				deleteButton.hidden = false;
				window.history.replaceState(null, "", `/editor?file=${encodeURIComponent(editingFileName)}`);
			}
			markSaved();
			return response;
		} finally {
			saveInFlight = false;
		}
	}

	function markSaved() {
		lastSavedSnapshot = JSON.stringify(collectQuiz());
	}

	function hasUnsavedChanges() {
		return lastSavedSnapshot !== null && JSON.stringify(collectQuiz()) !== lastSavedSnapshot;
	}

	async function saveQuiz() {
		hideMessages();
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
			showSuccess("Quiz saved.");
			if (window.showToast) window.showToast("Quiz saved.");
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
		try {
			await requestJson(`/admin/api/quizzes/${encodeURIComponent(editingFileName)}`, { method: "DELETE" });
			discardOnLeave = true;
			lastSavedSnapshot = null;
			window.location.assign("/admin");
		} catch (error) {
			deleteQuizError.textContent = "The quiz could not be deleted.";
			deleteQuizError.hidden = false;
			confirmDeleteQuiz.disabled = false;
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

	// The brand link is a normal navigation, so unsaved work is confirmed before it happens.
	brandLink.addEventListener("click", event => {
		if (!hasUnsavedChanges()) return;
		event.preventDefault();
		pendingLeaveUrl = brandLink.href;
		leaveDialog.showModal();
	});

	stayHereButton.addEventListener("click", () => leaveDialog.close("stay"));
	leaveWithoutSavingButton.addEventListener("click", () => {
		const target = pendingLeaveUrl;
		discardOnLeave = true;
		lastSavedSnapshot = null;
		leaveDialog.close("leave");
		if (target) window.location.assign(target);
	});
	leaveDialog.addEventListener("close", () => {
		if (leaveDialog.returnValue !== "leave") pendingLeaveUrl = null;
	});

	// Refresh and tab close stay silent unless there is really something to lose.
	window.addEventListener("beforeunload", event => {
		if (!hasUnsavedChanges()) return;
		event.preventDefault();
		event.returnValue = "";
	});

	// Leaving the editor (brand link, tab close) must not silently drop a valid quiz.
	// Existing quizzes keep the all-or-nothing rule so a half-finished edit never
	// overwrites good data; a brand-new quiz stores at least its finished questions.
	window.addEventListener("pagehide", () => {
		if (discardOnLeave) return;
		const payload = quizForLeave();
		if (!payload) return;
		try {
			fetch(editingFileName
					? `/admin/api/quizzes/${encodeURIComponent(editingFileName)}`
					: "/admin/api/quizzes", {
				method: editingFileName ? "PUT" : "POST",
				credentials: "same-origin",
				keepalive: true,
				headers: {
					"Content-Type": "application/json",
					"X-XSRF-TOKEN": window.getCsrfToken() || ""
				},
				body: JSON.stringify(payload)
			});
		} catch (error) {
			// Best effort: the page is already going away.
		}
	});

	function quizForLeave() {
		if (editingFileName) {
			return isValidEnough() ? collectQuiz() : null;
		}
		if (!state.title.trim()) return null;
		const finished = state.questions.filter(isQuestionFinished);
		const kept = state.questions;
		state.questions = finished;
		const quiz = collectQuiz();
		state.questions = kept;
		return quiz;
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
			window.location.replace("/login");
			throw new Error("Session expired");
		}
		if (!response.ok) {
			let message = response.status === 400
				? "The quiz data is invalid. Check titles, points, and that every question has a correct answer."
				: response.status === 404
					? "Quiz not found."
					: `Request failed with status ${response.status}`;
			const error = new Error(message);
			error.status = response.status;
			throw error;
		}
		if (response.status === 204) return null;
		return response.json();
	}
})();
