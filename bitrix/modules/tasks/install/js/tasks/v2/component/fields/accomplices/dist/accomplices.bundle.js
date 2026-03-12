/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_participants,tasks_v2_lib_idUtils,tasks_v2_const,main_core,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_analytics,tasks_v2_lib_showLimit,tasks_v2_lib_userSelectorDialog,tasks_v2_provider_service_taskService) {
	'use strict';

	const accomplicesMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Accomplices,
	  title: main_core.Loc.getMessage('TASKS_V2_ACCOMPLICES_TITLE')
	});

	// @vue/component
	const Accomplices = {
	  name: 'TaskAccomplices',
	  components: {
	    Participants: tasks_v2_component_elements_participants.Participants
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    analytics: {},
	    cardType: {}
	  },
	  setup() {
	    return {
	      accomplicesMeta
	    };
	  },
	  computed: {
	    dataset() {
	      return {
	        'data-task-id': this.taskId,
	        'data-task-field-id': accomplicesMeta.id,
	        'data-task-field-value': this.task.accomplicesIds.join(',')
	      };
	    },
	    isEdit() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
	    },
	    featureId() {
	      return tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId;
	    },
	    accomplicesCount() {
	      var _this$task$accomplice, _this$task$accomplice2;
	      return (_this$task$accomplice = (_this$task$accomplice2 = this.task.accomplicesIds) == null ? void 0 : _this$task$accomplice2.length) != null ? _this$task$accomplice : 0;
	    }
	  },
	  methods: {
	    update(accomplicesIds) {
	      const hasChanges = tasks_v2_provider_service_taskService.taskService.hasChanges(this.task, {
	        accomplicesIds
	      }) && accomplicesIds.length > 0 && accomplicesIds.length >= this.accomplicesCount;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        accomplicesIds
	      });
	      if (hasChanges) {
	        var _this$task$auditorsId, _this$task$auditorsId2;
	        tasks_v2_lib_analytics.analytics.sendAddCoexecutor(this.analytics, {
	          cardType: this.cardType,
	          taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
	          viewersCount: (_this$task$auditorsId = (_this$task$auditorsId2 = this.task.auditorsIds) == null ? void 0 : _this$task$auditorsId2.length) != null ? _this$task$auditorsId : 0,
	          coexecutorsCount: accomplicesIds.length
	        });
	      }
	    }
	  },
	  template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			@update="update"
		/>
	`
	};

	// @vue/component
	const AccomplicesChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    analytics: {},
	    cardType: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      accomplicesMeta
	    };
	  },
	  computed: {
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[accomplicesMeta.id];
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId,
	          bindElement: this.$el
	        });
	        return;
	      }
	      void tasks_v2_lib_userSelectorDialog.usersDialog.show({
	        targetNode: this.$el,
	        ids: this.task.accomplicesIds,
	        onClose: this.handleClose
	      });
	    },
	    handleClose(accomplicesIds) {
	      if (!this.isSelected && accomplicesIds.length > 0) {
	        var _this$task$auditorsId, _this$task$auditorsId2;
	        this.highlightField();
	        tasks_v2_lib_analytics.analytics.sendAddCoexecutor(this.analytics, {
	          cardType: this.cardType,
	          taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
	          viewersCount: (_this$task$auditorsId = (_this$task$auditorsId2 = this.task.auditorsIds) == null ? void 0 : _this$task$auditorsId2.length) != null ? _this$task$auditorsId : 0,
	          coexecutorsCount: accomplicesIds.length
	        });
	      }
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        accomplicesIds
	      });
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(accomplicesMeta.id);
	    }
	  },
	  template: `
		<Chip
			v-if="isSelected || task.rights.changeAccomplices"
			:design
			:icon="Outline.PERSON"
			:lock="isLocked"
			:text="loc('TASKS_V2_ACCOMPLICES_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="accomplicesMeta.id"
			:data-task-chip-value="task.accomplicesIds.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Accomplices = Accomplices;
	exports.AccomplicesChip = AccomplicesChip;
	exports.accomplicesMeta = accomplicesMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Const,BX,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=accomplices.bundle.js.map
