(() => {
	"use strict";

	const currentUrl = new URL(window.location.href);
	if (!currentUrl.searchParams.has("error")) {
		return;
	}

	document.querySelector("#login-error").hidden = false;
	currentUrl.searchParams.delete("error");
	history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
})();
