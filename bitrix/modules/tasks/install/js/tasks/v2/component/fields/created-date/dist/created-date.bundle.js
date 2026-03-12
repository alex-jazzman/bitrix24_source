/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_notificationManager,ui_system_typography_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_elements_hoverPill,tasks_v2_lib_calendar,main_core,tasks_v2_const) {
	'use strict';

	const createdDateMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.CreatedDate,
	  title: main_core.Loc.getMessage('TASKS_V2_CREATED_DATE_TITLE')
	});

	// @vue/component
	const CreatedDate = {
	  name: 'TasksCreatedDate',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    task: {}
	  },
	  setup() {
	    return {
	      createdDateMeta,
	      Outline: ui_iconSet_api_vue.Outline,
	      resizeObserver: null
	    };
	  },
	  computed: {
	    createdDateFormatted() {
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.task.createdTs);
	    },
	    idFormatted() {
	      return this.loc('TASKS_V2_CREATED_DATE_TASK_ID', {
	        '#TASK_ID#': this.task.id
	      });
	    }
	  },
	  created() {
	    this.resizeObserver = new ResizeObserver(entries => {
	      for (const entry of entries) {
	        if (entry.target === this.$el) {
	          this.updateHeight();
	        }
	      }
	    });
	  },
	  mounted() {
	    var _this$resizeObserver;
	    this.updateHeight();
	    (_this$resizeObserver = this.resizeObserver) == null ? void 0 : _this$resizeObserver.observe(this.$el);
	  },
	  beforeUnmount() {
	    var _this$resizeObserver2;
	    (_this$resizeObserver2 = this.resizeObserver) == null ? void 0 : _this$resizeObserver2.disconnect();
	  },
	  methods: {
	    updateHeight() {
	      main_core.Dom.toggleClass(this.$el, '--wrapped', this.$el.offsetHeight > 30);
	    },
	    copyTaskId() {
	      const isCopyingSuccess = BX.clipboard.copy(this.task.id);
	      if (isCopyingSuccess) {
	        ui_notificationManager.Notifier.notifyViaBrowserProvider({
	          id: 'task-notify-copy',
	          text: this.loc('TASKS_V2_CREATED_DATE_COPY_TASK_ID_NOTIF')
	        });
	      }
	    }
	  },
	  template: `
		<div
			class="tasks-field-created-date"
			:data-task-field-id="createdDateMeta.id"
			:data-task-field-value="task.createdTs"
		>
			<BIcon class="tasks-field-created-date-icon" :name="Outline.CALENDAR_SHARE"/>
			<TextMd class="tasks-field-created-date-text">{{ createdDateFormatted }}</TextMd>
			<div class="tasks-field-created-date-separator print-font-color-base-1"> / </div>
			<div class="tasks-field-created-date-id-container" @click="copyTaskId">
				<TextMd class="tasks-field-created-date-id-text print-font-color-base-1">{{ idFormatted }}</TextMd>
				<BIcon class="tasks-field-created-date-copy-id-icon print-ignore" :name="Outline.COPY"/>
			</div>
		</div>
	`
	};

	exports.CreatedDate = CreatedDate;
	exports.createdDateMeta = createdDateMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.NotificationManager,BX.UI.System.Typography.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=created-date.bundle.js.map
