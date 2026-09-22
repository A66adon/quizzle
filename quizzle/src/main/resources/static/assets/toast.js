(() => {
	"use strict";

	const VISIBLE_MS = 3_200;
	const FADE_MS = 240;

	let toast = null;
	let hideTimer = null;
	let removeTimer = null;

	// One reused live region keeps repeated messages from stacking up announcements.
	function element() {
		if (toast && toast.isConnected) return toast;
		toast = document.createElement("div");
		toast.className = "toast toast-success";
		toast.setAttribute("role", "status");
		toast.setAttribute("aria-live", "polite");
		document.body.append(toast);
		return toast;
	}

	function showToast(message) {
		const text = String(message || "").trim();
		if (!text) return;
		const node = element();
		window.clearTimeout(hideTimer);
		window.clearTimeout(removeTimer);
		node.textContent = text;
		node.hidden = false;
		node.classList.remove("is-leaving");
		window.requestAnimationFrame(() => node.classList.add("is-visible"));
		hideTimer = window.setTimeout(() => {
			node.classList.add("is-leaving");
			node.classList.remove("is-visible");
			removeTimer = window.setTimeout(() => {
				node.hidden = true;
				node.classList.remove("is-leaving");
			}, FADE_MS);
		}, VISIBLE_MS);
	}

	window.showToast = showToast;
})();
