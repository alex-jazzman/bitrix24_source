export type AudienceValue = 'OWNER_ONLY' | 'SPECIFIC_MEMBERS' | 'PORTAL' | 'AUTHENTICATED' | 'PUBLIC';

export const Audience = Object.freeze({
	OwnerOnly: 'OWNER_ONLY',
	SpecificMembers: 'SPECIFIC_MEMBERS',
	Portal: 'PORTAL',
	Authenticated: 'AUTHENTICATED',
	Public: 'PUBLIC',
});

export type CatalogShareParticipant = {
	id: string,
	name: string,
};

export type CatalogShareState = {
	audience: AudienceValue,
	users: CatalogShareParticipant[],
	departments: CatalogShareParticipant[],
};

export type LinkAvailabilityValue = 'AVAILABLE' | 'UNAVAILABLE';

export const LinkAvailability = Object.freeze({
	Available: 'AVAILABLE',
	Unavailable: 'UNAVAILABLE',
});

export type LinkUnavailableReasonValue = 'DIRECT_GLOBAL_ACCESS';

export const LinkUnavailableReason = Object.freeze({
	DirectGlobalAccess: 'DIRECT_GLOBAL_ACCESS',
});

export type CatalogPortalLink = {
	url: string,
	expiresAt: string | null,
	requireB24Auth: boolean,
};

export type CatalogLinkState = {
	availability: LinkAvailabilityValue,
	unavailableReason: LinkUnavailableReasonValue | null,
	link: CatalogPortalLink | null,
};

export type SetCatalogLinkPayload = {
	enabled: false,
} | {
	enabled: true,
	expiresAt: string | null,
	requireB24Auth: boolean,
};

export type CatalogShareApplication = {
	id: number,
	title: string,
	iconUrl: string | null,
	color: string | null,
	viewUrl: string | null,
};

export type CatalogShareDraft = {
	share: CatalogShareState,
	linkState: CatalogLinkState,
};
