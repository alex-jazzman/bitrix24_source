/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Uri, type JsonValue } from 'main.core';
import {
	DecoratorNode,
	$applyNodeReplacement,
	type DOMConversionMap,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type LexicalEditor,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedLexicalNode,
} from 'ui.lexical.core';
import { VideoService } from 'ui.video-service';

import { type DecoratorOptions } from '../../types/decorator-options';
import { VideoComponent } from './video-component';

export interface VideoPayload
{
	src: string;
	width?: number;
	height?: number;
	maxWidth?: number;
	key?: NodeKey;
}

export type SerializedVideoNode = SerializedLexicalNode & {
	src: string;
	width?: number;
	height?: number;
};

function resolveVideoProvider(src: string): string | null
{
	const url = /^https?:/.test(src) ? src : `https://${src.replace(/^\/\//, '')}`;
	const uri = new Uri(url);
	// Uri.getHost() is typed nullable, but createByHost expects a string; the URL is always host-bearing here
	const videoService = VideoService.createByHost(uri.getHost() as string);

	return videoService ? videoService.getId() : null;
}

export class VideoNode extends DecoratorNode<DecoratorOptions>
{
	__src: string;
	__width: number = 560;
	__height: number = 315;
	__provider: string | null = null;

	constructor(src: string = '', width?: number, height?: number, key?: NodeKey)
	{
		super(key);
		this.__src = src;

		if (Type.isNumber(width))
		{
			this.__width = Math.round(width);
		}

		if (Type.isNumber(height))
		{
			this.__height = Math.round(height);
		}

		this.__provider = resolveVideoProvider(src);
	}

	static useDecoratorComponent = true;

	$config()
	{
		return this.config('video', { extends: DecoratorNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__src = prevNode.__src;
		this.__width = prevNode.__width;
		this.__height = prevNode.__height;
		this.__provider = prevNode.__provider;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedVideoNode>): this
	{
		const node = super.updateFromJSON(serializedNode).setSrc(serializedNode.src);
		if (Type.isNumber(serializedNode.width))
		{
			node.setWidthAndHeight(serializedNode.width, node.getHeight());
		}

		if (Type.isNumber(serializedNode.height))
		{
			node.setWidthAndHeight(node.getWidth(), serializedNode.height);
		}

		return node;
	}

	exportDOM(): DOMExportOutput
	{
		return { element: null };
	}

	static importDOM(): DOMConversionMap | null
	{
		return null;
	}

	exportJSON(): SerializedVideoNode
	{
		return {
			...super.exportJSON(),
			src: this.getSrc(),
			width: this.getWidth(),
			height: this.getHeight(),
		};
	}

	setSrc(src: string): this
	{
		const writable = this.getWritable();
		writable.__src = src;
		writable.__provider = resolveVideoProvider(src);

		return writable;
	}

	setWidthAndHeight(width: number, height: number): void
	{
		const writable = this.getWritable();
		if (Type.isNumber(width))
		{
			writable.__width = Math.round(width);
		}

		if (Type.isNumber(height))
		{
			writable.__height = Math.round(height);
		}
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const span = document.createElement('span');
		const theme = config.theme;
		const className = theme?.video?.container;
		if (className !== undefined)
		{
			span.className = className;
		}

		return span;
	}

	updateDOM(): false
	{
		return false;
	}

	getSrc(): string
	{
		return this.__src;
	}

	getWidth(): number
	{
		const self = this.getLatest();

		return self.__width;
	}

	getHeight(): number
	{
		const self = this.getLatest();

		return self.__height;
	}

	getProvider(): string | null
	{
		const self = this.getLatest();

		return self.__provider;
	}

	decorate(editor: LexicalEditor, config: EditorConfig): DecoratorOptions
	{
		return {
			componentClass: VideoComponent,
			options: {
				src: this.getSrc(),
				width: this.getWidth(),
				height: this.getHeight(),
				provider: this.getProvider() as JsonValue,
				// EditorConfig is not a JsonValue, but the options carry it as an opaque value
				config: config as unknown as JsonValue,
			},
		};
	}

	isInline(): true
	{
		return true;
	}
}

export function $createVideoNode({ src, width, height, key }: VideoPayload): VideoNode
{
	return $applyNodeReplacement(new VideoNode(src, width, height, key));
}

export function $isVideoNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof VideoNode;
}
