import { Dom } from 'main.core';

export class HeaderMartaButton
{
	#observer = null;

	constructor()
	{
		this.slot = null;
	}

	init()
	{
		this.slot = document.getElementById('air-header-marta-slot');
		if (!this.slot)
		{
			return;
		}

		this.createClone();
	}

	createClone()
	{
		const button = document.querySelector('.aiassistant-marta:not([data-role="header-marta-clone"])');
		const currentClone = this.slot.querySelector('.aiassistant-marta[data-role="header-marta-clone"]');

		if (currentClone)
		{
			Dom.remove(currentClone);
		}

		if (!button)
		{
			Dom.removeClass(this.slot, '--ready');
			this.waitForButton();

			return;
		}

		const clone = button.cloneNode(true);
		Dom.style(clone, 'z-index', null);

		Dom.adjust(clone, {
			attrs: {
				'data-role': 'header-marta-clone',
				'aria-label': 'Marta AI',
			},
			events: {
				click: (event) => {
					event.preventDefault();
					event.stopPropagation();
					button.click();
				},
				mouseenter: () => {
					button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
				},
			},
		});

		Dom.append(clone, this.slot);
		Dom.addClass(this.slot, '--ready');
	}

	waitForButton()
	{
		if (this.#observer)
		{
			return;
		}

		const root = document.querySelector('.js-app');
		if (!root)
		{
			return;
		}

		this.#observer = new MutationObserver((mutations) => {
			const appeared = mutations.some((mutation) => {
				return [...mutation.addedNodes].some((node) => {
					return node.nodeType === Node.ELEMENT_NODE
						&& node.matches('.aiassistant-marta:not([data-role="header-marta-clone"])');
				});
			});

			if (!appeared)
			{
				return;
			}

			this.#observer.disconnect();
			this.#observer = null;
			this.createClone();
		});

		this.#observer.observe(root, { childList: true });
	}
}
