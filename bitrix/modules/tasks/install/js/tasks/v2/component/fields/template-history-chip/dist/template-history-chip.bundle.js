/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core_events,ui_system_chip_vue,ui_iconSet_api_vue,ui_vue3_directives_hint,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_idUtils,tasks_v2_component_elements_hint) {
	'use strict';

	// @vue/component
	const TemplateHistoryChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    taskId: {}
	  },
	  props: {
	    isEnabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    templateId() {
	      return tasks_v2_lib_idUtils.idUtils.unbox(this.taskId);
	    },
	    design() {
	      if (!this.isEnabled) {
	        return ui_system_chip_vue.ChipDesign.ShadowDisabled;
	      }
	      return ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    tooltip() {
	      if (this.isEnabled) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_TEMPLATE_HISTORY_CHIP_HINT'),
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2,
	          targetContainer: document.querySelector(`[data-task-card-scroll="${this.taskId}"]`)
	        },
	        timeout: 200
	      });
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.isEnabled) {
	        return;
	      }
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.OpenTemplateHistory, {
	        templateId: this.templateId
	      });
	    }
	  },
	  template: `
		<Chip
			v-hint="tooltip"
			:text="loc('TASKS_V2_TEMPLATE_HISTORY_CHIP_TITLE')"
			:icon="Outline.FILE_WITH_CLOCK"
			:design="design"
			@click="handleClick"
		/>
	`
	};

	exports.TemplateHistoryChip = TemplateHistoryChip;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Event,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX.Vue3.Directives,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=template-history-chip.bundle.js.map
