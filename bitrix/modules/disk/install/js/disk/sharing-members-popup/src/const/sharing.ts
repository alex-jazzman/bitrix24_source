// Values mirror the server enum Bitrix\Disk\document\SharingControlType (disk/lib/document/sharingcontroltype.php).
export const SharingControlType = Object.freeze({
	WithoutEdit: 'without-edit',
	WithChangeRights: 'with-change-rights',
	WithSharing: 'with-sharing',
	BlockedByFeature: 'blocked-by-feature',
});

export type SharingControlTypeValue = (typeof SharingControlType)[keyof typeof SharingControlType];

/**
 * What a mode allows. This is the only place the three modes differ: the model exposes
 * the permission of the current mode and everything else asks it instead of comparing the mode.
 */
export type SharingModePermission = {
	canChangeMembers: boolean,
	canAddMembers: boolean,
	canSave: boolean,
	locksLoadedMembers: boolean,
	limitsRightsByMaxRight: boolean,
};

/**
 * A mode the popup does not serve (`blocked-by-feature`, produced by the document editor only)
 * and an absent mode allow nothing: falling back to the widest mode is more dangerous than
 * showing a popup with no actions.
 */
export const NoSharingModePermission: SharingModePermission = Object.freeze({
	canChangeMembers: false,
	canAddMembers: false,
	canSave: false,
	locksLoadedMembers: false,
	limitsRightsByMaxRight: false,
});

type SharingModePermissionTable = Partial<Record<SharingControlTypeValue, SharingModePermission>>;

export const SharingModePermissionByMode: SharingModePermissionTable = Object.freeze({
	[SharingControlType.WithoutEdit]: Object.freeze({
		canChangeMembers: false,
		canAddMembers: false,
		canSave: false,
		locksLoadedMembers: false,
		limitsRightsByMaxRight: false,
	}),
	[SharingControlType.WithChangeRights]: Object.freeze({
		canChangeMembers: true,
		canAddMembers: true,
		canSave: true,
		locksLoadedMembers: false,
		// the server answers this mode with the full right, so the choice needs no limit
		limitsRightsByMaxRight: false,
	}),
	[SharingControlType.WithSharing]: Object.freeze({
		canChangeMembers: true,
		canAddMembers: true,
		canSave: true,
		locksLoadedMembers: true,
		limitsRightsByMaxRight: true,
	}),
});

// Values mirror the task names of Bitrix\Disk\RightsManager (disk/lib/rightsmanager.php).
export const SharingRight = Object.freeze({
	Read: 'disk_access_read',
	Add: 'disk_access_add',
	Edit: 'disk_access_edit',
	Full: 'disk_access_full',
});

export type SharingRightValue = (typeof SharingRight)[keyof typeof SharingRight];

/**
 * Weight limits the choice by the maximum right of the current user; the keys are declared
 * in ascending order of weight.
 */
export const SharingRightInfo = Object.freeze({
	[SharingRight.Read]: { weight: 2, phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_READ' },
	[SharingRight.Add]: { weight: 3, phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_ADD' },
	[SharingRight.Edit]: { weight: 4, phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_EDIT' },
	[SharingRight.Full]: { weight: 5, phraseCode: 'JS_DISK_SHARING_MEMBERS_POPUP_RIGHT_FULL' },
});

export const SharingRightList: readonly SharingRightValue[] = Object.freeze(
	Object.keys(SharingRightInfo) as SharingRightValue[],
);

/**
 * The server weighs an unknown task name as -1 and refuses to save it, so such a maximum
 * leaves no level to pick.
 */
export const UnknownRightWeight = -1;

export const DefaultSharingRight = SharingRight.Edit;
