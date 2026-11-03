import { Event as DomEvent, Type } from 'main.core';

import { type PresentationAdapter } from '../../const/adapter';

type StateListener = (isActive: boolean) => void;

/**
 * The presentation mode of a page over the full-screen mode of the browser. The shell of the page
 * owns it and builds its adapter around the node which goes full-screen.
 *
 * The mode is turned on at once, without waiting for the browser: a refused request, or a browser
 * without the mode at all, still leaves the mode on - only the full screen of the window is missing.
 */
export class FullscreenPresentation implements PresentationAdapter
{
	#container: HTMLElement;
	#isActive: boolean = false;
	/** The full screen was entered on this container and the browser confirmed it. */
	#isNativeActive: boolean = false;
	/** The full screen was asked for by the button of the header and not by anybody else. */
	#isRequestedByButton: boolean = false;
	#listeners: Set<StateListener> = new Set();
	#fullscreenChangeHandler: () => void;
	#keyDownHandler: (event: KeyboardEvent) => void;

	constructor(container: HTMLElement)
	{
		this.#container = container;

		this.#fullscreenChangeHandler = (): void => this.#handleFullscreenChange();
		this.#keyDownHandler = (event: KeyboardEvent): void => this.#handleKeyDown(event);
		DomEvent.bind(document, 'fullscreenchange', this.#fullscreenChangeHandler);
		DomEvent.bind(document, 'keydown', this.#keyDownHandler);
	}

	enter(): void
	{
		// a full screen already given to somebody is not taken away from them
		if (this.#isActive || document.fullscreenElement)
		{
			return;
		}

		this.#isRequestedByButton = true;

		let request: Promise<void> | null = null;
		if (Type.isFunction(this.#container.requestFullscreen))
		{
			try
			{
				request = this.#container.requestFullscreen();
			}
			catch
			{
				request = null;
			}
		}

		this.#setActive(true);

		if (request instanceof Promise)
		{
			// a refusal is the answer of the browser about its own window and says nothing about the mode
			request.catch(() => {});
		}
	}

	exit(): void
	{
		if (!this.#isActive && document.fullscreenElement !== this.#container)
		{
			return;
		}

		this.#isRequestedByButton = false;

		if (document.fullscreenElement === this.#container && Type.isFunction(document.exitFullscreen))
		{
			try
			{
				const request = document.exitFullscreen();
				if (request instanceof Promise)
				{
					request.catch(() => {});
				}
			}
			catch
			{
				// the window stays as it is, and the state follows the browser through the change of the mode
			}

			// the mode is taken off once the browser reports the change and not a moment earlier
			return;
		}

		this.#setActive(false);
	}

	isActive(): boolean
	{
		return this.#isActive;
	}

	subscribeToState(listener: StateListener): () => void
	{
		this.#listeners.add(listener);

		return () => {
			this.#listeners.delete(listener);
		};
	}

	destroy(): void
	{
		DomEvent.unbind(document, 'fullscreenchange', this.#fullscreenChangeHandler);
		DomEvent.unbind(document, 'keydown', this.#keyDownHandler);
		this.#listeners.clear();
	}

	#setActive(isActive: boolean): void
	{
		if (this.#isActive === isActive)
		{
			return;
		}

		this.#isActive = isActive;
		this.#listeners.forEach((listener: StateListener) => listener(isActive));
	}

	#handleFullscreenChange(): void
	{
		if (document.fullscreenElement === this.#container)
		{
			this.#isNativeActive = true;
			this.#setActive(true);

			// the full screen of the container was started by somebody else, so it is given back at once
			if (!this.#isRequestedByButton)
			{
				this.exit();
			}

			return;
		}

		if (this.#isNativeActive)
		{
			this.#isNativeActive = false;
			this.#isRequestedByButton = false;
			this.#setActive(false);
		}
	}

	/**
	 * The cancel key is answered here: a mode which never became a full screen of the window gets no
	 * event from the browser, and nothing else would ever take it off.
	 */
	#handleKeyDown(event: KeyboardEvent): void
	{
		if (event.key === 'Escape' && this.#isActive)
		{
			this.exit();
		}
	}
}
