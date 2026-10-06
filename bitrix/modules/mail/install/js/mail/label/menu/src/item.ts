import { Dom, Event, Tag, Text } from 'main.core';

import { type LabelDto } from 'mail.label.core';

const ACTIVE_CLASS = 'mail-menu-directory-item--active';
const COUNTER_HIDDEN_CLASS = 'ui-sidepanel-menu-link-text-counter-hidden';

export class LabelMenuItem
{
	#id: number;
	#element: HTMLElement;
	#itemElement: HTMLElement;
	#link: HTMLElement;
	#counterElement: HTMLElement;
	#onSelect: (labelId: number) => void;

	constructor(label: LabelDto, onSelect: (labelId: number) => void)
	{
		this.#id = label.id;
		this.#onSelect = onSelect;
		this.#element = this.#render(label);
		this.#itemElement = this.#element.querySelector('.ui-sidepanel-menu-item') as HTMLElement;
		this.#link = this.#element.querySelector('.ui-sidepanel-menu-link') as HTMLElement;
		this.#counterElement = this.#element.querySelector('.ui-sidepanel-menu-link-text-counter') as HTMLElement;

		Event.bind(this.#itemElement, 'click', this.#handleClick);
		Event.bind(this.#itemElement, 'keydown', this.#handleKeydown);

		this.setCount(label.unread);
	}

	getId(): number
	{
		return this.#id;
	}

	getElement(): HTMLElement
	{
		return this.#element;
	}

	setCount(unread: number): void
	{
		this.#counterElement.textContent = String(unread);
		if (unread > 0)
		{
			Dom.removeClass(this.#counterElement, COUNTER_HIDDEN_CLASS);
		}
		else
		{
			Dom.addClass(this.#counterElement, COUNTER_HIDDEN_CLASS);
		}
	}

	setActive(isActive: boolean): void
	{
		if (isActive)
		{
			Dom.addClass(this.#itemElement, ACTIVE_CLASS);
			Dom.attr(this.#link, 'aria-current', 'true');
		}
		else
		{
			Dom.removeClass(this.#itemElement, ACTIVE_CLASS);
			Dom.attr(this.#link, 'aria-current', null);
		}
	}

	#render(label: LabelDto): HTMLElement
	{
		const name = Text.encode(label.name);

		return Tag.render`
			<div class="mail-menu-directory-item-container" title="${name}">
				<li tabindex="0" class="ui-sidepanel-menu-item ui-sidepanel-menu-counter-white">
					<a
						class="ui-sidepanel-menu-link mail-menu-directory-link"
						data-testid="mail_label-menu__item"
						data-label-id="${this.#id}"
					>
						<div class="ui-sidepanel-menu-link-text">
							<span class="ui-icon-set --o-sale-tag mail-menu-directory-item-icon" aria-hidden="true"></span>
							<span class="ui-sidepanel-menu-link-text-item">${name}</span>
						</div>
						<span class="ui-sidepanel-menu-link-text-counter" aria-hidden="true"></span>
					</a>
				</li>
			</div>
		`;
	}

	#handleClick = (): void => {
		this.#onSelect(this.#id);
	};

	#handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			this.#onSelect(this.#id);
		}
	};
}
