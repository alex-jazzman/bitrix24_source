/* eslint-disable no-underscore-dangle */

import { type LexicalNode } from 'ui.lexical.core';
import { $findMatchingParent } from 'ui.lexical.utils';

import { UNFORMATTED } from '../constants';
import { type UnformattedNode } from '../types/unformatted-node';

/** Whether this very node holds text that may not be decorated -- see UnformattedNode. */
export function $isUnformatted(node: LexicalNode | null | undefined): boolean
{
	const candidate = node as UnformattedNode | null | undefined;
	if (candidate?.isUnformatted?.() === true)
	{
		return true;
	}

	// the legacy declaration, for a node class outside this extension
	return ((candidate?.__flags ?? 0) & UNFORMATTED) !== 0;
}

/**
 * Whether the node sits in such text. The trait belongs to the block, not to the text inside it,
 * so the whole ancestor chain is walked -- and every caller asks it about a text node.
 */
export function $isInsideUnformatted(node: LexicalNode): boolean
{
	return $findMatchingParent(node, $isUnformatted) !== null;
}
