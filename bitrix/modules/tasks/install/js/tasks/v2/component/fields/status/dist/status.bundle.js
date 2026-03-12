/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_date,ui_vue3_directives_hint,ui_system_menu_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_hint,tasks_v2_lib_timezone,tasks_v2_provider_service_statusService,main_core,tasks_v2_const) {
	'use strict';

	const statusMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Status,
	  title: main_core.Loc.getMessage('TASKS_V2_STATUS_TITLE')
	});

	// @vue/component
	const Status = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_system_menu_vue.BMenu,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    analytics: {}
	  },
	  setup() {
	    return {
	      statusMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    rights() {
	      return this.task.rights;
	    },
	    icon() {
	      var _statuses$this$task$s;
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: ui_iconSet_api_vue.Outline.HOURGLASS,
	        [tasks_v2_const.TaskStatus.InProgress]: ui_iconSet_api_vue.Outline.NEXT,
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: ui_iconSet_api_vue.Outline.REFRESH,
	        [tasks_v2_const.TaskStatus.Completed]: ui_iconSet_api_vue.Outline.SENDED,
	        [tasks_v2_const.TaskStatus.Deferred]: ui_iconSet_api_vue.Outline.PAUSE_L
	      };
	      return (_statuses$this$task$s = statuses[this.task.status]) != null ? _statuses$this$task$s : ui_iconSet_api_vue.Outline.HOURGLASS;
	    },
	    statusFormatted() {
	      var _statuses$this$task$s2;
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: this.loc('TASKS_V2_STATUS_PENDING'),
	        [tasks_v2_const.TaskStatus.InProgress]: this.loc('TASKS_V2_STATUS_IN_PROGRESS'),
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: this.loc('TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED_MSGVER_1'),
	        [tasks_v2_const.TaskStatus.Completed]: this.loc('TASKS_V2_STATUS_COMPLETED_MSGVER_1'),
	        [tasks_v2_const.TaskStatus.Deferred]: this.loc('TASKS_V2_STATUS_DEFERRED')
	      };
	      return (_statuses$this$task$s2 = statuses[this.task.status]) != null ? _statuses$this$task$s2 : this.loc('TASKS_V2_STATUS_PENDING');
	    },
	    statusAtFormatted() {
	      return this.loc('TASKS_V2_STATUS_FROM', {
	        '#DATE#': this.formatDate(this.statusChangedTs),
	        '#TIME#': this.formatTime(this.statusChangedTs)
	      });
	    },
	    statusChangedTs() {
	      return this.task.statusChangedTs || this.task.createdTs;
	    },
	    menuOptions() {
	      return {
	        id: `tasks-status-menu-${this.taskId}`,
	        bindElement: this.$refs.clickable.$el,
	        offsetTop: 8,
	        items: this.menuItems,
	        targetContainer: document.body
	      };
	    },
	    menuItems() {
	      var _statusActionsMap$thi;
	      const statusActionsMap = {
	        [tasks_v2_const.TaskStatus.Pending]: [this.rights.start && this.getStartItem(), this.rights.complete && this.getCompleteItem(), this.rights.defer && this.getDeferItem()].filter(Boolean),
	        [tasks_v2_const.TaskStatus.InProgress]: [this.rights.pause && this.getPauseItem(), this.rights.complete && this.getCompleteItem()].filter(Boolean),
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: [this.rights.renew && this.getRenewItem(), this.rights.complete && this.getCompleteItem()].filter(Boolean),
	        [tasks_v2_const.TaskStatus.Deferred]: [this.rights.renew && this.getResumeItem(), this.rights.complete && this.getCompleteItem()].filter(Boolean),
	        [tasks_v2_const.TaskStatus.Completed]: [this.rights.renew && this.getResumeItem()].filter(Boolean)
	      };
	      return (_statusActionsMap$thi = statusActionsMap[this.task.status]) != null ? _statusActionsMap$thi : [];
	    },
	    hasMenuItems() {
	      return this.menuItems.length > 0;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.statusAtFormatted,
	        popupOptions: {
	          offsetLeft: 40
	        },
	        timeout: 200
	      });
	    },
	    controlTooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_STATUS_NEEDS_CONTROL_HINT'),
	        popupOptions: {
	          offsetLeft: this.$refs.needsControl.offsetWidth / 2
	        },
	        timeout: 200
	      });
	    }
	  },
	  methods: {
	    formatDate(timestamp) {
	      const timezoneTimestamp = (timestamp + tasks_v2_lib_timezone.timezone.getOffset(timestamp)) / 1000;
	      return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), timezoneTimestamp);
	    },
	    formatTime(timestamp) {
	      const timezoneTimestamp = (timestamp + tasks_v2_lib_timezone.timezone.getOffset(timestamp)) / 1000;
	      return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), timezoneTimestamp);
	    },
	    handleClick() {
	      if (!this.hasMenuItems) {
	        return;
	      }
	      this.isMenuShown = true;
	    },
	    getStartItem() {
	      return {
	        title: this.loc('TASKS_V2_STATUS_START_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.NEXT,
	        dataset: {
	          id: 'tasks-status-menu-start'
	        },
	        onClick: () => tasks_v2_provider_service_statusService.statusService.start(this.taskId)
	      };
	    },
	    getPauseItem() {
	      return {
	        title: this.loc('TASKS_V2_STATUS_PAUSE_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.HOURGLASS,
	        dataset: {
	          id: 'tasks-status-menu-pause'
	        },
	        onClick: () => tasks_v2_provider_service_statusService.statusService.pause(this.taskId)
	      };
	    },
	    getCompleteItem() {
	      return {
	        title: this.loc('TASKS_V2_STATUS_COMPLETE_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.CHECK_L,
	        dataset: {
	          id: 'tasks-status-menu-complete'
	        },
	        onClick: () => {
	          var _this$analytics$conte, _this$analytics, _this$analytics$addit, _this$analytics2;
	          void tasks_v2_provider_service_statusService.statusService.complete(this.taskId, {
	            context: (_this$analytics$conte = (_this$analytics = this.analytics) == null ? void 0 : _this$analytics.context) != null ? _this$analytics$conte : tasks_v2_const.Analytics.Section.Tasks,
	            additionalContext: (_this$analytics$addit = (_this$analytics2 = this.analytics) == null ? void 0 : _this$analytics2.additionalContext) != null ? _this$analytics$addit : tasks_v2_const.Analytics.SubSection.TaskCard,
	            element: tasks_v2_const.Analytics.Element.ContextMenu
	          });
	        }
	      };
	    },
	    getDeferItem() {
	      return {
	        title: this.loc('TASKS_V2_STATUS_DEFER_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.PAUSE_L,
	        dataset: {
	          id: 'tasks-status-menu-defer'
	        },
	        onClick: () => tasks_v2_provider_service_statusService.statusService.defer(this.taskId)
	      };
	    },
	    getRenewItem() {
	      if (!this.task.rights.renew) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_STATUS_RENEW_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.UNDO,
	        dataset: {
	          id: 'tasks-status-menu-renew'
	        },
	        onClick: () => tasks_v2_provider_service_statusService.statusService.renew(this.taskId)
	      };
	    },
	    getResumeItem() {
	      return {
	        title: this.loc('TASKS_V2_STATUS_RESUME_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.UNDO,
	        dataset: {
	          id: 'tasks-status-menu-resume'
	        },
	        onClick: () => tasks_v2_provider_service_statusService.statusService.renew(this.taskId)
	      };
	    }
	  },
	  template: `
		<div
			class="tasks-field-status"
			:data-task-id="taskId"
			:data-task-field-id="statusMeta.id"
			:data-task-field-value="task.status"
			:data-task-created-ts="task.createdTs"
			:data-task-status-changes-ts="statusChangedTs"
		>
			<HoverPill
				v-hint="tooltip"
				:active="isMenuShown"
				:readonly="!hasMenuItems"
				@click="handleClick"
				ref="clickable"
			>
				<BIcon class="tasks-field-status-icon" :name="icon"/>
				<div class="tasks-field-status-text">{{ statusFormatted }}</div>
			</HoverPill>
			<div ref="needsControl" class="tasks-field-status-control" v-hint="controlTooltip">
				<BIcon
					v-if="task.needsControl"
					class="tasks-field-status-control-icon"
					:name="Outline.CHECK_DEFERRED"
				/>
			</div>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`
	};

	exports.Status = Status;
	exports.statusMeta = statusMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Main,BX.Vue3.Directives,BX.UI.System.Menu,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=status.bundle.js.map
