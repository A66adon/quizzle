(() => {
	"use strict";

	const emailLabel = document.querySelector("#settings-account-email");
	const allowLateJoinInput = document.querySelector("#allow-late-join");
	const autoAdvanceInput = document.querySelector("#auto-advance-delay");
	const settingsError = document.querySelector("#settings-error");
	const settingsSuccess = document.querySelector("#settings-success");
	const saveSettingsButton = document.querySelector("#save-settings");

	const currentPasswordInput = document.querySelector("#current-password");
	const newPasswordInput = document.querySelector("#new-password");
	const passwordError = document.querySelector("#password-error");
	const passwordSuccess = document.querySelector("#password-success");
	const savePasswordButton = document.querySelector("#save-password");

	const deleteError = document.querySelector("#delete-error");
	const deleteAccountButton = document.querySelector("#delete-account");

	loadSettings();

	saveSettingsButton.addEventListener("click", saveSettings);
	savePasswordButton.addEventListener("click", savePassword);
	deleteAccountButton.addEventListener("click", deleteAccount);

	async function loadSettings() {
		try {
			const settings = await requestJson("/admin/api/account/settings");
			emailLabel.textContent = settings.email;
			allowLateJoinInput.checked = Boolean(settings.allowLateJoin);
			autoAdvanceInput.value = Math.round(settings.autoAdvanceDelayMs / 1000);
		} catch (error) {
			showMessage(settingsError, "Could not load your settings.");
		}
	}

	async function saveSettings() {
		hideMessage(settingsError);
		hideMessage(settingsSuccess);
		const seconds = Number(autoAdvanceInput.value);
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > 120) {
			showMessage(settingsError, "Auto-advance delay must be between 0 and 120 seconds.");
			return;
		}
		saveSettingsButton.disabled = true;
		try {
			await requestJson("/admin/api/account/settings", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					allowLateJoin: allowLateJoinInput.checked,
					autoAdvanceDelayMs: Math.round(seconds * 1000)
				})
			});
			showMessage(settingsSuccess, "Settings saved.");
		} catch (error) {
			showMessage(settingsError, "Settings could not be saved.");
		} finally {
			saveSettingsButton.disabled = false;
		}
	}

	async function savePassword() {
		hideMessage(passwordError);
		hideMessage(passwordSuccess);
		if (!newPasswordInput.value || newPasswordInput.value.length < 8) {
			showMessage(passwordError, "The new password must be at least 8 characters.");
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
			showMessage(passwordSuccess, "Password updated.");
		} catch (error) {
			showMessage(passwordError, "The current password is incorrect, or the new password is too short.");
		} finally {
			savePasswordButton.disabled = false;
		}
	}

	async function deleteAccount() {
		hideMessage(deleteError);
		if (!window.confirm("Delete your account, all of your quizzes, and close any running games? This cannot be undone.")) {
			return;
		}
		deleteAccountButton.disabled = true;
		try {
			await requestJson("/admin/api/account", { method: "DELETE" });
			window.location.assign("/login");
		} catch (error) {
			showMessage(deleteError, "The account could not be deleted.");
			deleteAccountButton.disabled = false;
		}
	}

	function showMessage(element, text) {
		element.textContent = text;
		element.hidden = false;
	}

	function hideMessage(element) {
		element.hidden = true;
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
			throw new Error(`Request failed with status ${response.status}`);
		}
		if (response.status === 204) return null;
		return response.json();
	}
})();
