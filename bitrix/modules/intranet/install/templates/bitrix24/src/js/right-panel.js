import { Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';

export class RightPanel extends EventEmitter
{
	static #EXPANDED_CLASS = '--right-panel-expanded';

	#isExpanded: boolean = false;

	constructor()
	{
		super();
		this.setEventNamespace('BX.Intranet.Bitrix24.RightPanel');
	}

	getContainer(): ?HTMLElement
	{
		return document.getElementById('app__right-panel');
	}

	#getRootElement(): ?HTMLElement
	{
		return document.querySelector('.root');
	}

	#getAvatarWrapper(): ?HTMLElement
	{
		return document.querySelector('[data-id="bx-avatar-widget"]');
	}

	expand(): void
	{
		if (this.#isExpanded)
		{
			return;
		}

		const root = this.#getRootElement();
		if (!root)
		{
			return;
		}

		Dom.addClass(root, RightPanel.#EXPANDED_CLASS);
		this.#isExpanded = true;

		const avatarWrapper = this.#getAvatarWrapper();
		if (avatarWrapper)
		{
			Dom.addClass(avatarWrapper, '--collapsed');
		}

		const container = this.getContainer();
		if (container)
		{
			Event.bindOnce(container, 'transitionend', () => {
				this.emit('onExpand');
			});
		}
	}

	collapse(): void
	{
		if (!this.#isExpanded)
		{
			return;
		}

		const root = this.#getRootElement();
		if (!root)
		{
			return;
		}

		Dom.removeClass(root, RightPanel.#EXPANDED_CLASS);
		this.#isExpanded = false;

		const avatarWrapper = this.#getAvatarWrapper();
		if (avatarWrapper && window.scrollY <= 20)
		{
			Dom.removeClass(avatarWrapper, '--collapsed');
		}

		const container = this.getContainer();
		if (container)
		{
			Event.bindOnce(container, 'transitionend', () => {
				this.emit('onCollapse');
			});
		}
	}

	isExpanded(): boolean
	{
		return this.#isExpanded;
	}
}
