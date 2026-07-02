/* eslint-disable */
(function (main_core, main_core_events, ui_buttons, mail_avatar, mail_messagegrid, mail_directorymenu) {
	'use strict';

	class Counters {
		cachedCounters = [];
		counters = [];
		hiddenCountersForTotalCounter = [];
		shortcuts = [];
		#name;
		constructor(name, selectedDirectory) {
			this.#name = name;
			this.setDirectory(selectedDirectory);
		}
		getCounters() {
			return this.counters;
		}
		getDirPath(shortcut) {
			if (shortcut === undefined) {
				shortcut = '';
			}
			if (this.shortcuts[shortcut] !== undefined) {
				return this.shortcuts[shortcut];
			}
			return shortcut;
		}
		getShortcut(path) {
			//because they have a closure
			return this.getDirPath(path);
		}
		setDirectory(name) {
			if (name === undefined) {
				name = '';
			}
			if (this.shortcuts[name]) {
				this.selectedDirectory = this.shortcuts[name];
			} else {
				this.selectedDirectory = name;
			}
			let resultCounters = {};
			resultCounters[this.selectedDirectory] = this.getCounter(this.selectedDirectory);
			this.sendCounterUpdateEvent(resultCounters);
		}
		setShortcut(shortcutName, name) {
			//backlink
			this.shortcuts[shortcutName] = name;
			this.shortcuts[name] = shortcutName;
		}
		getName() {
			return this.#name;
		}
		setHiddenCountersForTotalCounter(counterNames) {
			for (let counter of counterNames) {
				this.hiddenCountersForTotalCounter[counter] = 'disabled';
			}
		}
		isHidden(name) {
			if (this.hiddenCountersForTotalCounter[name] === 'disabled') {
				return true;
			}
			return false;
		}
		getTotalCounter() {
			let counters = 0;
			for (let name in this.counters) {
				if (name in this.hiddenCountersForTotalCounter) {
					continue;
				}
				counters += this.counters[name];
			}
			return counters;
		}
		getCounterObjects() {
			return this.counters;
		}
		getCounter(name) {
			return this.counters[name];
		}
		addCounter(name, count) {
			this.counters[name] = Number(count);
			return this.counters[name];
		}
		addCounters(counters) {
			this.cacheCounters();
			let resultCounters = {};
			for (let i = 0; i < counters.length; i++) {
				const counter = counters[i];
				counter['count'] = Number(counter['count']);
				const path = counter['path'];
				this.addCounter(path, counter['count']);
				if (this.shortcuts[path]) {
					resultCounters[this.shortcuts[path]] = counter['count'];
				} else {
					resultCounters[path] = counter['count'];
				}
			}
			this.sendCounterUpdateEvent(resultCounters);
		}

		/*Set counters as when adding. Old counters with different names are retained*/
		setCounters(counters) {
			this.addCounters(counters);
		}
		isExists(name) {
			return this.counters[name] !== undefined;
		}
		increaseCounter(name, count = 1) {
			this.cacheCounters();
			if (name in this.hiddenCountersForTotalCounter) {
				return "hidden counters for total counter";
			}
			if (!this.isExists(name)) {
				return "no counter";
			}
			this.counters[name] += Number(count);
		}
		lowerCounter(name, count = 1) {
			this.cacheCounters();
			if (name in this.hiddenCountersForTotalCounter) {
				return "hidden counters for total counter";
			}
			if (!this.isExists(name)) {
				return "no counter";
			}
			const newValue = this.counters[name] - Number(count);
			if (newValue < 0) {
				return "negative value";
			}
			this.counters[name] = newValue;
		}
		cacheCounters() {
			this.cachedCounters = [];
			Object.assign(this.cachedCounters, this.counters);
		}
		restoreFromCache() {
			this.counters = [];
			Object.assign(this.counters, this.cachedCounters);
			this.sendCounterUpdateEvent(this.counters);
		}

		/*Change counters by rule*/
		updateCounters(counters = [{
			name: 'counter1',
			count: 2,
			increase: false,
			lower: true
		}, {
			name: 'counter2',
			count: 2,
			increase: true,
			lower: false
		}]) {
			this.cacheCounters();
			let resultCounters = {};
			let countersAreNotLoadedFromTheServer = false;
			for (let i = 0; i < counters.length; i++) {
				const counter = counters[i];
				const name = counter['name'];
				if (counter['lower']) {
					if (this.lowerCounter(name, counter['count']) === "negative value") {
						countersAreNotLoadedFromTheServer = true;
					}
				}
				if (counter['increase'] && countersAreNotLoadedFromTheServer === false) {
					this.increaseCounter(name, counter['count']);
				}
				if (this.shortcuts[name]) {
					resultCounters[this.shortcuts[name]] = this.getCounter(name);
				} else {
					resultCounters[name] = this.getCounter(name);
				}
			}
			this.sendCounterUpdateEvent(resultCounters);
		}
		sendCounterUpdateEvent(counters) {
			if (counters === undefined) {
				counters = this.counters;
			}
			if (counters.length === 0) {
				return;
			}
			const event = new main_core_events.BaseEvent({
				data: {
					counters: counters,
					hidden: this.hiddenCountersForTotalCounter,
					selectedDirectory: this.selectedDirectory,
					name: this.getName(),
					total: this.getTotalCounter()
				}
			});
			main_core_events.EventEmitter.emit('BX.Mail.Home:updatingCounters', event);
		}
	}

	class LeftMenu {
		constructor(config = {
			dirsWithUnseenMailCounters: {},
			mailboxId: '',
			filterId: '',
			systemDirs: {
				spam: 'Spam',
				trash: 'Trash',
				outcome: 'Outcome',
				drafts: 'Drafts',
				inbox: 'Inbox'
			}
		}) {
			const leftDirectoryMenuWrapper = document.querySelector('.mail-left-menu-wrapper');
			this.directoryMenu = new mail_directorymenu.DirectoryMenu({
				dirsWithUnseenMailCounters: config['dirsWithUnseenMailCounters'],
				filterId: config['filterId'],
				systemDirs: config['systemDirs'],
				sortMode: config['sortMode'],
				collapsedFolders: config['collapsedFolders'],
				mailboxId: config['mailboxId']
			});
			leftDirectoryMenuWrapper.append(this.directoryMenu.getNode());
		}
	}

	class List {
		constructor(options) {
			this.gridId = options.gridId;
			this.mailboxId = options.mailboxId;
			this.canMarkSpam = options.canMarkSpam;
			this.canDelete = options.canDelete;
			this.mailboxCanDelete = options.mailboxCanDelete ?? {};
			this.mailboxCanMarkSpam = options.mailboxCanMarkSpam ?? {};
			this.ERROR_CODE_CAN_NOT_DELETE = options.ERROR_CODE_CAN_NOT_DELETE;
			this.ERROR_CODE_CAN_NOT_MARK_SPAM = options.ERROR_CODE_CAN_NOT_MARK_SPAM;
			this.disabledClassName = 'js-disabled';
			this.userInterfaceManager = new BX.Mail.Client.Message.List.UserInterfaceManager(options);
			this.userInterfaceManager.resetGridSelection = this.resetGridSelection.bind(this);
			this.userInterfaceManager.isSelectedRowsHaveClass = this.isSelectedRowsHaveClass.bind(this);
			this.userInterfaceManager.getGridInstance = this.getGridInstance.bind(this);
			this.userInterfaceManager.updateCountersFromBackend = this.updateCountersFromBackend.bind(this);
			this.cache = {};
			this.addEventHandlers();
			BX.Mail.Client.Message.List[options.id] = this;
		}
		addEventHandlers() {
			// todo delete this hack
			// it is here to prevent grid's title changing after filter apply
			BX.ajax.UpdatePageData = function () {};
			main_core_events.EventEmitter.subscribe('onSubMenuShow', function (event) {
				const menuItem = event.target;
				const container = menuItem.getMenuWindow().getPopupWindow().getPopupContainer();
				let id = null;
				if (container) {
					id = BX.data(container, 'grid-row-id');
				}
				BX.data(menuItem.getSubMenu().getPopupWindow().getPopupContainer(), 'grid-row-id', menuItem.gridRowId || id);
			});
			main_core_events.EventEmitter.subscribe('Mail::directoryChanged', () => {
				this.resetGridSelection();
			});
			main_core_events.EventEmitter.subscribe('BX.Mail.Home:updatingCounters', event => {
				if (event['data']['name'] !== 'mailboxCounters') {
					const counters = event['data']['counters'];
					BX.Mail.Home.LeftMenuNode.directoryMenu.setCounters(counters);
					BX.Mail.Home.mailboxCounters.setCounters([{
						path: 'unseenCountInCurrentMailbox',
						count: BX.Mail.Home.Counters.getTotalCounter()
					}]);
				} else if (BX.Mail.Home.MailboxSelector) {
					BX.Mail.Home.MailboxSelector.syncTopLevelCounter();
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Main.Menu.Item:onmouseenter', function (event) {
				const menuItem = event.target;
				if (!menuItem.dataset || !menuItem.getMenuWindow()) {
					return;
				}
				const menuWindow = menuItem.getMenuWindow();
				const subMenuItems = menuWindow.getMenuItems();
				const path = menuItem.dataset.path;
				const hash = menuItem.dataset.dirMd5;
				const hasChild = menuItem.dataset.hasChild;
				if (!hasChild) {
					return;
				}
				for (let i = 0; i < subMenuItems.length; i++) {
					const item = subMenuItems[i];
					if (item.getId() === path) {
						const hasSubMenu = item.hasSubMenu();
						if (hasSubMenu) {
							item.showSubMenu();
							const subMenu = item.getSubMenu();
							let hasLoadingItem = false;
							if (subMenu) {
								const items = subMenu.getMenuItems();
								for (let k = 0; k < items.length; k++) {
									const subItem = items[k];
									if (subItem.getId() === 'loading') {
										hasLoadingItem = true;
									}
								}
							}
							if (!hasLoadingItem) {
								return;
							}
						}
						this.loadLevelMenu(item, hash);
					}
				}
			}.bind(this));
			const itemsMenu = document.querySelectorAll('.ical-event-control-menu');
			for (let i = 0; i < itemsMenu.length; i++) {
				itemsMenu[i].addEventListener('click', this.showICalMenuDropdown.bind(this));
			}
			BX.bindDelegate(document.body, 'click', {
				className: 'ical-event-control-button'
			}, this.onClickICalButton.bind(this));
		}
		loadLevelMenu(menuItem, hash) {
			const menu = this.getCache(menuItem.getId());
			const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());
			if (popup) {
				popup.destroy();
			}
			if (menu) {
				menuItem.destroySubMenu();
				menuItem.addSubMenu(menu);
				menuItem.showSubMenu();
				return;
			}
			const subItem = {
				'id': 'loading',
				'text': main_core.Loc.getMessage('MAIL_CLIENT_BUTTON_LOADING'),
				'disabled': true
			};
			menuItem.destroySubMenu();
			menuItem.addSubMenu([subItem]);
			menuItem.showSubMenu();
			BX.ajax.runComponentAction('bitrix:mail.client.config.dirs', 'level', {
				mode: 'class',
				data: {
					mailboxId: this.mailboxId,
					dir: {
						path: menuItem.getId(),
						dirMd5: hash
					}
				}
			}).then(function (response) {
				const dirs = response.data.dirs;
				const items = [];
				for (let i = 0; i < dirs.length; i++) {
					const hasChild = /(HasChildren)/i.test(dirs[i].FLAGS);
					const item = {
						'id': dirs[i].PATH,
						'text': dirs[i].NAME,
						'dataset': {
							'path': dirs[i].PATH,
							'dirMd5': dirs[i].DIR_MD5,
							'isDisabled': dirs[i].IS_DISABLED,
							'hasChild': hasChild
						},
						items: hasChild ? [{
							id: 'loading',
							'text': main_core.Loc.getMessage('MAIL_CLIENT_BUTTON_LOADING'),
							'disabled': true
						}] : []
					};
					items.push(item);
				}
				this.setCache(menuItem.getId(), items);
				const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());
				const isShown = menuItem.getMenuWindow().getPopupWindow().isShown();
				if (popup) {
					popup.destroy();
				}
				if (isShown) {
					menuItem.destroySubMenu();
					menuItem.addSubMenu(items);
					menuItem.showSubMenu();
				}
			}.bind(this), function (response) {}.bind(this));
		}
		onCrmClick(id) {
			const selected = this.getGridInstance().getRows().getSelected();
			const row = id ? this.getGridInstance().getRows().getById(id) : selected[0];
			if (!(row && row.node)) {
				return;
			}
			const addToCrm = this.userInterfaceManager.isAddToCrmActionAvailable(row.node);
			const messageIdNode = row.node.querySelector('[data-message-id]');
			if (!(messageIdNode.dataset && messageIdNode.dataset.messageId)) {
				return;
			}
			if (id === undefined) {
				this.resetGridSelection();
			}
			if (addToCrm) {
				const crmBtnInRow = row.node.querySelector('.mail-binding-crm.mail-ui-not-active');
				if (crmBtnInRow) {
					crmBtnInRow.startWait();
				}
				if (typeof this.isAddingToCrmInProgress !== "object") {
					this.isAddingToCrmInProgress = {};
				}
				if (this.isAddingToCrmInProgress[id] === true) {
					return;
				}
				this.isAddingToCrmInProgress[id] = true;
				BX.ajax.runAction('bitrix:mail.message.createCrmActivity', {
					data: {
						messageId: messageIdNode.dataset.messageId
					},
					analyticsLabel: {
						'groupCount': selected.length,
						'bindings': this.getRowsBindings([row])
					}
				}).then(function (id) {
					this.isAddingToCrmInProgress[id] = false;
					this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM'));
				}.bind(this, id), function (json) {
					if (crmBtnInRow) {
						crmBtnInRow.stopWait();
					}
					this.isAddingToCrmInProgress[id] = false;
					if (json.errors && json.errors.length > 0) {
						this.notify(json.errors.map(function (item) {
							return item.message;
						}).join('<br>'), 5000);
					} else {
						this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR'));
					}
				}.bind(this));
			} else {
				this.userInterfaceManager.onCrmBindingDeleted(messageIdNode.dataset.messageId);
				BX.ajax.runComponentAction('bitrix:mail.client', 'removeCrmActivity', {
					mode: 'ajax',
					data: {
						messageId: messageIdNode.dataset.messageId
					},
					analyticsLabel: {
						'groupCount': selected.length,
						'bindings': this.getRowsBindings([row])
					}
				}).then(function (messageIdNode) {
					this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM'));
				}.bind(this, messageIdNode));
			}
			let selectedIds = this.getGridInstance().getRows().getSelectedIds();
			if (selectedIds.length === 1 && selectedIds[0] === id) {
				this.resetGridSelection();
			}
		}
		onViewClick(id) {
			if (id === undefined && this.getGridInstance().getRows().getSelectedIds().length === 0) {
				return;
			}
			// @TODO: path
			BX.SidePanel.Instance.open("/mail/message/" + id, {
				width: 1080,
				loader: 'view-mail-loader'
			});
		}
		onDeleteImmediately(id) {
			let additionalOptions = {
				'deleteImmediately': true
			};
			this.onDeleteClick(id, additionalOptions);
		}
		onDeleteClick(id, additionalOptions) {
			const selected = this.getGridInstance().getRows().getSelected();
			if (id === undefined && selected.length === 0) {
				return;
			}
			const isAllMailMode = this.isAllMailMode();
			if (!isAllMailMode && !this.canDelete) {
				this.showDirsSlider();
				return;
			}
			let options = {
				params: additionalOptions !== undefined ? additionalOptions : {},
				keepRows: true,
				analyticsLabel: {
					'groupCount': selected.length,
					'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected)
				}
			};
			let selectedIds;
			if (id === undefined) {
				selectedIds = BX.Mail.Home.Grid.getSelectedIds();
			} else {
				selectedIds = [id];
			}
			selectedIds = this.filterRowsByClassName(this.disabledClassName, selectedIds, true);
			if (isAllMailMode) {
				if (selectedIds.length === 0) {
					return;
				}
				const deletable = selectedIds.filter(rowId => this.canRowDelete(rowId));
				if (deletable.length === 0) {
					this.showDirsSlider(this.getRowMailboxId(selectedIds[0]));
					return;
				}
				selectedIds = deletable;
			}
			options.ids = selectedIds;
			if (this.userInterfaceManager.isCurrentFolderTrash || additionalOptions !== undefined && additionalOptions['deleteImmediately']) {
				const confirmPopup = this.getConfirmDeletePopup(options);
				confirmPopup.show();
			} else {
				BX.Mail.Home.Grid.hideRowByIds(selectedIds);
				const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;
				if (this.getCurrentFolder() !== '') {
					BX.Mail.Home.Counters.updateCounters([{
						name: this.getCurrentFolder(),
						lower: true,
						count: unseenRowsIdsCount
					}]);
				}
				this.runAction('delete', options, () => BX.Mail.Home.Grid.reloadTable());
				if (id === undefined) {
					this.resetGridSelection();
				}
			}
		}
		onMoveToFolderClick(event) {
			const folderOptions = event.currentTarget.dataset;
			const toFolderByPath = folderOptions.path;
			const toFolderByName = toFolderByPath;
			if (toFolderByPath === this.getCurrentFolder()) {
				this.notify(main_core.Loc.getMessage('MESSAGES_ALREADY_EXIST_IN_FOLDER'));
				return;
			}
			let id = undefined;
			const popupSubmenu = BX.findParent(event.currentTarget, {
				className: 'popup-window'
			});
			if (popupSubmenu) {
				id = BX.data(popupSubmenu, 'grid-row-id');
			}
			const isDisabled = JSON.parse(folderOptions.isDisabled);
			if (id === undefined && this.getGridInstance().getRows().getSelectedIds().length === 0 || isDisabled) {
				return;
			}
			let selected = this.getGridInstance().getRows().getSelected();
			let idsForMoving = id ? [id] : this.getGridInstance().getRows().getSelectedIds();
			idsForMoving = this.filterRowsByClassName(this.disabledClassName, idsForMoving, true);
			if (!idsForMoving.length) {
				return;
			}

			// to hide the context menu
			BX.onCustomEvent('Grid::updated');
			let selectedIds;
			if (id === undefined) {
				selectedIds = BX.Mail.Home.Grid.getSelectedIds();
			} else {
				selectedIds = [id];
			}
			BX.Mail.Home.Grid.hideRowByIds(selectedIds);
			const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;
			if (this.getCurrentFolder() !== '') {
				BX.Mail.Home.Counters.updateCounters([{
					name: toFolderByName,
					increase: true,
					count: unseenRowsIdsCount
				}, {
					name: this.getCurrentFolder(),
					lower: true,
					count: unseenRowsIdsCount
				}]);
			}
			this.runAction('moveToFolder', {
				keepRows: true,
				ids: idsForMoving,
				params: {
					folderPath: toFolderByPath
				},
				analyticsLabel: {
					'groupCount': selected.length,
					'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected)
				}
			}, () => {
				BX.Mail.Home.Grid.reloadTable();
			});
			if (id === undefined) {
				this.resetGridSelection();
			}
		}
		onReadClick(id) {
			let selected = [];
			let resultIds = [];
			if (id === undefined) {
				selected = this.getGridInstance().getRows().getSelected();
				resultIds = this.getGridInstance().getRows().getSelectedIds();
			} else {
				let selectedIds = this.getGridInstance().getRows().getSelectedIds();
				if (selectedIds.length === 1 && selectedIds[0] === id) {
					/*if the action is non-group, but one cell is selected,
					then the action was performed through the "Action panel"
					and the selection should be reset*/
					selected = this.getGridInstance().getRows().getSelected();
					resultIds = selectedIds;
					id = undefined;
				} else {
					resultIds = [id];
				}
			}
			if (id === undefined && selected.length === 0) {
				return;
			}
			const actionName = 'all' == id || this.isSelectedRowsHaveClass('mail-msg-list-cell-unseen', id) ? 'markAsSeen' : 'markAsUnseen';
			resultIds = this.filterRowsByClassName('mail-msg-list-cell-unseen', resultIds, actionName !== 'markAsSeen');
			resultIds = this.filterRowsByClassName(this.disabledClassName, resultIds, true);
			if (!resultIds.length) {
				return;
			}
			const handler = function () {
				this.userInterfaceManager.onMessagesRead(resultIds, {
					action: actionName
				});
				const currentFolder = this.getCurrentFolder();
				const oldMessagesCount = actionName !== 'markAsSeen' ? this.isSelectedRowsHaveClass('mail-msg-list-cell-old') : 0;
				let countMessages = resultIds.length - oldMessagesCount;
				if (this.getCurrentFolder() !== '') {
					if (actionName === 'markAsSeen') {
						if ('all' === id) {
							countMessages = BX.Mail.Home.Counters.getCounter(currentFolder) - oldMessagesCount;
						}
						BX.Mail.Home.Counters.updateCounters([{
							name: currentFolder,
							lower: true,
							count: countMessages
						}]);
					} else {
						BX.Mail.Home.Counters.updateCounters([{
							name: currentFolder,
							increase: true,
							count: countMessages
						}]);
					}
				}
				if (id === undefined) {
					this.resetGridSelection();
				}
				const isAllMailMode = !!(BX.Mail.Home.MailboxSelector && BX.Mail.Home.MailboxSelector.isAllMailMode);
				if ('all' === id) {
					if (isAllMailMode) {
						resultIds['for_all_user_mailboxes'] = true;
					} else {
						resultIds['for_all'] = this.mailboxId + '-' + this.userInterfaceManager.getCurrentFolder();
					}
				}
				if (BX.Mail.Home.MailboxSelector) {
					BX.Mail.Home.MailboxSelector.handleMessagesAction(resultIds, actionName);
				}
				this.suppressNextCountersPull();
				this.runAction(actionName, {
					ids: resultIds,
					keepRows: true,
					successParams: actionName,
					analyticsLabel: {
						'groupCount': selected.length,
						'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected)
					}
				});
				return true;
			};
			handler.apply(this);
		}
		suppressNextCountersPull() {
			this.pendingCountersAction = true;
			clearTimeout(this.pendingCountersTimeout);
			this.pendingCountersTimeout = setTimeout(() => {
				this.pendingCountersAction = false;
			}, 5000);
		}
		onSpamClick(id) {
			const selected = this.getGridInstance().getRows().getSelected();
			if (id === undefined && selected.length === 0) {
				return;
			}
			const isAllMailMode = this.isAllMailMode();
			if (!isAllMailMode && !this.canMarkSpam) {
				this.showDirsSlider();
				return;
			}
			const actionName = this.isSelectedRowsHaveClass('js-spam', id) ? 'restoreFromSpam' : 'markAsSpam';
			let resultIds = this.filterRowsByClassName('js-spam', id, actionName !== 'restoreFromSpam');
			resultIds = this.filterRowsByClassName(this.disabledClassName, resultIds, true);
			if (!resultIds.length) {
				return;
			}
			const options = {
				keepRows: true,
				analyticsLabel: {
					'groupCount': selected.length,
					'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected)
				}
			};
			let selectedIds;
			if (id === undefined) {
				selectedIds = BX.Mail.Home.Grid.getSelectedIds();
			} else {
				selectedIds = [id];
			}
			if (isAllMailMode && actionName === 'markAsSpam') {
				if (selectedIds.length === 0) {
					return;
				}
				const spammable = selectedIds.filter(rowId => this.canRowMarkSpam(rowId));
				if (spammable.length === 0) {
					this.showDirsSlider(this.getRowMailboxId(selectedIds[0]));
					return;
				}
				selectedIds = spammable;
			}
			options.ids = selectedIds;
			BX.Mail.Home.Grid.hideRowByIds(selectedIds);
			const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;
			if (this.getCurrentFolder() !== '') {
				if (actionName === 'markAsSpam') {
					BX.Mail.Home.Counters.updateCounters([{
						name: this.userInterfaceManager.spamDir,
						increase: true,
						count: unseenRowsIdsCount
					}, {
						name: this.getCurrentFolder(),
						lower: true,
						count: unseenRowsIdsCount
					}]);
				} else {
					BX.Mail.Home.Counters.updateCounters([{
						name: this.userInterfaceManager.spamDir,
						lower: true,
						count: unseenRowsIdsCount
					}, {
						name: this.userInterfaceManager.inboxDir,
						increase: true,
						count: unseenRowsIdsCount
					}]);
				}
			}
			this.runAction(actionName, options, () => BX.Mail.Home.Grid.reloadTable());
			if (id === undefined) {
				this.resetGridSelection();
			}
		}
		getConfirmDeletePopup(options) {
			return new BX.UI.Dialogs.MessageBox({
				title: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_TITLE'),
				message: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE'),
				buttons: [new BX.UI.Button({
					color: BX.UI.Button.Color.DANGER,
					text: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN'),
					onclick: function (button) {
						const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', options.ids).length;
						BX.Mail.Home.Counters.updateCounters([{
							name: this.getCurrentFolder(),
							lower: true,
							count: unseenRowsIdsCount
						}]);
						this.runAction('delete', options, () => BX.Mail.Home.Grid.reloadTable());
						button.getContext().close();
						BX.Mail.Home.Grid.hideRowByIds(options.ids);
					}.bind(this)
				}), new BX.UI.CancelButton({
					onclick: function (button) {
						button.getContext().close();
					}
				})]
			});
		}
		resetGridSelection() {
			BX.onCustomEvent('Mail::resetGridSelection');
			this.getGridInstance().getRows().unselectAll();
			this.getGridInstance().adjustCheckAllCheckboxes();
			BX.Mail.Home.Grid.hidePanel();
		}
		isSelectedRowsHaveClass(className, id) {
			let selectedIds;
			if (id === undefined) {
				selectedIds = this.getGridInstance().getRows().getSelectedIds();
			} else {
				selectedIds = [id];
			}
			const ids = selectedIds.length ? selectedIds : id ? [id] : [];
			let selectedLinesWithClassNumber = 0;
			for (let i = 0; i < ids.length; i++) {
				const row = this.getGridInstance().getRows().getById(ids[i]);
				if (row && row.node) {
					const columns = row.node.getElementsByClassName(className);
					if (columns && columns.length) {
						selectedLinesWithClassNumber++;
					}
				}
			}
			return selectedLinesWithClassNumber;
		}
		filterRowsByClassName(className, ids, isReversed) {
			let resIds = [];
			if ('all' == ids) {
				resIds = this.getGridInstance().getRows().getBodyChild().map(function (current) {
					return current.getId();
				});
			} else if (Array.isArray(ids)) {
				resIds = ids;
			} else {
				const selectedIds = this.getGridInstance().getRows().getSelectedIds();
				resIds = selectedIds.length ? selectedIds : ids ? [ids] : [];
			}
			const resultIds = [];
			for (let i = resIds.length - 1; i >= 0; i--) {
				const row = this.getGridInstance().getRows().getById(resIds[i]);
				if (row && row.node) {
					const columns = row.node.getElementsByClassName(className);
					if (!isReversed && columns && columns.length) {
						resultIds.push(resIds[i]);
					} else if (isReversed && !(columns && columns.length)) {
						resultIds.push(resIds[i]);
					}
				}
			}
			return resultIds;
		}
		notify(text, delay) {
			top.BX.UI.Notification.Center.notify({
				autoHideDelay: delay > 0 ? delay : 2000,
				content: text ? text : main_core.Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_SUCCESS')
			});
		}
		updateCountersFromBackend() {
			const selector = BX.Mail.Home.MailboxSelector;
			const isAllMailMode = !!(selector && selector.isAllMailMode);
			BX.ajax.runComponentAction('bitrix:mail.client.message.list', 'getMailCounters', {
				mode: 'class',
				data: isAllMailMode ? {} : {
					mailboxId: this.mailboxId
				}
			}).then(function (response) {
				const result = response.data || {};
				const total = Number(result.total || 0);
				if (selector) {
					selector.updateAllMailBadge(total);
					if (result.mailboxes) {
						selector.updatePerMailboxBadges(result.mailboxes);
					}
				}
				if (isAllMailMode) {
					BX.Mail.Home.Counters.setCounters([{
						path: main_core.Loc.getMessage('MAIL_VIRTUAL_FOLDER_KEY'),
						count: total
					}]);
					BX.Mail.Home.mailboxCounters.setCounters([{
						path: 'unseenCountInAllMailboxes',
						count: total
					}]);
				} else if (result.folders && this.getCurrentFolder() === '') {
					BX.Mail.Home.Counters.setCounters(result.folders);
				}
			}.bind(this));
		}
		runAction(actionName, options, actionOnSuccess) {
			options = options ? options : {};
			let selectedIds = [];
			if (options.ids) {
				selectedIds = options.ids;
			}
			if (!selectedIds.length && !selectedIds.for_all) {
				return;
			}
			if (!options.keepRows) {
				this.getGridInstance().tableFade();
			}
			const data = {
				ids: selectedIds
			};
			if (options.params) {
				const optionsKeys = Object.keys(Object(options.params));
				for (let nextIndex = 0, len = optionsKeys.length; nextIndex < len; nextIndex++) {
					const nextKey = optionsKeys[nextIndex];
					const desc = Object.getOwnPropertyDescriptor(options.params, nextKey);
					if (desc !== undefined && desc.enumerable) {
						data[nextKey] = options.params[nextKey];
					}
				}
			}
			BX.ajax.runAction('mail.message.' + actionName, {
				data: data,
				analyticsLabel: options.analyticsLabel
			}).then(function () {
				if (options.onSuccess === false) {
					return;
				}
				this.updateCountersFromBackend();
				if (options.onSuccess && typeof options.onSuccess === "function") {
					options.onSuccess.bind(this, selectedIds, options.successParams)();
					return;
				}
				if (actionOnSuccess) {
					actionOnSuccess();
				}
			}.bind(this), function (response) {
				BX.Mail.Home.Counters.restoreFromCache();
				BX.Mail.Home.Grid.reloadTable();
				this.updateCountersFromBackend();
				options.onError && typeof options.onError === "function" ? options.onError().bind(this, response) : this.onErrorRequest(response);
			}.bind(this));
		}
		onErrorRequest(response) {
			let options = {};
			this.checkErrorRights(response.errors);
			options.errorMessage = response.errors[0].message;
			this.notify(options.errorMessage);
		}
		checkErrorRights(errors) {
			if (this.isAllMailMode()) {
				return;
			}
			for (let i = 0; i < errors.length; i++) {
				if (errors[i].code === this.ERROR_CODE_CAN_NOT_DELETE) {
					this.canDelete = false;
				}
				if (errors[i].code === this.ERROR_CODE_CAN_NOT_MARK_SPAM) {
					this.canMarkSpam = false;
				}
			}
		}
		isAllMailMode() {
			return !!(BX.Mail.Home.MailboxSelector && BX.Mail.Home.MailboxSelector.isAllMailMode);
		}
		getRowMailboxId(rowId) {
			const row = this.getGridInstance().getRows().getById(rowId);
			return parseInt(row?.getData()?.MAILBOX_ID, 10);
		}
		canRowDelete(rowId) {
			return !!this.mailboxCanDelete[this.getRowMailboxId(rowId)];
		}
		canRowMarkSpam(rowId) {
			return !!this.mailboxCanMarkSpam[this.getRowMailboxId(rowId)];
		}
		showDirsSlider(mailboxId) {
			const targetMailboxId = mailboxId ?? this.mailboxId;
			const url = BX.util.add_url_param("/mail/config/dirs", {
				mailboxId: targetMailboxId
			});
			BX.SidePanel.Instance.open(url, {
				width: 640,
				cacheable: false,
				allowChangeHistory: false
			});
			this.canDelete = true;
			this.canMarkSpam = true;
		}
		onDisabledGroupActionClick() {}
		getCurrentFolder() {
			return this.userInterfaceManager.getCurrentFolder();
		}
		getGridInstance() {
			return BX.Main.gridManager.getById(this.gridId).instance;
		}
		getRowsBindings(rows) {
			return BX.util.array_unique(Array.prototype.concat.apply([], rows.map(function (row) {
				if (!row || !row.node) {
					return null;
				}
				return Array.prototype.map.call(row.node.querySelectorAll('[class^="js-bind-"] [data-type]'), function (node) {
					return node.dataset.type;
				});
			})));
		}
		getCache(key) {
			if (!key) {
				return;
			}
			return this.cache[key] ? this.cache[key] : null;
		}
		setCache(key, value) {
			return this.cache[key] = value;
		}
		showICalMenuDropdown(event) {
			event.stopPropagation();
			event.preventDefault();
			const menu = event.currentTarget.dataset.menu;
			if (!menu) {
				return;
			}
			this.iCalMenuDropdown = BX.Main.MenuManager.create({
				id: 'mail-client-message-list-ical-dropdown-menu',
				autoHide: true,
				closeByEsc: true,
				items: JSON.parse(menu),
				zIndex: 7001,
				maxHeight: 400,
				maxWidth: 200,
				angle: {
					position: "top",
					offset: 40
				},
				events: {
					onPopupClose: function () {
						this.removeICalMenuDropdown();
					}.bind(this)
				}
			});
			this.iCalMenuDropdown.popupWindow.setBindElement(event.currentTarget);
			this.iCalMenuDropdown.show();
		}
		removeICalMenuDropdown() {
			if (this.iCalMenuDropdown) {
				BX.Main.MenuManager.destroy(this.iCalMenuDropdown.id);
			}
		}
		onClickICalButton(event) {
			event.stopPropagation();
			event.preventDefault();
			const messageId = event.target.dataset.messageid || event.target.parentNode.dataset.messageid;
			const action = event.target.dataset.action || event.target.parentNode.dataset.action;
			const button = event.target;
			button.classList.add('ui-btn-wait');
			this.removeICalMenuDropdown();
			this.sendICal(messageId, action).then(function () {
				button.classList.remove('ui-btn-wait');
				this.notify(main_core.Loc.getMessage(action === 'cancelled' ? 'MAIL_MESSAGE_ICAL_NOTIFY_REJECT' : 'MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT'));
			}.bind(this)).catch(function () {
				button.classList.remove('ui-btn-wait');
				this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ERROR'));
			}.bind(this));
		}
		sendICal(messageId, action) {
			return new Promise(function (resolve, reject) {
				BX.ajax.runComponentAction('bitrix:mail.client', 'ical', {
					mode: 'ajax',
					data: {
						messageId,
						action
					}
				}).then(function () {
					resolve();
				}.bind(this), function () {
					reject();
				}.bind(this));
			});
		}
	}

	class ProgressBar {
		#node;
		#errorTitleNode;
		#errorTextNode;
		#errorBoxNode;
		#syncButton;
		#errorHintNode;
		constructor(node) {
			this.#node = node;
		}
		setSyncButton(button) {
			this.#syncButton = button;
		}
		getSyncButton() {
			return this.#syncButton;
		}
		getErrorBoxNode() {
			return this.#errorBoxNode;
		}
		setErrorBoxNode(errorBoxNode) {
			this.#errorBoxNode = errorBoxNode;
		}
		setErrorTitleNode(errorTitleNode) {
			this.#errorTitleNode = errorTitleNode;
		}
		setErrorTextNode(errorTextNode) {
			this.#errorTextNode = errorTextNode;
		}
		setErrorHintNode(errorHintNode) {
			this.#errorHintNode = errorHintNode;
		}
		getErrorTextNode() {
			return this.#errorTextNode;
		}
		getErrorHintNode() {
			return this.#errorHintNode;
		}
		getErrorTitleNode() {
			return this.#errorTitleNode;
		}
		show() {
			if (this.getSyncButton() !== undefined) this.getSyncButton().setWaiting(true);
			this.#node.classList.add("mail-progress-show");
			this.#node.classList.remove("mail-progress-hide");
		}
		hide() {
			if (this.getSyncButton() !== undefined) this.getSyncButton().setWaiting(false);
			this.#node.classList.add("mail-progress-hide");
			this.#node.classList.remove("mail-progress-show");
		}
		hideErrorBox() {
			this.#errorBoxNode.classList.add("mail-hidden-element");
			this.#errorBoxNode.classList.remove("mail-visible-element");
		}
		showErrorBox() {
			this.#errorBoxNode.classList.add("mail-visible-element");
			this.#errorBoxNode.classList.remove("mail-hidden-element");
		}
	}

	const namespaceMailHome = main_core.Reflection.namespace('BX.Mail.Home');
	main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
		const [messageEvent] = event.getCompatData();
		if (messageEvent.getEventId() === 'mail-mailbox-config-success') {
			BXMailMailbox.sync(namespaceMailHome.ProgressBar, main_core.Loc.getMessage('MAIL_MESSAGE_FILTER_ID'), false, true);
		}
		if (messageEvent.getEventId() === 'mail-mailbox-config-dirs-success') {
			window.location.reload();
		}
	});
	let sliderPage;
	let progressBar;
	let syncButtonWrapper;
	let sortButtonWrapper;
	let currentFolderSortMode = 'default';
	let selectedIdsForRecovery = {};
	main_core.Event.ready(() => {
		currentFolderSortMode = main_core.Loc.getMessage('MAIL_FOLDER_SORT_MODE') || 'default';
		syncButtonWrapper = document.querySelector('[data-role="mail-msg-sync-button-wrapper"]');
		const syncButton = new ui_buttons.Button({
			className: 'mail-msg-sync-button',
			useAirDesign: true,
			style: ui_buttons.AirButtonStyle.OUTLINE,
			icon: 'o-refresh',
			props: {
				title: main_core.Loc.getMessage('MAIL_MESSAGE_SYNC_BTN_HINT')
			},
			onclick() {
				if (main_core.Loc.getMessage('MAIL_IS_ALL_MAIL_MODE') === 'Y') {
					namespaceMailHome.ProgressBar.show();
					BX.ajax.runAction('mail.mailboxconnecting.syncAllUserMailboxes', {}).finally(() => {
						namespaceMailHome.ProgressBar.hide();
						namespaceMailHome.Grid.reloadTable();
					});
					return;
				}
				BXMailMailbox.sync(namespaceMailHome.ProgressBar, main_core.Loc.getMessage('MAIL_MESSAGE_FILTER_ID'), false, true);
			}
		});
		syncButtonWrapper.replaceChildren(syncButton.getContainer());
		sortButtonWrapper = document.querySelector('[data-role="mail-folder-sort-button-wrapper"]');
		const sortButton = new ui_buttons.Button({
			className: 'mail-folder-sort-button',
			useAirDesign: true,
			style: ui_buttons.AirButtonStyle.OUTLINE,
			icon: 'o-folder',
			props: {
				title: main_core.Loc.getMessage('MAIL_FOLDER_SORT_BTN_HINT')
			},
			onclick() {
				const sortMenuId = 'mail-folder-sort-menu';
				const sortModes = [{
					id: 'default',
					text: main_core.Loc.getMessage('MAIL_FOLDER_SORT_DEFAULT')
				}, {
					id: 'alpha_asc',
					text: main_core.Loc.getMessage('MAIL_FOLDER_SORT_ALPHA_ASC')
				}, {
					id: 'alpha_desc',
					text: main_core.Loc.getMessage('MAIL_FOLDER_SORT_ALPHA_DESC')
				}];
				const menuItems = [{
					delimiter: true,
					html: `<span>${main_core.Loc.getMessage('MAIL_FOLDER_SORT_BTN_HINT')}</span>`
				}, ...sortModes.map(mode => ({
					text: mode.text,
					dataset: {
						testId: `mail_sort-menu__item_${mode.id}`
					},
					className: currentFolderSortMode === mode.id ? 'menu-popup-item-accept' : '',
					onclick() {
						currentFolderSortMode = mode.id;
						sortButtonWrapper.dataset.sortMode = mode.id;
						BX.Main.MenuManager.destroy(sortMenuId);
						main_core_events.EventEmitter.emit('BX.Mail.FolderSort:onChange', {
							mode: mode.id
						});
						BX.ajax.runAction('mail.mailboxsettings.saveFolderSortMode', {
							data: {
								mailboxId: parseInt(main_core.Loc.getMessage('MAIL_MAILBOX_ID'), 10),
								mode: mode.id
							}
						}).catch(response => {
							console.error('Failed to save folder sort mode', response);
						});
					}
				}))];
				const popup = BX.Main.MenuManager.create(sortMenuId, sortButton.getContainer(), menuItems, {
					events: {
						onPopupFirstShow: () => {
							popup.getMenuItems().forEach(menuItem => {
								BX.Event.bind(menuItem.getContainer(), 'click', () => {
									popup.close();
								});
							});
						}
					}
				});
				const menuContainer = popup.getMenuContainer?.();
				if (menuContainer) {
					main_core.Dom.attr(menuContainer, 'data-test-id', 'mail_sync-panel__sort-menu');
				}
				popup.popupWindow.isShown() ? popup.close() : popup.show();
			}
		});
		sortButtonWrapper.replaceChildren(sortButton.getContainer());
		if (currentFolderSortMode !== 'default') {
			sortButtonWrapper.dataset.sortMode = currentFolderSortMode;
			main_core_events.EventEmitter.emit('BX.Mail.FolderSort:onChange', {
				mode: currentFolderSortMode
			});
		}
		if (main_core.Loc.getMessage('MAIL_NEED_SHOW_FOLDER_SORT_GUIDE') === 'Y') {
			new BX.Mail.MailGuide({
				id: 'mail-folder-sort-guide',
				title: main_core.Loc.getMessage('MAIL_FOLDER_SORT_GUIDE_TITLE'),
				description: main_core.Loc.getMessage('MAIL_FOLDER_SORT_GUIDE_DESCRIPTION'),
				bindElement: sortButton.getContainer(),
				addHighlighter: true,
				showImage: false,
				userOptionName: 'folder_sort_guide_shown'
			}).show();
		}
		main_core_events.EventEmitter.subscribe('BX.Main.Grid:onBeforeReload', event => {
			const [grid] = event.getCompatData();
			if (grid !== {} && grid !== undefined && main_core.Loc.getMessage('MAIL_MESSAGE_GRID_ID') === grid.getId()) {
				selectedIdsForRecovery = grid.getRows().getSelectedIds();
			}
		});
		main_core_events.EventEmitter.subscribe('Grid::updated', event => {
			const [grid] = event.getCompatData();
			if (grid !== {} && grid !== undefined && main_core.Loc.getMessage('MAIL_MESSAGE_GRID_ID') === grid.getId()) {
				let rowsWereSelected = false;
				namespaceMailHome.Grid.getRows().map(row => {
					if (main_core.Type.isFunction(selectedIdsForRecovery.indexOf) && selectedIdsForRecovery.includes(row.getId()) && row.isShown()) {
						row.select();
						rowsWereSelected = true;
					}
				});
				selectedIdsForRecovery = {};
				if (rowsWereSelected) {
					setTimeout(() => {
						main_core_events.EventEmitter.emit(window, 'Grid::thereSelectedRows');
					}, 0);
				}
			}
		});
		mail_avatar.Avatar.replaceTagsWithAvatars({
			className: 'mail-ui-avatar'
		});
		sliderPage = document.getElementsByClassName('ui-slider-page')[0];
		progressBar = document.querySelector('[data-role="mail-progress-bar"]');
		sliderPage.insertBefore(progressBar, sliderPage.firstChild);
		document.querySelector('[data-role="error-box"]');
		namespaceMailHome.ProgressBar = new ProgressBar(progressBar);
		namespaceMailHome.ProgressBar.setSyncButton(syncButton);
		namespaceMailHome.ProgressBar.setErrorBoxNode(document.querySelector('[data-role="error-box"]'));
		namespaceMailHome.ProgressBar.setErrorTextNode(document.querySelector('[data-role="error-box-text"]'));
		namespaceMailHome.ProgressBar.setErrorHintNode(document.querySelector('[data-role="error-box-hint"]'));
		namespaceMailHome.ProgressBar.setErrorTitleNode(document.querySelector('[data-role="error-box-title"]'));
	});
	BX.ready(() => {
		namespaceMailHome.Counters = new Counters('dirs', main_core.Loc.getMessage('DEFAULT_DIR'));
		namespaceMailHome.mailboxCounters = new Counters('mailboxCounters');
		namespaceMailHome.Grid = new mail_messagegrid.MessageGrid(main_core.Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY'));
	});
	namespaceMailHome.LeftMenu = LeftMenu;
	const namespaceClientMessage = main_core.Reflection.namespace('BX.Mail.Client.Message');
	namespaceClientMessage.List = List;
	const LimitHelpers = {
		showLimitSlider(code) {
			const activeFeaturePromoter = BX.UI.FeaturePromotersRegistry.getPromoter({
				code
			});
			activeFeaturePromoter.show();
		}
	};
	namespaceClientMessage.LimitHelpers = LimitHelpers;

})(BX, BX.Event, BX.UI, BX.Mail, BX.Mail, BX.Mail);
//# sourceMappingURL=script.js.map
