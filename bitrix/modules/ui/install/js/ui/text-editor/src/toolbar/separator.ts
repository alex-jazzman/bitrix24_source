import { Tag } from 'main.core';
import { ToolbarItem } from './toolbar-item';

export class Separator extends ToolbarItem
{
	#container: HTMLElement | null = null;

	getContainer(): HTMLElement
	{
		if (this.#container === null)
		{
			this.#container = Tag.render`<span class="ui-text-editor-toolbar-separator"></span>`;
		}

		return this.#container!;
	}

	render(): HTMLElement
	{
		return this.getContainer();
	}
}
