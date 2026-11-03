import { type SharingControlType, type SharingControlTypeValue } from '../../../const/sharing';

/**
 * Modes the reading actions are defined for: `blocked-by-feature` never reaches the server.
 */
export type SharingReadMode = Exclude<SharingControlTypeValue, typeof SharingControlType.BlockedByFeature>;

export type SharingSaveMode = Exclude<SharingReadMode, typeof SharingControlType.WithoutEdit>;

export type SharingMemberDto = {
	sharingId?: number,
	entityId: string,
	name: string,
	right: string,
	avatar: string,
	url?: string,
	type: string,
};

export type SharingOwnerDto = {
	name: string,
	avatar: string,
	link: string,
	canOnlyShare?: boolean,
	maxTaskName?: string | null,
};

export type SharingDetailDto = {
	members: SharingMemberDto[],
	owner: SharingOwnerDto,
};

/**
 * The server reads `right` only; `item` and `type` are kept for format compatibility.
 */
export type SharedEntityDto = {
	item: {
		id: string,
		name: string,
		avatar: string,
	},
	type: string,
	right: string,
};

export type EntityToNewSharedDto = {
	[entityId: string]: SharedEntityDto,
};

export type SharingRawError = {
	message?: string,
	code?: string | number,
};

export type SharingRawResponse = {
	status?: string,
	message?: string,
	errors?: SharingRawError[],
};

/**
 * `error` and `denied` responses carry neither `owner` nor `members`, so `data` is unreachable
 * until the status is checked.
 */
export type SharingResult<Data> =
	| { status: 'success', data: Data }
	| { status: 'error', errorMessage: string }
	| { status: 'denied', errorMessage: string };
