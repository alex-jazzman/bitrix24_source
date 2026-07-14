/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core_events, tasks_v2_const, main_core, tasks_v2_provider_service_checkListService, tasks_v2_lib_hint, tasks_v2_core, tasks_v2_provider_service_statusService, tasks_v2_provider_service_taskService, tasks_v2_provider_service_groupService, tasks_v2_provider_service_timeTrackingService) {
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

	class ChatHint extends tasks_v2_lib_hint.Hint {
		#popupId = 'tasks-chat-hint';
		async show(text, payload, popupOptions) {
			const options = {
				id: this.#popupId,
				bindElement: payload.bindElement,
				content: text,
				offsetLeft: 40,
				maxWidth: 770,
				padding: 12,
				targetContainer: document.body,
				...popupOptions
			};
			if (payload.coordinates?.x) {
				const bindElementRect = payload.bindElement.getBoundingClientRect();
				options.offsetLeft = payload.coordinates.x - bindElementRect.left;
			}
			await super.showHint(options);
		}
	}
	const chatHint = new ChatHint();

	class CheckListBaseAction extends BaseAction {
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
	}
	const showCheckListItemsAction = new ShowCheckListItemsAction();

	class ChangeDeadlineAction extends BaseAction {
		getName() {
			return tasks_v2_const.ChatAction.ChangeDeadline;
		}
		async execute(payload) {
			if (!this.isValid(payload)) {
				throw new Error('Invalid payload');
			}
			this.#emitOpenDeadlinePickerEvent(payload);
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
			if (this.#isCompleted(payload)) {
				this.#showCompletedHint(payload);
				return;
			}
			if (!this.hasPermission(payload)) {
				this.#showAccessDeniedHint(payload);
				return;
			}
			await tasks_v2_provider_service_statusService.statusService.complete(payload.taskId);
		}
		hasPermission(payload) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			return task && task.rights?.complete === true;
		}
		#isCompleted(payload) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
			return [tasks_v2_const.TaskStatus.Completed, tasks_v2_const.TaskStatus.SupposedlyCompleted].includes(task?.status);
		}
		#showAccessDeniedHint(payload) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_NO_PERMISSION'), payload);
		}
		#showCompletedHint(payload) {
			void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_TASK_COMPLETED'), payload);
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
		async validateTimeTracking(payload) {
			let elapsedTime = tasks_v2_provider_service_timeTrackingService.timeTrackingService.getById(payload.entityId);
			if (!elapsedTime && !tasks_v2_provider_service_timeTrackingService.timeTrackingService.hasLoaded(payload.taskId)) {
				await tasks_v2_provider_service_timeTrackingService.timeTrackingService.list(payload.taskId);
				elapsedTime = tasks_v2_provider_service_timeTrackingService.timeTrackingService.getById(payload.entityId);
			}
			if (elapsedTime) {
				return true;
			}
			if (this.isNewerThanLoaded(payload.taskId, payload.entityId)) {
				return true;
			}
			if (!tasks_v2_provider_service_timeTrackingService.timeTrackingService.hasLoadedAll(payload.taskId)) {
				return true;
			}
			this.showRecordRemovedHint(payload);
			return false;
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
		#defaultActions = [changeDeadlineAction, completeTaskAction, openGroupAction, openResultAction, showCheckListAction, showCheckListItemsAction, openTimeTrackingAction];
		#actionDispatcher;
		#linkParser;
		#pendingActions = new Map();
		constructor(dependencies) {
			this.#actionDispatcher = dependencies.actionDispatcher;
			this.#linkParser = dependencies.linkParser;
			this.#registerDefaultActions();
			this.#subscribeToCardInit();
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
		#subscribeToCardInit() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardInit, this.#onCardInit);
		}
		#onCardInit = event => {
			const {
				task
			} = event.getData();
			const taskId = Number(task?.id);
			if (!this.#pendingActions.has(taskId)) {
				return;
			}
			const pendingAction = this.#pendingActions.get(taskId);
			void this.#actionDispatcher.execute(pendingAction.actionName, pendingAction.payload);
			this.#pendingActions.delete(taskId);
		};
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
				const taskId = Number(payload.taskId);
				const event = new main_core_events.BaseEvent({
					data: {
						taskId
					}
				});
				await main_core_events.EventEmitter.emitAsync(tasks_v2_const.EventName.ChatActionBeforeExecute, event);
				if (event.isDefaultPrevented()) {
					this.#pendingActions.set(taskId, {
						actionName: parsedLink.actionName,
						payload
					});
				} else {
					await this.#actionDispatcher.execute(parsedLink.actionName, payload);
				}
			} catch (error) {
				console.error('ChatActionService: Failed to process link', error);
			}
		}
	}
	const chatActionService = new ChatActionService({
		actionDispatcher: new ChatActionDispatcher(),
		linkParser: new ChatLinkParser()
	});

	exports.ChatActionService = ChatActionService;
	exports.chatActionService = chatActionService;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Event, BX.Tasks.V2.Const, BX, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=chat-action-service.bundle.js.map
