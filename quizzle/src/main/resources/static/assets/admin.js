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
	const emptyQuizDialog = document.querySelector("#empty-quiz-dialog");
	const emptyQuizName = document.querySelector("#empty-quiz-name");
	const cancelEmptyQuiz = document.querySelector("#cancel-empty-quiz");
	const editEmptyQuiz = document.querySelector("#edit-empty-quiz");
	const MIN_SESSION_TITLE_FONT_PX = 13;
	const importButton = document.querySelector("#import-yaml");
	const importFileInput = document.querySelector("#import-yaml-file");
	const MAX_IMPORT_BYTES = 1_048_576;
	let sessions = [];
	let accountEmail = "";
	let pendingDeleteSession = null;
	let pendingEmptyQuizFile = null;
	let titleFitFrame = null;

	announceWelcome();
	loadAdminData();
	confirmDeleteSession.addEventListener("click", deletePendingSession);
	cancelDeleteSession.addEventListener("click", () => deleteSessionDialog.close("cancel"));
	cancelEmptyQuiz.addEventListener("click", () => emptyQuizDialog.close("cancel"));
	editEmptyQuiz.addEventListener("click", () => {
		if (!pendingEmptyQuizFile) return;
		window.location.assign(`/editor?file=${encodeURIComponent(pendingEmptyQuizFile)}`);
	});
	emptyQuizDialog.addEventListener("close", () => {
		pendingEmptyQuizFile = null;
	});
	deleteSessionDialog.addEventListener("close", () => {
		pendingDeleteSession = null;
		deleteSessionError.hidden = true;
	});
	deleteSessionDialog.addEventListener("cancel", event => {
		if (confirmDeleteSession.disabled) event.preventDefault();
	});
	window.addEventListener("resize", scheduleSessionTitleFit);
	importButton.addEventListener("click", () => importFileInput.click());
	importFileInput.addEventListener("change", async () => {
		const file = importFileInput.files[0];
		if (!file) return;
		actionStatus.hidden = false;
		delete actionStatus.dataset.error;
		if (file.size === 0 || file.size > MAX_IMPORT_BYTES) {
			actionStatus.textContent = "Choose a non-empty YAML file no larger than 1 MiB.";
			actionStatus.dataset.error = "true";
			importFileInput.value = "";
			return;
		}
		importButton.disabled = true;
		actionStatus.textContent = "Importing YAML…";
		try {
			const created = await requestJson("/admin/api/quizzes/import", {
				method: "POST",
				headers: { "Content-Type": "application/yaml" },
				body: await file.text()
			});
			if (!created?.fileName) throw new Error("The server did not return an imported quiz.");
			window.location.assign(`/editor?file=${encodeURIComponent(created.fileName)}`);
		} catch (error) {
			actionStatus.textContent = error.message || "Import failed. Check the YAML and try again.";
			actionStatus.dataset.error = "true";
		} finally {
			importButton.disabled = false;
			importFileInput.value = "";
		}
	});

	// Registration signs the new account straight in, so the confirmation lands here.
	function announceWelcome() {
		const currentUrl = new URL(window.location.href);
		if (!currentUrl.searchParams.has("welcome")) return;
		currentUrl.searchParams.delete("welcome");
		history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
		if (window.showToast) window.showToast("Account created.");
	}

	async function loadAdminData() {
		try {
			const [catalog, loadedSessions, settings] = await Promise.all([
				requestJson("/admin/api/quizzes"),
				requestJson("/admin/api/sessions"),
				requestJson("/admin/api/account/settings").catch(() => null)
			]);
			accountEmail = settings && settings.email ? String(settings.email).toLowerCase() : "";
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
			window.location.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
			throw new Error("Session expired");
		}
		if (!response.ok) {
			const error = new Error(response.status === 400
				? "The quiz data is invalid. Check the YAML fields, limits, and correct answers."
				: response.status === 413 ? "The YAML file exceeds the server size limit."
					: response.status === 403 ? "This action was not authorized. Reauthenticate, or refresh the page if your security token expired."
						: `Request failed with status ${response.status}`);
			error.status = response.status;
			throw error;
		}
		return response.status === 204 ? null : response.json();
	}

	function renderCatalog(catalog) {
		const quizzes = Array.isArray(catalog.quizzes) ? catalog.quizzes : [];
		const issues = Array.isArray(catalog.issues) ? catalog.issues : [];

		quizGrid.replaceChildren(createAddQuizCard(), ...quizzes.map(createQuizCard));
		issueList.replaceChildren(...issues.map(createIssueCard));

		quizCount.textContent = String(quizzes.length);
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
		const isPlayable = Number(quiz.questionCount) > 0;
		let playInFlight = false;
		const play = () => {
			// A quiz without questions has nothing to present, so it explains itself instead.
			if (!isPlayable) {
				pendingEmptyQuizFile = quiz.fileName;
				emptyQuizName.textContent = quiz.title;
				emptyQuizDialog.showModal();
				return;
			}
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
	const passwordEmailInput = document.querySelector("#password-email");
	const passwordForm = document.querySelector("#password-form");
	const oauthReauth = document.querySelector("#oauth-reauth");
	const passwordError = document.querySelector("#password-error");
	const savePasswordButton = document.querySelector("#save-password");
	const deleteError = document.querySelector("#delete-error");
	const deleteAccountButton = document.querySelector("#delete-account");
	const deleteAccountForm = document.querySelector("#delete-account-form");
	const deleteCurrentPassword = document.querySelector("#delete-current-password");
	const confirmDeleteAccount = document.querySelector("#confirm-delete-account");
	const cancelDeleteAccount = document.querySelector("#cancel-delete-account");
	let hasLocalPassword = false;
	let settingsSavePromise = null;

	const AUTO_ADVANCE_PRESETS_SECONDS = [1, 3, 5, 10];
	let autoAdvanceIndex = 1;
	let autoAdvanceDelayMs = 3000;
	let settingsDirty = false;
	let settingsLoaded = false;
	let settingsLoading = false;

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
	passwordForm.addEventListener("submit", event => {
		event.preventDefault();
		savePassword();
	});
	deleteAccountButton.addEventListener("click", () => {
		if (!settingsLoaded) return;
		hideSettingsMessage(deleteError);
		deleteAccountForm.hidden = false;
		deleteAccountButton.hidden = true;
		if (hasLocalPassword) deleteCurrentPassword.focus();
		else confirmDeleteAccount.focus();
	});
	cancelDeleteAccount.addEventListener("click", () => {
		deleteCurrentPassword.value = "";
		deleteAccountForm.hidden = true;
		deleteAccountButton.hidden = false;
		hideSettingsMessage(deleteError);
		deleteAccountButton.focus();
	});
	deleteAccountForm.addEventListener("submit", event => {
		event.preventDefault();
		deleteAccount();
	});

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
		// Below phone width the panel is pinned to the viewport, so it needs the gear's own
		// bottom edge as its top offset to stay attached without running off-screen.
		settingsPanel.style.setProperty(
			"--settings-panel-top",
			`${Math.round(settingsGear.getBoundingClientRect().bottom + 8)}px`);
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
		if (settingsLoading) return;
		settingsLoading = true;
		deleteAccountButton.disabled = true;
		savePasswordButton.disabled = true;
		try {
			const settings = await requestJson("/admin/api/account/settings");
			if (!Number.isInteger(settings.autoAdvanceDelayMs)
				|| settings.autoAdvanceDelayMs < 0 || settings.autoAdvanceDelayMs > 120000) {
				throw new Error("The server returned an invalid auto advance delay.");
			}
			settingsLoaded = true;
			passwordEmailInput.value = settings.email || "";
			hasLocalPassword = settings.hasLocalPassword === true;
			passwordForm.hidden = !hasLocalPassword;
			oauthReauth.hidden = hasLocalPassword;
			document.querySelector("#delete-password-field").hidden = !hasLocalPassword;
			deleteCurrentPassword.required = hasLocalPassword;
			allowLateJoinInput.checked = Boolean(settings.allowLateJoin);
			autoAdvanceDelayMs = settings.autoAdvanceDelayMs;
			autoAdvanceIndex = nearestPresetIndex(autoAdvanceDelayMs / 1000);
			renderAutoAdvance();
			deleteAccountButton.disabled = false;
			savePasswordButton.disabled = false;
			allowLateJoinInput.disabled = false;
			autoAdvanceDown.disabled = false;
			autoAdvanceUp.disabled = false;
		} catch (error) {
			showSettingsMessage(settingsError, "Could not load your settings.");
		} finally {
			settingsLoading = false;
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
		autoAdvanceDelayMs = AUTO_ADVANCE_PRESETS_SECONDS[autoAdvanceIndex] * 1000;
		settingsDirty = true;
		renderAutoAdvance();
		pulse(autoAdvanceValue);
	}

	function renderAutoAdvance() {
		autoAdvanceValue.textContent = `${autoAdvanceDelayMs / 1000}s`;
	}

	// One short pulse so the stepped value reads as a control that answered the press.
	function pulse(element) {
		element.classList.remove("value-changed");
		void element.offsetWidth;
		element.classList.add("value-changed");
		element.addEventListener("animationend", () => element.classList.remove("value-changed"), { once: true });
	}

	async function saveGameDefaults() {
		if (settingsSavePromise) return settingsSavePromise;
		settingsSavePromise = savePendingDefaults().finally(() => { settingsSavePromise = null; });
		return settingsSavePromise;
	}

	async function savePendingDefaults() {
		try {
			while (settingsDirty) {
				const submitted = {
					allowLateJoin: allowLateJoinInput.checked,
					autoAdvanceDelayMs
				};
				settingsDirty = false;
				await requestJson("/admin/api/account/settings", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(submitted)
				});
			}
			hideSettingsMessage(settingsError);
		} catch (error) {
			settingsDirty = true;
			showSettingsMessage(settingsError, `${error.message || "Settings could not be saved."} Reopen and close settings to retry.`);
		}
	}

	async function savePassword() {
		if (!settingsLoaded || !hasLocalPassword || savePasswordButton.disabled) return;
		hideSettingsMessage(passwordError);
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
			if (window.showToast) window.showToast("Password updated.");
		} catch (error) {
			showSettingsMessage(passwordError, error.status === 400
				? "The current password is incorrect, or the new password does not meet the requirements."
				: error.message || "The password could not be updated. Try again.");
		} finally {
			savePasswordButton.disabled = false;
		}
	}

	async function deleteAccount() {
		if (!settingsLoaded || confirmDeleteAccount.disabled) return;
		hideSettingsMessage(deleteError);
		if (hasLocalPassword && !deleteCurrentPassword.value) {
			showSettingsMessage(deleteError, "Enter your current password to confirm account deletion.");
			deleteCurrentPassword.focus();
			return;
		}
		confirmDeleteAccount.disabled = true;
		cancelDeleteAccount.disabled = true;
		try {
			await requestJson("/admin/api/account", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(hasLocalPassword ? { currentPassword: deleteCurrentPassword.value } : {})
			});
			deleteCurrentPassword.value = "";
			window.location.assign("/login");
		} catch (error) {
			showSettingsMessage(deleteError, error.status === 403
				? hasLocalPassword
					? "Deletion was not authorized. Check your current password, or refresh if your security token expired."
					: "Deletion requires recent Google authentication. Use Reauthenticate with Google above, then try again."
				: error.status === 400 ? "Check your current password and try again."
					: error.message || "The account could not be deleted. Try again.");
		} finally {
			confirmDeleteAccount.disabled = false;
			cancelDeleteAccount.disabled = false;
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
