import { Event } from 'main.core';
import { type WindowVisibilityPort, type WindowVisibilityConfig } from '../port/window-visibility-port';

export class WindowFocusVisibilityAdapter implements WindowVisibilityPort
{
	readonly #onHide;
	readonly #onShow;
	readonly #boundHandleOnBlur: () => void;
	readonly #boundHandleOnShowOnce: () => void;
	#isHidden = false;
	#listenerTimer: ReturnType<typeof setTimeout> | undefined;
	constructor(config: WindowVisibilityConfig)
	{
		this.#onHide = config.onHide;
		this.#onShow = config.onShow;

		this.#boundHandleOnBlur = this.#handleOnBlur.bind(this);
		this.#boundHandleOnShowOnce = this.#onShowOnce.bind(this);
	}

	isHidden()
	{
		return this.#isHidden;
	}

	#onShowOnce()
	{
		Event.unbind(window, 'focus', this.#boundHandleOnShowOnce);
		Event.unbind(window, 'click', this.#boundHandleOnShowOnce);
		this.#isHidden = false;
		this.#onShow();
	}

	#handleOnBlur()
	{
		this.#isHidden = true;
		this.#onHide();

		this.#listenerTimer = setTimeout(() => {
			this.#listenerTimer = undefined;
			Event.bind(window, 'focus', this.#boundHandleOnShowOnce);
			Event.bind(window, 'click', this.#boundHandleOnShowOnce);
		}, 0);
	}

	start()
	{
		this.#isHidden = false;
		Event.bind(window, 'blur', this.#boundHandleOnBlur);
	}

	stop()
	{
		Event.unbind(window, 'blur', this.#boundHandleOnBlur);
		Event.unbind(window, 'focus', this.#boundHandleOnShowOnce);
		Event.unbind(window, 'click', this.#boundHandleOnShowOnce);
		clearTimeout(this.#listenerTimer);
		this.#listenerTimer = undefined;
	}
}
