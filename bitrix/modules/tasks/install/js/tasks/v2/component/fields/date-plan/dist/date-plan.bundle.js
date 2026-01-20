/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_fieldList,tasks_v2_const,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_fieldAdd,main_core,ui_datePicker,ui_vue3_components_button,ui_system_input_vue,ui_system_menu_vue,tasks_v2_core,tasks_v2_component_elements_bottomSheet,tasks_v2_component_elements_duration,tasks_v2_lib_calendar,tasks_v2_lib_timezone,tasks_v2_provider_service_taskService,tasks_v2_lib_showLimit,ui_system_typography_vue,ui_switcher,ui_vue3_components_switcher,tasks_v2_component_elements_questionMark,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const datePlanMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.DatePlan,
	  title: main_core.Loc.getMessage('TASKS_V2_DATE_PLAN_TITLE')
	});

	const DatePlanDate = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  props: {
	    dateTs: {
	      type: Number,
	      required: true
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      calendar: tasks_v2_lib_calendar.calendar
	    };
	  },
	  template: `
		<div>
			<HoverPill textOnly :readonly>
				<div>{{ calendar.formatDateTime(dateTs, { forceYear: true }) }}</div>
			</HoverPill>
		</div>
	`
	};

	const DatePlanDuration = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  props: {
	    dateTs: {
	      type: Number,
	      required: true
	    },
	    matchWorkTime: {
	      type: Boolean,
	      default: false
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      calendar: tasks_v2_lib_calendar.calendar
	    };
	  },
	  template: `
		<div>
			<HoverPill textOnly :readonly>
				<div>{{ calendar.formatDuration(dateTs, matchWorkTime) }}</div>
			</HoverPill>
		</div>
	`
	};

	const DatePlanContent = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark
	  },
	  inject: {
	    task: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<HoverPill v-if="task.matchesSubTasksTime" textOnly readonly>
			<div class="tasks-field-date-plan-content">
				<div>{{ loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME_STATE') }}</div>
				<QuestionMark :hintText="loc('TASKS_V2_DATE_PLAN_NO_SUBTASKS_HINT')"/>
			</div>
		</HoverPill>
		<FieldAdd v-else :icon="Outline.PLANNING"/>
	`
	};

	// @vue/component
	const DatePlanSwitcher = {
	  components: {
	    TextSm: ui_system_typography_vue.TextSm,
	    Switcher: ui_vue3_components_switcher.Switcher,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    modelValue: {
	      type: Boolean,
	      required: true
	    },
	    text: {
	      type: String,
	      required: true
	    },
	    hint: {
	      type: String,
	      default: ''
	    },
	    lock: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    options() {
	      return {
	        size: ui_switcher.SwitcherSize.extraSmall,
	        useAirDesign: true
	      };
	    }
	  },
	  template: `
		<div class="tasks-field-date-plan-switcher" @click="$emit('update:modelValue', !modelValue)">
			<Switcher :isChecked="modelValue" :options/>
			<TextSm>{{ text }}</TextSm>
			<QuestionMark v-if="hint" :hintText="hint" @click.stop/>
			<BIcon v-if="lock" :name="Outline.LOCK_M" class="tasks-field-date-plan-switcher-lock"/>
		</div>
	`
	};

	const MAX_INT = 2 ** 31;

	// @vue/component
	const DatePlanSheet = {
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button,
	    HeadlineMd: ui_system_typography_vue.HeadlineMd,
	    TextSm: ui_system_typography_vue.TextSm,
	    BInput: ui_system_input_vue.BInput,
	    BMenu: ui_system_menu_vue.BMenu,
	    DatePlanSwitcher,
	    Duration: tasks_v2_component_elements_duration.Duration
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  props: {
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      InputDesign: ui_system_input_vue.InputDesign,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      wasEmpty: false
	    };
	  },
	  data() {
	    return {
	      isEndPicker: false,
	      isEndDuration: false,
	      isPickerShown: false,
	      durationTs: 0,
	      startTs: null,
	      endTs: null,
	      startDatePlanAfter: null,
	      templateDuration: null,
	      matchesWorkTimeTemp: null,
	      matchesSubTasksTimeTemp: null
	    };
	  },
	  computed: {
	    wasFilled() {
	      return this.task.filledFields[datePlanMeta.id];
	    },
	    duration: {
	      get() {
	        return this.durationTs;
	      },
	      set(durationTs) {
	        if (durationTs === this.durationTs) {
	          return;
	        }
	        this.durationTs = durationTs;
	        this.updateRangeFromDuration();
	      }
	    },
	    matchesWorkTime: {
	      get() {
	        var _ref, _this$matchesWorkTime;
	        return this.isMatchesWorkTimeLocked ? false : (_ref = (_this$matchesWorkTime = this.matchesWorkTimeTemp) != null ? _this$matchesWorkTime : this.task.matchesWorkTime) != null ? _ref : false;
	      },
	      set(matchesWorkTime) {
	        if (this.isMatchesWorkTimeLocked) {
	          void tasks_v2_lib_showLimit.showLimit({
	            featureId: tasks_v2_core.Core.getParams().restrictions.skipWeekends.featureId
	          });
	          return;
	        }
	        if (matchesWorkTime === this.matchesWorkTimeTemp) {
	          return;
	        }
	        this.matchesWorkTimeTemp = matchesWorkTime;
	        this.update();
	      }
	    },
	    matchesSubTasksTime: {
	      get() {
	        var _ref2, _this$matchesSubTasks;
	        return this.isMatchesSubTasksTimeLocked ? false : (_ref2 = (_this$matchesSubTasks = this.matchesSubTasksTimeTemp) != null ? _this$matchesSubTasks : this.task.matchesSubTasksTime) != null ? _ref2 : false;
	      },
	      set(matchesSubTasksTime) {
	        if (this.isMatchesSubTasksTimeLocked) {
	          void tasks_v2_lib_showLimit.showLimit({
	            featureId: tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.featureId
	          });
	          return;
	        }
	        this.matchesSubTasksTimeTemp = matchesSubTasksTime;
	      }
	    },
	    allowsChangeDatePlan: {
	      get() {
	        var _this$task$allowsChan;
	        return (_this$task$allowsChan = this.task.allowsChangeDatePlan) != null ? _this$task$allowsChan : false;
	      },
	      set(allowsChangeDatePlan) {
	        void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          allowsChangeDatePlan
	        });
	      }
	    },
	    maxDurationReached() {
	      return this.endTs && this.startTs && Math.floor((this.endTs - this.startTs) / 1000) >= MAX_INT;
	    },
	    inputDesign() {
	      return this.matchesSubTasksTime ? ui_system_input_vue.InputDesign.Disabled : ui_system_input_vue.InputDesign.Grey;
	    },
	    isMatchesWorkTimeLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.skipWeekends.available;
	    },
	    isMatchesSubTasksTimeLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.relatedSubtaskDeadlines.available;
	    },
	    description() {
	      if (this.isTemplate) {
	        return this.loc('TASKS_V2_DATE_PLAN_DESCRIPTION_TEMPLATE');
	      }
	      return this.loc('TASKS_V2_DATE_PLAN_DESCRIPTION');
	    },
	    allowChangeText() {
	      if (this.isTemplate) {
	        return this.loc('TASKS_V2_DATE_PLAN_ALLOW_CHANGE_TEMPLATE');
	      }
	      return this.loc('TASKS_V2_DATE_PLAN_ALLOW_CHANGE');
	    },
	    matchWorkTimeHint() {
	      if (this.isTemplate) {
	        return this.loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME_HINT_TEMPLATE');
	      }
	      return this.loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME_HINT');
	    }
	  },
	  created() {
	    this.wasEmpty = !this.wasFilled;
	    this.updateDuration(this.task.startPlanTs, this.task.endPlanTs);
	    this.startDatePlanAfter = this.task.startDatePlanAfter;
	    this.templateDuration = this.task.endDatePlanAfter - this.task.startDatePlanAfter;
	  },
	  methods: {
	    clearStart() {
	      this.duration = 0;
	      this.updatePlan(null, this.endTs);
	    },
	    clearEnd() {
	      this.duration = 0;
	      this.updatePlan(this.startTs, null);
	    },
	    handleDateClick({
	      currentTarget
	    }, {
	      isEnd
	    }) {
	      this.updateDuration(this.startTs, this.endTs);
	      this.isEndPicker = isEnd;
	      const datePicker = this.getDatePicker();
	      datePicker.setTargetNode(currentTarget);
	      datePicker.show();
	      if (this.isEndPicker && this.endTs) {
	        datePicker.setFocusDate(this.endTs + tasks_v2_lib_timezone.timezone.getOffset(this.endTs));
	      }
	    },
	    getDatePicker() {
	      var _this$handlePickerCha, _this$datePicker;
	      (_this$handlePickerCha = this.handlePickerChangedDebounced) != null ? _this$handlePickerCha : this.handlePickerChangedDebounced = main_core.Runtime.debounce(this.handlePickerChanged, 10, this);
	      (_this$datePicker = this.datePicker) != null ? _this$datePicker : this.datePicker = new ui_datePicker.DatePicker({
	        enableTime: true,
	        selectionMode: 'range',
	        defaultTime: tasks_v2_lib_calendar.calendar.dayEndTime,
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
	          [ui_datePicker.DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
	          onShow: () => {
	            this.isPickerShown = true;
	          },
	          onHide: () => {
	            this.isPickerShown = false;
	          }
	        },
	        popupOptions: {
	          animation: 'fading',
	          targetContainer: this.sheetBindProps.getTargetContainer()
	        }
	      });
	      return this.datePicker;
	    },
	    handlePickerChanged() {
	      let startPlanTs = this.preparePickerTimestamp(this.datePicker.getRangeStart());
	      let endPlanTs = this.preparePickerTimestamp(this.datePicker.getRangeEnd());
	      if (this.isEndPicker && !endPlanTs && !this.startTs) {
	        [startPlanTs, endPlanTs] = [null, startPlanTs];
	      }
	      if (startPlanTs && !this.startTs) {
	        startPlanTs = tasks_v2_lib_calendar.calendar.setHours(startPlanTs, tasks_v2_lib_calendar.calendar.workdayStart.H, tasks_v2_lib_calendar.calendar.workdayStart.M);
	      }
	      this.updateDuration(startPlanTs, endPlanTs);
	    },
	    updateDuration(startTs, endTs) {
	      const [start, end] = this.prepareRange(startTs, endTs);
	      if (!start || !end) {
	        this.duration = 0;
	        this.updatePlan(start, end);
	        return;
	      }
	      this.duration = this.matchesWorkTime ? tasks_v2_lib_calendar.calendar.calculateDuration(start, end) : end - start;
	      this.updatePlan(start, end);
	    },
	    update() {
	      const [startPlanTs, endPlanTs] = this.prepareRange(this.startTs, this.endTs);
	      if (startPlanTs && endPlanTs) {
	        this.updateRangeFromDuration();
	      } else {
	        this.updatePlan(startPlanTs, endPlanTs);
	      }
	    },
	    updateRangeFromDuration() {
	      let [startPlanTs, endPlanTs] = this.prepareRange(this.startTs, this.endTs);
	      if (!startPlanTs && !endPlanTs) {
	        return;
	      }
	      if (this.isEndDuration) {
	        startPlanTs = null;
	      }
	      if (this.matchesWorkTime) {
	        startPlanTs = tasks_v2_lib_calendar.calendar.calculateStartTs(startPlanTs, endPlanTs, this.duration);
	        endPlanTs = tasks_v2_lib_calendar.calendar.calculateEndTs(startPlanTs, endPlanTs, this.duration);
	      } else {
	        var _startPlanTs;
	        (_startPlanTs = startPlanTs) != null ? _startPlanTs : startPlanTs = endPlanTs - this.duration;
	        endPlanTs = startPlanTs + this.duration;
	      }
	      this.updatePlan(startPlanTs, endPlanTs);
	    },
	    updatePlan(startPlanTs, endPlanTs) {
	      this.startTs = startPlanTs;
	      this.endTs = endPlanTs;
	      if (this.maxDurationReached) {
	        return;
	      }
	      const datePicker = this.getDatePicker();
	      const options = {
	        emitEvents: false
	      };
	      if (startPlanTs || endPlanTs) {
	        const rangeStart = startPlanTs + tasks_v2_lib_timezone.timezone.getOffset(startPlanTs);
	        const rangeEnd = endPlanTs ? endPlanTs + tasks_v2_lib_timezone.timezone.getOffset(endPlanTs) : null;
	        if (startPlanTs) {
	          datePicker.selectRange(rangeStart, rangeEnd, options);
	        } else {
	          datePicker.selectRange(rangeEnd, null, options);
	        }
	      } else {
	        datePicker.deselectAll(options);
	      }
	    },
	    prepareRange(startTs, endTs) {
	      if (this.matchesWorkTime) {
	        return [tasks_v2_lib_calendar.calendar.clampWorkDateTime(startTs), tasks_v2_lib_calendar.calendar.clampWorkDateTime(endTs)];
	      }
	      return [startTs, endTs];
	    },
	    preparePickerTimestamp(date) {
	      if (!date) {
	        return null;
	      }
	      const dateTs = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
	      return dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs);
	    },
	    formatDate(timestamp) {
	      return tasks_v2_lib_calendar.calendar.formatDateTime(timestamp, {
	        forceYear: true
	      });
	    },
	    close() {
	      if (this.isTemplate) {
	        void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          startDatePlanAfter: this.startDatePlanAfter,
	          endDatePlanAfter: this.startDatePlanAfter + this.templateDuration,
	          matchesWorkTime: this.matchesWorkTime
	        });
	      } else if (!this.maxDurationReached) {
	        void tasks_v2_provider_service_taskService.taskService.update(this.taskId, Object.fromEntries(Object.entries({
	          startPlanTs: this.matchesSubTasksTime ? undefined : this.startTs,
	          endPlanTs: this.matchesSubTasksTime ? undefined : this.endTs,
	          matchesWorkTime: this.matchesWorkTime,
	          matchesSubTasksTime: this.matchesSubTasksTime
	        }).filter(([, value]) => !main_core.Type.isUndefined(value))));
	      }
	      if (this.wasEmpty && this.wasFilled) {
	        void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
	      }
	      this.$emit('close');
	    }
	  },
	  template: `
		<BottomSheet :sheetBindProps @close="close">
			<div class="tasks-field-date-plan-sheet">
				<div class="tasks-field-date-plan-header">
					<HeadlineMd>{{ loc('TASKS_V2_DATE_PLAN_TITLE_SHEET') }}</HeadlineMd>
					<BIcon class="tasks-field-date-plan-close" :name="Outline.CROSS_L" hoverable @click="close"/>
				</div>
				<TextSm class="tasks-field-date-plan-description">{{ description }}</TextSm>
				<div class="tasks-field-date-plan-fields">
					<template v-if="isTemplate">
						<Duration
							v-model="startDatePlanAfter"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_START_AFTER')"
							:design="inputDesign"
						/>
						<Duration
							v-model="templateDuration"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_DURATION')"
							:design="inputDesign"
						/>
					</template>
					<template v-else>
						<BInput
							:modelValue="formatDate(startTs)"
							:label="loc('TASKS_V2_DATE_PLAN_START')"
							:design="inputDesign"
							:icon="Outline.CALENDAR_WITH_SLOTS"
							:withClear="Boolean(startTs)"
							clickable
							:active="isPickerShown && !isEndPicker"
							:data-task-plan-start="startTs"
							@clear="clearStart"
							@click="handleDateClick($event, { isEnd: false })"
						/>
						<BInput
							:modelValue="formatDate(endTs)"
							:label="loc('TASKS_V2_DATE_PLAN_END')"
							:design="inputDesign"
							:icon="Outline.CALENDAR_WITH_SLOTS"
							:withClear="Boolean(endTs)"
							clickable
							:active="isPickerShown && isEndPicker"
							:data-task-plan-end="endTs"
							@clear="clearEnd"
							@click="handleDateClick($event, { isEnd: true })"
						/>
						<Duration
							v-model="duration"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_DURATION')"
							:design="inputDesign"
							:error="maxDurationReached ? ' ' : null"
							:maxValue="Infinity"
							@focus="isEndDuration = !startTs"
							@blur="isEndDuration = false"
						/>
					</template>
				</div>
				<div class="tasks-field-date-plan-switchers">
					<DatePlanSwitcher
						v-if="task.rights.edit"
						v-model="allowsChangeDatePlan"
						:text="allowChangeText"
					/>
					<DatePlanSwitcher
						v-model="matchesWorkTime"
						:text="loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME')"
						:hint="matchWorkTimeHint"
						:lock="isMatchesWorkTimeLocked"
					/>
					<DatePlanSwitcher
						v-if="!isTemplate"
						v-model="matchesSubTasksTime"
						:text="loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME')"
						:hint="loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME_HINT')"
						:lock="isMatchesSubTasksTimeLocked"
					/>
				</div>
				<div class="tasks-field-date-plan-footer">
					<UiButton
						:text="loc('TASKS_V2_DATE_PLAN_BUTTON_SAVE')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						@click="close"
					/>
				</div>
			</div>
		</BottomSheet>
	`
	};

	// @vue/component
	const DatePlan = {
	  components: {
	    FieldList: tasks_v2_component_elements_fieldList.FieldList,
	    DatePlanSheet
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown'],
	  setup() {
	    return {
	      datePlanMeta
	    };
	  },
	  computed: {
	    fields() {
	      if (this.isTemplate) {
	        const isEmpty = !this.task.startDatePlanAfter && !this.task.endDatePlanAfter;
	        if (isEmpty) {
	          return [{
	            title: datePlanMeta.title,
	            component: DatePlanContent
	          }];
	        }
	        return [{
	          title: this.loc('TASKS_V2_DATE_PLAN_START_AFTER'),
	          component: DatePlanDuration,
	          props: {
	            dateTs: this.task.startDatePlanAfter,
	            matchWorkTime: this.task.matchesWorkTime,
	            readonly: this.readonly
	          }
	        }, {
	          title: this.loc('TASKS_V2_DATE_PLAN_DURATION'),
	          component: DatePlanDuration,
	          props: {
	            dateTs: this.task.endDatePlanAfter - this.task.startDatePlanAfter,
	            matchWorkTime: this.task.matchesWorkTime,
	            readonly: this.readonly
	          }
	        }].filter(({
	          props: {
	            dateTs
	          }
	        }) => dateTs);
	      }
	      const isEmpty = !this.task.startPlanTs && !this.task.endPlanTs;
	      if (isEmpty && (this.task.filledFields[datePlanMeta.id] || this.task.matchesSubTasksTime)) {
	        return [{
	          title: datePlanMeta.title,
	          component: DatePlanContent
	        }];
	      }
	      return [{
	        title: this.loc('TASKS_V2_DATE_PLAN_FIELD_START'),
	        component: DatePlanDate,
	        props: {
	          dateTs: this.task.startPlanTs,
	          readonly: this.readonly
	        }
	      }, {
	        title: this.loc('TASKS_V2_DATE_PLAN_FIELD_END'),
	        component: DatePlanDate,
	        props: {
	          dateTs: this.task.endPlanTs,
	          readonly: this.readonly
	        }
	      }].filter(({
	        props: {
	          dateTs
	        }
	      }) => dateTs);
	    },
	    readonly() {
	      return !this.task.rights.datePlan;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.readonly) {
	        this.setSheetShown(true);
	      }
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    }
	  },
	  template: `
		<div
			class="tasks-field-date-plan"
			:class="{ '--readonly': readonly }"
			:data-task-id="taskId"
			:data-task-field-id="datePlanMeta.id"
			:data-task-plan-start="task.startPlanTs"
			:data-task-plan-end="task.endPlanTs"
			@click="handleClick"
		>
			<FieldList :fields/>
		</div>
		<DatePlanSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
	`
	};

	// @vue/component
	const DatePlanChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    DatePlanSheet
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      datePlanMeta
	    };
	  },
	  computed: {
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[datePlanMeta.id];
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      this.setSheetShown(true);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    }
	  },
	  template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:icon="Outline.PLANNING"
			:text="loc('TASKS_V2_DATE_PLAN_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="datePlanMeta.id"
			:data-task-plan-start="task.startPlanTs"
			:data-task-plan-end="task.endPlanTs"
			@click="handleClick"
		/>
		<DatePlanSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
	`
	};

	exports.DatePlan = DatePlan;
	exports.DatePlanChip = DatePlanChip;
	exports.DatePlanSheet = DatePlanSheet;
	exports.datePlanMeta = datePlanMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX,BX.UI.DatePicker,BX.Vue3.Components,BX.UI.System.Input.Vue,BX.UI.System.Menu,BX.Tasks.V2,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Lib,BX.UI.System.Typography.Vue,BX.UI,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Lib));
//# sourceMappingURL=date-plan.bundle.js.map
