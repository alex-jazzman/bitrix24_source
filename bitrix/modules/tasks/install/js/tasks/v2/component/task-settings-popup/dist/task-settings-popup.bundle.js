/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_components_button,ui_vue3_components_popup,tasks_v2_provider_service_deadlineService,tasks_v2_provider_service_taskService,tasks_v2_provider_service_stateService,tasks_v2_core,ui_switcher,ui_vue3_components_switcher,tasks_v2_lib_showLimit,tasks_v2_component_elements_questionMark,ui_forms,main_core,main_date,ui_vue3_vuex,ui_datePicker,ui_vue3_components_richLoc,ui_system_typography_vue,ui_system_input_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_calendar) {
	'use strict';

	// @vue/component
	const TaskSetting = {
	  name: 'TasksTaskSetting',
	  components: {
	    Switcher: ui_vue3_components_switcher.Switcher,
	    TextSm: ui_system_typography_vue.TextSm,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    modelValue: {
	      type: Boolean,
	      required: true
	    },
	    label: {
	      type: String,
	      default: ''
	    },
	    questionMarkHint: {
	      type: String,
	      default: ''
	    },
	    lock: {
	      type: Boolean,
	      default: false
	    },
	    featureId: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['update:modelValue'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    switcherOptions() {
	      return {
	        size: ui_switcher.SwitcherSize.small,
	        useAirDesign: true
	      };
	    },
	    hasLabelSlot() {
	      return Boolean(this.$slots.label);
	    }
	  },
	  methods: {
	    handleContainerClick() {
	      if (this.lock) {
	        this.handleLockClick();
	        return;
	      }
	      this.$emit('update:modelValue', !this.modelValue);
	    },
	    handleLockClick() {
	      if (!this.featureId) {
	        return;
	      }
	      void tasks_v2_lib_showLimit.showLimit({
	        featureId: this.featureId
	      });
	    }
	  },
	  template: `
		<div class="tasks-task-setting">
			<div class="tasks-task-setting-switcher">
				<Switcher
					:isChecked="modelValue"
					:options="switcherOptions"
					@click="handleContainerClick"
				/>
				<slot v-if="hasLabelSlot" name="label"/>
				<TextSm
					v-else
					class="tasks-task-setting-switcher-label"
					@click="handleContainerClick"
				>{{ label }}</TextSm>
				<QuestionMark v-if="questionMarkHint" :hintText="questionMarkHint"/>
				<BIcon 
					v-if="lock"
					:name="Outline.LOCK_M"
					class="tasks-task-setting-switcher-lock"
					@click="handleLockClick"
				/>
			</div>
			<div v-if="modelValue && $slots.default" class="tasks-task-setting-content">
				<slot/>
			</div>
		</div>
	`
	};

	// @vue/component
	const TaskDeadlineDefaultSetting = {
	  name: 'TasksTaskDeadlineDefaultSetting',
	  props: {
	    modelValue: {
	      type: Number,
	      required: true,
	      default: 0
	    }
	  },
	  emits: ['update:modelValue', 'updateDeadlineUserOption'],
	  data() {
	    return {
	      periodOptions: [{
	        value: tasks_v2_const.DurationUnit.Hours,
	        label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_HOUR')
	      }, {
	        value: tasks_v2_const.DurationUnit.Days,
	        label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_DAY')
	      }, {
	        value: tasks_v2_const.DurationUnit.Weeks,
	        label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_WEEK')
	      }, {
	        value: tasks_v2_const.DurationUnit.Months,
	        label: this.loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_PERIOD_MONTH')
	      }],
	      selectedPeriod: tasks_v2_const.DurationUnit.Days,
	      localValue: ''
	    };
	  },
	  watch: {
	    modelValue: {
	      immediate: true,
	      handler(newValue) {
	        if (newValue <= 0) {
	          this.localValue = '';
	          return;
	        }
	        const bestPeriod = this.findBestPeriod(newValue);
	        this.selectedPeriod = bestPeriod.period;
	        const periodInSeconds = this.getPeriodInSeconds(bestPeriod.period);
	        const valueInPeriod = newValue / periodInSeconds;
	        this.localValue = this.formatValue(valueInPeriod, bestPeriod.period);
	      }
	    }
	  },
	  methods: {
	    handleBlur() {
	      this.updateModelValue();
	    },
	    findBestPeriod(seconds) {
	      const periods = [{
	        period: tasks_v2_const.DurationUnit.Months,
	        duration: this.getPeriodInSeconds(tasks_v2_const.DurationUnit.Months)
	      }, {
	        period: tasks_v2_const.DurationUnit.Weeks,
	        duration: this.getPeriodInSeconds(tasks_v2_const.DurationUnit.Weeks)
	      }, {
	        period: tasks_v2_const.DurationUnit.Days,
	        duration: this.getPeriodInSeconds(tasks_v2_const.DurationUnit.Days)
	      }, {
	        period: tasks_v2_const.DurationUnit.Hours,
	        duration: this.getPeriodInSeconds(tasks_v2_const.DurationUnit.Hours)
	      }].sort((a, b) => b.duration - a.duration);
	      for (const {
	        period,
	        duration
	      } of periods) {
	        const value = seconds / duration;
	        if (Number.isInteger(value) && value >= 1) {
	          return {
	            period,
	            value
	          };
	        }
	      }
	      for (const {
	        period,
	        duration
	      } of periods) {
	        const value = seconds / duration;
	        if (value >= 1 && value < 1000) {
	          return {
	            period,
	            value
	          };
	        }
	      }
	      return {
	        period: tasks_v2_const.DurationUnit.Hours,
	        value: seconds / this.getPeriodInSeconds(tasks_v2_const.DurationUnit.Hours)
	      };
	    },
	    formatValue(value, period) {
	      if (period === tasks_v2_const.DurationUnit.Hours && value >= 24) {
	        const days = value / 24;
	        if (days === Math.floor(days)) {
	          return days.toString();
	        }
	      }
	      if (value % 1 !== 0) {
	        return value.toFixed(2).replace(/\.?0+$/, '');
	      }
	      return value.toString();
	    },
	    updateSelectedPeriod(event) {
	      this.selectedPeriod = event.target.value;
	      this.updateModelValue();
	    },
	    updateModelValue() {
	      if (!this.localValue || Number.isNaN(parseFloat(this.localValue))) {
	        this.$emit('update:modelValue', 0);
	        return;
	      }
	      const numericValue = parseFloat(this.localValue);
	      if (numericValue <= 0) {
	        this.$emit('update:modelValue', 0);
	        return;
	      }
	      this.emitDeadlineUserOptionUpdate(this.selectedPeriod);
	      const periodInSeconds = this.getPeriodInSeconds(this.selectedPeriod);
	      const seconds = numericValue * periodInSeconds;
	      this.$emit('update:modelValue', Math.round(seconds));
	    },
	    getPeriodInSeconds(selectedPeriod) {
	      const unitDurations = main_date.DurationFormat.getUnitDurations();
	      switch (selectedPeriod) {
	        case tasks_v2_const.DurationUnit.Hours:
	          return unitDurations.H / 1000;
	        case tasks_v2_const.DurationUnit.Days:
	          return unitDurations.d / 1000;
	        case tasks_v2_const.DurationUnit.Weeks:
	          return unitDurations.d * 7 / 1000;
	        case tasks_v2_const.DurationUnit.Months:
	          return unitDurations.d * 30 / 1000;
	        default:
	          return unitDurations.H / 1000;
	      }
	    },
	    emitDeadlineUserOptionUpdate(selectedPeriod) {
	      this.$emit('updateDeadlineUserOption', {
	        isExactDeadlineTime: selectedPeriod === tasks_v2_const.DurationUnit.Hours
	      });
	    }
	  },
	  template: `
		<div class="tasks-task-deadline-setting">
			<div class="ui-ctl ui-ctl-textbox">
				<input
					type="number"
					class="ui-ctl-element"
					v-model.trim="localValue"
					data-id="tasks-task-deadline-setting-value"
					@blur="handleBlur"
				/>
			</div>
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
				<div class="ui-ctl-after ui-ctl-icon-angle"/>
				<select class="ui-ctl-element" :value="selectedPeriod" @change="updateSelectedPeriod">
					<option
						v-for="option in periodOptions"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</select>
			</div>
		</div>
	`
	};

	const limitType = Object.freeze({
	  date: 'date',
	  count: 'count'
	});

	// @vue/component
	const TaskDeadlineSettings = {
	  name: 'TasksTaskDeadlineSettings',
	  components: {
	    BInput: ui_system_input_vue.BInput,
	    TaskSetting,
	    TextSm: ui_system_typography_vue.TextSm,
	    RichLoc: ui_vue3_components_richLoc.RichLoc
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  emits: ['updateDeadlineUserOption', 'freeze', 'unfreeze'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      limitDeadline: false,
	      limitType: limitType.date,
	      isCalendarShown: false,
	      localDeadlineUserOption: {
	        requireDeadlineChangeReason: false,
	        maxDeadlineChangeDate: this.formatDate(this.getDefaultDate()),
	        maxDeadlineChanges: 1
	      }
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      deadlineUserOption: `${tasks_v2_const.Model.Interface}/deadlineUserOption`
	    }),
	    requireDeadlineChangeReason: {
	      get() {
	        return this.localDeadlineUserOption.requireDeadlineChangeReason === true;
	      },
	      set(value) {
	        this.localDeadlineUserOption.requireDeadlineChangeReason = value;
	        this.emitDeadlineUserOptionUpdate();
	      }
	    },
	    localMaxDeadlineChangeDate: {
	      get() {
	        return main_date.DateTimeFormat.parse(this.localDeadlineUserOption.maxDeadlineChangeDate);
	      },
	      set(date) {
	        this.localDeadlineUserOption.maxDeadlineChangeDate = this.formatDate(date);
	        this.emitDeadlineUserOptionUpdate();
	      }
	    },
	    localMaxDeadlineChanges: {
	      get() {
	        var _this$localDeadlineUs;
	        return String((_this$localDeadlineUs = this.localDeadlineUserOption.maxDeadlineChanges) != null ? _this$localDeadlineUs : '');
	      },
	      set(value) {
	        this.localDeadlineUserOption.maxDeadlineChanges = value === '' ? 1 : value;
	        this.emitDeadlineUserOptionUpdate();
	      }
	    },
	    limitByDate() {
	      return this.limitType === limitType.date;
	    },
	    limitByCount() {
	      return this.limitType === limitType.count;
	    }
	  },
	  watch: {
	    isCalendarShown(value) {
	      if (value) {
	        this.datePicker.show();
	      } else {
	        this.datePicker.hide();
	      }
	      this.$emit(value ? 'freeze' : 'unfreeze');
	    }
	  },
	  created() {
	    if (this.isEdit) {
	      this.localDeadlineUserOption.requireDeadlineChangeReason = this.task.requireDeadlineChangeReason;
	      this.localDeadlineUserOption.maxDeadlineChangeDate = this.task.maxDeadlineChangeDate;
	      this.localDeadlineUserOption.maxDeadlineChanges = this.task.maxDeadlineChanges;
	    } else {
	      this.localDeadlineUserOption.requireDeadlineChangeReason = this.deadlineUserOption.requireDeadlineChangeReason;
	      this.localDeadlineUserOption.maxDeadlineChangeDate = this.deadlineUserOption.maxDeadlineChangeDate;
	      this.localDeadlineUserOption.maxDeadlineChanges = this.deadlineUserOption.maxDeadlineChanges;
	    }
	    if (this.localDeadlineUserOption.maxDeadlineChangeDate) {
	      void this.switchToDateLimit();
	    }
	    if (this.localDeadlineUserOption.maxDeadlineChanges) {
	      this.switchToCountLimit();
	    }
	    this.limitDeadline = Boolean(this.localMaxDeadlineChangeDate || this.localMaxDeadlineChanges);
	  },
	  unmounted() {
	    var _this$datePicker;
	    (_this$datePicker = this.datePicker) == null ? void 0 : _this$datePicker.destroy();
	  },
	  methods: {
	    createDatePicker() {
	      const selectedDateTs = this.localMaxDeadlineChangeDate ? this.localMaxDeadlineChangeDate.getTime() : null;
	      return new ui_datePicker.DatePicker({
	        popupOptions: {
	          id: `tasks-deadline-settings-calendar-popup-${main_core.Text.getRandom()}`,
	          bindElement: this.$refs.calendarInput.$el,
	          offsetTop: -8,
	          bindOptions: {
	            forceBindPosition: true,
	            forceTop: true,
	            position: 'top'
	          }
	        },
	        selectedDates: selectedDateTs ? [selectedDateTs] : null,
	        enableTime: false,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            this.localMaxDeadlineChangeDate = tasks_v2_lib_calendar.calendar.createDateFromUtc(date);
	            this.isCalendarShown = false;
	          }
	        }
	      });
	    },
	    emitDeadlineUserOptionUpdate() {
	      const maxDeadlineChangeDate = this.limitByDate ? this.localDeadlineUserOption.maxDeadlineChangeDate : null;
	      const maxDeadlineChanges = this.limitByDate ? null : this.localDeadlineUserOption.maxDeadlineChanges;
	      this.$emit('updateDeadlineUserOption', {
	        requireDeadlineChangeReason: this.localDeadlineUserOption.requireDeadlineChangeReason,
	        maxDeadlineChangeDate: this.limitDeadline ? maxDeadlineChangeDate : null,
	        maxDeadlineChanges: this.limitDeadline ? maxDeadlineChanges : null
	      });
	    },
	    toggleLimit() {
	      this.limitDeadline = !this.limitDeadline;
	      if (this.limitDeadline && !this.localDeadlineUserOption.maxDeadlineChangeDate && !this.localDeadlineUserOption.maxDeadlineChanges) {
	        void this.switchToDateLimit();
	      }
	      this.emitDeadlineUserOptionUpdate();
	    },
	    async switchToDateLimit() {
	      if (!this.limitDeadline) {
	        this.limitDeadline = true;
	      }
	      if (!this.localDeadlineUserOption.maxDeadlineChangeDate) {
	        this.localMaxDeadlineChangeDate = this.getDefaultDate();
	      }
	      this.limitType = limitType.date;
	      await this.$nextTick();
	      this.datePicker = this.createDatePicker();
	      this.emitDeadlineUserOptionUpdate();
	    },
	    switchToCountLimit() {
	      if (!this.limitDeadline) {
	        this.limitDeadline = true;
	      }
	      if (!this.localDeadlineUserOption.maxDeadlineChanges) {
	        this.localMaxDeadlineChanges = 1;
	      }
	      this.limitType = limitType.count;
	      this.emitDeadlineUserOptionUpdate();
	    },
	    getDefaultDate() {
	      const now = new Date();
	      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
	    },
	    formatDate(date) {
	      if (!date) {
	        return null;
	      }
	      return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), date);
	    }
	  },
	  template: `
		<div class="tasks-task-deadline-settings">
			<div class="tasks-task-deadline-settings-line"/>
			<TaskSetting
				v-model="requireDeadlineChangeReason"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_REASON_LABEL')"
				:questionMarkHint="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_REASON_HINT')"
			/>
			<TaskSetting :modelValue="limitDeadline" @update:modelValue="toggleLimit">
				<template #label>
					<TextSm class="tasks-task-deadline-settings-label">
						<div class="tasks-task-deadline-settings-label-text" @click="toggleLimit">
							{{ loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_LIMIT_LABEL') }}
						</div>
						<div class="tasks-task-deadline-settings-label-filter">
							<span :class="{'--active': limitByDate}" @click="switchToDateLimit">
							{{ loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_LIMIT_BY_DATE') }}
						</span>
							<span :class="{'--active': limitByCount}" @click="switchToCountLimit">
							{{ loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_LIMIT_BY_COUNT') }}
						</span>
						</div>
					</TextSm>
				</template>
				<RichLoc
					v-if="limitByDate"
					class="tasks-task-deadline-settings-content --date"
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_BEFORE')"
					placeholder="[date/]"
				>
					<template #date>
						<BInput
							ref="calendarInput"
							:modelValue="formatDate(localMaxDeadlineChangeDate)"
							:design="InputDesign.LightGrey"
							:icon="Outline.CALENDAR_WITH_SLOTS"
							hoverable
							data-id="tasks-task-deadline-settings-max-date"
							@click="isCalendarShown = !isCalendarShown"
						/>
					</template>
				</RichLoc>
				<RichLoc
					v-else
					class="tasks-task-deadline-settings-content --count"
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_NOT_GREATER_THAN')"
					placeholder="[count/]"
				>
					<template #count>
						<div class="ui-ctl ui-ctl-textbox">
							<input
								type="number"
								min="1"
								required
								class="ui-ctl-element"
								v-model.trim="localMaxDeadlineChanges"
								data-id="tasks-task-deadline-settings-max-changes"
							/>
						</div>
					</template>
				</RichLoc>
			</TaskSetting>
		</div>
	`
	};

	// @vue/component
	const TaskSettings = {
	  name: 'TasksTaskSettings',
	  components: {
	    TaskSetting,
	    TaskDeadlineDefaultSetting,
	    TaskDeadlineSettings
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  emits: ['updateFlags', 'updateDeadlineUserOption', 'freeze', 'unfreeze'],
	  setup() {},
	  data() {
	    return {
	      localFlags: {
	        needsControl: false,
	        matchesWorkTime: false
	      },
	      localDeadlineUserOption: {
	        defaultDeadlineInSeconds: 0,
	        canChangeDeadline: false,
	        maxDeadlineChangeDate: null,
	        maxDeadlineChanges: null
	      },
	      localAutocompleteSubTasks: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
	      deadlineUserOption: `${tasks_v2_const.Model.Interface}/deadlineUserOption`
	    }),
	    isDefaultDeadlineActive: {
	      get() {
	        return this.localDeadlineUserOption.defaultDeadlineInSeconds > 0;
	      },
	      set(value) {
	        this.localDeadlineUserOption.defaultDeadlineInSeconds = value ? this.defaultDeadlineSeconds : 0;
	        this.emitDeadlineUserOptionUpdate({
	          defaultDeadlineInSeconds: this.localDeadlineUserOption.defaultDeadlineInSeconds
	        });
	      }
	    },
	    defaultDeadlineSeconds: {
	      get() {
	        if (!this.localDeadlineUserOption.defaultDeadlineInSeconds) {
	          const unitDurations = main_date.DurationFormat.getUnitDurations();
	          return unitDurations.d * 5 / 1000;
	        }
	        return this.localDeadlineUserOption.defaultDeadlineInSeconds;
	      },
	      set(value) {
	        this.localDeadlineUserOption.defaultDeadlineInSeconds = value;
	        this.emitDeadlineUserOptionUpdate({
	          defaultDeadlineInSeconds: this.localDeadlineUserOption.defaultDeadlineInSeconds
	        });
	      }
	    },
	    autocompleteSubTasks: {
	      get() {
	        return this.localAutocompleteSubTasks === true;
	      },
	      set(value) {
	        this.localAutocompleteSubTasks = value;
	        this.emitFlagsUpdate({
	          autocompleteSubTasks: value
	        });
	      }
	    },
	    taskControl: {
	      get() {
	        return this.localFlags.needsControl === true;
	      },
	      set(value) {
	        this.localFlags.needsControl = value;
	        this.emitFlagsUpdate({
	          needsControl: value
	        });
	      }
	    },
	    canChangeDeadline: {
	      get() {
	        return this.localDeadlineUserOption.canChangeDeadline === true;
	      },
	      set(value) {
	        this.localDeadlineUserOption.canChangeDeadline = value;
	        if (!value) {
	          this.localDeadlineUserOption.maxDeadlineChangeDate = null;
	          this.localDeadlineUserOption.maxDeadlineChanges = null;
	        }
	        this.emitDeadlineUserOptionUpdate({
	          allowsChangeDeadline: value,
	          canChangeDeadline: value,
	          maxDeadlineChangeDate: null,
	          maxDeadlineChanges: null
	        });
	      }
	    },
	    matchesWorkTime: {
	      get() {
	        return this.localFlags.matchesWorkTime === true;
	      },
	      set(value) {
	        this.localFlags.matchesWorkTime = value;
	        this.emitFlagsUpdate({
	          matchesWorkTime: value
	        });
	      }
	    },
	    isMatchesWorkTimeLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.skipWeekends.available;
	    },
	    matchesWorkTimeFeatureId() {
	      return tasks_v2_core.Core.getParams().restrictions.skipWeekends.featureId;
	    },
	    isTaskControlLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.control.available;
	    },
	    taskControlFeatureId() {
	      return tasks_v2_core.Core.getParams().restrictions.control.featureId;
	    },
	    isAutocompleteSubTasksLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available;
	    },
	    autocompleteSubTasksFeatureId() {
	      return tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.featureId;
	    }
	  },
	  created() {
	    this.localDeadlineUserOption.defaultDeadlineInSeconds = this.deadlineUserOption.defaultDeadlineInSeconds;
	    if (this.isEdit) {
	      this.localFlags.needsControl = this.isTaskControlLocked ? false : this.task.needsControl;
	      this.localFlags.matchesWorkTime = this.isMatchesWorkTimeLocked ? false : this.task.matchesWorkTime;
	      this.localDeadlineUserOption.canChangeDeadline = this.task.allowsChangeDeadline;
	      this.localDeadlineUserOption.maxDeadlineChangeDate = this.task.maxDeadlineChangeDate;
	      this.localDeadlineUserOption.maxDeadlineChanges = this.task.maxDeadlineChanges;
	    } else {
	      this.localFlags.needsControl = this.stateFlags.needsControl;
	      this.localFlags.matchesWorkTime = this.stateFlags.matchesWorkTime;
	      this.localDeadlineUserOption.canChangeDeadline = this.deadlineUserOption.canChangeDeadline;
	      this.localDeadlineUserOption.maxDeadlineChangeDate = this.deadlineUserOption.maxDeadlineChangeDate;
	      this.localDeadlineUserOption.maxDeadlineChanges = this.deadlineUserOption.maxDeadlineChanges;
	    }
	    this.localAutocompleteSubTasks = this.task.autocompleteSubTasks;
	  },
	  methods: {
	    emitFlagsUpdate(updatedData) {
	      this.$emit('updateFlags', updatedData);
	    },
	    emitDeadlineUserOptionUpdate(updatedData) {
	      this.$emit('updateDeadlineUserOption', updatedData);
	    }
	  },
	  template: `
		<div class="tasks-task-settings">
			<TaskSetting
				v-model="taskControl"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_CONTROL_LABEL')"
				:questionMarkHint="loc('TASKS_V2_TASK_SETTINGS_POPUP_CONTROL_HINT')"
				:lock="isTaskControlLocked"
				:featureId="taskControlFeatureId"
			/>
			<TaskSetting
				v-model="isDefaultDeadlineActive"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINE_LABEL')"
			>
				<TaskDeadlineDefaultSetting
					v-if="isDefaultDeadlineActive"
					v-model="defaultDeadlineSeconds"
					@updateDeadlineUserOption="(data) => $emit('updateDeadlineUserOption', data)"
				/>
			</TaskSetting>
			<TaskSetting
				v-model="canChangeDeadline"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_DEADLINES_LABEL')"
			>
				<TaskDeadlineSettings
					v-if="canChangeDeadline"
					@updateDeadlineUserOption="(data) => $emit('updateDeadlineUserOption', data)"
					@freeze="$emit('freeze')"
					@unfreeze="$emit('unfreeze')"
				/>
			</TaskSetting>
			<TaskSetting
				v-model="matchesWorkTime"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_WORK_TIME_LABEL')"
				:questionMarkHint="loc('TASKS_V2_TASK_SETTINGS_POPUP_WORK_TIME_HINT')"
				:lock="isMatchesWorkTimeLocked"
				:featureId="matchesWorkTimeFeatureId"
			/>
			<TaskSetting
				v-model="autocompleteSubTasks"
				:label="loc('TASKS_V2_TASK_SETTINGS_POPUP_AUTO_COMPLETE_SUBTASKS_LABEL')"
				:lock="isAutocompleteSubTasksLocked"
				:featureId="autocompleteSubTasksFeatureId"
			/>
		</div>
	`
	};

	// @vue/component
	const TaskSettingsPopup = {
	  name: 'TaskSettingsPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    Popup: ui_vue3_components_popup.Popup,
	    TaskSettings
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      default: null
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      pendingFlagsData: {},
	      pendingDeadlineUserOption: {},
	      saving: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
	      deadlineUserOption: `${tasks_v2_const.Model.Interface}/deadlineUserOption`
	    }),
	    options() {
	      return {
	        id: `tasks-settings-popup-${this.taskId}`,
	        className: 'tasks-task-settings-popup',
	        bindElement: this.bindElement,
	        width: 530,
	        targetContainer: document.body
	      };
	    }
	  },
	  methods: {
	    handleClose() {
	      this.$emit('close');
	    },
	    async handleSave() {
	      this.saving = true;
	      const isMaxDeadlineChangesChanged = this.pendingDeadlineUserOption.maxDeadlineChanges && this.task.maxDeadlineChanges !== this.pendingDeadlineUserOption.maxDeadlineChanges;
	      if (this.isEdit && isMaxDeadlineChangesChanged) {
	        void tasks_v2_provider_service_deadlineService.deadlineService.cleanChangeLog(this.task.id);
	      }
	      if (this.isEdit) {
	        if (!main_core.Type.isNil(this.pendingDeadlineUserOption.defaultDeadlineInSeconds)) {
	          await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateDeadlineUserOption`, {
	            defaultDeadlineInSeconds: this.pendingDeadlineUserOption.defaultDeadlineInSeconds
	          });
	          void tasks_v2_provider_service_stateService.stateService.set({
	            defaultDeadline: this.deadlineUserOption
	          });
	        }
	      } else {
	        await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, this.pendingFlagsData);
	        await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateDeadlineUserOption`, this.pendingDeadlineUserOption);
	        void tasks_v2_provider_service_stateService.stateService.set({
	          needsControl: this.stateFlags.needsControl,
	          matchesWorkTime: this.stateFlags.matchesWorkTime,
	          defaultRequireResult: this.stateFlags.defaultRequireResult,
	          defaultDeadline: this.deadlineUserOption,
	          allowsTimeTracking: this.stateFlags.allowsTimeTracking
	        });
	      }
	      await tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        ...this.pendingFlagsData,
	        ...this.pendingDeadlineUserOption
	      });
	      this.$emit('close');
	      this.saving = false;
	    },
	    handleFlagsUpdate(updatedData) {
	      this.pendingFlagsData = {
	        ...this.pendingFlagsData,
	        ...updatedData
	      };
	    },
	    handleDeadlineUserOptionUpdate(updatedData) {
	      this.pendingDeadlineUserOption = {
	        ...this.pendingDeadlineUserOption,
	        ...updatedData
	      };
	    },
	    freeze() {
	      var _this$$refs$popup;
	      (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.freeze();
	    },
	    unfreeze() {
	      var _this$$refs$popup2;
	      (_this$$refs$popup2 = this.$refs.popup) == null ? void 0 : _this$$refs$popup2.unfreeze();
	    }
	  },
	  template: `
		<Popup ref="popup" :options @close="handleClose">
			<div class="tasks-task-settings-popup-header">
				<div class="tasks-task-settings-popup-title-container">
					<div class="tasks-task-settings-popup-title">
						{{ loc('TASKS_V2_TASK_SETTINGS_POPUP_TITLE') }}
					</div>
					<QuestionMark :hintText="loc('TASKS_V2_TASK_SETTINGS_POPUP_TITLE_HINT')"/>
				</div>
				<BIcon
					:name="Outline.CROSS_L"
					hoverable
					class="tasks-task-settings-popup-close-icon"
					@click="handleClose"
				/>
			</div>
			<div class="tasks-task-settings-popup-content">
				<TaskSettings
					@updateFlags="handleFlagsUpdate"
					@updateDeadlineUserOption="handleDeadlineUserOptionUpdate"
					@freeze="freeze"
					@unfreeze="unfreeze"
				/>
			</div>
			<div class="tasks-task-settings-popup-footer">
				<UiButton
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_BTN_CANCEL')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:dataset="{
						taskSettingsButtonId: 'cancel',
					}"
					@click="handleClose"
				/>
				<UiButton
					:text="loc('TASKS_V2_TASK_SETTINGS_POPUP_BTN_SAVE')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:dataset="{
						taskSettingsButtonId: 'save',
					}"
					:loading="saving"
					@click="handleSave"
				/>
			</div>
		</Popup>
	`
	};

	exports.TaskSettingsPopup = TaskSettingsPopup;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.Vue3.Components,BX.UI.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2,BX.UI,BX.UI.Vue3.Components,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX,BX,BX.Main,BX.Vue3.Vuex,BX.UI.DatePicker,BX.UI.Vue3.Components,BX.UI.System.Typography.Vue,BX.UI.System.Input.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib));
//# sourceMappingURL=task-settings-popup.bundle.js.map
