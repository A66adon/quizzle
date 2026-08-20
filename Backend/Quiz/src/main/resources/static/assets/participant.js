(() => {
	"use strict";

	const views = [...document.querySelectorAll(".view")];
	const connectionStatus = document.querySelector("#connection-status");
	const connectionLabel = document.querySelector("#connection-label");
	const clientMessage = document.querySelector("#client-message");
	const joinForm = document.querySelector("#join-form");
	const nameInput = document.querySelector("#player-name");
	const joinButton = document.querySelector("#join-button");
	const answerDialog = document.querySelector("#answer-dialog");
	const confirmMultipleButton = document.querySelector("#confirm-multiple-button");
	const submitMultipleButton = document.querySelector("#submit-multiple-button");
	const fallbackAvatar = "/assets/avatar-fallback.svg";

	const codehash = readCodehash();
	const cookieName = `quiz_reconnect_${codehash}`;
	const reconnectDelays = [1_000, 2_000, 4_000, 8_000, 15_000];
	let socket = null;
	let reconnectTimer = null;
	let reconnectAttempt = 0;
	let joined = false;
	let terminal = false;
	let awaitingFreshJoin = false;
	let pendingName = null;
	let currentParticipant = null;
	let currentSession = null;
	let reconnectToken = readReconnectCookie();
	let serverAtPerformanceZero = Date.now() - performance.now();
	let joinSentAtPerformanceMs = performance.now();
	let answeredQuestions = new Map();
	let pendingSelections = new Map();
	let selectedAnswerIds = new Set();
	let renderedQuestionId = null;
	let countdownFrame = null;

	if (!codehash) {
		showTerminal("This quiz link is invalid.", false);
	} else {
		connect();
	}

	joinForm.addEventListener("submit", event => {
		event.preventDefault();
		const name = nameInput.value.normalize("NFKC").trim();
		if (!name || [...name].length > 32 || /[<>&\u0000-\u001f\u007f]/u.test(name)) {
			showMessage("Enter a valid name of at most 32 characters.");
			return;
		}
		pendingName = name;
		awaitingFreshJoin = false;
		reconnectToken = null;
		clearReconnectCookie();
		joinButton.disabled = true;
		nameInput.disabled = true;
		hideMessage();
		if (!socket || socket.readyState > WebSocket.OPEN) {
			connect();
		} else if (socket.readyState === WebSocket.OPEN) {
			sendJoin();
		}
	});

	confirmMultipleButton.addEventListener("click", () => {
		if (selectedAnswerIds.size === 0) return;
		const list = document.querySelector("#selected-answer-list");
		list.replaceChildren();
		for (const answerId of selectedAnswerIds) {
			const option = currentSession?.question?.answers?.find(answer => answer.id === answerId);
			if (!option) continue;
			const item = document.createElement("li");
			item.textContent = option.text;
			list.append(item);
		}
		answerDialog.showModal();
	});

	submitMultipleButton.addEventListener("click", event => {
		event.preventDefault();
		answerDialog.close();
		submitAnswer([...selectedAnswerIds]);
	});

	function connect() {
		if (terminal || !codehash || socket?.readyState === WebSocket.OPEN
				|| socket?.readyState === WebSocket.CONNECTING) return;
		clearTimeout(reconnectTimer);
		setConnection(reconnectAttempt === 0 ? "connecting" : "reconnecting",
			reconnectAttempt === 0 ? "Connecting" : "Connection lost - reconnecting");
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const candidate = new WebSocket(`${protocol}//${window.location.host}/${codehash}/data`);
		socket = candidate;

		candidate.addEventListener("open", () => {
			if (socket !== candidate) return;
			reconnectAttempt = 0;
			setConnection("connected", "Connected");
			sendJoin();
		});

		candidate.addEventListener("message", event => {
			if (socket !== candidate) return;
			handleServerMessage(event.data);
		});

		candidate.addEventListener("close", event => {
			if (socket !== candidate) return;
			socket = null;
			joined = false;
			if (terminal) return;
			if (event.code === 4001) {
				showTerminal("This player is connected in another window.", false);
				return;
			}
			if (awaitingFreshJoin) {
				setConnection("reconnecting", "Connection lost - enter your name");
				showView("join-view");
				enableJoinForm();
				return;
			}
			scheduleReconnect();
		});

		candidate.addEventListener("error", () => {
			if (socket === candidate && candidate.readyState === WebSocket.OPEN) candidate.close();
		});
	}

	function sendJoin() {
		if (!socket || socket.readyState !== WebSocket.OPEN || joined) return;
		if (reconnectToken) {
			joinSentAtPerformanceMs = performance.now();
			socket.send(JSON.stringify({ type: "JOIN", reconnectToken }));
		} else if (pendingName) {
			joinSentAtPerformanceMs = performance.now();
			socket.send(JSON.stringify({ type: "JOIN", name: pendingName }));
		} else {
			showView("join-view");
			enableJoinForm();
		}
	}

	function scheduleReconnect() {
		if (terminal || reconnectTimer) return;
		setConnection("reconnecting", "Connection lost - reconnecting");
		const baseDelay = reconnectAttempt < reconnectDelays.length
			? reconnectDelays[reconnectAttempt]
			: Math.min(30_000, 15_000 + (reconnectAttempt - reconnectDelays.length + 1) * 5_000);
		reconnectAttempt++;
		const jitteredDelay = Math.round(baseDelay * (0.8 + Math.random() * 0.4));
		reconnectTimer = window.setTimeout(() => {
			reconnectTimer = null;
			connect();
		}, jitteredDelay);
	}

	function handleServerMessage(rawMessage) {
		let message;
		try {
			message = JSON.parse(rawMessage);
		} catch {
			showMessage("The server sent an unreadable message.");
			return;
		}
		switch (message.type) {
			case "JOINED": handleJoined(message.payload); break;
			case "STATE": handleState(message.payload); break;
			case "ANSWER_ACCEPTED": handleAnswerAccepted(message.payload); break;
			case "ERROR": handleError(message.payload); break;
			default: break;
		}
	}

	function handleJoined(payload) {
		if (!payload?.participant || !payload?.session || !payload?.reconnectToken) return;
		joined = true;
		pendingName = null;
		currentParticipant = payload.participant;
		reconnectToken = String(payload.reconnectToken);
		const receivedAtPerformanceMs = performance.now();
		serverAtPerformanceZero = Number(payload.serverEpochMs)
			- ((joinSentAtPerformanceMs + receivedAtPerformanceMs) / 2);
		answeredQuestions = new Map();
		pendingSelections.clear();
		for (const answer of payload.answeredQuestions || []) {
			answeredQuestions.set(answer.questionId, new Set(answer.answerIds || []));
		}
		writeReconnectCookie(reconnectToken);
		enableJoinForm();
		hideMessage();
		handleState(payload.session);
	}

	function handleState(session) {
		if (!session || session.codehash !== codehash) return;
		currentSession = session;
		const me = session.participants?.find(participant => participant.playerId === currentParticipant?.playerId);
		if (me) currentParticipant = { ...currentParticipant, ...me };
		renderState();
	}

	function handleAnswerAccepted(payload) {
		const pending = pendingSelections.get(payload?.questionId);
		if (pending) answeredQuestions.set(payload.questionId, new Set(pending));
		pendingSelections.delete(payload?.questionId);
		renderState();
	}

	function handleError(error) {
		if (!error) return;
		const code = String(error.code || "ERROR");
		if (code === "PLAYER_KICKED") {
			showTerminal(error.message || "You were removed from this quiz.", true);
			return;
		}
		if (["RECONNECT_TOKEN_INVALID", "RECONNECT_EXPIRED"].includes(code)) {
			reconnectToken = null;
			currentParticipant = null;
			answeredQuestions.clear();
			clearReconnectCookie();
			awaitingFreshJoin = true;
			showMessage(error.message || "Your saved session expired. Enter your name again.");
			showView("join-view");
			enableJoinForm();
			return;
		}
		if (["SESSION_CLOSED", "JOIN_CLOSED"].includes(code)) {
			showTerminal(error.message || "This quiz is no longer accepting players.", false);
			return;
		}
		if (code === "DUPLICATE_ANSWER" && currentSession?.question) {
			const pending = pendingSelections.get(currentSession.question.id) || new Set();
			answeredQuestions.set(currentSession.question.id, new Set(pending));
			pendingSelections.delete(currentSession.question.id);
			renderState();
		}
		if (["INVALID_ANSWER", "QUESTION_MISMATCH"].includes(code) && currentSession?.question) {
			pendingSelections.delete(currentSession.question.id);
			showView("question-view");
			setAnswerControlsDisabled(false);
		}
		if (code === "INVALID_NAME") enableJoinForm();
		showMessage(error.message || "The request could not be completed.");
	}

	function renderState() {
		if (!currentSession || !currentParticipant) return;
		stopCountdown();
		switch (currentSession.state) {
			case "LOBBY": renderLobby(); break;
			case "QUESTION_OPEN": renderQuestionOrWait(); break;
			case "RESULTS": renderResults(); break;
			case "FINAL_RESULTS": renderFinalResults(); break;
			case "CLOSED": showTerminal("Thanks for playing.", false); break;
			default: break;
		}
	}

	function renderLobby() {
		showView("lobby-view");
		setText("#lobby-title", currentSession.quizTitle);
		setText("#lobby-description", currentSession.quizDescription);
		setText("#my-name", currentParticipant.name);
		setAvatar(document.querySelector("#my-avatar"), currentParticipant.avatarUrl);
		const participants = (currentSession.participants || [])
			.filter(participant => participant.connectionStatus !== "EXPIRED");
		const grid = document.querySelector("#participant-grid");
		grid.replaceChildren(...participants.map(createParticipantCard));
		const connected = participants.filter(participant => participant.connectionStatus === "CONNECTED").length;
		setText("#participant-count", `${connected}/${participants.length} connected`);
	}

	function createParticipantCard(participant) {
		const card = document.createElement("article");
		card.className = "participant-card";
		if (participant.connectionStatus !== "CONNECTED") card.classList.add("disconnected");
		const avatar = document.createElement("img");
		avatar.alt = `${participant.name}'s avatar`;
		setAvatar(avatar, participant.avatarUrl);
		const name = document.createElement("strong");
		name.textContent = participant.name;
		card.append(avatar, name);
		return card;
	}

	function renderQuestionOrWait() {
		const question = currentSession.question;
		if (!question) return;
		if (answeredQuestions.has(question.id) || pendingSelections.has(question.id)) {
			showView("wait-view");
			startCountdown(question);
			return;
		}
		showView("question-view");
		if (renderedQuestionId !== question.id) buildAnswerControls(question);
		setText("#question-text", question.text);
		setText("#question-mode", question.multiple ? "Choose all correct answers" : "Choose one answer");
		startCountdown(question);
	}

	function buildAnswerControls(question) {
		renderedQuestionId = question.id;
		selectedAnswerIds = new Set();
		const grid = document.querySelector("#answer-grid");
		grid.replaceChildren();
		for (const option of question.answers || []) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "answer-tile";
			button.textContent = option.text;
			button.dataset.answerId = option.id;
			button.setAttribute("aria-pressed", "false");
			button.addEventListener("click", () => {
				if (question.multiple) {
					if (selectedAnswerIds.has(option.id)) selectedAnswerIds.delete(option.id);
					else selectedAnswerIds.add(option.id);
					button.classList.toggle("selected", selectedAnswerIds.has(option.id));
					button.setAttribute("aria-pressed", String(selectedAnswerIds.has(option.id)));
					confirmMultipleButton.disabled = selectedAnswerIds.size === 0;
				} else {
					submitAnswer([option.id]);
				}
			});
			grid.append(button);
		}
		confirmMultipleButton.hidden = !question.multiple;
		confirmMultipleButton.disabled = true;
	}

	function submitAnswer(answerIds) {
		const question = currentSession?.question;
		if (!question || !joined || !socket || socket.readyState !== WebSocket.OPEN) {
			showMessage("The connection is not ready. Your answer was not sent.");
			return;
		}
		setAnswerControlsDisabled(true);
		pendingSelections.set(question.id, new Set(answerIds));
		socket.send(JSON.stringify({ type: "ANSWER", questionId: question.id, answerIds }));
		showView("wait-view");
		startCountdown(question);
	}

	function renderResults() {
		showView("results-view");
		const question = currentSession.question;
		const results = currentSession.results;
		setText("#results-title", question?.text || "Question results");
		setText("#results-answer-count", `${currentSession.receivedAnswerCount || 0} answers`);
		const ownAnswers = answeredQuestions.get(results?.questionId) || new Set();
		const options = results?.options || [];
		const maximumVotes = Math.max(1, ...options.map(option => Number(option.voteCount) || 0));
		const list = document.querySelector("#results-list");
		list.replaceChildren(...options.map(option => createResultCard(option, ownAnswers, maximumVotes)));
		renderedQuestionId = null;
	}

	function createResultCard(option, ownAnswers, maximumVotes) {
		const card = document.createElement("article");
		card.className = "result-card";
		if (option.correct) card.classList.add("correct");
		if (ownAnswers.has(option.answerId)) card.classList.add("selected");
		const title = document.createElement("div");
		title.className = "result-title";
		const text = document.createElement("span");
		text.textContent = option.text;
		const votes = document.createElement("span");
		votes.textContent = `${option.voteCount} ${option.correct ? "✓" : ""}`.trim();
		title.append(text, votes);
		const bar = document.createElement("div");
		bar.className = "result-bar";
		const fill = document.createElement("span");
		fill.style.width = `${Math.max(0, Math.min(100, (Number(option.voteCount) / maximumVotes) * 100))}%`;
		bar.append(fill);
		card.append(title, bar);
		return card;
	}

	function renderFinalResults() {
		showView("final-view");
		const standings = currentSession.standings || [];
		document.querySelector("#final-wait").hidden = standings.length !== 0;
		const list = document.querySelector("#standings-list");
		list.replaceChildren(...standings.map(createStandingRow));
	}

	function createStandingRow(standing) {
		const row = document.createElement("article");
		row.className = "standing-row";
		if (standing.playerId === currentParticipant.playerId) row.classList.add("me");
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

	function startCountdown(question) {
		stopCountdown();
		const countdown = document.querySelector("#countdown");
		const displayPoints = document.querySelector("#display-points");
		const update = () => {
			const elapsed = syncedNow() - Number(currentSession.serverStartEpochMs);
			const remaining = Math.max(0, Number(currentSession.durationMs) - elapsed);
			const ratio = currentSession.durationMs > 0 ? remaining / currentSession.durationMs : 0;
			countdown.textContent = (remaining / 1_000).toFixed(1);
			displayPoints.textContent = String(Math.max(0, Math.floor(Number(question.maximumPoints) * ratio)));
			countdown.classList.toggle("warning", remaining <= 10_000 && remaining > 5_000);
			countdown.classList.toggle("danger", remaining <= 5_000);
			if (remaining <= 0) {
				setAnswerControlsDisabled(true);
				return;
			}
			countdownFrame = requestAnimationFrame(update);
		};
		update();
	}

	function stopCountdown() {
		if (countdownFrame) cancelAnimationFrame(countdownFrame);
		countdownFrame = null;
	}

	function setAnswerControlsDisabled(disabled) {
		for (const button of document.querySelectorAll(".answer-tile")) button.disabled = disabled;
		confirmMultipleButton.disabled = disabled || selectedAnswerIds.size === 0;
	}

	function syncedNow() {
		return serverAtPerformanceZero + performance.now();
	}

	function showView(viewId) {
		for (const view of views) view.hidden = view.id !== viewId;
	}

	function showTerminal(message, deleteToken) {
		terminal = true;
		clearTimeout(reconnectTimer);
		stopCountdown();
		if (deleteToken) {
			reconnectToken = null;
			clearReconnectCookie();
			setConnection("removed", "Removed");
		} else {
			setConnection("connected", "Connected");
		}
		setText("#closed-title", message);
		showView("closed-view");
		if (socket?.readyState === WebSocket.OPEN) socket.close(1000, "Client finished");
	}

	function setConnection(state, label) {
		connectionStatus.className = `connection-status ${state}`;
		connectionLabel.textContent = label;
	}

	function showMessage(message) {
		clientMessage.textContent = message;
		clientMessage.hidden = false;
	}

	function hideMessage() {
		clientMessage.hidden = true;
		clientMessage.textContent = "";
	}

	function enableJoinForm() {
		joinButton.disabled = false;
		nameInput.disabled = false;
	}

	function setText(selector, value) {
		document.querySelector(selector).textContent = value == null ? "" : String(value);
	}

	function setAvatar(image, candidateUrl) {
		image.onerror = () => {
			image.onerror = null;
			image.src = fallbackAvatar;
		};
		try {
			const url = new URL(candidateUrl);
			image.src = url.protocol === "https:" && url.hostname === "api.dicebear.com"
				? url.href : fallbackAvatar;
		} catch {
			image.src = fallbackAvatar;
		}
	}

	function readCodehash() {
		const segments = window.location.pathname.split("/").filter(Boolean);
		const candidate = segments.at(-1) || "";
		return /^[A-Za-z0-9_-]{8,32}$/.test(candidate) ? candidate : "";
	}

	function writeReconnectCookie(token) {
		const value = encodeURIComponent(JSON.stringify({ roomCode: codehash, reconnectToken: token }));
		const secure = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${cookieName}=${value}; Path=/${codehash}/; Max-Age=86400; SameSite=Lax${secure}`;
	}

	function readReconnectCookie() {
		const prefix = `${cookieName}=`;
		const match = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(prefix));
		if (!match) return null;
		try {
			const stored = JSON.parse(decodeURIComponent(match.substring(prefix.length)));
			return stored.roomCode === codehash && /^[0-9a-f-]{36}$/i.test(stored.reconnectToken)
				? stored.reconnectToken : null;
		} catch {
			return null;
		}
	}

	function clearReconnectCookie() {
		document.cookie = `${cookieName}=; Path=/${codehash}/; Max-Age=0; SameSite=Lax`;
	}
})();

