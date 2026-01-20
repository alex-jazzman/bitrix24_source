/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_directives_hint,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_provider_service_taskService,tasks_v2_component_elements_hint) {
	'use strict';

	// @vue/component
	const Importance = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
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
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    tooltip() {
	      const phraseCode = this.task.isImportant ? 'TASKS_V2_IMPORTANCE_ACTIVE_HINT' : 'TASKS_V2_IMPORTANCE_INACTIVE_HINT';
	      return () => tasks_v2_component_elements_hint.tooltip({
	        html: this.loc(phraseCode, {
	          '[br/]': '<br/>'
	        }),
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2
	        },
	        timeout: 500
	      });
	    },
	    isResponsible() {
	      const userId = tasks_v2_core.Core.getParams().currentUser.id;
	      return this.task.responsibleIds.includes(userId) || this.task.accomplicesIds.includes(userId);
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.readonly) {
	        return;
	      }
	      const isImportant = !this.task.isImportant;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        isImportant
	      });
	    }
	  },
	  template: `
		<div
			v-if="!readonly || (isResponsible && task.isImportant)"
			v-hint="tooltip"
			class="tasks-field-importance"
			:class="{ '--active': task.isImportant, '--readonly': readonly }"
			:data-task-id="taskId"
			:data-task-field-id="'isImportant'"
			:data-task-field-value="task.isImportant"
			@click="handleClick"
		>
			<BIcon :name="task.isImportant ? Outline.FIRE_SOLID : Outline.FIRE"/>
		</div>
	`
	};

	exports.Importance = Importance;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Vue3.Directives,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=importance.bundle.js.map
