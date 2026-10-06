// Own message channel for this extension.
//
// The flip-board-sdk under templates/.default/src/flip-board-sdk is a vendored copy: it is
// overwritten wholesale on every vendor update, so this extension must not depend on
// fork-local additions to it (postMessage/isTrustedMessage stay SDK-internal). The trust
// root is the same as the SDK's — the iframe's own contentWindow plus an expected origin —
// but built independently: the origin is pinned by the server (template.php, from APP_URL),
// and the iframe is resolved from the DOM rather than cached from a constructor.
export function createChannel({ containerId, appOrigin })
{
	// The SDK creates the iframe only inside init(), which runs after attach() wires up this
	// extension — so the element cannot be captured once up front. It is re-resolved on every
	// call; the cached reference is reused only while still attached to the document.
	let cachedFrame = null;

	const resolveFrame = () => {
		if (cachedFrame && cachedFrame.isConnected)
		{
			return cachedFrame;
		}
		const container = document.getElementById(containerId);
		cachedFrame = container ? container.querySelector('iframe') : null;

		return cachedFrame;
	};

	return {
		isTrusted(event)
		{
			const frame = resolveFrame();

			return Boolean(frame) && event.origin === appOrigin && event.source === frame.contentWindow;
		},
		post(message)
		{
			const frame = resolveFrame();
			if (!frame || !frame.contentWindow)
			{
				return; // no iframe yet — nothing to send to, and nothing to queue (spec 4.3)
			}
			frame.contentWindow.postMessage(message, appOrigin); // never '*'
		},
	};
}
