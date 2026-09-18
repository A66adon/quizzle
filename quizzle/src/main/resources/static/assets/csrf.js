(() => {
	"use strict";

	function readCookie(name) {
		const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
		return match ? decodeURIComponent(match[1]) : null;
	}

	window.getCsrfToken = () => readCookie("XSRF-TOKEN");

	// Progressive enhancement for plain HTML form posts (login, register, logout, etc.):
	// attach the CSRF token as a hidden field right before submit.
	document.addEventListener("submit", event => {
		const form = event.target;
		if (!(form instanceof HTMLFormElement)) return;
		if (form.method.toUpperCase() !== "POST") return;

		let field = form.querySelector('input[name="_csrf"]');
		if (!field) {
			field = document.createElement("input");
			field.type = "hidden";
			field.name = "_csrf";
			form.append(field);
		}
		field.value = window.getCsrfToken() || "";
	}, true);
})();
