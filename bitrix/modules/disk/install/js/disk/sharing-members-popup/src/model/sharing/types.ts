import { type SharingControlTypeValue, type SharingRightValue } from '../../const/sharing';

export type SharingMember = {
	sharingId: number | null,
	entityId: string,
	name: string,
	right: SharingRightValue,
	avatar: string,
	url: string | null,
	type: string,
};

/**
 * An entity just picked in the selector: it has no sharing of its own yet, so the model gives
 * it the default right.
 */
export type NewSharingMember = {
	entityId: string,
	name: string,
	avatar: string,
	type: string,
	url?: string | null,
};

export type SharingOwner = {
	name: string,
	avatar: string,
	link: string,
};

/**
 * The server state the model starts from. `maxRight` keeps the raw `owner.maxTaskName`: a name
 * outside the four known ones weighs less than any of them and leaves no level to pick.
 */
export type SharingSnapshot = {
	mode: SharingControlTypeValue,
	owner: SharingOwner,
	members: SharingMember[],
	maxRight: string | null,
};

export type SharingState = {
	// the object the sharing belongs to: its name goes into the text of a successful save
	objectId: number | null,
	objectName: string,
	mode: SharingControlTypeValue | null,
	owner: SharingOwner | null,
	members: SharingMember[],
	maxRight: string | null,
	lockedEntityIds: string[],
	isSaving: boolean,
	// the entity selector opens on top of the popup and owns the keyboard while it is there
	isSelectorOpen: boolean,
};

/**
 * Everything that goes to the server on save: the whole member list with their current rights.
 */
export type SharingDraft = {
	members: SharingMember[],
};
