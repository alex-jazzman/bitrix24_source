/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_iconSet_api_vue,ui_system_typography_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_component_elements_hoverPill,tasks_v2_provider_service_taskService,tasks_v2_lib_entitySelectorDialog) {
	'use strict';

	const TemplatesButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextSm: ui_system_typography_vue.TextSm,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    task: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
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
	                void tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.task.id, {
	                  templateId
	                });
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
			<HoverPill @click="showDialog">
				<div class="tasks-full-card-templates-button-container">
					<div class="tasks-full-card-templates-button-container-text">{{ loc('TASKS_V2_TEMPLATES') }}</div>
					<BIcon :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-design-plain-na-content)"/>
				</div>
			</HoverPill>
		</div>
	`
	};

	exports.TemplatesButton = TemplatesButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.UI.IconSet,BX.UI.System.Typography.Vue,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib));
//# sourceMappingURL=templates-button.bundle.js.map
