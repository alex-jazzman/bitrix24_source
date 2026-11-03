import { Tag } from 'main.core';
import { type Counter } from 'ui.cnt';

import { BaseTool } from './base-tool';

export class BaseMainTool extends BaseTool
{
	getLayout(): HTMLElement
	{
		return this.cache.remember('layout', () => {
			const titleId = `intranet-avatar-widget-main-tool-${this.getId()}-title`;

			return Tag.render`
				<div
					data-testid="bx-avatar-widget-main-tool-${this.getId()}"
					class="intranet-avatar-widget-main-tool__wrapper"
					onclick="${this.#onWrapperClick.bind(this)}"
				>
					${this.getButton()}
					<div id="${titleId}" class="intranet-avatar-widget-main-tool__title">
						${this.getTitle()}
					</div>
				</div>
			`;
		});
	}

	#onWrapperClick(event: MouseEvent): void
	{
		const button = this.getButton();
		if (button.contains(event.target))
		{
			return;
		}

		button.click();
	}

	getButton(): HTMLElement
	{
		return this.cache.remember('button', () => {
			const titleId = `intranet-avatar-widget-main-tool-${this.getId()}-title`;
			const counterId = `intranet-avatar-widget-main-tool-${this.getId()}-counter`;

			return Tag.render`
				<button type="button" aria-labelledby="${titleId} ${counterId}" onclick="${this.onClick.bind(this)}" class="intranet-avatar-widget-main-tool-icon__wrapper">
					${this.getIconElement()}
					${this.#getCounterWrapper(counterId)}
				</button>
			`;
		});
	}

	getIconElement(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`<i aria-hidden="true" class="ui-icon-set ${this.getIconClass()} intranet-avatar-widget-main-tool__icon"/>`;
		});
	}

	getCounter(): ?Counter
	{
		return null;
	}

	getId(): string
	{
		return '';
	}

	#getCounterWrapper(id: string): ?HTMLElement
	{
		return this.cache.remember('counterWrapper', () => {
			const counter = this.getCounter();

			return Tag.render`
				<div id="${id}" class="intranet-avatar-widget-main-tool__counter-wrapper">
					${counter?.render()}
				</div>
			`;
		});
	}
}
