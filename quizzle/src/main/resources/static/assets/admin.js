(() => {
	"use strict";

	const status = document.querySelector("#catalog-status");
	const actionStatus = document.querySelector("#action-status");
	const sessionSection = document.querySelector("#session-section");
	const sessionGrid = document.querySelector("#session-grid");
	const sessionEmpty = document.querySelector("#session-empty");
	const sessionCount = document.querySelector("#session-count");
	const sessionCountLabel = document.querySelector("#session-count-label");
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
	const addQuizTemplate = document.querySelector("#add-quiz-template");
	const issueTemplate = document.querySelector("#issue-template");
	const deleteSessionDialog = document.querySelector("#delete-session-dialog");
	const deleteSessionName = document.querySelector("#delete-session-name");
	const deleteSessionError = document.querySelector("#delete-session-error");
	const cancelDeleteSession = document.querySelector("#cancel-delete-session");
	const confirmDeleteSession = document.querySelector("#confirm-delete-session");
	const MIN_SESSION_TITLE_FONT_PX = 13;
	let sessions = [];
	let accountEmail = "";
	let pendingDeleteSession = null;
	let titleFitFrame = null;

	loadAdminData();
	confirmDeleteSession.addEventListener("click", deletePendingSession);
	cancelDeleteSession.addEventListener("click", () => deleteSessionDialog.close("cancel"));
	deleteSessionDialog.addEventListener("close", () => {
		pendingDeleteSession = null;
		deleteSessionError.hidden = true;
	});
	deleteSessionDialog.addEventListener("cancel", event => {
		if (confirmDeleteSession.disabled) event.preventDefault();
	});
	window.addEventListener("resize", scheduleSessionTitleFit);

	async function loadAdminData() {
		try {
			const [catalog, loadedSessions, settings] = await Promise.all([
				requestJson("/admin/api/quizzes"),
				requestJson("/admin/api/sessions"),
				requestJson("/admin/api/account/settings").catch(() => null)
			]);
			accountEmail = settings && settings.username ? String(settings.username).toLowerCase() : "";
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
				"X-XSRF-TOKEN": window.getCsrfToken() || "",
				...(options.headers || {})
			}
		});
		if (response.status === 401) {
			window.location.replace("/login");
			throw new Error("Session expired");
		}
		if (!response.ok) {
			const error = new Error(`Request failed with status ${response.status}`);
			error.status = response.status;
			throw error;
		}
		return response.json();
	}

	function renderCatalog(catalog) {
		const quizzes = Array.isArray(catalog.quizzes) ? catalog.quizzes : [];
		const issues = Array.isArray(catalog.issues) ? catalog.issues : [];

		quizGrid.replaceChildren(createAddQuizCard(), ...quizzes.map(createQuizCard));
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

	function createAddQuizCard() {
		const card = addQuizTemplate.content.firstElementChild.cloneNode(true);
		card.setAttribute("aria-label", "Add a new quiz");
		const openEditor = () => window.location.assign("/editor");
		card.addEventListener("click", openEditor);
		card.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openEditor();
			}
		});
		return card;
	}

	function createQuizCard(quiz) {
		const card = quizTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".quiz-title").textContent = quiz.title;
		card.querySelector(".quiz-description").textContent = quiz.description;
		card.querySelector(".quiz-author").textContent =
			accountEmail && String(quiz.author || "").toLowerCase() === accountEmail
				? "By You"
				: `By ${quiz.author}`;
		card.querySelector(".question-count").textContent = quiz.questionCount === 1
			? "1 question"
			: `${quiz.questionCount} questions`;
		card.setAttribute("aria-label", `Play ${quiz.title}`);
		let playInFlight = false;
		const play = () => {
			if (playInFlight) return;
			playInFlight = true;
			createSession(quiz.fileName, card, editButton).finally(() => {
				playInFlight = false;
			});
		};
		card.addEventListener("click", play);
		card.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				play();
			}
		});
		const editButton = card.querySelector(".quiz-edit-button");
		editButton.setAttribute("aria-label", `Edit ${quiz.title}`);
		editButton.addEventListener("click", event => {
			event.stopPropagation();
			window.location.assign(`/editor?file=${encodeURIComponent(quiz.fileName)}`);
		});
		return card;
	}

	async function createSession(quizFileName, card, action) {
		if (action.disabled) return;
		action.disabled = true;
		card.setAttribute("aria-busy", "true");
		card.classList.add("is-loading");
		actionStatus.hidden = true;
		try {
			const createdSession = await requestJson("/admin/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quizFileName })
			});
			sessions = [createdSession, ...sessions.filter(session => session.codehash !== createdSession.codehash)];
			renderSessions();
			sessionSection.scrollIntoView({ behavior: "smooth", block: "start" });
		} catch (error) {
			actionStatus.textContent = "The session could not be created. Please try again.";
			actionStatus.dataset.error = "true";
			actionStatus.hidden = false;
		} finally {
			action.disabled = false;
			card.removeAttribute("aria-busy");
			card.classList.remove("is-loading");
		}
	}

	function askToDeleteSession(session) {
		pendingDeleteSession = session;
		deleteSessionName.textContent = `${session.quizTitle} · ${session.codehash}`;
		deleteSessionError.hidden = true;
		deleteSessionDialog.showModal();
	}

	async function deletePendingSession() {
		const session = pendingDeleteSession;
		if (!session) return;
		confirmDeleteSession.disabled = true;
		cancelDeleteSession.disabled = true;
		confirmDeleteSession.textContent = "Deleting…";
		actionStatus.hidden = true;
		try {
			await requestJson(`/admin/api/sessions/${session.codehash}/commands`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ command: "ABORT" })
			});
			sessions = sessions.filter(candidate => candidate.codehash !== session.codehash);
			renderSessions();
			deleteSessionDialog.close("deleted");
		} catch (error) {
			deleteSessionError.textContent = error.status === 409
				? "This session can no longer be deleted from its current state."
				: "The session could not be deleted. Please try again.";
			deleteSessionError.hidden = false;
		} finally {
			confirmDeleteSession.disabled = false;
			cancelDeleteSession.disabled = false;
			confirmDeleteSession.textContent = "Delete session";
		}
	}

	function renderSessions() {
		sessionGrid.replaceChildren(...sessions.map(createSessionCard));
		sessionEmpty.hidden = sessions.length !== 0;
		sessionCount.textContent = String(sessions.length);
		sessionCountLabel.textContent = sessions.length === 1 ? "session" : "sessions";
		sessionSection.hidden = false;
		scheduleSessionTitleFit();
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
		const cardAction = card.querySelector(".session-card-action");
		cardAction.href = `/admin/sessions/${session.codehash}`;
		cardAction.setAttribute("aria-label", `Open ${session.quizTitle} session ${session.codehash}`);
		card.querySelector(".session-qr").src = session.qrUrl;
		const deleteButton = card.querySelector(".delete-session-button");
		deleteButton.setAttribute("aria-label", `Delete session ${session.codehash} for ${session.quizTitle}`);
		deleteButton.addEventListener("click", () => askToDeleteSession(session));
		return card;
	}

	function scheduleSessionTitleFit() {
		window.cancelAnimationFrame(titleFitFrame);
		titleFitFrame = window.requestAnimationFrame(() => {
			for (const title of sessionGrid.querySelectorAll(".session-title")) fitSessionTitle(title);
		});
	}

	function fitSessionTitle(title) {
		title.style.removeProperty("font-size");
		const maximumFontSize = Number.parseFloat(window.getComputedStyle(title).fontSize);
		if (title.scrollHeight <= title.clientHeight + 1) return;

		let lower = MIN_SESSION_TITLE_FONT_PX;
		let upper = maximumFontSize;
		title.style.fontSize = `${lower}px`;
		if (title.scrollHeight > title.clientHeight + 1) return;

		while (upper - lower > 0.25) {
			const candidate = (lower + upper) / 2;
			title.style.fontSize = `${candidate}px`;
			if (title.scrollHeight <= title.clientHeight + 1) lower = candidate;
			else upper = candidate;
		}
		title.style.fontSize = `${lower}px`;
	}

	function formatState(state) {
		return String(state || "unknown").toLowerCase().replaceAll("_", " ");
	}

	function formatDate(epochMs) {
		const date = new Date(epochMs);
		return Number.isNaN(date.getTime())
			? ""
			: `Created ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)}`;
	}

	function createIssueCard(issue) {
		const card = issueTemplate.content.firstElementChild.cloneNode(true);
		card.querySelector(".issue-file").textContent = issue.fileName;
		card.querySelector(".issue-reason").textContent = issue.reason;
		return card;
	}

	// --- Settings panel -------------------------------------------------

	const settingsGear = document.querySelector("#settings-gear");
	const settingsPanel = document.querySelector("#settings-panel");
	const settingsError = document.querySelector("#settings-error");
	const allowLateJoinInput = document.querySelector("#allow-late-join");
	const autoAdvanceValue = document.querySelector("#auto-advance-value");
	const autoAdvanceDown = document.querySelector("#auto-advance-down");
	const autoAdvanceUp = document.querySelector("#auto-advance-up");
	const currentPasswordInput = document.querySelector("#current-password");
	const newPasswordInput = document.querySelector("#new-password");
	const passwordError = document.querySelector("#password-error");
	const passwordSuccess = document.querySelector("#password-success");
	const savePasswordButton = document.querySelector("#save-password");
	const deleteError = document.querySelector("#delete-error");
	const deleteAccountButton = document.querySelector("#delete-account");

	const AUTO_ADVANCE_PRESETS_SECONDS = [1, 3, 5, 10];
	let autoAdvanceIndex = 1;
	let settingsDirty = false;
	let settingsLoaded = false;

	settingsGear.addEventListener("click", toggleSettingsPanel);
	document.addEventListener("pointerdown", event => {
		if (settingsPanel.hidden) return;
		if (event.target.closest(".settings-wrap")) return;
		closeSettingsPanel();
	});
	document.addEventListener("keydown", event => {
		if (event.key === "Escape" && !settingsPanel.hidden) {
			closeSettingsPanel();
			settingsGear.focus();
		}
	});
	autoAdvanceDown.addEventListener("click", () => stepAutoAdvance(-1));
	autoAdvanceUp.addEventListener("click", () => stepAutoAdvance(1));
	allowLateJoinInput.addEventListener("change", () => {
		settingsDirty = true;
	});
	document.querySelector("#password-form").addEventListener("submit", event => {
		event.preventDefault();
		savePassword();
	});
	deleteAccountButton.addEventListener("click", deleteAccount);

	function toggleSettingsPanel() {
		if (settingsPanel.hidden) {
			openSettingsPanel();
		} else {
			closeSettingsPanel();
		}
	}

	let settingsCloseTimer = null;
	let settingsOpenFrame = null;

	function openSettingsPanel() {
		window.clearTimeout(settingsCloseTimer);
		settingsPanel.hidden = false;
		settingsGear.setAttribute("aria-expanded", "true");
		settingsGear.setAttribute("aria-label", "Close settings");
		settingsOpenFrame = window.requestAnimationFrame(() => settingsPanel.classList.add("is-open"));
		if (!settingsLoaded) loadSettingsPanel();
	}

	function closeSettingsPanel() {
		window.cancelAnimationFrame(settingsOpenFrame);
		settingsGear.setAttribute("aria-expanded", "false");
		settingsGear.setAttribute("aria-label", "Open settings");
		settingsPanel.classList.remove("is-open");
		window.clearTimeout(settingsCloseTimer);
		settingsCloseTimer = window.setTimeout(() => {
			if (!settingsPanel.classList.contains("is-open")) settingsPanel.hidden = true;
		}, 300);
		if (settingsLoaded && settingsDirty) saveGameDefaults();
	}

	async function loadSettingsPanel() {
		try {
			const settings = await requestJson("/admin/api/account/settings");
			settingsLoaded = true;
			allowLateJoinInput.checked = Boolean(settings.allowLateJoin);
			const seconds = Math.round((settings.autoAdvanceDelayMs || 0) / 1000);
			autoAdvanceIndex = nearestPresetIndex(seconds);
			renderAutoAdvance();
		} catch (error) {
			showSettingsMessage(settingsError, "Could not load your settings.");
		}
	}

	function nearestPresetIndex(seconds) {
		let best = 0;
		AUTO_ADVANCE_PRESETS_SECONDS.forEach((preset, index) => {
			if (Math.abs(preset - seconds) < Math.abs(AUTO_ADVANCE_PRESETS_SECONDS[best] - seconds)) best = index;
		});
		return best;
	}

	function stepAutoAdvance(direction) {
		autoAdvanceIndex = (autoAdvanceIndex + direction + AUTO_ADVANCE_PRESETS_SECONDS.length)
			% AUTO_ADVANCE_PRESETS_SECONDS.length;
		settingsDirty = true;
		renderAutoAdvance();
	}

	function renderAutoAdvance() {
		autoAdvanceValue.textContent = `${AUTO_ADVANCE_PRESETS_SECONDS[autoAdvanceIndex]}s`;
	}

	async function saveGameDefaults() {
		settingsDirty = false;
		try {
			await requestJson("/admin/api/account/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					allowLateJoin: allowLateJoinInput.checked,
					autoAdvanceDelayMs: AUTO_ADVANCE_PRESETS_SECONDS[autoAdvanceIndex] * 1000
				})
			});
		} catch (error) {
			showSettingsMessage(settingsError, "Settings could not be saved.");
		}
	}

	async function savePassword() {
		hideSettingsMessage(passwordError);
		hideSettingsMessage(passwordSuccess);
		if (!newPasswordInput.value || newPasswordInput.value.length < 8) {
			showSettingsMessage(passwordError, "The new password must be at least 8 characters.");
			return;
		}
		savePasswordButton.disabled = true;
		try {
			await requestJson("/admin/api/account/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: currentPasswordInput.value,
					newPassword: newPasswordInput.value
				})
			});
			currentPasswordInput.value = "";
			newPasswordInput.value = "";
			showSettingsMessage(passwordSuccess, "Password updated.");
		} catch (error) {
			showSettingsMessage(passwordError, "The current password is incorrect, or the new password is too short.");
		} finally {
			savePasswordButton.disabled = false;
		}
	}

	async function deleteAccount() {
		hideSettingsMessage(deleteError);
		if (!window.confirm("Delete your account, all of your quizzes, and close any running games? This cannot be undone.")) {
			return;
		}
		deleteAccountButton.disabled = true;
		try {
			await requestJson("/admin/api/account", { method: "DELETE" });
			window.location.assign("/login");
		} catch (error) {
			showSettingsMessage(deleteError, "The account could not be deleted.");
			deleteAccountButton.disabled = false;
		}
	}

	function showSettingsMessage(element, text) {
		element.textContent = text;
		element.hidden = false;
	}

	function hideSettingsMessage(element) {
		element.hidden = true;
	}
})();

