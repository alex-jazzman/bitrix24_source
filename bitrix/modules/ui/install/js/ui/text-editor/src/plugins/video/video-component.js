import { Dom, Tag, Type, Uri } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import type { BaseCache } from 'main.core.cache';
import type { BaseEvent } from 'main.core.events';

import { $getNodeByKey } from 'ui.lexical.core';

import DecoratorComponent from '../../decorator-component';

import type { JsonObject } from 'main.core';
import type { DecoratorComponentOptions } from '../../types/decorator-component-options';
import { $isVideoNode, VideoNode } from './video-node';
import FigureResizer from '../../helpers/figure-resizer';

export default class VideoComponent extends DecoratorComponent
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#figureResizer: FigureResizer = null;
	#trusted: boolean = false;

	constructor(options: DecoratorComponentOptions)
	{
		super(options);

		this.#figureResizer = new FigureResizer({
			editor: this.getEditor(),
			freeTransform: true,
			events: {
				onResize: this.#handleResize.bind(this),
				onResizeEnd: this.#handleResizeEnd.bind(this),
			},
		});

		this.#trusted = Type.isStringFilled(this.getOption('provider'));
		this.#figureResizer.setTarget(this.#getContainer());

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

	#render()
	{
		Dom.append(this.#getContainer(), this.getTarget());
	}

	#getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			const uri = new Uri(this.getOption('src'));
			const isVideoFile = uri.getPath().match(/\.(mp4|webm|mov)$/);

			return Tag.render`
				<div class="ui-text-editor-video-component">
					${this.#trusted || isVideoFile ? this.#getIframeContainer() : this.#getVideoStub()}
					${this.#figureResizer.getContainer()}
				</div>
			`;
		});
	}

	#getVideoStub(): HTMLElement
	{
		return this.#refs.remember('video-stub', () => {
			return Tag.render`
				<div class="ui-text-editor-video-stub"></div>
			`;
		});
	}

	#getIframeContainer(): HTMLElement
	{
		return this.#refs.remember('iframe-container', () => {
			return Tag.render`
				<div class="ui-text-editor-video-iframe-container">
					${this.#getIframe()}
				</div>
			`;
		});
	}

	#getIframe(): HTMLIFrameElement
	{
		return this.#refs.remember('iframe', () => {
			const iframe = Tag.render`
				<iframe
					class="ui-text-editor-video-iframe"
					frameborder="0"
					src="about:blank"
					draggable="false"
				></iframe>
			`;

			iframe.src = this.getOption('src');
			if (!this.#trusted)
			{
				iframe.sandbox = '';
			}

			return iframe;
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
			const node: VideoNode = $getNodeByKey(this.getNodeKey());
			if ($isVideoNode(node))
			{
				const { width, height } = event.getData();
				node.setWidthAndHeight(width, height);
			}
		});
	}

	update(options: JsonObject)
	{
		// const width = Type.isNumber(options.width) ? `${options.width}px` : 'inherit';
		// const height = Type.isNumber(options.height) ? `${options.height}px` : 'inherit';

		const iframeWidth = Type.isNumber(options.width) ? options.width : '100%';
		const iframeHeight = Type.isNumber(options.height) ? options.height : '100%';

		Dom.style(this.#getContainer(), { width: null, height: null });
		Dom.attr(this.#getIframe(), { width: iframeWidth, height: iframeHeight });
	}
}
