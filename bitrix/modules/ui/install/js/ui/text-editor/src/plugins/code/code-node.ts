/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

import { Type, Dom } from 'main.core';

import {
	ElementNode,
	$applyNodeReplacement,
	$createParagraphNode,
	$isTabNode,
	$isTextNode,
	$createLineBreakNode,
	$createTabNode,
	type EditorConfig,
	type LexicalNode,
	type LexicalEditor,
	type RangeSelection,
	type ParagraphNode,
	type TabNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
} from 'ui.lexical.core';

import { type CodeTokenNode, $isCodeTokenNode, $createCodeTokenNode } from './code-token-node';
import { getFirstCodeNodeOfLine } from './code-plugin';

export class CodeNode extends ElementNode
{
	__language = 'lexical-hack';

	$config()
	{
		return this.config('code', { extends: ElementNode });
	}

	/** the text here is written as typed and may not be decorated -- see UnformattedNode */
	isUnformatted(): boolean
	{
		return true;
	}

	/** the caret has no way out of this block with an arrow key -- see EscapableBlockNode */
	isEscapableBlock(): boolean
	{
		return true;
	}

	createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement
	{
		const element: HTMLElement = document.createElement('code');
		element.setAttribute('spellcheck', 'false');

		if (Type.isStringFilled(config?.theme?.code))
		{
			Dom.addClass(element, config.theme.code);
		}

		return element;
	}

	updateDOM(prevNode: CodeNode, anchor: HTMLElement, config: EditorConfig): boolean
	{
		return false;
	}

	exportDOM(editor: LexicalEditor): DOMExportOutput
	{
		const element = document.createElement('pre');
		element.setAttribute('spellcheck', 'false');

		if (Type.isStringFilled(editor._config?.theme?.code))
		{
			Dom.addClass(element, editor._config.theme.code);
		}

		return { element };
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			// Typically <pre> is used for code blocks, and <code> for inline code styles
			// but if it's a multi line <code> we'll create a block. Pass through to
			// inline format handled by TextNode otherwise.
			code: (node: Node) => {
				const isMultiLine = (
					node.textContent !== null
					&& (/\r?\n/.test(node.textContent) || hasChildDOMNodeTag(node, 'BR'))
				);

				return isMultiLine
					? {
						conversion: convertPreElement,
						priority: 1,
					}
					: null;
			},
			div: (node: Node) => ({
				conversion: convertDivElement,
				priority: 1,
			}),
			pre: (node: Node) => ({
				conversion: convertPreElement,
				priority: 0,
			}),
			table: (node: Node) => {
				const table: HTMLTableElement = node as HTMLTableElement;
				// domNode is a <table> since we matched it by nodeName
				if (isGitHubCodeTable(table))
				{
					return {
						conversion: convertTableElement,
						priority: 3,
					};
				}

				return null;
			},
			td: (node: Node) => {
				// element is a <td> since we matched it by nodeName
				const td: HTMLTableCellElement = node as HTMLTableCellElement;
				const table: HTMLTableElement | null = td.closest('table');

				if (isGitHubCodeCell(td))
				{
					return {
						conversion: convertTableCellElement,
						priority: 3,
					};
				}

				if (table && isGitHubCodeTable(table))
				{
					// Return a no-op if it's a table cell in a code table, but not a code line.
					// Otherwise it'll fall back to the T
					return {
						conversion: convertCodeNoop,
						priority: 3,
					};
				}

				return null;
			},
			tr: (node: Node) => {
				// element is a <tr> since we matched it by nodeName
				const tr: HTMLTableCellElement = node as HTMLTableCellElement;
				const table: HTMLTableElement | null = tr.closest('table');
				if (table && isGitHubCodeTable(table))
				{
					return {
						conversion: convertCodeNoop,
						priority: 3,
					};
				}

				return null;
			},
		};
	}

	canIndent(): false
	{
		return false;
	}

	canReplaceWith(replacement: LexicalNode): boolean
	{
		return false;
	}

	isInline(): false
	{
		return false;
	}

	collapseAtStart(selection: RangeSelection): true
	{
		const paragraph = $createParagraphNode();
		const children = this.getChildren();
		children.forEach((child) => paragraph.append(child));
		this.replace(paragraph);

		return true;
	}

	insertNewAfter(selection: RangeSelection, restoreSelection = true): null | ParagraphNode | CodeTokenNode | TabNode
	{
		const children = this.getChildren();
		const childrenLength = children.length;

		if (
			childrenLength >= 2
			&& children[childrenLength - 1].getTextContent() === '\n'
			&& children[childrenLength - 2].getTextContent() === '\n'
			&& selection.isCollapsed()
			&& selection.anchor.key === this.__key
			&& selection.anchor.offset === childrenLength
		)
		{
			children[childrenLength - 1].remove();
			children[childrenLength - 2].remove();
			const newElement = $createParagraphNode();
			this.insertAfter(newElement, restoreSelection);

			return newElement;
		}

		// If the selection is within the codeblock, find all leading tabs and
		// spaces of the current line. Create a new line that has all those
		// tabs and spaces, such that leading indentation is preserved.
		const { anchor, focus } = selection;
		const firstPoint = anchor.isBefore(focus) ? anchor : focus;
		const firstSelectionNode = firstPoint.getNode();
		if ($isTextNode(firstSelectionNode))
		{
			// inside a code block a text node is always a CodeTokenNode or a TabNode
			let node: LexicalNode | null = getFirstCodeNodeOfLine(firstSelectionNode as CodeTokenNode);
			const insertNodes = [];

			while (true)
			{
				if ($isTabNode(node))
				{
					insertNodes.push($createTabNode());
					node = node.getNextSibling();
				}
				else if ($isCodeTokenNode(node))
				{
					let spaces = 0;
					const text = node!.getTextContent();
					const textSize = node!.getTextContentSize();
					while (spaces < textSize && text[spaces] === ' ')
					{
						spaces++;
					}

					if (spaces !== 0)
					{
						insertNodes.push($createCodeTokenNode(' '.repeat(spaces)));
					}

					if (spaces !== textSize)
					{
						break;
					}

					node = node!.getNextSibling();
				}
				else
				{
					break;
				}
			}

			const split = firstSelectionNode.splitText(anchor.offset)[0];
			const x = anchor.offset === 0 ? 0 : 1;
			const index = split.getIndexWithinParent() + x;
			const codeNode = firstSelectionNode.getParentOrThrow();
			const nodesToInsert = [$createLineBreakNode(), ...insertNodes];
			codeNode.splice(index, 0, nodesToInsert);
			const last = insertNodes[insertNodes.length - 1];
			if (last)
			{
				last.select();
			}
			else if (anchor.offset === 0)
			{
				split.selectPrevious();
			}
			else
			{
				split.getNextSibling()?.selectNext(0, 0);
			}
		}

		if ($isCodeNode(firstSelectionNode))
		{
			const { offset } = anchor;
			firstSelectionNode.splice(offset, 0, [$createLineBreakNode()]);
			firstSelectionNode.select(offset + 1, offset + 1);
		}

		return null;
	}
}

export function $createCodeNode(): CodeNode
{
	return $applyNodeReplacement(new CodeNode());
}

export function $isCodeNode(node: LexicalNode | null | undefined): node is CodeNode
{
	return node instanceof CodeNode;
}

function convertPreElement(domNode: Node): DOMConversionOutput
{
	return { node: $createCodeNode() };
}

function convertDivElement(domNode: Node): DOMConversionOutput
{
	// domNode is a <div> since we matched it by nodeName
	const div = domNode as HTMLElement;
	const isCode = isCodeElement(div);
	if (!isCode && !isCodeChildElement(div))
	{
		return {
			node: null,
		};
	}

	return {
		after: (childLexicalNodes) => {
			const domParent = domNode.parentNode;
			if (domParent !== null && domNode !== domParent.lastChild)
			{
				childLexicalNodes.push($createLineBreakNode());
			}

			return childLexicalNodes;
		},
		node: isCode ? $createCodeNode() : null,
	};
}

function convertTableElement(): DOMConversionOutput
{
	return { node: $createCodeNode() };
}

function convertCodeNoop(): DOMConversionOutput
{
	return { node: null };
}

function convertTableCellElement(domNode: Node): DOMConversionOutput
{
	// domNode is a <td> since we matched it by nodeName
	const cell = domNode;

	return {
		after: (childLexicalNodes) => {
			if (cell.parentNode && cell.parentNode.nextSibling)
			{
				// Append newline between code lines
				childLexicalNodes.push($createLineBreakNode());
			}

			return childLexicalNodes;
		},
		node: null,
	};
}

function isCodeElement(div: HTMLElement): boolean
{
	// only the inline style matters here: Dom.style() would return the computed
	// (inherited) font, making every child of a monospace block look like code
	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
	return div.style.fontFamily.match('monospace') !== null;
}

function isCodeChildElement(node: HTMLElement): boolean
{
	let parent = node.parentElement;
	while (parent !== null)
	{
		if (isCodeElement(parent))
		{
			return true;
		}

		parent = parent.parentElement;
	}

	return false;
}

function isGitHubCodeCell(cell: HTMLTableCellElement): boolean
{
	return Dom.hasClass(cell, 'js-file-line');
}

function isGitHubCodeTable(table: HTMLTableElement): boolean
{
	return Dom.hasClass(table, 'js-file-line-container');
}

function hasChildDOMNodeTag(node: Node, tagName: string): boolean
{
	let hasChild = false;
	for (const child of node.childNodes)
	{
		if (Type.isElementNode(child) && child.tagName === tagName)
		{
			return true;
		}

		hasChild = hasChildDOMNodeTag(child, tagName);
	}

	return hasChild;
}
