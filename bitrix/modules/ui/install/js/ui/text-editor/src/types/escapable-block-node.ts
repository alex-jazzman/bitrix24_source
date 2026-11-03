import { type LexicalNode } from 'ui.lexical.core';

/**
 * A block the caret can be trapped in. Such a block carries content of its own, so pressing Up
 * from its first line, or Down from its last, has nowhere to go while the block is the first or
 * the last child of its parent -- the paragraph plugin answers that by putting a fresh paragraph
 * next to it.
 *
 * The node declares the trait itself, the way ToolbarBlockTypeNode declares a toolbar identity.
 * Otherwise the paragraph plugin -- which every editor loads -- would have to keep a list of the
 * node classes that behave this way, and import the optional plugins that own them.
 *
 * This is a narrower thing than helpers/is-block-node.ts `$isBlockNode`, which answers "not
 * inline and needs no particular parent" and is true of a paragraph, a list or an image as well.
 */
export type EscapableBlockNode = LexicalNode & {
	isEscapableBlock?: () => boolean,
};
