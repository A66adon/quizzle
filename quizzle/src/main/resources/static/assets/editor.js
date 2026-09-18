(() => {
	"use strict";

	const params = new URLSearchParams(window.location.search);
	const editingFileName = params.get("file");

	const status = document.querySelector("#editor-status");
	const errorBox = document.querySelector("#editor-error");
	const successBox = document.querySelector("#editor-success");
	const form = document.querySelector("#editor-form");
	const titleInput = document.querySelector("#quiz-title");
	const descriptionInput = document.querySelector("#quiz-description");
	const authorInput = document.querySelector("#quiz-author");
	const questionsList = document.querySelector("#questions-list");
	const addQuestionButton = document.querySelector("#add-question");
	const saveButton = document.querySelector("#save-quiz");
	const deleteButton = document.querySelector("#delete-quiz");
	const questionTemplate = document.querySelector("#question-template");
	const answerTemplate = document.querySelector("#answer-template");

	addQuestionButton.addEventListener("click", () => addQuestion());
	deleteButton.addEventListener("click", deleteQuiz);
	form.addEventListener("submit", saveQuiz);

	if (editingFileName) {
		loadExistingQuiz(editingFileName);
	} else {
		addQuestion();
	}

	async function loadExistingQuiz(fileName) {
		status.hidden = false;
		status.textContent = "Loading quiz…";
		try {
			const response = await requestJson(`/admin/api/quizzes/${encodeURIComponent(fileName)}`);
			const quiz = response.quiz;
			titleInput.value = quiz.title || "";
			descriptionInput.value = quiz.description || "";
			authorInput.value = quiz.author || "";
			questionsList.replaceChildren();
			(quiz.questions || []).forEach(question => addQuestion(question));
			deleteButton.hidden = false;
			status.hidden = true;
		} catch (error) {
			status.textContent = "This quiz could not be loaded.";
			status.dataset.error = "true";
		}
	}

	function addQuestion(question) {
		const card = questionTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".question-text").value = question ? question.text || "" : "";
		card.querySelector(".question-points").value = question ? question.points : 100;
		card.querySelector(".question-time").value = question ? question.timeSeconds : 20;
		card.querySelector(".question-multiple").checked = question ? Boolean(question.multiple) : false;
		card.querySelector(".question-shuffle").checked = question ? question.shuffleAnswers !== false : true;
		card.dataset.questionId = question && question.id ? question.id : "";

		const answersList = card.querySelector(".answers-list");
		const answers = question && Array.isArray(question.answers) ? question.answers : [];
		if (answers.length > 0) {
			answers.forEach(answer => answersList.append(createAnswerRow(answer)));
		} else {
			answersList.append(createAnswerRow(), createAnswerRow());
		}

		card.querySelector(".add-answer").addEventListener("click", () => {
			answersList.append(createAnswerRow());
			renumberQuestions();
		});
		card.querySelector(".remove-question").addEventListener("click", () => {
			card.remove();
			renumberQuestions();
		});
		card.querySelector(".move-question-up").addEventListener("click", () => {
			const previous = card.previousElementSibling;
			if (previous) {
				questionsList.insertBefore(card, previous);
				renumberQuestions();
			}
		});
		card.querySelector(".move-question-down").addEventListener("click", () => {
			const next = card.nextElementSibling;
			if (next) {
				questionsList.insertBefore(next, card);
				renumberQuestions();
			}
		});

		questionsList.append(card);
		renumberQuestions();
		return card;
	}

	function createAnswerRow(answer) {
		const row = answerTemplate.content.firstElementChild.cloneNode(true);
		row.querySelector(".answer-text").value = answer ? answer.text || "" : "";
		row.querySelector(".answer-correct").checked = answer ? Boolean(answer.correct) : false;
		row.dataset.answerId = answer && answer.id ? answer.id : "";
		row.querySelector(".remove-answer").addEventListener("click", () => {
			const list = row.parentElement;
			if (list.children.length > 1) {
				row.remove();
			}
		});
		return row;
	}

	function renumberQuestions() {
		questionsList.querySelectorAll(".question-card").forEach((card, index) => {
			card.querySelector(".question-index").textContent = `Question ${index + 1}`;
		});
	}

	function collectQuiz() {
		const questionCards = Array.from(questionsList.querySelectorAll(".question-card"));
		const questions = questionCards.map((card, questionIndex) => {
			const answerRows = Array.from(card.querySelectorAll(".answer-row"));
			const answers = answerRows.map((row, answerIndex) => ({
				id: row.dataset.answerId || `a${questionIndex + 1}-${answerIndex + 1}`,
				text: row.querySelector(".answer-text").value.trim(),
				correct: row.querySelector(".answer-correct").checked
			}));
			return {
				id: card.dataset.questionId || `q${questionIndex + 1}`,
				text: card.querySelector(".question-text").value.trim(),
				points: Number(card.querySelector(".question-points").value) || 0,
				timeSeconds: Number(card.querySelector(".question-time").value) || 0,
				multiple: card.querySelector(".question-multiple").checked,
				shuffleAnswers: card.querySelector(".question-shuffle").checked,
				answers
			};
		});
		return {
			title: titleInput.value.trim(),
			description: descriptionInput.value.trim(),
			author: authorInput.value.trim(),
			questions
		};
	}

	async function saveQuiz(event) {
		event.preventDefault();
		hideMessages();
		if (questionsList.children.length === 0) {
			showError("Add at least one question before saving.");
			return;
		}
		const quiz = collectQuiz();
		saveButton.disabled = true;
		try {
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
			successBox.textContent = "Quiz saved. Redirecting…";
			successBox.hidden = false;
			window.setTimeout(() => window.location.assign(`/editor?file=${encodeURIComponent(response.fileName)}`), 600);
		} catch (error) {
			showError(error.message || "The quiz could not be saved. Check the fields above and try again.");
		} finally {
			saveButton.disabled = false;
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

	function hideMessages() {
		errorBox.hidden = true;
		successBox.hidden = true;
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
