(() => {
	"use strict";

	const params = new URLSearchParams(window.location.search);
	let editingFileName = params.get("file");

	const status = document.querySelector("#editor-status");
	const errorBox = document.querySelector("#editor-error");
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

	init();

	async function init() {
		loadAccountEmail();
		if (editingFileName) {
			await loadExistingQuiz(editingFileName);
		} else {
			state.questions.push(createEmptyQuestion());
		}
		showDetailsView();
	}

	async function loadAccountEmail() {
		try {
			const settings = await requestJson("/admin/api/account/settings");
			accountEmail = settings.email || "";
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
			if (state.questions.length === 0) state.questions.push(createEmptyQuestion());
			deleteButton.hidden = false;
			status.hidden = true;
		} catch (error) {
			status.textContent = "This quiz could not be loaded.";
			status.dataset.error = "true";
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
		const opening = questionJumpList.hidden;
		questionJumpList.hidden = !opening;
		questionCountButton.setAttribute("aria-expanded", String(opening));
		if (opening) renderQuestionJumpList();
	});

	function autosizeField(field) {
		field.style.height = "auto";
		field.style.height = `${field.scrollHeight}px`;
	}

	function renderQuestionJumpList() {
		questionJumpList.replaceChildren(...state.questions.map((question, index) => {
			const item = document.createElement("li");
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
				questionJumpList.hidden = true;
				questionCountButton.setAttribute("aria-expanded", "false");
				showQuestionView();
			});
			item.append(button);
			return item;
		}));
	}
	detailsContinue.addEventListener("click", () => {
		autoSave();
		showQuestionView();
	});
	saveDetailsButton.addEventListener("click", () => saveQuiz({ redirect: false }));
	deleteButton.addEventListener("click", deleteQuiz);
	backToDetailsButton.addEventListener("click", () => {
		autoSave();
		showDetailsView();
	});

	function showDetailsView() {
		titleInput.value = state.title;
		descriptionInput.value = state.description;
		detailsQuestionCount.textContent = String(state.questions.length);
		renderAuthor();
		questionJumpList.hidden = true;
		questionCountButton.setAttribute("aria-expanded", "false");
		questionView.hidden = true;
		detailsView.hidden = false;
		window.requestAnimationFrame(() => {
			autosizeField(titleInput);
			autosizeField(descriptionInput);
		});
	}

	// --- Question view --------------------------------------------------

	questionText.addEventListener("input", () => {
		currentQuestion().text = questionText.value;
	});
	questionPoints.addEventListener("input", () => {
		questionPoints.value = questionPoints.value.replace(/\D/g, "");
		currentQuestion().points = Number(questionPoints.value) || 0;
	});
	questionTime.addEventListener("input", () => {
		questionTime.value = questionTime.value.replace(/\D/g, "");
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
		if (state.questions.length === 0) state.questions.push(createEmptyQuestion());
		state.currentIndex = Math.min(state.currentIndex, state.questions.length - 1);
		autoSave();
		renderQuestion();
	});

	saveQuizButton.addEventListener("click", () => saveQuiz({ redirect: false }));

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
		questionProgress.textContent = `Question ${state.currentIndex + 1} of ${state.questions.length}`;
		questionText.value = question.text;
		questionPoints.value = question.points;
		questionTime.value = question.timeSeconds;
		prevQuestionButton.disabled = state.currentIndex === 0;
		nextQuestionButton.textContent = state.currentIndex >= state.questions.length - 1
			? "Add question"
			: "Next question";
		renderAnswers(question);
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
				reorderList.querySelectorAll(".reorder-item").forEach(el => el.classList.remove("drag-over"));
			});
			item.addEventListener("dragover", event => {
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				item.classList.add("drag-over");
			});
			item.addEventListener("dragleave", () => item.classList.remove("drag-over"));
			item.addEventListener("drop", event => {
				event.preventDefault();
				const from = Number(event.dataTransfer.getData("text/plain"));
				const to = Number(item.dataset.index);
				if (!Number.isInteger(from) || from === to) return;
				const [moved] = state.questions.splice(from, 1);
				state.questions.splice(to, 0, moved);
				autoSave();
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
		return state.questions.every(question =>
			question.text.trim()
			&& question.answers.length >= MIN_ANSWERS
			&& question.answers.every(answer => answer.text.trim())
			&& question.answers.some(answer => answer.correct)
			&& Number(question.points) > 0
			&& Number(question.timeSeconds) > 0
		);
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
			return response;
		} finally {
			saveInFlight = false;
		}
	}

	async function saveQuiz() {
		hideError();
		if (!isValidEnough()) {
			showError("Give the quiz a title and make sure every question has text, at least 2 answers, and one correct answer.");
			return;
		}
		saveQuizButton.disabled = true;
		saveDetailsButton.disabled = true;
		try {
			await persistQuiz();
			status.textContent = "Quiz saved.";
			delete status.dataset.error;
			status.hidden = false;
			window.setTimeout(() => {
				status.hidden = true;
			}, 2500);
		} catch (error) {
			showError(error.message || "The quiz could not be saved. Check the fields and try again.");
		} finally {
			saveQuizButton.disabled = false;
			saveDetailsButton.disabled = false;
		}
	}

	async function deleteQuiz() {
		if (!editingFileName) return;
		if (!window.confirm("Delete this quiz? This cannot be undone.")) return;
		try {
			await requestJson(`/admin/api/quizzes/${encodeURIComponent(editingFileName)}`, { method: "DELETE" });
			window.location.assign("/admin");
		} catch (error) {
			showError("The quiz could not be deleted.");
		}
	}

	function showError(message) {
		errorBox.textContent = message;
		errorBox.hidden = false;
	}

	function hideError() {
		errorBox.hidden = true;
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
