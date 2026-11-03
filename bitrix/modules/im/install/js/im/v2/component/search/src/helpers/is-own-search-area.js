import { Type } from 'main.core';

/**
 * Fail closed: an unaddressed area (imopenlines, popups) must never be driven by another area's input,
 * and two empty ids must not read as a match. The rule is the whole safety of the search channels, so it
 * lives here alone - a third subscriber gets it by calling, not by copying.
 */
export function isOwnSearchArea(searchAreaId: ?string, ownSearchAreaId: ?string): boolean
{
	return Type.isStringFilled(searchAreaId) && searchAreaId === ownSearchAreaId;
}
