(() => {
	"use strict";

	const currentUrl = new URL(window.location.href);

	if (currentUrl.searchParams.has("error")) {
		document.querySelector("#login-error").hidden = false;
		currentUrl.searchParams.delete("error");
		history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
	}
	const notices = {
		registered: "Check your email for a verification link, then sign in.",
		verified: "Email verified. You can now sign in.",
		reset: "Password reset. Sign in with your new password.",
		logout: "You have signed out."
	};
	for (const [parameter, message] of Object.entries(notices)) {
		if (currentUrl.searchParams.has(parameter)) {
			const status = document.querySelector("#auth-status");
			status.textContent = message;
			status.hidden = false;
			break;
		}
	}
	const returnTo = currentUrl.searchParams.get("returnTo");
	if (returnTo && /^\/(admin|editor|settings)(\/|\?|$)/.test(returnTo)
			&& !returnTo.includes("\\") && !/[\r\n]/.test(returnTo)) {
		const field = document.createElement("input");
		field.type = "hidden";
		field.name = "returnTo";
		field.value = returnTo;
		document.querySelector(".login-form").append(field);
	}
	fetch("/auth/options", {credentials: "same-origin", cache: "no-store"})
		.then(response => {
			if (!response.ok) throw new Error("Authentication options could not be loaded.");
			return response.json();
		})
		.then(options => {
			document.querySelector("#google-login").hidden = !options.googleEnabled;
		})
		.catch(() => {
			const status = document.querySelector("#auth-status");
			status.textContent = "Additional sign-in options are unavailable. Email sign-in remains available.";
			status.hidden = false;
		});
})();
