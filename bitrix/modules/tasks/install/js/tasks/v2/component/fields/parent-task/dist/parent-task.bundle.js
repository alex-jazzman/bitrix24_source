/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_directives_hint,ui_system_typography_vue,tasks_v2_component_taskList,tasks_v2_component_elements_hint,main_core,tasks_v2_const,tasks_v2_lib_entitySelectorDialog,tasks_v2_lib_relationError,tasks_v2_provider_service_relationService,tasks_v2_provider_service_taskService,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_idUtils) {
	'use strict';

	const parentTaskMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Parent
	});

	var _taskId, _onUpdate, _dialog, _createDialog, _onItemChange, _items;
	const dialogs = {};
	const parentTaskDialog = new (_taskId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("taskId"), _onUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUpdate"), _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog"), _createDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createDialog"), _onItemChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onItemChange"), _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items"), class {
	  constructor() {
	    Object.defineProperty(this, _items, {
	      get: _get_items,
	      set: void 0
	    });
	    Object.defineProperty(this, _onItemChange, {
	      value: _onItemChange2
	    });
	    Object.defineProperty(this, _createDialog, {
	      value: _createDialog2
	    });
	    Object.defineProperty(this, _dialog, {
	      get: _get_dialog,
	      set: void 0
	    });
	    Object.defineProperty(this, _taskId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onUpdate, {
	      writable: true,
	      value: void 0
	    });
	  }
	  show(params) {
	    babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId] = params.taskId;
	    babelHelpers.classPrivateFieldLooseBase(this, _onUpdate)[_onUpdate] = params.onClose;
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].selectItemsByIds(babelHelpers.classPrivateFieldLooseBase(this, _items)[_items]);
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].showTo(params.targetNode);
	  }
	})();
	function _get_dialog() {
	  var _dialogs$isTemplate;
	  const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]);
	  (_dialogs$isTemplate = dialogs[isTemplate]) != null ? _dialogs$isTemplate : dialogs[isTemplate] = babelHelpers.classPrivateFieldLooseBase(this, _createDialog)[_createDialog](isTemplate);
	  return dialogs[isTemplate];
	}
	function _createDialog2(isTemplate) {
	  const onItemChange = main_core.Runtime.debounce(babelHelpers.classPrivateFieldLooseBase(this, _onItemChange)[_onItemChange], 10, this);
	  return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	    context: 'tasks-card',
	    multiple: false,
	    hideOnDeselect: true,
	    enableSearch: true,
	    width: 500,
	    entities: [{
	      id: tasks_v2_const.EntitySelectorEntity.Task,
	      options: {
	        withTab: true
	      }
	    }, isTemplate && {
	      id: tasks_v2_const.EntitySelectorEntity.Template,
	      options: {
	        withTab: true,
	        withFooter: false
	      }
	    }].filter(it => it),
	    preselectedItems: babelHelpers.classPrivateFieldLooseBase(this, _items)[_items],
	    events: {
	      'Item:onSelect': onItemChange,
	      'Item:onDeselect': onItemChange
	    }
	  });
	}
	async function _onItemChange2() {
	  var _item$getId, _babelHelpers$classPr, _babelHelpers$classPr2;
	  const item = babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getSelectedItems()[0];
	  const isTemplate = (item == null ? void 0 : item.getEntityId()) === tasks_v2_const.EntitySelectorEntity.Template;
	  const selectedTaskId = isTemplate ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : (_item$getId = item == null ? void 0 : item.getId()) != null ? _item$getId : 0;
	  const error = await tasks_v2_provider_service_relationService.subTasksService.setParent(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId], selectedTaskId);
	  if (error) {
	    void tasks_v2_lib_relationError.relationError.setTaskId(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).showError(error, tasks_v2_const.TaskField.Parent);
	    return;
	  }
	  (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _onUpdate))[_onUpdate]) == null ? void 0 : _babelHelpers$classPr.call(_babelHelpers$classPr2);
	}
	function _get_items() {
	  const parentId = tasks_v2_provider_service_taskService.taskService.getStoreTask(babelHelpers.classPrivateFieldLooseBase(this, _taskId)[_taskId]).parentId;
	  const templateId = tasks_v2_lib_idUtils.idUtils.unbox(parentId);
	  const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(parentId);
	  const itemId = isTemplate ? [tasks_v2_const.EntitySelectorEntity.Template, templateId] : [tasks_v2_const.EntitySelectorEntity.Task, parentId];
	  return parentId ? [itemId] : [];
	}

	// @vue/component
	const ParentTask = {
	  name: 'TaskParentTask',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TaskList: tasks_v2_component_taskList.TaskList,
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      parentTaskMeta,
	      subTasksService: tasks_v2_provider_service_relationService.subTasksService
	    };
	  },
	  computed: {
	    parentId() {
	      return this.task.parentId;
	    },
	    hasParent() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.parentId);
	    },
	    title() {
	      if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.parentId)) {
	        return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE');
	      }
	      return this.loc('TASKS_V2_PARENT_TASK_TITLE');
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_PARENT_TASK_SELECT'),
	        popupOptions: {
	          offsetLeft: this.$refs.add.$el.offsetWidth / 2
	        }
	      });
	    }
	  },
	  watch: {
	    parentId: {
	      immediate: true,
	      handler() {
	        if (this.hasParent) {
	          void tasks_v2_provider_service_relationService.subTasksService.getParent(this.taskId, this.parentId);
	        }
	      }
	    }
	  },
	  methods: {
	    handleEditClick() {
	      parentTaskDialog.show({
	        targetNode: this.$refs.add.$el,
	        taskId: this.taskId
	      });
	    },
	    async handleRemoveParentTask() {
	      await tasks_v2_provider_service_relationService.subTasksService.setParent(this.taskId, 0);
	    }
	  },
	  template: `
		<div class="tasks-field-parent-task" :data-task-id="taskId" :data-task-field-id="parentTaskMeta.id">
			<div class="tasks-field-parent-task-title">
				<div class="tasks-field-parent-task-main" :class="{ '--readonly': true }">
					<BIcon :name="Outline.SUBTASK"/>
					<TextMd accent>{{ title }}</TextMd>
				</div>
				<div v-if="task.rights.edit" v-hint="tooltip" class="tasks-field-parent-task-edit-container">
					<BIcon
						class="tasks-field-parent-task-icon"
						:name="Outline.PLUS_L"
						hoverable
						:data-task-relation-add="parentTaskMeta.id"
						ref="add"
						@click="handleEditClick"
					/>
				</div>
			</div>
			<TaskList
				v-if="hasParent"
				:ids="hasParent ? [parentId] : []"
				:loadingIds="!subTasksService.hasStoreTask(parentId) ? [parentId] : []"
				@removeTask="handleRemoveParentTask"
			/>
		</div>
	`
	};

	// @vue/component
	const ParentTaskChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      parentTaskMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    text() {
	      if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId)) {
	        return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE_CHIP');
	      }
	      return this.loc('TASKS_V2_PARENT_TASK_TITLE_CHIP');
	    },
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[parentTaskMeta.id];
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      parentTaskDialog.show({
	        targetNode: this.$el,
	        taskId: this.taskId,
	        onUpdate: this.highlightField
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(parentTaskMeta.id);
	    }
	  },
	  template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:text
			:icon="Outline.SUBTASK"
			:data-task-id="taskId"
			:data-task-chip-id="parentTaskMeta.id"
			ref="chip"
			@click="handleClick"
		/>
	`
	};

	exports.ParentTask = ParentTask;
	exports.ParentTaskChip = ParentTaskChip;
	exports.parentTaskMeta = parentTaskMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Directives,BX.UI.System.Typography.Vue,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Elements,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=parent-task.bundle.js.map
