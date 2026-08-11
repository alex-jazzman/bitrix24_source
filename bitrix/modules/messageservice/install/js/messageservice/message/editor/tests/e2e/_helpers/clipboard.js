/**
 * Dispatch a synthetic ClipboardEvent('paste') on the Lexical editable element.
 * Matches the pattern used by ui.text-editor e2e tests.
 *
 * When the paste event is not preventDefault'd (e.g. html-only clipboard
 * in LINE_BREAK mode), Lexical relies on the follow-up `beforeinput`
 * InputEvent with `inputType: 'insertFromPaste'` to read the dataTransfer.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object<string, string>} clipboardData - mime type -> payload
 */
export async function pasteFromClipboard(page, clipboardData)
{
	await page.evaluate(
		async ({ clipboardData: _clipboardData }) => {
			const items = Object.keys(_clipboardData).map((type) => ({ type, kind: 'string' }));

			const eventClipboardData = {
				files: [],
				getData(type)
				{
					return _clipboardData[type];
				},
				types: Object.keys(_clipboardData),
				items,
			};

			const editable = document.querySelector('.ui-text-editor-editable');
			const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
			Object.defineProperty(pasteEvent, 'clipboardData', { value: eventClipboardData });
			editable.dispatchEvent(pasteEvent);

			if (!pasteEvent.defaultPrevented)
			{
				const inputEvent = new InputEvent('beforeinput', { bubbles: true, cancelable: true });
				Object.defineProperty(inputEvent, 'inputType', { value: 'insertFromPaste' });
				Object.defineProperty(inputEvent, 'dataTransfer', { value: eventClipboardData });
				editable.dispatchEvent(inputEvent);
			}
		},
		{ clipboardData },
	);
}
