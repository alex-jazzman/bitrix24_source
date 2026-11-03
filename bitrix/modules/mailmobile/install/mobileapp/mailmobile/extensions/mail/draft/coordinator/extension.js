/**
 * @module mail/draft/coordinator
 */
jn.define('mail/draft/coordinator', (require, exports, module) => {
	const REVISION_CONFLICT = 'DRAFT_REVISION_CONFLICT';
	const DEFAULT_DEBOUNCE_MS = 1000;

	class DraftCoordinator
	{
		/**
		 * @param {DraftCoordinatorOptions} options
		 */
		constructor(options)
		{
			this.connector = options.connector;
			this.draftId = options.draftId ?? null;
			this.revision = options.revision ?? null;
			this.clientId = options.clientId ?? null;
			this.onForeignConflict = options.onForeignConflict ?? (() => {});
			this.onSaved = options.onSaved ?? (() => {});
			this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
			this.scheduler = options.scheduler ?? {
				setTimeout: (callback, timeout) => setTimeout(callback, timeout),
				clearTimeout: (timerId) => clearTimeout(timerId),
			};
			this.fingerprint = options.fingerprint ?? ((snapshot) => JSON.stringify(snapshot));
			this.unsubscribe = options.unsubscribe ?? [];
			this.pending = null;
			this.inFlight = null;
			this.timerId = null;
			this.acceptedFingerprint = options.acceptedSnapshot
				? this.fingerprint(options.acceptedSnapshot)
				: null
			;
			this.destroyed = false;
			this.closed = false;
			this.abandoned = false;
		}

		/** @param {() => DraftSnapshot} snapshotFactory */
		markChanged(snapshotFactory)
		{
			if (this.destroyed || this.closed)
			{
				return;
			}

			this.pending = {
				snapshotFactory,
				snapshot: null,
				fingerprint: null,
				conflictRetryCount: 0,
			};
			this.#cancelTimer();
			this.timerId = this.scheduler.setTimeout(() => {
				this.timerId = null;
				this.#drain().catch(() => {});
			}, this.debounceMs);
		}

		cancelPending()
		{
			this.#cancelTimer();
			this.pending = null;
		}

		flush()
		{
			if (this.destroyed)
			{
				return Promise.resolve(this.revision);
			}

			this.#cancelTimer();

			return this.#drain();
		}

		saveBestEffort()
		{
			if (this.destroyed)
			{
				return;
			}

			this.#cancelTimer();
			this.#drain().catch(() => {});
		}

		getDraftId()
		{
			return this.draftId;
		}

		getRevision()
		{
			return this.revision;
		}

		hasInFlightSave()
		{
			return this.inFlight !== null;
		}

		/**
		 * Whether this compose attempt has lost its draft to another one. An abandoned attempt keeps no
		 * draft identity, so nothing can be saved into that draft, deleted or completed under it.
		 */
		isAbandoned()
		{
			return this.abandoned;
		}

		/**
		 * Lets the queued snapshot reach the server and only then stops the coordinator. A change made
		 * while an autosave was in flight is still waiting for it, and `destroy()` on its own drops that
		 * change: the form is being removed, so there is nobody left to retry the save.
		 */
		saveAndDestroy()
		{
			if (this.destroyed)
			{
				return Promise.resolve(this.revision);
			}

			this.closed = true;
			this.#cancelTimer();

			return this.#drain()
				.catch(() => this.revision)
				.then((revision) => {
					this.destroy();

					return revision;
				})
			;
		}

		destroy()
		{
			if (this.destroyed)
			{
				return;
			}

			this.destroyed = true;
			this.#cancelTimer();
			this.pending = null;
			this.unsubscribe.forEach((callback) => callback());
			this.unsubscribe = [];
		}

		#cancelTimer()
		{
			if (this.timerId !== null)
			{
				this.scheduler.clearTimeout(this.timerId);
				this.timerId = null;
			}
		}

		#drain()
		{
			if (this.destroyed)
			{
				return Promise.resolve(this.revision);
			}

			if (this.inFlight)
			{
				return this.inFlight.then(() => this.#drain());
			}

			if (!this.pending)
			{
				return Promise.resolve(this.revision);
			}

			const saving = this.pending;
			this.pending = null;

			// The snapshot is built here and not when the change was marked: a save that completed in the
			// meantime could have recreated the attachment bindings the snapshot has to refer to.
			saving.snapshot = saving.snapshotFactory();
			saving.fingerprint = this.fingerprint(saving.snapshot);

			if (saving.fingerprint === this.acceptedFingerprint)
			{
				return this.#drain();
			}

			const request = this.connector.save({
				draftId: this.draftId,
				revision: this.revision,
				snapshot: saving.snapshot,
			});

			this.inFlight = request
				.then((response) => {
					if (!this.destroyed)
					{
						this.#accept(response?.data?.draft, saving.fingerprint, saving.snapshot);
					}

					return this.revision;
				})
				.catch(async (error) => {
					if (this.destroyed)
					{
						return this.revision;
					}

					if (!this.#isRevisionConflict(error))
					{
						this.pending = this.pending ?? saving;

						throw error;
					}
					if (saving.conflictRetryCount >= 1)
					{
						this.pending = this.pending ?? saving;

						throw error;
					}

					let currentResponse;
					try
					{
						currentResponse = await this.connector.getCurrent(this.draftId);
					}
					catch (getCurrentError)
					{
						this.pending = this.pending ?? saving;

						throw getCurrentError;
					}

					const currentDraft = currentResponse?.data?.draft;
					if (!currentDraft)
					{
						// The draft was removed by another client; drop the stale identity so the
						// next save recreates it instead of looping on a missing revision.
						this.draftId = null;
						this.revision = null;
						saving.conflictRetryCount++;
						this.pending = this.pending ?? saving;

						return this.revision;
					}

					if (this.#isForeignDraft(currentDraft))
					{
						// Another compose attempt owns the context draft (one draft per context is
						// enforced server-side). This attempt is over: keeping the foreign identity
						// would let a later save, delete or completion hit the work of that attempt.
						this.#abandon();
						this.onForeignConflict();

						return this.revision;
					}

					this.draftId = currentDraft.id;
					this.revision = currentDraft.revision;
					saving.conflictRetryCount++;
					this.pending = this.pending ?? saving;

					return this.revision;
				})
				.finally(() => {
					this.inFlight = null;
				})
			;

			return this.inFlight.then(() => this.#drain());
		}

		/**
		 * The draft belongs to another compose attempt: the identity is released and the coordinator
		 * stops for good, so no request of this form can carry the identifier of that attempt.
		 */
		#abandon()
		{
			this.abandoned = true;
			this.draftId = null;
			this.revision = null;
			this.acceptedFingerprint = null;
			this.destroy();
		}

		#accept(draft, fingerprint, snapshot)
		{
			if (!draft)
			{
				return;
			}

			const created = this.draftId === null;
			this.draftId = draft.id;
			this.revision = draft.revision;
			this.acceptedFingerprint = fingerprint;
			this.onSaved(draft, snapshot, { created });
		}

		#isForeignDraft(currentDraft)
		{
			const currentClientId = currentDraft?.snapshot?.clientId ?? null;

			return Boolean(this.clientId)
				&& Boolean(currentClientId)
				&& currentClientId !== this.clientId
			;
		}

		#isRevisionConflict(response)
		{
			return (response?.errors ?? []).some(({ code }) => code === REVISION_CONFLICT);
		}
	}

	module.exports = { DraftCoordinator };
});
