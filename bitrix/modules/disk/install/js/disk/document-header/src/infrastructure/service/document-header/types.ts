/**
 * Wire shapes of the `disk.api.documentHeader` controller: what leaves the header and what the
 * server answers with. The client model of the composition lives in `model/composition/types`.
 */

export type CompositionRequest = {
	documentSessionHash: string,
};

export type PresenceRequest = {
	documentSessionHash: string,
};

export type RenameRequest = {
	documentSessionHash: string,
	newName: string,
};

export type EditorDto = {
	code: string,
	name: string,
	isDefault: boolean,
};

/** The description of one concrete opening. */
export type CompositionDto = {
	elements: string[],
	objectType: string,
	mode: string,
	object: {
		/** `null` for an opening which offers the object none: a public one, a version, an attachment,
		    and the minimal header of a page whose description was refused. */
		id: number | null,
		name: string,
		/** `null` for the same openings, for the same reason. */
		uniqueCode: string | null,
		extension: string,
	},
	urls: {
		unifiedLink: string,
		download: string,
	},
	access: {
		controlType: string,
	},
	editors: EditorDto[],
	presence: {
		enabled: boolean,
	},
	boost: {
		containerRequired: boolean,
	},
};

export type ParticipantDto = {
	id: number,
	name: string,
	avatar: string,
	isGuest: boolean,
};

/** The starting roster of the opening. */
export type PresenceDto = {
	revision: number,
	participants: ParticipantDto[],
};

export type RenameDto = {
	name: string,
	editorSynchronized: boolean,
};

/** Code comes from the server as is; the two codes below are the ones the service adds itself. */
export type HeaderServiceError = {
	code: string,
	message: string,
};

export type HeaderServiceResult<TData> =
	| { success: true, data: TData }
	| { success: false, error: HeaderServiceError }
;
