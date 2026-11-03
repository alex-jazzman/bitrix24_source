import { Dom } from 'main.core';

const HIGHLIGHT_CLASS = '--date-highlighted';
const HIGHLIGHT_DURATION = 2000;
const GROUP_SELECTOR = '.bx-im-message-list-date-group__container';

/**
 * Highlights the day divider of a date group the same way a message is highlighted: a class for a
 * fixed time, taken off by a timer. The divider carries no message id of its own, so the day is
 * addressed through the first message of that day and the group it sits in.
 */
export class DateGroupHighlight
{
	#group: ?HTMLElement = null;
	#timeoutId: ?number = null;

	showByAnchor(container: HTMLElement, messageId: number): boolean
	{
		const group = container.querySelector(`[data-id="${messageId}"]`)?.closest(GROUP_SELECTOR);
		if (!group)
		{
			return false;
		}

		// a repeated jump moves the highlight instead of stacking a second timer over it
		this.clear();

		Dom.addClass(group, HIGHLIGHT_CLASS);
		this.#group = group;
		this.#timeoutId = setTimeout(() => this.clear(), HIGHLIGHT_DURATION);

		return true;
	}

	clear(): void
	{
		clearTimeout(this.#timeoutId);
		this.#timeoutId = null;

		if (!this.#group)
		{
			return;
		}

		Dom.removeClass(this.#group, HIGHLIGHT_CLASS);
		this.#group = null;
	}
}
