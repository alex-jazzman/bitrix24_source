import { defineStore } from 'ui.vue3.pinia';

import {
	DefaultSharingRight,
	NoSharingModePermission,
	type SharingControlTypeValue,
	type SharingModePermission,
	SharingModePermissionByMode,
	SharingRightInfo,
	SharingRightList,
	type SharingRightValue,
	UnknownRightWeight,
} from '../../const/sharing';
import {
	type NewSharingMember,
	type SharingDraft,
	type SharingMember,
	type SharingSnapshot,
	type SharingState,
} from './types';

function getRightWeight(right: string | null): number
{
	if (right === null || !Object.prototype.hasOwnProperty.call(SharingRightInfo, right))
	{
		return UnknownRightWeight;
	}

	return SharingRightInfo[right as SharingRightValue].weight;
}

/**
 * The level a new member gets: the default one, or the strongest the current user may grant when
 * the default is above it. The server drops a level above the maximum and still answers success,
 * so such a level must never reach the draft. `null` means there is no level to grant at all.
 */
function getRightForNewMember(availableRights: SharingRightValue[]): SharingRightValue | null
{
	if (availableRights.includes(DefaultSharingRight))
	{
		return DefaultSharingRight;
	}

	// the list is ordered by ascending weight, so the last level is the strongest available one
	return availableRights.length === 0 ? null : availableRights[availableRights.length - 1];
}

function getModePermission(mode: SharingControlTypeValue | null): SharingModePermission
{
	if (mode === null)
	{
		return NoSharingModePermission;
	}

	return SharingModePermissionByMode[mode] ?? NoSharingModePermission;
}

export const useSharingStore = defineStore('diskSharingMembers', {
	state: (): SharingState => ({
		objectId: null,
		objectName: '',
		mode: null,
		owner: null,
		members: [],
		maxRight: null,
		lockedEntityIds: [],
		isSaving: false,
		isSelectorOpen: false,
	}),
	getters: {
		permission(state: SharingState): SharingModePermission
		{
			return getModePermission(state.mode);
		},
		/**
		 * A mode that limits the choice by the maximum right of the current user offers the levels
		 * below it only, because the server drops anything above.
		 */
		availableRights(state: SharingState): SharingRightValue[]
		{
			const permission = getModePermission(state.mode);

			if (!permission.canChangeMembers)
			{
				return [];
			}

			if (!permission.limitsRightsByMaxRight)
			{
				return [...SharingRightList];
			}

			const maxWeight = getRightWeight(state.maxRight);

			return SharingRightList.filter((right: SharingRightValue) => getRightWeight(right) <= maxWeight);
		},
		/**
		 * Adding needs both the permission of the mode and a level to grant: a mode that allows
		 * adding while no level is available would offer an action the model refuses to perform.
		 */
		canAddMembers(state: SharingState): boolean
		{
			return getModePermission(state.mode).canAddMembers && this.availableRights.length > 0;
		},
		isMemberLocked(state: SharingState): (entityId: string) => boolean
		{
			return (entityId: string) => state.lockedEntityIds.includes(entityId);
		},
		/**
		 * Every member of the list goes to the server, including the ones the entity selector
		 * cannot show.
		 */
		draft(state: SharingState): SharingDraft
		{
			return {
				members: [...state.members],
			};
		},
	},
	actions: {
		setObject(objectId: number, objectName: string): void
		{
			this.objectId = objectId;
			this.objectName = objectName;
		},
		fill(snapshot: SharingSnapshot): void
		{
			this.mode = snapshot.mode;
			this.owner = snapshot.owner;
			this.members = [...snapshot.members];
			this.maxRight = snapshot.maxRight;
			// a mode that locks the loaded members neither changes nor removes them
			this.lockedEntityIds = getModePermission(snapshot.mode).locksLoadedMembers
				? snapshot.members.map((member: SharingMember) => member.entityId)
				: [];
		},
		addMember(member: NewSharingMember): void
		{
			const isKnown = this.members.some((existing: SharingMember) => existing.entityId === member.entityId);

			if (isKnown)
			{
				return;
			}

			const right = getRightForNewMember(this.availableRights);

			// a user who may grant no level adds nobody: the server would drop such a member anyway
			if (right === null)
			{
				return;
			}

			this.members.push({
				sharingId: null,
				entityId: member.entityId,
				name: member.name,
				right,
				avatar: member.avatar,
				url: member.url ?? null,
				type: member.type,
			});
		},
		removeMember(entityId: string): void
		{
			if (this.isMemberLocked(entityId))
			{
				return;
			}

			this.members = this.members.filter((member: SharingMember) => member.entityId !== entityId);
		},
		changeMemberRight(entityId: string, right: SharingRightValue): void
		{
			if (this.isMemberLocked(entityId))
			{
				return;
			}

			const member = this.members.find((item: SharingMember) => item.entityId === entityId);

			if (member === undefined)
			{
				return;
			}

			member.right = right;
		},
		setSaving(isSaving: boolean): void
		{
			this.isSaving = isSaving;
		},
		setSelectorOpen(isSelectorOpen: boolean): void
		{
			this.isSelectorOpen = isSelectorOpen;
		},
	},
});

/**
 * The store of a single popup. Everything that runs outside the injection context of a component
 * takes it as a parameter: `useSharingStore()` called from there resolves through the global
 * active Pinia, which any other Pinia application of the page moves onto itself while it renders.
 */
export type SharingStore = ReturnType<typeof useSharingStore>;
