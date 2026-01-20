/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_components_button,tasks_v2_const,tasks_v2_lib_entitySelectorDialog) {
	'use strict';

	const TemplatesButton = {
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: {
	    task: {}
	  },
	  setup() {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle
	    };
	  },
	  emits: ['template'],
	  beforeUnmount() {
	    var _this$dialog;
	    (_this$dialog = this.dialog) == null ? void 0 : _this$dialog.destroy();
	  },
	  methods: {
	    showDialog() {
	      var _this$dialog2;
	      (_this$dialog2 = this.dialog) != null ? _this$dialog2 : this.dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	        context: 'tasks-card',
	        multiple: false,
	        enableSearch: true,
	        entities: [{
	          id: tasks_v2_const.EntitySelectorEntity.Template,
	          options: {
	            withFooter: false
	          }
	        }],
	        preselectedItems: this.task.templateId ? [[tasks_v2_const.EntitySelectorEntity.Template, this.task.templateId]] : [],
	        popupOptions: {
	          events: {
	            onClose: () => {
	              var _this$dialog$getSelec;
	              const templateId = (_this$dialog$getSelec = this.dialog.getSelectedItems()[0]) == null ? void 0 : _this$dialog$getSelec.getId();
	              if (templateId > 0) {
	                this.$emit('template', templateId);
	              }
	            }
	          }
	        }
	      });
	      this.dialog.showTo(this.$refs.button);
	    }
	  },
	  template: `
		<div ref="button">
			<UiButton
				:text="loc('TASKS_V2_TEMPLATES')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				dropdown
				@click="showDialog"
			/>
		</div>
	`
	};

	exports.TemplatesButton = TemplatesButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.Vue3.Components,BX.Tasks.V2.Const,BX.Tasks.V2.Lib));
//# sourceMappingURL=templates-button.bundle.js.map
