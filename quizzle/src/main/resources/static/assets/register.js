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
})();
