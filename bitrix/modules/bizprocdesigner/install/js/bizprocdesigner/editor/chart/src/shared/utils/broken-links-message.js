import { Loc, Type } from 'main.core';

/**
 * The text of the warning about references leading nowhere, shared by the panel of an ordinary node
 * and by the panel of a complex one: one wording for two places.
 *
 * The former code stays the fallback: the languages the new wording has not reached yet keep the text
 * they have instead of an empty warning. A phrase the portal does not know comes back as an empty
 * string and not as nil, so the first filled one is taken.
 */
export function resolveBrokenLinksMessage(): string
{
	const message = Loc.getMessage('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_ERROR_MSGVER_1');
	if (Type.isStringFilled(message))
	{
		return message;
	}

	return Loc.getMessage('BIZPROCDESIGNER_EDITOR_BROKEN_LINK_ERROR') ?? '';
}
