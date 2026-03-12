/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core_events,tasks_v2_application_taskCard,tasks_v2_core,tasks_v2_lib_entitySelectorDialog,tasks_v2_lib_relationError,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,main_core,tasks_v2_const,tasks_v2_provider_service_relationService) {
	'use strict';

	let _ = t => t,
	  _t;
	var _dialogs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogs");
	var _meta = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("meta");
	var _taskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId");
	var _ids = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("ids");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _onUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdate");
	var _analytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog");
	var _createFooter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createFooter");
	var _clickCreate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clickCreate");
	var _addTaskItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addTaskItems");
	var _deleteTaskItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("deleteTaskItems");
	var _updateTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateTask");
	var _add = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("add");
	var _selectableItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectableItems");
	var _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items");
	var _mapIdsToItemIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mapIdsToItemIds");
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _isTemplate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTemplate");
	var _task = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("task");
	class RelationTasksDialog {
	  constructor(meta) {
	    Object.defineProperty(this, _task, {
	      get: _get_task,
	      set: void 0
	    });
	    Object.defineProperty(this, _isTemplate, {
	      get: _get_isTemplate,
	      set: void 0
	    });
	    Object.defineProperty(this, _entityId, {
	      get: _get_entityId,
	      set: void 0
	    });
	    Object.defineProperty(this, _mapIdsToItemIds, {
	      value: _mapIdsToItemIds2
	    });
	    Object.defineProperty(this, _items, {
	      get: _get_items,
	      set: void 0
	    });
	    Object.defineProperty(this, _selectableItems, {
	      get: _get_selectableItems,
	      set: void 0
	    });
	    Object.defineProperty(this, _add, {
	      value: _add2
	    });
	    Object.defineProperty(this, _updateTask, {
	      value: _updateTask2
	    });
	    Object.defineProperty(this, _deleteTaskItems, {
	      value: _deleteTaskItems2
	    });
	    Object.defineProperty(this, _addTaskItems, {
	      value: _addTaskItems2
	    });
	    Object.defineProperty(this, _clickCreate, {
	      value: _clickCreate2
	    });
	    Object.defineProperty(this, _createFooter, {
	      value: _createFooter2
	    });
	    Object.defineProperty(this, _createDialog, {
	      value: _createDialog2
	    });
	    Object.defineProperty(this, _dialogs, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _meta, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _taskId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _ids, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onUpdate, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta] = meta;
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TaskAdded, event => {
	      const task = event.getData().task;
	      babelHelpers.classPrivateFieldLooseBase(this, _addTaskItems)[_addTaskItems]([task.id]);
	    });
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TaskDeleted, event => {
	      const task = event.getData();
	      babelHelpers.classPrivateFieldLooseBase(this, _deleteTaskItems)[_deleteTaskItems]([task.id]);
	    });
	  }
	  show(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids] = params.ids;
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose] = params.onClose;
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdate)[_onUpdate] = params.onUpdate;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics] = params.analytics;
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids] && !babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].service.areIdsLoaded(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId])) {
	      return;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids] && this.dialog.isLoaded()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _addTaskItems)[_addTaskItems](babelHelpers.classPrivateFieldLooseBase(this, _task)[_task][babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField]);
	      this.dialog.setSelectableByIds(babelHelpers.classPrivateFieldLooseBase(this, _selectableItems)[_selectableItems]);
	    }
	    this.dialog.selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    this.dialog.getPopup().setTargetContainer(params.targetContainer);
	    this.dialog.showTo(params.targetNode);
	  }
	  get dialog() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3;
	    (_babelHelpers$classPr3 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _dialogs)[_dialogs])[_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]]) != null ? _babelHelpers$classPr3 : _babelHelpers$classPr[_babelHelpers$classPr2] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog]();
	    return babelHelpers.classPrivateFieldLooseBase(this, _dialogs)[_dialogs][babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]];
	  }
	}
	function _createDialog2() {
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    multiple: !babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids],
	    enableSearch: true,
	    width: 500,
	    entities: [{
	      id: babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId],
	      options: {
	        withFooter: false
	      }
	    }],
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      onLoad: () => {
	        const titles = this.dialog.getItems().map(item => ({
	          id: babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate] ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : item.getId(),
	          title: item.getTitle().replace(new RegExp(`\\[${item.getId()}\\]$`), '')
	        }));
	        void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Tasks}/setTitles`, titles);
	      }
	    },
	    popupOptions: {
	      events: {
	        onClose: () => {
	          var _babelHelpers$classPr4, _babelHelpers$classPr5;
	          (_babelHelpers$classPr4 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _onClose))[_onClose]) == null ? void 0 : _babelHelpers$classPr4.call(_babelHelpers$classPr5, this.dialog.getSelectedItems());
	          if (this.dialog.isLoaded() && !babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]) {
	            void babelHelpers.classPrivateFieldLooseBase(this, _updateTask)[_updateTask]();
	          }
	        }
	      }
	    },
	    footer: babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate] ? null : babelHelpers.classPrivateFieldLooseBase(this, _createFooter)[_createFooter]()
	  });
	}
	function _createFooter2() {
	  const footer = main_core.Tag.render(_t || (_t = _`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">${0}</span>
		`), babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].footerText);
	  main_core.Event.bind(footer, 'click', babelHelpers.classPrivateFieldLooseBase(this, _clickCreate)[_clickCreate].bind(this));
	  return footer;
	}
	function _clickCreate2() {
	  var _this$dialog$getTagSe, _babelHelpers$classPr6, _babelHelpers$classPr7;
	  tasks_v2_application_taskCard.TaskCard.showCompactCard({
	    title: (_this$dialog$getTagSe = this.dialog.getTagSelector()) == null ? void 0 : _this$dialog$getTagSe.getTextBoxValue(),
	    groupId: babelHelpers.classPrivateFieldLooseBase(this, _task)[_task].groupId,
	    [babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].relationToField]: babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId],
	    analytics: {
	      context: (_babelHelpers$classPr6 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics]) == null ? void 0 : _babelHelpers$classPr7.context) != null ? _babelHelpers$classPr6 : tasks_v2_const.Analytics.Section.Tasks,
	      additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard,
	      element: tasks_v2_const.Analytics.Element.CreateButton
	    }
	  });
	  this.dialog.clearSearch();
	  this.dialog.freeze();
	  const unfreeze = () => {
	    this.dialog.unfreeze();
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.CardClosed, unfreeze);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.FullCardClosed, unfreeze);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]) {
	      this.dialog.hide();
	    }
	  };
	  main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.CardClosed, unfreeze);
	  main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardClosed, unfreeze);
	}
	function _addTaskItems2(ids) {
	  if (!this.dialog || babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate]) {
	    return;
	  }
	  const itemIds = new Set(this.dialog.getItems().map(it => it.getId()));
	  ids.filter(id => !itemIds.has(id)).forEach(id => {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    this.dialog.addItem({
	      id,
	      entityId: tasks_v2_const.EntitySelectorEntity.Task,
	      title: task.title,
	      selected: true,
	      sort: 0,
	      tabs: ['recents']
	    });
	  });
	}
	function _deleteTaskItems2(ids) {
	  if (!this.dialog || babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate]) {
	    return;
	  }
	  ids.forEach(id => this.dialog.removeItem([tasks_v2_const.EntitySelectorEntity.Task, id]));
	}
	async function _updateTask2() {
	  const currentTaskIds = babelHelpers.classPrivateFieldLooseBase(this, _task)[_task][babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField];
	  const newTaskIds = this.dialog.getSelectedItems().map(item => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate] ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : item.getId();
	  });
	  const idsToDelete = currentTaskIds.filter(id => !newTaskIds.includes(id));
	  const idsToAdd = newTaskIds.filter(id => !currentTaskIds.includes(id));
	  if (idsToDelete.length > 0 || idsToAdd.length > 0) {
	    var _babelHelpers$classPr8, _babelHelpers$classPr9;
	    await Promise.all([babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].service.delete(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], idsToDelete), babelHelpers.classPrivateFieldLooseBase(this, _add)[_add](idsToAdd)]);
	    (_babelHelpers$classPr8 = (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _onUpdate))[_onUpdate]) == null ? void 0 : _babelHelpers$classPr8.call(_babelHelpers$classPr9);
	  }
	}
	async function _add2(ids) {
	  const error = await babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].service.add(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], ids);
	  if (error) {
	    void tasks_v2_lib_relationError.relationError.setTaskId(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).showError(error, babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].id);
	  }
	}
	function _get_selectableItems() {
	  const selectableIds = [];
	  const unselectableIds = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _task)[_task][babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField].forEach(id => {
	    const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(id);
	    if (!task || task.rights.detachParent || task.rights.detachRelated) {
	      selectableIds.push(id);
	    } else {
	      unselectableIds.push(id);
	    }
	  });
	  return {
	    selectable: babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds](selectableIds),
	    unselectable: babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds](unselectableIds)
	  };
	}
	function _get_items() {
	  var _ref, _babelHelpers$classPr10, _babelHelpers$classPr11;
	  return babelHelpers.classPrivateFieldLooseBase(this, _mapIdsToItemIds)[_mapIdsToItemIds]((_ref = (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _ids)[_ids]) != null ? _babelHelpers$classPr10 : (_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _task)[_task]) == null ? void 0 : _babelHelpers$classPr11[babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].idsField]) != null ? _ref : []);
	}
	function _mapIdsToItemIds2(ids) {
	  return ids.map(id => [babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId], tasks_v2_lib_idUtils.idUtils.unbox(id)]);
	}
	function _get_entityId() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _isTemplate)[_isTemplate] ? tasks_v2_const.EntitySelectorEntity.Template : tasks_v2_const.EntitySelectorEntity.Task;
	}
	function _get_isTemplate() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _meta)[_meta].isTemplate && tasks_v2_lib_idUtils.idUtils.isTemplate(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]);
	}
	function _get_task() {
	  return tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]);
	}

	const subTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.SubTasks,
	  idsField: 'subTaskIds',
	  relationToField: 'parentId',
	  footerText: main_core.Loc.getMessage('TASKS_V2_SUB_TASKS_CREATE'),
	  service: tasks_v2_provider_service_relationService.subTasksService,
	  isTemplate: true
	});
	const relatedTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.RelatedTasks,
	  idsField: 'relatedTaskIds',
	  relationToField: 'relatedToTaskId',
	  footerText: main_core.Loc.getMessage('TASKS_V2_RELATED_TASKS_CREATE'),
	  service: tasks_v2_provider_service_relationService.relatedTasksService
	});
	const ganttMeta = Object.freeze({
	  footerText: main_core.Loc.getMessage('TASKS_V2_GANTT_CREATE')
	});

	const subTasksDialog = new RelationTasksDialog(subTasksMeta);
	const relatedTasksDialog = new RelationTasksDialog(relatedTasksMeta);
	const ganttDialog = new RelationTasksDialog(ganttMeta);

	exports.Item = tasks_v2_lib_entitySelectorDialog.Item;
	exports.subTasksDialog = subTasksDialog;
	exports.relatedTasksDialog = relatedTasksDialog;
	exports.ganttDialog = ganttDialog;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.Event,BX.Tasks.V2.Application,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=relation-tasks-dialog.bundle.js.map
