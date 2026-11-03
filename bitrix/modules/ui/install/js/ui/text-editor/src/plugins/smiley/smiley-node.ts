/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */

import { Dom, Type } from 'main.core';
import {
	DecoratorNode,
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type TextNode,
	type DOMExportOutput,
	type LexicalEditor,
	type SerializedLexicalNode,
} from 'ui.lexical.core';

import { type DecoratorOptions } from '../../types/decorator-options';

export type SerializedSmileyNode = SerializedLexicalNode & {
	src: string;
	typing: string;
	width?: number | null;
	height?: number | null;
};

export class SmileyNode extends DecoratorNode<DecoratorOptions>
{
	__src: string;
	__typing: string;
	__width: number | null = null;
	__height: number | null = null;

	constructor(src: string = '', typing: string = '', width?: number | null, height?: number | null, key?: NodeKey)
	{
		super(key);
		this.__src = src;
		this.__typing = typing;

		if (Type.isNumber(width))
		{
			this.__width = width;
		}

		if (Type.isNumber(height))
		{
			this.__height = height;
		}
	}

	$config()
	{
		return this.config('smiley', { extends: DecoratorNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__src = prevNode.__src;
		this.__typing = prevNode.__typing;
		this.__width = prevNode.__width;
		this.__height = prevNode.__height;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedSmileyNode>): this
	{
		const writable = super.updateFromJSON(serializedNode).getWritable();
		writable.__src = serializedNode.src;
		writable.__typing = serializedNode.typing;
		writable.__width = Type.isNumber(serializedNode.width) ? serializedNode.width : null;
		writable.__height = Type.isNumber(serializedNode.height) ? serializedNode.height : null;

		return writable;
	}

	getSrc(): string
	{
		return this.__src;
	}

	getTyping(): string
	{
		return this.__typing;
	}

	getWidth(): null | number
	{
		return this.__width;
	}

	getHeight(): null | number
	{
		return this.__height;
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const img: HTMLImageElement = document.createElement('img');
		img.src = encodeURI(this.__src);
		if (this.getWidth()! > 0 && this.getHeight()! > 0)
		{
			Dom.style(img, {
				width: `${this.getWidth()}px`,
				height: `${this.getHeight()}px`,
			});
		}

		if (Type.isStringFilled(config?.theme?.smiley))
		{
			Dom.addClass(img, config.theme.smiley);
		}

		Dom.attr(img, { draggable: false });

		return img;
	}

	updateDOM(prevNode: TextNode, dom: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	exportDOM(): DOMExportOutput
	{
		const span = document.createElement('span');
		span.textContent = this.getTyping();

		return { element: span };
	}

	exportJSON(): SerializedSmileyNode
	{
		return {
			...super.exportJSON(),
			src: this.getSrc(),
			typing: this.getTyping(),
			width: this.getWidth(),
			height: this.getHeight(),
		};
	}

	decorate(editor: LexicalEditor, config: EditorConfig): DecoratorOptions
	{
		return {} as DecoratorOptions;
	}

	getTextContent(): string
	{
		return this.getTyping();
	}

	isInline(): true
	{
		return true;
	}

	isKeyboardSelectable(): boolean
	{
		return false;
	}

	isIsolated(): boolean
	{
		return false;
	}
}

export function $isSmileyNode(node: LexicalNode | null | undefined): boolean
{
	return node instanceof SmileyNode;
}

export function $createSmileyNode(
	src: string,
	typing: string,
	width?: number | null,
	height?: number | null,
): SmileyNode
{
	const node = new SmileyNode(src, typing, width, height);

	return $applyNodeReplacement(node);
}
