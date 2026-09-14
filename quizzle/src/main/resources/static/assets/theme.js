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
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
		}
	}

	function switchTheme(theme) {
		const canTransition = !reducedMotion.matches && typeof document.startViewTransition === "function";
		if (!canTransition) {
			apply(theme);
			return;
		}

		document.startViewTransition(() => apply(theme));
	}

	function installScrollbar() {
		const rail = document.createElement("div");
		rail.className = "site-scrollbar";
		rail.setAttribute("aria-hidden", "true");
		rail.innerHTML = '<span class="site-scrollbar-thumb"></span>';
		document.body.append(rail);

		const thumb = rail.firstElementChild;
		let frame = 0;
		let dragging = false;
		let dragStartY = 0;
		let dragStartScroll = 0;

		const update = () => {
			frame = 0;
			const viewport = document.documentElement.clientHeight;
			const content = document.documentElement.scrollHeight;
			const railHeight = rail.clientHeight;
			const scrollRange = Math.max(0, content - viewport);
			const thumbHeight = Math.max(36, railHeight * Math.min(1, viewport / content));
			const travel = Math.max(0, railHeight - thumbHeight);
			const progress = scrollRange ? window.scrollY / scrollRange : 0;

			rail.classList.toggle("site-scrollbar--visible", scrollRange > 2);
			thumb.style.height = `${thumbHeight}px`;
			thumb.style.transform = `translate3d(0, ${travel * progress}px, 0)`;
			rail.style.setProperty("--scroll-travel", `${travel}px`);
			rail.style.setProperty("--scroll-range", `${scrollRange}px`);
		};

		const scheduleUpdate = () => {
			if (!frame) frame = window.requestAnimationFrame(update);
		};

		thumb.addEventListener("pointerdown", (event) => {
			dragging = true;
			dragStartY = event.clientY;
			dragStartScroll = window.scrollY;
			thumb.setPointerCapture(event.pointerId);
			rail.classList.add("site-scrollbar--dragging");
			event.preventDefault();
		});

		thumb.addEventListener("pointermove", (event) => {
			if (!dragging) return;
			const travel = Number.parseFloat(rail.style.getPropertyValue("--scroll-travel"));
			const scrollRange = Number.parseFloat(rail.style.getPropertyValue("--scroll-range"));
			if (travel > 0) window.scrollTo({ top: dragStartScroll + (event.clientY - dragStartY) * scrollRange / travel });
		});

		const stopDragging = (event) => {
			if (!dragging) return;
			dragging = false;
			rail.classList.remove("site-scrollbar--dragging");
			if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId);
		};
		thumb.addEventListener("pointerup", stopDragging);
		thumb.addEventListener("pointercancel", stopDragging);

		rail.addEventListener("pointerdown", (event) => {
			if (event.target === thumb) return;
			const railBounds = rail.getBoundingClientRect();
			const ratio = (event.clientY - railBounds.top) / railBounds.height;
			const scrollRange = document.documentElement.scrollHeight - document.documentElement.clientHeight;
			window.scrollTo({ top: ratio * scrollRange, behavior: reducedMotion.matches ? "auto" : "smooth" });
		});

		window.addEventListener("scroll", scheduleUpdate, { passive: true });
		window.addEventListener("resize", scheduleUpdate, { passive: true });
		if (typeof ResizeObserver === "function") new ResizeObserver(scheduleUpdate).observe(document.body);
		update();
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
			switchTheme(next);
		});
	}

	installScrollbar();
})();
