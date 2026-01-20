/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_system_menu,ui_iconSet_api_vue,ui_system_menu_vue,tasks_v2_core,tasks_v2_provider_service_taskService,tasks_v2_const,tasks_v2_component_elements_hoverPill,tasks_v2_lib_showLimit) {
	'use strict';

	const sectionMark = 'sectionMark';

	// @vue/component
	const MarkTaskButton = {
	  name: 'MarkTaskButton',
	  components: {
	    BMenu: ui_system_menu_vue.BMenu,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    task: {}
	  },
	  setup() {},
	  data() {
	    return {
	      isMenuShown: false,
	      activeMenuItemId: this.task.mark
	    };
	  },
	  computed: {
	    isAllowed() {
	      return this.task.rights.mark;
	    },
	    menuOptions() {
	      return () => ({
	        id: 'tasks-full-card-mark-task-menu',
	        bindElement: this.$refs.container,
	        sections: this.menuSections,
	        items: this.menuItems
	      });
	    },
	    menuSections() {
	      return [{
	        code: sectionMark,
	        title: this.loc('TASKS_V2_MARK_TASK_MARK_SECTION_TITLE')
	      }];
	    },
	    menuItems() {
	      return [this.getNoMarkItem(), this.getPositiveMarkItem(), this.getNegativeMarkItem()];
	    },
	    formattedText() {
	      if (this.activeMenuItemId === tasks_v2_const.Mark.None || this.isLocked) {
	        return this.loc('TASKS_V2_MARK_TASK_BUTTON_NONE');
	      }
	      return this.loc('TASKS_V2_MARK_TASK_BUTTON_SET');
	    },
	    formattedIcon() {
	      if (this.isLocked) {
	        return ui_iconSet_api_vue.Outline.LOCK_M;
	      }
	      if (this.activeMenuItemId === tasks_v2_const.Mark.Positive) {
	        return ui_iconSet_api_vue.Outline.LIKE;
	      }
	      if (this.activeMenuItemId === tasks_v2_const.Mark.Negative) {
	        return ui_iconSet_api_vue.Outline.DISLIKE;
	      }
	      return null;
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.mark.available;
	    }
	  },
	  watch: {
	    'task.mark': {
	      handler: 'updateMark'
	    }
	  },
	  methods: {
	    getNoMarkItem() {
	      return {
	        id: tasks_v2_const.Mark.None,
	        title: this.loc('TASKS_V2_MARK_TASK_MARK_NONE'),
	        icon: ui_iconSet_api_vue.Outline.TEXT_FORMAT_CANCEL,
	        ...this.getMenuItemOptions(tasks_v2_const.Mark.None)
	      };
	    },
	    getPositiveMarkItem() {
	      return {
	        id: tasks_v2_const.Mark.Positive,
	        title: this.loc('TASKS_V2_MARK_TASK_MARK_POSITIVE'),
	        icon: ui_iconSet_api_vue.Outline.LIKE,
	        ...this.getMenuItemOptions(tasks_v2_const.Mark.Positive)
	      };
	    },
	    getNegativeMarkItem() {
	      return {
	        id: tasks_v2_const.Mark.Negative,
	        title: this.loc('TASKS_V2_MARK_TASK_MARK_NEGATIVE'),
	        icon: ui_iconSet_api_vue.Outline.DISLIKE,
	        ...this.getMenuItemOptions(tasks_v2_const.Mark.Negative)
	      };
	    },
	    isSelected(menuItemId) {
	      return menuItemId === this.activeMenuItemId;
	    },
	    getMenuItemOptions(menuItemId) {
	      const commonOptions = {
	        onClick: async () => {
	          if (this.activeMenuItemId === menuItemId) {
	            return;
	          }
	          this.activeMenuItemId = menuItemId;
	          void tasks_v2_provider_service_taskService.taskService.setMark(this.task.id, menuItemId);
	        },
	        sectionCode: sectionMark
	      };
	      if (menuItemId === this.activeMenuItemId) {
	        return {
	          ...commonOptions,
	          isSelected: true,
	          design: ui_system_menu.MenuItemDesign.Accent1
	        };
	      }
	      return {
	        ...commonOptions,
	        isSelected: false,
	        design: ui_system_menu.MenuItemDesign.Default
	      };
	    },
	    handleClick() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.mark.featureId
	        });
	        return;
	      }
	      if (!this.isAllowed) {
	        return;
	      }
	      this.isMenuShown = true;
	    },
	    updateMark() {
	      this.activeMenuItemId = this.task.mark;
	    }
	  },
	  template: `
		<div
			class="tasks-full-card-mark-task-button-container"
			ref="container"
		>
			<HoverPill
				:readonly="!isAllowed"
				@click="handleClick"
			>
				<div class="tasks-full-card-mark-task-mark-container">
					<div class="tasks-full-card-mark-task-mark-text">{{ formattedText }}</div>
					<BIcon
						v-if="formattedIcon"
						class="tasks-full-card-mark-task-mark-icon"
						:name="formattedIcon"
					/>
				</div>
			</HoverPill>
		</div>
		<BMenu
			v-if="isMenuShown"
			@close="isMenuShown = false"
			:options="menuOptions()"
		/>
	`
	};

	exports.MarkTaskButton = MarkTaskButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.UI.System,BX.UI.IconSet,BX.UI.System.Menu,BX.Tasks.V2,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib));
//# sourceMappingURL=mark-task-button.bundle.js.map
