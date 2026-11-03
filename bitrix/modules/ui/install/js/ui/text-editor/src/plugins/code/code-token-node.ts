/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import {
	TextNode,
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalNode,
	type LexicalUpdateJSON,
	type NodeKey,
	type SerializedTextNode,
	type EditorThemeClasses,
	type TextFormatType,
} from 'ui.lexical.core';
import { addClassNamesToElement, removeClassNamesFromElement } from 'ui.lexical.utils';

import { $createCodeNode, type CodeNode } from './code-node';

type SerializedCodeTokenNode = { highlightType: string | null | undefined } & SerializedTextNode;

export class CodeTokenNode extends TextNode
{
	/** @internal */
	__highlightType: string | null | undefined;

	constructor(text: string = '', highlightType?: string | null | undefined, key?: NodeKey)
	{
		super(text, key);
		this.__highlightType = highlightType;
	}

	$config()
	{
		return this.config('code-token', { extends: TextNode });
	}

	/** the text here is written as typed and may not be decorated -- see UnformattedNode */
	isUnformatted(): boolean
	{
		return true;
	}

	/** the toolbar knows this node by the name of its button, not by its own type */
	getToolbarBlockType(): string
	{
		return 'code';
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__highlightType = prevNode.__highlightType;
	}

	getHighlightType(): string | null | undefined
	{
		const self = this.getLatest();

		return self.__highlightType;
	}

	setHighlightType(highlightType: string | null | undefined): this
	{
		const writable = this.getWritable();
		writable.__highlightType = highlightType;

		return writable;
	}

	createDOM(config: EditorConfig): HTMLElement
	{
		const element = super.createDOM(config);
		const className = getHighlightThemeClass(config.theme, this.__highlightType);

		addClassNamesToElement(element, className);

		return element;
	}

	updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean
	{
		const update = super.updateDOM(prevNode, dom, config);
		const prevClassName = getHighlightThemeClass(config.theme, prevNode.__highlightType);
		const nextClassName = getHighlightThemeClass(config.theme, this.__highlightType);
		if (prevClassName !== nextClassName)
		{
			if (prevClassName)
			{
				removeClassNamesFromElement(dom, prevClassName);
			}

			if (nextClassName)
			{
				addClassNamesToElement(dom, nextClassName);
			}
		}

		return update;
	}

	updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedCodeTokenNode>): this
	{
		return super.updateFromJSON(serializedNode).setHighlightType(serializedNode.highlightType);
	}

	exportJSON(): SerializedCodeTokenNode
	{
		return {
			...super.exportJSON(),
			highlightType: this.getHighlightType(),
		};
	}

	// Prevent formatting (bold, underline, etc)
	setFormat(format: TextFormatType | number): this
	{
		return this;
	}

	isParentRequired(): true
	{
		return true;
	}

	createParentElementNode(): CodeNode
	{
		return $createCodeNode();
	}
}

function getHighlightThemeClass(
	theme: EditorThemeClasses,
	highlightType: string | null | undefined,
): string | null | undefined
{
	return highlightType && theme && theme.codeHighlight && theme.codeHighlight[highlightType];
}

export function $createCodeTokenNode(text: string, highlightType?: string | null | undefined): CodeTokenNode
{
	return $applyNodeReplacement(new CodeTokenNode(text, highlightType));
}

export function $isCodeTokenNode(node: LexicalNode | CodeTokenNode | null | undefined): boolean
{
	return node instanceof CodeTokenNode;
}
