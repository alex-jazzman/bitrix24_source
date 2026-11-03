import { BaseTool } from './base-tool';
import { Dom, Event, Tag } from 'main.core';
import { Counter } from 'ui.cnt';

export class BaseSecondaryTool extends BaseTool
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const actionElement = this.getActionElement();

			if (this.hasInteractiveAction())
			{
				return Tag.render`
					<div data-testid="bx-avatar-widget-tool-${this.getId()}" class="intranet-avatar-widget-secondary-tool__wrapper">
						${this.getIconElement()}
						<div class="intranet-avatar-widget-item__info-wrapper">
							<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
								${this.getTitle()}
							</span>
						</div>
						${this.#getCounterWrapper()}
						${actionElement}
					</div>
				`;
			}

			if (this.getHref())
			{
				const link = Tag.render`
					<a
						class="intranet-avatar-widget-secondary-tool__wrapper"
						href="${this.getHref()}"
						data-testid="bx-avatar-widget-tool-${this.getId()}"
					>
						${this.getIconElement()}
						<div class="intranet-avatar-widget-item__info-wrapper">
							<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
								${this.getTitle()}
							</span>
						</div>
						${this.#getCounterWrapper()}
						${actionElement}
					</a>
				`;

				if (this.getTarget())
				{
					Dom.attr(link, {
						target: this.getTarget(),
						rel: 'noopener noreferrer',
					});
				}

				if (this.hasLinkClickHandler())
				{
					Event.bind(link, 'click', this.onClick.bind(this));
				}

				return link;
			}

			return Tag.render`
				<button type="button" data-testid="bx-avatar-widget-tool-${this.getId()}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-secondary-tool__wrapper">
					${this.getIconElement()}
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span id="${this.getTitleId()}" class="intranet-avatar-widget-item__title">
							${this.getTitle()}
						</span>
					</div>
					${this.#getCounterWrapper()}
					${actionElement}
				</button>
			`;
		});
	}

	getHref(): string
	{
		return '';
	}

	getTarget(): string
	{
		return '';
	}

	hasLinkClickHandler(): boolean
	{
		return false;
	}

	getIconElement(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`<i aria-hidden="true" class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-secondary-tool__icon"/>`;
		});
	}

	getActionElement(): HTMLElement
	{
		return this.cache.remember('actionElement', () => {
			return Tag.render`<i aria-hidden="true" class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>`;
		});
	}

	hasInteractiveAction(): boolean
	{
		return false;
	}

	getCounter(): ?Counter
	{
		return null;
	}

	getId(): string
	{
		return '';
	}

	getTitleId(): string
	{
		return `intranet-avatar-widget-tool-${this.getId()}-title`;
	}

	#getCounterWrapper(): HTMLElement
	{
		return this.cache.remember('counterWrapper', () => {
			const counter = this.getCounter();

			return Tag.render`
				<div class="intranet-avatar-widget-item__counter">
					${counter?.render()}
				</div>
			`;
		});
	}
}
