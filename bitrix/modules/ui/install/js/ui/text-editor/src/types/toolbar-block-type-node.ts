import { type LexicalNode } from 'ui.lexical.core';

/**
 * A node whose toolbar identity is not its own type name. The toolbar tells which of its buttons
 * is active by comparing the button name with the block types around the caret, and a node whose
 * getType() differs from that name -- 'custom-link' against the 'link' button -- would never
 * light one up. Declaring this method is how the node that owns the discrepancy resolves it,
 * instead of the toolbar core keeping a list of the nodes it has been told about.
 */
export type ToolbarBlockTypeNode = LexicalNode & {
	getToolbarBlockType?: () => string,
};
