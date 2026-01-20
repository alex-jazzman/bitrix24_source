/**
 * @module mail/message-grid
 */
jn.define('mail/message-grid', (require, exports, module) => {
	const { mailsAddedFromServer, mailsUpsertedFromServer, setMultiSelectMode, setTaskId } = require('mail/statemanager/redux/slices/messages');
	const { selectEntities, selectIsMultiSelectMode } = require('mail/statemanager/redux/slices/messages/selector');
	const { observeMailboxesChange } = require('mail/statemanager/redux/slices/mailboxes/observers/stateful-list');
	const { observeFoldersChange } = require('mail/statemanager/redux/slices/folders/observers/stateful-list');
	const { observeListChange } = require('mail/statemanager/redux/slices/messages/observers/stateful-list');
	const { selectCurrentFolder, selectByType, selectCurrentFolderCounter } = require('mail/statemanager/redux/slices/folders/selector');
	const { selectStartEmailSender, selectCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { MessageModel } = require('mail/statemanager/redux/slices/messages/model/message');
	const { setCurrentMailbox } = require('mail/statemanager/redux/slices/mailboxes');
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const { stringToColor } = require('mail/message/elements/avatar');
	const {
		foldersAdded,
		foldersUpserted,
		clearFolders,
		setCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders');
	const {
		syncMailbox,
	} = require('mail/statemanager/redux/slices/mailboxes/thunk');

	const { batchActions } = require('statemanager/redux/batched-actions');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	const {
		MessageGridSorting,
		MessageGridMoreMenu,
		MessageGridMultiSelectMenu,
		MessageGridGroupActionsMenu,
	} = require('mail/message-grid/navigation');
	const { ListItemType, ListItemsFactory } = require('mail/simple-list/items');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { updateMailboxList } = require('mail/mailbox/selector');
	const { MailOpener } = require('mail/opener');
	const { AjaxMethod } = require('mail/const');

	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { SearchLayout } = require('layout/ui/search-bar');
	const { Box } = require('ui-system/layout/box');
	const { MobileFeature } = require('im/messenger/lib/feature');
	const { BottomPanel } = require('native/bottom-panel');
	const { Color } = require('tokens');
	const { Type } = require('type');
	const { Loc } = require('loc');

	const FILTER_PRESET_ALL_INCOME = 'all_income';
	const FILTER_PRESET_UNREAD = 'unread';
	const FILTER_PRESET_SENT = 'sent';
	const PAGE_SIZE = 50;
	const CACHE_TTL = 20;

	/**
	 * @class MessageGrid
	 */
	class MessageGrid extends LayoutComponent
	{
		static #inMemoryTtl = null;
		static #storage = null;

		constructor(props)
		{
			super(props);

			this.mailboxes = this.props.mailboxes;
			this.showFloatingButton = false;
			this.markAsRemovedMails = new Set();
			this.parentWidget = props.layout;
			this.stateFulListRef = null;
			const mailboxId = props.mailboxId ?? 0;

			this.parentWidget.setBackButtonHandler(this.#onSystemBackButton);

			this.sorting = new MessageGridSorting({
				type: MessageGridSorting.types.RECEIVE_DATE,
				fallbackType: MessageGridSorting.types.ID,
				isASC: false,
			});
			this.moreMenu = new MessageGridMoreMenu({
				selectedSorting: this.sorting.getType(),
				isASC: this.sorting.getIsASC(),
			});
			this.search = new SearchLayout({
				layout: this.parentWidget,
				disablePresets: true,
				onSearch: this.#onSearch,
				onCancel: this.#onSearch,
			});

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				this.panel = new BottomPanel();
				this.actionMenu = new MessageGridGroupActionsMenu({ parentWidget: this.parentWidget, panel: this.panel });
				this.panel.setComponent(this.actionMenu);
			}
			else
			{
				this.parentWidget.setLeftButtons(this.leftMenuButtons);
				this.multiSelectMenu = new MessageGridMultiSelectMenu({
					parentWidget: this.parentWidget,
				});
			}

			this.folderSelector = new FolderSelector({
				parentWidget: this.parentWidget,
			});

			this.filter = { tabId: FILTER_PRESET_ALL_INCOME };

			if (mailboxId !== 0)
			{
				this.filter.mailboxId = Number(mailboxId);
			}

			BX.addCustomEvent('Mail.Binding::bindingSent', () => {
				this.stateFulListRef?.reload({ skipUseCache: true });
			});

			BX.addCustomEvent('Mail.Mailbox::significantChangesInStructure', (id) => {
				this.newMailboxWasConnected(id);
			});

			BX.addCustomEvent('Mail.Mailbox::significantChangesInStructure', (id) => {
				this.newMailboxWasConnected(id);
			});
		}

		static #getCurrentTimeInSeconds()
		{
			return Math.floor(Date.now() / 1000);
		}

		static #setTtlValue(ttl)
		{
			this.#inMemoryTtl = ttl;

			return this.#getStorage().setNumber('ttl', ttl);
		}

		static #cacheExpired(ttl = CACHE_TTL)
		{
			const cacheTime = this.getTtlValue();
			const currentTime = this.#getCurrentTimeInSeconds();

			return currentTime > cacheTime + ttl;
		}

		static #updateStorage()
		{
			this.#setTtlValue(this.#getCurrentTimeInSeconds());
		}

		static getTtlValue()
		{
			if (this.#inMemoryTtl === null)
			{
				this.#inMemoryTtl = this.#getStorage().getNumber('ttl', 0);
			}

			return this.#inMemoryTtl;
		}

		static #getStorage()
		{
			if (!this.#storage)
			{
				this.#storage = Application.storageById('MailMessageGrid');
			}

			return this.#storage;
		}

		componentDidMount()
		{
			updateMailboxList(() => {}, this.mailboxes);

			this.parentWidget.on('removed', this.#onViewHidden);
			this.parentWidget.on('hidden', this.#onViewHidden);
			this.parentWidget.on('titleClick', this.openFolderMenu);

			this.unsubscribeMailboxesObserver = observeMailboxesChange(
				store,
				this.onVisibleMailboxesChange,
			);
			this.unsubscribeMailsObserver = observeListChange(
				store,
				this.onVisibleMailsChange,
			);
			this.unsubscribeFoldersObserver = observeFoldersChange(
				store,
				this.onVisibleFoldersChange,
			);

			this.parentWidget.setTitle({
				text: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TITLE'),
				type: 'section',
			});

			BX.PULL.subscribe({
				moduleId: 'tasks',
				command: 'task_add',
				callback: this.#onPullCallback,
			});
		}

		changeShowFloatingButtonStatus(status)
		{
			if (this.showFloatingButton !== status)
			{
				this.showFloatingButton = status;
				this.stateFulListRef?.updateFloatingButton({
					hide: !status,
				});
				this.setState({});
			}
		}

		componentWillUnmount()
		{
			this.parentWidget.off('removed', this.#onViewHidden);
			this.parentWidget.off('onViewHidden', this.#onViewHidden);
			this.parentWidget.off('titleClick', this.openFolderMenu);

			if (this.unsubscribeMailboxesObserver)
			{
				this.unsubscribeMailboxesObserver();
			}

			if (this.unsubscribeMailsObserver)
			{
				this.unsubscribeMailsObserver();
			}

			if (this.unsubscribeFoldersObserver)
			{
				this.unsubscribeFoldersObserver();
			}
		}

		render()
		{
			return Box(
				{
					resizableByKeyboard: true,
					backgroundColor: Color.bgPrimary,
				},
				View(
					{
						style: {
							flex: 1,
						},
					},
					this.renderTabs(),
					this.renderList(),
				),
			);
		}

		renderTabs()
		{
			return TabView({
				ref: this.onTabsRef,
				style: {
					height: 51,
				},
				params: {
					items: [
						{
							title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_ALL'),
							id: FILTER_PRESET_ALL_INCOME,
						},
						{
							title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_UNREAD'),
							id: FILTER_PRESET_UNREAD,
						},
						{
							title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_SENT'),
							id: FILTER_PRESET_SENT,
						},
					],
				},
				onTabSelected: this.#onTabSelected,
			});
		}

		openMessageChain(threadId, startEmailSender)
		{
			ComponentHelper.openLayout({
				name: 'mail:mail.message.view',
				object: 'layout',
				widgetParams: {
					title: Loc.getMessage('MAILMOBILE_MESSAGE_MESSAGE_CHAIN_TITLE'),
				},
				componentParams: {
					threadId,
					isCrmMessage: 0,
					startEmailSender,
				},
			});
		}

		renderList()
		{
			return new StatefulList({
				isFloatingButtonAccent: true,
				layout: this.parentWidget,
				ref: this.onListRef,
				testId: 'message-grid',
				useCache: false,
				needInitMenu: true,
				showAirStyle: false,
				isShowFloatingButton: this.showFloatingButton,
				onListReloaded: this.onListReloaded,
				onFloatingButtonClick: this.#onWriteEmail,
				sortingConfig: this.sorting.getSortingConfig(),
				onBeforeItemsSetState: this.onBeforeItemsSetState,
				getEmptyListComponent: this.renderEmptyListComponent,
				menuButtons: this.rightMenuButtons,
				itemFactory: ListItemsFactory,
				itemDetailOpenHandler: this.openMessageChain,
				itemType: ListItemType.MESSAGE,
				itemsLoadLimit: PAGE_SIZE,
				actions: {
					loadItems: AjaxMethod.mailGetList,
				},
				actionParams: this.actionParams,
				actionCallbacks: {
					loadItems: this.#onItemsLoaded,
				},
			});
		}

		renderEmptyListComponent()
		{
			return StatusBlock({
				image: Image({
					uri: makeLibraryImagePath('empty-folder-grid-full.png', 'empty-states', 'mail'),
					style: {
						width: 146,
						height: 137,
					},
				}),
				testId: 'empty-state-message-grid',
				description: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_EMPTY_STATE_DESCRIPTION_EMPTY_FOLDER'),
				emptyScreen: false,
				onRefresh: () => {},
			});
		}

		get actionParams()
		{
			return {
				loadItems: {
					filterParams: this.filter,
				},
			};
		}

		openFolderMenu = () => {
			this.parentWidget.openWidget(
				'layout',
				{
					...FolderSelector.FOLDER_LAYOUT_PROPERTIES,
					onReady: (layoutWidget) => {
						layoutWidget.showComponent(new FolderSelector({
							parentWidget: this.parentWidget,
							layoutWidget,
						}));
					},
				},
				this.parentWidget,
			);
		};

		get rightMenuButtons()
		{
			return [
				// @todo: implement search presets
				this.search.getSearchButton(),
				this.folderSelector.getMenuButton(this.openFolderMenu),
				this.moreMenu.getMenuButton(),
			];
		}

		get leftMenuButtons()
		{
			return [];
		}

		onBeforeItemsSetState = (items) => {
			const mailEntities = selectEntities(store.getState());

			const normalizedItems = items.map((item) => MessageModel.prepareReduxMailFromServer(item));

			return normalizedItems.filter(({ id }) => {
				const { isRemoved } = mailEntities[id] || {};

				return Type.isNil(isRemoved) || !isRemoved;
			});
		};

		onVisibleMailboxesChange = ({ selected, removed }) => {
			// if (removed.length > 0)
			// {
			// 	this.stateFulListRef.reload({ skipUseCache: true });
			// }

			if (selected !== null && selected !== undefined)
			{
				console.log('onVisibleMailboxesChange', selected);
				this.tabViewRef.setActiveItem(FILTER_PRESET_ALL_INCOME);
				this.filter.folderPath = null;
				this.filter.mailboxId = Number(selected.id);
				dispatch(clearFolders());
				this.setState({}, () => this.stateFulListRef.reload({ skipUseCache: true }));
				this.updateMultiSelectModeTitle(true);
			}
		};

		onVisibleMailsChange = ({ moved, removed, added, created, multiSelectMode, selectedIds }) => {
			if (!this.stateFulListRef || this.stateFulListRef.isLoading())
			{
				setTimeout(() => {
					this.onVisibleMailsChange({ moved, removed, added, created, multiSelectMode, selectedIds });
				}, 30);

				return;
			}

			if (multiSelectMode.changed)
			{
				this.toggleMultiSelectModeHeader(multiSelectMode.previous);
				const items = this.stateFulListRef.getItems();
				this.stateFulListRef.updateItemsData(items);
			}

			if (selectedIds.changed && !multiSelectMode.changed)
			{
				this.updateMultiSelectModeTitle(!multiSelectMode.current);
			}

			if (removed.length > 0)
			{
				void this.removeMails(removed);
			}

			if (added.length > 0)
			{
				void this.addOrRestoreMails(added);
			}

			if (moved.length > 0)
			{
				void this.updateMails(moved);
			}
		};

		onVisibleFoldersChange = ({ moved, removed, added, created, selected }) => {
			if (!this.stateFulListRef || this.stateFulListRef.isLoading())
			{
				setTimeout(() => {
					this.onVisibleFoldersChange({ moved, removed, added, created, selected });
				}, 30);

				return;
			}

			if (selected !== null)
			{
				this.updateCurrentFolder(selected);
			}
			else
			{
				this.updateMultiSelectModeTitle(true);
			}
		};

		updateCurrentFolder(selectedFolder)
		{
			const isMultiSelectMode = selectIsMultiSelectMode(store.getState());
			if (isMultiSelectMode)
			{
				dispatch(setMultiSelectMode({ isMultiSelectMode: false }));
			}
			else
			{
				this.toggleMultiSelectModeHeader(true);
			}

			this.#onFolderSelected(selectedFolder);
		}

		toggleMultiSelectModeHeader(isMultiSelectMode)
		{
			let rightButtons = [];
			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				if (isMultiSelectMode)
				{
					this.changeShowFloatingButtonStatus(true);
					this.panel.hide();
				}
				else
				{
					this.changeShowFloatingButtonStatus(false);
					this.panel.show();
				}
				rightButtons = isMultiSelectMode
					? this.rightMenuButtons
					: [this.actionMenu.getCancelButton()]
				;
			}
			else
			{
				const leftButtons = isMultiSelectMode
					? this.leftMenuButtons
					: [this.multiSelectMenu.getChanelButton()]
				;
				rightButtons = isMultiSelectMode
					? this.rightMenuButtons
					: [this.multiSelectMenu.getMenuButton()]
				;
				this.parentWidget.setLeftButtons(leftButtons);
			}

			this.updateMultiSelectModeTitle(isMultiSelectMode);
			this.parentWidget.setRightButtons(rightButtons);
		}

		updateMultiSelectModeTitle(isMultiSelectMode)
		{
			let titleParams = {};
			const currentFolder = selectCurrentFolder(store.getState());
			const currentMailbox = selectCurrentMailbox(store.getState());
			const unreadCounter = selectCurrentFolderCounter(store.getState());
			const detailTitle = Number(unreadCounter) > 0 ? String(unreadCounter) : null;

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				titleParams = {
					text: currentFolder?.name ?? Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TITLE'),
					detailText: detailTitle,
					type: 'section',
					avatar: {
						title: currentMailbox.userName,
						backgroundColor: stringToColor(currentMailbox.email),
						placeholder: {
							backgroundColor: stringToColor(currentMailbox.email),
						},
						hideOutline: true,
					},
				};
			}
			else
			{
				titleParams = {
					text: isMultiSelectMode
						? currentFolder?.name ?? Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TITLE')
						: this.prepareMultiSelectModeTitle(),
					detailText: isMultiSelectMode
						? detailTitle
						: null,
					avatar: isMultiSelectMode
						? {
							title: currentMailbox.userName,
							backgroundColor: stringToColor(currentMailbox.email),
							placeholder: {
								backgroundColor: stringToColor(currentMailbox.email),
							},
							hideOutline: true,
						}
						: null,
					type: isMultiSelectMode
						? 'section'
						: 'wizard',
				};
			}

			this.parentWidget.setTitle(titleParams);
		}

		prepareMultiSelectModeTitle()
		{
			const currentState = store.getState();
			const selectedIds = selectEntities(currentState);
			const selectedCount = Object.values(selectedIds).filter(({ isSelected }) => isSelected).length;

			if (selectedCount === 0)
			{
				return Loc.getMessage(
					'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_1',
					{ '#COUNT#': selectedCount },
				);
			}

			const getPluralizationKey = (count) => {
				const lastDigit = count % 10;
				const lastTwoDigits = count % 100;

				if (lastTwoDigits >= 11 && lastTwoDigits <= 14)
				{
					return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_1';
				}

				if (lastDigit === 1)
				{
					return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_2';
				}

				if (lastDigit >= 2 && lastDigit <= 4)
				{
					return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_5';
				}

				return 'MAILMOBILE_MESSAGE_GRID_MULTISELECT_MODE_TITLE_1';
			};

			return Loc.getMessage(
				getPluralizationKey(selectedCount),
				{ '#COUNT#': selectedCount },
			);
		}

		removeMails(mails)
		{
			if (mails.length > 0)
			{
				const removedIds = mails.map(({ id }) => id);
				const markAsRemovedMailsIds = mails.filter((mail) => mail.isRemoved).map(({ id }) => id);

				if (markAsRemovedMailsIds.length > 0)
				{
					markAsRemovedMailsIds.forEach((id) => this.markAsRemovedMails.add(id));
				}

				return this.stateFulListRef.deleteItem(removedIds);
			}

			return Promise.resolve();
		}

		updateMails(moved)
		{
			this.stateFulListRef.updateItemsData(moved);
		}

		async addOrRestoreMails(mails)
		{
			const restoredMails = [];
			const addedMails = [];

			mails.forEach((mail) => {
				if (this.markAsRemovedMails.has(mail.id))
				{
					restoredMails.push(mail);
				}
				else if (!this.stateFulListRef.hasItem(mail.id))
				{
					addedMails.push(mail);
				}
			});

			if (restoredMails.length > 0)
			{
				await this.stateFulListRef.updateItemsData(restoredMails);
			}

			if (addedMails.length > 0)
			{
				await this.stateFulListRef.updateItemsData(addedMails);
			}

			mails.forEach(({ id }) => this.markAsRemovedMails.delete(id));
		}

		newMailboxWasConnected(id)
		{
			updateMailboxList(() => {
				dispatch(setCurrentMailbox({ mailboxId: id }));
			});
		}

		#onViewHidden = () => {
			dispatch(setMultiSelectMode({ isMultiSelectMode: false }));
			this.panel.hide();
		};

		#onSystemBackButton = () => {
			const isMultiSelectMode = selectIsMultiSelectMode(store.getState());

			if (isMultiSelectMode)
			{
				dispatch(setMultiSelectMode({ isMultiSelectMode: false }));

				return true;
			}

			return false;
		};

		#onItemsLoaded = (responseData, context) => {
			const {
				items = [],
				dirs = [],
				currentMailboxId = 0,
				mailboxIsNotAvailable = false,
				currentFolderPath = '',
				startEmailSender = null,
			} = responseData || {};

			if (!mailboxIsNotAvailable)
			{
				this.changeShowFloatingButtonStatus(true);
			}

			const isCache = context === 'cache';
			const actions = [];

			if (dirs && dirs.length > 0)
			{
				actions.push(isCache ? foldersAdded(dirs) : foldersUpserted(dirs));
			}

			if (items && items.length > 0)
			{
				actions.push(isCache ? mailsAddedFromServer(items) : mailsUpsertedFromServer(items));
			}

			if (Number(currentMailboxId) > 0)
			{
				actions.push(setCurrentMailbox({ mailboxId: Number(currentMailboxId), startEmailSender }));
			}

			if (currentFolderPath !== '')
			{
				this.filter.folderPath = currentFolderPath;
				actions.push(setCurrentFolder({ folderPath: currentFolderPath }));
			}

			if (actions.length > 0)
			{
				dispatch(batchActions(actions));
			}

			if (MessageGrid.#cacheExpired() && currentMailboxId > 0)
			{
				dispatch(syncMailbox({ mailboxId: currentMailboxId }));
				MessageGrid.#updateStorage();
			}
		};

		#onFolderSelected = (folder) => {
			if (folder.type === DefaultFolderType.OUTCOME.value)
			{
				this.tabViewRef.setActiveItem(FILTER_PRESET_SENT);
			}
			else if (this.filter.tabId !== FILTER_PRESET_UNREAD)
			{
				this.tabViewRef.setActiveItem(FILTER_PRESET_ALL_INCOME);
			}

			this.filter.folderPath = folder.path;

			this.setState({}, () => this.stateFulListRef.reload({ skipUseCache: true }));
		};

		#onTabSelected = (tab) => {
			const currentFolder = selectCurrentFolder(store.getState());

			if (tab.id === FILTER_PRESET_UNREAD
				&& currentFolder
				&& currentFolder.type === DefaultFolderType.OUTCOME.value
			)
			{
				const inboxFolder = selectByType(store.getState(), DefaultFolderType.DEFAULT.value);

				if (inboxFolder !== null)
				{
					this.filter.tabId = FILTER_PRESET_UNREAD;
					dispatch(setCurrentFolder({ folderPath: inboxFolder.path }));

					return;
				}
			}

			if (tab.id === FILTER_PRESET_SENT)
			{
				const outcomeFolder = selectByType(store.getState(), DefaultFolderType.OUTCOME.value);

				if (outcomeFolder !== null)
				{
					this.filter.tabId = FILTER_PRESET_ALL_INCOME;
					dispatch(setCurrentFolder({ folderPath: outcomeFolder.path }));
				}
			}
			else if (
				currentFolder
				&& currentFolder.type === DefaultFolderType.OUTCOME.value
				&& tab.id === FILTER_PRESET_ALL_INCOME
			)
			{
				const inboxFolder = selectByType(store.getState(), DefaultFolderType.DEFAULT.value);

				if (inboxFolder !== null)
				{
					dispatch(setCurrentFolder({ folderPath: inboxFolder.path }));
				}
			}
			else
			{
				this.filter.tabId = tab.id;
				this.setState({}, () => this.stateFulListRef.reload({ skipUseCache: true }));
			}
		};

		#onSearch = ({ text }) => {
			this.filter.searchString = text ?? '';
			this.setState({}, () => this.stateFulListRef.reload({ skipUseCache: true }));
		};

		#onPullCallback = (params) => {
			const objectId = Number(params?.AFTER?.UF_MAIL_MESSAGE);
			const taskId = Number(params?.TASK_ID);
			if (objectId && taskId)
			{
				dispatch(setTaskId({ objectId, taskId }));
			}
		};

		#onWriteEmail = () => {
			MailOpener.openSend({
				isCrmMessage: false,
				startEmailSender: selectStartEmailSender(store.getState()),
			});
		};

		onListReloaded = (pullToReload) => {
			if (selectIsMultiSelectMode(store.getState()))
			{
				dispatch(setMultiSelectMode({ isMultiSelectMode: false }));
			}

			if (!pullToReload)
			{
				this.markAsRemovedMails?.clear();
			}
		};

		onListRef = (ref) => {
			this.stateFulListRef = ref;
		};

		onTabsRef = (ref) => {
			this.tabViewRef = ref;
		};
	}

	module.exports = { MessageGrid };
});
