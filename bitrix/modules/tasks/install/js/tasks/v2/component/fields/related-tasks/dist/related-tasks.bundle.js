/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_iconSet_api_vue,ui_iconSet_actions,tasks_v2_const,tasks_v2_provider_service_relationService,tasks_v2_component_fields_relationTasks,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_relationTasksDialog) {
	'use strict';

	const relatedTasksMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.RelatedTasks,
	  icon: ui_iconSet_api_vue.Actions.CONNECTION,
	  idsField: 'relatedTaskIds',
	  containsField: 'containsRelatedTasks',
	  getTitle: () => main_core.Loc.getMessage('TASKS_V2_RELATED_TASKS_TITLE'),
	  getChipTitle: () => main_core.Loc.getMessage('TASKS_V2_RELATED_TASKS_TITLE_CHIP'),
	  getCountLoc: () => 'TASKS_V2_RELATED_TASKS_TITLE_COUNT',
	  getHint: () => main_core.Loc.getMessage('TASKS_V2_RELATED_TASKS_ADD'),
	  service: tasks_v2_provider_service_relationService.relatedTasksService,
	  right: 'edit'
	});

	// @vue/component
	const RelatedTasks = {
	  name: 'TaskRelatedTasks',
	  components: {
	    RelationTasks: tasks_v2_component_fields_relationTasks.RelationTasks
	  },
	  inject: {
	    taskId: {},
	    analytics: {}
	  },
	  setup() {
	    return {
	      relatedTasksMeta
	    };
	  },
	  methods: {
	    handleAdd(targetNode) {
	      tasks_v2_lib_relationTasksDialog.relatedTasksDialog.show({
	        targetNode,
	        taskId: this.taskId,
	        analytics: this.analytics
	      });
	    }
	  },
	  template: `
		<RelationTasks :meta="relatedTasksMeta" @add="handleAdd"/>
	`
	};

	// @vue/component
	const RelatedTasksChip = {
	  components: {
	    RelationTasksChip: tasks_v2_component_fields_relationTasks.RelationTasksChip
	  },
	  inject: {
	    taskId: {},
	    analytics: {}
	  },
	  setup() {
	    return {
	      relatedTasksMeta
	    };
	  },
	  methods: {
	    handleAdd(targetNode) {
	      tasks_v2_lib_relationTasksDialog.relatedTasksDialog.show({
	        targetNode,
	        taskId: this.taskId,
	        onClose: this.highlightField,
	        analytics: this.analytics
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(relatedTasksMeta.id);
	    }
	  },
	  template: `
		<RelationTasksChip :meta="relatedTasksMeta" @add="handleAdd"/>
	`
	};

	exports.RelatedTasks = RelatedTasks;
	exports.RelatedTasksChip = RelatedTasksChip;
	exports.relatedTasksMeta = relatedTasksMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=related-tasks.bundle.js.map
