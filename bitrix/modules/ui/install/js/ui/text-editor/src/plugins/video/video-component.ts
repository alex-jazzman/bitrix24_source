import { Dom, Tag, Type, type JsonObject } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { type BaseEvent } from 'main.core.events';
import { $getNodeByKey, type EditorConfig } from 'ui.lexical.core';

import { DecoratorComponent } from '../../decorator-component';
import { calcImageSize } from '../../helpers/calc-image-size';
import { FigureResizer } from '../../helpers/figure-resizer';
import { type DecoratorComponentOptions } from '../../types/decorator-component-options';
import { $isVideoNode, VideoNode } from './video-node';

export class VideoComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#figureResizer: FigureResizer = null as unknown as FigureResizer;
	#trusted: boolean = false;

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.#trusted = Type.isStringFilled(this.getOption('provider'));

		this.#figureResizer = new FigureResizer({
			target: this.#getVideo(),
			editor: this.getEditor(),
			minWidth: 120,
			minHeight: 120,
			freeTransform: true,
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
			let video: HTMLIFrameElement | HTMLVideoElement = null as unknown as HTMLIFrameElement | HTMLVideoElement;
			const src = this.getOption('src');
			if (this.#trusted)
			{
				video = Tag.render`<iframe frameborder="0" src="about:blank" draggable="false" tabindex="-1"></iframe>`;
				video.src = src as string;
			}
			else
			{
				video = Dom.create({
					tag: 'video',
					attrs: {
						controls: true,
						preload: 'metadata',
						playsinline: true,
						tabIndex: -1,
						src,
					} as unknown as Record<string, string>,
					events: {
						loadedmetadata: (event: Event) => {
							this.getEditor().update(() => {
								const node: VideoNode = $getNodeByKey(this.getNodeKey()) as VideoNode;
								if ($isVideoNode(node) && node.getWidth() === 0)
								{
									const video = event.target as HTMLVideoElement;
									const [width, height] = calcImageSize(video.videoWidth, video.videoHeight, 600, 600);

									node.setWidthAndHeight(width, height);
								}
							});
						},
					},
				}) as HTMLVideoElement;
			}

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
			const node: VideoNode = $getNodeByKey(this.getNodeKey()) as VideoNode;
			if ($isVideoNode(node))
			{
				const { width, height } = event.getData();
				node.setWidthAndHeight(width, height);
			}
		});
	}

	update(options: JsonObject): void
	{
		const width = Type.isNumber(options.width) && options.width > 0 ? options.width : null;
		const height = Type.isNumber(options.height) && options.height > 0 ? options.height : null;
		const aspectRatio = (width as number) > 0 && (height as number) > 0 ? `${width} / ${height}` : 'auto';

		Dom.adjust(this.#getVideo(), {
			attrs: {
				width,
			} as unknown as Record<string, string>,
			style: {
				width,
				height: 'auto',
				aspectRatio,
			} as unknown as Record<string, string | number>,
		});
	}
}
