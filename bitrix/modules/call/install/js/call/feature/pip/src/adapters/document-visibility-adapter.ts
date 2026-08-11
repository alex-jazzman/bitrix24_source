import { Event } from 'main.core';
import { type WindowVisibilityPort, type WindowVisibilityConfig } from '../port/window-visibility-port';

const ViewDocumentVisibilityState = {
	hidden: 'hidden',
	visible: 'visible',
} as const;

export class DocumentVisibilityAdapter implements WindowVisibilityPort
{
	readonly #onHide;
	readonly #onShow;
	readonly #boundHandleVisibilityChange: () => void;
	constructor(config: WindowVisibilityConfig)
	{
		this.#onHide = config.onHide;
		this.#onShow = config.onShow;

		this.#boundHandleVisibilityChange = this.#handleVisibilityChange.bind(this);
	}

	isHidden()
	{
		return document.visibilityState === ViewDocumentVisibilityState.hidden;
	}

	#handleVisibilityChange()
	{
		if (document.visibilityState === ViewDocumentVisibilityState.hidden)
		{
			this.#onHide();
		}
		else
		{
			this.#onShow();
		}
	}

	start()
	{
		Event.bind(document, 'visibilitychange', this.#boundHandleVisibilityChange, { capture: true });
	}

	stop()
	{
		Event.unbind(document, 'visibilitychange', this.#boundHandleVisibilityChange, { capture: true });
	}
}
