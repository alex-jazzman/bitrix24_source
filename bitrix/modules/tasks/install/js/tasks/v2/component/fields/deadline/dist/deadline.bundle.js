/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_lib_heightTransition,ui_vue3_components_popup,tasks_v2_provider_service_taskService,main_date,ui_datePicker,ui_iconSet_api_vue,ui_iconSet_api_core,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_timezone,tasks_v2_lib_analytics,main_core) {
	'use strict';

	const calendarSettings = main_core.Extension.getSettings('tasks.v2.component.fields.deadline').calendarSettings;
	const addZero = unit => `0${unit}`.slice(-2);
	const defaultTime = `${addZero(calendarSettings.HOURS.END.H)}:${addZero(calendarSettings.HOURS.END.M)}`;

	// @vue/component
	const DeadlinePopupContent = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  inject: ['analytics', 'cardType'],
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['update', 'close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      today: new Date(),
	      /** @type DatePicker */
	      datePicker: null,
	      dateTs: null,
	      hour: null
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    presets() {
	      const [year, month, date] = [this.today.getFullYear(), this.today.getMonth(), this.today.getDate()];
	      const format = main_date.DateTimeFormat.getFormat('DAY_OF_WEEK_MONTH_FORMAT');
	      return [{
	        id: `today-${this.taskId}`,
	        title: this.loc('TASKS_V2_DEADLINE_TODAY'),
	        date: new Date(year, month, date)
	      }, {
	        id: `tomorrow-${this.taskId}`,
	        title: this.loc('TASKS_V2_DEADLINE_TOMORROW'),
	        date: new Date(year, month, date + 1)
	      }, {
	        id: `end-week-${this.taskId}`,
	        title: this.loc('TASKS_V2_DEADLINE_IN_THE_END_OF_THE_WEEK'),
	        date: new Date(year, month, date - this.today.getDay() + 5)
	      }, {
	        id: `in-week-${this.taskId}`,
	        title: this.loc('TASKS_V2_DEADLINE_IN_A_WEEK'),
	        date: new Date(year, month, date + 7)
	      }, {
	        id: `month-${this.taskId}`,
	        title: this.loc('TASKS_V2_DEADLINE_IN_THE_END_OF_THE_MONTH'),
	        date: new Date(year, month + 1, 0)
	      }].map(preset => ({
	        id: preset.id,
	        title: preset.title,
	        timestamp: preset.date.getTime(),
	        formatted: main_date.DateTimeFormat.format(format, preset.date)
	      }));
	    }
	  },
	  created() {
	    this.datePicker = this.createDatePicker();
	    const date = new Date(this.task.deadlineTs + tasks_v2_lib_timezone.timezone.getOffset(this.task.deadlineTs));
	    this.dateTs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	    this.hour = date.getHours();
	  },
	  mounted() {
	    this.datePicker.setTargetNode(this.$refs.picker);
	    this.datePicker.show();
	  },
	  beforeUnmount() {
	    this.datePicker.destroy();
	  },
	  methods: {
	    createDatePicker() {
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(this.task.deadlineTs);
	      const picker = new ui_datePicker.DatePicker({
	        selectedDates: this.task.deadlineTs ? [this.task.deadlineTs + offset] : null,
	        defaultTime,
	        inline: true,
	        enableTime: true,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            const selectedDate = this.createDateFromUtc(date);
	            const dateTs = selectedDate.getTime();
	            this.$emit('update', dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs));
	          }
	        }
	      });
	      picker.getPicker('day').subscribe('onSelect', event => {
	        const {
	          year,
	          month,
	          day
	        } = event.getData();
	        const dateTs = new Date(year, month, day).getTime();
	        this.close();
	        this.sendAnalytics(tasks_v2_const.Analytics.Element.Calendar);
	        this.dateTs = dateTs;
	      });
	      picker.getPicker('time').subscribe('onSelect', event => {
	        const {
	          hour,
	          minute
	        } = event.getData();
	        if (main_core.Type.isNumber(minute) || hour === this.hour) {
	          this.close();
	        }
	        this.sendAnalytics(tasks_v2_const.Analytics.Element.Calendar);
	        this.hour = hour;
	      });
	      return picker;
	    },
	    createDateFromUtc(date) {
	      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
	    },
	    focusDate(timestamp) {
	      this.datePicker.setFocusDate(timestamp);
	    },
	    selectPresetDate(timestamp) {
	      const date = new Date(timestamp);
	      const [y, m, d] = [date.getFullYear(), date.getMonth(), date.getDate()];
	      this.datePicker.selectDate(new Date(`${m + 1}/${d}/${y} ${defaultTime}`));
	      this.sendAnalytics(tasks_v2_const.Analytics.Element.DeadlinePreset);
	      this.close();
	    },
	    close() {
	      this.$emit('close');
	    },
	    sendAnalytics(element) {
	      tasks_v2_lib_analytics.analytics.sendDeadlineSet(this.analytics, {
	        cardType: this.cardType,
	        element
	      });
	    }
	  },
	  template: `
		<div class="tasks-field-deadline-popup">
			<div class="tasks-field-deadline-presets">
				<template v-for="(preset, index) of presets" :key="index">
					<div
						:data-task-preset-id="preset.id"
						class="tasks-field-deadline-preset"
						@click="selectPresetDate(preset.timestamp)"
						@mouseenter="focusDate(preset.timestamp)"
						@mouseleave="focusDate(null)"
					>
						<div class="tasks-field-deadline-preset-title">{{ preset.title }}</div>
						<div class="tasks-field-deadline-preset-date">{{ preset.formatted }}</div>
					</div>
				</template>
			</div>
			<div class="tasks-field-deadline-picker-container">
				<div class="tasks-field-deadline-picker" ref="picker">
					<BIcon v-if="false" class="tasks-field-deadline-picker-settings" :name="Outline.FILTER_2_LINES"/>
				</div>
			</div>
			<div v-if="false" class="tasks-field-deadline-settings">
			</div>
		</div>
	`
	};

	// @vue/component
	const DeadlinePopup = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    DeadlinePopupContent
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
	  emits: ['update', 'close'],
	  computed: {
	    popupOptions() {
	      return {
	        id: `tasks-field-deadline-popup-${this.taskId}`,
	        bindElement: this.bindElement,
	        padding: 24,
	        offsetTop: 5,
	        offsetLeft: -100,
	        targetContainer: document.body
	      };
	    }
	  },
	  methods: {
	    clear() {
	      this.deadlineTs = null;
	    },
	    handleUpdate(dateTs) {
	      this.deadlineTs = dateTs;
	      this.$emit('update', dateTs);
	    },
	    handleClose() {
	      if (this.deadlineTs) {
	        void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          deadlineTs: this.deadlineTs
	        });
	      }
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup
			:options="popupOptions"
			@close="handleClose"
		>
			<DeadlinePopupContent :taskId="taskId" @update="handleUpdate" @close="handleClose"/>
		</Popup>
	`
	};

	const deadlineMeta = Object.freeze({
	  id: 'deadlineTs',
	  title: main_core.Loc.getMessage('TASKS_V2_DEADLINE_TITLE')
	});

	// @vue/component
	const Deadline = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    DeadlinePopup
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      deadlineMeta,
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      nowTs: Date.now(),
	      isPopupShown: false,
	      selectingDeadlineTs: null
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    deadlineTs() {
	      var _this$selectingDeadli;
	      return (_this$selectingDeadli = this.selectingDeadlineTs) != null ? _this$selectingDeadli : this.task.deadlineTs;
	    },
	    expiredDuration() {
	      if (!this.deadlineTs) {
	        return 0;
	      }
	      return this.nowTs - this.deadlineTs;
	    },
	    isExpired() {
	      return this.expiredDuration > 0 && !this.isFlowFilledOnAdd;
	    },
	    expiredFormatted() {
	      return this.loc('TASKS_V2_DEADLINE_EXPIRED', {
	        '#EXPIRED_DURATION#': new main_date.DurationFormat(this.expiredDuration).formatClosest()
	      });
	    },
	    deadlineFormatted() {
	      if (this.isFlowFilledOnAdd) {
	        return this.loc('TASKS_V2_DEADLINE_AUTO');
	      }
	      if (!this.deadlineTs) {
	        return this.loc('TASKS_V2_DEADLINE_EMPTY');
	      }
	      const isThisYear = new Date(this.deadlineTs).getFullYear() === new Date().getFullYear();
	      const dateFormat = main_date.DateTimeFormat.getFormat(isThisYear ? 'DAY_MONTH_FORMAT' : 'LONG_DATE_FORMAT');
	      const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(this.deadlineTs);
	      return main_date.DateTimeFormat.format(`${dateFormat} ${timeFormat}`, (this.deadlineTs + offset) / 1000);
	    },
	    iconName() {
	      if (this.isFlowFilledOnAdd) {
	        return ui_iconSet_api_core.Outline.BOTTLENECK;
	      }
	      return ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS;
	    },
	    isEdit() {
	      return Number.isInteger(this.taskId) && this.taskId > 0;
	    },
	    isFlowFilledOnAdd() {
	      return this.task.flowId > 0 && !this.isEdit;
	    },
	    readonly() {
	      return !this.task.rights.deadline || this.isFlowFilledOnAdd;
	    }
	  },
	  mounted() {
	    tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
	    this.nowTsInterval = setInterval(() => {
	      this.nowTs = Date.now();
	    }, 1000);
	  },
	  updated() {
	    tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
	  },
	  beforeUnmount() {
	    clearInterval(this.nowTsInterval);
	  },
	  methods: {
	    handleClick() {
	      if (this.readonly) {
	        return;
	      }
	      this.isPopupShown = true;
	    },
	    handleCrossClick(event) {
	      var _this$$refs$popup;
	      event.stopPropagation();
	      (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.clear();
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        deadlineTs: 0
	      });
	    },
	    handleUpdate(selectingDeadlineTs) {
	      this.selectingDeadlineTs = selectingDeadlineTs;
	    },
	    handleClose() {
	      var _this$$refs$deadline;
	      this.isPopupShown = false;
	      this.selectingDeadlineTs = null;
	      (_this$$refs$deadline = this.$refs.deadline) == null ? void 0 : _this$$refs$deadline.focus();
	    },
	    handleKeydown(event) {
	      if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey)) {
	        void this.handleClick();
	      }
	    }
	  },
	  template: `
		<div
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			ref="container"
		>
			<div
				class="tasks-field-deadline-main"
				:class="{ '--readonly': readonly }"
				ref="deadline"
				tabindex="0"
				@click="handleClick"
				@keydown="handleKeydown"
			>
				<BIcon class="tasks-field-deadline-icon" :name="iconName"/>
				<div class="tasks-field-deadline-text">{{ deadlineFormatted }}</div>
				<BIcon
					v-if="deadlineTs && !readonly"
					class="tasks-field-deadline-cross"
					:name="Outline.CROSS_L"
					@click.capture="handleCrossClick"
				/>
			</div>
			<div v-if="isExpired" class="tasks-field-deadline-expired">{{ expiredFormatted }}</div>
		</div>
		<DeadlinePopup
			v-if="isPopupShown"
			:taskId="taskId"
			:bindElement="$refs.deadline"
			ref="popup"
			@update="handleUpdate"
			@close="handleClose"
		/>
	`
	};

	exports.Deadline = Deadline;
	exports.deadlineMeta = deadlineMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Lib,BX.UI.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.Main,BX.UI.DatePicker,BX.UI.IconSet,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX));
//# sourceMappingURL=deadline.bundle.js.map
