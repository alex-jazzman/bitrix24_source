/**
 * @module mail/large-attachment/coordinator
 */
jn.define('mail/large-attachment/coordinator', (require, exports, module) => {
	const { LargeAttachmentErrorState, runWithConcurrencyLimit } = require('mail/large-attachment/connector');
	const {
		buildLargeAttachmentSendContracts,
		exceedsAttachmentLimit,
		findOrphanedLargeAttachments,
		findStaleLargeAttachments,
		getAttachmentSize,
		isConversionNeeded,
		planLargeAttachmentConversion,
		restoreOrphanedLargeAttachments,
	} = require('mail/large-attachment/compose-state');

	/**
	 * The only owner of the life cycle of a converted set. It reacts to a change of the composition of the
	 * attachments, starts a conversion, keeps the ephemeral registry of the inserted addresses, puts back
	 * an address removed before the send and stops for good when the form is destroyed.
	 */
	class LargeAttachmentCoordinator
	{
		/**
		 * @param {LargeAttachmentCoordinatorOptions} options
		 */
		constructor(options = {})
		{
			this.connector = options.connector;
			this.maxSize = Number(options.maxSize ?? 0);
			this.tariffAvailable = options.tariffAvailable !== false;
			this.getFiles = options.getFiles ?? (() => []);
			this.insertAddress = options.insertAddress ?? (() => Promise.resolve());
			this.removeAddress = options.removeAddress ?? (() => {});
			this.onSetsChanged = options.onSetsChanged ?? (() => {});
			// the sets a restore gave up because the server invalidated them or they carried no address. It is
			// told apart from onError on purpose: a drop is not a failure of the scenario and must not set the
			// reported-failure mark that stops the send
			this.onRestoredSetsDropped = options.onRestoredSetsDropped ?? (() => {});
			this.onError = options.onError ?? (() => {});
			this.onTariffUnavailable = options.onTariffUnavailable ?? (() => {});
			this.unsubscribe = Array.isArray(options.unsubscribe) ? options.unsubscribe : [];

			this.sets = [];
			// ephemeral: the addresses this form has put into the body, never a part of the saved letter
			this.insertedUrls = [];
			this.inFlight = 0;
			this.recheckRequested = false;
			this.tariffReported = false;
			// whether the person has already been shown why the composition could not be converted. Only a
			// reason that reached the screen may stop the send later on
			this.failureReported = false;
			this.destroyed = false;
			this.pending = null;
		}

		/**
		 * @param {Array} sets sets a restored draft carries
		 * @return {LargeAttachmentCoordinator}
		 */
		restore(sets = [])
		{
			const dropped = [];
			(Array.isArray(sets) ? sets : []).forEach((set) => {
				const token = String(set?.token ?? '');
				const publicUrl = String(set?.publicUrl ?? '');
				// a set the server invalidated or one that carries no address is not owned by the draft; only
				// its address leaves the body. A valid set is kept even when its address was removed from the
				// body: the draft owns it, the server would refuse the send without it, and the orphan
				// mechanism puts the address back before the send exactly as it does for a fresh form.
				if (set?.valid === false || token === '' || publicUrl === '')
				{
					this.removeAddress(publicUrl);
					dropped.push({
						token,
						publicUrl,
						fileIds: (Array.isArray(set?.fileIds) ? set.fileIds : []).map(Number),
						sourceFileIds: Array.isArray(set?.sourceFileIds) ? set.sourceFileIds.map(Number) : [],
					});

					return;
				}

				const fileIds = (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number);
				// the token is signed against the source objects the set was built from; the draft carries
				// copies of them, so the send contract has to keep the source ids apart from the copies
				const sourceFileIds = Array.isArray(set.sourceFileIds) && set.sourceFileIds.length > 0
					? set.sourceFileIds.map(Number)
					: fileIds
				;
				this.sets.push({
					token,
					publicUrl,
					fileIds,
					sourceFileIds,
					folderName: String(set.folderName ?? ''),
				});
				this.rememberAddress(publicUrl);
			});

			if (this.sets.length > 0)
			{
				this.onSetsChanged(this.getConvertedSets());
			}

			// a drop is reported even when nothing outlived the restore: otherwise the form never learns the
			// record still names a set the server refused, the send stops on it and the person is told nothing
			if (dropped.length > 0)
			{
				this.onRestoredSetsDropped(dropped);
			}

			return this;
		}

		/**
		 * @return {Array}
		 */
		getConvertedSets()
		{
			return this.sets.map((set) => ({
				...set,
				fileIds: [...set.fileIds],
				// both spaces leave together: the draft has to store the objects of the form and the source
				// objects the token was signed over, and a set that lost one of them is dropped by the server
				sourceFileIds: [...(Array.isArray(set.sourceFileIds) ? set.sourceFileIds : set.fileIds)],
			}));
		}

		/**
		 * @return {Array<{ token: string, fileIds: number[] }>}
		 */
		getSendContracts()
		{
			return buildLargeAttachmentSendContracts(this.sets);
		}

		/**
		 * The addresses the markup of the letter has to be built around. Only the ones this form has put
		 * there: an address the person typed by hand is not a service address of ours.
		 *
		 * @return {Array<{ url: string }>}
		 */
		getServiceLinks()
		{
			return this.insertedUrls.map((url) => ({ url }));
		}

		hasPendingConversion()
		{
			return this.inFlight > 0;
		}

		/**
		 * Whether the current composition is the case the scenario is about: its sum is over what a letter
		 * may carry. Unlike the plan of a conversion this counts a file that is still being uploaded: the
		 * one-time hint has to explain what is happening exactly while it happens, not a moment later.
		 *
		 * @return {boolean}
		 */
		isConversionExpected()
		{
			if (this.sets.length > 0)
			{
				return true;
			}

			const totalRawSize = this.getFiles().reduce(
				(total, file) => total + getAttachmentSize(file),
				0,
			);

			return exceedsAttachmentLimit(totalRawSize, this.maxSize);
		}

		/**
		 * Settles when no conversion is running any more. A send that starts while the set is still being
		 * converted would carry neither the address nor the set, and the server would refuse it by the sum.
		 *
		 * @return {Promise<void>}
		 */
		whenSettled()
		{
			return Promise.resolve(this.pending).then(() => {}, () => {});
		}

		/**
		 * Whether the composition is over the limit yet no valid set covers it, and the person has already
		 * been told why. A conversion that failed (the tariff, the storage or the Disk refused it) leaves
		 * this true, and the send must stop then: sending would carry the raw over-limit files, and the
		 * server would only refuse them by the sum, adding a second error to the one already shown.
		 *
		 * A composition over the limit no conversion was ever run for is a different case: the plan of a
		 * conversion cannot be built while an attachment has no object of the Disk (an attachment of a
		 * forward the storage could not enrich), so nothing was asked of the server and nothing was shown.
		 * Stopping the send here would only hide the letter behind a silent indicator, so the send goes on
		 * and the server answers the composition by its size - the reason a person can read, measured
		 * against the real sizes of the files instead of the sizes the sources of the form happened to
		 * report.
		 *
		 * @return {boolean}
		 */
		hasUnresolvedOversizeSet()
		{
			if (!this.failureReported || !this.isConversionExpected())
			{
				return false;
			}

			if (this.getSendContracts().length === 0)
			{
				return true;
			}

			const plan = planLargeAttachmentConversion({
				files: this.getFiles(),
				maxSize: this.maxSize,
				convertedSets: this.sets,
			});

			return isConversionNeeded(plan, this.sets);
		}

		/**
		 * The composition of the attachments has changed. A change that arrives while a conversion is in
		 * flight is not lost: the composition is read again once the conversion settles, because the upload
		 * of a heavy file lasts long and the composition changes meanwhile.
		 *
		 * @return {Promise<void>}
		 */
		handleFilesChanged()
		{
			if (this.destroyed)
			{
				return Promise.resolve();
			}

			if (this.inFlight > 0)
			{
				this.recheckRequested = true;

				return Promise.resolve();
			}

			const files = this.getFiles();
			const plan = planLargeAttachmentConversion({
				files,
				maxSize: this.maxSize,
				convertedSets: this.sets,
			});

			if (isConversionNeeded(plan, this.sets))
			{
				// the tariff of the portal is an answer of the server: asking it to convert would only
				// bring the very same refusal back, and the person would wait for it
				if (!this.tariffAvailable)
				{
					this.#reportTariffOnce();

					return Promise.resolve();
				}

				this.pending = this.#convert(plan);

				return this.pending;
			}

			return this.#dropStaleSets(files);
		}

		/**
		 * The body the send has to carry, with every address the person removed put back. The send
		 * goes on with the address in the letter; what happens to the file is decided after the send.
		 *
		 * @param {string} body
		 * @return {{ body: string, restored: Array }}
		 */
		prepareSend(body)
		{
			return restoreOrphanedLargeAttachments(body, this.sets);
		}

		/**
		 * The sets the given body carries no address of. The offer after the send is about exactly these:
		 * asked of the body the letter left with, the answer holds nothing the recipient can still open.
		 *
		 * The same predicate of presence answers here and in the restoration, so the two can never disagree
		 * about one and the same body.
		 *
		 * @param {string} body
		 * @return {Array}
		 */
		findOrphanedSets(body)
		{
			return findOrphanedLargeAttachments(body, this.sets);
		}

		/**
		 * @param {string} publicUrl
		 */
		rememberAddress(publicUrl)
		{
			if (publicUrl !== '' && !this.insertedUrls.includes(publicUrl))
			{
				this.insertedUrls.push(publicUrl);
			}
		}

		/**
		 * @param {string} publicUrl
		 */
		forgetAddress(publicUrl)
		{
			this.insertedUrls = this.insertedUrls.filter((url) => url !== publicUrl);
		}

		/**
		 * The removals go out under the cap of the scenario: this is the cleanup of every set the coordinator
		 * gives up at once, and the number of sets is not a number the client may turn into requests in
		 * flight. A refusal of one removal costs nothing here as it did before: the set has already lost its
		 * owner, and nothing about the letter depends on the answer.
		 *
		 * @param {Array} sets
		 * @return {Promise<void>}
		 */
		deleteUploaded(sets = [])
		{
			return runWithConcurrencyLimit(
				(Array.isArray(sets) ? sets : [])
					.filter((set) => String(set?.token ?? '') !== '')
					.map((set) => () => this.connector.deleteUploaded({ token: set.token }).catch(() => false)),
			).then(() => {});
		}

		destroy()
		{
			if (this.destroyed)
			{
				return;
			}

			this.destroyed = true;
			this.recheckRequested = false;
			this.unsubscribe.forEach((callback) => callback());
			this.unsubscribe = [];
		}

		#convert(plan)
		{
			const tokens = Array.isArray(plan.replacementTokens) ? plan.replacementTokens : [];
			const replaced = this.sets.filter((set) => tokens.includes(set.token));
			this.inFlight++;

			return this.connector
				.convert({ fileIds: plan.fileIds, replacementToken: plan.replacementToken })
				.then((set) => this.#accept(this.#adoptSet(set, plan), replaced))
				.catch((error) => this.#handleError(error))
				.finally(() => {
					this.inFlight = Math.max(0, this.inFlight - 1);

					return this.#drainRecheck();
				})
			;
		}

		/**
		 * The set the way this form owns it. The server answers in the space it was asked in - the source
		 * objects - while the form speaks of the objects it shows, so the answer is translated back through
		 * the plan and both spaces are kept: the token is signed over the sources, and whether a set still
		 * describes the composition is decided by the objects of the form.
		 *
		 * An identifier the plan never named is left as it came: a set that does not describe the plan has
		 * to stay visibly different from it, so the send is not told a composition was covered when it was
		 * not.
		 *
		 * @param {Object} set
		 * @param {LargeAttachmentPlan} plan
		 * @return {Object}
		 */
		#adoptSet(set, plan)
		{
			if (String(set?.token ?? '') === '')
			{
				return set;
			}

			const sourceFileIds = (Array.isArray(set.fileIds) ? set.fileIds : []).map(Number);
			const objectIdBySourceId = plan?.objectIdBySourceId ?? {};

			return {
				...set,
				fileIds: sourceFileIds.map((sourceId) => objectIdBySourceId[sourceId] ?? sourceId),
				sourceFileIds,
			};
		}

		#accept(set, replaced)
		{
			// the form is gone: an uploaded set nobody owns is removed instead of being kept on the Disk
			if (this.destroyed || String(set?.token ?? '') === '')
			{
				return this.deleteUploaded([set]);
			}

			if (replaced.length === 0)
			{
				return this.#commit(set, replaced);
			}

			return this.#finalizeReplacement(set, replaced)
				.then(() => {
					// the finalization awaited the network, so the form may be gone now. The previous sets
					// have already given up ownership on the server: their files are released, but the new
					// set is kept, because deleting it would lose the attachment for good. The set still
					// becomes the one this coordinator owns: the draft of the closed form is written from
					// the sets, and the token of a finalized set is no longer resolvable. The body and the
					// callbacks of a destroyed form are left untouched.
					if (this.destroyed)
					{
						this.sets = this.sets.filter((current) => !replaced.includes(current));
						this.sets.push(set);

						return this.deleteUploaded(replaced);
					}

					return this.#commit(set, replaced);
				})
				.catch((error) => {
					// the replacement did not go through: the previous sets stay the owners of the addresses
					this.#reportError(error);

					return this.deleteUploaded([set]);
				})
			;
		}

		/**
		 * The server built the new set against the first of the replaced ones, so only that one carries it
		 * out of the intermediate state, and its refusal undoes the whole replacement. It is therefore asked
		 * alone and its refusal is passed on untouched. The rest are released under the cap of the scenario,
		 * and a refusal there costs nothing: the commit drops such a set and removes its files.
		 *
		 * @param {Object} set
		 * @param {Array} replaced
		 * @return {Promise<void>}
		 */
		#finalizeReplacement(set, replaced)
		{
			const [primary, ...rest] = replaced;

			return this.connector
				.finalizeReplacement({ previousToken: primary.token, currentToken: set.token })
				.then(() => runWithConcurrencyLimit(rest.map((previous) => () => (
					this.connector
						.finalizeReplacement({ previousToken: previous.token, currentToken: set.token })
						.catch(() => false)
				))))
				.then(() => {})
			;
		}

		#commit(set, replaced)
		{
			replaced.forEach((previous) => {
				this.removeAddress(previous.publicUrl);
				this.forgetAddress(previous.publicUrl);
			});
			this.sets = this.sets.filter((current) => !replaced.includes(current));
			this.sets.push(set);

			return Promise.resolve(this.insertAddress(set.publicUrl))
				.then(() => {
					this.rememberAddress(set.publicUrl);
					this.onSetsChanged(this.getConvertedSets());

					return replaced.length > 0 ? this.deleteUploaded(replaced) : undefined;
				})
				.catch((error) => {
					this.#reportError(error);

					if (replaced.length > 0)
					{
						// the replacement is finalized already: the previous sets own nothing any more, so
						// dropping the new one would lose the attachment for good. It stays the owner, and
						// the send puts its address back into the body the insert never reached
						this.rememberAddress(set.publicUrl);
						this.onSetsChanged(this.getConvertedSets());

						return this.deleteUploaded(replaced);
					}

					// nothing was inserted, so the letter of the person is untouched; the set is rolled back
					this.sets = this.sets.filter((current) => current !== set);

					return this.deleteUploaded([set]);
				})
			;
		}

		/**
		 * The refusal of the tariff is told once per composition: every change of the attachments would
		 * otherwise repeat it while the person keeps working on the letter.
		 *
		 * @param {?Object} [error] the answer of the server, or null when the refusal was known beforehand
		 */
		#reportTariffOnce(error = null)
		{
			if (this.tariffReported)
			{
				return;
			}

			this.tariffReported = true;
			this.failureReported = true;
			this.onTariffUnavailable(error);
		}

		/**
		 * Every refusal of the scenario leaves the screen with a reason on it, and that is what lets the
		 * send stop instead of going to the server with the raw composition.
		 *
		 * @param {*} error
		 */
		#reportError(error)
		{
			this.failureReported = true;
			this.onError(error);
		}

		#handleError(error)
		{
			if (this.destroyed)
			{
				return;
			}

			if (error?.state === LargeAttachmentErrorState.tariffUnavailable)
			{
				// the channel of restrictions did not bring the refusal in time and the server told it
				// itself; the answer will not change while the form lives, so the next composition must
				// not spend another request on the very same refusal
				this.tariffAvailable = false;
				this.#reportTariffOnce(error);

				return;
			}

			this.#reportError(error);
		}

		/**
		 * A set the current composition no longer holds is dropped: the address leaves the body and the
		 * uploaded files leave the Disk. A set that still describes the composition is left alone.
		 */
		#dropStaleSets(files)
		{
			const stale = findStaleLargeAttachments(files, this.sets);
			if (stale.length === 0)
			{
				return Promise.resolve();
			}

			this.sets = this.sets.filter((set) => !stale.includes(set));
			stale.forEach((set) => {
				this.removeAddress(set.publicUrl);
				this.forgetAddress(set.publicUrl);
			});
			this.onSetsChanged(this.getConvertedSets());

			return this.deleteUploaded(stale);
		}

		#drainRecheck()
		{
			if (this.destroyed || !this.recheckRequested)
			{
				return Promise.resolve();
			}

			this.recheckRequested = false;

			return this.handleFilesChanged();
		}
	}

	module.exports = { LargeAttachmentCoordinator };
});
