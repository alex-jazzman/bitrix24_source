import { Dom, Tag, Type, type JsonObject } from 'main.core';
import { type BaseCache, MemoryCache } from 'main.core.cache';
import { type BaseEvent } from 'main.core.events';
import { $getNodeByKey, type EditorConfig } from 'ui.lexical.core';

import { DecoratorComponent } from '../../../decorator-component';
import { calcImageSize } from '../../../helpers/calc-image-size';
import { FigureResizer } from '../../../helpers/figure-resizer';
import { type DecoratorComponentOptions } from '../../../types/decorator-component-options';
import { $isFileVideoNode, FileVideoNode } from './file-video-node';

export class FileVideoComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#figureResizer: FigureResizer = null as unknown as FigureResizer;

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.#figureResizer = new FigureResizer({
			target: this.#getVideo(),
			editor: this.getEditor(),
			minWidth: 120,
			minHeight: 120,
			events: {
				onResize: this.#handleResize.bind(this),
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

			this.#setDraggable(selected);
		});

		this.update(this.getOptions());
		this.#render();
	}

	destroy(): void
	{
		this.#figureResizer.destroy();

		super.destroy();
	}

	#render()
	{
		Dom.append(this.#getContainer(), this.getTarget());
	}

	#getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div class="ui-text-editor-video-component">
					<div class="ui-text-editor-video-object-container">${this.#getVideo()}</div>
					${this.#figureResizer.getContainer()}
				</div>
			`;
		});
	}

	#getVideo(): HTMLIFrameElement | HTMLVideoElement
	{
		return this.#refs.remember('video', () => {
			const video: HTMLVideoElement = Dom.create({
				tag: 'video',
				attrs: {
					controls: true,
					preload: 'metadata',
					playsinline: true,
					src: this.getOption('src'),
				} as unknown as Record<string, string>,
				events: {
					loadedmetadata: (event: Event) => {
						this.getEditor().update(() => {
							const node: FileVideoNode = $getNodeByKey(this.getNodeKey()) as FileVideoNode;
							if ($isFileVideoNode(node) && node.getWidth() === 0)
							{
								const [width, height] = calcImageSize(
									(event.target as HTMLVideoElement).videoWidth,
									(event.target as HTMLVideoElement).videoHeight,
									600,
									600,
								);

								node.setWidthAndHeight(width, height);
							}
						});
					},
				},
			}) as HTMLVideoElement;

			const config: EditorConfig = this.getOption('config', {}) as unknown as EditorConfig;
			if (config?.theme?.video?.object)
			{
				video.className = config.theme.video.object;
			}

			return video;
		});
	}

	#handleResize(event: BaseEvent): void
	{
		this.update(event.getData());
	}

	#handleResizeEnd(event: BaseEvent): void
	{
		this.setSelected(true);

		this.getEditor().update(() => {
			const node: FileVideoNode = $getNodeByKey(this.getNodeKey()) as FileVideoNode;
			if ($isFileVideoNode(node))
			{
				const { width, height } = event.getData();
				node.setWidthAndHeight(width, height);
			}
		});
	}

	#setDraggable(draggable: boolean): void
	{
		Dom.attr(this.#getContainer(), { draggable });
		if (draggable)
		{
			Dom.addClass(this.#getContainer(), '--draggable');
		}
		else
		{
			Dom.removeClass(this.#getContainer(), '--draggable');
		}
	}

	update(options: JsonObject): void
	{
		const width = Type.isNumber(options.width) && options.width > 0 ? options.width : null;
		const height = Type.isNumber(options.height) && options.height > 0 ? options.height : null;
		const aspectRatio = (width as number) > 0 && (height as number) > 0 ? `${width} / ${height}` : 'auto';

		Dom.adjust(this.#getVideo(), {
			attrs: {
				width,
				height: null,
			} as unknown as Record<string, string>,
			style: {
				width,
				height: 'auto',
				aspectRatio,
			} as unknown as Record<string, string | number>,
		});
	}
}
