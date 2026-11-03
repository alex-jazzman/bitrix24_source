/**
 * @module vibecode/catalog/share/src/share-state
 */
jn.define('vibecode/catalog/share/src/share-state', (require, exports, module) => {
	// A leaf on purpose: no imports, no native calls, no notion of "now". The accio unit suite
	// pulls this file straight into the sandbox, where nothing of the extension environment
	// exists. Time that affects a result arrives as a parameter.

	const Audience = Object.freeze({
		OwnerOnly: 'OWNER_ONLY',
		SpecificMembers: 'SPECIFIC_MEMBERS',
		Portal: 'PORTAL',
		Authenticated: 'AUTHENTICATED',
		Public: 'PUBLIC',
	});

	const LinkAvailability = Object.freeze({
		Available: 'AVAILABLE',
		Unavailable: 'UNAVAILABLE',
	});

	const LinkUnavailableReason = Object.freeze({
		DirectGlobalAccess: 'DIRECT_GLOBAL_ACCESS',
	});

	const ShareViewStatus = Object.freeze({
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

	/** The expiry bounds live here alone: the date picker takes them from this module. */
	const LINK_EXPIRY_MIN_OFFSET_SECONDS = 5 * 60;
	const LINK_EXPIRY_MAX_OFFSET_SECONDS = 315_360_000;

	const GLOBAL_AUDIENCES = new Set([
		Audience.Authenticated,
		Audience.Public,
	]);

	const BUSY_STATUSES = new Set([
		ShareViewStatus.Loading,
		ShareViewStatus.SavingShare,
		ShareViewStatus.RefreshingLink,
		ShareViewStatus.GeneratingDefaultLink,
		ShareViewStatus.SavingLink,
	]);

	const EDITABLE_STATUSES = new Set([
		ShareViewStatus.Audience,
		ShareViewStatus.MemberDraft,
	]);

	const SAVING_STATUSES = new Set([
		ShareViewStatus.SavingShare,
		ShareViewStatus.RefreshingLink,
		ShareViewStatus.SavingLink,
	]);

	const LINK_SETTINGS_STATUSES = new Set([
		ShareViewStatus.LinkSettings,
		ShareViewStatus.ConfirmAnonymousLink,
		ShareViewStatus.ConfirmPortalLinkRevoke,
	]);

	/**
	 * @param {ShareParticipant[]} participants
	 * @return {ShareParticipant[]}
	 */
	const cloneParticipants = (participants) => participants.map((participant) => ({ ...participant }));

	/**
	 * @param {SharePayload} share
	 * @return {SharePayload}
	 */
	const cloneShare = (share) => ({
		audience: share.audience,
		users: cloneParticipants(share.users),
		departments: cloneParticipants(share.departments),
	});

	/**
	 * @param {ShareParticipant[]} participants
	 * @return {ShareParticipant[]} the first occurrence of every identifier, in the original order
	 */
	const deduplicateParticipants = (participants) => {
		const uniqueParticipants = new Map();

		participants.forEach((participant) => {
			const id = String(participant.id);
			if (!uniqueParticipants.has(id))
			{
				uniqueParticipants.set(id, { id, name: participant.name });
			}
		});

		return [...uniqueParticipants.values()];
	};

	/**
	 * @param {ShareParticipant[]} left
	 * @param {ShareParticipant[]} right
	 * @return {boolean} true when both sides hold the same identifiers, whatever their order and names
	 */
	const haveSameParticipantIds = (left, right) => {
		if (left.length !== right.length)
		{
			return false;
		}

		const rightIds = new Set(right.map((participant) => String(participant.id)));

		return left.every((participant) => rightIds.has(String(participant.id)));
	};

	/**
	 * @return {SharePayload}
	 */
	const createEmptyMembersDraft = () => ({
		audience: Audience.SpecificMembers,
		users: [],
		departments: [],
	});

	/**
	 * The same day of the next month, UTC. A day missing from the target month is clamped to its last day.
	 *
	 * @param {Date} now
	 * @return {Date}
	 */
	const createDefaultLinkExpiry = (now) => {
		const expiry = new Date(now.getTime());
		const day = expiry.getUTCDate();

		expiry.setUTCDate(1);
		expiry.setUTCMonth(expiry.getUTCMonth() + 1);
		const lastDayOfTargetMonth = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0))
			.getUTCDate()
		;
		expiry.setUTCDate(Math.min(day, lastDayOfTargetMonth));

		return expiry;
	};

	/**
	 * Both bounds are inclusive: exactly five minutes and exactly ten years pass.
	 *
	 * @param {Date|null} expiresAt null for a permanent link, which is not bound-checked at all
	 * @param {boolean} requireB24Auth
	 * @param {Date} now
	 * @return {SetLinkPayload}
	 * @throws {Error} LINK_EXPIRY_TOO_SOON, LINK_EXPIRY_TOO_LATE
	 */
	const createEnabledLinkPayload = (expiresAt, requireB24Auth, now) => {
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
	};

	/**
	 * Rules of the sharing screen: the single place where the mobile client decides what is
	 * allowed, what counts as changed and what has to be confirmed. Knows nothing about the
	 * network, the layout and the native APIs; the sheets only render its snapshot.
	 */
	class VibeCodeCatalogShareStateMachine
	{
		/** @type {ShareViewStatus} */
		#status = ShareViewStatus.Loading;

		/** @type {SharePayload|null} */
		#share = null;

		/** @type {SharePayload|null} */
		#draftShare = null;

		/**
		 * Survives a trip to another audience and back.
		 *
		 * @type {SharePayload}
		 */
		#specificMembersDraft = createEmptyMembersDraft();

		/** @type {LinkState|null} */
		#linkState = null;

		/** @type {LinkDraft|null} */
		#linkDraft = null;

		/** @type {string|null} */
		#errorCode = null;

		/** @type {Audience|null} */
		#pendingAudience = null;

		#ownerOnlyConfirmationRequired = false;

		/**
		 * The composition as it was right before it emptied. The question about it is what keeps it
		 * alive: an answer of "no" gives it back, any other end of the question drops it.
		 *
		 * @type {SharePayload|null}
		 */
		#membersBeforeOwnerOnly = null;

		/** @type {ShareViewStatus|null} */
		#previousEditableStatus = null;

		/**
		 * The audience status to come back to when the link settings are left.
		 *
		 * @type {ShareViewStatus|null}
		 */
		#linkSettingsReturnStatus = null;

		/**
		 * @return {ShareSnapshot}
		 */
		getSnapshot()
		{
			return Object.freeze({
				status: this.#status,
				share: this.#share,
				draftShare: this.#draftShare === null ? null : cloneShare(this.#draftShare),
				linkState: this.#linkState,
				linkDraft: this.#cloneLinkDraft(),
				isShareDraftDirty: this.#isShareDraftDirty(),
				isLinkDraftDirty: this.#isLinkDraftDirty(),
				pendingAudience: this.#pendingAudience,
				ownerOnlyConfirmationRequired: this.#ownerOnlyConfirmationRequired,
				errorCode: this.#errorCode,
			});
		}

		/**
		 * @return {boolean}
		 */
		beginLoading()
		{
			if (BUSY_STATUSES.has(this.#status) || this.#status === ShareViewStatus.Closed)
			{
				return false;
			}

			this.#status = ShareViewStatus.Loading;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {SharePayload} share
		 * @param {LinkState} linkState
		 * @return {boolean}
		 */
		completeLoading(share, linkState)
		{
			if (this.#status !== ShareViewStatus.Loading)
			{
				return false;
			}

			this.#replaceCanonicalShare(share);
			this.#linkState = linkState;
			this.#status = this.#statusForAudience(share.audience);
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {string} errorCode
		 * @return {boolean}
		 */
		failLoading(errorCode)
		{
			if (this.#status !== ShareViewStatus.Loading)
			{
				return false;
			}

			this.#status = ShareViewStatus.LoadError;
			this.#errorCode = errorCode;

			return true;
		}

		/**
		 * @return {boolean}
		 */
		retryLoading()
		{
			if (this.#status !== ShareViewStatus.LoadError)
			{
				return false;
			}

			this.#status = ShareViewStatus.Loading;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {Audience} audience
		 * @return {boolean} false when the choice is postponed until a confirmation or refused
		 */
		selectAudience(audience)
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

		/**
		 * @return {boolean}
		 */
		confirmLinkRevoke()
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

		/**
		 * @return {boolean}
		 */
		cancelLinkRevoke()
		{
			if (this.#pendingAudience === null)
			{
				return false;
			}

			this.#pendingAudience = null;

			return true;
		}

		/**
		 * @param {ShareParticipant[]} users
		 * @param {ShareParticipant[]} departments
		 * @return {boolean}
		 */
		setMembers(users, departments)
		{
			if (this.#status !== ShareViewStatus.MemberDraft || this.#draftShare === null)
			{
				return false;
			}

			const previousMembers = cloneShare(this.#draftShare);
			const previousMemberCount = this.#getMemberCount();
			this.#specificMembersDraft = {
				audience: Audience.SpecificMembers,
				users: deduplicateParticipants(users),
				departments: deduplicateParticipants(departments),
			};
			this.#draftShare = cloneShare(this.#specificMembersDraft);
			this.#askOwnerOnly(
				previousMemberCount > 0 && this.#getMemberCount() === 0 ? previousMembers : null,
			);
			this.#errorCode = null;

			return true;
		}

		/**
		 * @return {boolean}
		 */
		confirmOwnerOnly()
		{
			if (!this.#ownerOnlyConfirmationRequired || !this.#isAudienceEditable())
			{
				return false;
			}

			this.#askOwnerOnly(null);
			this.#applyAudience(Audience.OwnerOnly);

			return true;
		}

		/**
		 * @return {boolean}
		 */
		cancelOwnerOnly()
		{
			if (!this.#ownerOnlyConfirmationRequired)
			{
				return false;
			}

			const membersBefore = this.#membersBeforeOwnerOnly;

			this.#askOwnerOnly(null);

			if (membersBefore !== null)
			{
				this.#specificMembersDraft = cloneShare(membersBefore);
				this.#draftShare = cloneShare(membersBefore);
			}

			return true;
		}

		/**
		 * @param {string} errorCode
		 * @return {boolean}
		 */
		setEditableError(errorCode)
		{
			if (!this.#isAudienceEditable())
			{
				return false;
			}

			this.#errorCode = errorCode;

			return true;
		}

		/**
		 * @return {SharePayload} the access to send to the server
		 * @throws {Error} SHARE_NOT_EDITABLE, EMPTY_PARTICIPANTS
		 */
		beginShareSave()
		{
			if (!this.#isAudienceEditable() || this.#draftShare === null)
			{
				throw new Error('SHARE_NOT_EDITABLE');
			}

			if (this.#draftShare.audience === Audience.SpecificMembers && this.#getMemberCount() === 0)
			{
				throw new Error('EMPTY_PARTICIPANTS');
			}

			this.#previousEditableStatus = this.#status;
			this.#status = ShareViewStatus.SavingShare;
			this.#errorCode = null;

			return cloneShare(this.#draftShare);
		}

		/**
		 * @param {SharePayload} share
		 * @return {boolean}
		 */
		completeShareSave(share)
		{
			if (this.#status !== ShareViewStatus.SavingShare)
			{
				return false;
			}

			this.#replaceCanonicalShare(share);
			this.#status = ShareViewStatus.RefreshingLink;

			return true;
		}

		/**
		 * @param {LinkState} linkState
		 * @return {boolean}
		 */
		completeLinkRefresh(linkState)
		{
			if (this.#status !== ShareViewStatus.RefreshingLink)
			{
				return false;
			}

			this.#linkState = linkState;
			this.#status = this.#statusForAudience(this.#draftShare?.audience);
			this.#previousEditableStatus = null;

			return true;
		}

		/**
		 * @param {Date} now
		 * @return {boolean} false when the link is unavailable for the current audience
		 */
		openLinkSettings(now)
		{
			if (!this.#isAudienceEditable() || this.#linkState?.availability !== LinkAvailability.Available)
			{
				return false;
			}

			this.#linkSettingsReturnStatus = this.#status;
			this.#linkDraft = this.#createLinkDraft(now);
			this.#status = this.#linkState.link === null
				? ShareViewStatus.GeneratingDefaultLink
				: ShareViewStatus.LinkSettings;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {Date} now
		 * @return {SetLinkPayload} the link to create for an audience that has none yet
		 * @throws {Error} LINK_GENERATION_NOT_ACTIVE
		 */
		prepareDefaultLinkGeneration(now)
		{
			if (this.#status !== ShareViewStatus.GeneratingDefaultLink)
			{
				throw new Error('LINK_GENERATION_NOT_ACTIVE');
			}

			return createEnabledLinkPayload(createDefaultLinkExpiry(now), true, now);
		}

		/**
		 * @param {LinkState} linkState
		 * @param {Date} now
		 * @return {boolean}
		 */
		completeDefaultLinkGeneration(linkState, now)
		{
			if (this.#status !== ShareViewStatus.GeneratingDefaultLink)
			{
				return false;
			}

			this.#linkState = linkState;
			this.#linkDraft = this.#createLinkDraft(now);
			this.#status = ShareViewStatus.LinkSettings;
			this.#errorCode = null;

			return true;
		}

		/**
		 * A failed generation keeps the user in the link settings with the error, it does not throw them
		 * back to the audience screen.
		 *
		 * @param {string} errorCode
		 * @return {boolean}
		 */
		failDefaultLinkGeneration(errorCode)
		{
			if (this.#status !== ShareViewStatus.GeneratingDefaultLink)
			{
				return false;
			}

			this.#status = ShareViewStatus.LinkSettings;
			this.#errorCode = errorCode;

			return true;
		}

		/**
		 * @return {boolean}
		 */
		closeLinkSettings()
		{
			if (!LINK_SETTINGS_STATUSES.has(this.#status))
			{
				return false;
			}

			this.#status = this.#linkSettingsReturnStatus ?? ShareViewStatus.Audience;
			this.#linkSettingsReturnStatus = null;
			this.#linkDraft = null;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {Date} expiresAt
		 * @return {boolean}
		 */
		setLinkExpiry(expiresAt)
		{
			if (!this.#isLinkDraftEditable())
			{
				return false;
			}

			this.#linkDraft.lastFiniteExpiresAt = new Date(expiresAt.getTime());
			this.#errorCode = null;

			return true;
		}

		/**
		 * Switching the expiry off keeps the last finite value: switching it back on restores that value.
		 *
		 * @param {boolean} expiryEnabled
		 * @return {boolean}
		 */
		setLinkExpiryEnabled(expiryEnabled)
		{
			// A leaf module has no stdlib at hand, hence the bare typeof instead of Type.isBoolean.
			if (!this.#isLinkDraftEditable() || typeof expiryEnabled !== 'boolean')
			{
				return false;
			}

			this.#linkDraft.expiryEnabled = expiryEnabled;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {boolean} requireB24Auth
		 * @return {boolean}
		 */
		setLinkRequireB24Auth(requireB24Auth)
		{
			if (!this.#isLinkDraftEditable() || typeof requireB24Auth !== 'boolean')
			{
				return false;
			}

			this.#linkDraft.requireB24Auth = requireB24Auth;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @param {Date} now
		 * @return {SetLinkPayload|null} null when anonymous access has to be confirmed first
		 * @throws {Error} LINK_NOT_EDITABLE, LINK_EXPIRY_TOO_SOON, LINK_EXPIRY_TOO_LATE
		 */
		prepareLinkSave(now)
		{
			if (!this.#isLinkDraftEditable())
			{
				throw new Error('LINK_NOT_EDITABLE');
			}

			const payload = this.#createDraftLinkPayload(now);
			if (!payload.requireB24Auth)
			{
				this.#status = ShareViewStatus.ConfirmAnonymousLink;

				return null;
			}

			this.#startLinkSave();

			return payload;
		}

		/**
		 * @param {Date} now
		 * @return {SetLinkPayload}
		 * @throws {Error} LINK_CONFIRMATION_NOT_ACTIVE, LINK_EXPIRY_TOO_SOON, LINK_EXPIRY_TOO_LATE
		 */
		confirmAnonymousLinkSave(now)
		{
			if (this.#status !== ShareViewStatus.ConfirmAnonymousLink || this.#linkDraft === null)
			{
				throw new Error('LINK_CONFIRMATION_NOT_ACTIVE');
			}

			const payload = this.#createDraftLinkPayload(now);
			this.#startLinkSave();

			return payload;
		}

		/**
		 * Refusing the confirmation does not put the authentication requirement back into the draft:
		 * the switch stays off, only the save is cancelled.
		 *
		 * @return {boolean}
		 */
		cancelAnonymousLinkSave()
		{
			if (this.#status !== ShareViewStatus.ConfirmAnonymousLink)
			{
				return false;
			}

			this.#status = ShareViewStatus.LinkSettings;

			return true;
		}

		/**
		 * @return {boolean}
		 */
		requestPortalLinkRevoke()
		{
			if (
				this.#status !== ShareViewStatus.LinkSettings
				|| this.#linkState?.availability !== LinkAvailability.Available
				|| this.#linkState.link === null
			)
			{
				return false;
			}

			this.#status = ShareViewStatus.ConfirmPortalLinkRevoke;
			this.#errorCode = null;

			return true;
		}

		/**
		 * @return {SetLinkPayload}
		 * @throws {Error} LINK_REVOKE_CONFIRMATION_NOT_ACTIVE
		 */
		confirmPortalLinkRevoke()
		{
			if (this.#status !== ShareViewStatus.ConfirmPortalLinkRevoke)
			{
				throw new Error('LINK_REVOKE_CONFIRMATION_NOT_ACTIVE');
			}

			this.#startLinkSave();

			return { enabled: false };
		}

		/**
		 * @return {boolean}
		 */
		cancelPortalLinkRevoke()
		{
			if (this.#status !== ShareViewStatus.ConfirmPortalLinkRevoke)
			{
				return false;
			}

			this.#status = ShareViewStatus.LinkSettings;

			return true;
		}

		/**
		 * @param {string} errorCode
		 * @return {boolean}
		 */
		setLinkSettingsError(errorCode)
		{
			if (this.#status !== ShareViewStatus.LinkSettings)
			{
				return false;
			}

			this.#errorCode = errorCode;

			return true;
		}

		/**
		 * @param {LinkState} linkState
		 * @param {Date} now
		 * @return {boolean}
		 */
		completeLinkSave(linkState, now)
		{
			if (this.#status !== ShareViewStatus.SavingLink)
			{
				return false;
			}

			this.#linkState = linkState;
			this.#status = ShareViewStatus.LinkSettings;
			if (linkState.link !== null)
			{
				// A link saved as permanent keeps the finite value the user had picked before.
				this.#linkDraft = this.#createDraftForLink(
					linkState.link,
					this.#linkDraft?.lastFiniteExpiresAt ?? createDefaultLinkExpiry(now),
				);
			}
			this.#previousEditableStatus = null;

			return true;
		}

		/**
		 * @param {string} errorCode
		 * @return {boolean}
		 */
		failSaving(errorCode)
		{
			if (!SAVING_STATUSES.has(this.#status))
			{
				return false;
			}

			if (this.#status === ShareViewStatus.RefreshingLink)
			{
				// The audience is stored and the server may have revoked the link along with it, so what
				// the client still holds describes the audience from before the save. An unread state is
				// no state: it is dropped instead of being offered for copying.
				this.#linkState = null;
			}

			this.#status = this.#previousEditableStatus ?? ShareViewStatus.Audience;
			this.#previousEditableStatus = null;
			this.#errorCode = errorCode;

			return true;
		}

		/**
		 * @return {void}
		 */
		close()
		{
			this.#status = ShareViewStatus.Closed;
			this.#pendingAudience = null;
			this.#askOwnerOnly(null);
			this.#linkSettingsReturnStatus = null;
			this.#linkDraft = null;
		}

		/**
		 * @param {SharePayload} share
		 * @return {void}
		 */
		#replaceCanonicalShare(share)
		{
			const keepMembers = share.audience === Audience.SpecificMembers;

			this.#share = share;
			this.#draftShare = cloneShare(share);
			this.#specificMembersDraft = {
				audience: Audience.SpecificMembers,
				users: keepMembers ? cloneParticipants(share.users) : [],
				departments: keepMembers ? cloneParticipants(share.departments) : [],
			};
			this.#pendingAudience = null;
			this.#askOwnerOnly(null);
		}

		/**
		 * @param {Audience} audience
		 * @return {void}
		 */
		#applyAudience(audience)
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
			this.#status = this.#statusForAudience(audience);
			this.#errorCode = null;
			this.#askOwnerOnly(null);
		}

		/**
		 * The question and the composition it is about are one thing: they are raised and dropped
		 * together, so no answer can ever restore a composition from a question already answered.
		 *
		 * @param {SharePayload|null} membersBefore
		 * @return {void}
		 */
		#askOwnerOnly(membersBefore)
		{
			this.#ownerOnlyConfirmationRequired = membersBefore !== null;
			this.#membersBeforeOwnerOnly = membersBefore;
		}

		/**
		 * @param {Audience} [audience]
		 * @return {ShareViewStatus}
		 */
		#statusForAudience(audience)
		{
			return audience === Audience.SpecificMembers ? ShareViewStatus.MemberDraft : ShareViewStatus.Audience;
		}

		/**
		 * @return {boolean}
		 */
		#isAudienceEditable()
		{
			return EDITABLE_STATUSES.has(this.#status);
		}

		/**
		 * @return {boolean}
		 */
		#isShareDraftDirty()
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
				|| !haveSameParticipantIds(this.#share.departments, this.#draftShare.departments)
			;
		}

		/**
		 * @return {boolean}
		 */
		#isLinkDraftEditable()
		{
			return this.#status === ShareViewStatus.LinkSettings && this.#linkDraft !== null;
		}

		/**
		 * @param {Date} now
		 * @return {LinkDraft} the settings of the canonical link, or the defaults when there is none
		 */
		#createLinkDraft(now)
		{
			const link = this.#linkState?.link ?? null;
			if (link === null)
			{
				return {
					expiryEnabled: true,
					lastFiniteExpiresAt: createDefaultLinkExpiry(now),
					requireB24Auth: true,
				};
			}

			return this.#createDraftForLink(link, createDefaultLinkExpiry(now));
		}

		/**
		 * @param {PortalLink} link
		 * @param {Date} fallbackFiniteExpiresAt the finite value to keep for a permanent link
		 * @return {LinkDraft}
		 */
		#createDraftForLink(link, fallbackFiniteExpiresAt)
		{
			return {
				expiryEnabled: link.expiresAt !== null,
				lastFiniteExpiresAt: link.expiresAt === null
					? fallbackFiniteExpiresAt
					: new Date(link.expiresAt),
				requireB24Auth: link.requireB24Auth,
			};
		}

		/**
		 * @return {LinkDraft|null}
		 */
		#cloneLinkDraft()
		{
			if (this.#linkDraft === null)
			{
				return null;
			}

			return {
				expiryEnabled: this.#linkDraft.expiryEnabled,
				lastFiniteExpiresAt: new Date(this.#linkDraft.lastFiniteExpiresAt.getTime()),
				requireB24Auth: this.#linkDraft.requireB24Auth,
			};
		}

		/**
		 * @param {Date} now
		 * @return {SetLinkPayload}
		 * @throws {Error} LINK_EXPIRY_TOO_SOON, LINK_EXPIRY_TOO_LATE
		 */
		#createDraftLinkPayload(now)
		{
			return createEnabledLinkPayload(
				this.#linkDraft.expiryEnabled ? this.#linkDraft.lastFiniteExpiresAt : null,
				this.#linkDraft.requireB24Auth,
				now,
			);
		}

		/**
		 * @return {void}
		 */
		#startLinkSave()
		{
			this.#previousEditableStatus = ShareViewStatus.LinkSettings;
			this.#status = ShareViewStatus.SavingLink;
			this.#errorCode = null;
		}

		/**
		 * A draft with no canonical link to compare against is a change by itself.
		 *
		 * @return {boolean}
		 */
		#isLinkDraftDirty()
		{
			const canonicalLink = this.#linkState?.link ?? null;
			if (this.#linkDraft === null || canonicalLink === null)
			{
				return this.#linkDraft !== null;
			}

			if (canonicalLink.requireB24Auth !== this.#linkDraft.requireB24Auth)
			{
				return true;
			}

			if (canonicalLink.expiresAt === null)
			{
				return this.#linkDraft.expiryEnabled;
			}

			return !this.#linkDraft.expiryEnabled
				|| new Date(canonicalLink.expiresAt).getTime() !== this.#linkDraft.lastFiniteExpiresAt.getTime()
			;
		}

		/**
		 * @return {boolean}
		 */
		#hasActiveLink()
		{
			return this.#linkState?.availability === LinkAvailability.Available && this.#linkState.link !== null;
		}

		/**
		 * @return {number}
		 */
		#getMemberCount()
		{
			return (this.#draftShare?.users.length ?? 0) + (this.#draftShare?.departments.length ?? 0);
		}
	}

	module.exports = {
		Audience,
		LinkAvailability,
		LinkUnavailableReason,
		ShareViewStatus,
		LINK_EXPIRY_MIN_OFFSET_SECONDS,
		LINK_EXPIRY_MAX_OFFSET_SECONDS,
		createDefaultLinkExpiry,
		createEnabledLinkPayload,
		VibeCodeCatalogShareStateMachine,
	};
});
