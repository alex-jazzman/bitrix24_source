/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_system_typography_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_elements_hoverPill,tasks_v2_component_tasksButtonCopy,tasks_v2_lib_calendar,main_core,tasks_v2_const) {
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
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    TasksButtonCopy: tasks_v2_component_tasksButtonCopy.TasksButtonCopy
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
	    idTaskFormatted() {
	      var _this$task;
	      const idTaskNew = (_this$task = this.task) == null ? void 0 : _this$task.id;
	      return String(idTaskNew || idTaskNew === 0 ? idTaskNew : '');
	    },
	    createdDateFormatted() {
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.task.createdTs);
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
			<TextMd class="tasks-field-created-date-separator print-font-color-base-1">/</TextMd>
			<TasksButtonCopy
				:name="loc('TASKS_V2_CREATED_DATE_TASK_ID')"
				:value="idTaskFormatted"
				:notification="loc('TASKS_V2_CREATED_DATE_COPY_TASK_ID_NOTIF')"
			/>
		</div>
	`
	};

	exports.CreatedDate = CreatedDate;
	exports.createdDateMeta = createdDateMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.System.Typography.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component,BX.Tasks.V2.Lib,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=created-date.bundle.js.map
