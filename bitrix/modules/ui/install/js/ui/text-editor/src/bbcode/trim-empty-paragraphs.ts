import { type LexicalNode, type ElementNode } from 'ui.lexical.core';

import { $isParagraphEmpty } from '../helpers/is-paragraph-empty';

export function trimEmptyParagraphs(nodes: Array<LexicalNode | ElementNode>): Array<LexicalNode | ElementNode>
{
	const trimmedNodes = [...nodes];

	// trim from the start
	while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[0] as ElementNode))
	{
		trimmedNodes.splice(0, 1);
	}

	// trim from the end
	while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[trimmedNodes.length - 1] as ElementNode))
	{
		trimmedNodes.splice(-1, 1);
	}

	return trimmedNodes;
}
