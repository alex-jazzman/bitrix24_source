import type { JsonObject } from 'main.core';
import { Dom, Tag } from 'main.core';
import { type BaseCache, MemoryCache } from 'main.core.cache';

import DecoratorComponent from '../../../decorator-component';
import type { DecoratorComponentOptions } from '../../../types/decorator-component-options';

export class FileVideoComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.getNodeSelection().onSelect((selected: boolean) => {
			if (selected)
			{
				Dom.addClass(this.#getContainer(), '--selected');
			}
			else
			{
				Dom.removeClass(this.#getContainer(), '--selected');
			}

			this.#setDraggable(selected);
		});

		this.update(this.getOptions());
		this.#render();
	}

	#render()
	{
		Dom.append(this.#getContainer(), this.getTarget());
	}

	#getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div class="ui-text-editor-file-video-component">
					${this.#getVideoContainer()}
				</div>
			`;
		});
	}

	#getVideoContainer(): HTMLElement
	{
		return this.#refs.remember('video-container', () => {
			return Tag.render`
				<div class="ui-text-editor-file-video-container"></div>
			`;
		});
	}

	#setDraggable(draggable: boolean): void
	{
		Dom.attr(this.#getVideoContainer(), { draggable });
		if (draggable)
		{
			Dom.addClass(this.#getContainer(), '--draggable');
		}
		else
		{
			Dom.removeClass(this.#getContainer(), '--draggable');
		}
	}

	update(options: JsonObject)
	{
		// void
	}
}
