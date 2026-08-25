import { DEFAULT_AVATAR_STYLE, FALLBACK_AVATAR, avatarFor, preloadAvatarStyles } from "./avatar.js";
import { launchConfetti, stopConfetti } from "./confetti.js";

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
	const backgroundMusic = document.querySelector("#background-music");
	const musicToggle = document.querySelector("#music-toggle");
	const MUSIC_MUTED_KEY = "quizzle-presenter-music-muted";
	const COLUMN_STAGGER_MS = 320;
	const COLUMN_GROW_MS = 1_100;
	const SSE_GRACE_MS = 6_000;
	const POLL_INTERVAL_MS = 2_000;
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
	let pollTimer = null;
	let lastStateAtMs = 0;
	let chartedQuestionId = null;
	let renderedStateSignature = null;
	let renderedLeaderboardSignature = null;
	let renderedFinalSignature = null;
	let resultsRevealTimer = null;
	let confettiShown = false;
	let confettiTimer = null;
	let pollInFlight = false;
	// A poll fired right after a command can resolve after a slower in-flight poll from the
	// regular interval, rolling the UI back to a stale state (and silently killing the pending
	// confetti timer since it looks like FINAL_RESULTS was left). Reject anything older.
	let lastAppliedUpdatedAtEpochMs = -1;

	if (!codehash) {
		showMessage("This presenter link is invalid.", true);
	} else {
		document.querySelector("#session-code-chip").textContent = codehash;
		loadJoinDetails();
		preloadAvatarStyles().then(subscribe);
		setupBackgroundMusic();
	}

	document.querySelector("#start-button").addEventListener("click", () => sendCommand("START"));
	document.querySelector("#end-early-button").addEventListener("click", () => sendCommand("END_EARLY"));
	document.querySelector("#next-button").addEventListener("click", () => sendCommand("NEXT"));
	document.querySelector("#leaderboard-next-button").addEventListener("click", () => sendCommand("NEXT"));

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
			// A proxy can start silently swallowing the stream mid-session, not just at the start.
			startFeedWatchdog();
		});
		eventSource.addEventListener("error", () => {
			if (pollTimer) return;
			setFeedStatus("offline", "Reconnecting");
			startFeedWatchdog();
			verifyAdminSession();
		});
	}

	// A proxy that buffers or blocks text/event-stream never delivers a state, so switch to polling.
	function startFeedWatchdog() {
		if (pollTimer) return;
		window.clearTimeout(feedWatchdog);
		feedWatchdog = window.setTimeout(() => {
			if (Date.now() - lastStateAtMs >= SSE_GRACE_MS) startPolling();
		}, SSE_GRACE_MS);
	}

	function startPolling() {
		if (pollTimer) return;
		window.clearTimeout(feedWatchdog);
		eventSource?.close();
		eventSource = null;
		pollState();
		pollTimer = window.setInterval(pollState, POLL_INTERVAL_MS);
	}

	async function pollState() {
		// An immediate post-command poll can overlap the regular interval tick; never run two at once.
		if (pollInFlight) return;
		pollInFlight = true;
		try {
			// The cache-busting query param defeats proxies that cache GETs despite Cache-Control: no-store.
			applyStateMessage(await requestJson(
				`/admin/api/sessions/${codehash}/state?_=${Date.now()}`,
				{ headers: { "Cache-Control": "no-cache" } }));
			setFeedStatus("live", "Live (polling)");
		} catch (error) {
			// A closed session is deleted on the server, so polling it starts to answer with 404.
			if (error.status === 404) {
				showClosedSession();
				return;
			}
			setFeedStatus("offline", "Reconnecting");
		} finally {
			pollInFlight = false;
		}
	}

	function showClosedSession() {
		window.clearInterval(pollTimer);
		pollTimer = null;
		stopCountdown();
		cancelConfetti();
		hideMessage();
		showView("closed-view");
		setFeedStatus("offline", "Closed");
	}

	function applyState(rawState) {
		try {
			applyStateMessage(JSON.parse(rawState));
		} catch {
			showMessage("The server sent an unreadable state update.", true);
		}
	}

	function applyStateMessage(received) {
		if (received?.type !== "STATE" || received.payload?.codehash !== codehash) return;
		// Reject responses that raced a newer one and resolved out of order (see pollInFlight above).
		const updatedAt = Number(received.payload.updatedAtEpochMs);
		if (Number.isFinite(updatedAt)) {
			if (updatedAt < lastAppliedUpdatedAtEpochMs) return;
			lastAppliedUpdatedAtEpochMs = updatedAt;
		}
		session = received.payload;
		lastStateAtMs = Date.now();
		window.clearTimeout(feedWatchdog);
		serverClockOffsetMs = Number(session.serverEpochMs) - Date.now();
		hideMessage();
		const signature = stateSignature(session);
		if (signature === renderedStateSignature) return;
		renderedStateSignature = signature;
		render();
	}

	// Polling repeats the same state; only the server clock differs, so it must not count as a change.
	function stateSignature(payload) {
		const { serverEpochMs, ...rest } = payload;
		return JSON.stringify(rest);
	}

	function render() {
		stopCountdown();
		if (session.state !== "FINAL_RESULTS") {
			renderedFinalSignature = null;
			cancelConfetti();
		}
		if (session.state !== "LEADERBOARD") renderedLeaderboardSignature = null;
		switch (session.state) {
			case "LOBBY": renderLobby(); break;
			case "QUESTION_OPEN": renderQuestion(); break;
			case "RESULTS": renderResults(); break;
			case "LEADERBOARD": renderLeaderboard(); break;
			case "FINAL_RESULTS": renderFinalResults(); scheduleConfetti(); break;
			case "CLOSED": showView("closed-view"); break;
			default: break;
		}
	}

	// The podium reveals place by place, so the confetti waits for the winner to be on screen.
	function scheduleConfetti() {
		const placeCount = Math.min(3, (session.standings || []).length);
		if (confettiShown || placeCount === 0) return;
		confettiShown = true;
		confettiTimer = window.setTimeout(() => launchConfetti(), placeCount * 1_700 + 900);
	}

	function cancelConfetti() {
		window.clearTimeout(confettiTimer);
		confettiTimer = null;
		confettiShown = false;
		stopConfetti();
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

	function createOptionTile(option) {
		const tile = document.createElement("article");
		tile.className = "option-tile";
		const marker = document.createElement("span");
		marker.className = "option-marker";
		marker.setAttribute("aria-hidden", "true");
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
			: "Show leaderboard";
		renderedQuestionId = null;

		// Rebuilding on every state push would restart the reveal, so each question is charted once.
		const questionId = session.results?.questionId ?? null;
		if (chartedQuestionId === questionId) return;
		chartedQuestionId = questionId;

		const chart = document.querySelector("#results-chart");
		const highestVoteCount = Math.max(1, ...options.map(option => Number(option.voteCount) || 0));
		chart.classList.remove("revealed");
		chart.replaceChildren(
			...options.map((option, index) => createResultColumn(option, index, highestVoteCount)));

		window.clearTimeout(resultsRevealTimer);
		const revealDelayMs = COLUMN_STAGGER_MS * Math.max(0, options.length - 1) + COLUMN_GROW_MS + 250;
		resultsRevealTimer = window.setTimeout(() => chart.classList.add("revealed"), revealDelayMs);
	}

	function createResultColumn(option, index, highestVoteCount) {
		const column = document.createElement("article");
		column.className = option.correct ? "result-column correct" : "result-column";
		column.style.setProperty("--column-delay", `${index * COLUMN_STAGGER_MS}ms`);

		const track = document.createElement("div");
		track.className = "result-track";
		const bar = document.createElement("div");
		bar.className = "result-bar";
		bar.style.setProperty("--fill", `${(Number(option.voteCount) / highestVoteCount) * 100}%`);

		const cap = document.createElement("div");
		cap.className = "result-cap";
		const tag = document.createElement("span");
		tag.className = "correct-tag";
		tag.textContent = "Correct";
		const votes = document.createElement("span");
		votes.className = "result-votes";
		votes.textContent = String(option.voteCount);
		cap.append(tag, votes);
		bar.append(cap);
		track.append(bar);

		const label = document.createElement("div");
		label.className = "result-label";
		const shape = document.createElement("span");
		shape.className = "result-shape";
		shape.setAttribute("aria-hidden", "true");
		const text = document.createElement("span");
		text.textContent = option.text;
		label.append(shape, text);

		column.append(track, label);
		return column;
	}

	function renderLeaderboard() {
		showView("leaderboard-view");
		const standings = session.standings || [];
		setText("#leaderboard-progress",
			`After question ${session.currentQuestionIndex + 1} of ${session.questionCount}`);
		const signature = JSON.stringify(standings);
		if (renderedLeaderboardSignature !== signature) {
			renderedLeaderboardSignature = signature;
			document.querySelector("#leaderboard-list").replaceChildren(
				...standings.map((standing, index) => createStandingRow(standing, index)));
		}
		renderedQuestionId = null;
		chartedQuestionId = null;
	}

	function renderFinalResults() {
		showView("final-view");
		const standings = session.standings || [];
		podium.hidden = standings.length === 0;
		standingsToggle.hidden = standings.length === 0;

		setText("#final-subtitle", standings.length === 0 ? "Nobody took part in this quiz." : "");
		renderedQuestionId = null;

		// Reapplying the podium would restart its reveal, so the winner screen is built once.
		const signature = JSON.stringify(standings);
		if (renderedFinalSignature === signature) return;
		renderedFinalSignature = signature;

		// Third place opens the reveal, so the delays follow the occupied places, not the fixed markup order.
		let revealIndex = 0;
		for (const placeNumber of [3, 2, 1]) {
			const place = podium.querySelector(`.podium-place[data-place="${placeNumber}"]`);
			const standing = standings[placeNumber - 1];
			place.hidden = !standing;
			if (!standing) continue;
			place.style.setProperty("--podium-index", String(revealIndex));
			revealIndex++;
			place.querySelector(".podium-name").textContent = standing.name;
			place.querySelector(".podium-points").textContent =
				`${Math.round(Number(standing.totalPoints) || 0)} points`;
			setAvatar(place.querySelector(".podium-avatar"), participantFor(standing.playerId));
		}
		standingsList.replaceChildren(...standings.map((standing, index) => createStandingRow(standing, index)));
	}

	function createStandingRow(standing, index) {
		const row = document.createElement("article");
		row.className = "standing-row";
		row.style.setProperty("--row-index", String(index));
		const rank = document.createElement("span");
		rank.className = "standing-rank";
		rank.textContent = `#${standing.rank}`;
		const avatar = document.createElement("img");
		avatar.className = "standing-avatar";
		avatar.alt = "";
		setAvatar(avatar, participantFor(standing.playerId));
		const name = document.createElement("strong");
		name.textContent = standing.name;
		const points = document.createElement("span");
		points.className = "standing-points";
		points.textContent = `${Math.round(Number(standing.totalPoints) || 0)} pts`;
		row.append(rank, avatar, name, points);
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
			if (pollTimer) pollState();
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
			if (pollTimer) pollState();
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

	// Autoplay with sound needs a user gesture, so playback is retried on the first interaction if blocked.
	function setupBackgroundMusic() {
		if (!backgroundMusic || !musicToggle) return;
		backgroundMusic.volume = 0.4;
		const muted = window.localStorage.getItem(MUSIC_MUTED_KEY) === "true";
		applyMusicMuted(muted);

		const tryPlay = () => backgroundMusic.play().catch(() => {});
		tryPlay();
		const resumeOnGesture = () => {
			tryPlay();
			document.removeEventListener("pointerdown", resumeOnGesture);
			document.removeEventListener("keydown", resumeOnGesture);
		};
		document.addEventListener("pointerdown", resumeOnGesture);
		document.addEventListener("keydown", resumeOnGesture);

		musicToggle.addEventListener("click", () => {
			applyMusicMuted(!backgroundMusic.muted);
			tryPlay();
		});
	}

	function applyMusicMuted(muted) {
		backgroundMusic.muted = muted;
		musicToggle.setAttribute("aria-pressed", String(muted));
		musicToggle.setAttribute("aria-label", muted ? "Unmute background music" : "Mute background music");
		musicToggle.querySelector("span").textContent = muted ? "🔇" : "🔊";
		window.localStorage.setItem(MUSIC_MUTED_KEY, String(muted));
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
