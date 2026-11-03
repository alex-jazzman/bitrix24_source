/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import {
	$createParagraphNode,
	$isTextNode,
	$hasUpdateTag,
	$isRootNode,
	ParagraphNode,
	type RangeSelection,
	type NodeKey,
	type SerializedParagraphNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMConversion,
} from 'ui.lexical.core';

import { NewLineMode } from '../../constants';
import { type NewLineModeType } from '../../types/new-line-mode-type';

export type SerializedCustomParagraphNode = SerializedParagraphNode & {
	mode: NewLineModeType;
};

export class CustomParagraphNode extends ParagraphNode
{
	__mode: NewLineModeType = NewLineMode.MIXED;

	constructor(mode: NewLineModeType = NewLineMode.MIXED, key?: NodeKey)
	{
		super(key);
		this.__mode = mode;
	}

	$config()
	{
		return this.config('custom-paragraph', { extends: ParagraphNode });
	}

	afterCloneFrom(prevNode: this): void
	{
		super.afterCloneFrom(prevNode);
		this.__mode = prevNode.__mode;
	}

	insertNewAfter(selection: RangeSelection, restoreSelection: boolean): ParagraphNode
	{
		if (this.__mode === NewLineMode.PARAGRAPH)
		{
			return super.insertNewAfter(selection, restoreSelection);
		}

		if (this.__mode === NewLineMode.MIXED)
		{
			const children = this.getChildren();
			const childrenLength = children.length;

			if (
				childrenLength >= 1
				&& children[childrenLength - 1].getTextContent() === '\n'
				&& selection.isCollapsed()
				&& selection.anchor.key === this.__key
				&& selection.anchor.offset === childrenLength
			)
			{
				children[childrenLength - 1].remove();
				const newElement = $createParagraphNode();
				this.insertAfter(newElement, restoreSelection);

				return newElement;
			}

			if ($hasUpdateTag('paste'))
			{
				return super.insertNewAfter(selection, restoreSelection);
			}
		}

		selection.insertLineBreak();

		// line-break branch returns null at runtime; base ParagraphNode types the return as non-null
		return null as unknown as ParagraphNode;
	}

	exportJSON(): SerializedCustomParagraphNode
	{
		return {
			...super.exportJSON(),
			mode: this.__mode,
		};
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			p: (node: Node): DOMConversion => ({
				conversion: (element: HTMLElement): DOMConversionOutput => {
					return { node: $createParagraphNode() };
				},
				priority: 1,
			}),
			h1: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
			h2: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
			h3: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
			h4: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
			h5: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
			h6: (node: Node): DOMConversion => ({
				conversion: convertHeadingElement,
				priority: 1,
			}),
		};
	}

	collapseAtStart(): boolean
	{
		const children = this.getChildren();
		// If we have an empty (trimmed) first paragraph and try and remove it,
		// delete the paragraph as long as we have another sibling to go to
		if (children.length === 0 || ($isTextNode(children[0]) && children[0].getTextContent().trim() === ''))
		{
			const nextSibling = this.getNextSibling();
			if (nextSibling !== null)
			{
				this.selectNext();
				this.remove();

				return true;
			}

			const prevSibling = this.getPreviousSibling();
			if (prevSibling !== null)
			{
				this.selectPrevious();
				this.remove();

				return true;
			}

			const parentNode = this.getParent();
			if (
				parentNode !== null
				&& !$isRootNode(parentNode)
				&& Object.hasOwn(Object.getPrototypeOf(parentNode), 'collapseAtStart')
			)
			{
				// runtime calls the no-arg form; base ElementNode d.ts requires a selection it ignores
				return (parentNode as ParagraphNode).collapseAtStart();
			}
		}

		return false;
	}

	static importJSON(serializedParagraphNode: SerializedCustomParagraphNode): ParagraphNode
	{
		// routed through $createParagraphNode so that node replacement supplies the mode of the
		// current editor: the mode from JSON is deliberately not restored
		return $createParagraphNode().updateFromJSON(serializedParagraphNode);
	}
}

function convertHeadingElement(element: HTMLElement): DOMConversionOutput
{
	return {
		node: $createParagraphNode(),
		forChild: (lexicalNode) => {
			if ($isTextNode(lexicalNode))
			{
				lexicalNode.toggleFormat('bold');
			}

			return lexicalNode;
		},
	};
}
