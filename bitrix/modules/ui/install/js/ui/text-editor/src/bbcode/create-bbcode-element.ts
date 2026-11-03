import { type BBCodeElementNode, type BBCodeScheme } from 'ui.bbcode.model';

import { type BBCodeElementOptions } from './types';

/**
 * Builds a BBCode element through the editor's scheme.
 *
 * The scheme's own createElement() declares an argument that includes `scheme` — which it fills
 * in itself, so nothing a caller writes ever satisfies the declared shape. `inline` goes the
 * other way round: five call sites pass it, the declared shape does not mention it, and the node
 * constructor reads only `value` and `attributes` — inline-ness comes from the tag group in the
 * scheme, so the flag is accepted and dropped. Both mismatches used to be papered over by a cast
 * at each of the twelve call sites, in three different spellings; they live here now, once.
 */
export function createBBCodeElement(scheme: BBCodeScheme, options: BBCodeElementOptions): BBCodeElementNode
{
	return scheme.createElement(options as unknown as Parameters<typeof scheme.createElement>[0]);
}
