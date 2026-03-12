/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core_events,ui_notificationManager,ui_vue3_directives_hint,tasks_v2_component_taskSettingsPopup,tasks_v2_component_elements_settingsLabel,tasks_v2_component_elements_hoverPill,tasks_v2_lib_heightTransition,tasks_v2_provider_service_deadlineService,ui_vue3_vuex,ui_datePicker,tasks_v2_core,tasks_v2_lib_idUtils,tasks_v2_lib_timezone,tasks_v2_lib_analytics,tasks_v2_component_elements_hint,ui_iconSet_api_vue,ui_system_input_vue,ui_iconSet_outline,ui_vue3_components_button,ui_forms,ui_vue3_components_popup,main_date,ui_system_typography_vue,ui_system_chip_vue,tasks_v2_component_elements_questionMark,tasks_v2_component_elements_duration,tasks_v2_lib_calendar,tasks_v2_provider_service_taskService,main_core,tasks_v2_const) {
	'use strict';

	// @vue/component
	const DeadlinePopupContent = {
	  components: {
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  inject: {
	    analytics: {},
	    cardType: {}
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['update', 'close'],
	  setup() {
	    return {
	      today: new Date(),
	      /** @type DatePicker */
	      datePicker: null,
	      dateTs: null,
	      hour: null
	    };
	  },
	  data() {
	    return {
	      isLimitHintShown: false,
	      hintBindElement: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    isEdit() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
	    },
	    isCreator() {
	      return this.currentUserId === this.task.creatorId;
	    },
	    isAdmin() {
	      return tasks_v2_core.Core.getParams().rights.user.admin;
	    },
	    canChangeDeadlineWithoutLimitation() {
	      return !this.isEdit || this.isCreator || this.task.rights.edit || this.isAdmin;
	    },
	    maxDeadlineDate() {
	      if (this.canChangeDeadlineWithoutLimitation || !this.task.maxDeadlineChangeDate) {
	        return null;
	      }
	      const dateFormat = main_date.DateTimeFormat.getFormat('FORMAT_DATETIME');
	      return ui_datePicker.createDate(this.task.maxDeadlineChangeDate, dateFormat);
	    },
	    presets() {
	      const [year, month, date] = [this.today.getFullYear(), this.today.getMonth(), this.today.getDate()];
	      const format = main_date.DateTimeFormat.getFormat('DAY_OF_WEEK_MONTH_FORMAT');
	      const allPresets = [{
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
	      }];
	      return allPresets.map(preset => {
	        let disabled = false;
	        if (this.maxDeadlineDate) {
	          const presetUtcDate = ui_datePicker.createUtcDate(preset.date.getFullYear(), preset.date.getMonth(), preset.date.getDate());
	          const maxUtcDate = ui_datePicker.createUtcDate(this.maxDeadlineDate.getUTCFullYear(), this.maxDeadlineDate.getUTCMonth(), this.maxDeadlineDate.getUTCDate());
	          disabled = presetUtcDate > maxUtcDate;
	        }
	        return {
	          id: preset.id,
	          title: preset.title,
	          timestamp: preset.date.getTime(),
	          formatted: main_date.DateTimeFormat.format(format, preset.date),
	          disabled
	        };
	      });
	    },
	    limitHintText() {
	      if (!this.maxDeadlineDate) {
	        return '';
	      }
	      const format = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
	      const date = main_date.DateTimeFormat.format(format, this.maxDeadlineDate.getTime() / 1000);
	      return this.loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_DATE_HINT', {
	        '#DATE#': date
	      });
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
	      const dayColors = [];
	      if (this.maxDeadlineDate) {
	        dayColors.push({
	          matcher: date => {
	            const compareDate = ui_datePicker.createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	            return compareDate > this.maxDeadlineDate;
	          },
	          textColor: '#DFE0E3'
	        });
	      }
	      const picker = new ui_datePicker.DatePicker({
	        selectedDates: this.task.deadlineTs ? [this.task.deadlineTs + offset] : null,
	        defaultTime: tasks_v2_lib_calendar.calendar.dayEndTime,
	        inline: true,
	        enableTime: true,
	        dayColors,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            const dateTs = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
	            this.$emit('update', dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs));
	          },
	          [ui_datePicker.DatePickerEvent.BEFORE_SELECT]: event => {
	            if (!this.maxDeadlineDate) {
	              return;
	            }
	            const {
	              date
	            } = event.getData();
	            const selectedDate = ui_datePicker.createUtcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	            if (selectedDate > this.maxDeadlineDate) {
	              event.preventDefault();
	            }
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
	      picker.getPicker('day').subscribe('onFocus', this.handleDayFocus);
	      picker.getPicker('time').subscribe('onSelect', event => {
	        const {
	          hour,
	          minute
	        } = event.getData();
	        if (Number.isInteger(minute) || hour === this.hour) {
	          this.close();
	        }
	        this.hour = hour;
	      });
	      return picker;
	    },
	    async focusDate(timestamp, disabled = false, event = null) {
	      if (this.maxDeadlineDate) {
	        this.isLimitHintShown = false;
	        this.hintBindElement = null;
	        await this.$nextTick();
	        if (disabled && event) {
	          const presetElement = event.currentTarget;
	          if (presetElement && timestamp) {
	            this.hintBindElement = presetElement;
	            this.isLimitHintShown = true;
	          }
	          return;
	        }
	      }
	      this.datePicker.setFocusDate(timestamp);
	    },
	    selectPresetDate(timestamp, disabled = false) {
	      if (disabled) {
	        return;
	      }
	      const date = new Date(timestamp);
	      const [year, mount, day] = [date.getFullYear(), date.getMonth(), date.getDate()];
	      this.datePicker.selectDate(new Date(`${mount + 1}/${day}/${year} ${tasks_v2_lib_calendar.calendar.dayEndTime}`));
	      this.sendAnalytics(tasks_v2_const.Analytics.Element.DeadlinePreset);
	      this.close();
	    },
	    close() {
	      this.$emit('close');
	    },
	    sendAnalytics(element) {
	      var _this$task$auditorsId, _this$task$auditorsId2, _this$task$accomplice, _this$task$accomplice2;
	      tasks_v2_lib_analytics.analytics.sendDeadlineSet(this.analytics, {
	        element,
	        cardType: this.cardType,
	        taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
	        viewersCount: (_this$task$auditorsId = (_this$task$auditorsId2 = this.task.auditorsIds) == null ? void 0 : _this$task$auditorsId2.length) != null ? _this$task$auditorsId : 0,
	        coexecutorsCount: (_this$task$accomplice = (_this$task$accomplice2 = this.task.accomplicesIds) == null ? void 0 : _this$task$accomplice2.length) != null ? _this$task$accomplice : 0
	      });
	    },
	    async handleDayFocus(event) {
	      const {
	        year,
	        month,
	        day
	      } = event.getData();
	      const dayPicker = event.getTarget();
	      if (!this.maxDeadlineDate) {
	        return;
	      }
	      const dayElement = dayPicker.getMonthContainer().querySelector(`.ui-day-picker-day[data-year="${year}"][data-month="${month}"][data-day="${day}"]`);
	      if (!dayElement) {
	        return;
	      }
	      main_core.Dom.style(dayElement, 'cursor', 'pointer');
	      this.isLimitHintShown = false;
	      this.hintBindElement = null;
	      await this.$nextTick();
	      const focusedDate = ui_datePicker.createUtcDate(year, month, day);
	      const maxUtcDate = ui_datePicker.createUtcDate(this.maxDeadlineDate.getUTCFullYear(), this.maxDeadlineDate.getUTCMonth(), this.maxDeadlineDate.getUTCDate());
	      if (focusedDate > maxUtcDate) {
	        this.datePicker.setFocusDate(null);
	        main_core.Dom.style(dayElement, 'cursor', 'default');
	        this.hintBindElement = dayElement;
	        this.isLimitHintShown = true;
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-deadline-popup">
			<div class="tasks-field-deadline-picker-container">
				<div class="tasks-field-deadline-picker" ref="picker"/>
			</div>
			<div class="tasks-field-deadline-presets">
				<template v-for="(preset, key) of presets" :key>
					<div
						:data-task-preset-id="preset.id"
						:class="['tasks-field-deadline-preset', { '--disabled': preset.disabled }]"
						@click="selectPresetDate(preset.timestamp, preset.disabled)"
						@mouseenter="focusDate(preset.timestamp, preset.disabled, $event)"
						@mouseleave="focusDate(null, preset.disabled, $event)"
					>
						<div class="tasks-field-deadline-preset-title">{{ preset.title }}</div>
						<div class="tasks-field-deadline-preset-date">{{ preset.formatted }}</div>
					</div>
				</template>
			</div>
			<div v-if="false" class="tasks-field-deadline-settings">
			</div>
			<Hint
				v-if="isLimitHintShown"
				:bindElement="hintBindElement"
				:options="{
					maxWidth: 300,
					padding: 12,
					closeIcon: false,
					offsetLeft: hintBindElement.offsetWidth / 2,
				}"
				@close="isLimitHintShown = false"
			>
				<div class="tasks-field-deadline-date-picker-hint">{{ limitHintText }}</div>
			</Hint>
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
	    deadlineTs: {
	      type: [Number, null],
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    },
	    coordinates: {
	      type: Object,
	      default: null
	    }
	  },
	  emits: ['update:deadlineTs', 'close'],
	  computed: {
	    options() {
	      var _this$coordinates;
	      const baseOptions = {
	        id: `tasks-field-deadline-popup-${this.taskId}`,
	        bindElement: this.bindElement,
	        padding: 24,
	        offsetTop: 5,
	        offsetLeft: -100,
	        targetContainer: document.body
	      };
	      if ((_this$coordinates = this.coordinates) != null && _this$coordinates.x) {
	        const bindElementRect = this.bindElement.getBoundingClientRect();
	        baseOptions.offsetLeft += this.coordinates.x - bindElementRect.left;
	      }
	      return baseOptions;
	    }
	  },
	  methods: {
	    handleUpdate(dateTs) {
	      this.$emit('update:deadlineTs', dateTs);
	    }
	  },
	  template: `
		<Popup :options @close="$emit('close')">
			<DeadlinePopupContent :taskId @update="handleUpdate" @close="$emit('close')"/>
		</Popup>
	`
	};

	// @vue/component
	const DeadlineChangeReasonPopup = {
	  name: 'DeadlineChangeReasonPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BInput: ui_system_input_vue.BInput,
	    UiButton: ui_vue3_components_button.Button,
	    Popup: ui_vue3_components_popup.Popup
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    },
	    modelValue: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['update:modelValue', 'close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      resolve: null,
	      reject: null
	    };
	  },
	  computed: {
	    options() {
	      return {
	        id: `tasks-deadline-change-reason-popup-${this.taskId}`,
	        className: 'tasks-deadline-change-reason-popup',
	        bindElement: this.bindElement,
	        padding: 24,
	        width: 472,
	        height: 324,
	        offsetLeft: -24,
	        targetContainer: document.body
	      };
	    },
	    reason: {
	      get() {
	        return this.modelValue;
	      },
	      set(value) {
	        this.$emit('update:modelValue', value);
	      }
	    }
	  },
	  methods: {
	    handleClose() {
	      this.reason = '';
	      this.$emit('close');
	    },
	    handleSave() {
	      if (this.reason === '') {
	        return;
	      }
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup :options @close="handleClose">
			<div class="tasks-deadline-change-reason-popup-header">
				<div class="tasks-deadline-change-reason-popup-title">
					{{ loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_TITLE') }}
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-deadline-change-reason-popup-close-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-deadline-change-reason-popup-content">
				<div class="tasks-deadline-change-reason-popup-message">
					{{ loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_MESSAGE') }}
				</div>
				<BInput
					v-model="reason"
					:rowsQuantity="6"
					active
					resize="none"
					data-id="tasks-deadline-change-reason-popup-reason"
				/>
			</div>
			<div class="tasks-deadline-change-reason-popup-footer">
				<UiButton
					:text="loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_BTN_CANCEL')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:dataset="{
						deadlineChangeReasonButtonId: 'cancel',
					}"
					@click="handleClose"
				/>
				<UiButton
					:text="loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_BTN_SAVE')"
					:size="ButtonSize.MEDIUM"
					:disabled="reason === ''"
					:style="AirButtonStyle.FILLED"
					:dataset="{
						deadlineChangeReasonButtonId: 'save',
					}"
					@click="handleSave"
				/>
			</div>
		</Popup>
	`
	};

	const unitDurations = main_date.DurationFormat.getUnitDurations();

	// @vue/component
	const DeadlineAfterPopupContent = {
	  components: {
	    TextSm: ui_system_typography_vue.TextSm,
	    Chip: ui_system_chip_vue.Chip,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    Duration: tasks_v2_component_elements_duration.Duration
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    freeze: {
	      type: Function,
	      required: true
	    },
	    unfreeze: {
	      type: Function,
	      required: true
	    }
	  },
	  emits: ['update', 'close'],
	  setup() {
	    return {
	      ChipDesign: ui_system_chip_vue.ChipDesign
	    };
	  },
	  data() {
	    return {
	      deadlineAfter: 0
	    };
	  },
	  computed: {
	    duration: {
	      get() {
	        return this.deadlineAfter;
	      },
	      set(deadlineAfter) {
	        this.$emit('update', deadlineAfter);
	      }
	    },
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    presets() {
	      var _this$task;
	      const dayDuration = (_this$task = this.task) != null && _this$task.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : unitDurations.d;
	      return [{
	        duration: dayDuration,
	        title: new main_date.DurationFormat(unitDurations.d).format()
	      }, {
	        duration: dayDuration * 3,
	        title: new main_date.DurationFormat(unitDurations.d * 3).format()
	      }, {
	        duration: dayDuration * 7,
	        title: this.loc('TASKS_V2_DEADLINE_A_WEEK')
	      }, {
	        duration: dayDuration * 14,
	        title: this.loc('TASKS_V2_DEADLINE_TWO_WEEKS')
	      }];
	    }
	  },
	  created() {
	    var _this$task2;
	    this.deadlineAfter = (_this$task2 = this.task) == null ? void 0 : _this$task2.deadlineAfter;
	  },
	  methods: {
	    applyPreset(duration) {
	      this.duration = duration;
	      this.$emit('close');
	    }
	  },
	  template: `
		<div class="tasks-field-deadline-after-header">
			<TextSm>{{ loc('TASKS_V2_DEADLINE_AFTER_TEXT') }}</TextSm>
			<QuestionMark :hintText="loc('TASKS_V2_DEADLINE_AFTER_HINT')"/>
		</div>
		<div class="tasks-field-deadline-after-chips">
			<template v-for="preset in presets" :key="preset.title">
				<Chip
					:text="preset.title"
					:design="ChipDesign.Outline"
					:compact="false"
					@click="applyPreset(preset.duration)"
				/>
			</template>
		</div>
		<Duration
			v-model="duration"
			:label="loc('TASKS_V2_DEADLINE_AFTER_CUSTOM')"
			:matchesWorkTime="task?.matchesWorkTime"
			@menuShown="freeze"
			@menuHidden="unfreeze"
		/>
	`
	};

	// @vue/component
	const DeadlineAfterPopup = {
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    DeadlineAfterPopupContent
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    deadlineAfter: {
	      type: [Number, null],
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  emits: ['update:deadlineAfter', 'close'],
	  computed: {
	    options() {
	      return {
	        id: `tasks-field-deadline-after-popup-${this.taskId}`,
	        bindElement: this.bindElement,
	        width: 300,
	        padding: 24,
	        offsetTop: 5,
	        targetContainer: document.body
	      };
	    }
	  },
	  methods: {
	    handleUpdate(dateTs) {
	      this.$emit('update:deadlineAfter', dateTs);
	    }
	  },
	  template: `
		<Popup
			v-slot="{ freeze, unfreeze }"
			:options
			@close="$emit('close')"
		>
			<DeadlineAfterPopupContent :taskId :freeze :unfreeze @update="handleUpdate" @close="$emit('close')"/>
		</Popup>
	`
	};

	const deadlineMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Deadline,
	  title: main_core.Loc.getMessage('TASKS_V2_DEADLINE_TITLE')
	});

	// @vue/component
	const Deadline = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    Text2Xs: ui_system_typography_vue.Text2Xs,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    DeadlinePopup,
	    DeadlineAfterPopup,
	    DeadlineChangeReasonPopup,
	    SettingsLabel: tasks_v2_component_elements_settingsLabel.SettingsLabel,
	    TaskSettingsPopup: tasks_v2_component_taskSettingsPopup.TaskSettingsPopup
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isTemplate: {
	      type: Boolean,
	      default: false
	    },
	    isAutonomous: {
	      type: Boolean,
	      default: false
	    },
	    isHovered: {
	      type: Boolean,
	      default: false
	    },
	    compact: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['isSettingsPopupShown'],
	  setup() {
	    return {
	      deadlineMeta
	    };
	  },
	  data() {
	    return {
	      nowTs: Date.now(),
	      isFieldHovered: false,
	      isPopupShown: false,
	      isSettingsPopupShown: false,
	      isExceededHintShown: false,
	      isChangeReasonPopupShown: false,
	      dateTs: null,
	      externalBindElement: null,
	      coordinates: null,
	      saveCallback: null,
	      changeReason: ''
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      deadlineChangeCount: `${tasks_v2_const.Model.Interface}/deadlineChangeCount`
	    }),
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    isEdit() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
	    },
	    deadlineTs() {
	      var _this$dateTs;
	      return (_this$dateTs = this.dateTs) != null ? _this$dateTs : this.isTemplate ? this.task.deadlineAfter : this.task.deadlineTs;
	    },
	    expiredDuration() {
	      const isCompleted = this.task.status === tasks_v2_const.TaskStatus.Completed || this.task.status === tasks_v2_const.TaskStatus.SupposedlyCompleted;
	      const cannotExpire = this.isTemplate || !this.deadlineTs || this.isFlowFilledOnAdd || isCompleted;
	      return cannotExpire ? 0 : this.nowTs - this.deadlineTs;
	    },
	    isExpired() {
	      return this.expiredDuration > 0;
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
	      if (this.isTemplate) {
	        return tasks_v2_lib_calendar.calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
	      }
	      if (this.isExpired && this.compact) {
	        return this.loc('TASKS_V2_TASK_LIST_DEADLINE_EXPIRED', {
	          '#DURATION#': new main_date.DurationFormat(this.expiredDuration).formatClosest()
	        });
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.deadlineTs);
	    },
	    deadlineFormattedForPrint() {
	      if (this.isFlowFilledOnAdd) {
	        return this.loc('TASKS_V2_DEADLINE_AUTO');
	      }
	      if (!this.deadlineTs) {
	        return this.loc('TASKS_V2_DEADLINE_EMPTY');
	      }
	      if (this.isTemplate) {
	        return tasks_v2_lib_calendar.calendar.formatDuration(this.deadlineTs, this.task.matchesWorkTime);
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.deadlineTs);
	    },
	    iconName() {
	      return this.isFlowFilledOnAdd ? ui_iconSet_api_vue.Outline.BOTTLENECK : ui_iconSet_api_vue.Outline.CALENDAR_WITH_SLOTS;
	    },
	    bindElement() {
	      var _this$externalBindEle;
	      return (_this$externalBindEle = this.externalBindElement) != null ? _this$externalBindEle : this.$refs.deadline.$el;
	    },
	    isFlowFilledOnAdd() {
	      return !this.isEdit && this.task.flowId > 0;
	    },
	    canChangeSettings() {
	      const features = tasks_v2_core.Core.getParams().features;
	      if (!features.isV2Enabled) {
	        return false;
	      }
	      return this.task.rights.edit;
	    },
	    readonly() {
	      return !this.task.rights.deadline || this.exceededChangeCount || this.isFlowFilledOnAdd;
	    },
	    canChangeDeadlineWithoutLimitation() {
	      const isCreator = tasks_v2_core.Core.getParams().currentUser.id === this.task.creatorId;
	      return !this.isEdit || isCreator || this.task.rights.edit || tasks_v2_core.Core.getParams().rights.user.admin;
	    },
	    requireChangeReason() {
	      return this.task.requireDeadlineChangeReason && !this.canChangeDeadlineWithoutLimitation;
	    },
	    exceededChangeCount() {
	      if (this.isTemplate || this.canChangeDeadlineWithoutLimitation || !this.task.maxDeadlineChanges) {
	        return false;
	      }
	      return this.deadlineChangeCount >= this.task.maxDeadlineChanges;
	    },
	    canChangeTooltip() {
	      if (!this.isEdit || !this.readonly || this.exceededChangeCount) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_DEADLINE_CAN_CHANGE_HINT'),
	        popupOptions: {
	          width: 280,
	          offsetLeft: this.hintAngleOffset + 3
	        }
	      });
	    },
	    hintBindElement() {
	      var _this$$refs$deadlineI, _this$$refs$deadlineI2, _this$$refs$deadline;
	      return (_this$$refs$deadlineI = (_this$$refs$deadlineI2 = this.$refs.deadlineIcon) == null ? void 0 : _this$$refs$deadlineI2.$el) != null ? _this$$refs$deadlineI : (_this$$refs$deadline = this.$refs.deadline) == null ? void 0 : _this$$refs$deadline.$el;
	    },
	    hintAngleOffset() {
	      return this.hintBindElement.offsetWidth / 2;
	    }
	  },
	  watch: {
	    isSettingsPopupShown(value) {
	      this.$emit('isSettingsPopupShown', value);
	    }
	  },
	  mounted() {
	    tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
	    this.nowTsInterval = setInterval(() => {
	      this.nowTs = Date.now();
	    }, 1000);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);
	  },
	  created() {
	    this.showErrorDebounce = main_core.Runtime.debounce(this.showError, 300);
	  },
	  updated() {
	    tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
	  },
	  beforeUnmount() {
	    clearInterval(this.nowTsInterval);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);
	  },
	  methods: {
	    handleOpenDeadlinePickerEvent(event) {
	      const {
	        taskId,
	        bindElement,
	        coordinates
	      } = event.getData();
	      if (Number(taskId) === Number(this.taskId)) {
	        this.showPopup(bindElement, coordinates);
	      }
	    },
	    handleClick() {
	      if (!this.readonly) {
	        this.showPopup();
	      }
	    },
	    showPopup(bindElement, coordinates) {
	      this.dateTs = this.deadlineTs;
	      this.externalBindElement = bindElement;
	      this.coordinates = coordinates;
	      this.isPopupShown = true;
	    },
	    handleCrossClick() {
	      if (this.requireChangeReason) {
	        this.isChangeReasonPopupShown = true;
	        this.saveCallback = this.clearDeadline;
	      } else {
	        void this.clearDeadline();
	      }
	    },
	    handleClose() {
	      var _this$$refs$deadline2, _this$$refs$deadline3;
	      if (this.requireChangeReason && this.dateTs) {
	        this.isChangeReasonPopupShown = true;
	        this.saveCallback = this.saveDeadline;
	      } else {
	        void this.saveDeadline();
	      }
	      this.isPopupShown = false;
	      (_this$$refs$deadline2 = this.$refs.deadline) == null ? void 0 : (_this$$refs$deadline3 = _this$$refs$deadline2.$el) == null ? void 0 : _this$$refs$deadline3.focus();
	    },
	    async handleChangeReasonPopupClose() {
	      this.isChangeReasonPopupShown = false;
	      await this.saveCallback();
	      this.saveCallback = null;
	    },
	    handleKeydown(event) {
	      if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey)) {
	        void this.handleClick();
	      }
	    },
	    async saveDeadline() {
	      if (this.requireChangeReason && this.changeReason === '') {
	        return;
	      }
	      if (this.dateTs) {
	        await this.setDeadline(this.dateTs);
	      }
	      if (!this.isTemplate && !this.canChangeDeadlineWithoutLimitation && this.task.maxDeadlineChanges) {
	        void tasks_v2_provider_service_deadlineService.deadlineService.updateDeadlineChangeCount(this.task.id);
	      }
	    },
	    async clearDeadline() {
	      if (this.requireChangeReason && this.changeReason === '') {
	        return;
	      }
	      await this.setDeadline(0);
	    },
	    async setDeadline(dateTs) {
	      this.dateTs = null;
	      if (this.isTemplate) {
	        await tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          deadlineAfter: dateTs
	        });
	      } else {
	        var _result$Endpoint$Task;
	        tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
	        const result = await tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          deadlineTs: dateTs,
	          deadlineChangeReason: this.changeReason
	        });
	        tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
	        if ((_result$Endpoint$Task = result[tasks_v2_const.Endpoint.TaskDeadlineUpdate]) != null && _result$Endpoint$Task.length) {
	          const error = result[tasks_v2_const.Endpoint.TaskDeadlineUpdate][0];
	          this.showErrorDebounce(error);
	        }
	      }
	    },
	    showError(error) {
	      ui_notificationManager.Notifier.notifyViaBrowserProvider({
	        id: 'task-notify-deadline-update-error',
	        text: error == null ? void 0 : error.message
	      });
	    }
	  },
	  template: `
		<div
			v-hint="canChangeTooltip"
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			@mouseover="isFieldHovered = true"
			@mouseleave="isFieldHovered = false"
			ref="container"
		>
			<div class="tasks-field-deadline-inner">
				<HoverPill
					:withClear="Boolean(deadlineTs)"
					:readonly
					:textOnly="compact"
					:noOffset="compact"
					:active="isPopupShown"
					:alert="isExpired"
					@click="handleClick"
					@clear="handleCrossClick"
					@keydown="handleKeydown"
					@mouseover="isExceededHintShown = true"
					@mouseleave="isExceededHintShown = false"
					ref="deadline"
				>
					<BIcon
						v-if="!compact"
						class="tasks-field-deadline-icon" 
						:name="iconName"
						ref="deadlineIcon"
					/>
					<TextMd 
						class="tasks-field-deadline-text print-ignore" 
						:accent="isExpired"
					>
						{{ deadlineFormatted }}
					</TextMd>
					<TextMd
						class="tasks-field-deadline-text --display-none print-display-block" 
						:accent="isExpired">{{ deadlineFormattedForPrint }}
					</TextMd>
				</HoverPill>
				<div
					v-if="!isFlowFilledOnAdd && !isTemplate && !compact"
					class="tasks-field-deadline-settings-label"
					ref="settings"
				>
					<SettingsLabel
						v-if="canChangeSettings && (isHovered || isFieldHovered || isSettingsPopupShown)"
						data-settings-label
						@click="isSettingsPopupShown = true"
					/>
				</div>
			</div>
			<Text2Xs v-if="isExpired && !compact" class="tasks-field-deadline-expired print-ignore">{{ expiredFormatted }}</Text2Xs>
		</div>
		<DeadlinePopup
			v-if="!isTemplate && isPopupShown"
			v-model:deadlineTs="dateTs"
			:taskId
			:bindElement
			:coordinates
			@close="handleClose"
		/>
		<DeadlineAfterPopup
			v-if="isTemplate && isPopupShown"
			v-model:deadlineAfter="dateTs"
			:taskId
			:bindElement
			@close="handleClose"
		/>
		<DeadlineChangeReasonPopup
			v-if="isChangeReasonPopupShown"
			v-model="changeReason"
			:taskId
			:bindElement="$refs.container"
			@close="handleChangeReasonPopupClose"
		/>
		<TaskSettingsPopup v-if="isSettingsPopupShown" @close="isSettingsPopupShown = false"/>
		<Hint
			v-if="exceededChangeCount && isExceededHintShown"
			:bindElement="hintBindElement"
			:options="{
				maxWidth: 330,
				padding: 12,
				closeIcon: false,
				offsetLeft: hintAngleOffset,
			}"
			@close="isExceededHintShown = false"
		>
			<div class="tasks-field-deadline-exceeded-hint">
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_1') }}</span>
				<span>{{ loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_HINT_2') }}</span>
			</div>
		</Hint>
	`
	};

	exports.Deadline = Deadline;
	exports.DeadlinePopup = DeadlinePopup;
	exports.DeadlineAfterPopup = DeadlineAfterPopup;
	exports.deadlineMeta = deadlineMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Event,BX.UI.NotificationManager,BX.Vue3.Directives,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Vue3.Vuex,BX.UI.DatePicker,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.UI.IconSet,BX.UI.System.Input.Vue,BX,BX.Vue3.Components,BX,BX.UI.Vue3.Components,BX.Main,BX.UI.System.Typography.Vue,BX.UI.System.Chip.Vue,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX,BX.Tasks.V2.Const));
//# sourceMappingURL=deadline.bundle.js.map
