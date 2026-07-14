import { Tag } from 'main.core';

import { Feature } from './feature';

export class Base extends Feature
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			return Tag.render`
				<div
					data-test-id="bx-socnet-feature-menu-content-base-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-content-feature__wrapper"
				>
					<div class="socnet-feature-menu-content-base-feature-icon__wrapper">
						${this.getIconElement()}
						${this.#getCounterWrapper()}
					</div>
					<div class="socnet-feature-menu-content-base-feature__title">
						${this.getTitle()}
					</div>
				</div>
			`;
		});
	}

	getIconElement(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`
				<i
					class="ui-icon-set ${this.getIconClass()} socnet-feature-menu-content-base-feature__icon"
				/>
			`;
		});
	}

	getCounter(): ?Counter
	{
		return null;
	}

	#getCounterWrapper(): ?HTMLElement
	{
		return this.cache.remember('counterWrapper', () => {
			const counter = this.getCounter();

			return Tag.render`
				<div class="socnet-feature-menu-content-base-feature__counter-wrapper">
					${counter?.render()}
				</div>
			`;
		});
	}
}
