const DEFAULT_SAFETY_TIMEOUT_MS = 30000;
const BLANK_FRAME_URL = 'about:blank';
const OVERLAY_SELECTOR = '.vibecodeconnector-open-app-loader';
const SPACER_SELECTOR = '.vibecodeconnector-open-app-loader-spacer';
const FRAME_SELECTOR = '.vibecodeconnector-open-app-layout iframe';
const HIDDEN_MODIFIER = '--hidden';
const LOADED_MODIFIER = '--loaded';

export type LoadingScreenElements = {
	overlay: HTMLElement,
	canvas: HTMLElement,
	spacer: HTMLElement | null,
	frame: HTMLIFrameElement | null,
};

export type LoadingScreenOptions = {
	safetyTimeoutMs?: number,
};

export class LoadingScreen
{
	#elements: LoadingScreenElements;
	#safetyTimer: number | null = null;

	static attach(root: ParentNode, canvas: HTMLElement, options: LoadingScreenOptions = {}): LoadingScreen | null
	{
		const overlay = root.querySelector<HTMLElement>(OVERLAY_SELECTOR);
		if (overlay === null)
		{
			return null;
		}

		return new LoadingScreen({
			overlay,
			canvas,
			spacer: root.querySelector<HTMLElement>(SPACER_SELECTOR),
			frame: root.querySelector<HTMLIFrameElement>(FRAME_SELECTOR),
		}, options);
	}

	constructor(elements: LoadingScreenElements, options: LoadingScreenOptions = {})
	{
		this.#elements = elements;

		this.#elements.frame?.addEventListener('load', this.#onFrameLoad);
		this.#safetyTimer = window.setTimeout(
			() => this.hide(),
			options.safetyTimeoutMs ?? DEFAULT_SAFETY_TIMEOUT_MS,
		);
	}

	isHidden(): boolean
	{
		return this.#elements.overlay.classList.contains(HIDDEN_MODIFIER);
	}

	hide(): void
	{
		if (this.#safetyTimer !== null)
		{
			window.clearTimeout(this.#safetyTimer);
			this.#safetyTimer = null;
		}
		this.#elements.frame?.removeEventListener('load', this.#onFrameLoad);

		this.#elements.overlay.classList.add(HIDDEN_MODIFIER);
		this.#elements.canvas.classList.add(LOADED_MODIFIER);
		this.#elements.spacer?.remove();
		this.#elements.spacer = null;
		window.scrollTo(0, 0);
	}

	#onFrameLoad = (): void => {
		if (this.#isBlankFrame())
		{
			return;
		}

		this.hide();
	};

	// the first load of the src-less iframe is about:blank, not the app response yet
	#isBlankFrame(): boolean
	{
		const frame = this.#elements.frame;
		if (frame === null)
		{
			return false;
		}

		try
		{
			return frame.contentDocument !== null && frame.contentWindow?.location.href === BLANK_FRAME_URL;
		}
		catch
		{
			// a cross-origin document can only be the app response
			return false;
		}
	}
}
