(() => {
	"use strict";

	const currentUrl = new URL(window.location.href);

	if (currentUrl.searchParams.has("error")) {
		document.querySelector("#login-error").hidden = false;
	}
	if (currentUrl.searchParams.has("registered")) {
		document.querySelector("#login-registered").hidden = false;
	}

	if (currentUrl.searchParams.has("error") || currentUrl.searchParams.has("registered")) {
		currentUrl.searchParams.delete("error");
		currentUrl.searchParams.delete("registered");
		history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
	}
})();
