(() => {
	"use strict";

	const status = document.querySelector("#catalog-status");
	const actionStatus = document.querySelector("#action-status");
	const sessionSection = document.querySelector("#session-section");
	const sessionGrid = document.querySelector("#session-grid");
	const sessionEmpty = document.querySelector("#session-empty");
	const sessionCount = document.querySelector("#session-count");
	const quizSection = document.querySelector("#quiz-section");
	const quizGrid = document.querySelector("#quiz-grid");
	const quizEmpty = document.querySelector("#quiz-empty");
	const quizCount = document.querySelector("#quiz-count");
	const loadedAt = document.querySelector("#loaded-at");
	const issueSection = document.querySelector("#issue-section");
	const issueList = document.querySelector("#issue-list");
	const issueCount = document.querySelector("#issue-count");
	const sessionTemplate = document.querySelector("#session-template");
	const quizTemplate = document.querySelector("#quiz-template");
	const issueTemplate = document.querySelector("#issue-template");
	let sessions = [];

	loadAdminData();

	async function loadAdminData() {
		try {
			const [catalog, loadedSessions] = await Promise.all([
				requestJson("/admin/api/quizzes"),
				requestJson("/admin/api/sessions")
			]);
			sessions = Array.isArray(loadedSessions) ? loadedSessions : [];
			renderCatalog(catalog);
			renderSessions();
		} catch (error) {
			status.textContent = "Quiz data could not be loaded. Refresh the page or check the server.";
			status.dataset.error = "true";
		}
	}

	async function requestJson(url, options = {}) {
		const response = await fetch(url, {
			credentials: "same-origin",
			cache: "no-store",
			...options,
			headers: {
				Accept: "application/json",
				...(options.headers || {})
			}
		});
		if (response.status === 401) {
			window.location.replace("/admin/login");
			throw new Error("Admin session expired");
		}
		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}
		return response.json();
	}

	function renderCatalog(catalog) {
		const quizzes = Array.isArray(catalog.quizzes) ? catalog.quizzes : [];
		const issues = Array.isArray(catalog.issues) ? catalog.issues : [];

		quizGrid.replaceChildren(...quizzes.map(createQuizCard));
		issueList.replaceChildren(...issues.map(createIssueCard));

		quizCount.textContent = String(quizzes.length);
		quizEmpty.hidden = quizzes.length !== 0;
		quizSection.hidden = false;
		status.hidden = true;

		const loadedDate = new Date(catalog.loadedAtEpochMs);
		loadedAt.textContent = Number.isNaN(loadedDate.getTime())
			? "Loaded at server startup"
			: `Loaded ${new Intl.DateTimeFormat(undefined, {
				dateStyle: "medium",
				timeStyle: "short"
			}).format(loadedDate)}`;

		issueSection.hidden = issues.length === 0;
		issueCount.textContent = issues.length === 1 ? "1 skipped file" : `${issues.length} skipped files`;
	}

	function createQuizCard(quiz) {
		const card = quizTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".quiz-title").textContent = quiz.title;
		card.querySelector(".quiz-description").textContent = quiz.description;
		card.querySelector(".quiz-author").textContent = `By ${quiz.author}`;
		card.querySelector(".question-count").textContent = quiz.questionCount === 1
			? "1 question"
			: `${quiz.questionCount} questions`;
		const createButton = card.querySelector(".create-session-button");
		createButton.addEventListener("click", () => createSession(quiz.fileName, createButton));
		return card;
	}

	async function createSession(quizFileName, button) {
		const originalLabel = button.textContent;
		button.disabled = true;
		button.textContent = "Creating…";
		actionStatus.hidden = true;
		try {
			const createdSession = await requestJson("/admin/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quizFileName })
			});
			sessions = [createdSession, ...sessions.filter(session => session.codehash !== createdSession.codehash)];
			renderSessions();
			actionStatus.textContent = `Session ${createdSession.codehash} is ready.`;
			actionStatus.dataset.error = "false";
			actionStatus.hidden = false;
			sessionSection.scrollIntoView({ behavior: "smooth", block: "start" });
		} catch (error) {
			actionStatus.textContent = "The session could not be created. Please try again.";
			actionStatus.dataset.error = "true";
			actionStatus.hidden = false;
		} finally {
			button.disabled = false;
			button.textContent = originalLabel;
		}
	}

	function renderSessions() {
		sessionGrid.replaceChildren(...sessions.map(createSessionCard));
		sessionEmpty.hidden = sessions.length !== 0;
		sessionCount.textContent = sessions.length === 1 ? "1 session" : `${sessions.length} sessions`;
		sessionSection.hidden = false;
	}

	function createSessionCard(session) {
		const card = sessionTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".session-title").textContent = session.quizTitle;
		card.querySelector(".session-code").textContent = session.codehash;
		card.querySelector(".session-created").textContent = formatDate(session.createdAtEpochMs);
		const state = card.querySelector(".session-state");
		state.textContent = formatState(session.state);
		state.classList.add("ready-chip");
		const link = card.querySelector(".session-link");
		link.href = session.joinUrl;
		link.textContent = session.joinUrl;
		card.querySelector(".session-presenter").href = `/admin/sessions/${session.codehash}`;
		card.querySelector(".session-qr").src = session.qrUrl;
		return card;
	}

	function formatState(state) {
		return String(state || "unknown").toLowerCase().replaceAll("_", " ");
	}

	function formatDate(epochMs) {
		const date = new Date(epochMs);
		return Number.isNaN(date.getTime())
			? ""
			: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
	}

	function createIssueCard(issue) {
		const card = issueTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".issue-file").textContent = issue.fileName;
		card.querySelector(".issue-reason").textContent = issue.reason;
		return card;
	}
})();

