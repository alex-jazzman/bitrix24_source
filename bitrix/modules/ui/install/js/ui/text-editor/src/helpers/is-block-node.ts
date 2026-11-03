import {
	$isDecoratorNode,
	$isElementNode,
	type DecoratorNode,
	type ElementNode,
	type LexicalNode,
} from 'ui.lexical.core';

export function $isBlockNode(node: ElementNode | DecoratorNode<unknown> | LexicalNode): boolean
{
	return ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline() && !node.isParentRequired();
}
