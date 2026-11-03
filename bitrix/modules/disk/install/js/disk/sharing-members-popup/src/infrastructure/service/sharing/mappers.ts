import { Text, Type } from 'main.core';

import { type SharingRightValue } from '../../../const/sharing';
import {
	type SharingDraft,
	type SharingMember,
	type SharingOwner,
} from '../../../model/sharing/types';
import {
	type EntityToNewSharedDto,
	type SharingMemberDto,
	type SharingOwnerDto,
} from './types';

/**
 * An owner without a photo comes with a stub image of the server (`Bitrix\Disk\Ui\Avatar`:
 * `getDefaultPerson` for a user, `getDefaultGroup` for a group and common storage).
 */
const StubAvatarPath = new Set([
	'/bitrix/images/disk/default_avatar.png',
	'/bitrix/images/disk/default_groupe.png',
]);

/**
 * An empty path is what leaves the avatar of the design system drawing the initials of the name,
 * so the stub of the server never reaches the view.
 */
export function mapOwnerToModel(owner: SharingOwnerDto): SharingOwner
{
	return {
		name: owner.name,
		avatar: StubAvatarPath.has(owner.avatar) ? '' : owner.avatar,
		link: owner.link,
	};
}

export function mapMembersToModel(members: SharingMemberDto[]): SharingMember[]
{
	return members.map((member: SharingMemberDto): SharingMember => {
		return {
			// the synthetic member of a user without control rights carries neither sharingId nor url
			sharingId: Type.isNil(member.sharingId) ? null : Text.toNumber(member.sharingId),
			entityId: member.entityId,
			name: member.name,
			// an unknown task name is kept as it came: the model weighs it below every known level
			right: member.right as SharingRightValue,
			avatar: member.avatar,
			url: Type.isStringFilled(member.url) ? member.url : null,
			type: member.type,
		};
	});
}

/**
 * A draft without members maps to an empty set, which is how the server is told to remove
 * every sharing of the object.
 */
export function mapDraftToEntityToNewShared(draft: SharingDraft): EntityToNewSharedDto
{
	const entityToNewShared: EntityToNewSharedDto = {};

	draft.members.forEach((member: SharingMember) => {
		entityToNewShared[member.entityId] = {
			item: {
				id: member.entityId,
				name: member.name,
				avatar: member.avatar,
			},
			type: member.type,
			right: member.right,
		};
	});

	return entityToNewShared;
}
