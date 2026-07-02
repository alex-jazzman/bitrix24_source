/**
 * @module mail/message-grid/src/controller
 */
jn.define('mail/message-grid/src/controller', (require, exports, module) => {
	const { selectCurrentFolder, selectByType, selectCurrentVirtualFolderKey } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { setMultiSelectMode, setTaskId } = require('mail/statemanager/redux/slices/messages');
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
			this.isDestroyed = false;
			this.pendingTimeouts = new Set();
		}

		destroy()
		{
			this.isDestroyed = true;
			this.pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
			this.pendingTimeouts.clear();
		}

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

			if (added.length > 0)
			{
				void this.listAdapter.addOrRestoreItems(added);
			}

			if (moved.length > 0)
			{
				void this.listAdapter.updateItems(moved);
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

		handleBindingSent = () => {
			this.listAdapter.reload({ skipUseCache: true });
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
					this.reloadList();
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

			if (transition.folderPath)
			{
				dispatch(setCurrentFolder({ folderPath: transition.folderPath }));

				return;
			}

			if (transition.shouldReload)
			{
				this.reloadList();
			}
		};

		handleSearch = (searchData) => {
			const { shouldReload } = this.filterController.handleSearch(searchData);

			if (shouldReload)
			{
				this.reloadList();
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

		handleListReloaded = () => {
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
				this.reloadList();
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
				this.reloadList();
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

			const { shouldReload } = this.filterController.handleVirtualFolderSelection(virtualFolderKey);

			if (shouldReload)
			{
				this.reloadList();
			}
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

		#isMultiSelectMode()
		{
			return selectIsMultiSelectMode(store.getState());
		}

		#disableMultiSelectMode()
		{
			dispatch(setMultiSelectMode({ isMultiSelectMode: false }));
		}
	}

	module.exports = { MessageGridController };
});
