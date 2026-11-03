/* eslint-disable */
(function (exports, main_core, main_core_events, ui_buttons, mail_avatar, mail_migrationState, mail_messagegrid, mail_directorymenu, ui_a11y, mail_favoritesFilterState) {
	'use strict';

	class Counters {
		cachedCounters = [];
		counters = [];
		hiddenCountersForTotalCounter = [];
		shortcuts = [];
		#name;
		// a cross-folder section keeps its own number, named by the section it belongs to
		sectionCounters = {};
		activeSection = null;
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
			this.#sendCountersUpdate();
		}
		setSectionCounter(section, count) {
			this.sectionCounters[section] = Number(count);
			this.#sendCountersUpdate();
		}
		setActiveSection(section) {
			this.activeSection = section ?? null;
			this.#sendCountersUpdate();
		}

		// the number of a section and the section itself are one state for the panel, so they are
		// set together and the screen redraws once
		setSectionState(section, count, active) {
			this.sectionCounters[section] = Number(count);
			this.activeSection = active ? section : null;
			this.#sendCountersUpdate();
		}
		#sendCountersUpdate() {
			this.sendCounterUpdateEvent({
				...this.counters
			});
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
					total: this.getTotalCounter(),
					// read here rather than at the call, so every update carries the current section state
					sections: this.sectionCounters,
					activeSection: this.activeSection
				}
			});
			main_core_events.EventEmitter.emit('BX.Mail.Home:updatingCounters', event);
		}
	}

	const LABELS_SLIDER_URL$1 = '/mail/labels';
	const LABELS_SECTION = 'labels';
	class LeftMenu {
		constructor(config = {
			dirsWithUnseenMailCounters: {},
			mailboxId: '',
			filterId: '',
			labelsEnabled: false,
			labels: [],
			labelScopeMailboxId: null,
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
				folderCustomOrder: config['folderCustomOrder'],
				folderDefaultOrder: config['folderDefaultOrder'],
				manualSortingAvailable: config['manualSortingAvailable'],
				mailboxId: config['mailboxId'],
				onDirectorySelect: config['onDirectorySelect'],
				listImprovementsEnabled: Boolean(config['listImprovementsEnabled']),
				favoritesLabel: config['favoritesLabel'],
				favoritesActive: Boolean(config['favoritesActive']),
				labelsEnabled: Boolean(config['labelsEnabled'])
			});
			const favoritesNode = this.directoryMenu.getFavoritesNode();
			const foldersNode = this.directoryMenu.getNode();

			// folders, then favorites, then labels when they are on
			leftDirectoryMenuWrapper.append(foldersNode);
			if (favoritesNode) {
				leftDirectoryMenuWrapper.append(favoritesNode);
			}

			// draft and scheduled sections are rendered on the server above the folders, and their place is under
			// them: in the favorites block where there is one, right after the folders where there is not
			const messageSections = leftDirectoryMenuWrapper.querySelectorAll('.mail-draft-navigation');
			messageSections.forEach(section => {
				(favoritesNode ?? leftDirectoryMenuWrapper).append(section);
			});
			if (config['labelsEnabled']) {
				this.#mountLabels(config, leftDirectoryMenuWrapper);
			}
		}
		#mountLabels(config, wrapper) {
			const {
				LabelCollection,
				apiClient
			} = BX.Mail.Label.Core;
			const {
				LabelsMenu
			} = BX.Mail.Label.Menu;
			const filter = BX.Main.filterManager.getById(config['filterId']);
			this.apiClient = apiClient;
			this.filter = filter;
			this.labelScopeMailboxId = config['labelScopeMailboxId'] ?? null;
			this.inboxPath = config['systemDirs']?.inbox ?? '';
			this.labelCollection = new LabelCollection(config['labels'] || []);
			this.labelsMenu = new LabelsMenu({
				container: wrapper,
				labels: this.labelCollection.getAll(),
				onSelect: labelId => this.#selectLabel(filter, labelId),
				onCreate: () => this.#openLabelsSlider()
			});
			this.labelsMenu.render();

			// the labels live outside the folder bundle, so they join its single point of
			// switching the highlight between the sections
			this.directoryMenu.registerSection(LABELS_SECTION, {
				activate: labelId => this.labelsMenu.setActive(labelId),
				deactivate: () => this.labelsMenu.setActive(null),
				// Opening the drafts does not take the label out of the filter, and closing them
				// brings no apply of that filter either. Without this the highlight would go to a
				// folder while the list stays narrowed down to the label.
				claim: () => this.#activeLabelId(filter)
			});
			this.#overrideDirectorySelection(filter);
			this.filterApplyHandler = () => this.#syncActiveLabel(filter);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.filterApplyHandler);
			this.labelsSliderCloseHandler = sliderEvent => this.#handleLabelsSliderClose(sliderEvent);
			this.labelsEventTargets = new Set([this.#getSidePanelEventTarget()]);
			if (typeof BX !== 'undefined' && BX.addCustomEvent) {
				this.labelsEventTargets.add(BX);
			}
			this.labelsEventTargets.forEach(target => target.addCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler));

			// window.top.BX outlives this document, so its handler has to go away with the document.
			main_core.Event.bind(window, 'pagehide', this.#handlePageLeave);
			this.#restoreActiveState(config);
		}
		#handlePageLeave = () => {
			this.destroy();
		};
		destroy() {
			if (!this.labelsSliderCloseHandler) {
				return;
			}
			this.labelsEventTargets.forEach(target => target.removeCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler));
			this.labelsSliderCloseHandler = null;
			main_core_events.EventEmitter.unsubscribe('BX.Main.Filter:apply', this.filterApplyHandler);
			this.filterApplyHandler = null;
			main_core.Event.unbind(window, 'pagehide', this.#handlePageLeave);
			this.labelsMenu?.destroy();
		}
		#getSidePanelEventTarget() {
			if (window.top && window.top.BX && window.top.BX.addCustomEvent) {
				return window.top.BX;
			}
			return BX;
		}
		#handleLabelsSliderClose(sliderEvent) {
			const url = sliderEvent?.getSlider?.()?.getUrl?.() ?? '';
			if (url.includes(LABELS_SLIDER_URL$1)) {
				this.#refetchLabels();
				BX.Mail.Label.AssignMenu?.invalidateSharedLabels();
			}
		}
		#restoreActiveState(config) {
			this.#applyActiveLabel(parseInt(config['labelActiveId'], 10));
		}
		openLabelsCreation() {
			this.#openLabelsSlider();
		}
		#selectLabel(filter, labelId) {
			if (!filter) {
				return;
			}

			// the label is a section of its own: the screen leaves the drafts and the
			// address drops the section marker before the filter reloads the list
			BX.Mail.Home.MessageList?.hideDrafts();
			BX.Mail.Home.MessageList?.leaveFavoritesSection();
			this.#syncLabelFilterItems(filter);
			const filterApi = filter.getApi();
			filterApi.setFields({
				LABEL_ID: String(labelId),
				DIR: ''
			});
			filterApi.apply();
		}
		#syncLabelFilterItems(filter) {
			if (!filter) {
				return;
			}
			const fields = filter.getParam('FIELDS');
			if (!Array.isArray(fields)) {
				return;
			}
			const labelField = fields.find(field => field.NAME === 'LABEL_ID');
			if (!labelField) {
				return;
			}
			const emptyItem = (labelField.ITEMS || []).find(item => item.VALUE === '') ?? {
				NAME: '',
				VALUE: ''
			};
			labelField.ITEMS = [emptyItem, ...this.labelCollection.getAll().map(label => ({
				NAME: label.name,
				VALUE: String(label.id)
			}))];
		}
		#overrideDirectorySelection(filter) {
			const originalChooseFunction = this.directoryMenu.chooseFunction.bind(this.directoryMenu);
			this.directoryMenu.chooseFunction = path => {
				if (filter) {
					filter.getApi().setFields({
						LABEL_ID: ''
					});
				}
				originalChooseFunction(path);
			};
		}
		#syncActiveLabel(filter) {
			if (!filter) {
				return;
			}
			this.#applyActiveLabel(this.#activeLabelId(filter) ?? 0);
		}

		/** @return {?number} id of the label the filter is narrowed down to, null when it is not */
		#activeLabelId(filter) {
			if (!filter) {
				return null;
			}
			const labelId = parseInt(filter.getFilterFieldsValues()['LABEL_ID'], 10);
			return labelId > 0 ? labelId : null;
		}

		// The label state is read back from the filter, and any filter of the screen -
		// the drafts one included - reports its apply here, so the label is re-asserted
		// only while no other section owns the highlight.
		#applyActiveLabel(labelId) {
			if (labelId > 0) {
				this.directoryMenu.syncSection(LABELS_SECTION, labelId);
			} else {
				this.directoryMenu.releaseSection(LABELS_SECTION);
			}
		}
		#openLabelsSlider() {
			if (!BX.SidePanel) {
				return;
			}
			BX.SidePanel.Instance.open(`${LABELS_SLIDER_URL$1}?form=y`, {
				width: 680,
				cacheable: false
			});
		}
		#refetchLabels() {
			this.apiClient.list(this.labelScopeMailboxId).then(labels => {
				this.labelCollection.setAll(labels);
				this.labelsMenu.setLabels(this.labelCollection.getAll());
				this.#syncLabelFilterItems(this.filter);
				this.#reassignActiveLabelIfMissing();
			}).catch(() => this.#notifyError());
		}
		#notifyError() {
			top.BX.UI.Notification.Center.notify({
				autoHideDelay: 2000,
				content: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR')
			});
		}
		#reassignActiveLabelIfMissing() {
			const activeLabelId = this.#getActiveLabelId();
			if (activeLabelId <= 0 || this.labelCollection.getById(activeLabelId)) {
				return;
			}
			const remaining = this.labelCollection.getAll();
			if (remaining.length > 0) {
				this.#selectLabel(this.filter, remaining[0].id);
			} else {
				this.#selectDefaultFolder();
			}
		}
		#getActiveLabelId() {
			if (!this.filter) {
				return 0;
			}
			return parseInt(this.filter.getFilterFieldsValues()['LABEL_ID'], 10) || 0;
		}
		#selectDefaultFolder() {
			if (this.inboxPath) {
				this.directoryMenu.chooseFunction(this.inboxPath);
			}
		}
	}

	const DRAFTS_SECTION = 'drafts';
	const FAVORITES_COUNTERS_REFRESH_DELAY = 300;
	const LABEL_SCOPE_ALL_MAILBOXES = 0;
	const LABELS_SLIDER_URL = '/mail/labels';
	const LABEL_ITEM_ID_PREFIX = 'mail-label-';
	const ACTION_PANEL_MENU_ID = 'ui-action-panel-item-popup-menu';
	const ACTION_PANEL_POPUP_ID = `menu-popup-${ACTION_PANEL_MENU_ID}`;
	const SCHEDULED_GRID_ID = 'mail-scheduled-message-list';
	// Past its own moment the row of a pending send has nothing left to wait for: the list cannot know when
	// the queue will get to the letter. So the waits grow and run out instead of polling on forever - four
	// tries from ten seconds cover a couple of turns of the dispatcher, which walks the queue every minute.
	const UNDO_SEND_OVERDUE_DELAY = 10000;
	const UNDO_SEND_OVERDUE_TRIES = 4;
	// \Bitrix\Mail\Service\ScheduledMessage\ScheduledMessageService::ERROR_REVISION_CONFLICT
	const SCHEDULED_REVISION_CONFLICT_ERROR = 'revision_conflict';
	// the refusals of the same service that name a letter which left the state its row was drawn for:
	// ERROR_ALREADY_SENDING, ERROR_ALREADY_SENT, ERROR_ALREADY_CANCELLED, ERROR_NOT_FOUND
	const SCHEDULED_MOVED_ON_ERRORS = new Set(['already_sending', 'already_sent', 'already_cancelled', 'not_found']);
	// mail.client.scheduled-view, SliderMessage.Cancelled
	const SCHEDULED_CANCELLED_MESSAGE = 'Mail.Client.ScheduledMessageCancelled';
	// mail.client.compose-form, SliderMessage.ScheduledMessageSaved
	const SCHEDULED_SAVED_MESSAGE = 'Mail.Client.ScheduledMessageSaved';
	// the badge of the section item as the server draws it here; the item of `mail.directorymenu` carries the
	// same one and hides it by the same class (`mail/install/js/mail/directorymenu/src/item.js`)
	const SCHEDULED_SECTION_COUNTER_SELECTOR = '[data-testid="mail-scheduled-messages-button"] .ui-sidepanel-menu-link-text-counter';
	const SCHEDULED_SECTION_COUNTER_HIDDEN_CLASS = 'ui-sidepanel-menu-link-text-counter-hidden';
	const UNDO_SEND_CANCELLED_EVENT = 'Mail.UndoSend:onCancelled';
	class List {
		constructor(options) {
			this.gridId = options.gridId;
			this.filterId = options.filterId;
			this.isDraftMode = options.isDraftMode === true;
			this.isScheduledMode = options.isScheduledMode === true;
			this.composePath = options.composePath || '';
			this.composeSliderOptions = options.composeSliderOptions || {
				cacheable: false
			};
			this.draftsPath = options.draftsPath || '';
			this.scheduledPath = options.scheduledPath || '';
			this.messageListPath = options.messageListPath || '';
			this.favoritesSectionActive = options.favoritesSectionActive === true;
			this.favoritesUnread = Number(options.favoritesUnread) || 0;
			// the section is a part of the list improvements, and the server applies its marker only
			// under them: with the improvements off the same marker in the address means nothing here
			this.listImprovementsEnabled = main_core.Loc.getMessage('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
			this.folderBehindFavoritesSection = '';
			this.draftDeleteConfirm = options.draftDeleteConfirm || '';
			this.draftDeleteDescription = options.draftDeleteDescription || '';
			this.draftDeleteManyConfirm = options.draftDeleteManyConfirm || '';
			this.draftDeleteManyDescription = options.draftDeleteManyDescription || '';
			this.draftDeleteButton = options.draftDeleteButton || '';
			this.draftCancelButton = options.draftCancelButton || '';
			this.draftDeletePartialError = options.draftDeletePartialError || '';
			this.scheduledCancelConfirm = options.scheduledCancelConfirm || '';
			this.scheduledCancelDescription = options.scheduledCancelDescription || '';
			this.scheduledCancelNothing = options.scheduledCancelNothing || '';
			this.scheduledCancelButton = options.scheduledCancelButton || '';
			this.scheduledCancelError = options.scheduledCancelError || '';
			this.scheduledCancelPartialError = options.scheduledCancelPartialError || '';
			this.scheduledCancelErrorReasons = options.scheduledCancelErrorReasons || {};
			this.scheduledRetryError = options.scheduledRetryError || '';
			this.scheduledRetryErrorReasons = options.scheduledRetryErrorReasons || {};
			this.scheduledRetryAnnounce = options.scheduledRetryAnnounce || '';
			this.retryingScheduledMessages = new Set();
			this.scheduledSendNowButton = options.scheduledSendNowButton || '';
			this.scheduledSendNowSuccess = options.scheduledSendNowSuccess || '';
			this.scheduledSendNowNothing = options.scheduledSendNowNothing || '';
			this.scheduledSendNowError = options.scheduledSendNowError || '';
			this.scheduledSendNowPartialError = options.scheduledSendNowPartialError || '';
			this.scheduledSendNowErrorReasons = options.scheduledSendNowErrorReasons || {};
			this.sendingNowScheduledMessages = new Set();
			this.scheduledListAnnounce = options.scheduledListAnnounce || '';
			// the page of the section builds its own left menu, so it hands the item over; the message list page
			// draws its item as server markup and hands nothing
			this.directoryMenu = options.directoryMenu || null;
			this.mailboxId = options.mailboxId;
			this.canMarkSpam = options.canMarkSpam;
			this.canDelete = options.canDelete;
			this.mailboxCanDelete = options.mailboxCanDelete ?? {};
			this.mailboxCanMarkSpam = options.mailboxCanMarkSpam ?? {};
			this.ERROR_CODE_CAN_NOT_DELETE = options.ERROR_CODE_CAN_NOT_DELETE;
			this.ERROR_CODE_CAN_NOT_MARK_SPAM = options.ERROR_CODE_CAN_NOT_MARK_SPAM;
			this.disabledClassName = 'js-disabled';
			this.migrationActiveMailboxIds = new Set();
			this.migrationActionIds = options.migrationActionIds ?? [];
			this.migrationMailboxIds = options.migrationMailboxIds ?? [Number(this.mailboxId)];
			this.migrationStates = new Map();
			this.migrationStateUnsubscribes = [];
			this.migrationStatesInitialized = false;
			this.migrationStatesDestroyed = false;
			this.migrationPageLeaveHandler = null;
			this.migrationActionPreviousState = new WeakMap();
			this.modifiedDraftSliders = new Set();
			this.closedDraftSliders = new Map();
			this.userInterfaceManager = new BX.Mail.Client.Message.List.UserInterfaceManager(options);
			this.userInterfaceManager.resetGridSelection = this.resetGridSelection.bind(this);
			this.userInterfaceManager.isSelectedRowsHaveClass = this.isSelectedRowsHaveClass.bind(this);
			this.userInterfaceManager.getGridInstance = this.getGridInstance.bind(this);
			this.userInterfaceManager.updateCountersFromBackend = this.updateCountersFromBackend.bind(this);
			this.cache = {};
			this.isAssignMenuOpening = false;
			this.undoSendRefreshTimer = null;
			this.undoSendOverdueRows = '';
			this.undoSendOverdueTries = 0;
			this.undoSendCancelledHandler = event => this.handleUndoSendCancelled(event);
			main_core_events.EventEmitter.subscribe(UNDO_SEND_CANCELLED_EVENT, this.undoSendCancelledHandler);
			this.pageLeaveHandler = () => this.destroy();
			main_core.Event.bind(window, 'pagehide', this.pageLeaveHandler);
			const labelCore = BX.Mail && BX.Mail.Label && BX.Mail.Label.Core ? BX.Mail.Label.Core : null;
			this.labelCollection = labelCore ? new labelCore.LabelCollection(options.labels || []) : null;
			this.labelsVersion = 0;
			this.addEventHandlers();
			this.initDraftsSection();
			this.initFavoritesSectionCounter();
			if (!this.isDraftMode && !this.isScheduledMode) {
				setTimeout(() => this.initClientDraftList());
				// the sections live in the address, so history navigation drives them even
				// on portals where the embedded draft list is off
				main_core.Event.bind(window, 'popstate', () => this.handleHistoryChange());
				this.initScheduledList();
			}
			if (this.labelCollection) {
				this.subscribeLabelsSliderClose();
			}
			BX.Mail.Client.Message.List[options.id] = this;
			BX.Mail.Client.Message.List.confirmDeleteSelectedDrafts = this.confirmDeleteSelectedDrafts.bind(this);
			main_core.Reflection.namespace('BX.Mail.Home').MessageList = this;
			BX.Mail.Client.Message.List.confirmDeleteScheduledMessage = this.confirmDeleteScheduledMessage.bind(this);
			BX.Mail.Client.Message.List.confirmDeleteSelectedScheduledMessages = this.confirmDeleteSelectedScheduledMessages.bind(this);
			BX.Mail.Client.Message.List.retryScheduledMessage = this.retryScheduledMessage.bind(this);
			BX.Mail.Client.Message.List.sendNowScheduledMessage = this.sendNowScheduledMessage.bind(this);
			BX.Mail.Client.Message.List.confirmSendNowSelectedScheduledMessages = this.confirmSendNowSelectedScheduledMessages.bind(this);
			this.scheduleUndoSendRefresh();
			if (!this.isDraftMode) {
				this.migrationPageLeaveHandler = () => this.destroyMigrationStates();
				main_core.Event.bind(window, 'pagehide', this.migrationPageLeaveHandler);
				const initializations = [];
				this.migrationMailboxIds.forEach(mailboxId => {
					const normalizedMailboxId = Number(mailboxId);
					if (!Number.isInteger(normalizedMailboxId) || normalizedMailboxId <= 0) {
						return;
					}
					const migrationState = mail_migrationState.getMigrationState(normalizedMailboxId);
					this.migrationStates.set(normalizedMailboxId, migrationState);
					this.migrationStateUnsubscribes.push(migrationState.subscribe(change => {
						this.setMailboxMigrationActive(normalizedMailboxId, change.active, this.migrationStatesInitialized);
					}));
					this.setMailboxMigrationActive(normalizedMailboxId, migrationState.isActive(), false);
					initializations.push(migrationState.initialize());
				});
				void Promise.all(initializations).then(() => {
					if (this.migrationStatesDestroyed) {
						return;
					}
					this.migrationActiveMailboxIds.clear();
					this.migrationStates.forEach((migrationState, mailboxId) => {
						if (migrationState.isActive()) {
							this.migrationActiveMailboxIds.add(mailboxId);
						}
					});
					this.migrationStatesInitialized = true;
					this.applyMigrationStateToGrid();
				});
			}
		}
		reloadOutcomeGrid() {
			if (this.userInterfaceManager.isCurrentFolderOutcome) {
				this.getGridInstance()?.reloadTable('POST');
			}
		}
		prependUndoSendProjection(projection) {
			const operationId = Number(projection?.operationId);
			const grid = this.getGridInstance();
			if (operationId <= 0 || !this.userInterfaceManager.isCurrentFolderOutcome || !grid || document.querySelector(`[data-undo-send-id="${operationId}"]`)) {
				return;
			}
			const recipients = ['to', 'cc', 'bcc'].flatMap(type => main_core.Type.isArray(projection.recipients?.[type]) ? projection.recipients[type] : []).map(recipient => {
				const name = main_core.Type.isStringFilled(recipient?.name) ? recipient.name.trim() : '';
				const email = main_core.Type.isStringFilled(recipient?.email) ? recipient.email.trim() : '';
				return name || email;
			}).filter(recipient => recipient !== '');
			const recipientText = recipients.length > 0 ? recipients.join(main_core.Loc.getMessage('MAIL_MESSAGE_SEPARATOR_OF_NAMES_AND_EMAILS_IN_LISTS') ?? ', ') : main_core.Loc.getMessage('MAIL_MESSAGE_EMPTY_RCPT') ?? '';
			const subjectText = main_core.Type.isStringFilled(projection.subject) ? projection.subject.trim() : main_core.Loc.getMessage('MAIL_MESSAGE_EMPTY_SUBJECT_PLACEHOLDER') ?? '';
			const sender = main_core.Tag.render`
			<span class="mail-name-block mail-msg-list-cell-nowrap mail-msg-list-cell-flex">
				<span class="mail-msg-from-title">${main_core.Text.encode(recipientText)}</span>
			</span>
		`;
			const subject = main_core.Tag.render`
			<span class="mail-title-block mail-msg-list-cell-flex">
				<span class="mail-msg-list-subject">${main_core.Text.encode(subjectText)}</span>
				<span class="mail-undo-send-pending-status">
					&nbsp;&mdash;&nbsp;${main_core.Text.encode(main_core.Loc.getMessage('MAIL_SCHEDULED_LIST_STATUS_SENDING') ?? '')}
				</span>
			</span>
		`;
			main_core.Dom.attr(subject, {
				'data-testid': `mail-undo-send-pending-row-${operationId}`,
				'data-undo-send-id': operationId,
				'data-undo-send-refresh-at': Date.parse(projection.cancelUntil)
			});
			const rowId = `undo-send-${operationId}`;
			grid.getRealtime().addRow({
				id: rowId,
				columns: {
					FROM: sender,
					SUBJECT: subject,
					DATE: ''
				},
				prepend: true,
				animation: false
			});
			const checkbox = grid.getRows().getById(rowId)?.getCheckbox();
			if (checkbox) {
				checkbox.disabled = true;
				main_core.Dom.attr(checkbox, 'data-disabled', '1');
			}
			this.scheduleUndoSendRefresh();
		}
		dropUndoSendDraftProjection(projection) {
			const draftId = Number(projection?.draftId);
			if (draftId <= 0) {
				return;
			}
			const row = this.getDraftGridInstance()?.getRows().getById(`draft-${draftId}`);
			const node = row?.getNode?.() ?? row?.node;
			if (node) {
				main_core.Dom.remove(node);
			}
		}
		handleUndoSendCancelled(event) {
			const operationId = Number(event.getData()?.operation?.operationId);
			if (operationId > 0) {
				const marker = document.querySelector(`[data-undo-send-id="${operationId}"]`);
				if (marker) {
					main_core.Dom.remove(marker.closest('.main-grid-row') ?? marker);
				}
			}
			this.scheduleUndoSendRefresh();
		}

		/**
		 * A reload of the grid raises `Grid::updated`, which brings the screen back here - and the row of the
		 * pending send comes back carrying the same moment, already past. A flat wait would therefore rebuild
		 * the whole grid every ten seconds for as long as the row is on the screen. The waits grow instead and
		 * run out; a different set of pending rows starts the count anew, so the next letter is not left
		 * unrefreshed by the tries the previous one spent.
		 */
		scheduleUndoSendRefresh() {
			if (this.undoSendRefreshTimer !== null) {
				clearTimeout(this.undoSendRefreshTimer);
				this.undoSendRefreshTimer = null;
			}
			const rows = [...document.querySelectorAll('[data-undo-send-refresh-at]')];
			const refreshTimestamps = rows.map(row => Number(row.dataset.undoSendRefreshAt)).filter(timestamp => Number.isFinite(timestamp) && timestamp > 0);
			if (refreshTimestamps.length === 0 || !this.userInterfaceManager.isCurrentFolderOutcome) {
				this.forgetUndoSendOverdueTries();
				return;
			}
			const dueIn = Math.min(...refreshTimestamps) - Date.now() + 2000;
			if (dueIn > 0) {
				this.forgetUndoSendOverdueTries();
				this.undoSendRefreshTimer = setTimeout(() => this.reloadOutcomeGrid(), Math.max(1000, Math.min(dueIn, 60000)));
				return;
			}
			const overdueRows = rows.map(row => row.dataset.undoSendId ?? '').join(',');
			if (overdueRows !== this.undoSendOverdueRows) {
				this.undoSendOverdueRows = overdueRows;
				this.undoSendOverdueTries = 0;
			}
			if (this.undoSendOverdueTries >= UNDO_SEND_OVERDUE_TRIES) {
				return;
			}
			const delay = UNDO_SEND_OVERDUE_DELAY * 2 ** this.undoSendOverdueTries;
			this.undoSendOverdueTries++;
			this.undoSendRefreshTimer = setTimeout(() => this.reloadOutcomeGrid(), delay);
		}
		forgetUndoSendOverdueTries() {
			this.undoSendOverdueRows = '';
			this.undoSendOverdueTries = 0;
		}
		setMailboxMigrationActive(mailboxId, active, applyToGrid = true) {
			const wasActive = this.migrationActiveMailboxIds.has(mailboxId);
			if (active === true) {
				this.migrationActiveMailboxIds.add(mailboxId);
			} else {
				this.migrationActiveMailboxIds.delete(mailboxId);
			}
			if (applyToGrid) {
				this.applyMigrationStateToGrid(wasActive && !active);
			}
		}
		applyMigrationStateToGrid(resetSelection = false) {
			BX.Mail.Home.Grid?.setMigrationLocked(this.migrationActiveMailboxIds);
			if (resetSelection) {
				BX.Mail.Home.Grid?.resetGridSelection();
			}
			this.syncMigrationActionPanel();
		}
		destroyMigrationStates() {
			if (this.migrationStatesDestroyed) {
				return;
			}
			this.migrationStatesDestroyed = true;
			this.migrationStateUnsubscribes.forEach(unsubscribe => unsubscribe());
			this.migrationStateUnsubscribes = [];
			this.migrationStates.clear();
			if (this.migrationPageLeaveHandler) {
				main_core.Event.unbind(window, 'pagehide', this.migrationPageLeaveHandler);
				this.migrationPageLeaveHandler = null;
			}
		}
		syncMigrationActionPanel() {
			const panel = BX.Mail.Home.Grid?.getPanel();
			if (!panel) {
				return;
			}
			const selectedIds = this.getGridInstance()?.getRows().getSelectedIds() ?? [];
			const hasSelection = selectedIds.length > 0;
			const migrationSelected = BX.Mail.Home.Grid?.areAllRowsSelected?.() === true ? this.shouldRefuseMigrationActionForMessageIds(['all']) : this.shouldRefuseMigrationActionForMessageIds(selectedIds);
			const migrationItems = (panel.items ?? []).filter(item => this.migrationActionIds.includes(item.id) || item.dataset?.migrationDangerous === true);
			migrationItems.forEach(item => {
				if (migrationSelected) {
					if (!this.migrationActionPreviousState.has(item)) {
						this.migrationActionPreviousState.set(item, {
							// an item described without the flag answers `undefined` rather than `false`
							// (`ui.actionpanel/src/item.js:101`), and the restore below reads a boolean
							disabled: item.isDisabled() === true,
							title: item.layout?.container?.getAttribute('title') ?? null
						});
					}
					item.disable();
					item.layout?.container?.setAttribute('title', main_core.Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE'));
					return;
				}
				const previousState = this.migrationActionPreviousState.get(item);
				if (!previousState) {
					return;
				}
				if (previousState.disabled === false && hasSelection) {
					item.enable();
				} else {
					item.disable();
				}
				this.migrationActionPreviousState.delete(item);
				const container = item.layout?.container;
				if (container?.getAttribute('title') === main_core.Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE')) {
					if (previousState.title === null) {
						container.removeAttribute('title');
					} else {
						container.setAttribute('title', previousState.title);
					}
				}
			});
		}
		hasActiveMigrationForMessageIds(messageIds) {
			if (this.migrationActiveMailboxIds.size === 0) {
				return false;
			}
			if (messageIds.includes('all')) {
				return true;
			}
			return messageIds.some(messageId => this.migrationActiveMailboxIds.has(this.getRowMailboxId(messageId)));
		}
		shouldRefuseMigrationActionForMessageIds(messageIds) {
			const mailboxIds = messageIds.includes('all') ? [...this.migrationStates.keys()] : messageIds.map(messageId => this.getRowMailboxId(messageId));
			return mailboxIds.some(mailboxId => {
				const migrationState = this.migrationStates.get(mailboxId);
				return migrationState !== undefined && (!migrationState.isInitialized() || migrationState.isActive());
			});
		}
		refuseMigrationAction(id) {
			const messageIds = id === undefined ? BX.Mail.Home.Grid?.areAllRowsSelected?.() === true ? ['all'] : this.getGridInstance().getRows().getSelectedIds() : [id];
			return this.shouldRefuseMigrationActionForMessageIds(messageIds);
		}

		// The left menu decides which section is lit, and the drafts item is rendered by
		// the template: the screen hands the menu the pair of handlers for that item.
		initDraftsSection() {
			const directoryMenu = BX.Mail.Home.LeftMenuNode?.directoryMenu;
			if (!directoryMenu) {
				return;
			}
			directoryMenu.registerSection(DRAFTS_SECTION, {
				activate: () => this.applyDraftsHighlight(true),
				deactivate: () => this.applyDraftsHighlight(false)
			});
			if (this.isDraftMode) {
				directoryMenu.activateSection(DRAFTS_SECTION);
			}
		}
		setDraftsSectionActive(active) {
			const directoryMenu = BX.Mail.Home.LeftMenuNode?.directoryMenu;
			if (!directoryMenu) {
				this.applyDraftsHighlight(active);
				return;
			}
			if (active) {
				directoryMenu.activateSection(DRAFTS_SECTION);
			} else {
				directoryMenu.releaseSection(DRAFTS_SECTION);
			}
		}
		applyDraftsHighlight(active) {
			const draftsButton = document.querySelector('[data-testid="mail-drafts-button"]');
			if (!draftsButton) {
				return;
			}
			if (active) {
				main_core.Dom.addClass(draftsButton, 'mail-menu-directory-item--active');
				main_core.Dom.attr(draftsButton, 'aria-current', 'page');
			} else {
				main_core.Dom.removeClass(draftsButton, 'mail-menu-directory-item--active');
				main_core.Dom.attr(draftsButton, 'aria-current', null);
			}
		}

		/**
		 * The section is a part of the page only where the server drew it: it lives inside one mailbox, so the all
		 * mail mode and a portal with the feature off get neither its rows nor its item, and nothing here to switch
		 * to them either.
		 */
		initScheduledList() {
			this.scheduledListContainer = document.querySelector('[data-testid="mail-client-scheduled-list"]');
			if (!this.scheduledListContainer) {
				return;
			}
			this.messageListContainer ??= document.querySelector('[data-role="mail-message-list-view"]');
			this.messageFilterContainer ??= document.querySelector('[data-role="mail-message-list-filter"]');
			// The left menu is put into the page after this runs, so the click is caught on the document instead
			// of the button: one listener that also survives a rebuild of the menu.
			this.scheduledNavigationClickHandler = this.handleScheduledNavigationClick.bind(this);
			main_core.Event.bind(document, 'click', this.scheduledNavigationClickHandler);
			this.scheduledHistoryHandler = () => {
				if (this.isScheduledUrl(window.location.href)) {
					this.showScheduledMessages(false);
				} else {
					this.hideScheduledMessages(false);
				}
			};
			main_core.Event.bind(window, 'popstate', this.scheduledHistoryHandler);
			if (this.isScheduledUrl(window.location.href)) {
				this.showScheduledMessages(false);
			}
		}

		// The switch is bound to the click alone: an action carried out on `pointerdown` cannot be called off by
		// moving the pointer away from the button.
		handleScheduledNavigationClick(event) {
			const button = event.target?.closest?.('[data-testid="mail-scheduled-messages-button"]');
			if (!button) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			this.scheduledNavigationButton = button;
			this.showScheduledMessages();
		}
		isScheduledUrl(url) {
			if (!this.scheduledPath) {
				return false;
			}
			const currentUrl = new URL(url, window.location.origin);
			const scheduledUrl = new URL(this.scheduledPath, window.location.origin);
			const currentPath = currentUrl.pathname.replace(/\/+$/, '');
			const scheduledPath = scheduledUrl.pathname.replace(/\/+$/, '');
			if (currentPath !== scheduledPath) {
				return false;
			}
			return ['page', 'id'].every(parameter => !scheduledUrl.searchParams.has(parameter) || currentUrl.searchParams.get(parameter) === scheduledUrl.searchParams.get(parameter));
		}
		showScheduledMessages(updateHistory = true) {
			this.scheduledNavigationButton = document.querySelector('[data-testid="mail-scheduled-messages-button"]');
			this.scheduledListContainer = document.querySelector('[data-testid="mail-client-scheduled-list"]');
			this.messageListContainer = document.querySelector('[data-role="mail-message-list-view"]');
			this.messageFilterContainer = document.querySelector('[data-role="mail-message-list-filter"]');
			if (!this.scheduledNavigationButton || !this.scheduledListContainer || !this.messageListContainer || !this.messageFilterContainer || this.scheduledListContainer.hidden === false) {
				return;
			}
			this.hideDrafts(false);
			this.resetGridViewSelection(this.gridId);
			this.resetGridViewSelection('mail-scheduled-message-list');
			this.messageListContainer.hidden = true;
			this.scheduledListContainer.hidden = false;
			this.messageFilterContainer.hidden = true;
			this.unfixActionPanel(this.gridId);
			this.refreshActionPanelPosition('mail-scheduled-message-list');
			main_core.Dom.addClass(document.body, 'mail-client-draft-list-view');
			BX.Mail.Home.LeftMenuNode?.directoryMenu?.clearActiveMenuButtons();
			main_core.Dom.addClass(this.scheduledNavigationButton.closest('.mail-menu-directory-item-drafts'), 'mail-menu-directory-item--active');
			this.scheduledNavigationButton.setAttribute('aria-current', 'page');

			// the rows the section shows were drawn when the page was loaded, and the schedule has moved on since:
			// entering the section rereads them by its own address, as the drafts do, and the number of the section
			// follows them the same way it follows a reread of the rows (`reloadScheduledGrid`)
			const scheduledGrid = this.getScheduledGridInstance();
			if (scheduledGrid && this.scheduledPath) {
				scheduledGrid.baseUrl = this.scheduledPath;
				scheduledGrid.reloadTable('POST', {}, () => this.updateCountersFromBackend(), this.scheduledPath);
			}
			if (updateHistory) {
				window.history.pushState({
					mailScheduledList: true
				}, '', this.scheduledPath);
				this.enterScheduledView();
			}
		}

		// The whole main area is replaced without a page load, so the change is told to the reader and the focus
		// follows the list that took the place of the messages. A restore on load or on Back goes through the
		// same methods with no history to update and leaves the focus where the user left it.
		enterScheduledView() {
			if (this.scheduledListAnnounce) {
				ui_a11y.LiveAnnouncer.announce(this.scheduledListAnnounce);
			}
			this.focusScheduledSection(this.scheduledListContainer);
		}
		focusScheduledSection(section) {
			if (!section) {
				return;
			}
			main_core.Dom.attr(section, 'tabindex', '-1');
			section.focus();
		}
		hideScheduledMessages(updateHistory = true) {
			this.scheduledNavigationButton = document.querySelector('[data-testid="mail-scheduled-messages-button"]');
			this.scheduledListContainer = document.querySelector('[data-testid="mail-client-scheduled-list"]');
			this.messageListContainer = document.querySelector('[data-role="mail-message-list-view"]');
			this.messageFilterContainer = document.querySelector('[data-role="mail-message-list-filter"]');
			if (!this.scheduledNavigationButton || !this.scheduledListContainer || !this.messageListContainer || !this.messageFilterContainer || this.scheduledListContainer.hidden) {
				return;
			}
			this.scheduledListContainer.hidden = true;
			this.resetGridViewSelection('mail-scheduled-message-list');
			this.messageListContainer.hidden = false;
			this.messageFilterContainer.hidden = false;
			this.unfixActionPanel('mail-scheduled-message-list');
			this.refreshActionPanelPosition(this.gridId);
			main_core.Dom.removeClass(document.body, 'mail-client-draft-list-view');
			main_core.Dom.removeClass(this.scheduledNavigationButton.closest('.mail-menu-directory-item-drafts'), 'mail-menu-directory-item--active');
			this.scheduledNavigationButton.removeAttribute('aria-current');
			if (updateHistory) {
				window.history.pushState({
					mailScheduledList: false
				}, '', this.messageListPath);
			}
		}
		initClientDraftList(attempt = 0) {
			this.draftNavigationButton = document.querySelector('[data-testid="mail-drafts-button"]');
			this.messageListContainer = document.querySelector('[data-role="mail-message-list-view"]');
			this.draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
			this.messageFilterContainer = document.querySelector('[data-role="mail-message-list-filter"]');
			this.draftFilterContainer = document.querySelector('[data-testid="mail-draft-list-filter"]');
			if (!this.draftNavigationButton || !this.messageListContainer || !this.draftListContainer || !this.messageFilterContainer || !this.draftFilterContainer) {
				if (attempt < 100) {
					setTimeout(() => this.initClientDraftList(attempt + 1), 50);
				}
				return;
			}
			this.draftNavigationButton.addEventListener('click', event => {
				event.preventDefault();
				event.stopImmediatePropagation();
				this.showDrafts();
			});
			if (this.isDraftUrl(window.location.href)) {
				this.showDrafts(false);
			}
		}
		handleHistoryChange() {
			if (this.isDraftUrl(window.location.href)) {
				this.showDrafts(false);
				return;
			}
			this.hideDrafts(false);
			this.syncFavoritesSectionFromHistory();
		}
		isDraftUrl(url) {
			const currentUrl = new URL(url, window.location.origin);
			const draftUrl = new URL(this.draftsPath, window.location.origin);
			if (currentUrl.pathname.replace(/\/+$/, '') !== draftUrl.pathname.replace(/\/+$/, '')) {
				return false;
			}
			return !draftUrl.searchParams.has('list_mode') || currentUrl.searchParams.get('list_mode') === draftUrl.searchParams.get('list_mode');
		}
		showDrafts(updateHistory = true) {
			if (!this.draftListContainer || this.draftListContainer.hidden === false) {
				return;
			}
			if (this.favoritesSectionActive) {
				// the drafts address carries no section marker, so the section is left behind
				this.switchFavoritesSection(false, {
					updateHistory: false,
					reload: false
				});
			}
			this.hideScheduledMessages(false);
			this.resetGridViewSelection(this.gridId);
			this.resetGridViewSelection('mail-internal-draft-list');
			this.messageListContainer.hidden = true;
			this.draftListContainer.hidden = false;
			this.messageFilterContainer.hidden = true;
			this.draftFilterContainer.hidden = false;
			this.unfixActionPanel(this.gridId);
			this.refreshActionPanelPosition('mail-internal-draft-list');
			main_core.Dom.addClass(document.body, 'mail-client-draft-list-view');
			this.setDraftsSectionActive(true);
			const draftGrid = this.getDraftGridInstance();
			if (draftGrid) {
				draftGrid.baseUrl = this.draftsPath;
				this.syncDraftActionPanel(draftGrid);
				const moreButton = this.draftListContainer.querySelector(`#${draftGrid.getId()}_nav_more`);
				if (moreButton) {
					const page = new URL(moreButton.href, window.location.origin).searchParams.get('mail-internal-draft-list');
					moreButton.href = BX.util.add_url_param(this.draftsPath, {
						'mail-internal-draft-list': page
					});
				}
				draftGrid.reloadTable('POST', {}, null, this.draftsPath);
				setTimeout(() => this.syncDraftActionPanel(this.getDraftGridInstance()));
			}
			if (updateHistory) {
				window.history.pushState({
					mailDraftList: true
				}, '', this.draftsPath);
			}
		}
		unfixActionPanel(gridId) {
			const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
			actionPanel?.getPositionTracker?.().stop();
			actionPanel?.unfixPanel();
			if (actionPanel?.renderTo) {
				actionPanel.renderTo.appendChild(actionPanel.getPanelContainer());
				main_core.Dom.removeClass(actionPanel.getPanelContainer(), 'ui-action-panel-fixed');
				actionPanel.panelIsFixed = null;
			}
		}
		refreshActionPanelPosition(gridId) {
			const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
			if (!actionPanel) {
				return;
			}
			actionPanel.getPositionTracker?.().start();
			actionPanel.unfixPanel();
			requestAnimationFrame(() => {
				actionPanel.adjustPanelStyle();
				actionPanel.handleScroll();
			});
		}
		resetGridViewSelection(gridId) {
			if (gridId === this.gridId) {
				BX.onCustomEvent('Mail::resetGridSelection');
			}
			const grid = BX.Main.gridManager.getInstanceById(gridId);
			grid?.getRows().unselectAll();
			grid?.adjustCheckAllCheckboxes();
			const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
			const checkAllCheckbox = actionPanel?.getPanelContainer().querySelector(`input[data-mail-grid-check-all="${gridId}"]`);
			if (checkAllCheckbox) {
				checkAllCheckbox.checked = false;
				checkAllCheckbox.indeterminate = false;
			}
			actionPanel?.setTotalSelectedItems(0);
			actionPanel?.hidePanel(grid);
		}
		syncDraftActionPanel(draftGrid) {
			const actionPanel = BX.Mail.Home.GridActionPanels?.['mail-internal-draft-list'];
			if (actionPanel && draftGrid) {
				actionPanel.grid = draftGrid;
				this.userInterfaceManager.addCheckAllCheckbox(actionPanel, draftGrid);
			}
		}
		hideDrafts(updateHistory = true) {
			if (!this.draftListContainer || this.draftListContainer.hidden) {
				return;
			}
			this.resetGridViewSelection('mail-internal-draft-list');
			this.resetGridViewSelection(this.gridId);
			this.draftListContainer.hidden = true;
			this.messageListContainer.hidden = false;
			this.draftFilterContainer.hidden = true;
			this.messageFilterContainer.hidden = false;
			this.unfixActionPanel('mail-internal-draft-list');
			this.refreshActionPanelPosition(this.gridId);
			main_core.Dom.removeClass(document.body, 'mail-client-draft-list-view');
			this.setDraftsSectionActive(false);
			if (updateHistory) {
				window.history.pushState({
					mailDraftList: false
				}, '', this.messageListPath);
			}
			this.selectedDraftIds = [];
		}
		showFavoritesSection() {
			this.hideDrafts(false);
			this.switchFavoritesSection(true, {
				// a repeated pick of the same section refreshes it instead of stacking history
				updateHistory: !this.favoritesSectionActive,
				reload: true
			});
		}
		leaveFavoritesSection() {
			if (!this.favoritesSectionActive) {
				return;
			}

			// the caller reloads the list itself by applying the filter
			this.switchFavoritesSection(false, {
				updateHistory: true,
				reload: false
			});
		}

		// The list owns the state "which section is active and what its number is": it carries the number
		// the server sent into the counters structure, and the panel reads it from the update event.
		initFavoritesSectionCounter() {
			if (this.isDraftMode || !this.listImprovementsEnabled) {
				return;
			}
			BX.Mail.Home.Counters.setSectionState(mail_favoritesFilterState.FAVORITES_SECTION, this.favoritesUnread, this.favoritesSectionActive);
		}
		publishFavoritesUnread(count) {
			// an answer without the number leaves the panel as it is, while a zero of the server is a number
			if (!this.listImprovementsEnabled || !main_core.Type.isNumber(count)) {
				return;
			}
			BX.Mail.Home.Counters.setSectionCounter(mail_favoritesFilterState.FAVORITES_SECTION, count);
		}
		setActiveFavoritesSection(active) {
			if (!this.listImprovementsEnabled) {
				return;
			}
			BX.Mail.Home.Counters.setActiveSection(active ? mail_favoritesFilterState.FAVORITES_SECTION : null);
		}
		navigateToMessageList(params) {
			const url = BX.util.add_url_param(this.messageListPath, params);
			const slider = top.BX.SidePanel.Instance.getTopSlider();
			if (slider) {
				slider.setUrl(url);
				slider.getFrameWindow().location.href = url;
				return;
			}
			window.location.href = url;
		}
		syncFavoritesSectionFromHistory() {
			if (!this.listImprovementsEnabled) {
				return;
			}
			const active = mail_favoritesFilterState.isFavoritesSectionUrl(window.location.href);
			if (active === this.favoritesSectionActive) {
				return;
			}
			this.switchFavoritesSection(active, {
				updateHistory: false,
				reload: true
			});
		}
		switchFavoritesSection(active, {
			updateHistory,
			reload
		}) {
			const base = this.isDraftUrl(window.location.href) ? this.messageListPath : window.location.href;
			const url = active ? mail_favoritesFilterState.withFavoritesSection(base) : mail_favoritesFilterState.withoutFavoritesSection(base);
			const grid = BX.Main.gridManager.getById(this.gridId)?.instance ?? null;
			if (active && !this.favoritesSectionActive) {
				// the way back: the section is left for the folder it was entered from
				this.folderBehindFavoritesSection = this.getFilterFolder();
			}

			// the folder is kept for one way back only, so leaving the section spends it
			const folderBehindSection = this.folderBehindFavoritesSection;
			if (!active) {
				this.folderBehindFavoritesSection = '';
			}
			this.favoritesSectionActive = active;
			// before the filter below: the update it sends has to carry the section state already
			this.setActiveFavoritesSection(active);
			if (grid) {
				// the grid keeps its own copy of the address it reloads from
				grid.baseUrl = url;
			}
			if (updateHistory) {
				window.history.pushState({
					mailFavoritesSection: active
				}, '', url);
			}
			BX.Mail.Home.LeftMenuNode?.directoryMenu?.setFavoritesActive(active);
			if (!reload) {
				return;
			}

			// the all mail view keeps no folder field, so there is nothing to hand over to the filter
			if (this.hasFilterFolderField()) {
				this.applyFolderToFilter(active ? '' : folderBehindSection);
				return;
			}
			grid?.reloadTable('POST', {}, null, url);
		}
		getFilterInstance() {
			const filter = BX.Main?.filterManager?.getById?.(this.filterId);
			return BX.Main?.Filter && filter instanceof BX.Main.Filter ? filter : null;
		}
		hasFilterFolderField() {
			return this.getFilterInstance()?.getFilterFieldsValues()?.DIR !== undefined;
		}
		getFilterFolder() {
			return this.getFilterInstance()?.getFilterFieldsValues()?.DIR ?? '';
		}

		// The section spans the whole mailbox, so it holds the filter at "any folder": the very field the
		// left menu writes when a folder is picked. Applying it reloads the list from the address the
		// section owns, so the filter and the selection tell the same story.
		applyFolderToFilter(folder) {
			// forced, so that the extension lays the fields over the applied ones and leaves the rest of
			// the filter as the user set it; without the flag a named preset takes the folder into the
			// additional values it saves for the user
			this.getFilterInstance().getApi().extendFilter({
				DIR: folder,
				LABEL_ID: ''
			}, true);
		}
		addEventHandlers() {
			BX.addCustomEvent('Grid::updated', () => {
				this.syncDraftActionPanel(this.getDraftGridInstance());
				this.scheduleUndoSendRefresh();
				this.syncMigrationActionPanel();
			});
			BX.addCustomEvent('Grid::thereSelectedRows', () => this.syncMigrationActionPanel());
			BX.addCustomEvent('Grid::allRowsSelected', () => this.syncMigrationActionPanel());
			BX.addCustomEvent('BX.UI.ActionPanel:created', () => this.syncMigrationActionPanel());

			// todo delete this hack
			// it is here to prevent grid's title changing after filter apply
			BX.ajax.UpdatePageData = function () {};
			BX.addCustomEvent('SidePanel.Slider:onMessage', event => {
				if (event.getEventId() === 'Mail.Client.DraftClosed') {
					const slider = event.getSender?.();
					if (slider) {
						this.closedDraftSliders.set(slider, event.getData()?.content ?? '');
					}
					return;
				}
				if (event.getEventId() === 'Mail.Client.DraftSaved') {
					const slider = event.getSender?.();
					if (slider) {
						this.modifiedDraftSliders.add(slider);
					}
					return;
				}

				// the card of the letter names the one whose send it called off, and the row of it goes away here
				// the same way it goes away when the send is called off from the list itself
				if (event.getEventId() === SCHEDULED_CANCELLED_MESSAGE) {
					const scheduledId = Number(event.getData()?.id);
					// the number of the section comes back with its rows; a section standing hidden behind another
					// list has no rows to reread, so there the number is asked for on its own
					if (scheduledId <= 0 || !this.rereadScheduledRows([scheduledId])) {
						this.updateCountersFromBackend();
					}

					// the letter is not lost by calling off its send, it goes back to the drafts: the rows of the
					// drafts behind the slider were drawn while it was still on the schedule
					this.reloadDraftGrid();
					return;
				}

				// the form of the letter names the schedule it wrote, and the section shows it here without an entry
				// of its own: the rows behind the slider were drawn before the letter was put on the schedule
				if (event.getEventId() === SCHEDULED_SAVED_MESSAGE) {
					if (!this.reloadScheduledGrid()) {
						this.updateCountersFromBackend();
					}
					return;
				}
				if (event.getEventId() !== 'Mail.Client.MessageCreatedSuccess') {
					return;
				}
				const undoSendProjection = event.getData()?.undoSendProjection;
				this.prependUndoSendProjection(undoSendProjection);
				if (undoSendProjection) {
					this.modifiedDraftSliders.delete(event.getSender?.());
					this.dropUndoSendDraftProjection(undoSendProjection);
				} else {
					this.reloadDraftGrid();
				}
			});
			(window.top?.BX ?? BX).addCustomEvent('SidePanel.Slider:onCloseComplete', event => {
				const slider = event.getSlider?.();
				if (this.modifiedDraftSliders.delete(slider)) {
					this.reloadDraftGrid();
				}
				if (this.closedDraftSliders.has(slider)) {
					const content = this.closedDraftSliders.get(slider);
					this.closedDraftSliders.delete(slider);
					void this.showDraftSavedNotification(content);
				}
			});
			document.addEventListener('click', event => {
				const draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
				if (draftListContainer && !draftListContainer.hidden) {
					setTimeout(() => {
						if (!draftListContainer.hidden) {
							this.updateDraftActionPanel();
						}
					}, 50);
					setTimeout(() => {
						if (!draftListContainer.hidden) {
							this.updateDraftActionPanel();
						}
					}, 250);
				}
			}, true);
			if (this.isDraftMode) {
				return;
			}
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

			// the star of any grid changes what the favorites section holds, and the number of it
			// always comes from the server - the screen just asks for it again. A series of stars
			// asks once: the counters request is the heaviest one of the screen
			main_core_events.EventEmitter.subscribe('BX.Mail.Favorites:onChange', main_core.Runtime.debounce(() => this.updateCountersFromBackend(), FAVORITES_COUNTERS_REFRESH_DELAY));
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
			main_core_events.EventEmitter.subscribe('BX.Main.Menu.Item:onmouseenter', event => {
				const menuItem = event.target;
				if (menuItem && menuItem.dataset && menuItem.dataset.labelMenu) {
					this.prepareLabelsSubMenu(menuItem);
				}
			});
			this.panelPopupShowHandler = popupWindow => this.handleActionPanelPopupShow(popupWindow);
			BX.addCustomEvent(window, 'onPopupShow', this.panelPopupShowHandler);
			const itemsMenu = document.querySelectorAll('.ical-event-control-menu');
			for (let i = 0; i < itemsMenu.length; i++) {
				itemsMenu[i].addEventListener('click', this.showICalMenuDropdown.bind(this));
			}
			BX.bindDelegate(document.body, 'click', {
				className: 'ical-event-control-button'
			}, this.onClickICalButton.bind(this));
		}
		async showDraftSavedNotification(content) {
			const rootWindow = window.top ?? window;
			let notificationCenter = rootWindow.BX?.UI?.Notification?.Center;
			if (!notificationCenter) {
				const notificationExtension = await rootWindow.BX.Runtime.loadExtension('ui.notification');
				notificationCenter = rootWindow.BX?.UI?.Notification?.Center ?? notificationExtension.Center;
			}
			notificationCenter.notify({
				content
			});
		}
		reloadDraftGrid() {
			this.getDraftGridInstance()?.reloadTable('POST');
		}
		openDraft(draftId) {
			BX.SidePanel.Instance.open(BX.util.add_url_param(this.composePath, {
				draftId
			}), this.composeSliderOptions);
		}
		deleteScheduledMessage(id, revision) {
			return BX.ajax.runAction('mail.api.scheduledmessage.cancel', {
				data: {
					id,
					revision
				}
			}).then(response => {
				this.rereadScheduledRows([id]);
				return response;
			}, response => {
				this.showScheduledCancelFailures([response], id);
				return response;
			});
		}

		/**
		 * The letters of a batch are checked one by one on the server, so the answer carries a verdict per letter:
		 * the ones that were called off leave the section, and the ones that were not name their reasons. A request
		 * refused as a whole carries no per-letter answer and is read as one refusal.
		 *
		 * The rows are reread once for the whole answer: the letters that left the section and the rows a refusal
		 * left stale come back in the same request, so the list is not redrawn twice and the focus not thrown twice.
		 */
		deleteSelectedScheduledMessages() {
			const messages = this.getSelectedScheduledMessages();
			if (messages.length === 0) {
				return Promise.resolve();
			}
			return BX.ajax.runAction('mail.api.scheduledmessage.cancelBatch', {
				data: {
					items: messages
				}
			}).then(response => {
				const results = Array.isArray(response.data?.results) ? response.data.results : [];
				const cancelled = results.filter(result => result.success === true);
				const failures = results.length > 0 ? results.filter(result => result.success !== true) : [response];
				this.notifyScheduledBatchOutcome('', this.getScheduledFailureText(failures, this.scheduledCancelPhrases()));
				if (cancelled.length > 0 || this.hasStaleScheduledRow(failures)) {
					this.rereadScheduledSection();
				}
				return response;
			}, response => {
				this.showScheduledCancelFailures([response]);
				return response;
			});
		}

		/**
		 * One refused letter, told and answered: the reason reaches the reader and the rows are reread when the
		 * refusal says the row on the screen outlived the letter behind it.
		 *
		 * The rows are reread on the same refusals for every action of the section, and for the same causes: the
		 * server checks the letter alike for all of them. A refusal that names the reader instead of the letter,
		 * and the two of the draft the cancellation writes, leave the letter in the state its row was drawn for,
		 * so those keep the rows where they are.
		 *
		 * @param {{reasons: Object, error: string, partialError: string}} phrases words of the pressed action
		 */
		showScheduledFailures(failures, phrases, messageId = 0) {
			const text = this.getScheduledFailureText(failures, phrases);
			if (text === '') {
				return;
			}
			this.notifyScheduledOutcome(text);
			if (this.hasStaleScheduledRow(failures)) {
				this.reloadScheduledGrid(messageId);
			}
		}

		/**
		 * The words of a refusal, without saying them. A letter the action did not move keeps its row, so the words
		 * name the reason; a batch of them is counted instead, as the drafts list counts the drafts it failed to
		 * delete. Which words the reader gets is decided by the action they pressed: every action of the section
		 * carries a dictionary of its own, and a code none of them knows is answered by its general phrase. A run
		 * that refused nothing is answered with nothing.
		 *
		 * @param {{reasons: Object, error: string, partialError: string}} phrases words of the pressed action
		 */
		getScheduledFailureText(failures, phrases) {
			if (failures.length === 0) {
				return '';
			}
			return failures.length === 1 ? phrases.reasons[this.getScheduledErrorCode(failures[0])] || phrases.error : phrases.partialError.replace('#COUNT#', String(failures.length));
		}

		// the revision of a row lives in its markup, so a stale one is only cured by rereading the rows
		hasStaleScheduledRow(failures) {
			return failures.some(failure => {
				const code = this.getScheduledErrorCode(failure);
				return code === SCHEDULED_REVISION_CONFLICT_ERROR || SCHEDULED_MOVED_ON_ERRORS.has(code);
			});
		}
		scheduledCancelPhrases() {
			return {
				reasons: this.scheduledCancelErrorReasons,
				error: this.scheduledCancelError,
				partialError: this.scheduledCancelPartialError
			};
		}
		scheduledSendNowPhrases() {
			return {
				reasons: this.scheduledSendNowErrorReasons,
				error: this.scheduledSendNowError,
				partialError: this.scheduledSendNowPartialError
			};
		}
		showScheduledCancelFailures(failures, messageId = 0) {
			this.showScheduledFailures(failures, this.scheduledCancelPhrases(), messageId);
		}
		showScheduledSendNowFailures(failures, messageId = 0) {
			this.showScheduledFailures(failures, this.scheduledSendNowPhrases(), messageId);
		}

		/**
		 * The outcome of a batch that moved some letters and refused others: a balloon for each half, as before,
		 * and a single announcement carrying both. `LiveAnnouncer` keeps one live region and one queue, and an
		 * assertive announcement takes down a polite one still waiting for its frame — announced apart, the letters
		 * that left would be lost and the reader would hear the refusal as the whole answer.
		 */
		notifyScheduledBatchOutcome(successText, failureText) {
			const texts = [successText, failureText].filter(text => text !== '');
			if (texts.length === 0) {
				return;
			}
			texts.forEach(text => this.notify(text, 5000));
			ui_a11y.LiveAnnouncer.announce(texts.join(' '), failureText === '' ? 'polite' : 'assertive');
		}

		/**
		 * The balloon of `ui.notification` is drawn without a live region of its own, so the reader who does not see
		 * it is told the outcome apart from it. `assertive`: the letter did not go anywhere, and the row it is read
		 * from says nothing about the refusal.
		 */
		notifyScheduledOutcome(text) {
			this.notify(text, 5000);
			ui_a11y.LiveAnnouncer.announce(text, 'assertive');
		}
		getScheduledErrorCode(failure) {
			return String(failure?.errors?.[0]?.code ?? '');
		}

		/**
		 * Queues a letter that stopped at an error for sending again. The action asks nothing back: the letter is
		 * the one the author wrote and the send is what they already asked for, so a confirmation would only stand
		 * between them. The second click while the first request is out is dropped — the row keeps its menu open
		 * and its revision until the section is reread, and a repeat of it would be refused as a conflict.
		 *
		 * The answer of the server frees the letter before anything else is done with it: what follows redraws the
		 * section, and a throw in the middle of that would leave the letter held for the rest of the page. A
		 * `finally` would say this in one place, but `BX.ajax` answers with `BX.Promise`, which has none.
		 */
		retryScheduledMessage(id, revision) {
			if (this.retryingScheduledMessages.has(id)) {
				return Promise.resolve();
			}
			this.retryingScheduledMessages.add(id);
			return BX.ajax.runAction('mail.api.scheduledmessage.retry', {
				data: {
					id,
					revision
				}
			}).then(response => {
				this.retryingScheduledMessages.delete(id);
				// the letter keeps its row and only the text of its status changes, which no reader is told
				ui_a11y.LiveAnnouncer.announce(this.scheduledRetryAnnounce);
				this.reloadScheduledGrid(id);
				return response;
			}, response => {
				this.retryingScheduledMessages.delete(id);
				this.showScheduledRetryFailure(response, id);
				return response;
			});
		}

		/**
		 * A letter that was not queued again keeps its row and its reason, so the message names the refusal. The
		 * rows are reread on a stale revision for the same cause as a refused cancellation: the revision lives in
		 * the markup and nothing but a reread cures it.
		 *
		 * A refusal that names the state of the letter is reread for a cause of its own: the letter is sending,
		 * sent, called off or gone, so the row on the screen outlived the state it was drawn for and would go on
		 * offering a repeat of a letter that has nothing to repeat. What is left in the section, and under which
		 * status, is decided by the server — the rows are asked for anew instead of being guessed at here.
		 */
		showScheduledRetryFailure(failure, messageId = 0) {
			const code = this.getScheduledErrorCode(failure);
			this.notifyScheduledOutcome(this.scheduledRetryErrorReasons[code] || this.scheduledRetryError);
			if (code === SCHEDULED_REVISION_CONFLICT_ERROR || SCHEDULED_MOVED_ON_ERRORS.has(code)) {
				this.reloadScheduledGrid(messageId);
			}
		}

		/**
		 * Brings the moment of a letter to now, which is all the send on demand is: the letter leaves with the
		 * nearest run of the dispatcher, so the message says it is being sent and promises nothing sooner. Nothing
		 * is asked back: the send is the one the author already asked for, only earlier.
		 *
		 * The second click while the first request is out is dropped, the way a repeat drops it: the row keeps the
		 * revision it was drawn with until the section is reread, and a repeat of it would be refused as a conflict.
		 * The answer of the server frees the letter before the section is redrawn, since `BX.Promise` has no
		 * `finally` to say it in one place.
		 *
		 * The number of the section is not asked for beside the rows: the nearest run of the dispatcher may take the
		 * letter while they are on their way, so the number is asked for once they are back (`reloadScheduledGrid`).
		 */
		sendNowScheduledMessage(id, revision) {
			if (this.sendingNowScheduledMessages.has(id)) {
				return Promise.resolve();
			}
			this.sendingNowScheduledMessages.add(id);
			return BX.ajax.runAction('mail.api.scheduledmessage.sendNow', {
				data: {
					id,
					revision
				}
			}).then(response => {
				this.sendingNowScheduledMessages.delete(id);
				this.notifyScheduledSuccess(this.scheduledSendNowSuccess);
				this.reloadScheduledGrid(id);
				return response;
			}, response => {
				this.sendingNowScheduledMessages.delete(id);
				this.showScheduledSendNowFailures([response], id);
				return response;
			});
		}

		/**
		 * The letters of a batch are checked one by one on the server, so the answer is read the same way the
		 * group cancellation reads it: the ones that left are counted together, and the ones that did not name
		 * their reasons. A request refused as a whole carries no per-letter answer and is read as one refusal.
		 *
		 * Both halves of the answer are told at once, and the rows are reread once for the whole of it.
		 */
		sendNowSelectedScheduledMessages() {
			const messages = this.getSelectedScheduledMessagesForSendNow();
			if (messages.length === 0) {
				return Promise.resolve();
			}
			return BX.ajax.runAction('mail.api.scheduledmessage.sendNowBatch', {
				data: {
					items: messages
				}
			}).then(response => {
				const results = Array.isArray(response.data?.results) ? response.data.results : [];
				const sent = results.filter(result => result.success === true);
				const failures = results.length > 0 ? results.filter(result => result.success !== true) : [response];
				this.notifyScheduledBatchOutcome(sent.length > 0 ? this.scheduledPluralPhrase('MAIL_SCHEDULED_LIST_SEND_NOW_MANY_SUCCESS', sent.length) : '', this.getScheduledFailureText(failures, this.scheduledSendNowPhrases()));
				if (sent.length > 0 || this.hasStaleScheduledRow(failures)) {
					this.rereadScheduledSection();
				}
				return response;
			}, response => {
				this.showScheduledSendNowFailures([response]);
				return response;
			});
		}

		/**
		 * The panel offers the send while the selection holds a letter it can send, so a press with none of them
		 * left comes from a panel that outlived its rows: the reader is told the refusal instead of meeting a
		 * button that does nothing.
		 */
		confirmSendNowSelectedScheduledMessages() {
			const messages = this.getSelectedScheduledMessagesForSendNow();
			if (messages.length === 0) {
				this.notifyScheduledOutcome(this.scheduledSendNowNothing);
				return;
			}
			this.showDraftDeleteConfirmation(this.scheduledPluralPhrase('MAIL_SCHEDULED_LIST_SEND_NOW_MANY_CONFIRM', messages.length), this.describeScheduledSelection('MAIL_SCHEDULED_LIST_SEND_NOW_MANY_DESCRIPTION', 'MAIL_SCHEDULED_LIST_SEND_NOW_SKIPPED', messages.length), () => this.sendNowSelectedScheduledMessages(), this.scheduledSendNowButton, ui_buttons.AirButtonStyle.FILLED);
		}

		/**
		 * The group phrases of the section name a number of letters, and the number is only known once the rows are
		 * ticked: the form is chosen here, off the forms the page registered. The panel appears on a single ticked
		 * row as well, so the singular is a case of its own and not an edge of the plural.
		 */
		scheduledPluralPhrase(phraseId, count) {
			return main_core.Loc.getMessagePlural(phraseId, count, {
				'#COUNT#': String(count)
			}) || '';
		}

		/**
		 * What the confirmation says about the selection: the letters the action takes, and the ticked rows it
		 * leaves behind. Every other refusal of the section names its reason, so rows dropped without a word would
		 * be the only thing the reader is left to guess at.
		 */
		describeScheduledSelection(descriptionPhraseId, skippedPhraseId, count) {
			const description = this.scheduledPluralPhrase(descriptionPhraseId, count);
			const skipped = this.getSelectedScheduledRowCount() - count;
			return skipped > 0 ? `${description}. ${this.scheduledPluralPhrase(skippedPhraseId, skipped)}` : description;
		}

		/**
		 * The balloon of `ui.notification` is drawn without a live region of its own, so the reader who does not see
		 * it is told the outcome apart from it. `polite`: the letter is on its way, and nothing the reader is doing
		 * has to give way to that.
		 */
		notifyScheduledSuccess(text) {
			this.notify(text, 5000);
			ui_a11y.LiveAnnouncer.announce(text);
		}

		/**
		 * Rereads the rows of the section the user is looking at right now: the page of the section alone, and the
		 * embedded section only while it is open — a hidden one is reread by `showScheduledMessages` on the way in.
		 * A hidden section is said so, since its number is then the only thing left to ask for.
		 *
		 * A reread replaces every row, and the focus standing on one of them goes away with it, so the letter the
		 * action was asked for is carried in as the point of return. Reading it off the focus instead would find
		 * the item of a row menu, which lives outside the row and names no letter.
		 *
		 * The number of the section is asked for once the rows are back and never beside them: the dispatcher takes
		 * the letters of the section on runs of its own, and a number read while the rows were still on their way
		 * would belong to a section the rows do not show.
		 *
		 * @return {boolean} whether the rows were asked for at all
		 */
		reloadScheduledGrid(messageId = 0) {
			const container = document.querySelector('[data-testid="mail-client-scheduled-list"]');
			if (!this.isScheduledMode && !(container && !container.hidden)) {
				return false;
			}
			const focusedBeforeReload = document.activeElement;
			this.getScheduledGridInstance()?.reloadTable('POST', {}, () => {
				this.updateCountersFromBackend();
				this.restoreScheduledFocus(messageId, focusedBeforeReload);
			}, this.scheduledPath);
			return true;
		}

		/**
		 * Gives back the place the reread took away: the row of the letter while it is still in the section, and
		 * the section itself once the letter has left it — the same point of return the section takes on the way in.
		 *
		 * The focus is only ours to move while it is where the request left it: on the body the redrawn rows dropped
		 * it to, or still on the item of the row menu, which the menu takes down right after and drops it as well.
		 * A focus the user moved elsewhere in the meantime is theirs and is left alone.
		 */
		restoreScheduledFocus(messageId, focusedBeforeReload) {
			const active = document.activeElement;
			if (active !== null && active !== document.body && active !== focusedBeforeReload) {
				return;
			}
			const rowMenuButton = messageId > 0 ? document.querySelector(`[data-scheduled-id="${messageId}"] .main-grid-row-action-button`) : null;
			if (rowMenuButton) {
				this.focusOnceDrawn(rowMenuButton);
				return;
			}
			this.focusScheduledSection(document.querySelector(this.isScheduledMode ? '[data-testid="mail-scheduled-list-root"]' : '[data-testid="mail-client-scheduled-list"]'));
		}

		/**
		 * The rows the grid has just drawn replay a short visibility animation of its own, and nothing hidden by it
		 * takes the focus, so the node is offered it over the next frames until it accepts. The section itself
		 * stands outside those rows and needs none of this.
		 */
		focusOnceDrawn(node, attemptsLeft = 3) {
			requestAnimationFrame(() => {
				node.focus();
				if (document.activeElement !== node && attemptsLeft > 0) {
					this.focusOnceDrawn(node, attemptsLeft - 1);
				}
			});
		}
		getScheduledGridInstance() {
			return BX.Main.gridManager.getInstanceById(SCHEDULED_GRID_ID);
		}
		getSelectedScheduledMessages() {
			return this.collectSelectedScheduledMessages(dataset => dataset.scheduledCanCancel === 'true');
		}

		/**
		 * The group panel holds no menu of its own, so the rule the menu of a row keeps reaches it through the mark
		 * of the row: a letter that stopped at an error is sent again by its own repeat and not by this action.
		 */
		getSelectedScheduledMessagesForSendNow() {
			return this.collectSelectedScheduledMessages(dataset => dataset.scheduledCanSendNow === 'true');
		}

		/** How many rows the reader has ticked, whatever each action of the panel may do with them. */
		getSelectedScheduledRowCount() {
			const rows = this.getScheduledGridInstance()?.getRows().getSelected() ?? [];
			return rows.filter(row => row.getNode()?.dataset.scheduledId !== undefined).length;
		}
		collectSelectedScheduledMessages(isEligible) {
			const rows = this.getScheduledGridInstance()?.getRows().getSelected() ?? [];
			return rows.map(row => {
				const node = row.getNode();
				return {
					id: Number(node?.dataset.scheduledId),
					revision: Number(node?.dataset.scheduledRevision)
				};
			}).filter(({
				id
			}, index) => {
				const dataset = rows[index].getNode()?.dataset;
				return id > 0 && dataset !== undefined && isEligible(dataset);
			});
		}

		/**
		 * What is left in the section is decided by the server, so the rows are reread once instead of being
		 * taken off one by one: `BX.Grid.Row.remove()` is a request of its own that redraws the whole section.
		 * A run that moved no letter leaves the rows as they were and reads nothing back.
		 *
		 * @return {boolean} whether the rows were asked for at all
		 */
		rereadScheduledRows(changedIds) {
			return changedIds.length > 0 && this.rereadScheduledSection();
		}

		/**
		 * The section as the server has it now, selection and all: a run that moved letters leaves the ticks of the
		 * rows it consumed behind, so they go with the rows.
		 *
		 * @return {boolean} whether the rows were asked for at all
		 */
		rereadScheduledSection() {
			const grid = this.getScheduledGridInstance();
			grid?.getRows().unselectAll();
			grid?.adjustCheckAllCheckboxes();
			return this.reloadScheduledGrid();
		}
		confirmDeleteScheduledMessage(id, revision) {
			this.showDraftDeleteConfirmation(this.scheduledCancelConfirm, this.scheduledCancelDescription, () => this.deleteScheduledMessage(id, revision), this.scheduledCancelButton);
		}
		confirmDeleteSelectedScheduledMessages() {
			const messages = this.getSelectedScheduledMessages();
			if (messages.length === 0) {
				this.notifyScheduledOutcome(this.scheduledCancelNothing);
				return;
			}
			this.showDraftDeleteConfirmation(this.scheduledPluralPhrase('MAIL_SCHEDULED_LIST_CANCEL_MANY_CONFIRM', messages.length), this.describeScheduledSelection('MAIL_SCHEDULED_LIST_CANCEL_MANY_DESCRIPTION', 'MAIL_SCHEDULED_LIST_CANCEL_SKIPPED', messages.length), () => this.deleteSelectedScheduledMessages(), this.scheduledCancelButton);
		}
		deleteDraft(draftId) {
			return new Promise((resolve, reject) => {
				BX.ajax.runAction('mail.api.draft.delete', {
					data: {
						draftId
					}
				}).then(response => {
					if (response.data.deleted === true) {
						BX.Mail.Home.FilterToolbar?.decreaseStaticCount(1);
					}
					this.getDraftGridInstance()?.reloadTable('POST', {}, null, this.draftsPath);
					resolve(response);
				}, reject);
			});
		}
		deleteSelectedDrafts() {
			const draftIds = this.getSelectedDraftIds();
			if (draftIds.length === 0) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				BX.ajax.runAction('mail.api.draft.deleteMany', {
					data: {
						draftIds
					}
				}).then(response => {
					const deletedIds = Array.isArray(response.data.deletedIds) ? response.data.deletedIds : [];
					const failedIds = Array.isArray(response.data.failedIds) ? response.data.failedIds : [];
					BX.Mail.Home.FilterToolbar?.decreaseStaticCount(deletedIds.length);
					const draftGrid = this.getDraftGridInstance();
					draftGrid?.getRows().unselectAll();
					draftGrid?.adjustCheckAllCheckboxes();
					this.selectedDraftIds = [];
					draftGrid?.reloadTable('POST', {}, null, this.draftsPath);
					if (failedIds.length > 0) {
						this.notify(this.draftDeletePartialError.replace('#COUNT#', String(failedIds.length)), 5000);
					}
					resolve(response);
				}, reject);
			});
		}
		getSelectedDraftIds() {
			const draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
			const draftIds = Array.from(draftListContainer?.querySelectorAll('.main-grid-row[data-draft-id] input[type="checkbox"]:checked') || []).map(checkbox => Number(checkbox.closest('[data-draft-id]').dataset.draftId));
			return draftIds.length > 0 ? draftIds : this.selectedDraftIds || [];
		}
		confirmDeleteSelectedDrafts() {
			const draftIds = this.getSelectedDraftIds();
			if (draftIds.length === 0) {
				return;
			}
			this.showDraftDeleteConfirmation(this.draftDeleteManyConfirm, this.draftDeleteManyDescription.replace('#COUNT#', String(draftIds.length)), () => this.deleteSelectedDrafts());
		}
		confirmDeleteDraft(draftId) {
			this.showDraftDeleteConfirmation(this.draftDeleteConfirm, this.draftDeleteDescription, () => this.deleteDraft(draftId));
		}

		/**
		 * The dialog serves every confirmation of the two lists, and most of them stand before something that
		 * destroys a letter, so the alert style is what it keeps by default. A caller confirming an action that
		 * destroys nothing (the send of the letters already scheduled) hands it the accent style instead.
		 */
		async showDraftDeleteConfirmation(title, description, onConfirm, confirmButtonText = this.draftDeleteButton, confirmButtonStyle = ui_buttons.AirButtonStyle.FILLED_ALERT) {
			const {
				Dialog,
				Text
			} = await main_core.Runtime.loadExtension(['ui.system.dialog', 'ui.system.typography']);
			let dialog;
			const confirmButton = new ui_buttons.Button({
				text: confirmButtonText,
				dataset: {
					testid: 'mail-list-confirm-submit'
				},
				size: ui_buttons.ButtonSize.LARGE,
				style: confirmButtonStyle,
				useAirDesign: true,
				onclick: () => {
					confirmButton.setWaiting();
					cancelButton.setDisabled();
					const handleError = () => {
						confirmButton.setWaiting(false);
						cancelButton.setDisabled(false);
					};
					try {
						const result = onConfirm();
						if (result && typeof result.then === 'function') {
							result.then(() => dialog.hide(), handleError);
						} else {
							dialog.hide();
						}
					} catch {
						handleError();
					}
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: this.draftCancelButton,
				dataset: {
					testid: 'mail-list-confirm-cancel'
				},
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: () => dialog.hide()
			});
			dialog = new Dialog({
				title,
				content: Text.render(description, {
					size: 'sm'
				}),
				centerButtons: [confirmButton, cancelButton],
				hasCloseButton: true,
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				width: 480
			});
			dialog.show();
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
		updateDraftActionPanel() {
			const draftGrid = this.getDraftGridInstance();
			const actionPanel = BX.Mail.Home.GridActionPanels?.['mail-internal-draft-list'];
			if (!draftGrid || !actionPanel) {
				return;
			}
			actionPanel.grid = draftGrid;
			this.selectedDraftIds = this.getSelectedDraftIds();
			const selectedCount = this.selectedDraftIds.length;
			actionPanel.setTotalSelectedItems(selectedCount);
			const deleteItem = actionPanel.getItemById('draft-delete');
			const deleteButton = document.querySelector('[data-testid="mail-client-draft-list"] #draft-delete');
			if (selectedCount === 0) {
				deleteItem?.disable();
			} else {
				deleteItem?.enable();
				if (deleteButton) {
					BX.data(deleteButton, 'slider-ignore-autobinding', true);
					deleteButton.querySelectorAll('*').forEach(element => {
						BX.data(element, 'slider-ignore-autobinding', true);
					});
				}
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
		onAssignLabelClick() {
			if (this.isAssignMenuOpening) {
				return;
			}
			const messageIds = this.getGridInstance().getRows().getSelectedIds();
			if (!messageIds.length) {
				return;
			}
			const bindElement = window.event && window.event.target ? window.event.target : document.body;
			this.showAssignMenu(bindElement, messageIds, this.resolveCommonMessageLabelIds(messageIds));
		}
		resolveMessageLabelIds(id) {
			const apiClient = this.getLabelApiClient();
			if (!apiClient) {
				return Promise.resolve([]);
			}
			return apiClient.messageLabels(id).catch(() => []);
		}

		// Labels of the whole selection: the group selector shows them as assigned, so a click removes
		// them everywhere. A failure is passed on instead of opening an empty "nothing assigned" state.
		resolveCommonMessageLabelIds(messageIds) {
			const apiClient = this.getLabelApiClient();
			if (!apiClient) {
				return Promise.resolve([]);
			}
			return apiClient.commonMessageLabels(messageIds);
		}
		resolveLabelScopeMailboxId(messageIds) {
			if (!this.isAllMailMode()) {
				return this.mailboxId;
			}
			const mailboxIds = new Set(messageIds.map(messageId => this.parseMailboxId(messageId)));
			return mailboxIds.size === 1 ? [...mailboxIds][0] : LABEL_SCOPE_ALL_MAILBOXES;
		}
		parseMailboxId(messageId) {
			const mailboxId = Number(String(messageId).split('-').pop());
			return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : LABEL_SCOPE_ALL_MAILBOXES;
		}
		showAssignMenu(bindElement, messageIds, currentLabelIds) {
			this.isAssignMenuOpening = true;
			return main_core.Runtime.loadExtension('mail.label.assign-menu').then(({
				AssignMenu
			}) => AssignMenu.show({
				bindElement,
				messageIds,
				currentLabelIds,
				mailboxId: this.resolveLabelScopeMailboxId(messageIds),
				onChange: change => this.onLabelAssignmentChanged(change)
			})).catch(() => this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR'))).finally(() => {
				this.isAssignMenuOpening = false;
			});
		}
		onLabelAssignmentChanged(change) {
			if (!change || change.assigned) {
				return;
			}
			const filter = BX.Main.filterManager.getById(this.filterId);
			if (!filter) {
				return;
			}
			const activeLabelId = parseInt(filter.getFilterFieldsValues()['LABEL_ID'], 10);
			if (activeLabelId > 0 && activeLabelId === change.labelId) {
				this.resetGridSelection();
				BX.Mail.Home.Grid.reloadTable();
			}
		}
		getLabelApiClient() {
			return BX.Mail.Label && BX.Mail.Label.Core ? BX.Mail.Label.Core.apiClient : null;
		}
		subscribeLabelsSliderClose() {
			this.labelsSliderCloseHandler = sliderEvent => this.handleLabelsSliderClose(sliderEvent);
			this.labelsEventTargets = new Set([this.getSidePanelEventTarget()]);
			if (BX.addCustomEvent) {
				this.labelsEventTargets.add(BX);
			}
			this.labelsEventTargets.forEach(target => target.addCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler));
		}
		destroy() {
			this.destroyMigrationStates();
			if (this.undoSendRefreshTimer !== null) {
				clearTimeout(this.undoSendRefreshTimer);
				this.undoSendRefreshTimer = null;
			}
			if (this.undoSendCancelledHandler) {
				main_core_events.EventEmitter.unsubscribe(UNDO_SEND_CANCELLED_EVENT, this.undoSendCancelledHandler);
				this.undoSendCancelledHandler = null;
			}
			if (this.labelsSliderCloseHandler) {
				this.labelsEventTargets.forEach(target => target.removeCustomEvent('SidePanel.Slider:onCloseComplete', this.labelsSliderCloseHandler));
				this.labelsSliderCloseHandler = null;
			}
			BX.removeCustomEvent(window, 'onPopupShow', this.panelPopupShowHandler);
			this.panelPopupShowHandler = null;
			if (this.pageLeaveHandler) {
				main_core.Event.unbind(window, 'pagehide', this.pageLeaveHandler);
				this.pageLeaveHandler = null;
			}
			if (this.scheduledHistoryHandler) {
				main_core.Event.unbind(window, 'popstate', this.scheduledHistoryHandler);
				this.scheduledHistoryHandler = null;
			}
			if (this.scheduledNavigationClickHandler) {
				main_core.Event.unbind(document, 'click', this.scheduledNavigationClickHandler);
				this.scheduledNavigationClickHandler = null;
			}
		}
		getSidePanelEventTarget() {
			if (window.top && window.top.BX && window.top.BX.addCustomEvent) {
				return window.top.BX;
			}
			return BX;
		}
		handleLabelsSliderClose(sliderEvent) {
			const url = sliderEvent?.getSlider?.()?.getUrl?.() ?? '';
			if (!url.includes(LABELS_SLIDER_URL)) {
				return;
			}
			const apiClient = this.getLabelApiClient();
			if (!apiClient || !this.labelCollection) {
				return;
			}
			apiClient.list().then(labels => {
				this.labelCollection.setAll(labels);
				this.labelsVersion++;
			}).catch(() => {});
		}
		prepareLabelsSubMenu(menuItem) {
			const subMenu = menuItem.getSubMenu();
			if (subMenu && !this.subMenuHasLoadingItem(subMenu) && menuItem.labelsSubMenuVersion === this.labelsVersion) {
				return;
			}
			const rowId = String(menuItem.gridRowId ?? '');
			if (!this.labelCollection || rowId === '') {
				return;
			}
			const scopeMailboxId = this.resolveLabelScopeMailboxId([rowId]);
			const labels = this.getLabelsForScope(scopeMailboxId);
			const items = labels.length > 0 ? this.buildLabelsSubMenuItems(rowId, labels, []) : [this.buildEmptyLabelsItem()];
			const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());
			if (popup) {
				popup.destroy();
			}
			menuItem.destroySubMenu();
			menuItem.addSubMenu(items);
			menuItem.showSubMenu();
			menuItem.labelsSubMenuVersion = this.labelsVersion;
			if (labels.length > 0) {
				this.applyAssignedLabelMarks(menuItem, rowId);
			}
		}
		handleActionPanelPopupShow(popupWindow) {
			if (popupWindow?.uniquePopupId !== ACTION_PANEL_POPUP_ID) {
				return;
			}
			if (!popupWindow.bindElement?.dataset?.labelMenu) {
				return;
			}
			const menu = BX.Main.MenuManager.getMenuById(ACTION_PANEL_MENU_ID);
			if (!menu) {
				return;
			}
			const rowId = String(this.getGridInstance().getRows().getSelectedIds()[0] ?? '');
			if (!this.labelCollection || rowId === '') {
				return;
			}
			const scopeMailboxId = this.resolveLabelScopeMailboxId([rowId]);
			const labels = this.getLabelsForScope(scopeMailboxId);
			const items = labels.length > 0 ? this.buildLabelsSubMenuItems(rowId, labels, []) : [this.buildEmptyLabelsItem()];
			this.replaceMenuItems(menu, items);
			if (labels.length > 0) {
				this.applyAssignedLabelMarksToMenu(menu, rowId, () => BX.Main.MenuManager.getMenuById(ACTION_PANEL_MENU_ID) !== menu || !menu.isShown());
			}
		}
		replaceMenuItems(menu, items) {
			const staleItemIds = menu.getMenuItems().map(item => item.getId());
			const addedItems = items.filter(item => menu.addMenuItem(item, null) !== null);

			// The placeholder goes away last: removing the last item of a menu destroys its popup.
			if (addedItems.length > 0) {
				staleItemIds.forEach(itemId => menu.removeMenuItem(itemId));
			}
		}
		getLabelsForScope(scopeMailboxId) {
			return this.labelCollection.getAll().filter(label => label.mailboxId === LABEL_SCOPE_ALL_MAILBOXES || label.mailboxId === scopeMailboxId);
		}
		applyAssignedLabelMarks(menuItem, rowId) {
			const targetSubMenu = menuItem.getSubMenu();
			if (!targetSubMenu) {
				return;
			}
			this.applyAssignedLabelMarksToMenu(targetSubMenu, rowId, () => menuItem.getSubMenu() !== targetSubMenu);
		}
		applyAssignedLabelMarksToMenu(menu, rowId, isStale) {
			this.resolveMessageLabelIds(rowId).then(currentLabelIds => {
				if (isStale()) {
					return;
				}
				const assignedLabelIds = new Set((currentLabelIds || []).map(labelId => Number(labelId)));
				menu.getMenuItems().forEach(item => {
					const labelId = this.parseLabelItemId(item.getId());
					if (labelId !== null && !this.toggledLabelIds?.has(labelId)) {
						this.setLabelItemChecked(item, assignedLabelIds.has(labelId));
					}
				});
			}).catch(() => {});
		}
		parseLabelItemId(itemId) {
			if (!main_core.Type.isString(itemId) || !itemId.startsWith(LABEL_ITEM_ID_PREFIX)) {
				return null;
			}
			const labelId = Number(itemId.slice(LABEL_ITEM_ID_PREFIX.length));
			return Number.isInteger(labelId) ? labelId : null;
		}
		buildEmptyLabelsItem() {
			return {
				id: 'mail-label-empty',
				text: main_core.Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_EMPTY'),
				disabled: true
			};
		}
		subMenuHasLoadingItem(subMenu) {
			const items = subMenu.getMenuItems();
			for (let i = 0; i < items.length; i++) {
				if (items[i].getId() === 'loading') {
					return true;
				}
			}
			return false;
		}
		buildLabelsSubMenuItems(rowId, labels, currentLabelIds) {
			const assignedLabelIds = new Set((currentLabelIds || []).map(labelId => Number(labelId)));
			// The marks arrive asynchronously, so a label the user has already toggled must keep his state.
			this.toggledLabelIds = new Set();
			const items = [];
			for (let i = 0; i < labels.length; i++) {
				const label = labels[i];
				const labelId = Number(label.id);
				const isAssigned = assignedLabelIds.has(labelId);
				items.push({
					id: LABEL_ITEM_ID_PREFIX + labelId,
					text: label.name,
					className: this.getLabelItemClassName(isAssigned),
					dataset: {
						testid: 'mail-message-list-label-item-' + labelId,
						preventCloseContextMenu: true
					},
					onclick: (event, item) => this.onLabelToggleClick(event, item, labelId, rowId)
				});
			}
			return items;
		}
		getLabelItemClassName(isAssigned) {
			return isAssigned ? 'mail-msg-list-label-item menu-popup-item-accept' : 'mail-msg-list-label-item';
		}
		onLabelToggleClick(event, item, labelId, rowId) {
			if (event) {
				event.stopPropagation();
			}
			const apiClient = this.getLabelApiClient();
			if (!apiClient) {
				return;
			}
			const wasAssigned = main_core.Dom.hasClass(item.getContainer(), 'menu-popup-item-accept');
			const willAssign = !wasAssigned;
			this.toggledLabelIds?.add(labelId);
			this.setLabelItemChecked(item, willAssign);
			const request = willAssign ? apiClient.assign([labelId], [rowId]) : apiClient.unassign([labelId], [rowId]);
			request.then(() => {
				this.onLabelAssignmentChanged({
					labelId,
					assigned: willAssign
				});
			}).catch(() => {
				this.setLabelItemChecked(item, wasAssigned);
				this.notify(main_core.Loc.getMessage('MAIL_MESSAGE_LIST_LABEL_TOGGLE_ERROR'));
			});
		}
		setLabelItemChecked(item, checked) {
			const container = item.getContainer();
			if (!container) {
				return;
			}
			if (checked) {
				main_core.Dom.addClass(container, 'menu-popup-item-accept');
			} else {
				main_core.Dom.removeClass(container, 'menu-popup-item-accept');
			}
		}
		onDeleteImmediately(id) {
			let additionalOptions = {
				'deleteImmediately': true
			};
			this.onDeleteClick(id, additionalOptions);
		}
		onDeleteClick(id, additionalOptions) {
			if (this.refuseMigrationAction(id)) {
				return;
			}
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
			let id = undefined;
			const popupSubmenu = BX.findParent(event.currentTarget, {
				className: 'popup-window'
			});
			if (popupSubmenu) {
				id = BX.data(popupSubmenu, 'grid-row-id');
			}
			if (this.refuseMigrationAction(id)) {
				return;
			}
			if (toFolderByPath === this.getCurrentFolder()) {
				this.notify(main_core.Loc.getMessage('MESSAGES_ALREADY_EXIST_IN_FOLDER'));
				return;
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
			if (this.refuseMigrationAction(id)) {
				return;
			}
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
			if (this.refuseMigrationAction(id)) {
				return;
			}
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
				this.setScheduledSectionCount(Number(result.scheduled || 0));
				if (selector) {
					selector.updateAllMailBadge(total);
					if (result.mailboxes) {
						selector.updatePerMailboxBadges(result.mailboxes);
					}
				}

				// the section number comes with every update, so entering the section shows it at once
				this.publishFavoritesUnread(result.favoritesUnread);
				if (isAllMailMode) {
					BX.Mail.Home.Counters.setCounters([{
						path: main_core.Loc.getMessage('MAIL_VIRTUAL_FOLDER_KEY'),
						count: total
					}]);
					BX.Mail.Home.mailboxCounters.setCounters([{
						path: 'unseenCountInAllMailboxes',
						count: total
					}]);
				}
				// the folders are counted by the page that carries the filter of the message list; the page of
				// the section alone has none, and its folder counters are not this call's business
				else if (!this.isScheduledMode && result.folders && this.getCurrentFolder() === '') {
					BX.Mail.Home.Counters.setCounters(result.folders);
				}
			}.bind(this));
		}

		/**
		 * The number of the section, on both faces of its menu item at once: the item of `mail.directorymenu` on the
		 * page of the section, and the server markup of the button on the page of the message list. A point that
		 * knew only one of them would lose the number on the way to the other page.
		 *
		 * The number is the one the server answered with and never one counted here by adding and subtracting: the
		 * dispatcher sends the letters of the section without asking the client.
		 */
		setScheduledSectionCount(count) {
			this.directoryMenu?.setScheduledMessagesCount(count);
			const badge = document.querySelector(SCHEDULED_SECTION_COUNTER_SELECTOR);
			if (!badge) {
				return;
			}
			badge.textContent = String(count);
			if (count === 0) {
				main_core.Dom.addClass(badge, SCHEDULED_SECTION_COUNTER_HIDDEN_CLASS);
			} else {
				main_core.Dom.removeClass(badge, SCHEDULED_SECTION_COUNTER_HIDDEN_CLASS);
			}
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

		/** The mailbox of a row comes from its `data-mailbox-id` attribute: the grid keeps its row data server-side. */
		getRowMailboxId(rowId) {
			const row = this.getGridInstance().getRows().getById(rowId);
			const mailboxId = Number(row?.getDataset?.()?.mailboxId ?? 0);
			return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : 0;
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
		getDraftGridInstance() {
			return BX.Main.gridManager.getById('mail-internal-draft-list')?.instance || null;
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

	/**
	 * The list of messages is drawn by `mail.client.message-grid`, and that extension answers for the grid
	 * of the screen by itself: it publishes the facade under `BX.Mail.Home.Grid` and keeps the rows in a
	 * state of its own. Everything below that reaches into the grid of the platform belongs to the other
	 * path - the delegated listeners of the old singleton sit on the very wrapper the application mounts
	 * inside, and beside it every click on a star would be answered twice.
	 */
	const legacyGrid = () => main_core.Loc.getMessage('MAIL_MESSAGE_GRID_VUE_ENABLED') !== 'Y';
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
	const MIGRATION_BLOCKED_ERROR_CODE = 'MAILBOX_MIGRATION_ACTION_BLOCKED';
	function hasErrorCode(error, code) {
		const errors = main_core.Type.isArray(error?.errors) ? error.errors : [error];
		return errors.some(item => item?.code === code);
	}
	function changeFolderSortMode({
		mailboxId,
		mode,
		getCurrentMode,
		applyMode,
		closeMenu,
		request,
		notify
	}) {
		const previousMode = getCurrentMode();
		closeMenu();
		if (mailboxId > 0 && mail_migrationState.getMigrationState(mailboxId).isActive()) {
			notify(main_core.Loc.getMessage('MAIL_MIGRATION_ACTION_UNAVAILABLE'));
			return Promise.resolve(false);
		}
		applyMode(mode);
		return request('mail.mailboxsettings.saveFolderSortMode', {
			data: {
				mailboxId,
				mode
			}
		}).then(() => true).catch(error => {
			notify(main_core.Loc.getMessage(hasErrorCode(error, MIGRATION_BLOCKED_ERROR_CODE) ? 'MAIL_MIGRATION_ACTION_UNAVAILABLE' : 'MAIL_FOLDER_SORT_MODE_SAVE_ERROR'));

			// A later switch to another mode superseded this request: keep the
			// newer choice instead of rolling back to the stale mode.
			if (getCurrentMode() === mode) {
				applyMode(previousMode);
			}
			return false;
		});
	}
	let selectedIdsForRecovery = {};

	/** Puts back the rows the reader had selected before the platform grid reloaded its table. */
	function subscribeToSelectionRecovery() {
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
						if (grid.getRows().getSelected().length > 0) {
							main_core_events.EventEmitter.emit(window, 'Grid::thereSelectedRows');
						}
					}, 0);
				}
			}
		});
	}
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
		syncButtonWrapper?.replaceChildren(syncButton.getContainer());
		sortButtonWrapper = document.querySelector('[data-role="mail-folder-sort-button-wrapper"]');

		// Reflect the active sort mode on the button (a drag switches it to 'manual').
		main_core_events.EventEmitter.subscribe('BX.Mail.FolderSort:onChange', event => {
			const mode = event.data?.mode;
			if (!mode) {
				return;
			}
			currentFolderSortMode = mode;
			if (sortButtonWrapper) {
				sortButtonWrapper.dataset.sortMode = mode;
			}
		});
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
				if (main_core.Loc.getMessage('MAIL_FOLDER_MANUAL_SORTING_AVAILABLE') === 'Y') {
					sortModes.push({
						id: 'manual',
						text: main_core.Loc.getMessage('MAIL_FOLDER_SORT_MANUAL')
					});
				}
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
						const mailboxId = parseInt(main_core.Loc.getMessage('MAIL_MAILBOX_ID'), 10);
						void changeFolderSortMode({
							mailboxId,
							mode: mode.id,
							getCurrentMode: () => currentFolderSortMode,
							applyMode: nextMode => {
								currentFolderSortMode = nextMode;
								if (sortButtonWrapper) {
									sortButtonWrapper.dataset.sortMode = nextMode;
								}
								main_core_events.EventEmitter.emit('BX.Mail.FolderSort:onChange', {
									mode: nextMode
								});
							},
							closeMenu: () => BX.Main.MenuManager.destroy(sortMenuId),
							request: (...args) => BX.ajax.runAction(...args),
							notify: content => BX.UI?.Notification?.Center?.notify({
								content
							})
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
		if (sortButtonWrapper) {
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
		}
		if (legacyGrid()) {
			subscribeToSelectionRecovery();
		}
		mail_avatar.Avatar.replaceTagsWithAvatars({
			className: 'mail-ui-avatar'
		});
		sliderPage = document.getElementsByClassName('ui-slider-page')[0];
		progressBar = document.querySelector('[data-role="mail-progress-bar"]');
		if (sliderPage && progressBar) {
			sliderPage.insertBefore(progressBar, sliderPage.firstChild);
			document.querySelector('[data-role="error-box"]');
			namespaceMailHome.ProgressBar = new ProgressBar(progressBar);
			namespaceMailHome.ProgressBar.setSyncButton(syncButton);
			namespaceMailHome.ProgressBar.setErrorBoxNode(document.querySelector('[data-role="error-box"]'));
			namespaceMailHome.ProgressBar.setErrorTextNode(document.querySelector('[data-role="error-box-text"]'));
			namespaceMailHome.ProgressBar.setErrorHintNode(document.querySelector('[data-role="error-box-hint"]'));
			namespaceMailHome.ProgressBar.setErrorTitleNode(document.querySelector('[data-role="error-box-title"]'));
		}
	});
	BX.ready(() => {
		namespaceMailHome.Counters = new Counters('dirs', main_core.Loc.getMessage('DEFAULT_DIR'));
		namespaceMailHome.mailboxCounters = new Counters('mailboxCounters');
		if (legacyGrid()) {
			namespaceMailHome.Grid = new mail_messagegrid.MessageGrid(main_core.Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY'));
		}
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

	exports.changeFolderSortMode = changeFolderSortMode;

})(this.window = this.window || {}, BX, BX.Event, BX.UI, BX.Mail, BX.Mail, BX.Mail, BX.Mail, BX.UI.Accessibility, BX.Mail);
//# sourceMappingURL=script.js.map
