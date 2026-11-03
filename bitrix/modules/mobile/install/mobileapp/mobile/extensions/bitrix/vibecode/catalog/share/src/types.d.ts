declare type Audience = 'OWNER_ONLY' | 'SPECIFIC_MEMBERS' | 'PORTAL' | 'AUTHENTICATED' | 'PUBLIC';

declare type ShareViewStatus =
	| 'loading'
	| 'loadError'
	| 'audience'
	| 'memberDraft'
	| 'savingShare'
	| 'refreshingLink'
	| 'generatingDefaultLink'
	| 'linkSettings'
	| 'confirmAnonymousLink'
	| 'confirmPortalLinkRevoke'
	| 'savingLink'
	| 'closed';

declare type LinkAvailability = 'AVAILABLE' | 'UNAVAILABLE';

declare type LinkUnavailableReason = 'DIRECT_GLOBAL_ACCESS';

declare type ShareParticipant = {
	id: string,
	name: string,
};

declare type SharePayload = {
	audience: Audience,
	users: ShareParticipant[],
	departments: ShareParticipant[],
};

declare type PortalLink = {
	url: string,
	expiresAt: string | null,
	requireB24Auth: boolean,
};

declare type LinkState = {
	availability: LinkAvailability,
	unavailableReason: LinkUnavailableReason | null,
	link: PortalLink | null,
};

declare type LinkDraft = {
	expiryEnabled: boolean,
	lastFiniteExpiresAt: Date,
	requireB24Auth: boolean,
};

declare type SetLinkPayload = {
	enabled: false,
} | {
	enabled: true,
	expiresAt: string | null,
	requireB24Auth: boolean,
};

declare type ShareSnapshot = {
	status: ShareViewStatus,
	share: SharePayload | null,
	draftShare: SharePayload | null,
	linkState: LinkState | null,
	linkDraft: LinkDraft | null,
	isShareDraftDirty: boolean,
	isLinkDraftDirty: boolean,
	pendingAudience: Audience | null,
	ownerOnlyConfirmationRequired: boolean,
	errorCode: string | null,
};

declare type ShareMember = {
	entityId: string,
	participant: ShareParticipant,
};

/** Height of the member cloud together with the composition it was measured for. */
declare type ShareMembersLayout = {
	key: string,
	height: number,
};

declare type VibeCodeCatalogShareSheetProps = {
	item: VibeCodeCatalogItemData,
	testId?: string,
	parentWidget?: LayoutWidget,
	now?: () => Date,
};

declare type VibeCodeCatalogShareSheetState = {
	snapshot: ShareSnapshot,
	membersLayout: ShareMembersLayout | null,
};

/** The single sharing action the link sheet calls; a stub of it is all a story case needs. */
declare interface IVibeCodeCatalogShareLinkApi
{
	setLink(catalogItemId: number | null, payload: SetLinkPayload): Promise<LinkState>;
}

/**
 * The part of the sharing rules the link sheet drives. Both sheets share one state machine, so the
 * second one gets it by reference - and declares here exactly which of its transitions it depends on.
 */
declare interface IVibeCodeCatalogShareLinkRules
{
	getSnapshot(): ShareSnapshot;

	prepareDefaultLinkGeneration(now: Date): SetLinkPayload;

	completeDefaultLinkGeneration(linkState: LinkState, now: Date): boolean;

	failDefaultLinkGeneration(errorCode: string): boolean;

	closeLinkSettings(): boolean;

	setLinkExpiry(expiresAt: Date): boolean;

	setLinkExpiryEnabled(expiryEnabled: boolean): boolean;

	setLinkRequireB24Auth(requireB24Auth: boolean): boolean;

	prepareLinkSave(now: Date): SetLinkPayload | null;

	confirmAnonymousLinkSave(now: Date): SetLinkPayload;

	cancelAnonymousLinkSave(): boolean;

	requestPortalLinkRevoke(): boolean;

	confirmPortalLinkRevoke(): SetLinkPayload;

	cancelPortalLinkRevoke(): boolean;

	setLinkSettingsError(errorCode: string): boolean;

	completeLinkSave(linkState: LinkState, now: Date): boolean;

	failSaving(errorCode: string): boolean;
}

declare type VibeCodeCatalogShareLinkSheetProps = {
	machine: IVibeCodeCatalogShareLinkRules,
	api: IVibeCodeCatalogShareLinkApi,
	catalogItemId: number | null,
	now?: () => Date,
	onClose?: () => void,
};

declare type VibeCodeCatalogShareLinkSheetState = {
	snapshot: ShareSnapshot,
	/** Expiry as of the drawn frame: the only part of the screen that depends on the clock. */
	isExpired: boolean,
};
