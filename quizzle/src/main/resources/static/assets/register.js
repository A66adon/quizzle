(() => {
	"use strict";

	const currentUrl = new URL(window.location.href);
	const errorMessage = currentUrl.searchParams.get("error");
	if (errorMessage) {
		const errorElement = document.querySelector("#register-error");
		errorElement.textContent = errorMessage;
		errorElement.hidden = false;
		currentUrl.searchParams.delete("error");
		history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
	}
	const password = document.querySelector("#password");
	const confirmation = document.querySelector("#password-confirmation");
	const validateConfirmation = () => {
		confirmation.setCustomValidity(password.value === confirmation.value ? "" : "Passwords must match.");
	};
	password.addEventListener("input", validateConfirmation);
	confirmation.addEventListener("input", validateConfirmation);
	fetch("/auth/options", {credentials: "same-origin", cache: "no-store"})
		.then(response => {
			if (!response.ok) throw new Error("Authentication options could not be loaded.");
			return response.json();
		})
		.then(options => {
			document.querySelector("#google-login").hidden = !options.googleEnabled;
			if (Number.isInteger(options.minPasswordLength)) {
				password.minLength = options.minPasswordLength;
				confirmation.minLength = options.minPasswordLength;
			}
			if (options.allowedEmailDomain) {
				document.querySelector("#register-hint").textContent =
					`Use your @${options.allowedEmailDomain} email. We will send a verification link.`;
			}
		})
		.catch(() => {
			const error = document.querySelector("#register-error");
			error.textContent = "Account requirements could not be loaded. Try registering or reload the page.";
			error.hidden = false;
		});
})();
