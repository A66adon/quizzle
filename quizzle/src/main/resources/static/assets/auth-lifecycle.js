(() => {
	"use strict";
	const url = new URL(window.location.href);
	const message = document.querySelector("#auth-message");
	const error = document.querySelector("#auth-error");
	if (url.searchParams.has("sent")) {
		message.textContent = "If the account is eligible, an email has been sent. Check your inbox.";
		message.hidden = false;
	}
	if (url.searchParams.has("error")) {
		error.textContent = url.searchParams.get("error") === "Verification email could not be sent. Please try resending."
			? "Your account is pending, but the verification email could not be delivered. Enter your email below to try again."
			: url.pathname === "/reset-password"
			? "The link is invalid or expired, or the passwords do not meet the requirements. Request a new link or try again."
			: "The request could not be completed. Please wait and try again.";
		error.hidden = false;
	}
	const token = document.querySelector("#reset-token");
	if (token) {
		const value = url.searchParams.get("token") || "";
		token.value = value;
		url.searchParams.delete("token");
		history.replaceState(null, "", `${url.pathname}${url.search}`);
		if (!value) {
			error.textContent = "Open the reset link from your email, or request a new link.";
			error.hidden = false;
			document.querySelector('button[type="submit"]').disabled = true;
		}
		const password = document.querySelector("#password");
		const confirmation = document.querySelector("#password-confirmation");
		const validate = () => confirmation.setCustomValidity(
			password.value === confirmation.value ? "" : "Passwords must match.");
		password.addEventListener("input", validate);
		confirmation.addEventListener("input", validate);
		fetch("/auth/options", {credentials: "same-origin", cache: "no-store"})
			.then(response => {
				if (!response.ok) throw new Error("Password requirements could not be loaded.");
				return response.json();
			})
			.then(options => {
				if (Number.isInteger(options.minPasswordLength)) {
					password.minLength = options.minPasswordLength;
					confirmation.minLength = options.minPasswordLength;
				}
			})
			.catch(() => {
				error.textContent = "Password requirements could not be loaded. Reload the email link before continuing.";
				error.hidden = false;
			});
	}
})();
