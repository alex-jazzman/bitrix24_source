import { Loc } from 'main.core';

import { SharingRightInfo, type SharingRightValue } from '../../const/sharing';

/**
 * A task name outside the four known ones has no phrase of its own: the server sends such
 * a right as it came from the database, and the popup leaves the level unnamed.
 */
export function getRightLabel(right: SharingRightValue): string
{
	if (!Object.prototype.hasOwnProperty.call(SharingRightInfo, right))
	{
		return '';
	}

	return Loc.getMessage(SharingRightInfo[right].phraseCode) ?? '';
}
