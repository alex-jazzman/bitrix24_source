/**
 * @module mail/message-grid/src/controller
 */
jn.define('mail/message-grid/src/controller', (require, exports, module) => {
	const { selectCurrentFolder, selectByType, selectCurrentVirtualFolderKey } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { setMultiSelectMode, setTaskId, setBlogPostId } = require('mail/statemanager/redux/slices/messages');
	const {
		clearFolders,
		setCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders');
	const { setCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { updateMailboxList } = require('mail/mailbox/selector');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { AnalyticsEvent } = require('analytics');
	const { FAVORITES, LABEL } = require('mail/folder/virtual');
	const { selectCurrentLabelId } = require('mail/statemanager/redux/slices/labels/selector');
	const { labelCountersReceived } = require('mail/statemanager/redux/slices/labels');
	const { resolveLabelListReaction } = require('mail/message-grid/src/label-list-reaction');
	const { planAddedMessages } = require('mail/message-grid/src/added-message-plan');

	// Raised by a conversation row after a group action needs the row summary to be re-read.
	const CONVERSATION_RELOAD_EVENT = 'mail.conversation:onReloadRequired';
	// Raised by the assign sheet opened over a list row after a confirmed label binding change.
	const LABEL_BINDING_CHANGED_EVENT = 'mail.label:onMessageLabelChanged';
	// Reported once to the more menu so its onboarding fires after the first successful expansion.
	const CONVERSATION_FIRST_EXPANDED_EVENT = 'mail.conversation:onFirstExpanded';
	// Raised by the more menu after the shared grouping setting was saved.
	const CONVERSATION_GROUPING_CHANGED_EVENT = 'mail.conversation:onGroupingChanged';

	// Kept dependency-free for the mobile JN contract tests. Production delegates the same operation
	// to the lazy conversation runtime and therefore does not load its Redux slice on a flat grid.
	const filterTopLevelAddedMessages = (state, messages = []) => {
		const conversationState = state?.['mail:conversations'];
		if (conversationState?.grouped !== true || messages.length === 0)
		{
			return messages;
		}

		const childMessageIds = new Set();
		Object.values(conversationState.childRecordsByConversation ?? {}).forEach((records) => {
			Object.values(records ?? {}).forEach((child) => {
				if (child?.kind === 'message' && Number(child.messageId) > 0)
				{
					childMessageIds.add(Number(child.messageId));
				}
			});
		});

		return messages.filter(({ id }) => !childMessageIds.has(Number(id)));
	};

	const synchronizeGroupedMessages = async (listAdapter, expandedIds = []) => {
		await listAdapter.reload({ skipUseCache: true });
		await listAdapter.syncExpandedConversations(expandedIds);
	};
	const reloadConversationGrouping = (listAdapter) => {
		listAdapter.invalidateConversations();

		return listAdapter.reload({
			skipUseCache: true,
			skipItems: true,
			forcedShowSkeleton: false,
		});
	};

	/**
	 * How the label-mode list reacts to a binding change of a single message. Only the current
	 * label moves rows: unassigning it hides the row, and a rollback of that write restores it; any
	 * other label leaves the list as it is. No full reload is triggered for a single row.
	 *
	 * @returns {'hide'|'restore'|'none'}
	 */

	class MessageGridController
	{
		constructor({
			tabs,
			header,
			filterController,
			listAdapter,
			panel = null,
			allIncomeTabId = null,
			reloadList = () => {},
			recreateSearch = () => {},
			getVirtualFolderKey = () => selectCurrentVirtualFolderKey(store.getState()),
			isGrouped = () => listAdapter.isGroupedListLoaded(),
			getExpandedIds = () => listAdapter.getExpandedConversationIds(),
		} = {})
		{
			this.tabs = tabs;
			this.header = header;
			this.filterController = filterController;
			this.listAdapter = listAdapter;
			this.panel = panel;
			this.allIncomeTabId = allIncomeTabId;
			this.reloadList = reloadList;
			this.recreateSearch = recreateSearch;
			this.getVirtualFolderKey = getVirtualFolderKey;
			this.isGrouped = isGrouped;
			this.getExpandedIds = getExpandedIds;
			this.isDestroyed = false;
			this.pendingTimeouts = new Set();
			this.hiddenFavoriteMessageIds = new Set();
			this.hiddenLabelMessageIds = new Set();
			this.groupedMessageSyncPromise = null;
			this.groupedMessageSyncPending = false;
			this.hasReportedFirstExpand = false;
			this.storeUnsubscribe = store.subscribe(this.handleStoreChanged);

			BX.addCustomEvent(CONVERSATION_RELOAD_EVENT, this.handleConversationReloadRequired);
			BX.addCustomEvent(CONVERSATION_GROUPING_CHANGED_EVENT, this.handleConversationGroupingChanged);
			BX.addCustomEvent(LABEL_BINDING_CHANGED_EVENT, this.handleLabelBindingChanged);
		}

		/**
		 * A confirmed label binding change from the assign sheet opened over a list row.
		 */
		handleLabelBindingChanged = (change) => {
			const messageId = Number(change?.messageId);
			if (!messageId)
			{
				return;
			}

			this.handleLabelAssignmentChange({
				messageId,
				labelId: Number(change?.labelId),
				assigned: change?.assigned === true,
			});
		};

		/**
		 * Entry point for a confirmed (or rolled back) label binding of one message, so the label-mode
		 * list and the label counter stay consistent without a full reload. Wired from the assign sheet
		 * opened over a list row; the card keeps its own chain properties instead.
		 *
		 * @param {{ messageId: (number|string), labelId: number, assigned: boolean }} change
		 */
		handleLabelAssignmentChange({ messageId, labelId, assigned })
		{
			if (this.getVirtualFolderKey() !== LABEL)
			{
				return;
			}

			const rowId = String(messageId);
			const reaction = resolveLabelListReaction({
				currentLabelId: selectCurrentLabelId(store.getState()),
				changedLabelId: labelId,
				assigned,
				wasHidden: this.hiddenLabelMessageIds.has(rowId),
			});

			if (reaction === 'none')
			{
				return;
			}

			if (reaction === 'hide')
			{
				this.hiddenLabelMessageIds.add(rowId);
				void this.listAdapter.removeItems([{ id: messageId }]);
			}
			else
			{
				this.hiddenLabelMessageIds.delete(rowId);
				void this.listAdapter.addOrRestoreItems([{ id: messageId }]);
			}

			// The counter is not corrected here on purpose. The server recalculates it on every change
			// of bindings and sends the absolute value with the labelCountersUpdated pull event; a local
			// delta applied after that value arrived would move an already correct number a second time.
		}

		destroy()
		{
			this.isDestroyed = true;
			this.pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
			this.pendingTimeouts.clear();
			this.#unsubscribeStore();
			BX.removeCustomEvent(CONVERSATION_RELOAD_EVENT, this.handleConversationReloadRequired);
			BX.removeCustomEvent(CONVERSATION_GROUPING_CHANGED_EVENT, this.handleConversationGroupingChanged);
			BX.removeCustomEvent(LABEL_BINDING_CHANGED_EVENT, this.handleLabelBindingChanged);
		}

		/**
		 * The first successful expansion is reported once to the more menu, which owns the onboarding
		 * popup and its anchor. The store watch stops as soon as it has fired, so a later collapse and
		 * re-expansion never repeats it.
		 */
		handleStoreChanged = () => {
			if (this.isDestroyed || this.hasReportedFirstExpand)
			{
				return;
			}

			if (this.getExpandedIds().length > 0)
			{
				this.hasReportedFirstExpand = true;
				this.#unsubscribeStore();
				BX.postComponentEvent(CONVERSATION_FIRST_EXPANDED_EVENT, []);
			}
		};

		/**
		 * The shared grouping setting was saved, so the list is re-read. In-flight expansion is
		 * invalidated immediately; the next response replaces the previous grouping context atomically.
		 */
		handleConversationGroupingChanged = () => {
			if (!this.#deferUntilListReady(this.handleConversationGroupingChanged))
			{
				return;
			}

			// Keep the current rows visible until the response replaces the old grouping context.
			void reloadConversationGrouping(this.listAdapter);
		};

		#unsubscribeStore()
		{
			if (this.storeUnsubscribe)
			{
				this.storeUnsubscribe();
				this.storeUnsubscribe = null;
			}
		}

		/**
		 * A conversation group action reported a failure or a composition change (DTO-03
		 * `reloadRequired`), so the summaries are re-read. The whole list is reloaded because a single
		 * summary has no endpoint of its own; expansion survives, the context key is unchanged.
		 */
		handleConversationReloadRequired = () => {
			if (this.isDestroyed)
			{
				return;
			}

			this.reloadList();
		};

		syncMailboxes(mailboxes)
		{
			updateMailboxList(() => {}, mailboxes);
		}

		handleVisibleMailboxesChange = ({ selected }) => {
			if (selected !== null && selected !== undefined)
			{
				this.#applyMailboxSelection(selected.id);
			}
		};

		handleVisibleMailsChange = (payload) => {
			if (!this.#deferUntilListReady(() => this.handleVisibleMailsChange(payload)))
			{
				return;
			}

			const {
				moved,
				removed,
				added,
				multiSelectMode,
				selectedIds,
			} = payload;

			if (multiSelectMode.changed)
			{
				this.header.applyMode(multiSelectMode.previous);
			}
			else if (selectedIds.changed)
			{
				this.header.updateTitle(!multiSelectMode.current);
			}

			if (removed.length > 0)
			{
				void this.listAdapter.removeItems(removed);
			}

			const addedMessagesPlan = planAddedMessages({
				added,
				grouped: this.isGrouped(),
				filterTopLevel: this.listAdapter.filterTopLevelAddedMessages.bind(this.listAdapter),
			});
			if (addedMessagesPlan.synchronizeGrouped)
			{
				this.#synchronizeGroupedMessages();
			}
			else if (addedMessagesPlan.itemsToAdd.length > 0)
			{
				void this.listAdapter.addOrRestoreItems(addedMessagesPlan.itemsToAdd);
			}

			const topLevelMoved = this.isGrouped()
				? this.listAdapter.filterTopLevelAddedMessages(moved)
				: moved
			;

			if (topLevelMoved.length > 0 && this.getVirtualFolderKey() === FAVORITES)
			{
				const removedFromFavorites = topLevelMoved.filter(({ isFavorite }) => isFavorite === false);
				const removedFavoriteIds = new Set(removedFromFavorites.map(({ id }) => String(id)));
				const restoredToFavorites = topLevelMoved.filter(({ id, isFavorite }) => (
					isFavorite === true && this.hiddenFavoriteMessageIds.has(String(id))
				));
				const restoredFavoriteIds = new Set(restoredToFavorites.map(({ id }) => String(id)));
				const updatedFavorites = topLevelMoved.filter(({ id }) => (
					!removedFavoriteIds.has(String(id))
					&& !restoredFavoriteIds.has(String(id))
				));

				removedFavoriteIds.forEach((id) => this.hiddenFavoriteMessageIds.add(id));
				restoredFavoriteIds.forEach((id) => this.hiddenFavoriteMessageIds.delete(id));

				if (removedFromFavorites.length > 0)
				{
					void this.listAdapter.removeItems(removedFromFavorites);
				}
				if (restoredToFavorites.length > 0)
				{
					void this.listAdapter.addOrRestoreItems(restoredToFavorites);
				}
				if (updatedFavorites.length > 0)
				{
					void this.listAdapter.updateItems(updatedFavorites);
				}
			}
			else if (topLevelMoved.length > 0)
			{
				void this.listAdapter.updateItems(topLevelMoved);
			}
		};

		handleVisibleFoldersChange = (payload) => {
			if (!this.#deferUntilListReady(() => this.handleVisibleFoldersChange(payload)))
			{
				return;
			}

			const { selected, virtualFolderKey } = payload;

			if (virtualFolderKey !== null && virtualFolderKey !== undefined)
			{
				this.#handleVirtualFolderSelected(virtualFolderKey);

				return;
			}

			if (selected !== null)
			{
				this.#handleCurrentFolderChange(selected);
			}
			else
			{
				this.header.updateTitle(true);
			}
		};

		/**
		 * The selector switched to another label while the virtual key stayed `label`. The folders
		 * observer compares keys only, so it reports nothing here and the list would keep showing the
		 * previous label.
		 *
		 * Entering the label mode is handled by the folders observer instead. The store notifies its
		 * subscribers in batches, so both observers may see the same final state; the filter, not the
		 * order of the notifications, tells whether that entry has already been applied.
		 */
		handleLabelsChange = ({ currentLabelIdChanged, currentLabelId }) => {
			if (!currentLabelIdChanged || currentLabelId === null || this.getVirtualFolderKey() !== LABEL)
			{
				return;
			}

			if (this.filterController.getLabelId() === currentLabelId)
			{
				return;
			}

			if (!this.#deferUntilListReady(() => this.handleLabelsChange({ currentLabelIdChanged, currentLabelId })))
			{
				return;
			}

			this.#handleVirtualFolderSelected(LABEL);
		};

		handleBindingSent = () => {
			this.listAdapter.reload({ skipUseCache: true });
		};

		handleFeedPostBound = (params) => {
			const objectId = Number(params?.messageId);
			const blogPostBindId = Number(params?.postId);

			if (objectId && blogPostBindId)
			{
				dispatch(setBlogPostId({ objectId, blogPostBindId }));
			}
		};

		handleMailboxStructureChanged = (id) => {
			const mailboxId = Number(id);
			const selectedMailboxId = Number(selectCurrentMailbox(store.getState())?.id || 0);
			const virtualFolderKey = selectCurrentVirtualFolderKey(store.getState());

			if (mailboxId <= 0)
			{
				return;
			}

			if (mailboxId === selectedMailboxId)
			{
				if (virtualFolderKey !== null)
				{
					dispatch(clearFolders());
					this.#reloadAfterContextChange();
					this.header.updateTitle(true);

					return;
				}

				this.#applyMailboxSelection(mailboxId);

				return;
			}

			updateMailboxList(() => {
				dispatch(setCurrentMailbox({ mailboxId }));
			});
		};

		handleTabsSelected = (tabId) => {
			if (tabId === 'mail_list')
			{
				new AnalyticsEvent({
					tool: 'mail',
					category: 'mail_general_ops',
					event: 'mail_inbox_open',
					c_section: 'bottom_menu',
				}).send();
			}
		};

		handleViewHidden = () => {
			this.#disableMultiSelectMode();
			this.panel?.hide();
		};

		handleSystemBackButton = () => {
			if (this.#isMultiSelectMode())
			{
				this.#disableMultiSelectMode();

				return true;
			}

			return false;
		};

		handleTabSelected = (tab) => {
			BX.postComponentEvent('mail.message-grid:onTabSelected', [{ tabId: tab.id }]);

			const currentFolder = selectCurrentFolder(store.getState());
			const inboxFolder = selectByType(store.getState(), DefaultFolderType.DEFAULT.value);
			const outcomeFolder = selectByType(store.getState(), DefaultFolderType.OUTCOME.value);

			const transition = this.filterController.handleTabSelection({
				tabId: tab.id,
				currentFolder,
				inboxFolder,
				outcomeFolder,
			});

			if (transition.activeTabId)
			{
				this.tabs.setActiveItem(transition.activeTabId);
			}

			if (transition.folderPath)
			{
				dispatch(setCurrentFolder({ folderPath: transition.folderPath }));

				return;
			}

			if (transition.shouldReload)
			{
				this.#reloadAfterContextChange();
			}
		};

		handleSearch = (searchData) => {
			if (this.listAdapter.isDraftsMode())
			{
				this.listAdapter.invalidateConversations();
				void this.listAdapter.applyDraftSearch(searchData);

				return;
			}

			const { shouldReload } = this.filterController.handleSearch(searchData);

			if (shouldReload)
			{
				this.#reloadAfterContextChange();
			}
		};

		handlePullCallback = (params) => {
			const objectId = Number(params?.AFTER?.UF_MAIL_MESSAGE);
			const taskId = Number(params?.TASK_ID);

			if (objectId && taskId)
			{
				dispatch(setTaskId({ objectId, taskId }));
			}
		};

		/**
		 * Absolute unread counters of labels pushed by the module mail after it recalculated them.
		 */
		handleLabelCountersUpdated = (params) => {
			const counters = params?.counters;
			if (!counters || typeof counters !== 'object')
			{
				return;
			}

			dispatch(labelCountersReceived({ counters }));

			// The header reads the counter of the current label from the store on demand, and nothing
			// else redraws it here: the label has not changed, only its number. Without this the tab of
			// unread messages keeps the old value until the next redraw of the title.
			if (this.getVirtualFolderKey() === LABEL)
			{
				this.header.updateTitle(!this.#isMultiSelectMode());
			}
		};

		handleListReloaded = () => {
			this.hiddenFavoriteMessageIds.clear();
			this.hiddenLabelMessageIds.clear();

			if (this.#isMultiSelectMode())
			{
				this.#disableMultiSelectMode();
			}
		};

		#handleCurrentFolderChange(selectedFolder)
		{
			if (this.#isMultiSelectMode())
			{
				this.#disableMultiSelectMode();
			}
			else
			{
				this.header.applyMode(true);
			}

			this.recreateSearch({ disablePresets: false });
			this.#handleFolderSelected(selectedFolder);
		}

		#applyMailboxSelection(mailboxId)
		{
			this.tabs.setActiveItem(this.allIncomeTabId);

			dispatch(clearFolders());

			const { shouldReload } = this.filterController.handleMailboxSelection(mailboxId);

			if (shouldReload)
			{
				this.#reloadAfterContextChange();
			}

			this.header.updateTitle(true);
		}

		#handleFolderSelected(folder)
		{
			const { activeTabId, shouldReload } = this.filterController.handleFolderSelection(folder);

			if (activeTabId)
			{
				this.tabs.setActiveItem(activeTabId);
			}

			if (shouldReload)
			{
				this.#reloadAfterContextChange();
			}
		}

		#handleVirtualFolderSelected(virtualFolderKey)
		{
			if (this.#isMultiSelectMode())
			{
				this.#disableMultiSelectMode();
			}
			else
			{
				this.header.applyMode(true);
			}

			this.recreateSearch({ disablePresets: true });

			if (this.allIncomeTabId !== null)
			{
				this.tabs.setActiveItem(this.allIncomeTabId);
			}

			// A label carries its id in Redux; the folders observer passes only the virtual key, so the
			// list controller re-reads the id and keeps the label mode instead of resetting it.
			const { shouldReload } = virtualFolderKey === LABEL
				? this.filterController.handleLabelSelection(selectCurrentLabelId(store.getState()))
				: this.filterController.handleVirtualFolderSelection(virtualFolderKey)
			;

			if (shouldReload)
			{
				this.#reloadAfterContextChange();
			}
		}

		/**
		 * The grid context is about to change, so summaries and expansion of the previous one are
		 * dropped before the list of the new context arrives.
		 */
		#reloadAfterContextChange()
		{
			this.listAdapter.invalidateConversations({ clear: true });
			this.reloadList();
		}

		#deferUntilListReady(callback)
		{
			if (this.isDestroyed)
			{
				return false;
			}

			if (this.listAdapter.isReady())
			{
				return true;
			}

			let timeoutId = null;
			timeoutId = setTimeout(() => {
				this.pendingTimeouts.delete(timeoutId);

				if (this.isDestroyed)
				{
					return;
				}

				callback();
			}, 30);
			this.pendingTimeouts.add(timeoutId);

			return false;
		}

		#synchronizeGroupedMessages()
		{
			if (this.isDestroyed)
			{
				return;
			}

			this.groupedMessageSyncPending = true;
			if (this.groupedMessageSyncPromise)
			{
				return;
			}

			this.groupedMessageSyncPromise = this.#drainGroupedMessageSync()
				.finally(() => {
					this.groupedMessageSyncPromise = null;
					if (this.groupedMessageSyncPending && !this.isDestroyed)
					{
						this.#synchronizeGroupedMessages();
					}
				})
			;
		}

		async #drainGroupedMessageSync()
		{
			while (this.groupedMessageSyncPending && !this.isDestroyed)
			{
				this.groupedMessageSyncPending = false;
				const expandedIds = [...this.getExpandedIds()];

				try
				{
					await synchronizeGroupedMessages(this.listAdapter, expandedIds);
				}
				catch (error)
				{
					// eslint-disable-next-line no-console
					console.error(error);
				}
			}
		}

		#isMultiSelectMode()
		{
			return selectIsMultiSelectMode(store.getState());
		}

		#disableMultiSelectMode()
		{
			dispatch(setMultiSelectMode({ isMultiSelectMode: false }));
		}
	}

	module.exports = {
		MessageGridController,
		filterTopLevelAddedMessages,
		reloadConversationGrouping,
		resolveLabelListReaction,
		synchronizeGroupedMessages,
	};
});
