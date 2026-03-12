import { Dom, Tag, Type } from 'main.core';
import { BaseStub } from 'ui.entity-selector';

export default class CommunicationsStub extends BaseStub
{
	content: HTMLElement = null;

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			const title = Type.isStringFilled(this.getOption('title')) ? this.getOption('title') : '';

			const { stubContainer, stubTitles } = Tag.render`
				<div ref="stubContainer" class="communication-dialog-stub-container">
					<div class="communication-dialog-stub-icon"></div>
					<div ref="stubTitles" class="communication-dialog-stub-titles">
						<div class="communication-dialog-stub-title">${title}</div>
					</div>
				</div>
			`;

			const subtitleElement = this.getSubtitleElement();

			if (subtitleElement)
			{
				Dom.append(subtitleElement, stubTitles);
			}

			return stubContainer;
		});
	}

	getSubtitleElement(): ?HTMLElement
	{
		const subtitle = this.getOption('subtitle');

		return subtitle ? Tag.render`<div class="communication-dialog-stub-subtitle">${subtitle}</div>` : null;
	}

	render(): HTMLElement
	{
		return this.getContainer();
	}
}
