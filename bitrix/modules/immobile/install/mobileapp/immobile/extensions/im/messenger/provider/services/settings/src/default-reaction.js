/**
 * @module im/messenger/provider/services/settings/default-reaction
 */
jn.define('im/messenger/provider/services/settings/default-reaction', (require, exports, module) => {
	const { Type } = require('type');

	const { Icon } = require('assets/icons');

	const { RestMethod, Setting } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Loc } = require('im/messenger/loc');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const logger = getLogger('provider--services--settings--default-reaction');

	// Upper bound on the values a running drain remembers as "awaiting their own echo". A write burst
	// self-drains as echoes arrive; the cap only guards against unbounded growth if some echo Pull is
	// never delivered.
	const AWAITED_ECHOES_CAP = 16;

	/**
	 * @class DefaultReactionService
	 * @desc Reads the user's main (quick) reaction from the server and keeps it
	 * mirrored in the application model and the local b_im_option cache.
	 */
	class DefaultReactionService
	{
		/**
		 * @desc True while the serialized write drain is running: exactly one server write is ever in
		 * flight. A pick made mid-write does not start a second, parallel request: the running drain
		 * picks up the latest desired value once the current write settles.
		 * @type {boolean}
		 */
		#writeInFlight = false;

		/**
		 * @desc Latest value the user wants on the server (coalescing slot). The drain always sends the
		 * current value of this slot, so intermediate picks evicted before they were sent collapse into
		 * the final choice. Null when there is nothing left to write.
		 * @type {?string}
		 */
		#desiredServerValue = null;

		/**
		 * @desc serverTruthVersion snapshot taken when the pending write was initiated. The drain
		 * compares it against the live serverTruthVersion after each REST call: a mismatch means a Pull
		 * applied fresher server truth mid-write, so the write is abandoned instead of overwriting it.
		 * @type {number}
		 */
		#desiredTruthVersion = 0;

		/**
		 * @desc Value to roll the model back to when a drain write fails. Seeded from the model value
		 * before the drain's first optimistic write and advanced to each successfully written value.
		 * @type {?string}
		 */
		#drainRollbackValue = null;

		/**
		 * @desc Monotonic version of the server-confirmed truth, bumped only by updateCache (Pull,
		 * server fetch or reconcile). Unlike operationId it is NOT bumped by a user write, so the drain
		 * can tell an external Pull (abandon the write) from another coalesced user write (keep draining).
		 * @type {number}
		 */
		#serverTruthVersion = 0;

		/**
		 * @desc Values the drain has sent to the server and still expects to see echoed back as a Pull
		 * settingsUpdate (the server broadcasts every write to all of the user's devices, including this
		 * one). updateCache treats a value found here as our own echo (not external server truth), so
		 * the echo does not bump serverTruthVersion (which would make the in-flight drain abandon) nor
		 * reset the optimistic model to an already-superseded pick.
		 * @type {string[]}
		 */
		#awaitedEchoes = [];

		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.optionRepository = serviceLocator.get('core').getRepository().option;

			/**
			 * @desc Last value confirmed as server truth (server fetch or Pull).
			 * @type {?string}
			 */
			this.lastKnownServerValue = null;

			/**
			 * @desc Monotonic id of the latest source-of-truth change (model, cache or
			 * lastKnownServerValue): a Pull updateCache or a user write each claim a fresh id. A
			 * bootstrap GET response (fetchFromServer) is applied only while its claimed id is still the
			 * latest, so a late GET can no longer overwrite a fresher Pull or user write.
			 * @type {number}
			 */
			this.operationId = 0;
		}

		/**
		 * @return {ConnectionService}
		 */
		get connectionService()
		{
			return serviceLocator.get('connection-service');
		}

		/**
		 * @desc Immediately restores the default reaction from the local cache on cold start,
		 * before the server response arrives.
		 * @return {Promise<void>}
		 */
		async hydrateFromCache()
		{
			const cachedReaction = await this.optionRepository
				.get(Setting.option.APP_SETTING_DEFAULT_REACTION, null)
				.catch((error) => {
					logger.error(`${this.constructor.name}.hydrateFromCache.get.catch:`, error);

					return null;
				});

			if (!Type.isStringFilled(cachedReaction))
			{
				return;
			}

			await this.store.dispatch('applicationModel/setDefaultReaction', cachedReaction);
		}

		/**
		 * @desc Reads the default reaction from the server (im.v2.Settings.General.list, bootstrap)
		 * and applies it to the model and the cache, unless a newer source-of-truth change (a Pull
		 * updateCache or a user write) landed while the GET was in flight, in which case the fresher
		 * value wins and this stale response is dropped.
		 * @return {Promise<void>}
		 */
		async fetchFromServer()
		{
			const operationId = this.operationId;
			const serverReaction = await this.fetchServerReaction();

			if (!Type.isStringFilled(serverReaction) || operationId !== this.operationId)
			{
				return;
			}

			await this.updateCache(serverReaction);
		}

		/**
		 * @desc Applies a server-originated default reaction (Pull or server fetch) to the
		 * model and records it as the last known server value. Claims a fresh operation id so an
		 * in-flight bootstrap GET cannot overwrite it, and advances the server-truth version so an
		 * in-flight serialized write abandons instead of overwriting this Pull value. Persisting the
		 * normalized value to the b_im_option cache is handled centrally by ApplicationWriter,
		 * subscribed to the applicationModel/setSettings mutation.
		 *
		 * A value the drain itself just wrote is echoed back here (the server broadcasts every write
		 * to this device too). Such an echo is recognized and ignored: applying it would bump the
		 * server-truth version and make the in-flight drain abandon its own successful write, or reset
		 * the optimistic model to an already-superseded pick.
		 * @param {string} reaction
		 * @return {Promise<void>}
		 */
		async updateCache(reaction)
		{
			if (this.#consumeAwaitedEcho(reaction))
			{
				return;
			}

			this.#claimOperation();
			this.#serverTruthVersion += 1;
			this.lastKnownServerValue = reaction;

			await this.#setModel(reaction);
		}

		/**
		 * @desc Claims a fresh operation id for a source-of-truth change and returns it.
		 * @return {number}
		 */
		#claimOperation()
		{
			this.operationId += 1;

			return this.operationId;
		}

		/**
		 * @desc Writes the reaction to the application model only (no server-truth tracking).
		 * @param {string} reaction
		 * @return {Promise<void>}
		 */
		async #setModel(reaction)
		{
			await this.store.dispatch('applicationModel/setDefaultReaction', reaction);
		}

		/**
		 * @desc Current default reaction from the model.
		 * @return {string}
		 */
		getCurrentReaction()
		{
			return this.store.getters['applicationModel/getDefaultReaction']();
		}

		/**
		 * @desc Persists the main reaction. Online: optimistically updates the model and schedules a
		 * serialized server write that rolls the model back on failure. Offline: rejects the
		 * write with the standard offline toast and leaves the model untouched: the pick is not
		 * deferred, mirroring the settings screen so an offline change never silently queues.
		 * @param {string} reaction
		 * @return {Promise<boolean>} whether an online write succeeded (false if failed or rejected offline)
		 */
		async writeToServer(reaction)
		{
			const previousReaction = this.getCurrentReaction();
			if (reaction === previousReaction)
			{
				return true;
			}

			if (!this.connectionService.isOnline())
			{
				this.showOfflineToast();

				return false;
			}

			const truthVersion = this.#serverTruthVersion;
			// Claim an operation id (synchronously, before the optimistic await) so a bootstrap GET
			// that was already in flight drops instead of clobbering this user write.
			this.#claimOperation();
			await this.#setModel(reaction);

			return this.#scheduleServerWrite(reaction, previousReaction, truthVersion);
		}

		/**
		 * @desc Records the desired server value (coalescing slot) and starts the serialized write
		 * drain, unless one is already running, in which case the running drain will pick up this
		 * newer value on its next iteration, so no second parallel request is started.
		 * @param {string} reaction the value to converge the server to
		 * @param {string} previousReaction rollback base when this is the first write of a fresh drain
		 * @param {number} truthVersion serverTruthVersion snapshot at write initiation
		 * @return {Promise<boolean>} whether the settled write succeeded (false if deferred to a
		 *   running drain or abandoned to a Pull)
		 */
		async #scheduleServerWrite(reaction, previousReaction, truthVersion)
		{
			this.#desiredServerValue = reaction;
			this.#desiredTruthVersion = truthVersion;

			if (this.#writeInFlight)
			{
				return false;
			}

			this.#drainRollbackValue = previousReaction;

			return this.#drainServerWrites();
		}

		/**
		 * @desc Serializes server writes: sends one requestServerUpdate at a time, always for the
		 * current desired value, until it matches the last known server value. Requests go out strictly
		 * one after another (A settles before B is sent), so the final server value is always the last
		 * pick. A Pull that lands mid-write (detected via serverTruthVersion) abandons the drain so it
		 * never overwrites the fresher Pull value; a write failure rolls the model back and toasts, but
		 * only for the settled final pick.
		 * @return {Promise<boolean>} whether the final settled write succeeded
		 */
		async #drainServerWrites()
		{
			this.#writeInFlight = true;
			let lastSettledWritten = true;

			try
			{
				while (
					this.#desiredServerValue !== null
					&& this.#desiredServerValue !== this.lastKnownServerValue
				)
				{
					const target = this.#desiredServerValue;
					const truthVersion = this.#desiredTruthVersion;
					const rollbackValue = this.#drainRollbackValue;

					// Remember the value before sending it, so a Pull echo that beats the REST response
					// is still recognized as our own write and does not abandon the drain.
					this.#rememberAwaitedEcho(target);
					const response = await this.requestServerUpdate(target);

					if (truthVersion !== this.#serverTruthVersion)
					{
						// A Pull (updateCache) applied fresher server truth while this REST write was in
						// flight; it already owns the model, cache and lastKnownServerValue. Drop this
						// write's side effects and stop draining instead of overwriting the fresher value.
						// Keep target in the awaited-echo list so its own late echo is ignored rather than
						// clobbering the Pull value.
						this.#desiredServerValue = null;

						return false;
					}

					if (response === null)
					{
						// A failed write never persists, so it will not echo: stop awaiting it.
						this.#forgetAwaitedEcho(target);
					}
					else
					{
						this.lastKnownServerValue = target;
						this.#drainRollbackValue = target;
					}

					if (this.#desiredServerValue !== target)
					{
						// A newer pick arrived while this write was in flight: leave its optimistic model
						// untouched and persist it next iteration. Toast only once, for the settled pick.
						continue;
					}

					if (response === null)
					{
						await this.#setModel(rollbackValue);
						this.showErrorToast();
						lastSettledWritten = false;
					}
					else
					{
						this.showSuccessToast();
						lastSettledWritten = true;
					}

					this.#desiredServerValue = null;
				}

				return lastSettledWritten;
			}
			finally
			{
				this.#writeInFlight = false;
			}
		}

		/**
		 * @desc Remembers a value the drain has sent, so its Pull echo is recognized as our own write.
		 * @param {string} reaction
		 */
		#rememberAwaitedEcho(reaction)
		{
			this.#awaitedEchoes.push(reaction);

			if (this.#awaitedEchoes.length > AWAITED_ECHOES_CAP)
			{
				this.#awaitedEchoes.shift();
			}
		}

		/**
		 * @desc Consumes one awaited echo matching the value, returning whether the value was our own
		 * write echoed back (and therefore must not be applied as external server truth).
		 * @param {string} reaction
		 * @return {boolean}
		 */
		#consumeAwaitedEcho(reaction)
		{
			const index = this.#awaitedEchoes.indexOf(reaction);
			if (index === -1)
			{
				return false;
			}

			this.#awaitedEchoes.splice(index, 1);

			return true;
		}

		/**
		 * @desc Drops one awaited echo for a value that will not echo back (a failed write).
		 * @param {string} reaction
		 */
		#forgetAwaitedEcho(reaction)
		{
			const index = this.#awaitedEchoes.lastIndexOf(reaction);
			if (index !== -1)
			{
				this.#awaitedEchoes.splice(index, 1);
			}
		}

		/**
		 * @desc Sends the reaction to the server (im.v2.Settings.General.update). Returns the raw
		 * response, or null on failure.
		 * @protected overridable in tests to stub the REST call
		 * @param {string} reaction
		 * @return {Promise<?object>}
		 */
		async requestServerUpdate(reaction)
		{
			return runAction(RestMethod.imV2SettingsGeneralUpdate, {
				data: {
					userId: serviceLocator.get('core').getUserId(),
					name: Setting.general.defaultReaction,
					value: reaction,
				},
			}).catch((error) => {
				logger.error(`${this.constructor.name}.requestServerUpdate.runAction.catch:`, error);

				return null;
			});
		}

		/**
		 * @desc Reads the current default reaction from the server (API-01) without touching
		 * the model. Returns null on error.
		 * @protected overridable in tests to stub the REST call
		 * @return {Promise<?string>}
		 */
		async fetchServerReaction()
		{
			const response = await runAction(RestMethod.imV2SettingsGeneralList, {
				data: { userId: serviceLocator.get('core').getUserId() },
			}).catch((error) => {
				logger.error(`${this.constructor.name}.fetchServerReaction.runAction.catch:`, error);

				return null;
			});

			if (!Type.isPlainObject(response))
			{
				return null;
			}

			return response.defaultReaction;
		}

		/**
		 * @desc Success toast for a changed main reaction.
		 * @protected overridable in tests to avoid the native notifier
		 */
		showSuccessToast()
		{
			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_MESSENGER_SETTINGS_DEFAULT_REACTION_CHANGED'),
				icon: Icon.CIRCLE_CHECK,
			});
		}

		/**
		 * @desc Error toast for a failed main reaction write.
		 * @protected overridable in tests to avoid the native notifier
		 */
		showErrorToast()
		{
			Notification.showErrorToast();
		}

		/**
		 * @desc Standard app-wide "no network" toast, shown when a pick is made offline.
		 * @protected overridable in tests to avoid the native notifier
		 */
		showOfflineToast()
		{
			Notification.showOfflineToast();
		}
	}

	module.exports = {
		DefaultReactionService,
	};
});
