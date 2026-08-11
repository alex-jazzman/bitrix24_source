import { Tag, Dom, Event } from 'main.core';
import { type CardOptions } from '../types';
import './collapsible-card.css';

declare const BX: any;

const USER_OPTION_CATEGORY = 'biconnector';
const USER_OPTION_NAME = 'settings_panel_collapsed';

export class CollapsibleCard
{
	#options: CardOptions;
	#container: HTMLElement | null = null;
	#contentWrapper: HTMLElement | null = null;
	#collapsed: boolean;

	constructor(options: CardOptions)
	{
		this.#options = options;
		this.#collapsed = options.collapsed ?? false;
	}

	getLayout(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		const chevronIcon = Tag.render`
			<div class="biconnector-settings-card__chevron-wrapper">
				<div class="ui-icon-set --chevron-top-m biconnector-settings-card__chevron"></div>
			</div>
		`;

		this.#contentWrapper = Tag.render`
			<div class="biconnector-settings-card__content"></div>
		`;

		const header: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__header">
				<div class="ui-icon-set ${this.#options.iconClass} biconnector-settings-card__icon"></div>
				<div class="biconnector-settings-card__title">${this.#options.title}</div>
				${chevronIcon}
			</div>
		`;

		this.#container = Tag.render`
			<div class="biconnector-settings-card" data-card-id="${this.#options.id}">
				${header}
				${this.#contentWrapper}
			</div>
		`;

		Event.bind(header, 'click', this.#toggle.bind(this));

		if (this.#collapsed)
		{
			Dom.addClass(this.#container, '--collapsed');
		}

		return this.#container!;
	}

	getContentContainer(): HTMLElement
	{
		if (!this.#contentWrapper)
		{
			this.getLayout();
		}

		return this.#contentWrapper!;
	}

	isCollapsed(): boolean
	{
		return this.#collapsed;
	}

	#toggle(): void
	{
		this.#collapsed = !this.#collapsed;

		if (this.#collapsed)
		{
			Dom.addClass(this.#container, '--collapsed');
		}
		else
		{
			Dom.removeClass(this.#container, '--collapsed');
		}

		this.#persistState();
	}

	#persistState(): void
	{
		BX.userOptions?.save(
			USER_OPTION_CATEGORY,
			USER_OPTION_NAME,
			this.#options.id,
			this.#collapsed ? 'Y' : 'N',
		);
	}
}
