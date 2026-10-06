/**
 * Device-preview postMessage responder (preview/consumer side of PROTO-01).
 *
 * Runs inside the sandboxed device-preview iframe, whose origin is opaque
 * (sandbox="allow-scripts" without allow-same-origin). It must stay framework
 * independent — no main.core — because BX bootstrap is unreliable in that context.
 *
 * The parent origin to validate commands against is per-request and cannot be
 * embedded in this cacheable asset; the template hands it over via the global
 * window.landingDevicePreviewExpectedOrigin. Read it lazily: any command arrives
 * only after the parent receives the ready signal below, so the global is set by then.
 */
(function() {
	"use strict";

	var ACTION_SET_TOUCH = "landing.device-preview:setTouch";
	var ACTION_SCROLL_TO_PERCENT = "landing.device-preview:scrollToPercent";
	var ACTION_READY = "landing.device-preview:ready";

	function setTouch(touch)
	{
		var root = document.documentElement;
		if (!root)
		{
			return;
		}

		if (touch)
		{
			root.classList.add("bx-touch");
			root.classList.remove("bx-no-touch");
		}
		else
		{
			root.classList.add("bx-no-touch");
			root.classList.remove("bx-touch");
		}
	}

	function scrollToPercent(percent)
	{
		var value = Number(percent);
		if (!isFinite(value))
		{
			return;
		}

		value = Math.max(0, Math.min(100, value));

		var doc = document.documentElement;
		var body = document.body;
		var docHeight = Math.max(
			body ? body.scrollHeight : 0, doc ? doc.scrollHeight : 0,
			body ? body.offsetHeight : 0, doc ? doc.offsetHeight : 0,
			body ? body.clientHeight : 0, doc ? doc.clientHeight : 0
		);

		window.scroll(0, docHeight * value / 100);
	}

	window.addEventListener("message", function(event) {
		var expectedOrigin = window.landingDevicePreviewExpectedOrigin || "";
		if (expectedOrigin === "" || event.origin !== expectedOrigin)
		{
			return;
		}

		var data = event.data;
		if (!data || typeof data !== "object")
		{
			return;
		}

		var payload = data.payload || {};
		if (data.action === ACTION_SET_TOUCH)
		{
			setTouch(!!payload.touch);
		}
		else if (data.action === ACTION_SCROLL_TO_PERCENT)
		{
			scrollToPercent(payload.percent);
		}
	});

	try
	{
		window.parent.postMessage({ action: ACTION_READY, payload: {} }, "*");
	}
	catch (e) {}
})();
