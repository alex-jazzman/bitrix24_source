type EventInit = { [key: string]: any };

function applyProps(event: Event, props: EventInit): void
{
	for (const key of Object.keys(props))
	{
		Object.defineProperty(event, key, { value: props[key], configurable: true });
	}
}

/**
 * Minimal replacement for the `fireEvent` helpers from `@testing-library/dom`,
 * covering only the cases used by the uploader tests (change/drop/paste).
 */
export const fireEvent = {
	change(element: HTMLInputElement, init: { target?: { files?: File[] } } = {}): boolean
	{
		if (init.target && init.target.files)
		{
			Object.defineProperty(element, 'files', { value: init.target.files, configurable: true });
		}

		return element.dispatchEvent(new Event('change', { bubbles: true }));
	},

	drop(element: EventTarget, init: { dataTransfer?: any } = {}): boolean
	{
		const event = new Event('drop', { bubbles: true, cancelable: true });
		applyProps(event, { dataTransfer: init.dataTransfer });

		return element.dispatchEvent(event);
	},

	paste(element: EventTarget, init: EventInit = {}): boolean
	{
		const event = new Event('paste', { bubbles: true, cancelable: true });
		applyProps(event, init);

		return element.dispatchEvent(event);
	},
};
