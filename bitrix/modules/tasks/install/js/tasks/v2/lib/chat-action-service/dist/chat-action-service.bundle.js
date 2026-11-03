/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, tasks_v2_const, tasks_v2_core, tasks_v2_provider_service_taskService, ui_notificationManager, tasks_v2_lib_apiClient, tasks_v2_lib_hint, tasks_v2_provider_service_checkListService, tasks_v2_lib_deadlineRules, tasks_v2_provider_service_statusService, tasks_v2_provider_service_groupService, tasks_v2_provider_service_timeTrackingService) {
	'use strict';

	class BaseAction {
		execute(payload) {
			throw new Error(`Method execute must be implemented in ${this.constructor.name}`);
		}
		getName() {
			throw new Error(`Method getName must be implemented in ${this.constructor.name}`);
		}
		isValid(payload) {
			return this.#validatePayload(payload);
		}
		hasPermission(payload) {
			return true;
		}
		isTooltipOnly(payload) {
			return false;
		}
		isReady(payload) {
			return true;
		}
		get needsTaskData() {
			return false;
		}
		get redirectsToTaskWhenNotReady() {
			return false;
		}
		get needsResultData() {
			return false;
		}

		// an action whose store data may be stale asks to refetch it before its predicates are trusted
		needsRefresh(payload) {
			return false;
		}

		// resolves to false when the refetch failed and the action already reported it to the user, so the
		// caller drops the click; a refetch that proved nothing still resolves to true and leaves isReady()
		// false, which sends the click to the card instead of a verdict
		async refreshData(payload) {
			return true;
		}
		requiresCard(payload) {
			return true;
		}
		#validatePayload(payload) {
			if (!main_core.Type.isPlainObject(payload)) {
				return false;
			}
			return main_core.Type.isNumber(payload.taskId) && payload.taskId > 0 && main_core.Type.isDomNode(payload.bindElement);
		}
	}

	class ChatActionDispatcher {
		#actions = new Map();
		register(action) {
			const actionName = action.getName();
			if (this.#actions.has(actionName)) {
				throw new Error(`ChatActionDispatcher: action '${actionName}' already registered`);
			}
			this.#actions.set(actionName, action);
		}
		get(actionName) {
			if (!main_core.Type.isString(actionName) || actionName.trim() === '') {
				return null;
			}
			return this.#actions.get(actionName.trim()) ?? null;
		}
		async execute(actionName, payload) {
			if (!main_core.Type.isString(actionName) || actionName.trim() === '') {
				throw new Error('Invalid action name');
			}
			const action = this.#actions.get(actionName.trim());
			if (!action) {
				throw new Error(`Action '${actionName}' not found`);
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CloseAllBottomSheets, {
				actionName: actionName.trim()
			});
			await action.execute(payload);
		}
	}

	class ChatLinkParser {
		parse(link) {
			if (!this.#validateLink(link)) {
				console.error('ChatLinkParser: Link is not valid');
				return null;
			}
			const {
				taskId,
				[tasks_v2_const.ChatActionParam.ChatAction]: chatAction,
				[tasks_v2_const.ChatActionParam.EntityId]: entityId
			} = link.matches.groups;
			const parsedTaskId = this.#parseNumber(taskId);
			if (parsedTaskId <= 0) {
				console.error('ChatLinkParser: taskId must be positive number');
				return null;
			}
			if (!chatAction || chatAction.trim() === '') {
				console.error('ChatLinkParser: actionName is required');
				return null;
			}
			const urlParams = this.#parseUrlParams(link.url);
			return {
				actionName: chatAction.trim(),
				payload: {
					taskId: parsedTaskId,
					entityId: entityId ? this.#parseNumber(entityId) : null,
					bindElement: link.anchor,
					...urlParams
				}
			};
		}
		#validateLink(link) {
			if (!main_core.Type.isPlainObject(link)) {
				return false;
			}
			if (!main_core.Type.isString(link.url) || link.url.trim() === '') {
				return false;
			}
			if (!main_core.Type.isArray(link.matches) || link.matches.length < 4) {
				return false;
			}
			return main_core.Type.isDomNode(link.anchor);
		}
		#parseUrlParams(url) {
			try {
				const urlParams = new URLSearchParams(url);
				return {
					[tasks_v2_const.ChatActionParam.ChildrenIds]: this.#parseArrayIds(urlParams, tasks_v2_const.ChatActionParam.ChildrenIds)
				};
			} catch {
				return {};
			}
		}
		#parseArrayIds(urlParams, paramName) {
			const result = [];
			urlParams.forEach((value, key) => {
				if (key.startsWith(paramName)) {
					result.push(this.#parseNumber(value));
				}
			});
			return result;
		}
		#parseNumber(value) {
			const parsed = parseInt(value, 10);
			return Number.isInteger(parsed) ? parsed : 0;
		}
	}

	class ExtensionLoader {
		#extensionName;
		#exportName;
		#loadPromise = null;
		#exports = null;
		constructor(extensionName, exportName) {
			this.#extensionName = extensionName;
			this.#exportName = exportName;
		}
		load() {
			this.#loadPromise ??= main_core.Runtime.loadExtension(this.#extensionName).then(exports => {
				if (exports?.[this.#exportName]) {
					this.#exports = exports;
					return exports;
				}
				this.#loadPromise = null;
				return null;
			}).catch(() => {
				this.#loadPromise = null;
				return null;
			});
			return this.#loadPromise;
		}
		getExports() {
			return this.#exports;
		}
	}
	const announcerLoader = new ExtensionLoader('ui.a11y', 'LiveAnnouncer');
	const resultServiceLoader = new ExtensionLoader('tasks.v2.provider.service.result-service', 'resultService');

	class ChatHint extends tasks_v2_lib_hint.Hint {
		#popupId = 'tasks-chat-hint';
		async show(text, payload, popupOptions = {}) {
			const options = {
				id: this.#popupId,
				role: 'status',
				bindElement: payload.bindElement,
				content: text,
				fixed: true,
				trackAnchor: true,
				offsetLeft: 40,
				maxWidth: 770,
				padding: 12,
				targetContainer: document.body,
				...popupOptions
			};
			if (payload.coordinates?.x) {
				const bindElementRect = payload.bindElement.getBoundingClientRect();
				const desiredOffsetLeft = payload.coordinates.x - bindElementRect.left;
				const clampToWidth = width => Math.min(Math.max(desiredOffsetLeft, 0), width);
				options.offsetLeft = clampToWidth(bindElementRect.width);
				options.resolveOffsetLeft = rect => clampToWidth(rect.width);
			}
			await super.showHint(options);
		}
	}
	function toPlainText(text) {
		return text.replaceAll(/<[^>]*>/gu, ' ').replaceAll(/\s+/gu, ' ').trim();
	}
	const chatHint = new ChatHint();

	const Outcome = Object.freeze({
		Success: 'success',
		NoPermission: 'no_permission',
		AlreadyObserver: 'already_observer',
		UserInactive: 'user_inactive',
		NotAllowedByPolicy: 'not_allowed_by_policy',
		NoRequest: 'no_request'
	});
	class AddObserverAction extends BaseAction {
		#inFlight = new Set();
		getName() {
			return tasks_v2_const.ChatAction.AddObserver;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (!payload.entityId) {
				return;
			}
			const key = `${payload.taskId}:${payload.entityId}`;
			if (this.#inFlight.has(key)) {
				return;
			}
			this.#inFlight.add(key);
			try {
				const {
					outcome
				} = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskAccessAddObserver, {
					taskId: payload.taskId,
					userId: payload.entityId
				});
				this.#handleOutcome(outcome, payload);
			} catch (error) {
				this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ERROR'));
			} finally {
				this.#inFlight.delete(key);
			}
		}
		#handleOutcome(outcome, payload) {
			switch (outcome) {
				case Outcome.Success:
					break;
				case Outcome.NoPermission:
					void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NO_PERMISSION'), payload);
					break;
				case Outcome.AlreadyObserver:
					this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ALREADY_OBSERVER'));
					break;
				case Outcome.UserInactive:
					this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_USER_INACTIVE'));
					break;
				case Outcome.NotAllowedByPolicy:
					this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NOT_ALLOWED'));
					break;
				case Outcome.NoRequest:
					this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_NO_REQUEST'));
					break;
				default:
					this.#notify(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_ADD_OBSERVER_ERROR'));
					break;
			}
		}
		#notify(text) {
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id: 'tasks-chat-action-add-observer',
				text
			});
		}
	}
	const addObserverAction = new AddObserverAction();

	class CheckListBaseAction extends BaseAction {
		get needsTaskData() {
			return true;
		}
		get redirectsToTaskWhenNotReady() {
			return true;
		}
		isReady(payload) {
			return this.#hasLoadedTask(payload) && !this.#isStoreBehind(payload);
		}

		// the refreshed tree is merged into the store task, so there is nothing to refresh without one
		needsRefresh(payload) {
			return this.#hasLoadedTask(payload) && this.#isStoreBehind(payload);
		}
		async refreshData(payload) {
			try {
				await tasks_v2_provider_service_checkListService.checkListService.refresh(payload.taskId, this.getCheckedEntityIds(payload));
				return true;
			} catch {
				this.#showLoadFailedHint(payload.bindElement, payload.coordinates);
				return false;
			}
		}
		showCheckListRemovedHint(bindElement, coordinates) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_REMOVED_HINT_MSGVER_1'), {
				bindElement,
				coordinates
			});
		}
		showCheckListItemsRemovedHint(bindElement, coordinates) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_ITEMS_REMOVED_HINT_MSGVER_1'), {
				bindElement,
				coordinates
			});
		}
		getCheckedEntityIds(payload) {
			return [payload.entityId];
		}
		#hasLoadedTask(payload) {
			return tasks_v2_provider_service_taskService.taskService.hasStoreTask(payload.taskId, false);
		}

		// an entity missing from the store is a removal only once the server was asked about this very
		// entity: a tree loaded before the entity appeared misses it exactly like a tree where it was
		// deleted, and the local revision moves only with pull, so it cannot vouch for the whole tree
		#isStoreBehind(payload) {
			return this.#lacksEntity(payload) && !tasks_v2_provider_service_checkListService.checkListService.hasCheckedEntities(payload.taskId, this.getCheckedEntityIds(payload));
		}

		// the check is made against the tree of payload.taskId, while the check list store keeps the trees
		// of every loaded task, so an entity outside this task's tree confirms nothing about this task
		#lacksEntity(payload) {
			if (this.isTooltipOnly(payload)) {
				return true;
			}
			const checkListIds = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId)?.checklist ?? [];
			return !checkListIds.includes(payload.entityId);
		}
		#showLoadFailedHint(bindElement, coordinates) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_LOAD_FAILED'), {
				bindElement,
				coordinates
			});
		}
	}

	class ShowCheckListAction extends CheckListBaseAction {
		getName() {
			return tasks_v2_const.ChatAction.ShowCheckList;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			const {
				entityId,
				bindElement,
				coordinates
			} = payload;
			if (!tasks_v2_provider_service_checkListService.checkListService.isCheckListExists(entityId)) {
				this.showCheckListRemovedHint(bindElement, coordinates);
				return;
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ShowCheckList, {
				checkListId: entityId
			});
		}
		isTooltipOnly(payload) {
			return !tasks_v2_provider_service_checkListService.checkListService.isCheckListExists(payload.entityId);
		}
	}
	const showCheckListAction = new ShowCheckListAction();

	class ShowCheckListItemsAction extends CheckListBaseAction {
		getName() {
			return tasks_v2_const.ChatAction.ShowCheckListItems;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			const {
				entityId,
				childrenIds,
				bindElement,
				coordinates
			} = payload;
			if (!tasks_v2_provider_service_checkListService.checkListService.isCheckListExists(entityId)) {
				this.showCheckListRemovedHint(bindElement, coordinates);
				return;
			}
			const filteredItems = tasks_v2_provider_service_checkListService.checkListService.filterItemsBelongingToCheckList(entityId, childrenIds);
			if (filteredItems.length === 0) {
				this.showCheckListItemsRemovedHint(bindElement, coordinates);
				return;
			}
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ShowCheckListItems, {
				checkListItemIds: filteredItems.slice(0, 10)
			});
		}
		isTooltipOnly(payload) {
			const {
				entityId,
				childrenIds
			} = payload;
			if (!tasks_v2_provider_service_checkListService.checkListService.isCheckListExists(entityId)) {
				return true;
			}
			return tasks_v2_provider_service_checkListService.checkListService.filterItemsBelongingToCheckList(entityId, childrenIds).length === 0;
		}
		getCheckedEntityIds(payload) {
			return [payload.entityId, ...(payload.childrenIds ?? [])];
		}
	}
	const showCheckListItemsAction = new ShowCheckListItemsAction();

	async function announce(text, politeness) {
		const announcer = (await announcerLoader.load())?.LiveAnnouncer;
		announcer?.announce(toPlainText(text), politeness);
	}

	const pickerHostExtension = 'tasks.v2.lib.deadline-picker-host';
	class ChangeDeadlineAction extends BaseAction {
		// the calendar stack is pulled in on the first click, not on the chat load
		#pickerHostLoader = new ExtensionLoader(pickerHostExtension, 'deadlinePickerHost');
		getName() {
			return tasks_v2_const.ChatAction.ChangeDeadline;
		}
		get needsTaskData() {
			return true;
		}
		requiresCard(payload) {
			return false;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (payload.isCardMounted) {
				this.#emitOpenDeadlinePickerEvent(payload);
				return;
			}
			if (payload.isTaskDataReady === false) {
				await this.#showTaskUnavailableHint(payload);
				return;
			}
			if (!tasks_v2_lib_deadlineRules.deadlineRules.canChange(payload.taskId)) {
				await this.showRestrictionHint(payload);
				return;
			}
			const pickerHost = await this.#pickerHostLoader.load();
			if (!pickerHost) {
				await this.#showTaskUnavailableHint(payload);
				return;
			}
			const {
				deadlinePickerHost,
				DeadlinePickerOpenStatus
			} = pickerHost;
			const openStatus = await deadlinePickerHost.open(payload);
			if (openStatus !== DeadlinePickerOpenStatus.Opened && openStatus !== DeadlinePickerOpenStatus.Superseded) {
				await this.#showTaskUnavailableHint(payload);
			}
		}
		showRestrictionHint(payload) {
			const messageId = tasks_v2_lib_deadlineRules.deadlineRules.isChangeCountExceeded(payload.taskId) ? 'TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_EXCEEDED' : 'TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_NO_PERMISSION';
			return this.#showHint(main_core.Loc.getMessage(messageId), payload);
		}
		#showTaskUnavailableHint(payload) {
			return this.#showHint(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_LOAD_FAILED'), payload);
		}
		#showHint(text, payload) {
			void chatHint.show(text, payload);
			return announce(text, 'assertive');
		}
		#emitOpenDeadlinePickerEvent(payload) {
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenDeadlinePicker, {
				taskId: payload.taskId,
				bindElement: payload.bindElement,
				coordinates: payload.coordinates
			});
		}
	}
	const changeDeadlineAction = new ChangeDeadlineAction();

	class CompleteTaskAction extends BaseAction {
		getName() {
			return tasks_v2_const.ChatAction.CompleteTask;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (!payload.isCardMounted && payload.isTaskDataReady === false) {
				await this.#showTaskUnavailableHint(payload);
				return;
			}
			if (this.#isCompleted(payload)) {
				await this.#showCompletedHint(payload);
				return;
			}
			if (!this.hasPermission(payload)) {
				await this.#showAccessDeniedHint(payload);
				return;
			}
			if (!payload.isCardMounted && this.requiresCard(payload)) {
				await this.#showCardRequiredHint(payload);
				return;
			}
			const error = await tasks_v2_provider_service_statusService.statusService.complete(payload.taskId);
			if (error) {
				await this.#showErrorHint(error, payload);
				return;
			}
			if (this.#isCompleted(payload)) {
				await announce(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), 'polite');
			}
		}
		hasPermission(payload) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			return task?.rights?.complete === true;
		}
		get needsTaskData() {
			return true;
		}
		get needsResultData() {
			return true;
		}
		requiresCard(payload) {
			if (this.#isRefused(payload)) {
				return false;
			}
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			if (!task?.requireResult) {
				return false;
			}
			const currentUserId = this.$store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
			return !tasks_v2_core.Core.getParams().rights.user.admin && currentUserId !== task.creatorId && !this.#hasOpenedResults(payload.taskId);
		}
		#isRefused(payload) {
			return this.#isCompleted(payload) || !this.hasPermission(payload);
		}
		isTooltipOnly(payload) {
			return this.#isCompleted(payload) || !this.hasPermission(payload);
		}
		isReady(payload) {
			return tasks_v2_provider_service_taskService.taskService.hasStoreTask(payload.taskId, false);
		}
		#isCompleted(payload) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			return [tasks_v2_const.TaskStatus.Completed, tasks_v2_const.TaskStatus.SupposedlyCompleted].includes(task?.status);
		}
		#hasOpenedResults(taskId) {
			const resultService = resultServiceLoader.getExports()?.resultService;
			return resultService ? resultService.hasOpenedResults(taskId) : false;
		}
		#showAccessDeniedHint(payload) {
			return this.#showHint(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_NO_PERMISSION'), payload);
		}
		#showCompletedHint(payload) {
			return this.#showHint(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), payload);
		}
		#showCardRequiredHint(payload) {
			return this.#showHint(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_RESULT_REQUIRED'), payload);
		}
		#showTaskUnavailableHint(payload) {
			return this.#showHint(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_LOAD_FAILED'), payload);
		}
		#showErrorHint(error, payload) {
			const text = main_core.Type.isStringFilled(error.message) ? error.message : main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_ERROR');
			return this.#showHint(text, payload);
		}
		#showHint(text, payload) {
			void chatHint.show(text, payload);
			return announce(text, 'assertive');
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const completeTaskAction = new CompleteTaskAction();

	class OpenGroupAction extends BaseAction {
		getName() {
			return tasks_v2_const.ChatAction.OpenGroup;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (!this.#isLinkedToCurrentTask(payload)) {
				this.#showGroupUnlinkedHint(payload);
				return;
			}
			await this.#openGroup(payload);
		}
		isTooltipOnly(payload) {
			return !this.#isLinkedToCurrentTask(payload);
		}
		isReady(payload) {
			return tasks_v2_provider_service_taskService.taskService.hasStoreTask(payload.taskId, false);
		}
		#isLinkedToCurrentTask(payload) {
			const {
				entityId,
				taskId
			} = payload;
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			return main_core.Type.isNumber(task?.groupId) && task.groupId > 0 && task.groupId === entityId;
		}
		#showGroupUnlinkedHint(payload) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_OPEN_GROUP_UNLINKED'), payload);
		}
		async #openGroup(payload) {
			const {
				entityId: groupId
			} = payload;
			const group = this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](groupId);
			const href = await tasks_v2_provider_service_groupService.groupService.getUrl(groupId, group.type);
			BX.SidePanel.Instance.emulateAnchorClick(href);
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const openGroupAction = new OpenGroupAction();

	class OpenResultAction extends BaseAction {
		getName() {
			return tasks_v2_const.ChatAction.OpenResult;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (!this.#hasResult(payload)) {
				this.#showNoResultHint(payload);
				return;
			}
			this.#emitOpenResultEvent(payload);
		}
		isTooltipOnly(payload) {
			return !this.#hasResult(payload);
		}
		isReady(payload) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			return tasks_v2_provider_service_taskService.taskService.hasStoreTask(payload.taskId, false) && (!task.containsResults || task.results.length > 0);
		}
		#hasResult(payload) {
			const {
				entityId,
				taskId
			} = payload;
			if (!entityId || !taskId) {
				return false;
			}
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			return !(!task?.results || !task.results.includes(entityId));
		}
		#showNoResultHint(payload) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_RESULT_NOT_FOUND_MSGVER_1'), payload);
		}
		#emitOpenResultEvent(payload) {
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenResultFromChat, {
				taskId: payload.taskId,
				resultId: payload.entityId
			});
		}
	}
	const openResultAction = new OpenResultAction();

	class OpenTimeTrackingAction extends BaseAction {
		getName() {
			return tasks_v2_const.ChatAction.OpenTimeTracking;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			if (payload.entityId) {
				const isTimeTrackingValid = await this.validateTimeTracking(payload);
				if (!isTimeTrackingValid) {
					return;
				}
			}
			this.openTimeTrackingPopup(payload.entityId);
		}
		isTooltipOnly(payload) {
			if (!payload.entityId) {
				return false;
			}
			if (!tasks_v2_provider_service_timeTrackingService.timeTrackingService.hasLoaded(payload.taskId)) {
				return false;
			}
			return this.#isRecordRemoved(payload);
		}
		async validateTimeTracking(payload) {
			if (!tasks_v2_provider_service_timeTrackingService.timeTrackingService.getById(payload.entityId) && !tasks_v2_provider_service_timeTrackingService.timeTrackingService.hasLoaded(payload.taskId)) {
				await tasks_v2_provider_service_timeTrackingService.timeTrackingService.list(payload.taskId);
			}
			if (this.#isRecordRemoved(payload)) {
				this.showRecordRemovedHint(payload);
				return false;
			}
			return true;
		}
		#isRecordRemoved(payload) {
			if (tasks_v2_provider_service_timeTrackingService.timeTrackingService.getById(payload.entityId)) {
				return false;
			}
			if (this.isNewerThanLoaded(payload.taskId, payload.entityId)) {
				return false;
			}
			if (!tasks_v2_provider_service_timeTrackingService.timeTrackingService.hasLoadedAll(payload.taskId)) {
				return false;
			}
			return true;
		}
		showRecordRemovedHint(payload) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_OPEN_TIME_TRACKING_RECORD_REMOVED'), payload);
		}
		isNewerThanLoaded(taskId, entityId) {
			const loadedIds = tasks_v2_provider_service_timeTrackingService.timeTrackingService.getLoadedIds(taskId);
			if (loadedIds.length === 0) {
				return false;
			}
			return entityId > loadedIds[0];
		}
		openTimeTrackingPopup(entityId) {
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenTimeTrackingPopup, {
				entityId
			});
		}
	}
	const openTimeTrackingAction = new OpenTimeTrackingAction();

	class ChatActionService {
		#defaultActions = [addObserverAction, changeDeadlineAction, completeTaskAction, openGroupAction, openResultAction, showCheckListAction, showCheckListItemsAction, openTimeTrackingAction];
		#actionDispatcher;
		#linkParser;
		#pendingActions = new Map();
		#activeProcesses = new Map();
		#activeTaskLoads = new Map();

		/**
		 * Returns whether at least one V2 full card instance is registered, regardless of its loading state.
		 */
		static isTaskOpened(taskId) {
			if (!ChatActionService.#isValidTaskId(taskId, 'isTaskOpened')) {
				return false;
			}
			return ChatActionService.#queryOpenedCards(TaskFullCard => TaskFullCard.isOpened(taskId));
		}

		/**
		 * Returns whether at least one open V2 full card finished its initial load, successfully or with an error.
		 */
		static isTaskBootstrapped(taskId) {
			if (!ChatActionService.#isValidTaskId(taskId, 'isTaskBootstrapped')) {
				return false;
			}
			return ChatActionService.#queryOpenedCards(TaskFullCard => TaskFullCard.isBootstrapped(taskId));
		}
		constructor(dependencies) {
			this.#actionDispatcher = dependencies.actionDispatcher;
			this.#linkParser = dependencies.linkParser;
			this.#registerDefaultActions();
			this.#subscribeToCardEvents();
		}
		#registerDefaultActions() {
			this.#defaultActions.forEach(action => {
				try {
					this.#actionDispatcher.register(action);
				} catch (error) {
					console.error('ChatActionService: Failed to register action', action.getName(), error);
				}
			});
		}
		#subscribeToCardEvents() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardInit, this.#onCardInit);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardInitFailed, this.#onCardInitFailed);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardClosed, this.#onCardClosed);
		}

		// the card that emits this event is mounted by definition, and the announcement outruns the registry
		// whenever this service subscribed before the card did, so both flags come from the event itself
		#onCardInit = event => {
			// the card announces its task only once it is in the store, so the queued actions see the data as ready
			void this.#executePendingActions(this.#extractTaskId(event), {
				isTaskDataReady: true,
				isCardMounted: true
			});
		};

		// a card that gave up on loading its task stays opened, so its action runs and reports the outcome
		// itself; isTaskDataReady=false mirrors what #preloadTaskData would have resolved to. The failed card
		// is not mounted, but another card of the same task may be, so that flag stays with the registry
		#onCardInitFailed = event => {
			void this.#executePendingActions(Number(event.getData()?.taskId), {
				isTaskDataReady: false
			});
		};

		// several links may be clicked while the card loads, so every queued action runs in its own turn;
		// the card state is recomputed here (not reused from queue time) and the caller may override it
		async #executePendingActions(taskId, extraPayload = {}) {
			const pendingActions = this.#pendingActions.get(taskId);
			if (!pendingActions) {
				return;
			}
			this.#pendingActions.delete(taskId);
			const isCardMounted = this.#isCardMounted(taskId);
			for (const {
				actionName,
				payload
			} of pendingActions) {
				try {
					// eslint-disable-next-line no-await-in-loop
					await this.#actionDispatcher.execute(actionName, {
						...payload,
						isCardMounted,
						...extraPayload
					});
				} catch (error) {
					console.error('ChatActionService: Failed to execute pending action', actionName, error);
				}
			}
		}
		#onCardClosed = event => {
			const taskId = this.#extractTaskId(event);

			// a card may close before it ever announces init, and then nothing would drain its pending action;
			// the closed card is already unregistered from the opened-cards registry, so a still opened second
			// instance (e.g. side panel + slider) keeps the action alive instead of dropping it here
			if (this.#isCardOpened(taskId)) {
				return;
			}
			this.#pendingActions.delete(taskId);
		};

		// the registry knows every card instance, including the ones mounted before this service was even loaded;
		// a failed check falls back to the hint path, which answers the click instead of aiming at a missing card
		#isCardMounted(taskId) {
			return ChatActionService.#queryOpenedCards(TaskFullCard => TaskFullCard.isMounted(taskId));
		}

		// FullCardInit carries the task, FullCardClosed carries the card params
		#extractTaskId(event) {
			const data = event.getData();
			return Number(data?.task?.id ?? data?.taskId);
		}
		async process(link, options = {}) {
			try {
				const parsedLink = this.#linkParser.parse(link);
				if (!parsedLink) {
					return;
				}
				const payload = {
					...parsedLink.payload,
					...options
				};
				const action = this.#actionDispatcher.get(parsedLink.actionName);
				if (!action) {
					return;
				}
				if (tasks_v2_core.Core.getStore()) {
					// a stale store must not pass for a removed entity, so the verdict waits for fresh data
					if (action.needsRefresh(payload)) {
						const refreshed = await action.refreshData(payload);
						if (!refreshed) {
							return;
						}
					}

					// warm store lets a refusal answer with a hint right away, without the preload below
					if (action.isReady(payload) && action.isTooltipOnly(payload)) {
						await action.execute(payload);
						return;
					}
				}
				const taskId = Number(payload.taskId);
				const {
					actionName
				} = parsedLink;
				if (this.#isCardOpened(taskId)) {
					// the card is registered before it loads, so wait for its data instead of reopening the card
					if (!this.#isCardBootstrapped(taskId)) {
						this.#addPendingAction(taskId, actionName, payload);
						return;
					}
					await this.#runDeduplicated(actionName, taskId, () => this.#executeOnOpenedCard(action, actionName, payload, taskId));
					return;
				}
				await this.#runDeduplicated(actionName, taskId, () => this.#runAction(action, actionName, payload, taskId, link.url));
			} catch (error) {
				console.error('ChatActionService: Failed to process link', error);
			}
		}

		// one click of a link runs at a time, so a double click neither doubles the request nor doubles the action
		async #runDeduplicated(actionName, taskId, startProcess) {
			const processKey = `${actionName}:${taskId}`;
			const activeProcess = this.#activeProcesses.get(processKey);
			if (activeProcess) {
				await activeProcess;
				return;
			}
			const startedProcess = startProcess();
			this.#activeProcesses.set(processKey, startedProcess);
			try {
				await startedProcess;
			} finally {
				this.#activeProcesses.delete(processKey);
			}
		}

		// the card is already opened, so the action goes straight to it, without the card-opening handshake
		async #executeOnOpenedCard(action, actionName, payload, taskId) {
			const actionPayload = await this.#buildActionPayload(action, payload, taskId);
			await this.#actionDispatcher.execute(actionName, actionPayload);
		}
		async #runAction(action, actionName, payload, taskId, fallbackUrl) {
			const actionPayload = await this.#buildActionPayload(action, payload, taskId);
			const cardRequired = !actionPayload.isTaskDataReady || action.requiresCard(actionPayload);
			if (cardRequired) {
				const event = new main_core_events.BaseEvent({
					data: {
						taskId
					}
				});
				await main_core_events.EventEmitter.emitAsync(tasks_v2_const.EventName.ChatActionBeforeExecute, event);
				if (event.isDefaultPrevented()) {
					this.#addPendingAction(taskId, actionName, actionPayload);
					return;
				}
				if (action.redirectsToTaskWhenNotReady && !action.isReady(actionPayload)) {
					main_core.Page.redirect(fallbackUrl);
					return;
				}
			}
			await this.#actionDispatcher.execute(actionName, actionPayload);
		}

		// the single place that fills the action payload, so no path can silently drop the readiness of the data
		async #buildActionPayload(action, payload, taskId) {
			const isTaskDataReady = await this.#preloadTaskData(action, taskId);
			return {
				...payload,
				isCardMounted: this.#isCardMounted(taskId),
				isTaskDataReady
			};
		}
		async #preloadTaskData(action, taskId) {
			if (!action.needsTaskData) {
				return true;
			}
			try {
				await tasks_v2_core.Core.init();
			} catch {
				return false;
			}
			if (tasks_v2_provider_service_taskService.taskService.hasStoreTask(taskId, false)) {
				return this.#preloadStoreTaskResults(action, taskId);
			}
			const task = await this.#loadTask(taskId);
			if (!task) {
				return false;
			}
			return this.#preloadResults(action, task, taskId);
		}
		async #loadTask(taskId) {
			const activeLoad = this.#activeTaskLoads.get(taskId);
			if (activeLoad) {
				return activeLoad;
			}
			const startedLoad = this.#requestTask(taskId);
			this.#activeTaskLoads.set(taskId, startedLoad);
			try {
				return await startedLoad;
			} finally {
				this.#activeTaskLoads.delete(taskId);
			}
		}
		async #requestTask(taskId) {
			try {
				const {
					task,
					error
				} = await tasks_v2_provider_service_taskService.taskService.get(taskId);
				return error ? null : task;
			} catch {
				return null;
			}
		}
		#preloadStoreTaskResults(action, taskId) {
			return this.#preloadResults(action, tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId), taskId, true);
		}
		async #preloadResults(action, task, taskId, canReuseStoreResults = false) {
			if (!this.#needsResultLayer(action, task)) {
				return true;
			}
			const resultService = (await resultServiceLoader.load())?.resultService;
			if (!resultService) {
				return false;
			}
			if (!this.#needsResults(action, task) || canReuseStoreResults && this.#hasStoreResults(task, resultService)) {
				return true;
			}
			try {
				await resultService.tail(taskId);
			} catch {
				return false;
			}
			return true;
		}
		#needsResultLayer(action, task) {
			return action.needsResultData && Boolean(task?.requireResult);
		}
		#needsResults(action, task) {
			return this.#needsResultLayer(action, task) && Boolean(task?.containsResults);
		}
		#hasStoreResults(task, resultService) {
			const results = task?.results ?? [];
			return results.length > 0 && results.every(resultId => {
				return resultService.hasStoreResult(resultId);
			});
		}
		#addPendingAction(taskId, actionName, payload) {
			const pendingActions = this.#pendingActions.get(taskId) ?? [];
			pendingActions.push({
				actionName,
				payload
			});
			this.#pendingActions.set(taskId, pendingActions);
		}
		#isCardOpened(taskId) {
			return ChatActionService.isTaskOpened(taskId);
		}

		// a failed check must not queue the action forever, so it falls back to the plain immediate dispatch
		#isCardBootstrapped(taskId) {
			return ChatActionService.#queryOpenedCards(TaskFullCard => TaskFullCard.isBootstrapped(taskId), true);
		}
		static #isValidTaskId(taskId, methodName) {
			if (!main_core.Type.isNumber(taskId) && !Number.isNaN(taskId)) {
				// eslint-disable-next-line no-console
				console.warn(`ChatActionService.${methodName}: taskId must be a number.`);
				return false;
			}
			return Number.isInteger(taskId) && taskId > 0;
		}

		// the card bundle is loaded only when a card opens, so a missing class means no opened cards
		static #queryOpenedCards(query, fallback = false) {
			try {
				const TaskFullCard = main_core.Reflection.getClass('BX.Tasks.V2.Application.TaskFullCard');
				return TaskFullCard ? query(TaskFullCard) === true : fallback;
			} catch (error) {
				console.error('ChatActionService: Failed to check opened cards', error);
				return fallback;
			}
		}
	}
	const chatActionService = new ChatActionService({
		actionDispatcher: new ChatActionDispatcher(),
		linkParser: new ChatLinkParser()
	});

	exports.ChatActionService = ChatActionService;
	exports.chatActionService = chatActionService;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Event, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Provider.Service, BX.UI.NotificationManager, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=chat-action-service.bundle.js.map
