import { Type, Dom } from 'main.core';

import {
	ElementNode,
	$applyNodeReplacement,
	$createParagraphNode,
	$isElementNode,
	$isDecoratorNode,
	type EditorConfig,
	type LexicalNode,
	type LexicalEditor,
	type RangeSelection,
	type DOMConversionMap,
	type DOMConversionOutput,
} from 'ui.lexical.core';

export class QuoteNode extends ElementNode
{
	$config()
	{
		return this.config('quote', { extends: ElementNode });
	}

	/** the caret has no way out of this block with an arrow key -- see EscapableBlockNode */
	isEscapableBlock(): boolean
	{
		return true;
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement
	{
		const element = document.createElement('blockquote');
		element.setAttribute('spellcheck', 'false');

		if (Type.isStringFilled(config?.theme?.quote))
		{
			Dom.addClass(element, config.theme.quote);
		}

		return element;
	}

	updateDOM(prevNode: QuoteNode, anchor: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			blockquote: (node: Node) => ({
				conversion: (element: HTMLElement): DOMConversionOutput => {
					return { node: $createQuoteNode() };
				},
				priority: 0,
			}),
		};
	}

	canIndent(): false
	{
		return false;
	}

	isInline(): false
	{
		return false;
	}

	canReplaceWith(replacement: LexicalNode): boolean
	{
		return false;
	}

	collapseAtStart(selection: RangeSelection): true
	{
		$removeQuote(this);

		return true;
	}

	canBeEmpty(): false
	{
		return false;
	}

	isShadowRoot(): boolean
	{
		return true;
	}
}

export function $createQuoteNode(): QuoteNode
{
	return $applyNodeReplacement(new QuoteNode());
}

export function $isQuoteNode(node: LexicalNode | null | undefined): node is QuoteNode
{
	return node instanceof QuoteNode;
}

export function $removeQuote(quoteNode: QuoteNode | null): boolean
{
	if (!$isQuoteNode(quoteNode))
	{
		return false;
	}

	let lastElement: LexicalNode = quoteNode;
	for (const child of quoteNode.getChildren())
	{
		if ($isElementNode(child) || $isDecoratorNode(child))
		{
			lastElement = lastElement.insertAfter(child);
		}
		else
		{
			lastElement = lastElement.insertAfter($createParagraphNode().append(child));
		}
	}

	quoteNode.remove();

	return true;
}
