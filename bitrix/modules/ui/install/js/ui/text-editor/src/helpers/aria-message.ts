import { Loc, Type } from 'main.core';

/**
 * An accessible name taken from a phrase, or null when the portal has no such phrase.
 *
 * Loc.getMessage() answers undefined for a missing key, and no aria sink treats that as absence:
 * Tag.render interpolates it as the literal "undefined", and Dom.attr reads the attribute instead
 * of writing it. null is the one value both of them understand as "leave the attribute out", and
 * a control with no accessible name is far better than one named "undefined".
 */
export function getAriaMessage(
	messageId: string,
	replacements: Record<string, string> | null = null,
): string | null
{
	const message: string | null | undefined = Loc.getMessage(messageId, replacements);

	return Type.isStringFilled(message) ? message : null;
}
