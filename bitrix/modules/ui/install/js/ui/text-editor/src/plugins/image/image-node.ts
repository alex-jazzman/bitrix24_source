/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, type JsonValue } from 'main.core';
import {
	DecoratorNode,
	$applyNodeReplacement,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type LexicalEditor,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedLexicalNode,
} from 'ui.lexical.core';

import { TRANSPARENT_GIF_SRC } from '../../constants';
import { validateImageUrl } from '../../helpers/validate-image-url';
import { type DecoratorOptions } from '../../types/decorator-options';
import { ImageComponent } from './image-component';

export interface ImagePayload
{
	src: string;
	alt?: string;
	width?: 'inherit' | number;
	height?: 'inherit' | number;
	maxWidth?: 'none' | number;
	key?: NodeKey;
}

export type SerializedImageNode = SerializedLexicalNode & {
	src: string;
	alt?: string;
	width?: 'inherit' | number;
	height?: 'inherit' | number;
	maxWidth?: 'none' | number;
};

/**
 * A zero size means the size is unknown rather than an image zero pixels wide: an unattached
 * and still unloaded HTMLImageElement reports width and height as 0, and so does a tag written
 * as [img width=0]. It must not overwrite the 'inherit' default — a zero written as a BBCode
 * attribute comes out valueless, [img width height].
 */
function normalizeSize(size: 'inherit' | number | undefined): 'inherit' | number | null
{
	if (Type.isNumber(size))
	{
		const rounded = Math.round(size);

		return rounded > 0 ? rounded : null;
	}

	return size === 'inherit' ? 'inherit' : null;
}

export class ImageNode extends DecoratorNode<DecoratorOptions>
{
	__src: string;
	// an empty alt is meaningful: it marks the image as decorative
	__alt: string = '';
	__width: 'inherit' | number = 'inherit';
	__height: 'inherit' | number = 'inherit';
	__maxWidth: 'none' | number = 'none';

	constructor(
		src: string = '',
		width?: 'inherit' | number,
		height?: 'inherit' | number,
		maxWidth?: 'none' | number,
		alt?: string,
		key?: NodeKey,
	)
	{
		super(key);

		if (validateImageUrl(src))
		{
			this.__src = src;
		}
		else
		{
			this.__src = TRANSPARENT_GIF_SRC;
		}

		if (Type.isString(alt))
		{
			this.__alt = alt.trim();
		}

		const normalizedWidth = normalizeSize(width);
		if (normalizedWidth !== null)
		{
			this.__width = normalizedWidth;
		}

		const normalizedHeight = normalizeSize(height);
		if (normalizedHeight !== null)
		{
			this.__height = normalizedHeight;
		}

		if (Type.isNumber(maxWidth))
		{
			this.__maxWidth = Math.round(maxWidth);
		}
	}

	static useDecoratorComponent = true;

	$config()
	{
		return this.config('image', { extends: DecoratorNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__src = prevNode.__src;
		this.__alt = prevNode.__alt;
		this.__width = prevNode.__width;
		this.__height = prevNode.__height;
		this.__maxWidth = prevNode.__maxWidth;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedImageNode>): this
	{
		const node = super.updateFromJSON(serializedNode).setSrc(serializedNode.src).setAlt(serializedNode.alt ?? '');
		node.setWidthAndHeight(serializedNode.width ?? 'inherit', serializedNode.height ?? 'inherit');
		node.setMaxWidth(serializedNode.maxWidth ?? 'none');

		return node;
	}

	exportDOM(): DOMExportOutput
	{
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		// written even when empty, so that a decorative image stays decorative on the other side
		element.setAttribute('alt', this.__alt);
		element.setAttribute('width', this.__width.toString());
		element.setAttribute('height', this.__height.toString());

		return { element };
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			img: (node: Node) => ({
				conversion: (domNode: HTMLElement): null | DOMConversionOutput => {
					if (domNode instanceof HTMLImageElement && validateImageUrl(domNode.src))
					{
						const { src, alt, width, height } = domNode;
						const imageNode = $createImageNode({ src, alt, width, height });

						return { node: imageNode };
					}

					return null;
				},
				priority: 0,
			}),
		};
	}

	exportJSON(): SerializedImageNode
	{
		return {
			...super.exportJSON(),
			src: this.getSrc(),
			alt: this.getAlt(),
			width: this.getWidth(),
			height: this.getHeight(),
			maxWidth: this.getMaxWidth(),
		};
	}

	setSrc(src: string): this
	{
		const writable = this.getWritable();
		writable.__src = validateImageUrl(src) ? src : TRANSPARENT_GIF_SRC;

		return writable;
	}

	setAlt(alt: string): this
	{
		const writable = this.getWritable();
		writable.__alt = Type.isString(alt) ? alt.trim() : '';

		return writable;
	}

	setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void
	{
		const writable = this.getWritable();
		const normalizedWidth = normalizeSize(width);
		if (normalizedWidth !== null)
		{
			writable.__width = normalizedWidth;
		}

		const normalizedHeight = normalizeSize(height);
		if (normalizedHeight !== null)
		{
			writable.__height = normalizedHeight;
		}
	}

	setMaxWidth(maxWidth: number | 'none'): void
	{
		if (Type.isNumber(maxWidth) || maxWidth === 'none')
		{
			const writable = this.getWritable();
			writable.__maxWidth = Type.isNumber(maxWidth) ? Math.round(maxWidth) : maxWidth;
		}
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const span = document.createElement('span');
		const theme = config.theme;
		// Lexical types theme.image as a class-name string, but the Bitrix theme stores an object here
		const className = (theme?.image as unknown as { container?: string } | undefined)?.container;
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

	getAlt(): string
	{
		const self = this.getLatest();

		return self.__alt;
	}

	getWidth(): 'inherit' | number
	{
		const self = this.getLatest();

		return self.__width;
	}

	getHeight(): 'inherit' | number
	{
		const self = this.getLatest();

		return self.__height;
	}

	getMaxWidth(): 'none' | number
	{
		const self = this.getLatest();

		return self.__maxWidth;
	}

	decorate(editor: LexicalEditor, config: EditorConfig): DecoratorOptions
	{
		return {
			componentClass: ImageComponent,
			options: {
				src: this.getSrc(),
				alt: this.getAlt(),
				width: this.getWidth(),
				height: this.getHeight(),
				maxWidth: this.getMaxWidth(),
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

export function $createImageNode({ src, alt, width, height, maxWidth, key }: ImagePayload): ImageNode
{
	return $applyNodeReplacement(new ImageNode(src, width, height, maxWidth, alt, key));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode
{
	return node instanceof ImageNode;
}
