import { Dom, Tag, Type } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import type { BaseEvent } from 'main.core.events';

import { $getNodeByKey } from 'ui.lexical.core';

import DecoratorComponent from '../../decorator-component';
import FigureResizer from '../../helpers/figure-resizer';
import { $isImageNode, ImageNode } from './image-node';

import type { JsonObject } from 'main.core';
import type { DecoratorComponentOptions } from '../../types/decorator-component-options';

export default class ImageComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#figureResizer: FigureResizer = null;
	#maxWidth: number | 'none' = 'none';

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.#figureResizer = new FigureResizer({
			target: this.getImage(),
			editor: this.getEditor(),
			maxWidth: this.getMaxWidth(),
			events: {
				onResizeStart: this.#handleResizeStart.bind(this),
				onResizeEnd: this.#handleResizeEnd.bind(this),
			},
		});

		this.getNodeSelection().onSelect((selected: boolean) => {
			if (selected || this.#figureResizer.isResizing())
			{
				Dom.addClass(this.#getContainer(), '--selected');
				this.#figureResizer.show();
			}
			else
			{
				Dom.removeClass(this.#getContainer(), '--selected');
				this.#figureResizer.hide();
			}

			const draggable = selected && !this.#figureResizer.isResizing();
			this.#setDraggable(draggable);
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
			const figureResizer = this.#figureResizer.getContainer();

			return Tag.render`
				<div class="ui-text-editor-image-component">
					${this.#getImageContainer()}
					${figureResizer}
				</div>
			`;
		});
	}

	#getImageContainer(): HTMLElement
	{
		return this.#refs.remember('image-container', () => {
			return Tag.render`
				<div class="ui-text-editor-image-container">
					${this.getImage()}
				</div>
			`;
		});
	}

	#setDraggable(draggable: boolean): void
	{
		Dom.attr(this.#getImageContainer(), { draggable });
		if (draggable)
		{
			Dom.addClass(this.#getContainer(), '--draggable');
		}
		else
		{
			Dom.removeClass(this.#getContainer(), '--draggable');
		}
	}

	#handleResizeStart(event: BaseEvent): void
	{
		this.#setDraggable(false);
		this.setSelected(true);
	}

	#handleResizeEnd(event: BaseEvent): void
	{
		this.setSelected(true);

		this.getEditor().update(() => {
			const node: ImageNode = $getNodeByKey(this.getNodeKey());
			if ($isImageNode(node))
			{
				const { width, height } = event.getData();
				node.setWidthAndHeight(width, height);
			}
		});
	}

	getImage(): HTMLImageElement
	{
		return this.#refs.remember('image', () => {
			const img: HTMLImageElement = document.createElement('img');
			img.draggable = false;
			img.src = this.getOption('src');

			return img;
		});
	}

	getMaxWidth(): 'none' | number
	{
		return this.#maxWidth;
	}

	update(options: JsonObject)
	{
		const width = Type.isNumber(options.width) ? `${options.width}px` : 'inherit';
		const height = Type.isNumber(options.height) ? `${options.height}px` : 'inherit';
		const maxWidth = Type.isNumber(options.maxWidth) ? `${options.maxWidth}px` : null;

		this.#maxWidth = options.maxWidth;

		Dom.style(this.getImage(), { width, height, maxWidth });
	}
}
