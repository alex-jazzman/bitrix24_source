/**
 * @module mail/message-grid/src/items-response-handler
 */
jn.define('mail/message-grid/src/items-response-handler', (require, exports, module) => {
	const { mailsAddedFromServer, mailsUpsertedFromServer } = require('mail/statemanager/redux/slices/messages');
	const { syncMailbox, syncAllUserMailboxes } = require('mail/statemanager/redux/slices/mailboxes/thunk');
	const { setCurrentMailbox, setMessageCounterInAllMailboxes } = require('mail/statemanager/redux/slices/mailboxes');
	const { selectCurrentVirtualFolderKey } = require('mail/statemanager/redux/slices/folders/selector');
	const { ALL_MESSAGES } = require('mail/folder/virtual');
	const {
		foldersAdded,
		foldersUpserted,
		setCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders');

	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	class MessageGridItemsResponseHandler
	{
		constructor({
			cache,
			filterController,
			onMailboxAvailable = () => {},
		} = {})
		{
			this.cache = cache;
			this.filterController = filterController;
			this.onMailboxAvailable = onMailboxAvailable;
		}

		handle(responseData, context)
		{
			const {
				items = [],
				dirs = [],
				currentMailboxId = 0,
				mailboxIsNotAvailable = false,
				currentFolderPath = '',
				startEmailSender = null,
				messageCounterInAllMailboxes = 0,
			} = responseData || {};

			if (!mailboxIsNotAvailable)
			{
				this.onMailboxAvailable();
			}

			const actions = this.#buildActions({
				items,
				dirs,
				currentMailboxId,
				currentFolderPath,
				startEmailSender,
				messageCounterInAllMailboxes,
				isCache: context === 'cache',
			});

			if (actions.length > 0)
			{
				dispatch(batchActions(actions));
			}

			this.#syncMailboxIfNeeded(currentMailboxId);
		}

		#buildActions({
			items,
			dirs,
			currentMailboxId,
			currentFolderPath,
			startEmailSender,
			messageCounterInAllMailboxes,
			isCache,
		})
		{
			const actions = [];

			if (dirs.length > 0)
			{
				actions.push(isCache ? foldersAdded(dirs) : foldersUpserted(dirs));
			}

			if (items.length > 0)
			{
				actions.push(isCache ? mailsAddedFromServer(items) : mailsUpsertedFromServer(items));
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

		#syncMailboxIfNeeded(currentMailboxId)
		{
			if (!this.cache.isExpired())
			{
				return;
			}

			const virtualFolderKey = selectCurrentVirtualFolderKey(store.getState());

			if (virtualFolderKey === ALL_MESSAGES)
			{
				dispatch(syncAllUserMailboxes());
				this.cache.updateTimestamp();

				return;
			}

			if (Number(currentMailboxId) > 0)
			{
				dispatch(syncMailbox({ mailboxId: currentMailboxId }));
				this.cache.updateTimestamp();
			}
		}
	}

	module.exports = { MessageGridItemsResponseHandler };
});
