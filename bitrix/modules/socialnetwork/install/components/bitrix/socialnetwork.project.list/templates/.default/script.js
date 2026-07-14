/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.Project = this.BX.Socialnetwork.Project || {};
(function (exports, main_core, ui_avatar, socialnetwork_projectMembersPopup, socialnetwork_v2_application_deleteProjectPopup) {
	'use strict';

	const HEXAGON_CLASS_MAP = {
		project: ui_avatar.AvatarHexagonProject,
		guest: ui_avatar.AvatarHexagonGuest
	};
	const PROJECT_COLORS = ['#B15EF5', '#1F86FF', '#FAA72C', '#F85E9E', '#02BB9A'];
	const AVATAR_SIZE = 22;
	const GRID_RELOAD_DELAY = 300;
	const SOCIALNETWORK_SHARED_LIFECYCLE_PULL_COMMANDS = ['workgroup_add', 'workgroup_update', 'workgroup_delete', 'workgroup_user_add', 'workgroup_user_update', 'workgroup_user_delete', 'workgroup_convert'];
	const SOCIALNETWORK_PERSONAL_PREFERENCE_PULL_COMMANDS = ['workgroup_favorites_changed'];
	const SOCIALNETWORK_PIN_PULL_COMMANDS = ['workgroup_pin_changed'];
	const TASKS_PROJECT_COUNTER_PULL_COMMANDS = ['project_counter'];
	const TASKS_COUNTER_READ_ALL_PULL_COMMANDS = ['comment_read_all', 'project_read_all', 'scrum_read_all'];
	const TASKS_LEGACY_USER_COUNTER_PULL_COMMANDS = ['user_counter'];
	const TASKS_PROJECT_COUNTER_EVENTS = ['onAfterTaskAdd', 'onAfterTaskDelete', 'onAfterTaskRestore', 'onAfterTaskView', 'onAfterTaskMute', 'onAfterCommentAdd', 'onAfterCommentDelete', 'onProjectPermUpdate'];
	const TASKS_PROJECT_COUNTER_MOVE_EVENTS = ['onAfterTaskAdd', 'onAfterCommentAdd'];
	const TASKS_PROJECT_COUNTER_RECONCILE_EVENTS = ['onAfterTaskAdd', 'onAfterTaskDelete', 'onAfterTaskRestore', 'onAfterCommentAdd', 'onAfterCommentDelete', 'onProjectPermUpdate'];
	const TASKS_PROJECT_COUNTER_SELECTIVE_EVENTS = ['onAfterTaskView', 'onAfterTaskMute'];
	const SIDEPANEL_RELOAD_CODES = new Set(['afterCreate', 'afterDelete', 'afterEdit', 'afterIncomingRequestCancel', 'afterInvite', 'afterJoinRequestSend', 'afterLeave', 'afterOwnerSet', 'afterRequestInDelete', 'afterRequestOutDelete', 'afterSetFavorites', 'afterSetScrumMaster']);
	const DEFAULT_REALTIME_CAPABILITIES = {
		sharedLifecycle: true,
		personalPreferences: true,
		tasksCounters: false,
		legacyUserCounters: false,
		sidePanelFallback: true
	};
	const DEFAULT_TASK_REALTIME_STRATEGY = 'none';
	const DEFAULT_TASK_REALTIME_ACTIONS = {
		getTaskCounters: '',
		getTaskGridRows: ''
	};
	const DEFAULT_SIGNED_PAGE_CONTEXT = '';
	const DEFAULT_REALTIME_UI_CONTEXT = {
		pageSize: 0
	};
	const PIN_CLASS = {
		active: 'main-grid-cell-content-action-active',
		hover: 'main-grid-cell-content-action-by-hover',
		pin: 'main-grid-cell-content-action-pin'
	};
	const PIN_MODES = new Set(['', 'user_groups', 'tasks_project', 'tasks_scrum']);
	const TASK_REALTIME_STRATEGIES = new Set(['none', 'reload_only', 'self_narrow']);
	function getProjectBaseColor(title) {
		let hash = 0;
		for (let i = 0; i < title.length; i++) {
			hash = (hash << 5) - hash + title.charCodeAt(i) | 0;
		}
		return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
	}
	function resolveProjectBaseColor(placeholder) {
		return main_core.Type.isStringFilled(placeholder.dataset.color) ? placeholder.dataset.color : getProjectBaseColor(placeholder.dataset.title || '');
	}
	class Controller {
		static #grid = null;
		static #gridId = null;
		static #filterId = '';
		static #membersPopup = null;
		static #scrumMembersPopup = null;
		static #actionPrefix = 'socialnetwork.v2.Project';
		static #entityParam = 'projectId';
		static #pinMode = '';
		static #filterInstance = null;
		static #realtimeInitialized = false;
		static #reloadTimeout = null;
		static #taskRealtimeStrategy = DEFAULT_TASK_REALTIME_STRATEGY;
		static #taskRealtimeActions = DEFAULT_TASK_REALTIME_ACTIONS;
		static #realtimeCapabilities = DEFAULT_REALTIME_CAPABILITIES;
		static #signedPageContext = DEFAULT_SIGNED_PAGE_CONTEXT;
		static #realtimeUiContext = DEFAULT_REALTIME_UI_CONTEXT;
		static #tasksProjectCounterQueue = new Map();
		static #tasksProjectCounterTimeout = null;
		static init(gridId, options) {
			this.#gridId = gridId;
			this.#filterId = options?.filterId || '';
			this.#grid = BX.Main.gridManager.getInstanceById(gridId);
			this.#actionPrefix = options?.actionPrefix || 'socialnetwork.v2.Project';
			this.#entityParam = options?.entityParam || 'projectId';
			this.#pinMode = this.#normalizePinMode(options?.pinMode);
			this.#taskRealtimeStrategy = this.#normalizeTaskRealtimeStrategy(options);
			this.#taskRealtimeActions = this.#normalizeTaskRealtimeActions(options);
			this.#realtimeCapabilities = this.#normalizeRealtimeCapabilities(options);
			this.#signedPageContext = this.#normalizeSignedPageContext(options);
			this.#realtimeUiContext = this.#normalizeRealtimeUiContext(options);
			this.#membersPopup = new socialnetwork_projectMembersPopup.ProjectMembersPopup({
				actionPrefix: this.#actionPrefix,
				paramName: this.#entityParam
			});
			this.#scrumMembersPopup = new socialnetwork_projectMembersPopup.ProjectMembersPopup({
				popupType: 'scrum',
				componentName: options?.componentName || '',
				signedParameters: options?.signedParameters || ''
			});
			this.#subscribeGridUpdate();
			this.#initFilter();
			this.#initRealtime();
			this.#colorPinnedRows();
			requestAnimationFrame(() => {
				this.#initAvatars();
				this.#initJoinButtons();
			});
		}
		static getById(gridId) {
			return Controller;
		}
		static getMembersPopup() {
			return this.#membersPopup;
		}
		static getScrumMembersPopup() {
			return this.#scrumMembersPopup;
		}
		static getGrid() {
			return this.#grid;
		}
		static runTopAction(gridId, actionId, confirmOptions = null) {
			const grid = BX.Main.gridManager.getInstanceById(gridId);
			if (!grid || !main_core.Type.isStringFilled(actionId)) {
				return;
			}
			const submit = () => {
				const selectedRows = grid.getRows().getSelectedIds();
				if (!main_core.Type.isArray(selectedRows) || selectedRows.length === 0) {
					return;
				}
				grid.reloadTable('POST', {
					rows: selectedRows,
					[`action_button_${gridId}`]: actionId
				});
			};
			if (main_core.Type.isPlainObject(confirmOptions) && confirmOptions.CONFIRM === true) {
				grid.confirmDialog(confirmOptions, submit);
			} else {
				submit();
			}
		}
		static #subscribeServerPullCommands(moduleId, commands, callback = null) {
			const eventHandler = main_core.Type.isFunction(callback) ? callback : this.#onRealtimeUpdate.bind(this);
			commands.forEach(command => {
				BX.PULL.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId,
					command,
					callback: eventHandler
				});
			});
		}
		static #normalizeRealtimeCapabilities(options = null) {
			const fallbackCapabilities = {
				...DEFAULT_REALTIME_CAPABILITIES,
				tasksCounters: this.#isTaskRealtimeEnabled()
			};
			const realtimeCapabilities = main_core.Type.isPlainObject(options?.realtimeCapabilities) ? options.realtimeCapabilities : {};
			return {
				sharedLifecycle: this.#resolveRealtimeCapability(realtimeCapabilities.sharedLifecycle, fallbackCapabilities.sharedLifecycle),
				personalPreferences: this.#resolveRealtimeCapability(realtimeCapabilities.personalPreferences, fallbackCapabilities.personalPreferences),
				tasksCounters: this.#resolveRealtimeCapability(realtimeCapabilities.tasksCounters, fallbackCapabilities.tasksCounters),
				legacyUserCounters: this.#resolveRealtimeCapability(realtimeCapabilities.legacyUserCounters, fallbackCapabilities.legacyUserCounters),
				sidePanelFallback: this.#resolveRealtimeCapability(realtimeCapabilities.sidePanelFallback, fallbackCapabilities.sidePanelFallback)
			};
		}
		static #normalizeTaskRealtimeStrategy(options = null) {
			const taskRealtimeStrategy = main_core.Type.isString(options?.taskRealtimeStrategy) ? options.taskRealtimeStrategy : '';
			if (TASK_REALTIME_STRATEGIES.has(taskRealtimeStrategy)) {
				return taskRealtimeStrategy;
			}
			return Boolean(options?.usesTasksPull) ? 'reload_only' : DEFAULT_TASK_REALTIME_STRATEGY;
		}
		static #normalizeTaskRealtimeActions(options = null) {
			const taskRealtimeActions = main_core.Type.isPlainObject(options?.taskRealtimeActions) ? options.taskRealtimeActions : {};
			return {
				getTaskCounters: main_core.Type.isStringFilled(taskRealtimeActions.getTaskCounters) ? taskRealtimeActions.getTaskCounters : '',
				getTaskGridRows: main_core.Type.isStringFilled(taskRealtimeActions.getTaskGridRows) ? taskRealtimeActions.getTaskGridRows : ''
			};
		}
		static #normalizePinMode(pinMode) {
			const normalizedPinMode = main_core.Type.isString(pinMode) ? pinMode : '';
			return PIN_MODES.has(normalizedPinMode) ? normalizedPinMode : '';
		}
		static #normalizeSignedPageContext(options = null) {
			return main_core.Type.isStringFilled(options?.signedPageContext) ? options.signedPageContext : DEFAULT_SIGNED_PAGE_CONTEXT;
		}
		static #normalizeRealtimeUiContext(options = null) {
			const realtimeUiContext = main_core.Type.isPlainObject(options?.realtimeUiContext) ? options.realtimeUiContext : {};
			return {
				pageSize: this.#normalizePositiveInteger(realtimeUiContext.pageSize)
			};
		}
		static #resolveRealtimeCapability(value, fallbackValue) {
			return typeof value === 'boolean' ? value : fallbackValue;
		}
		static #hasRealtimeCapability(capabilityName) {
			return this.#realtimeCapabilities[capabilityName] === true;
		}
		static #isTaskRealtimeEnabled() {
			return this.#taskRealtimeStrategy !== DEFAULT_TASK_REALTIME_STRATEGY;
		}
		static #isReloadOnlyTaskRealtime() {
			return this.#taskRealtimeStrategy === 'reload_only';
		}
		static #isSelfNarrowTaskRealtime() {
			return this.#taskRealtimeStrategy === 'self_narrow';
		}
		static #getTaskRealtimeActionName(actionName) {
			const configuredActionName = this.#taskRealtimeActions[actionName];
			if (main_core.Type.isStringFilled(configuredActionName)) {
				return configuredActionName;
			}
			const route = this.#getRouteConfig();
			return `${route.actionPrefix}.${actionName}`;
		}
		static #shouldSubscribeTasksCounterCommands() {
			return this.#hasRealtimeCapability('tasksCounters') && this.#isTaskRealtimeEnabled();
		}
		static #shouldSubscribeLegacyUserCounterCommands() {
			return this.#hasRealtimeCapability('legacyUserCounters') || this.#shouldSubscribeTasksCounterCommands();
		}
		static #getRouteConfig(routeConfig = null) {
			return {
				actionPrefix: routeConfig?.actionPrefix || this.#actionPrefix,
				entityParam: routeConfig?.entityParam || routeConfig?.paramName || this.#entityParam
			};
		}
		static #getEntityPayload(entityId, routeConfig = null) {
			const route = this.#getRouteConfig(routeConfig);
			return {
				[route.entityParam]: entityId
			};
		}
		static #splitRouteAndEvent(routeConfigOrEvent, event = null) {
			const routeConfig = main_core.Type.isPlainObject(routeConfigOrEvent) && main_core.Type.isStringFilled(routeConfigOrEvent.actionPrefix) ? routeConfigOrEvent : null;
			return {
				routeConfig,
				event: routeConfig ? event : routeConfigOrEvent
			};
		}
		static rowAction(action, entityId, routeConfig = null) {
			const route = this.#getRouteConfig(routeConfig);
			const archiveMap = {
				addToArchive: true,
				removeFromArchive: false
			};
			if (action in archiveMap) {
				this.#rowArchiveAction(action, entityId, routeConfig, route, archiveMap);
				return;
			}
			if (action === 'addToFavorites' || action === 'removeFromFavorites') {
				this.#rowFavoriteAction(entityId, routeConfig, route);
				return;
			}
			const requestActionMap = {
				deleteIncomingRequest: 'deleteIncomingRequest',
				deleteOutgoingRequest: 'deleteOutgoingRequest'
			};
			if (action in requestActionMap) {
				this.#rowRequestAction(action, entityId, routeConfig, route, requestActionMap);
				return;
			}
			if (action === 'leave') {
				this.#rowLeaveAction(entityId, routeConfig, route);
				return;
			}
		}
		static #rowArchiveAction(action, entityId, routeConfig, route, archiveMap) {
			BX.ajax.runAction(`${route.actionPrefix}.setArchive`, {
				json: {
					...this.#getEntityPayload(entityId, routeConfig),
					archive: archiveMap[action]
				}
			}).then(() => {
				const messageKey = action === 'addToArchive' ? 'SOCIALNETWORK_PROJECT_LIST_ACTION_ADD_TO_ARCHIVE' : 'SOCIALNETWORK_PROJECT_LIST_ACTION_REMOVE_FROM_ARCHIVE';
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage(messageKey)
				});
				this.reloadGrid();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}
		static #rowFavoriteAction(entityId, routeConfig, route) {
			BX.ajax.runAction(`${route.actionPrefix}.changeFavorite`, {
				json: this.#getEntityPayload(entityId, routeConfig)
			}).then(() => {
				this.reloadGrid();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}
		static #rowRequestAction(action, entityId, routeConfig, route, requestActionMap) {
			BX.ajax.runAction(`${route.actionPrefix}.${requestActionMap[action]}`, {
				json: this.#getEntityPayload(entityId, routeConfig)
			}).then(() => {
				this.reloadGrid();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}
		static #rowLeaveAction(entityId, routeConfig, route) {
			BX.ajax.runAction(`${route.actionPrefix}.leave`, {
				json: this.#getEntityPayload(entityId, routeConfig)
			}).then(() => {
				this.reloadGrid();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}
		static joinAction(entityId, routeConfig = null) {
			const route = this.#getRouteConfig(routeConfig);
			BX.ajax.runAction(`${route.actionPrefix}.join`, {
				json: this.#getEntityPayload(entityId, routeConfig)
			}).then(() => {
				this.reloadGrid();
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}
		static showProjectDeleteDialog(entityId, entityType) {
			const deleteProjectPopup = new socialnetwork_v2_application_deleteProjectPopup.DeleteProjectPopup();
			let method;
			if (entityType === 'collab') {
				method = deleteProjectPopup.deleteProject.bind(deleteProjectPopup);
			} else if (entityType === 'scrum') {
				method = deleteProjectPopup.deleteScrum.bind(deleteProjectPopup);
			}
			if (method === undefined) {
				return;
			}
			method(entityId).then(isDeleted => {
				if (isDeleted === true) {
					this.reloadGrid();
				}
			});
		}
		static defaultRowAction(viewUrl) {
			if (!main_core.Type.isStringFilled(viewUrl)) {
				return;
			}
			if (BX.SidePanel?.Instance?.emulateAnchorClick) {
				BX.SidePanel.Instance.emulateAnchorClick(viewUrl);
				return;
			}
			window.location.href = viewUrl;
		}
		static convertToCollab(entityId) {
			main_core.Runtime.loadExtension('socialnetwork.collab.converter').then(exports => {
				const ConverterClass = exports.Converter;
				new ConverterClass({}).convertToCollab(entityId);
			}).catch(error => {
				console.error(error);
			});
		}

		// --- Tags ---

		static tagClick(field) {
			if (!this.#filterInstance) {
				return;
			}
			const name = Object.keys(field)[0];
			const value = field[name];
			const fields = this.#filterInstance.getFilterFieldsValues();
			if (fields[name] === value) {
				this.#filterInstance.getFilterFields().forEach(f => {
					if (f.getAttribute('data-name') === name) {
						this.#filterInstance.getFields().deleteField(f);
					}
				});
				this.#filterInstance.getSearch().apply();
			} else {
				this.#filterInstance.getApi().extendFilter({
					[name]: value
				});
			}
		}
		static tagAddClick(groupId, routeConfigOrEvent, event = null) {
			const {
				routeConfig,
				event: currentEvent
			} = this.#splitRouteAndEvent(routeConfigOrEvent, event);
			main_core.Runtime.loadExtension('socialnetwork.entity-selector').then(exports => {
				const onTagsChange = changeEvent => {
					const dialog = changeEvent.getTarget();
					const tags = dialog.getSelectedItems().map(item => item.getId());
					const route = this.#getRouteConfig(routeConfig);
					BX.ajax.runAction(`${route.actionPrefix}.updateTags`, {
						json: {
							...this.#getEntityPayload(groupId, routeConfig),
							tags
						}
					}).then(() => {
						this.reloadGrid();
					});
				};
				const {
					Dialog,
					Footer
				} = exports;
				const dialog = new Dialog({
					targetNode: currentEvent.getData().button,
					enableSearch: true,
					width: 350,
					height: 400,
					multiple: true,
					dropdownMode: true,
					compactView: true,
					context: 'SONET_GROUP_TAG',
					entities: [{
						id: 'project-tag',
						options: {
							groupId
						}
					}],
					searchOptions: {
						allowCreateItem: true,
						footerOptions: {
							label: main_core.Loc.getMessage('SOCNET_ENTITY_SELECTOR_TAG_FOOTER_LABEL')
						}
					},
					footer: Footer,
					footerOptions: {
						tagCreationLabel: true
					},
					events: {
						'Search:onItemCreateAsync': createEvent => {
							return new Promise(resolve => {
								const {
									searchQuery
								} = createEvent.getData();
								const name = searchQuery.getQuery().toLowerCase();
								const dlg = createEvent.getTarget();
								setTimeout(() => {
									const item = dlg.addItem({
										id: name,
										entityId: 'project-tag',
										title: name,
										tabs: 'all'
									});
									if (item) {
										item.select();
									}
									resolve();
								}, 1000);
							});
						},
						'Item:onSelect': onTagsChange,
						'Item:onDeselect': onTagsChange
					}
				});
				dialog.show();
			});
		}

		// --- Pin ---

		static changePin(groupId, routeConfigOrEvent, event = null) {
			const {
				routeConfig,
				event: currentEvent
			} = this.#splitRouteAndEvent(routeConfigOrEvent, event);
			const {
				button
			} = currentEvent.getData();
			const route = this.#getRouteConfig(routeConfig);
			BX.ajax.runAction(`${route.actionPrefix}.changePin`, {
				json: {
					...this.#getEntityPayload(groupId, routeConfig),
					mode: this.#pinMode
				}
			}).then(response => {
				const pinned = response?.data?.pinned;
				if (pinned) {
					main_core.Dom.addClass(button, PIN_CLASS.active);
					main_core.Dom.removeClass(button, PIN_CLASS.hover);
				} else {
					main_core.Dom.removeClass(button, PIN_CLASS.active);
					main_core.Dom.addClass(button, PIN_CLASS.hover);
				}
			}).catch(response => {
				if (response?.errors?.[0]?.message) {
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message
					});
				}
			});
		}

		// --- Grid ---

		static reloadGrid() {
			if (!this.#grid) {
				return;
			}
			if (main_core.Type.isFunction(this.#grid.reloadTable)) {
				this.#grid.reloadTable('POST', {
					apply_filter: 'Y'
				});
				return;
			}
			this.#grid.reload();
		}
		static #initRealtime() {
			if (this.#realtimeInitialized) {
				return;
			}
			this.#realtimeInitialized = true;
			this.#subscribePull();
			this.#subscribeSidePanelMessages();
		}
		static #subscribePull() {
			if (!this.#isPullAvailable()) {
				return;
			}
			if (this.#hasRealtimeCapability('sharedLifecycle')) {
				this.#subscribeServerPullCommands('socialnetwork', SOCIALNETWORK_SHARED_LIFECYCLE_PULL_COMMANDS);
			}
			if (this.#hasRealtimeCapability('personalPreferences')) {
				this.#subscribeServerPullCommands('socialnetwork', SOCIALNETWORK_PERSONAL_PREFERENCE_PULL_COMMANDS, this.#onFavoriteChanged.bind(this));
				this.#subscribeServerPullCommands('socialnetwork', SOCIALNETWORK_PIN_PULL_COMMANDS, this.#onPinChanged.bind(this));
			}
			if (this.#shouldSubscribeTasksCounterCommands()) {
				this.#subscribeServerPullCommands('tasks', TASKS_PROJECT_COUNTER_PULL_COMMANDS, this.#onTasksProjectCounterUpdate.bind(this));
				this.#subscribeServerPullCommands('tasks', TASKS_COUNTER_READ_ALL_PULL_COMMANDS, this.#onTasksReadAllCounterUpdate.bind(this));
			}
			if (this.#shouldSubscribeLegacyUserCounterCommands()) {
				this.#subscribeServerPullCommands('tasks', TASKS_LEGACY_USER_COUNTER_PULL_COMMANDS, this.#onLegacyUserCounterUpdate.bind(this));
			}
		}
		static #subscribeSidePanelMessages() {
			if (!this.#hasRealtimeCapability('sidePanelFallback') || !BX?.Event?.EventEmitter) {
				return;
			}
			BX.Event.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
				if (this.#isPullAvailable()) {
					return;
				}
				const [sliderEvent] = event.getCompatData();
				if (!sliderEvent || sliderEvent.getEventId?.() !== 'sonetGroupEvent') {
					return;
				}
				if (!SIDEPANEL_RELOAD_CODES.has(sliderEvent.data?.code)) {
					return;
				}
				this.#scheduleGridReload();
			});
		}
		static #isPullAvailable() {
			return Boolean(BX?.PULL && BX?.PullClient?.SubscriptionType?.Server);
		}
		static #onRealtimeUpdate() {
			this.#scheduleGridReload();
		}
		static #onFavoriteChanged() {
			this.#scheduleGridReload();
		}
		static #onPinChanged(data = null) {
			if (!this.#shouldHandlePinUpdate(data)) {
				return;
			}
			this.#scheduleGridReload();
		}
		static #shouldHandlePinUpdate(data = null) {
			if (!main_core.Type.isPlainObject(data)) {
				return true;
			}
			if (!Object.prototype.hasOwnProperty.call(data, 'MODE')) {
				return true;
			}
			return this.#normalizePinMode(data.MODE) === this.#pinMode;
		}
		static #onLegacyUserCounterUpdate() {}
		static #onTasksProjectCounterUpdate(data = null) {
			const groupId = this.#normalizePositiveInteger(data?.GROUP_ID);
			const eventName = main_core.Type.isStringFilled(data?.EVENT) ? data.EVENT : '';
			if (groupId <= 0 || !TASKS_PROJECT_COUNTER_EVENTS.includes(eventName)) {
				return;
			}
			if (this.#isReloadOnlyTaskRealtime()) {
				this.#scheduleGridReload();
				return;
			}
			if (!this.#isSelfNarrowTaskRealtime()) {
				return;
			}
			if (!this.#tasksProjectCounterTimeout) {
				this.#tasksProjectCounterTimeout = setTimeout(() => {
					this.#flushTasksProjectCounterQueue();
				}, 1000);
			}
			if (TASKS_PROJECT_COUNTER_MOVE_EVENTS.includes(eventName) || !this.#tasksProjectCounterQueue.has(groupId)) {
				this.#tasksProjectCounterQueue.set(groupId, eventName);
			}
		}
		static #flushTasksProjectCounterQueue() {
			const queuedEvents = Array.from(this.#tasksProjectCounterQueue.entries());
			this.#tasksProjectCounterQueue.clear();
			clearTimeout(this.#tasksProjectCounterTimeout);
			this.#tasksProjectCounterTimeout = null;
			if (queuedEvents.length === 0) {
				return;
			}
			if (this.#isTasksCounterFilterActive()) {
				this.#scheduleGridReload();
				return;
			}
			const reconcileEvents = queuedEvents.filter(([, eventName]) => TASKS_PROJECT_COUNTER_RECONCILE_EVENTS.includes(eventName));
			if (reconcileEvents.length > 0) {
				this.#loadTaskGridRows(reconcileEvents);
			}
			const rowIds = Array.from(new Set(queuedEvents.filter(([, eventName]) => TASKS_PROJECT_COUNTER_SELECTIVE_EVENTS.includes(eventName)).map(([groupId]) => groupId).filter(groupId => this.#getGridRowById(groupId))));
			if (rowIds.length > 0) {
				this.#loadTaskCounters(rowIds);
			}
		}
		static #onTasksReadAllCounterUpdate(data = null) {
			const rowIds = this.#resolveTasksReadAllRowIds(data);
			if (rowIds.length === 0) {
				return;
			}
			if (this.#isReloadOnlyTaskRealtime()) {
				this.#scheduleGridReload();
				return;
			}
			if (!this.#isSelfNarrowTaskRealtime()) {
				return;
			}
			this.#loadTaskCounters(rowIds);
		}
		static #resolveTasksReadAllRowIds(data = null) {
			const groupId = this.#normalizePositiveInteger(data?.GROUP_ID);
			if (groupId > 0) {
				return this.#getGridRowById(groupId) ? [groupId] : [];
			}
			return this.#getVisibleRowIds();
		}
		static #getVisibleRowIds() {
			const rows = this.#grid?.getRows?.();
			if (!rows?.getBodyChild) {
				return [];
			}
			return Object.values(rows.getBodyChild()).map(row => this.#extractGridRowId(row)).filter(rowId => rowId > 0);
		}
		static #extractGridRowId(row) {
			if (!row) {
				return 0;
			}
			if (main_core.Type.isFunction(row.getId)) {
				return this.#normalizePositiveInteger(row.getId());
			}
			const node = main_core.Type.isFunction(row.getNode) ? row.getNode() : null;
			return this.#normalizePositiveInteger(node?.dataset?.id);
		}
		static #normalizePositiveInteger(value) {
			const normalizedValue = Number.parseInt(value, 10);
			return Number.isInteger(normalizedValue) && normalizedValue > 0 ? normalizedValue : 0;
		}
		static #isTasksCounterFilterActive() {
			if (!this.#filterInstance || !main_core.Type.isFunction(this.#filterInstance.getFilterFieldsValues)) {
				return false;
			}
			const filterFields = this.#filterInstance.getFilterFieldsValues();
			const counters = filterFields?.COUNTERS;
			if (main_core.Type.isArray(counters)) {
				return counters.some(value => main_core.Type.isStringFilled(String(value)));
			}
			if (typeof counters === 'number') {
				return counters > 0;
			}
			return main_core.Type.isStringFilled(String(counters ?? ''));
		}
		static #getGridRowById(rowId) {
			return this.#grid?.getRows?.()?.getById?.(rowId) || null;
		}
		static #loadTaskGridRows(queuedEvents) {
			if (!this.#isSelfNarrowTaskRealtime()) {
				this.#scheduleGridReload();
				return;
			}
			if (!main_core.Type.isArray(queuedEvents) || queuedEvents.length === 0) {
				return;
			}
			const rowIds = Array.from(new Set(queuedEvents.map(([groupId]) => this.#normalizePositiveInteger(groupId)).filter(groupId => groupId > 0)));
			if (rowIds.length === 0) {
				return;
			}
			const rowEvents = queuedEvents.reduce((accumulator, [groupId, eventName]) => {
				accumulator[groupId] = eventName;
				return accumulator;
			}, {});
			const actionName = this.#getTaskRealtimeActionName('getTaskGridRows');
			BX.ajax.runAction(actionName, {
				json: this.#getTaskGridRowsPayload(rowIds)
			}).then(response => {
				this.#applyTaskGridRows(response?.data, rowEvents);
			}).catch(response => {
				console.error(response);
				this.#scheduleGridReload();
			});
		}
		static #getTaskGridRowsPayload(rowIds) {
			return {
				ids: rowIds,
				page: this.#getCurrentGridPage(),
				signedPageContext: this.#signedPageContext
			};
		}
		static #getCurrentGridPage() {
			const page = this.#normalizePositiveInteger(this.#grid?.getCurrentPage?.());
			return page > 0 ? page : 1;
		}
		static #applyTaskGridRows(rowsById = null, rowEvents = null) {
			if (!main_core.Type.isPlainObject(rowsById)) {
				this.#scheduleGridReload();
				return;
			}
			let hasChanges = false;
			Object.entries(rowsById).forEach(([rowId, payload]) => {
				const normalizedRowId = this.#normalizePositiveInteger(rowId);
				if (normalizedRowId <= 0) {
					return;
				}
				if (payload === false) {
					if (this.#getGridRowById(normalizedRowId)) {
						this.#removeTaskGridRow(normalizedRowId);
						hasChanges = true;
					}
					return;
				}
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isPlainObject(payload.row)) {
					return;
				}
				const eventName = main_core.Type.isStringFilled(rowEvents?.[normalizedRowId]) ? rowEvents[normalizedRowId] : '';
				this.#upsertTaskGridRow(normalizedRowId, payload.row, eventName, main_core.Type.isPlainObject(payload.position) ? payload.position : {});
				hasChanges = true;
			});
			if (hasChanges) {
				this.#afterTaskGridMutation();
			}
		}
		static #upsertTaskGridRow(rowId, rowData, eventName, position = null) {
			const params = this.#buildTaskGridRowParams(rowId, eventName, position);
			if (this.#getGridRowById(rowId)) {
				this.#updateTaskGridRow(rowId, rowData, params);
			} else {
				this.#addTaskGridRow(rowId, rowData, params);
			}
		}
		static #buildTaskGridRowParams(rowId, eventName, position = null) {
			return {
				moveParams: this.#resolveTaskGridMoveParams(rowId, position),
				highlightParams: {
					skip: !TASKS_PROJECT_COUNTER_MOVE_EVENTS.includes(eventName)
				}
			};
		}
		static #resolveTaskGridMoveParams(rowId, position = null) {
			return {
				rowBefore: this.#resolveTaskGridNeighbor(rowId, this.#normalizePositiveInteger(position?.rowBefore)),
				rowAfter: this.#resolveTaskGridNeighbor(rowId, this.#normalizePositiveInteger(position?.rowAfter))
			};
		}
		static #resolveTaskGridNeighbor(rowId, neighborId) {
			if (neighborId <= 0 || neighborId === rowId) {
				return 0;
			}
			return this.#getGridRowById(neighborId) ? neighborId : 0;
		}
		static #addTaskGridRow(rowId, rowData, params = null) {
			if (!this.#grid || this.#getGridRowById(rowId)) {
				return;
			}
			const realtime = this.#grid.getRealtime?.();
			if (!realtime || !main_core.Type.isFunction(realtime.addRow)) {
				this.#scheduleGridReload();
				return;
			}
			const options = {
				id: rowId,
				columns: rowData.columns || {},
				actions: rowData.actions || [],
				cellActions: rowData.cellActions || []
			};
			const moveParams = params?.moveParams || {};
			if (moveParams.rowBefore > 0) {
				options.insertAfter = moveParams.rowBefore;
			} else if (moveParams.rowAfter > 0) {
				options.insertBefore = moveParams.rowAfter;
			} else {
				options.append = true;
			}
			this.#grid.hideEmptyStub?.();
			realtime.addRow(options);
			const row = this.#getGridRowById(rowId);
			if (row && !main_core.Type.isUndefined(rowData.counters) && main_core.Type.isFunction(row.setCounters)) {
				row.setCounters(rowData.counters);
			}
			this.#trimTaskGridOverflow(rowId);
			this.#highlightTaskGridRow(rowId, params?.highlightParams);
		}
		static #updateTaskGridRow(rowId, rowData, params = null) {
			const row = this.#getGridRowById(rowId);
			if (!row) {
				return;
			}
			if (!main_core.Type.isUndefined(rowData.columns)) {
				row.setCellsContent(rowData.columns);
			}
			if (!main_core.Type.isUndefined(rowData.actions)) {
				row.setActions(rowData.actions);
			}
			if (!main_core.Type.isUndefined(rowData.cellActions)) {
				row.setCellActions(rowData.cellActions);
			}
			if (!main_core.Type.isUndefined(rowData.counters) && main_core.Type.isFunction(row.setCounters)) {
				row.setCounters(rowData.counters);
			}
			this.#grid?.getRows?.()?.reset?.();
			this.#moveTaskGridRow(rowId, params?.moveParams);
			this.#highlightTaskGridRow(rowId, params?.highlightParams);
		}
		static #moveTaskGridRow(rowId, params = null) {
			const rowBefore = this.#normalizePositiveInteger(params?.rowBefore);
			const rowAfter = this.#normalizePositiveInteger(params?.rowAfter);
			const rows = this.#grid?.getRows?.();
			if (!rows) {
				return;
			}
			if (rowBefore > 0) {
				rows.insertAfter(rowId, rowBefore);
			} else if (rowAfter > 0) {
				rows.insertBefore(rowId, rowAfter);
			}
		}
		static #highlightTaskGridRow(rowId, params = null) {
			if (params?.skip) {
				return;
			}
			const node = this.#getGridRowById(rowId)?.getNode?.();
			if (!node) {
				return;
			}
			const isPinned = main_core.Dom.hasClass(node, 'sonet-ui-grid-row-pinned');
			if (isPinned) {
				main_core.Dom.removeClass(node, 'sonet-ui-grid-row-pinned');
			}
			main_core.Dom.addClass(node, 'sonet-ui-grid-row-highlighted');
			setTimeout(() => {
				main_core.Dom.removeClass(node, 'sonet-ui-grid-row-highlighted');
				if (isPinned) {
					main_core.Dom.addClass(node, 'sonet-ui-grid-row-pinned');
				}
			}, 900);
		}
		static #trimTaskGridOverflow(insertedRowId) {
			const pageSize = this.#normalizePositiveInteger(this.#realtimeUiContext.pageSize);
			if (pageSize <= 0) {
				return;
			}
			const visibleRowIds = this.#getVisibleRowIds();
			if (visibleRowIds.length <= pageSize) {
				return;
			}
			const overflowRowId = this.#getLastVisibleRowId();
			if (overflowRowId <= 0) {
				return;
			}
			if (overflowRowId === insertedRowId) {
				this.#scheduleGridReload();
				return;
			}
			this.#removeTaskGridRow(overflowRowId);
		}
		static #removeTaskGridRow(rowId) {
			if (!this.#getGridRowById(rowId)) {
				return;
			}
			this.#grid?.removeRow?.(rowId);
		}
		static #getLastVisibleRowId() {
			const rows = this.#grid?.getRows?.();
			const lastRow = rows?.getBodyLastChild?.();
			return lastRow ? this.#extractGridRowId(lastRow) : 0;
		}
		static #afterTaskGridMutation() {
			this.#grid?.bindOnRowEvents?.();
			requestAnimationFrame(() => {
				this.#initAvatars();
				this.#initJoinButtons();
				this.#colorPinnedRows();
			});
		}
		static #loadTaskCounters(rowIds) {
			if (!this.#isSelfNarrowTaskRealtime()) {
				this.#scheduleGridReload();
				return;
			}
			const actionName = this.#getTaskRealtimeActionName('getTaskCounters');
			BX.ajax.runAction(actionName, {
				json: {
					ids: rowIds,
					signedPageContext: this.#signedPageContext
				}
			}).then(response => {
				this.#applyTaskCounters(response?.data);
			}).catch(response => {
				console.error(response);
			});
		}
		static #applyTaskCounters(countersByRowId = null) {
			if (!main_core.Type.isPlainObject(countersByRowId)) {
				return;
			}
			Object.entries(countersByRowId).forEach(([rowId, counters]) => {
				const normalizedRowId = this.#normalizePositiveInteger(rowId);
				if (normalizedRowId <= 0 || !main_core.Type.isPlainObject(counters)) {
					return;
				}
				const row = this.#getGridRowById(normalizedRowId);
				if (row && main_core.Type.isFunction(row.setCounters)) {
					row.setCounters(counters);
				}
			});
		}
		static #scheduleGridReload() {
			clearTimeout(this.#reloadTimeout);
			this.#reloadTimeout = setTimeout(() => {
				this.reloadGrid();
			}, GRID_RELOAD_DELAY);
		}
		static #subscribeGridUpdate() {
			BX.addCustomEvent(window, 'Grid::updated', () => {
				this.#initAvatars();
				this.#initJoinButtons();
				this.#colorPinnedRows();
			});
		}
		static #initJoinButtons() {
			const container = this.#grid?.getContainer() || document;
			container.querySelectorAll('.sonet-ui-grid-join[data-project-id]').forEach(button => {
				if (button.dataset.joinBound) {
					return;
				}
				button.dataset.joinBound = '1';
				button.addEventListener('click', event => {
					event.stopPropagation();
					const projectId = parseInt(button.dataset.projectId, 10);
					if (projectId > 0) {
						this.joinAction(projectId);
					}
				});
			});
		}
		static #initFilter() {
			if (this.#filterId) {
				this.#filterInstance = BX.Main.filterManager.getById(this.#filterId);
			}
		}
		static #colorPinnedRows() {
			if (!this.#grid) {
				return;
			}
			this.#grid.getRows().getBodyChild().forEach(row => {
				const node = row.getNode();
				const pinEl = node?.querySelector(`.${PIN_CLASS.pin}.${PIN_CLASS.active}`);
				if (pinEl) {
					main_core.Dom.addClass(node, 'sonet-ui-grid-row-pinned');
				} else {
					main_core.Dom.removeClass(node, 'sonet-ui-grid-row-pinned');
				}
			});
		}

		// --- Avatars ---

		static #initAvatars() {
			const container = this.#grid?.getContainer() || document;
			this.#initProjectAvatars(container);
			this.#initOwnerAvatars(container);
			this.#initScrumAvatars(container);
		}
		static #initProjectAvatars(container) {
			container.querySelectorAll('.socialnetwork-project-list-avatar').forEach(placeholder => {
				const variant = placeholder.dataset.borderVariant || 'project';
				const AvatarClass = HEXAGON_CLASS_MAP[variant] || ui_avatar.AvatarHexagonProject;
				const title = placeholder.dataset.title || '';
				const avatar = new AvatarClass({
					title,
					baseColor: resolveProjectBaseColor(placeholder),
					size: AVATAR_SIZE,
					picPath: main_core.Type.isStringFilled(placeholder.dataset.pic) ? placeholder.dataset.pic : undefined
				});
				main_core.Dom.replace(placeholder, avatar.getContainer());
			});
		}
		static #initOwnerAvatars(container) {
			container.querySelectorAll('.socialnetwork-project-list-owner-avatar').forEach(placeholder => {
				const avatar = new ui_avatar.AvatarRound({
					title: placeholder.dataset.title || '',
					size: AVATAR_SIZE,
					picPath: main_core.Type.isStringFilled(placeholder.dataset.pic) ? placeholder.dataset.pic : undefined
				});
				main_core.Dom.replace(placeholder, avatar.getContainer());
			});
		}
		static #initScrumAvatars(container) {
			container.querySelectorAll('.socialnetwork-project-list-scrum-avatar').forEach(placeholder => {
				const title = placeholder.dataset.title || '';
				const avatar = new ui_avatar.AvatarRound({
					title,
					baseColor: getProjectBaseColor(title),
					size: AVATAR_SIZE,
					picPath: main_core.Type.isStringFilled(placeholder.dataset.pic) ? placeholder.dataset.pic : undefined
				});
				main_core.Dom.replace(placeholder, avatar.getContainer());
			});
		}
	}

	exports.Controller = Controller;

})(this.BX.Socialnetwork.Project.List = this.BX.Socialnetwork.Project.List || {}, BX, BX.UI, BX.Socialnetwork, BX.Socialnetwork.V2.Application);
//# sourceMappingURL=script.js.map
