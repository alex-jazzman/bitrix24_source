import { Clipboard as LegacyClipboard } from 'im.lib.clipboard';

// TODO: [call-ts] wait im.lib.clipboard to ts
async function copy(text: string): Promise<void>
{
	if (navigator.clipboard?.writeText)
	{
		await navigator.clipboard.writeText(text);

		return;
	}

	// Fallback for an insecure context or older browsers without the async Clipboard API
	LegacyClipboard.copy(text);
}

// Copies a value that becomes known only after an async step (e.g. a network response).
// Safari (WebKit) drops the transient user activation after the first awaited round-trip,
// so a navigator.clipboard.writeText called afterwards is rejected with NotAllowedError.
// Passing the value as a promise lets the clipboard write start synchronously inside the
// click handler: Safari keeps the activation alive while the ClipboardItem promise resolves.
// MUST be called synchronously from the user gesture, before any awaited work.
function copyFromPromise(textPromise: Promise<string>): Promise<void>
{
	if (typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function')
	{
		const item = new ClipboardItem({
			'text/plain': textPromise.then((text) => new Blob([text], { type: 'text/plain' })),
		});

		return navigator.clipboard.write([item]);
	}

	// Older browsers without the async write() API: await the value and use the regular path.
	return textPromise.then((text) => copy(text));
}

export const Clipboard = {
	copy,
	copyFromPromise,
};
