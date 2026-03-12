/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,tasks_v2_lib_hint,tasks_v2_provider_service_checkListService,tasks_v2_core,tasks_v2_provider_service_statusService,main_core,main_core_events,tasks_v2_const,tasks_v2_provider_service_taskService) {
	'use strict';

	var _validatePayload = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("validatePayload");
	class BaseAction {
	  constructor() {
	    Object.defineProperty(this, _validatePayload, {
	      value: _validatePayload2
	    });
	  }
	  execute(payload) {
	    throw new Error(`Method execute must be implemented in ${this.constructor.name}`);
	  }
	  getName() {
	    throw new Error(`Method getName must be implemented in ${this.constructor.name}`);
	  }
	  isValid(payload) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _validatePayload)[_validatePayload](payload);
	  }
	  hasPermission(payload) {
	    return true;
	  }
	}
	function _validatePayload2(payload) {
	  if (!main_core.Type.isPlainObject(payload)) {
	    return false;
	  }
	  return main_core.Type.isNumber(payload.taskId) && payload.taskId > 0 && main_core.Type.isDomNode(payload.bindElement);
	}

	var _actions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("actions");
	class ChatActionDispatcher {
	  constructor() {
	    Object.defineProperty(this, _actions, {
	      writable: true,
	      value: new Map()
	    });
	  }
	  register(action) {
	    const actionName = action.getName();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _actions)[_actions].has(actionName)) {
	      throw new Error(`ChatActionDispatcher: action '${actionName}' already registered`);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _actions)[_actions].set(actionName, action);
	  }
	  async execute(actionName, payload) {
	    if (!main_core.Type.isString(actionName) || actionName.trim() === '') {
	      throw new Error('Invalid action name');
	    }
	    const action = babelHelpers.classPrivateFieldLooseBase(this, _actions)[_actions].get(actionName.trim());
	    if (!action) {
	      throw new Error(`Action '${actionName}' not found`);
	    }
	    await action.execute(payload);
	  }
	}

	var _validateLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("validateLink");
	var _parseUrlParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseUrlParams");
	var _parseArrayIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseArrayIds");
	var _parseNumber = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseNumber");
	class ChatLinkParser {
	  constructor() {
	    Object.defineProperty(this, _parseNumber, {
	      value: _parseNumber2
	    });
	    Object.defineProperty(this, _parseArrayIds, {
	      value: _parseArrayIds2
	    });
	    Object.defineProperty(this, _parseUrlParams, {
	      value: _parseUrlParams2
	    });
	    Object.defineProperty(this, _validateLink, {
	      value: _validateLink2
	    });
	  }
	  parse(link) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _validateLink)[_validateLink](link)) {
	      console.error('ChatLinkParser: Link is not valid');
	      return null;
	    }
	    const {
	      taskId,
	      [tasks_v2_const.ChatActionParam.ChatAction]: chatAction,
	      [tasks_v2_const.ChatActionParam.EntityId]: entityId
	    } = link.matches.groups;
	    const parsedTaskId = babelHelpers.classPrivateFieldLooseBase(this, _parseNumber)[_parseNumber](taskId);
	    if (parsedTaskId <= 0) {
	      console.error('ChatLinkParser: taskId must be positive number');
	      return null;
	    }
	    if (!chatAction || chatAction.trim() === '') {
	      console.error('ChatLinkParser: actionName is required');
	      return null;
	    }
	    const urlParams = babelHelpers.classPrivateFieldLooseBase(this, _parseUrlParams)[_parseUrlParams](link.url);
	    return {
	      actionName: chatAction.trim(),
	      payload: {
	        taskId: parsedTaskId,
	        entityId: entityId ? babelHelpers.classPrivateFieldLooseBase(this, _parseNumber)[_parseNumber](entityId) : null,
	        bindElement: link.anchor,
	        ...urlParams
	      }
	    };
	  }
	}
	function _validateLink2(link) {
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
	function _parseUrlParams2(url) {
	  try {
	    const urlParams = new URLSearchParams(url);
	    return {
	      [tasks_v2_const.ChatActionParam.ChildrenIds]: babelHelpers.classPrivateFieldLooseBase(this, _parseArrayIds)[_parseArrayIds](urlParams, tasks_v2_const.ChatActionParam.ChildrenIds)
	    };
	  } catch {
	    return {};
	  }
	}
	function _parseArrayIds2(urlParams, paramName) {
	  const result = [];
	  urlParams.forEach((value, key) => {
	    if (key.startsWith(paramName)) {
	      result.push(babelHelpers.classPrivateFieldLooseBase(this, _parseNumber)[_parseNumber](value));
	    }
	  });
	  return result;
	}
	function _parseNumber2(value) {
	  const parsed = parseInt(value, 10);
	  return Number.isInteger(parsed) ? parsed : 0;
	}

	var _popupId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupId");
	class ChatHint extends tasks_v2_lib_hint.Hint {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _popupId, {
	      writable: true,
	      value: 'tasks-chat-hint'
	    });
	  }
	  async show(text, payload, popupOptions) {
	    var _payload$coordinates;
	    const options = {
	      id: babelHelpers.classPrivateFieldLooseBase(this, _popupId)[_popupId],
	      bindElement: payload.bindElement,
	      content: text,
	      offsetLeft: 40,
	      maxWidth: 770,
	      padding: 12,
	      targetContainer: document.body,
	      ...popupOptions
	    };
	    if ((_payload$coordinates = payload.coordinates) != null && _payload$coordinates.x) {
	      const bindElementRect = payload.bindElement.getBoundingClientRect();
	      options.offsetLeft = payload.coordinates.x - bindElementRect.left;
	    }
	    await super.showHint(options);
	  }
	}
	const chatHint = new ChatHint();

	class CheckListBaseAction extends BaseAction {
	  showCheckListRemovedHint(bindElement, coordinates) {
	    void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_REMOVED_HINT'), {
	      bindElement,
	      coordinates
	    });
	  }
	  showCheckListItemsRemovedHint(bindElement, coordinates) {
	    void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHECK_LIST_ITEMS_REMOVED_HINT'), {
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

	var _canChangeDeadline = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("canChangeDeadline");
	var _exceededChangeCount = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("exceededChangeCount");
	var _showAccessDeniedHint = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showAccessDeniedHint");
	var _emitOpenDeadlinePickerEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitOpenDeadlinePickerEvent");
	class ChangeDeadlineAction extends BaseAction {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _emitOpenDeadlinePickerEvent, {
	      value: _emitOpenDeadlinePickerEvent2
	    });
	    Object.defineProperty(this, _showAccessDeniedHint, {
	      value: _showAccessDeniedHint2
	    });
	    Object.defineProperty(this, _exceededChangeCount, {
	      value: _exceededChangeCount2
	    });
	    Object.defineProperty(this, _canChangeDeadline, {
	      value: _canChangeDeadline2
	    });
	  }
	  getName() {
	    return tasks_v2_const.ChatAction.ChangeDeadline;
	  }
	  async execute(payload) {
	    if (!this.isValid(payload)) {
	      throw new Error('Invalid payload');
	    }
	    if (!this.hasPermission(payload)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _showAccessDeniedHint)[_showAccessDeniedHint](payload);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _emitOpenDeadlinePickerEvent)[_emitOpenDeadlinePickerEvent](payload);
	  }
	  hasPermission(payload) {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
	    if (!task) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _canChangeDeadline)[_canChangeDeadline](task);
	  }
	}
	function _canChangeDeadline2(task) {
	  const isFlowFilledOnAdd = task.flowId > 0;
	  return task.rights.deadline && !babelHelpers.classPrivateFieldLooseBase(this, _exceededChangeCount)[_exceededChangeCount](task) && !isFlowFilledOnAdd;
	}
	function _exceededChangeCount2(task) {
	  const currentUserId = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
	  const isCreator = currentUserId === task.creatorId;
	  if (isCreator || !task.maxDeadlineChanges) {
	    return false;
	  }
	  const deadlineChangeCount = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/deadlineChangeCount`];
	  return deadlineChangeCount >= task.maxDeadlineChanges;
	}
	function _showAccessDeniedHint2(payload) {
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
	  const exceededChangeCount = babelHelpers.classPrivateFieldLooseBase(this, _exceededChangeCount)[_exceededChangeCount](task);
	  const text = exceededChangeCount ? main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_EXCEEDED') : main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_CHANGE_DEADLINE_NO_PERMISSION');
	  const width = exceededChangeCount ? 330 : 280;
	  void chatHint.show(text, payload, {
	    maxWidth: width
	  });
	}
	function _emitOpenDeadlinePickerEvent2(payload) {
	  main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenDeadlinePicker, {
	    taskId: payload.taskId,
	    bindElement: payload.bindElement,
	    coordinates: payload.coordinates
	  });
	}
	const changeDeadlineAction = new ChangeDeadlineAction();

	var _showAccessDeniedHint$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showAccessDeniedHint");
	class CompleteTaskAction extends BaseAction {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _showAccessDeniedHint$1, {
	      value: _showAccessDeniedHint2$1
	    });
	  }
	  getName() {
	    return tasks_v2_const.ChatAction.CompleteTask;
	  }
	  async execute(payload) {
	    if (!this.isValid(payload)) {
	      throw new Error('Invalid payload');
	    }
	    if (!this.hasPermission(payload)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _showAccessDeniedHint$1)[_showAccessDeniedHint$1](payload);
	      return;
	    }
	    await tasks_v2_provider_service_statusService.statusService.complete(payload.taskId);
	  }
	  hasPermission(payload) {
	    var _task$rights;
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(payload.taskId);
	    return task && ((_task$rights = task.rights) == null ? void 0 : _task$rights.complete) === true;
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _showAccessDeniedHint2$1(payload) {
	  void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_COMPLETE_TASK_NO_PERMISSION'), payload);
	}
	const completeTaskAction = new CompleteTaskAction();

	var _hasResult = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasResult");
	var _showNoResultHint = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showNoResultHint");
	var _emitOpenResultEvent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emitOpenResultEvent");
	class OpenResultAction extends BaseAction {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _emitOpenResultEvent, {
	      value: _emitOpenResultEvent2
	    });
	    Object.defineProperty(this, _showNoResultHint, {
	      value: _showNoResultHint2
	    });
	    Object.defineProperty(this, _hasResult, {
	      value: _hasResult2
	    });
	  }
	  getName() {
	    return tasks_v2_const.ChatAction.OpenResult;
	  }
	  async execute(payload) {
	    if (!this.isValid(payload)) {
	      throw new Error('Invalid payload');
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _hasResult)[_hasResult](payload)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _showNoResultHint)[_showNoResultHint](payload);
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _emitOpenResultEvent)[_emitOpenResultEvent](payload);
	  }
	}
	function _hasResult2(payload) {
	  const {
	    entityId,
	    taskId
	  } = payload;
	  if (!entityId || !taskId) {
	    return false;
	  }
	  const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
	  return !(!(task != null && task.results) || !task.results.includes(entityId));
	}
	function _showNoResultHint2(payload) {
	  void chatHint.show(main_core.Loc.getMessage('TASKS_V2_CHAT_ACTION_RESULT_NOT_FOUND'), payload);
	}
	function _emitOpenResultEvent2(payload) {
	  main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenResultFromChat, {
	    taskId: payload.taskId,
	    resultId: payload.entityId
	  });
	}
	const openResultAction = new OpenResultAction();

	var _defaultActions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("defaultActions");
	var _actionDispatcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("actionDispatcher");
	var _linkParser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkParser");
	var _registerDefaultActions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerDefaultActions");
	class ChatActionService {
	  constructor(dependencies) {
	    Object.defineProperty(this, _registerDefaultActions, {
	      value: _registerDefaultActions2
	    });
	    Object.defineProperty(this, _defaultActions, {
	      writable: true,
	      value: [changeDeadlineAction, completeTaskAction, openResultAction, showCheckListAction, showCheckListItemsAction]
	    });
	    Object.defineProperty(this, _actionDispatcher, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _linkParser, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _actionDispatcher)[_actionDispatcher] = dependencies.actionDispatcher;
	    babelHelpers.classPrivateFieldLooseBase(this, _linkParser)[_linkParser] = dependencies.linkParser;
	    babelHelpers.classPrivateFieldLooseBase(this, _registerDefaultActions)[_registerDefaultActions]();
	  }
	  async process(link, options = {}) {
	    try {
	      const parsedLink = babelHelpers.classPrivateFieldLooseBase(this, _linkParser)[_linkParser].parse(link);
	      if (!parsedLink) {
	        return;
	      }
	      const payload = {
	        ...parsedLink.payload,
	        ...options
	      };
	      await babelHelpers.classPrivateFieldLooseBase(this, _actionDispatcher)[_actionDispatcher].execute(parsedLink.actionName, payload);
	    } catch (error) {
	      console.error('ChatActionService: Failed to process link', error);
	    }
	  }
	}
	function _registerDefaultActions2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _defaultActions)[_defaultActions].forEach(action => {
	    try {
	      babelHelpers.classPrivateFieldLooseBase(this, _actionDispatcher)[_actionDispatcher].register(action);
	    } catch (error) {
	      console.error('ChatActionService: Failed to register action', action.getName(), error);
	    }
	  });
	}
	const chatActionService = new ChatActionService({
	  actionDispatcher: new ChatActionDispatcher(),
	  linkParser: new ChatLinkParser()
	});

	exports.ChatActionService = ChatActionService;
	exports.chatActionService = chatActionService;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2,BX.Tasks.V2.Provider.Service,BX,BX.Event,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=chat-action-service.bundle.js.map
