import { Type } from 'main.core';

import {
	Audience,
	LinkAvailability,
	type AudienceValue,
	type CatalogLinkState,
	type CatalogShareParticipant,
	type CatalogShareState,
	type SetCatalogLinkPayload,
} from './catalog-share-types';

export const LINK_EXPIRY_MIN_OFFSET_SECONDS = 5 * 60;
export const LINK_EXPIRY_MAX_OFFSET_SECONDS = 315_360_000;

export function createDefaultLinkExpiry(now: Date = new Date()): Date
{
	const expiry = new Date(now.getTime());
	const day = expiry.getUTCDate();
	expiry.setUTCDate(1);
	expiry.setUTCMonth(expiry.getUTCMonth() + 1);
	const lastDay = new Date(Date.UTC(
		expiry.getUTCFullYear(),
		expiry.getUTCMonth() + 1,
		0,
	)).getUTCDate();
	expiry.setUTCDate(Math.min(day, lastDay));

	return expiry;
}

export function createEnabledLinkPayload(
	expiresAt: Date | null,
	requireB24Auth: boolean,
	now: Date = new Date(),
): SetCatalogLinkPayload
{
	if (expiresAt === null)
	{
		return {
			enabled: true,
			expiresAt: null,
			requireB24Auth,
		};
	}

	const offset = expiresAt.getTime() - now.getTime();
	if (!Number.isFinite(offset) || offset < LINK_EXPIRY_MIN_OFFSET_SECONDS * 1000)
	{
		throw new Error('LINK_EXPIRY_TOO_SOON');
	}

	if (offset > LINK_EXPIRY_MAX_OFFSET_SECONDS * 1000)
	{
		throw new Error('LINK_EXPIRY_TOO_LATE');
	}

	return {
		enabled: true,
		expiresAt: expiresAt.toISOString(),
		requireB24Auth,
	};
}

export type CatalogShareViewStateValue =
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
	| 'closed'
;

export const CatalogShareViewState = Object.freeze({
	Loading: 'loading',
	LoadError: 'loadError',
	Audience: 'audience',
	MemberDraft: 'memberDraft',
	SavingShare: 'savingShare',
	RefreshingLink: 'refreshingLink',
	GeneratingDefaultLink: 'generatingDefaultLink',
	LinkSettings: 'linkSettings',
	ConfirmAnonymousLink: 'confirmAnonymousLink',
	ConfirmPortalLinkRevoke: 'confirmPortalLinkRevoke',
	SavingLink: 'savingLink',
	Closed: 'closed',
});

export type CatalogShareSnapshot = {
	status: CatalogShareViewStateValue,
	share: CatalogShareState | null,
	linkState: CatalogLinkState | null,
	draftShare: CatalogShareState | null,
	errorCode: string | null,
	pendingAudience: AudienceValue | null,
	ownerOnlyConfirmationRequired: boolean,
	linkDraft: CatalogLinkDraft | null,
	isShareDraftDirty: boolean,
	isLinkDraftDirty: boolean,
};

export type CatalogLinkDraft = {
	expiryEnabled: boolean,
	lastFiniteExpiresAt: Date,
	requireB24Auth: boolean,
};

const GLOBAL_AUDIENCES = new Set([
	Audience.Authenticated,
	Audience.Public,
]);

function cloneParticipants(participants: CatalogShareParticipant[]): CatalogShareParticipant[]
{
	return participants.map((participant) => ({ ...participant }));
}

function cloneShare(share: CatalogShareState): CatalogShareState
{
	return {
		audience: share.audience,
		users: cloneParticipants(share.users),
		departments: cloneParticipants(share.departments),
	};
}

function deduplicateParticipants(participants: CatalogShareParticipant[]): CatalogShareParticipant[]
{
	const uniqueParticipants = new Map();
	participants.forEach((participant) => {
		const id = String(participant.id);
		if (!uniqueParticipants.has(id))
		{
			uniqueParticipants.set(id, { id, name: participant.name });
		}
	});

	return [...uniqueParticipants.values()];
}

function haveSameParticipantIds(
	left: CatalogShareParticipant[],
	right: CatalogShareParticipant[],
): boolean
{
	if (left.length !== right.length)
	{
		return false;
	}

	const rightIds = new Set(right.map((participant) => String(participant.id)));

	return left.every((participant) => rightIds.has(String(participant.id)));
}

export class CatalogShareStateMachine
{
	#status: CatalogShareViewStateValue = CatalogShareViewState.Loading;
	#share: CatalogShareState | null = null;
	#linkState: CatalogLinkState | null = null;
	#draftShare: CatalogShareState | null = null;
	#specificMembersDraft: CatalogShareState = {
		audience: Audience.SpecificMembers,
		users: [],
		departments: [],
	};

	#errorCode: string | null = null;
	#pendingAudience: AudienceValue | null = null;
	#ownerOnlyConfirmationRequired: boolean = false;
	#previousEditableState: CatalogShareViewStateValue | null = null;
	#linkSettingsReturnState: CatalogShareViewStateValue | null = null;
	#linkDraft: CatalogLinkDraft | null = null;

	getSnapshot(): CatalogShareSnapshot
	{
		return {
			status: this.#status,
			share: this.#share,
			linkState: this.#linkState,
			draftShare: this.#draftShare === null ? null : cloneShare(this.#draftShare),
			errorCode: this.#errorCode,
			pendingAudience: this.#pendingAudience,
			ownerOnlyConfirmationRequired: this.#ownerOnlyConfirmationRequired,
			linkDraft: this.#linkDraft === null ? null : {
				expiryEnabled: this.#linkDraft.expiryEnabled,
				lastFiniteExpiresAt: new Date(this.#linkDraft.lastFiniteExpiresAt.getTime()),
				requireB24Auth: this.#linkDraft.requireB24Auth,
			},
			isShareDraftDirty: this.#isShareDraftDirty(),
			isLinkDraftDirty: this.#isLinkDraftDirty(),
		};
	}

	beginLoading(): boolean
	{
		if (
			this.#status === CatalogShareViewState.Loading
			|| this.#status === CatalogShareViewState.SavingShare
			|| this.#status === CatalogShareViewState.RefreshingLink
			|| this.#status === CatalogShareViewState.GeneratingDefaultLink
			|| this.#status === CatalogShareViewState.SavingLink
			|| this.#status === CatalogShareViewState.Closed
		)
		{
			return false;
		}

		this.#status = CatalogShareViewState.Loading;
		this.#errorCode = null;

		return true;
	}

	completeLoading(share: CatalogShareState, linkState: CatalogLinkState): boolean
	{
		if (this.#status !== CatalogShareViewState.Loading)
		{
			return false;
		}

		this.#replaceCanonicalShare(share);
		this.#linkState = linkState;
		this.#status = share.audience === Audience.SpecificMembers
			? CatalogShareViewState.MemberDraft
			: CatalogShareViewState.Audience;
		this.#errorCode = null;

		return true;
	}

	failLoading(errorCode: string): boolean
	{
		if (this.#status !== CatalogShareViewState.Loading)
		{
			return false;
		}

		this.#status = CatalogShareViewState.LoadError;
		this.#errorCode = errorCode;

		return true;
	}

	retryLoading(): boolean
	{
		if (this.#status !== CatalogShareViewState.LoadError)
		{
			return false;
		}

		this.#status = CatalogShareViewState.Loading;
		this.#errorCode = null;

		return true;
	}

	selectAudience(audience: AudienceValue): boolean
	{
		if (!this.#isAudienceEditable())
		{
			return false;
		}

		if (GLOBAL_AUDIENCES.has(audience) && this.#hasActiveLink())
		{
			this.#pendingAudience = audience;

			return false;
		}

		this.#applyAudience(audience);

		return true;
	}

	confirmLinkRevoke(): boolean
	{
		if (!this.#isAudienceEditable() || this.#pendingAudience === null)
		{
			return false;
		}

		const audience = this.#pendingAudience;
		this.#pendingAudience = null;
		this.#applyAudience(audience);

		return true;
	}

	cancelLinkRevoke(): boolean
	{
		if (this.#pendingAudience === null)
		{
			return false;
		}

		this.#pendingAudience = null;

		return true;
	}

	setMembers(users: CatalogShareParticipant[], departments: CatalogShareParticipant[]): boolean
	{
		if (this.#status !== CatalogShareViewState.MemberDraft || this.#draftShare === null)
		{
			return false;
		}

		const previousMemberCount = this.#getMemberCount();
		this.#specificMembersDraft = {
			audience: Audience.SpecificMembers,
			users: deduplicateParticipants(users),
			departments: deduplicateParticipants(departments),
		};
		this.#draftShare = cloneShare(this.#specificMembersDraft);
		this.#ownerOnlyConfirmationRequired = previousMemberCount > 0 && this.#getMemberCount() === 0;
		this.#errorCode = null;

		return true;
	}

	confirmOwnerOnly(): boolean
	{
		if (!this.#ownerOnlyConfirmationRequired || !this.#isAudienceEditable())
		{
			return false;
		}

		this.#ownerOnlyConfirmationRequired = false;
		this.#applyAudience(Audience.OwnerOnly);

		return true;
	}

	cancelOwnerOnly(): boolean
	{
		if (!this.#ownerOnlyConfirmationRequired)
		{
			return false;
		}

		this.#ownerOnlyConfirmationRequired = false;

		return true;
	}

	setEditableError(errorCode: string): boolean
	{
		if (!this.#isAudienceEditable())
		{
			return false;
		}

		this.#errorCode = errorCode;

		return true;
	}

	beginShareSave(): CatalogShareState
	{
		if (!this.#isAudienceEditable() || this.#draftShare === null)
		{
			throw new Error('SHARE_NOT_EDITABLE');
		}

		if (this.#draftShare.audience === Audience.SpecificMembers && this.#getMemberCount() === 0)
		{
			throw new Error('EMPTY_PARTICIPANTS');
		}

		this.#previousEditableState = this.#status;
		this.#status = CatalogShareViewState.SavingShare;
		this.#errorCode = null;

		return cloneShare(this.#draftShare);
	}

	completeShareSave(share: CatalogShareState): boolean
	{
		if (this.#status !== CatalogShareViewState.SavingShare)
		{
			return false;
		}

		this.#replaceCanonicalShare(share);
		this.#status = CatalogShareViewState.RefreshingLink;

		return true;
	}

	completeLinkRefresh(linkState: CatalogLinkState): boolean
	{
		if (this.#status !== CatalogShareViewState.RefreshingLink)
		{
			return false;
		}

		this.#linkState = linkState;
		this.#status = this.#draftShare?.audience === Audience.SpecificMembers
			? CatalogShareViewState.MemberDraft
			: CatalogShareViewState.Audience;
		this.#previousEditableState = null;

		return true;
	}

	openLinkSettings(now: Date = new Date()): boolean
	{
		if (
			!this.#isAudienceEditable()
			|| this.#linkState?.availability !== LinkAvailability.Available
		)
		{
			return false;
		}

		this.#linkSettingsReturnState = this.#status;
		this.#linkDraft = this.#createLinkDraft(now);
		this.#status = this.#linkState.link === null
			? CatalogShareViewState.GeneratingDefaultLink
			: CatalogShareViewState.LinkSettings;
		this.#errorCode = null;

		return true;
	}

	prepareDefaultLinkGeneration(now: Date = new Date()): SetCatalogLinkPayload
	{
		if (this.#status !== CatalogShareViewState.GeneratingDefaultLink)
		{
			throw new Error('LINK_GENERATION_NOT_ACTIVE');
		}

		return createEnabledLinkPayload(createDefaultLinkExpiry(now), true, now);
	}

	completeDefaultLinkGeneration(linkState: CatalogLinkState, now: Date = new Date()): boolean
	{
		if (this.#status !== CatalogShareViewState.GeneratingDefaultLink)
		{
			return false;
		}

		this.#linkState = linkState;
		this.#linkDraft = this.#createLinkDraft(now);
		this.#status = CatalogShareViewState.LinkSettings;
		this.#errorCode = null;

		return true;
	}

	failDefaultLinkGeneration(errorCode: string): boolean
	{
		if (this.#status !== CatalogShareViewState.GeneratingDefaultLink)
		{
			return false;
		}

		this.#status = CatalogShareViewState.LinkSettings;
		this.#errorCode = errorCode;

		return true;
	}

	closeLinkSettings(): boolean
	{
		if (
			this.#status !== CatalogShareViewState.LinkSettings
			&& this.#status !== CatalogShareViewState.ConfirmAnonymousLink
			&& this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke
		)
		{
			return false;
		}

		this.#status = this.#linkSettingsReturnState ?? CatalogShareViewState.Audience;
		this.#linkSettingsReturnState = null;
		this.#linkDraft = null;
		this.#errorCode = null;

		return true;
	}

	setLinkExpiry(expiresAt: Date): boolean
	{
		if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null)
		{
			return false;
		}

		this.#linkDraft.lastFiniteExpiresAt = new Date(expiresAt.getTime());
		this.#errorCode = null;

		return true;
	}

	setLinkExpiryEnabled(expiryEnabled: boolean): boolean
	{
		if (
			this.#status !== CatalogShareViewState.LinkSettings
			|| this.#linkDraft === null
			|| !Type.isBoolean(expiryEnabled)
		)
		{
			return false;
		}

		this.#linkDraft.expiryEnabled = expiryEnabled;
		this.#errorCode = null;

		return true;
	}

	setLinkRequireB24Auth(requireB24Auth: boolean): boolean
	{
		if (
			this.#status !== CatalogShareViewState.LinkSettings
			|| this.#linkDraft === null
			|| !Type.isBoolean(requireB24Auth)
		)
		{
			return false;
		}

		this.#linkDraft.requireB24Auth = requireB24Auth;
		this.#errorCode = null;

		return true;
	}

	prepareLinkSave(now: Date = new Date()): SetCatalogLinkPayload | null
	{
		if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null)
		{
			throw new Error('LINK_NOT_EDITABLE');
		}

		const payload = createEnabledLinkPayload(
			this.#linkDraft.expiryEnabled ? this.#linkDraft.lastFiniteExpiresAt : null,
			this.#linkDraft.requireB24Auth,
			now,
		);
		if (!payload.requireB24Auth)
		{
			this.#status = CatalogShareViewState.ConfirmAnonymousLink;

			return null;
		}

		this.#startLinkSave();

		return payload;
	}

	confirmAnonymousLinkSave(now: Date = new Date()): SetCatalogLinkPayload
	{
		if (this.#status !== CatalogShareViewState.ConfirmAnonymousLink || this.#linkDraft === null)
		{
			throw new Error('LINK_CONFIRMATION_NOT_ACTIVE');
		}

		const payload = createEnabledLinkPayload(
			this.#linkDraft.expiryEnabled ? this.#linkDraft.lastFiniteExpiresAt : null,
			this.#linkDraft.requireB24Auth,
			now,
		);
		this.#startLinkSave();

		return payload;
	}

	cancelAnonymousLinkSave(): boolean
	{
		if (this.#status !== CatalogShareViewState.ConfirmAnonymousLink)
		{
			return false;
		}

		this.#status = CatalogShareViewState.LinkSettings;

		return true;
	}

	requestPortalLinkRevoke(): boolean
	{
		if (
			this.#status !== CatalogShareViewState.LinkSettings
			|| this.#linkState?.availability !== LinkAvailability.Available
			|| this.#linkState.link === null
		)
		{
			return false;
		}

		this.#status = CatalogShareViewState.ConfirmPortalLinkRevoke;
		this.#errorCode = null;

		return true;
	}

	confirmPortalLinkRevoke(): SetCatalogLinkPayload
	{
		if (this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke)
		{
			throw new Error('LINK_REVOKE_CONFIRMATION_NOT_ACTIVE');
		}

		this.#startLinkSave();

		return { enabled: false };
	}

	cancelPortalLinkRevoke(): boolean
	{
		if (this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke)
		{
			return false;
		}

		this.#status = CatalogShareViewState.LinkSettings;

		return true;
	}

	setLinkSettingsError(errorCode: string): boolean
	{
		if (this.#status !== CatalogShareViewState.LinkSettings)
		{
			return false;
		}

		this.#errorCode = errorCode;

		return true;
	}

	completeLinkSave(linkState: CatalogLinkState): boolean
	{
		if (this.#status !== CatalogShareViewState.SavingLink)
		{
			return false;
		}

		this.#linkState = linkState;
		this.#status = CatalogShareViewState.LinkSettings;
		if (linkState.link !== null)
		{
			const lastFiniteExpiresAt = linkState.link.expiresAt === null
				? this.#linkDraft?.lastFiniteExpiresAt ?? createDefaultLinkExpiry()
				: new Date(linkState.link.expiresAt);
			this.#linkDraft = {
				expiryEnabled: linkState.link.expiresAt !== null,
				lastFiniteExpiresAt,
				requireB24Auth: linkState.link.requireB24Auth,
			};
		}
		this.#previousEditableState = null;

		return true;
	}

	failSaving(errorCode: string): boolean
	{
		if (
			this.#status !== CatalogShareViewState.SavingShare
			&& this.#status !== CatalogShareViewState.RefreshingLink
			&& this.#status !== CatalogShareViewState.SavingLink
		)
		{
			return false;
		}

		this.#status = this.#previousEditableState ?? CatalogShareViewState.Audience;
		this.#previousEditableState = null;
		this.#errorCode = errorCode;

		return true;
	}

	close(): void
	{
		this.#status = CatalogShareViewState.Closed;
		this.#pendingAudience = null;
		this.#ownerOnlyConfirmationRequired = false;
		this.#linkSettingsReturnState = null;
		this.#linkDraft = null;
	}

	#replaceCanonicalShare(share: CatalogShareState): void
	{
		this.#share = share;
		this.#draftShare = cloneShare(share);
		this.#specificMembersDraft = {
			audience: Audience.SpecificMembers,
			users: share.audience === Audience.SpecificMembers ? cloneParticipants(share.users) : [],
			departments: share.audience === Audience.SpecificMembers ? cloneParticipants(share.departments) : [],
		};
		this.#pendingAudience = null;
		this.#ownerOnlyConfirmationRequired = false;
	}

	#applyAudience(audience: AudienceValue): void
	{
		const keepMembers = audience === Audience.SpecificMembers;
		if (this.#draftShare?.audience === Audience.SpecificMembers)
		{
			this.#specificMembersDraft = cloneShare(this.#draftShare);
		}

		this.#draftShare = {
			audience,
			users: keepMembers ? cloneParticipants(this.#specificMembersDraft.users) : [],
			departments: keepMembers ? cloneParticipants(this.#specificMembersDraft.departments) : [],
		};
		this.#status = keepMembers ? CatalogShareViewState.MemberDraft : CatalogShareViewState.Audience;
		this.#errorCode = null;
		this.#ownerOnlyConfirmationRequired = false;
	}

	#isAudienceEditable(): boolean
	{
		return this.#status === CatalogShareViewState.Audience || this.#status === CatalogShareViewState.MemberDraft;
	}

	#isShareDraftDirty(): boolean
	{
		if (this.#share === null || this.#draftShare === null)
		{
			return false;
		}

		if (this.#share.audience !== this.#draftShare.audience)
		{
			return true;
		}

		if (this.#draftShare.audience !== Audience.SpecificMembers)
		{
			return false;
		}

		return !haveSameParticipantIds(this.#share.users, this.#draftShare.users)
			|| !haveSameParticipantIds(this.#share.departments, this.#draftShare.departments);
	}

	#hasActiveLink(): boolean
	{
		return this.#linkState?.availability === LinkAvailability.Available && this.#linkState.link !== null;
	}

	#getMemberCount(): number
	{
		return (this.#draftShare?.users.length ?? 0) + (this.#draftShare?.departments.length ?? 0);
	}

	#createLinkDraft(now: Date): CatalogLinkDraft
	{
		const link = this.#linkState?.link;
		if (link !== null && link !== undefined)
		{
			return {
				expiryEnabled: link.expiresAt !== null,
				lastFiniteExpiresAt: link.expiresAt === null
					? createDefaultLinkExpiry(now)
					: new Date(link.expiresAt),
				requireB24Auth: link.requireB24Auth,
			};
		}

		return {
			expiryEnabled: true,
			lastFiniteExpiresAt: createDefaultLinkExpiry(now),
			requireB24Auth: true,
		};
	}

	#isLinkDraftDirty(): boolean
	{
		if (this.#linkDraft === null || this.#linkState?.link === null || this.#linkState?.link === undefined)
		{
			return this.#linkDraft !== null;
		}

		const canonicalLink = this.#linkState.link;
		if (canonicalLink.requireB24Auth !== this.#linkDraft.requireB24Auth)
		{
			return true;
		}

		if (canonicalLink.expiresAt === null)
		{
			return this.#linkDraft.expiryEnabled;
		}

		return !this.#linkDraft.expiryEnabled
			|| new Date(canonicalLink.expiresAt).getTime() !== this.#linkDraft.lastFiniteExpiresAt.getTime();
	}

	#startLinkSave(): void
	{
		this.#previousEditableState = CatalogShareViewState.LinkSettings;
		this.#status = CatalogShareViewState.SavingLink;
		this.#errorCode = null;
	}
}
