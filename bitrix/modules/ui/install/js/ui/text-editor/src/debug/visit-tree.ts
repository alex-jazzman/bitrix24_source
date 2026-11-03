import { $isElementNode, type ElementNode, type LexicalNode } from 'ui.lexical.core';

import { SYMBOLS } from './constants';

export function visitTree(
	currentNode: ElementNode,
	visitor: (node: LexicalNode, indentArr: Array<string>) => void,
	indent: Array<string> = [],
): void
{
	const childNodes = currentNode.getChildren();
	const childNodesLength = childNodes.length;

	childNodes.forEach((childNode, i) => {
		const isLastChild = i === childNodesLength - 1;

		visitor(childNode, [...indent, isLastChild ? SYMBOLS.isLastChild : SYMBOLS.hasNextSibling]);

		if ($isElementNode(childNode))
		{
			visitTree(
				childNode,
				visitor,
				[...indent, isLastChild ? SYMBOLS.ancestorIsLastChild : SYMBOLS.ancestorHasNextSibling],
			);
		}
	});
}
