/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_core,tasks_v2_component_elements_participants,tasks_v2_provider_service_taskService,main_core,tasks_v2_const) {
	'use strict';

	const creatorMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Creator,
	  title: main_core.Loc.getMessage('TASKS_V2_CREATOR_TITLE')
	});

	// @vue/component
	const Creator = {
	  name: 'TaskCreator',
	  components: {
	    Participants: tasks_v2_component_elements_participants.Participants
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  setup() {
	    return {
	      creatorMeta
	    };
	  },
	  computed: {
	    currentUserId() {
	      return tasks_v2_core.Core.getParams().currentUser.id;
	    },
	    hintText() {
	      if (this.task.flowId > 0) {
	        return this.loc('TASKS_V2_CREATOR_CANT_CHANGE_FLOW');
	      }
	      if (this.task.responsibleIds.length > 1) {
	        return this.loc('TASKS_V2_CREATOR_CANT_CHANGE_MANY');
	      }
	      return this.loc('TASKS_V2_CREATOR_CANT_CHANGE');
	    },
	    dataset() {
	      return {
	        'data-task-id': this.taskId,
	        'data-task-field-id': creatorMeta.id,
	        'data-task-field-value': this.task.creatorId
	      };
	    },
	    isAdmin() {
	      return tasks_v2_core.Core.getParams().rights.user.admin;
	    }
	  },
	  methods: {
	    updateTask(userIds) {
	      const creatorId = userIds[0] || this.task.creatorId;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        creatorId
	      });
	    },
	    handleHintClick() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        responsibleIds: [this.currentUserId]
	      });
	    }
	  },
	  template: `
		<Participants
			:taskId
			:context="creatorMeta.id"
			:userIds="[task.creatorId || currentUserId]"
			:canAdd="task.rights.edit"
			:canRemove="task.rights.edit"
			:withHint="!isAdmin && !isEdit && (task.responsibleIds.length > 1 || task.responsibleIds[0] !== currentUserId)"
			:hintText
			single
			inline
			:dataset
			:showMenu="false"
			@hintClick="handleHintClick"
			@update="updateTask"
		/>
	`
	};

	exports.Creator = Creator;
	exports.creatorMeta = creatorMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=creator.bundle.js.map
