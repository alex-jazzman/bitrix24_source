/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue,ui_iconSet_api_core,ui_iconSet_outline,ui_vue3_components_popup,main_date,tasks_v2_const,main_core) {
	'use strict';

	// @vue/component
	const StatusPopupContent = {
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      dateFormat: main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'),
	      timeFormat: main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT')
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    statusFormatted() {
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: 'TASKS_V2_STATUS_PENDING_FROM',
	        [tasks_v2_const.TaskStatus.InProgress]: 'TASKS_V2_STATUS_IN_PROGRESS_FROM',
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: 'TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED_FROM',
	        [tasks_v2_const.TaskStatus.Completed]: 'TASKS_V2_STATUS_COMPLETED_AT',
	        [tasks_v2_const.TaskStatus.Deferred]: 'TASKS_V2_STATUS_DEFERRED_AT'
	      };
	      return this.loc(statuses[this.task.status], {
	        '#DATE#': main_date.DateTimeFormat.format(this.dateFormat, this.task.statusChangedTs / 1000),
	        '#TIME#': main_date.DateTimeFormat.format(this.timeFormat, this.task.statusChangedTs / 1000)
	      });
	    },
	    createdAtFormatted() {
	      return this.loc('TASKS_V2_STATUS_CREATED_AT', {
	        '#DATE#': main_date.DateTimeFormat.format(this.dateFormat, this.task.createdTs / 1000),
	        '#TIME#': main_date.DateTimeFormat.format(this.timeFormat, this.task.createdTs / 1000)
	      });
	    }
	  },
	  template: `
		<div class="tasks-field-status-popup">
			<div>{{ statusFormatted }}</div>
			<div>{{ createdAtFormatted }}</div>
		</div>
	`
	};

	// @vue/component
	const StatusPopup = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    StatusPopupContent
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  computed: {
	    popupId() {
	      return 'tasks-field-status-popup';
	    },
	    popupOptions() {
	      return {
	        bindElement: this.bindElement,
	        minWidth: 200,
	        offsetTop: 10,
	        offsetLeft: this.bindElement.offsetWidth / 2,
	        background: 'var(--ui-color-bg-content-inapp)',
	        padding: 13,
	        angle: true,
	        targetContainer: document.body
	      };
	    }
	  },
	  template: `
		<Popup
			:id="popupId"
			:options="popupOptions"
		>
			<StatusPopupContent :taskId="taskId"/>
		</Popup>
	`
	};

	const statusMeta = Object.freeze({
	  id: 'status',
	  title: main_core.Loc.getMessage('TASKS_V2_STATUS_TITLE')
	});

	// @vue/component
	const Status = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    StatusPopup
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      statusMeta
	    };
	  },
	  data() {
	    return {
	      nowTs: Date.now(),
	      isPopupShown: false
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    isExpired() {
	      return this.task.deadlineTs && this.nowTs > this.task.deadlineTs;
	    },
	    icon() {
	      var _statuses$this$task$s;
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: ui_iconSet_api_core.Outline.HOURGLASS,
	        [tasks_v2_const.TaskStatus.InProgress]: ui_iconSet_api_core.Outline.NEXT,
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: ui_iconSet_api_core.Outline.REFRESH,
	        [tasks_v2_const.TaskStatus.Completed]: ui_iconSet_api_core.Outline.SENDED,
	        [tasks_v2_const.TaskStatus.Deferred]: ui_iconSet_api_core.Outline.PAUSE_L
	      };
	      return (_statuses$this$task$s = statuses[this.task.status]) != null ? _statuses$this$task$s : ui_iconSet_api_core.Outline.HOURGLASS;
	    },
	    statusFormatted() {
	      var _statuses$this$task$s2;
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: this.loc('TASKS_V2_STATUS_PENDING'),
	        [tasks_v2_const.TaskStatus.InProgress]: this.loc('TASKS_V2_STATUS_IN_PROGRESS'),
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: this.loc('TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED'),
	        [tasks_v2_const.TaskStatus.Completed]: this.loc('TASKS_V2_STATUS_COMPLETED'),
	        [tasks_v2_const.TaskStatus.Deferred]: this.loc('TASKS_V2_STATUS_DEFERRED')
	      };
	      return (_statuses$this$task$s2 = statuses[this.task.status]) != null ? _statuses$this$task$s2 : this.loc('TASKS_V2_STATUS_PENDING');
	    }
	  },
	  mounted() {
	    this.nowTsInterval = setInterval(() => {
	      this.nowTs = Date.now();
	    }, 1000);
	  },
	  beforeUnmount() {
	    clearInterval(this.nowTsInterval);
	  },
	  methods: {
	    handleClick() {
	      this.clearTimeouts();
	      if (this.isPopupShown) {
	        this.closePopup();
	      } else {
	        this.showPopup();
	      }
	    },
	    handleMouseEnter() {
	      this.clearTimeouts();
	      this.showTimeout = setTimeout(() => this.showPopup(), 100);
	    },
	    handleMouseLeave() {
	      this.clearTimeouts();
	      this.closePopup();
	    },
	    showPopup() {
	      this.clearTimeouts();
	      this.isPopupShown = true;
	    },
	    closePopup() {
	      this.clearTimeouts();
	      this.isPopupShown = false;
	    },
	    clearTimeouts() {
	      clearTimeout(this.showTimeout);
	    }
	  },
	  template: `
		<div
			class="tasks-field-status"
			:data-task-id="taskId"
			:data-task-field-id="statusMeta.id"
			:data-task-field-value="task.status"
			:data-task-created-ts="task.createdTs"
			:data-task-status-changes-ts="task.statusChangedTs"
			ref="container"
			@click="handleClick"
			@mouseenter="handleMouseEnter"
			@mouseleave="handleMouseLeave"
		>
			<BIcon class="tasks-field-status-icon" :name="icon"/>
			<div class="tasks-field-status-text">{{ statusFormatted }}</div>
		</div>
		<StatusPopup
			v-if="isPopupShown"
			:taskId="taskId"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`
	};

	exports.Status = Status;
	exports.statusMeta = statusMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.IconSet,BX.UI.IconSet,BX,BX.UI.Vue3.Components,BX.Main,BX.Tasks.V2.Const,BX));
//# sourceMappingURL=status.bundle.js.map
