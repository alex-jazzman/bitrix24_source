import { $isElementNode, type ElementNode, type LexicalNode } from 'ui.lexical.core';

import { type EscapableBlockNode } from '../types/escapable-block-node';

/**
 * Whether the node is a block the caret cannot leave with an arrow key on its own. The node
 * answers for itself -- see EscapableBlockNode.
 *
 * Not to be confused with `$isBlockNode` next door: that one asks the shape of the node ("not
 * inline, needs no particular parent") and is true of a paragraph or an image as well.
 */
export function $isEscapableBlock(node: LexicalNode | null | undefined): node is ElementNode
{
	return $isElementNode(node) && (node as EscapableBlockNode).isEscapableBlock?.() === true;
}
