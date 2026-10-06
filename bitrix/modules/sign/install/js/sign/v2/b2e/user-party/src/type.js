import type { MemberRoleType } from 'sign.type';

export const UserPartyViewMode = {
	edit: 'edit',
	view: 'view',
};

/**
 * Signer entity of the selector: entityId is a string, as the server validation of signer
 * entities expects it (`^\d+$|^\d+:F$`).
 */
export type PreselectedSignerEntity = {
	entityType: string,
	entityId: string,
}

export type UserPartyOptions = {
	mode: ?string,
	preselectedUserIds: [],
	preselectedSigners: ?Array<PreselectedSignerEntity>,
	b2eSignersLimitCount: ?Number,
	role: MemberRoleType,
}
