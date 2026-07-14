import { Tag } from 'main.core';
import { type Counter } from 'ui.cnt';

import { Feature } from './feature';

export class Row extends Feature
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div
					data-testid="bx-socnet-feature-menu-content-row-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-row-feature__wrapper"
				>
					${this.getIconElement()}
					<div class="socnet-feature-menu-content-row-item__info-wrapper">
						<span class="socnet-feature-menu-content-row-item__title">
							${this.getTitle()}
						</span>
					</div>
					${this.#getCounterWrapper()}
					${this.getActionElement()}
				</div>
			`;
		});
	}

	getIconElement(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`<i class="ui-icon-set ${this.getIconClass()} socnet-feature-menu-row-feature__icon"/>`;
		});
	}

	getActionElement(): HTMLElement
	{
		return this.cache.remember('actionElement', () => {
			return Tag.render`<i class="ui-icon-set --chevron-right-m socnet-feature-menu-content-row-item__chevron"/>`;
		});
	}

	getCounter(): ?Counter
	{
		return null;
	}

	#getCounterWrapper(): HTMLElement
	{
		return this.cache.remember('counterWrapper', () => {
			const counter = this.getCounter();

			return Tag.render`
				<div class="socnet-feature-menu-content-row-item__counter">
					${counter?.render()}
				</div>
			`;
		});
	}
}
