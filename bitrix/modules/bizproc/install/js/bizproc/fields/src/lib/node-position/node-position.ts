import { Dom, Type } from 'main.core';

/**
 * Puts a node where another one used to be. Only the position captured before that other node
 * was handed to a selection provider can say where that is: a provider is allowed to wrap by
 * moving the node it is given, and then the node itself has left its place by now.
 */
export function insertWhereNodeWas(node: HTMLElement, parent: HTMLElement | null, next: Element | null): void
{
	if (Type.isNull(parent))
	{
		return;
	}

	// The sibling may have been carried off with the node, and then only the parent is left to go by.
	if (!Type.isNull(next) && next.parentNode === parent)
	{
		// Native insertBefore rather than Dom.insertBefore: the helper is typed for HTMLElement,
		// while the reference point here is whichever element happened to follow the node.
		parent.insertBefore(node, next);

		return;
	}

	Dom.append(node, parent);
}
