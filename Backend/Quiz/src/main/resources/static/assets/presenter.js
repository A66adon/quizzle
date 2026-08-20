import { DEFAULT_AVATAR_STYLE, FALLBACK_AVATAR, avatarFor, preloadAvatarStyles } from "./avatar.js";

(() => {
	"use strict";

	const codehash = readCodehash();
	const views = [...document.querySelectorAll(".view")];
	const feedStatus = document.querySelector("#feed-status");
	const presenterMessage = document.querySelector("#presenter-message");
	const abortDialog = document.querySelector("#abort-dialog");
	const kickDialog = document.querySelector("#kick-dialog");
	const standingsToggle = document.querySelector("#standings-toggle");
	const standingsList = document.querySelector("#standings-list");
	const podium = document.querySelector("#podium");
	const closingCommands = {
		ABORT: {
			heading: "Abort this quiz?",
			detail: "All participants are disconnected immediately and the session cannot be resumed."
		},
		CLOSE: {
			heading: "Close this quiz?",
			detail: "Participants see the closing screen and the session can no longer be resumed."
		}
	};

	let eventSource = null;
	let session = null;
	let serverClockOffsetMs = 0;
	let renderedQuestionId = null;
	let countdownTimer = null;
	let pendingKickPlayerId = null;
	let pendingClosingCommand = "ABORT";
	let feedWatchdog = null;

	if (!codehash) {
		showMessage("This presenter link is invalid.", true);
	} else {
		document.querySelector("#session-code-chip").textContent = codehash;
		loadJoinDetails();
		preloadAvatarStyles().then(subscribe);
	}

	document.querySelector("#start-button").addEventListener("click", () => sendCommand("START"));
	document.querySelector("#end-early-button").addEventListener("click", () => sendCommand("END_EARLY"));
	document.querySelector("#next-button").addEventListener("click", () => sendCommand("NEXT"));
	document.querySelector("#reveal-button").addEventListener("click", () => sendCommand("OPEN_PODIUM"));

	for (const button of document.querySelectorAll("[data-abort]")) {
		button.addEventListener("click", () => {
			pendingClosingCommand = button.dataset.command || "ABORT";
			const copy = closingCommands[pendingClosingCommand];
			abortDialog.querySelector("h2").textContent = copy.heading;
			abortDialog.querySelector(".muted").textContent = copy.detail;
			document.querySelector("#confirm-abort-button").textContent =
				pendingClosingCommand === "CLOSE" ? "Close quiz" : "Abort quiz";
			abortDialog.showModal();
		});
	}

	document.querySelector("#confirm-abort-button").addEventListener("click", () => {
		abortDialog.close();
		sendCommand(pendingClosingCommand);
	});

	document.querySelector("#confirm-kick-button").addEventListener("click", () => {
		kickDialog.close();
		kickPlayer(pendingKickPlayerId);
	});

	standingsToggle.addEventListener("click", () => {
		const expanded = standingsToggle.getAttribute("aria-expanded") === "true";
		standingsToggle.setAttribute("aria-expanded", String(!expanded));
		standingsToggle.textContent = expanded ? "Show full ranking" : "Hide full ranking";
		standingsList.hidden = expanded;
	});

	function subscribe() {
		eventSource = new EventSource(`/admin/api/sessions/${codehash}/events`);
		startFeedWatchdog();
		eventSource.addEventListener("open", () => setFeedStatus("live", "Live"));
		eventSource.addEventListener("state", event => {
			setFeedStatus("live", "Live");
			applyState(event.data);
		});
		eventSource.addEventListener("error", () => {
			setFeedStatus("offline", "Reconnecting");
			verifyAdminSession();
		});
	}

	// A proxy that buffers text/event-stream leaves this view blank with no error of its own.
	function startFeedWatchdog() {
		window.clearTimeout(feedWatchdog);
		feedWatchdog = window.setTimeout(() => {
			if (!session) {
				showMessage("No live updates received. If Quizzle runs behind a reverse proxy, check that "
					+ "it does not buffer text/event-stream responses.", true);
			}
		}, 8_000);
	}

	function applyState(rawState) {
		let received;
		try {
			received = JSON.parse(rawState);
		} catch {
			showMessage("The server sent an unreadable state update.", true);
			return;
		}
		if (received?.type !== "STATE" || received.payload?.codehash !== codehash) return;
		session = received.payload;
		window.clearTimeout(feedWatchdog);
		serverClockOffsetMs = Number(session.serverEpochMs) - Date.now();
		hideMessage();
		render();
	}

	function render() {
		stopCountdown();
		switch (session.state) {
			case "LOBBY": renderLobby(); break;
			case "QUESTION_OPEN": renderQuestion(); break;
			case "RESULTS": renderResults(); break;
			case "FINAL_RESULTS": renderFinalResults(); break;
			case "CLOSED": showView("closed-view"); break;
			default: break;
		}
	}

	function renderLobby() {
		showView("lobby-view");
		setText("#lobby-title", session.quizTitle);
		setText("#lobby-description", session.quizDescription);
		setText("#question-total", session.questionCount);

		const participants = session.participants || [];
		const connected = participants.filter(participant => participant.connectionStatus === "CONNECTED");
		const offline = participants.filter(participant => participant.connectionStatus !== "CONNECTED");
		setText("#connected-count", connected.length);
		setText("#disconnected-count", offline.length);

		document.querySelector("#avatar-field").replaceChildren(...connected.map(createAvatarChip));
		document.querySelector("#lobby-empty").hidden = participants.length !== 0;
		document.querySelector("#offline-list").replaceChildren(...offline.map(createOfflineRow));
		document.querySelector(".offline-heading").hidden = offline.length === 0;
		renderedQuestionId = null;
	}

	function createAvatarChip(participant) {
		const chip = document.createElement("article");
		chip.className = "avatar-chip";
		chip.style.animationDelay = `${hashToUnitInterval(participant.playerId) * -6}s`;
		chip.style.animationDuration = `${5 + hashToUnitInterval(participant.name) * 3}s`;

		const avatar = document.createElement("img");
		avatar.alt = "";
		setAvatar(avatar, participant);
		const name = document.createElement("strong");
		name.textContent = participant.name;
		name.title = participant.name;
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "kick-button";
		remove.textContent = "Remove";
		remove.addEventListener("click", () => askToKick(participant));

		chip.append(avatar, name, remove);
		return chip;
	}

	function createOfflineRow(participant) {
		const row = document.createElement("article");
		row.className = "offline-row";
		const avatar = document.createElement("img");
		avatar.alt = "";
		setAvatar(avatar, participant);
		const name = document.createElement("strong");
		name.textContent = participant.name;
		const status = document.createElement("span");
		status.className = "status-tag";
		status.textContent = participant.connectionStatus === "EXPIRED" ? "Expired" : "Disconnected";
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "ghost-button";
		remove.textContent = "Remove";
		remove.addEventListener("click", () => askToKick(participant));
		row.append(avatar, name, status, remove);
		return row;
	}

	function askToKick(participant) {
		pendingKickPlayerId = participant.playerId;
		setText("#kick-name", participant.name);
		kickDialog.showModal();
	}

	function renderQuestion() {
		showView("question-view");
		const question = session.question;
		if (!question) return;
		setText("#question-progress", `Question ${session.currentQuestionIndex + 1} of ${session.questionCount}`);
		setText("#question-title", question.text);
		setText("#question-mode", question.multiple
			? `Multiple answers · up to ${question.maximumPoints} points`
			: `Single answer · up to ${question.maximumPoints} points`);
		setText("#answers-received", session.receivedAnswerCount || 0);

		if (renderedQuestionId !== question.id) {
			renderedQuestionId = question.id;
			document.querySelector("#question-options").replaceChildren(
				...(question.answers || []).map(createOptionTile));
		}
		startCountdown();
	}

	function createOptionTile(option, index) {
		const tile = document.createElement("article");
		tile.className = "option-tile";
		const marker = document.createElement("span");
		marker.className = "option-marker";
		marker.textContent = String.fromCharCode(65 + index);
		const text = document.createElement("span");
		text.textContent = option.text;
		tile.append(marker, text);
		return tile;
	}

	function renderResults() {
		showView("results-view");
		const question = session.question;
		const options = session.results?.options || [];
		const lastQuestion = session.currentQuestionIndex + 1 >= session.questionCount;
		setText("#results-progress", `Question ${session.currentQuestionIndex + 1} of ${session.questionCount}`);
		setText("#results-title", question?.text || "Results");
		setText("#results-answer-count", session.receivedAnswerCount || 0);
		document.querySelector("#next-button").textContent = lastQuestion
			? "Finish quiz"
			: "Next question";

		const highestVoteCount = Math.max(1, ...options.map(option => Number(option.voteCount) || 0));
		document.querySelector("#results-chart").replaceChildren(
			...options.map(option => createResultRow(option, highestVoteCount)));
		renderedQuestionId = null;
	}

	function createResultRow(option, highestVoteCount) {
		const row = document.createElement("article");
		row.className = option.correct ? "result-row correct" : "result-row";

		const head = document.createElement("div");
		head.className = "result-head";
		const label = document.createElement("span");
		label.textContent = option.text;
		if (option.correct) {
			const tag = document.createElement("span");
			tag.className = "correct-tag";
			tag.textContent = "Correct";
			label.append(tag);
		}
		const votes = document.createElement("span");
		votes.className = "votes";
		votes.textContent = String(option.voteCount);
		head.append(label, votes);

		const bar = document.createElement("div");
		bar.className = "result-bar";
		const fill = document.createElement("span");
		fill.style.width = `${(Number(option.voteCount) / highestVoteCount) * 100}%`;
		bar.append(fill);

		row.append(head, bar);
		return row;
	}

	function renderFinalResults() {
		showView("final-view");
		const standings = session.standings || [];
		const revealed = Boolean(session.podiumOpen);
		document.querySelector("#reveal-button").hidden = revealed;
		standingsToggle.hidden = !revealed;
		podium.hidden = !revealed;
		if (!revealed) {
			standingsList.hidden = true;
			standingsToggle.setAttribute("aria-expanded", "false");
			standingsToggle.textContent = "Show full ranking";
			return;
		}

		setText("#final-title", "Congratulations");
		setText("#final-subtitle", standings.length === 0
			? "Nobody took part in this quiz."
			: "The fastest correct answers decide any tie.");
		for (const place of podium.querySelectorAll(".podium-place")) {
			const standing = standings[Number(place.dataset.place) - 1];
			place.hidden = !standing;
			if (!standing) continue;
			place.querySelector(".podium-name").textContent = standing.name;
			place.querySelector(".podium-points").textContent =
				`${Math.round(Number(standing.totalPoints) || 0)} points`;
			setAvatar(place.querySelector(".podium-avatar"), participantFor(standing.playerId));
		}
		podium.hidden = standings.length === 0;
		standingsList.replaceChildren(...standings.map(createStandingRow));
		renderedQuestionId = null;
	}

	function createStandingRow(standing) {
		const row = document.createElement("article");
		row.className = "standing-row";
		const rank = document.createElement("span");
		rank.className = "standing-rank";
		rank.textContent = `#${standing.rank}`;
		const name = document.createElement("strong");
		name.textContent = standing.name;
		const points = document.createElement("span");
		points.className = "standing-points";
		points.textContent = `${Math.round(Number(standing.totalPoints) || 0)} pts`;
		row.append(rank, name, points);
		return row;
	}

	function participantFor(playerId) {
		return (session.participants || []).find(entry => entry.playerId === playerId)
			?? { playerId, avatarStyle: DEFAULT_AVATAR_STYLE };
	}

	function startCountdown() {
		const countdown = document.querySelector("#countdown");
		const pill = countdown.closest(".countdown-pill");
		const fill = document.querySelector("#timer-fill");
		const durationMs = Number(session.durationMs) || 0;
		const update = () => {
			const elapsedMs = serverNow() - Number(session.serverStartEpochMs);
			const remainingMs = Math.max(0, durationMs - elapsedMs);
			countdown.textContent = (remainingMs / 1_000).toFixed(1);
			fill.style.width = durationMs > 0 ? `${(remainingMs / durationMs) * 100}%` : "0%";
			pill.classList.toggle("warning", remainingMs <= 10_000 && remainingMs > 5_000);
			pill.classList.toggle("danger", remainingMs <= 5_000);
			if (remainingMs <= 0) stopCountdown();
		};
		update();
		countdownTimer = window.setInterval(update, 100);
	}

	function stopCountdown() {
		if (countdownTimer) window.clearInterval(countdownTimer);
		countdownTimer = null;
	}

	function serverNow() {
		return Date.now() + serverClockOffsetMs;
	}

	async function loadJoinDetails() {
		try {
			const details = await requestJson(`/admin/api/sessions/${codehash}`);
			document.querySelector("#join-qr").src = details.qrUrl;
			document.querySelector("#join-code").textContent = details.codehash;
			const link = document.querySelector("#join-link");
			link.href = details.joinUrl;
			link.textContent = details.joinUrl;
		} catch {
			showMessage("The join link could not be loaded.", true);
		}
	}

	async function sendCommand(command) {
		setControlsDisabled(true);
		try {
			await requestJson(`/admin/api/sessions/${codehash}/commands`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ command })
			});
			hideMessage();
		} catch (error) {
			showMessage(error.status === 409
				? "That step is not possible in the current quiz state."
				: "The command could not be sent. Check the connection and try again.", true);
		} finally {
			setControlsDisabled(false);
		}
	}

	async function kickPlayer(playerId) {
		if (!playerId) return;
		try {
			await requestJson(`/admin/api/sessions/${codehash}/players/${playerId}/kick`, { method: "POST" });
			hideMessage();
		} catch {
			showMessage("The participant could not be removed.", true);
		} finally {
			pendingKickPlayerId = null;
		}
	}

	async function verifyAdminSession() {
		try {
			await requestJson(`/admin/api/sessions/${codehash}`);
		} catch {
			// requestJson already redirects when the admin session expired.
		}
	}

	async function requestJson(url, options = {}) {
		const response = await fetch(url, {
			credentials: "same-origin",
			cache: "no-store",
			...options,
			headers: { Accept: "application/json", ...(options.headers || {}) }
		});
		if (response.status === 401) {
			window.location.replace("/admin/login");
			throw new Error("Admin session expired");
		}
		if (!response.ok) {
			const error = new Error(`Request failed with status ${response.status}`);
			error.status = response.status;
			throw error;
		}
		return response.status === 204 ? null : response.json();
	}

	function setControlsDisabled(disabled) {
		for (const button of document.querySelectorAll(".control-bar button")) {
			button.disabled = disabled;
		}
	}

	function setFeedStatus(state, label) {
		feedStatus.className = `feed-status ${state}`;
		feedStatus.textContent = label;
	}

	function setAvatar(image, participant) {
		image.src = avatarFor(participant?.avatarStyle, participant?.playerId);
		image.addEventListener("error", () => {
			image.src = FALLBACK_AVATAR;
		}, { once: true });
	}

	function showView(viewId) {
		for (const view of views) view.hidden = view.id !== viewId;
	}

	function showMessage(message, isError) {
		presenterMessage.textContent = message;
		presenterMessage.dataset.error = String(Boolean(isError));
		presenterMessage.hidden = false;
	}

	function hideMessage() {
		presenterMessage.hidden = true;
		presenterMessage.textContent = "";
	}

	function setText(selector, value) {
		document.querySelector(selector).textContent = value == null ? "" : String(value);
	}

	function hashToUnitInterval(value) {
		let hash = 0;
		for (const character of String(value)) {
			hash = (hash * 31 + character.codePointAt(0)) % 100_003;
		}
		return hash / 100_003;
	}

	function readCodehash() {
		const match = window.location.pathname.match(/^\/admin\/sessions\/([A-Za-z0-9_-]{8,32})\/?$/);
		return match ? match[1] : null;
	}
})();
