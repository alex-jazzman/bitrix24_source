import { EventEmitter } from 'main.core.events';

export type BindPosition = {
	left: number,
	top: number,
};

const EVENT_NAMESPACE = 'BX.Messenger.v2.Textarea.FormatToolbarManager';
const FORMAT_TOOLBAR_DELAY = 0;

export class FormatToolbarManager extends EventEmitter
{
	#timer: ?number = null;

	static events = {
		show: 'show',
		hide: 'hide',
	};

	constructor()
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);
	}

	handleTextSelect(event: MouseEvent, textarea: ?HTMLTextAreaElement)
	{
		this.#clearTimer();

		const clickPosition = {
			left: event.pageX,
			top: event.pageY,
		};

		// we need to wait for selectionStart/selectionEnd update
		requestAnimationFrame(() => {
			if (!this.#hasValidSelection(textarea))
			{
				this.emit(FormatToolbarManager.events.hide);

				return;
			}

			this.#timer = setTimeout(() => {
				if (!this.#hasValidSelection(textarea))
				{
					return;
				}

				this.emit(FormatToolbarManager.events.show, {
					bindPosition: clickPosition,
				});
			}, FORMAT_TOOLBAR_DELAY);
		});
	}

	hide()
	{
		this.#clearTimer();
		this.emit(FormatToolbarManager.events.hide);
	}

	destroy()
	{
		this.#clearTimer();
	}

	#clearTimer()
	{
		if (this.#timer)
		{
			clearTimeout(this.#timer);
			this.#timer = null;
		}
	}

	#hasValidSelection(textarea: ?HTMLTextAreaElement): boolean
	{
		if (!textarea)
		{
			return false;
		}

		return textarea.selectionStart !== textarea.selectionEnd;
	}
}
