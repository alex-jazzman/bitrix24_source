import { Dom, Tag, Type } from 'main.core';

/**
 * @memberOf BX.Crm.Autorun
 */
export class ProgressBarRepository
{
	#container: HTMLElement;

	#gridId: string;

	#storage: Map<string, HTMLElement> = new Map();

	constructor(container: HTMLElement, gridId: string = '')
	{
		if (!Type.isElementNode(container))
		{
			throw new TypeError('expected element node');
		}

		this.#container = container;
		this.#gridId = gridId;
	}

	getOrCreateProgressBarContainer(id: string): HTMLElement
	{
		const fullId = this.#getFullId(id);

		if (this.#storage.has(fullId))
		{
			return this.#storage.get(fullId);
		}

		// grid id comes from the page and may contain characters unsafe for a selector
		let progressBarContainer = this.#container.querySelector(`div#${CSS.escape(fullId)}`);
		if (!progressBarContainer)
		{
			progressBarContainer = Tag.render`<div id="${fullId}"></div>`;
			Dom.append(progressBarContainer, this.#container);
		}

		this.#storage.set(fullId, progressBarContainer);

		return progressBarContainer;
	}

	#getFullId(id: string): string
	{
		const suffix = Type.isStringFilled(this.#gridId) ? `${this.#gridId}-${id}` : id;

		return `crm-autorun-progress-bar-${suffix}`;
	}
}
