/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_provider_service_relationService,tasks_v2_core,ui_vue3_directives_hint,tasks_v2_component_elements_hint,tasks_v2_component_fields_relationTasks,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_relationTasksDialog) {
	'use strict';

	const subTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.SubTasks,
	  icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
	  idsField: 'subTaskIds',
	  containsField: 'containsSubTasks',
	  getTitle: isTemplate => {
	    if (isTemplate) {
	      return main_core.Loc.getMessage('TASKS_V2_SUB_TEMPLATES_TITLE');
	    }
	    return main_core.Loc.getMessage('TASKS_V2_SUB_TASKS_TITLE');
	  },
	  getChipTitle: isTemplate => {
	    if (isTemplate) {
	      return main_core.Loc.getMessage('TASKS_V2_SUB_TEMPLATES_TITLE_CHIP');
	    }
	    return main_core.Loc.getMessage('TASKS_V2_SUB_TASKS_TITLE_CHIP');
	  },
	  getCountLoc: isTemplate => {
	    if (isTemplate) {
	      return 'TASKS_V2_SUB_TEMPLATES_TITLE_COUNT';
	    }
	    return 'TASKS_V2_SUB_TASKS_TITLE_COUNT';
	  },
	  getHint: isTemplate => {
	    if (isTemplate) {
	      return main_core.Loc.getMessage('TASKS_V2_SUB_TEMPLATES_ADD');
	    }
	    return main_core.Loc.getMessage('TASKS_V2_SUB_TASKS_ADD');
	  },
	  service: tasks_v2_provider_service_relationService.subTasksService,
	  right: 'createSubtask'
	});

	// @vue/component
	const SubTasks = {
	  name: 'TaskSubTasks',
	  components: {
	    RelationTasks: tasks_v2_component_fields_relationTasks.RelationTasks
	  },
	  inject: {
	    taskId: {},
	    isTemplate: {},
	    analytics: {}
	  },
	  setup() {
	    return {
	      subTasksMeta
	    };
	  },
	  computed: {
	    isLocked() {
	      return this.isTemplate && !tasks_v2_core.Core.getParams().restrictions.templatesSubtasks.available;
	    },
	    featureId() {
	      return tasks_v2_core.Core.getParams().restrictions.templatesSubtasks.featureId;
	    }
	  },
	  methods: {
	    handleAdd(targetNode) {
	      tasks_v2_lib_relationTasksDialog.subTasksDialog.show({
	        targetNode,
	        taskId: this.taskId,
	        analytics: this.analytics
	      });
	    }
	  },
	  template: `
		<RelationTasks 
			:meta="subTasksMeta"
			:isLocked
			:featureId
			@add="handleAdd"
		/>
	`
	};

	// @vue/component
	const SubTasksChip = {
	  components: {
	    RelationTasksChip: tasks_v2_component_fields_relationTasks.RelationTasksChip
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {},
	    isTemplate: {},
	    analytics: {}
	  },
	  setup() {
	    return {
	      subTasksMeta
	    };
	  },
	  computed: {
	    disabled() {
	      return !this.isEdit && !this.isLocked && !this.task.templateId;
	    },
	    isLocked() {
	      return this.isTemplate && !tasks_v2_core.Core.getParams().restrictions.templatesSubtasks.available;
	    },
	    featureId() {
	      return tasks_v2_core.Core.getParams().restrictions.templatesSubtasks.featureId;
	    },
	    tooltip() {
	      if (!this.disabled) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc(this.isTemplate ? 'TASKS_V2_SUB_TEMPLATES_DISABLED_HINT' : 'TASKS_V2_SUB_TASKS_DISABLED_HINT'),
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2,
	          targetContainer: document.querySelector(`[data-task-card-scroll="${this.taskId}"]`)
	        },
	        timeout: 200
	      });
	    }
	  },
	  methods: {
	    handleAdd(targetNode) {
	      tasks_v2_lib_relationTasksDialog.subTasksDialog.show({
	        targetNode,
	        taskId: this.taskId,
	        onClose: this.highlightField,
	        analytics: this.analytics
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(subTasksMeta.id);
	    }
	  },
	  template: `
		<RelationTasksChip 
			v-hint="tooltip" 
			:meta="subTasksMeta" 
			:disabled
			:isLocked
			:featureId
			@add="handleAdd"
		/>
	`
	};

	exports.SubTasks = SubTasks;
	exports.SubTasksChip = SubTasksChip;
	exports.subTasksMeta = subTasksMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service,BX.Tasks.V2,BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=sub-tasks.bundle.js.map
