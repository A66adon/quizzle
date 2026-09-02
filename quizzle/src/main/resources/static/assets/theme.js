/*
 * Theme controller shared by every page.
 *
 * - The active theme is stored per role (presenter vs participant) so the two interfaces are
 *   independent. The role comes from <html data-theme-scope="...">.
 * - Default follows the OS preference; a manual choice is persisted on this device and wins.
 * - The initial theme is applied by a tiny inline snippet in <head> to avoid a flash; this module
 *   only wires up the toggle button and keeps following the system when there is no manual override.
 */
(() => {
	"use strict";

	const root = document.documentElement;
	const scope = root.dataset.themeScope || "app";
	const storageKey = `quizzle-theme-${scope}`;
	const media = window.matchMedia("(prefers-color-scheme: dark)");

	const storedChoice = () => {
		const value = window.localStorage.getItem(storageKey);
		return value === "dark" || value === "light" ? value : null;
	};
	const systemTheme = () => (media.matches ? "dark" : "light");
	const resolvedTheme = () => storedChoice() ?? systemTheme();

	function apply(theme) {
		root.dataset.theme = theme;
		for (const button of document.querySelectorAll("[data-theme-toggle]")) {
			const dark = theme === "dark";
			button.setAttribute("aria-pressed", String(dark));
			button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
			const icon = button.querySelector(".theme-toggle-icon");
			if (icon) icon.textContent = dark ? "☀️" : "🌙";
		}
	}

	// Keep the inline-applied attribute and the button state in sync on load.
	apply(resolvedTheme());

	media.addEventListener("change", () => {
		if (!storedChoice()) apply(systemTheme());
	});

	for (const button of document.querySelectorAll("[data-theme-toggle]")) {
		button.addEventListener("click", () => {
			const next = root.dataset.theme === "dark" ? "light" : "dark";
			window.localStorage.setItem(storageKey, next);
			apply(next);
		});
	}
})();

