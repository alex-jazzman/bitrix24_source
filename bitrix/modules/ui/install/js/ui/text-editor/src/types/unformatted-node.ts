import { type LexicalNode } from 'ui.lexical.core';

/**
 * A node whose text is written exactly as typed: nothing may decorate it -- no auto-linking, no
 * smiley replacement, no link and no character formatting. A code block, a code token and the
 * title of a spoiler are the three that say so.
 *
 * The node declares the trait itself, the way ToolbarBlockTypeNode declares a toolbar identity and
 * EscapableBlockNode declares that the caret needs a way out. Before that this was a `__flags`
 * bitmask written into lexical's own `__` namespace, and a type that claimed the field on every
 * LexicalNode -- while only three classes ever had it, nothing ever wrote it after construction,
 * and the mask never held a second bit.
 */
export type UnformattedNode = LexicalNode & {
	isUnformatted?: () => boolean,

	/**
	 * The bit the trait used to be read from. Still honoured for a node declared outside this
	 * extension, since `UNFORMATTED` is part of the public constants; declare isUnformatted()
	 * instead.
	 */
	__flags?: number,
};
