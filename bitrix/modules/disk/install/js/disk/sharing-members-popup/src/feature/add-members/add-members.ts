import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

import { getAccessCodeBySelectorItem, getMemberTypeBySelectorEntity } from '../../lib/access-code/access-code';
import { type SharingStore } from '../../model/sharing/sharing';

/**
 * An entity of ui.entity-selector the user has just picked or dropped.
 */
export type SelectedEntity = {
	entity: string,
	id: string | number,
	title: string,
	avatar: string,
};

// the list changes without a message on screen, so the change is announced to the screen reader
function announce(phraseCode: string, name: string): void
{
	LiveAnnouncer.announce(Loc.getMessage(phraseCode, { '#NAME#': name }) ?? '');
}

/**
 * Puts the picked entity into the draft with the right the model grants a new member. A department
 * stays a department: it is never unfolded into its employees.
 */
export function addSelectedMember(store: SharingStore, selected: SelectedEntity): void
{
	const entityId = getAccessCodeBySelectorItem(selected.entity, selected.id);
	const type = getMemberTypeBySelectorEntity(selected.entity);

	if (entityId === null || type === null)
	{
		return;
	}

	const countBefore = store.members.length;

	store.addMember({
		entityId,
		name: selected.title,
		avatar: selected.avatar,
		type,
	});

	if (store.members.length > countBefore)
	{
		announce('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_MEMBER_ADDED', selected.title);
	}
}

/**
 * Drops the entity out of the draft. A member the appending mode has loaded stays: the model
 * refuses to remove it.
 */
export function removeDeselectedMember(store: SharingStore, selected: SelectedEntity): void
{
	const entityId = getAccessCodeBySelectorItem(selected.entity, selected.id);

	if (entityId === null)
	{
		return;
	}

	const countBefore = store.members.length;

	store.removeMember(entityId);

	if (store.members.length < countBefore)
	{
		announce('JS_DISK_SHARING_MEMBERS_POPUP_ANNOUNCE_MEMBER_REMOVED', selected.title);
	}
}
