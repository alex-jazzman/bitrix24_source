import { Dom, Tag, Type, type JsonObject, type JsonValue } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { type BaseEvent } from 'main.core.events';
import { $getNodeByKey, type EditorConfig } from 'ui.lexical.core';

import { TRANSPARENT_GIF_SRC } from '../../constants';
import { DecoratorComponent } from '../../decorator-component';
import { FigureResizer } from '../../helpers/figure-resizer';
import { type DecoratorComponentOptions } from '../../types/decorator-component-options';
import { $isImageNode } from './image-node';

function normalizeMaxWidth(maxWidth: JsonValue | null | undefined): 'none' | number
{
	return Type.isNumber(maxWidth) ? maxWidth : 'none';
}

export class ImageComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#figureResizer: FigureResizer | null = null;
	#maxWidth: number | 'none' = 'none';

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.#maxWidth = normalizeMaxWidth(this.getOption('maxWidth'));

		this.#figureResizer = new FigureResizer({
			target: this.getImage(),
			editor: this.getEditor(),
			originalWidth: this.getOption('width') as number,
			originalHeight: this.getOption('height') as number,
			maxWidth: this.#maxWidth,
			events: {
				onResizeStart: this.#handleResizeStart.bind(this),
				onResizeEnd: this.#handleResizeEnd.bind(this),
			},
		});

		this.getNodeSelection().onSelect((selected: boolean) => {
			if (selected || this.#figureResizer!.isResizing())
			{
				Dom.addClass(this.#getContainer(), '--selected');
				this.#figureResizer!.show();
			}
			else
			{
				Dom.removeClass(this.#getContainer(), '--selected');
				this.#figureResizer!.hide();
			}

			const draggable = selected && !this.#figureResizer!.isResizing();
			this.#setDraggable(draggable);
		});

		this.update(this.getOptions());
		this.#render();
	}

	destroy(): void
	{
		this.#figureResizer!.destroy();

		super.destroy();
	}

	#render()
	{
		Dom.append(this.#getContainer(), this.getTarget());
	}

	#getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			const figureResizer = this.#figureResizer!.getContainer();

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
			const node = $getNodeByKey(this.getNodeKey());
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
			img.src = this.getOption('src') as string;

			const config: EditorConfig = this.getOption('config', {}) as unknown as EditorConfig;
			// Lexical types theme.image as a class-name string, but the Bitrix theme stores an object here
			if ((config?.theme?.image as unknown as { img?: string } | undefined)?.img)
			{
				img.className = (config.theme.image as unknown as { img: string }).img;
			}

			img.onerror = (event) => {
				img.src = TRANSPARENT_GIF_SRC;
				Dom.addClass(this.getTarget(), '--error ui-icon-set__scope');
			};

			return img;
		});
	}

	getMaxWidth(): 'none' | number
	{
		return this.#maxWidth;
	}

	update(options: JsonObject)
	{
		const width = (options.width as number) > 0 ? `${options.width}px` : 'inherit';
		const hasSize = (options.width as number) > 0 && (options.height as number) > 0;
		const aspectRatio = hasSize ? `${options.width} / ${options.height}` : 'auto';

		this.#maxWidth = normalizeMaxWidth(options.maxWidth);
		this.#figureResizer!.setMaxWidth(this.#maxWidth);

		// an empty alt is what marks the image as decorative, so it is always written out
		this.getImage().alt = (options.alt as string) ?? '';

		Dom.style(this.getImage(), { width, height: 'auto', aspectRatio });
	}
}
