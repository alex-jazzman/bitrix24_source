/**
 * @module mail/message-grid/src/items-response-handler
 */
jn.define('mail/message-grid/src/items-response-handler', (require, exports, module) => {
	const {
		mailsAddedFromServer,
		mailsUpsertedFromServer,
		setMessageDeleteAvailability,
	} = require('mail/statemanager/redux/slices/messages');
	const { syncMailbox, syncAllUserMailboxes } = require('mail/statemanager/redux/slices/mailboxes/thunk');
	const { setCurrentMailbox, setMessageCounterInAllMailboxes } = require('mail/statemanager/redux/slices/mailboxes');
	const { selectCurrentVirtualFolderKey } = require('mail/statemanager/redux/slices/folders/selector');
	const { ALL_MESSAGES, FAVORITES, LABEL } = require('mail/folder/virtual');
	const {
		foldersAdded,
		foldersUpserted,
		setCurrentFolder,
		setFavoritesAvailability,
		setLabelsAvailability,
	} = require('mail/statemanager/redux/slices/folders');

	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	function isAllMailboxesVirtualFolder(virtualFolderKey)
	{
		return [ALL_MESSAGES, FAVORITES].includes(virtualFolderKey);
	}

	/**
	 * Maps a server page of the grid onto its owners in Redux: messages keep their numeric storage,
	 * conversation summaries and expansion go to the conversations slice.
	 */
	class MessageGridItemsResponseHandler
	{
		constructor({
			cache,
			filterController,
			onMailboxAvailable = () => {},
			onProviderRestriction = () => {},
			onMigrationNotice = () => {},
			onStaleLabel = () => {},
			getVirtualFolderKey = () => selectCurrentVirtualFolderKey(store.getState()),
			dispatchSync = dispatch,
			dispatchBatch = (actions) => dispatch(batchActions(actions)),
			syncMailboxAction = syncMailbox,
			syncAllMailboxesAction = syncAllUserMailboxes,
		} = {})
		{
			this.cache = cache;
			this.filterController = filterController;
			this.onMailboxAvailable = onMailboxAvailable;
			this.onProviderRestriction = onProviderRestriction;
			this.onMigrationNotice = onMigrationNotice;
			this.onStaleLabel = onStaleLabel;
			this.getVirtualFolderKey = getVirtualFolderKey;
			this.dispatchSync = dispatchSync;
			this.dispatchBatch = dispatchBatch;
			this.syncMailboxAction = syncMailboxAction;
			this.syncAllMailboxesAction = syncAllMailboxesAction;
			this.providerRestrictionShownFor = null;
			this.conversationRuntime = null;
		}

		setConversationRuntime(runtime)
		{
			this.conversationRuntime = runtime;
		}

		/**
		 * @param {object} responseData raw response of the list action
		 * @param {string} context request context of StatefulList, `cache` for a cached response
		 * @param {string|null} contextKey identity of the grid page the response belongs to
		 */
		handle(responseData, context, contextKey = null)
		{
			const {
				items = [],
				grouped = false,
				nextCursor = null,
				settings = {},
				dirs = [],
				currentMailboxId = 0,
				mailboxIsNotAvailable = false,
				currentFolderPath = '',
				startEmailSender = null,
				messageCounterInAllMailboxes = 0,
				providerRestriction = null,
				migrationNotice = null,
				favoritesAvailable = false,
				labelsAvailable = false,
				currentLabel = null,
				messageDeleteAvailable = true,
			} = responseData || {};

			if (!mailboxIsNotAvailable)
			{
				this.onMailboxAvailable();
			}

			this.#handleProviderRestriction(providerRestriction, Number(currentMailboxId), context);
			this.#handleMigrationNotice(migrationNotice, context);

			const actions = this.#buildActions({
				items,
				grouped,
				nextCursor,
				settings,
				contextKey,
				dirs,
				currentMailboxId,
				currentFolderPath,
				startEmailSender,
				messageCounterInAllMailboxes,
				favoritesAvailable,
				labelsAvailable,
				messageDeleteAvailable,
				isCache: context === 'cache',
			});

			if (actions.length > 0)
			{
				this.dispatchBatch(actions);
			}

			this.#handleStaleLabel(labelsAvailable, currentLabel);
			this.syncMailboxIfNeeded(currentMailboxId);
		}

		#buildActions({
			items,
			grouped,
			nextCursor,
			settings,
			contextKey,
			dirs,
			currentMailboxId,
			currentFolderPath,
			startEmailSender,
			messageCounterInAllMailboxes,
			favoritesAvailable,
			labelsAvailable,
			messageDeleteAvailable,
			isCache,
		})
		{
			const actions = [];
			const plan = this.conversationRuntime
				? this.conversationRuntime.buildListPlan({
					contextKey,
					grouped,
					items,
					nextCursor,
					settings,
					isCache,
				})
				: grouped ? null : {
					messages: items,
					conversationAction: null,
				}
			;

			actions.push(setFavoritesAvailability({ favoritesAvailable }));
			actions.push(setLabelsAvailability({ labelsAvailable }));
			actions.push(setMessageDeleteAvailability({ messageDeleteAvailable }));

			if (dirs.length > 0)
			{
				actions.push(isCache ? foldersAdded(dirs) : foldersUpserted(dirs));
			}

			if (plan?.messages.length > 0)
			{
				actions.push(
					isCache
						? mailsAddedFromServer(plan.messages)
						: mailsUpsertedFromServer(plan.messages),
				);
			}

			if (plan?.conversationAction !== null && plan?.conversationAction !== undefined)
			{
				actions.push(plan.conversationAction);
			}

			if (Number(currentMailboxId) > 0)
			{
				actions.push(setCurrentMailbox({ mailboxId: Number(currentMailboxId), startEmailSender }));
			}

			actions.push(setMessageCounterInAllMailboxes({ messageCounterInAllMailboxes }));

			if (currentFolderPath !== '')
			{
				this.filterController.syncFolderPath(currentFolderPath);
				actions.push(setCurrentFolder({ folderPath: currentFolderPath }));
			}

			return actions;
		}

		/**
		 * DTO-02 page of an expanded conversation. Its messages keep the numeric storage, while the
		 * loaded child ids and the cursor go to the conversation itself.
		 * Called by the expansion loader of the conversation row.
		 *
		 * @param {ConversationPagePayload} payload
		 */
		applyConversationPage(payload)
		{
			this.conversationRuntime?.applyPage(payload);
		}

		/**
		 * The same page after a mailbox sync: unseen children are prepended and the row stays open.
		 * Called by the expansion loader of the conversation row.
		 *
		 * @param {ConversationSyncPayload} payload
		 */
		applyConversationSync(payload)
		{
			this.conversationRuntime?.applySync(payload);
		}

		/**
		 * A label the server no longer resolves (deleted while the domain stays on) returns the list
		 * to the default folder: the surface leaves the label mode by this signal.
		 */
		#handleStaleLabel(labelsAvailable, currentLabel)
		{
			if (
				labelsAvailable
				&& currentLabel === null
				&& this.getVirtualFolderKey() === LABEL
			)
			{
				this.onStaleLabel();
			}
		}

		#handleProviderRestriction(providerRestriction, currentMailboxId, context)
		{
			if (
				context === 'cache'
				|| !providerRestriction
				|| currentMailboxId <= 0
				|| this.providerRestrictionShownFor === currentMailboxId
			)
			{
				return;
			}

			this.providerRestrictionShownFor = currentMailboxId;
			this.onProviderRestriction(providerRestriction, currentMailboxId);
		}

		/**
		 * DTO-03. The display decision comes with the letters and is passed on as it came: which
		 * message it stands for, and whether it stands for one at all, is the server's to say.
		 * A cached response carries the decision of the previous visit, so it is left alone.
		 */
		#handleMigrationNotice(migrationNotice, context)
		{
			if (context === 'cache' || !migrationNotice)
			{
				return;
			}

			this.onMigrationNotice(migrationNotice);
		}

		syncMailboxIfNeeded(currentMailboxId)
		{
			if (!this.cache.isExpired())
			{
				return;
			}

			const virtualFolderKey = this.getVirtualFolderKey();

			if (isAllMailboxesVirtualFolder(virtualFolderKey))
			{
				this.dispatchSync(this.syncAllMailboxesAction());
				this.cache.updateTimestamp();

				return;
			}

			if (Number(currentMailboxId) > 0)
			{
				this.dispatchSync(this.syncMailboxAction({ mailboxId: currentMailboxId }));
				this.cache.updateTimestamp();
			}
		}
	}

	module.exports = { MessageGridItemsResponseHandler, isAllMailboxesVirtualFolder };
});
