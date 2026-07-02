import { Dom, Event, Loc, Tag } from 'main.core';

import './skip-to-content.css';

type SkipItem = {
	selector: string,
	label: string | null | undefined,
};

export class SkipToContent
{
	#root: HTMLDetailsElement | null = null;
	#summary: HTMLElement | null = null;
	#links: HTMLAnchorElement[] = [];

	render(): void
	{
		this.#render();
		this.#bindEvents();
	}

	#render(): void
	{
		const items: SkipItem[] = [
			{ selector: '#page-area', label: Loc.getMessage('BITRIX24_SKIP_NAV_MAIN_CONTENT') },
			{ selector: '#menu-items-block', label: Loc.getMessage('BITRIX24_SKIP_NAV_MAIN_MENU') },
			{ selector: '#air-header-menu .main-buttons', label: Loc.getMessage('BITRIX24_SKIP_NAV_TOP_MENU') },
		];

		const list = Tag.render`<ul class="skip-to-content__list"></ul>`;
		this.#links = items.map((item: SkipItem): HTMLAnchorElement => {
			const link = Tag.render`
				<a class="skip-to-content__link --ui-hoverable" href="#" data-target="${item.selector}">
					${item.label}
				</a>
			`;

			Dom.append(Tag.render`<li>${link}</li>`, list);

			return link;
		});

		this.#summary = Tag.render`<summary class="skip-to-content__button">${Loc.getMessage('BITRIX24_SKIP_NAV_BUTTON')}</summary>`;

		this.#root = Tag.render`
			<details class="skip-to-content --ui-context-content-light">
				${this.#summary}
				<nav aria-label="${Loc.getMessage('BITRIX24_SKIP_NAV_LABEL')}">
					${list}
				</nav>
			</details>
		`;

		Dom.prepend(this.#root, document.body);
	}

	#bindEvents(): void
	{
		if (!this.#root)
		{
			return;
		}

		this.#links.forEach((link: HTMLAnchorElement) => {
			Event.bind(link, 'click', this.#onLinkClick.bind(this));
		});

		Event.bind(this.#root, 'keydown', this.#onKeyDown.bind(this));
	}

	#onLinkClick(event: MouseEvent): void
	{
		event.preventDefault();

		const link = event.currentTarget as HTMLAnchorElement;
		const selector = link.dataset.target;
		const target = selector ? document.querySelector(selector) : null;

		this.#close();

		if (!(target instanceof HTMLElement))
		{
			return;
		}

		this.#focusTarget(target);
	}

	#focusTarget(target: HTMLElement): void
	{
		if (!target.hasAttribute('tabindex'))
		{
			target.setAttribute('tabindex', '-1');
		}

		Dom.attr(target, 'data-focus-by-skip-link', 'true');
		Event.unbind(target, 'blur', SkipToContent.#handleOnBlur);
		Event.bindOnce(target, 'blur', SkipToContent.#handleOnBlur);

		target.focus({ preventScroll: true });
		target.scrollIntoView({ block: 'nearest' });
	}

	static #handleOnBlur(event: FocusEvent): void
	{
		const target = event.currentTarget as HTMLElement;
		Dom.attr(target, 'data-focus-by-skip-link', null);
	}

	#onKeyDown(event: KeyboardEvent): void
	{
		if (!this.#root || !this.#root.open)
		{
			return;
		}

		const links = this.#links;
		if (links.length === 0)
		{
			return;
		}

		const activeIndex = links.indexOf(document.activeElement as HTMLAnchorElement);

		switch (event.key)
		{
			case 'ArrowDown':
				event.preventDefault();
				links[activeIndex < 0 ? 0 : (activeIndex + 1) % links.length].focus();
				break;

			case 'ArrowUp':
				event.preventDefault();
				links[activeIndex <= 0 ? links.length - 1 : activeIndex - 1].focus();
				break;

			case 'Home':
				event.preventDefault();
				links[0].focus();
				break;

			case 'End':
				event.preventDefault();
				links[links.length - 1].focus();
				break;

			case 'Escape':
				event.preventDefault();
				this.#close();
				this.#summary?.focus();
				break;

			default:
				break;
		}
	}

	#close(): void
	{
		if (this.#root)
		{
			Dom.attr(this.#root, 'open', null);
		}
	}
}
