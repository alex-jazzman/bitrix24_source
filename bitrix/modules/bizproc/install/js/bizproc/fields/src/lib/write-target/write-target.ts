/** A control an inserted value can be written into, whichever of them the type declared. */
export type WriteTarget = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Whether an inserted value can be written into this node at all. Structural on purpose: the nodes
 * the selectors know how to write into and no others - an input and a textarea take the value at
 * the caret (`selectionEnd`), a dropdown takes it as the option that stands selected. Any other
 * element has neither. Which node that is, a type declares itself; nothing here guesses it from the
 * markup.
 */
export function isWriteTarget(node: HTMLElement): node is WriteTarget
{
	return node instanceof HTMLInputElement
		|| node instanceof HTMLTextAreaElement
		|| node instanceof HTMLSelectElement;
}
