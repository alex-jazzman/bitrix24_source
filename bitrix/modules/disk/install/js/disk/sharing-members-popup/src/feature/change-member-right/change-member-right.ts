import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { type SharingRightValue } from '../../const/sharing';
import { getRightLabel } from '../../lib/right-label/right-label';
import { type SharingStore } from '../../model/sharing/sharing';
import { type SharingMember } from '../../model/sharing/types';

/**
 * Writes the picked level into the draft. A level the current user cannot grant is refused by
 * the server on save, so it never reaches the draft.
 */
export function changeMemberRight(store: SharingStore, entityId: string, right: SharingRightValue): void
{
	if (!store.availableRights.includes(right))
	{
		return;
	}

	store.changeMemberRight(entityId, right);

	// the row changes silently, so the new level is announced to the screen reader
	const member = store.members.find((item: SharingMember) => item.entityId === entityId);

	if (member?.right === right)
	{
		LiveAnnouncer.announce(Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_RIGHT_CHANGED', {
			'#NAME#': member.name,
			'#LEVEL#': getRightLabel(right),
		}) ?? '');
	}
}
