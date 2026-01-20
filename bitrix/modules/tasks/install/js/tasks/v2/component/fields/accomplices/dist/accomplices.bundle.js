/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_participants,main_core,tasks_v2_const,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_showLimit,tasks_v2_lib_userSelectorDialog,tasks_v2_provider_service_taskService) {
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
	    taskId: {}
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
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
	    },
	    featureId() {
	      return tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId;
	    }
	  },
	  methods: {
	    update(accomplicesIds) {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        accomplicesIds
	      });
	    }
	  },
	  template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
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
	    taskId: {}
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
	        this.highlightField();
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

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX,BX.Tasks.V2.Const,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=accomplices.bundle.js.map
