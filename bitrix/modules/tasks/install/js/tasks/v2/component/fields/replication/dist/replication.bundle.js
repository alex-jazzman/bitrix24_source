/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_system_skeleton_vue,tasks_v2_component_elements_fieldAdd,tasks_v2_component_elements_uiTabs,tasks_v2_component_elements_checkbox,ui_vue3,tasks_v2_component_elements_questionMark,tasks_v2_component_elements_select,tasks_v2_component_fields_replication,ui_vue3_components_popup,ui_system_input_vue,tasks_v2_component_elements_radio,ui_datePicker,tasks_v2_lib_calendar,tasks_v2_component_fields_deadline,ui_vue3_components_richLoc,ui_system_menu_vue,tasks_v2_component_elements_hoverPill,ui_vue3_components_button,tasks_v2_provider_service_taskService,tasks_v2_component_elements_bottomSheet,ui_system_typography_vue,main_core,main_core_events,main_popup,tasks_v2_const,tasks_v2_lib_apiClient,main_date,tasks_v2_lib_timezone,ui_vue3_directives_hint,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_lib_fieldHighlighter,tasks_v2_component_elements_hint,tasks_v2_lib_idUtils,tasks_v2_lib_showLimit) {
	'use strict';

	const replicationMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Replication
	});

	function getWeekDayGender(weekDay) {
	  if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Sunday) {
	    return '';
	  }
	  if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Monday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Tuesday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Thursday) {
	    return '_M';
	  }
	  return '_F';
	}

	var _replicateParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replicateParams");
	class PeriodRuleDailyGenerator {
	  constructor(replicateParams) {
	    Object.defineProperty(this, _replicateParams, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _replicateParams)[_replicateParams] = replicateParams;
	  }
	  generate() {
	    const dailyMonthInterval = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams)[_replicateParams].dailyMonthInterval;
	    const everyDay = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams)[_replicateParams].everyDay || 1;
	    if (dailyMonthInterval > 0) {
	      return main_core.Loc.getMessage('TASKS_V2_REPLICATION_MONTHLY_2', {
	        '#DAY_NUMBER#': main_date.DateTimeFormat.format('ddiff', 0, everyDay * 60 * 60 * 24, true),
	        '#WEEKDAY_NAME#': '',
	        '#NUMBER#': ` ${dailyMonthInterval + 1}`
	      });
	    }
	    return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DAILY', everyDay, {
	      '#NUMBER#': everyDay > 1 ? ` ${everyDay}` : ''
	    });
	  }
	}

	var _replicateParams$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replicateParams");
	var _weekDays = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("weekDays");
	class PeriodRuleWeeklyGenerator {
	  constructor(replicateParams) {
	    Object.defineProperty(this, _weekDays, {
	      get: _get_weekDays,
	      set: void 0
	    });
	    Object.defineProperty(this, _replicateParams$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$1)[_replicateParams$1] = replicateParams;
	  }
	  generate() {
	    const everyWeek = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$1)[_replicateParams$1].everyWeek || 1;
	    const weekDaysLabel = babelHelpers.classPrivateFieldLooseBase(this, _weekDays)[_weekDays].length === 7 ? main_core.Loc.getMessage('TASKS_V2_REPLICATION_WEEKLY_EVERYDAY') : babelHelpers.classPrivateFieldLooseBase(this, _weekDays)[_weekDays].map(wd => main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_${wd}`)).join(', ');
	    return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_WEEKLY', everyWeek, {
	      '#NUMBER#': everyWeek > 1 ? ` ${everyWeek}` : '',
	      '#WEEKDAYS#': ` (${weekDaysLabel})`
	    });
	  }
	}
	function _get_weekDays() {
	  const weekDays = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$1)[_replicateParams$1].weekDays;
	  return [...((weekDays == null ? void 0 : weekDays.length) > 0 ? weekDays : [1])].sort();
	}

	var _replicateParams$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replicateParams");
	var _generateAbsolute = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateAbsolute");
	var _generateRelative = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateRelative");
	var _getLocaleMonthlyOfDayType2Alt = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLocaleMonthlyOfDayType2Alt");
	class PeriodRuleMonthlyGenerator {
	  constructor(replicateParams) {
	    Object.defineProperty(this, _getLocaleMonthlyOfDayType2Alt, {
	      value: _getLocaleMonthlyOfDayType2Alt2
	    });
	    Object.defineProperty(this, _generateRelative, {
	      value: _generateRelative2
	    });
	    Object.defineProperty(this, _generateAbsolute, {
	      value: _generateAbsolute2
	    });
	    Object.defineProperty(this, _replicateParams$2, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2] = replicateParams;
	  }
	  generate() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute ? babelHelpers.classPrivateFieldLooseBase(this, _generateAbsolute)[_generateAbsolute]() : babelHelpers.classPrivateFieldLooseBase(this, _generateRelative)[_generateRelative]();
	  }
	}
	function _generateAbsolute2() {
	  const monthlyMonthNum = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyMonthNum1 || 1;
	  return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_MONTHLY_1', monthlyMonthNum, {
	    '#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : '',
	    '#DAY_NUMBER#': babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyDayNum
	  });
	}
	function _generateRelative2() {
	  const monthlyWeekDay = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyWeekDay;
	  const weekDayNum = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyWeekDayNum;
	  const localePostfix = getWeekDayGender(monthlyWeekDay);
	  const dayNumber = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${weekDayNum}${localePostfix}`);
	  const weekDay = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${monthlyWeekDay + 1}`);
	  const monthlyMonthNum = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyMonthNum2 || 1;
	  return main_core.Loc.getMessage(`TASKS_V2_REPLICATION_MONTHLY_2${babelHelpers.classPrivateFieldLooseBase(this, _getLocaleMonthlyOfDayType2Alt)[_getLocaleMonthlyOfDayType2Alt]()}`, {
	    '#DAY_NUMBER#': dayNumber,
	    '#WEEKDAY_NAME#': weekDay,
	    '#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : ''
	  });
	}
	function _getLocaleMonthlyOfDayType2Alt2() {
	  const weekDay = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$2)[_replicateParams$2].monthlyWeekDay;
	  if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Sunday) {
	    return '_ALT_1';
	  }
	  if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Wednesday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Friday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Saturday) {
	    return '_ALT_0';
	  }
	  return '';
	}

	var _replicateParams$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replicateParams");
	var _generateAbsolute$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateAbsolute");
	var _generateRelative$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("generateRelative");
	var _getLocaleType2Alt = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLocaleType2Alt");
	class PeriodRuleYearlyGenerator {
	  constructor(replicateParams) {
	    Object.defineProperty(this, _getLocaleType2Alt, {
	      value: _getLocaleType2Alt2
	    });
	    Object.defineProperty(this, _generateRelative$1, {
	      value: _generateRelative2$1
	    });
	    Object.defineProperty(this, _generateAbsolute$1, {
	      value: _generateAbsolute2$1
	    });
	    Object.defineProperty(this, _replicateParams$3, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3] = replicateParams;
	  }
	  generate() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyType === tasks_v2_const.ReplicationYearlyType.Absolute ? babelHelpers.classPrivateFieldLooseBase(this, _generateAbsolute$1)[_generateAbsolute$1]() : babelHelpers.classPrivateFieldLooseBase(this, _generateRelative$1)[_generateRelative$1]();
	  }
	}
	function _generateAbsolute2$1() {
	  const yearlyDayNum = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyDayNum || 1;
	  const yearlyMonth = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyMonth1 || 1;
	  return main_core.Loc.getMessage('TASKS_V2_REPLICATION_YEARLY_1', {
	    '#NUMBER#': ` ${yearlyDayNum}`,
	    '#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
	  });
	}
	function _generateRelative2$1() {
	  const yearlyWeekDayNum = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyWeekDayNum || 0;
	  const yearlyWeekDay = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyWeekDay || 0;
	  const yearlyMonth = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyMonth2 || 1;
	  const dayNumberLabel = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${yearlyWeekDayNum}${getWeekDayGender(yearlyWeekDay - 1)}`);
	  return main_core.Loc.getMessage(`TASKS_V2_REPLICATION_YEARLY_2${babelHelpers.classPrivateFieldLooseBase(this, _getLocaleType2Alt)[_getLocaleType2Alt]()}`, {
	    '#DAY_NUMBER#': dayNumberLabel,
	    '#WEEK_DAY#': main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${yearlyWeekDay}`),
	    '#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
	  });
	}
	function _getLocaleType2Alt2() {
	  const weekDay = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$3)[_replicateParams$3].yearlyWeekDay;
	  if (weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Sunday) {
	    return '_ALT_1';
	  }
	  if (weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Wednesday || weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Saturday || weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Friday) {
	    return '_ALT_0';
	  }
	  return '';
	}

	class TimeStringConverter {
	  static format(timestamp) {
	    return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), (timestamp + tasks_v2_lib_timezone.timezone.getOffset(timestamp)) / 1000);
	  }
	  static parseServerTime(serverTimeString) {
	    return main_core.Type.isStringFilled(serverTimeString) ? serverTimeString : tasks_v2_lib_calendar.calendar.dayStartTime;
	  }
	  static applyTimeToDate(date, timeString) {
	    const [hours, minutes] = timeString.split(':');
	    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
	    return date;
	  }
	  static convertTsToServerTimeString(browserTs) {
	    const serverTs = main_date.Timezone.BrowserTime.toServer(browserTs / 1000);
	    return main_date.DateTimeFormat.format('H:i', serverTs);
	  }
	}

	var _replicateParams$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("replicateParams");
	var _periodRuleGenerator = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("periodRuleGenerator");
	var _setPeriodRuleGenerator = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setPeriodRuleGenerator");
	var _getStartTimeRule = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStartTimeRule");
	var _getEndRule = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEndRule");
	class ReplicateRuleGenerator {
	  constructor(replicateParams) {
	    Object.defineProperty(this, _getEndRule, {
	      value: _getEndRule2
	    });
	    Object.defineProperty(this, _getStartTimeRule, {
	      value: _getStartTimeRule2
	    });
	    Object.defineProperty(this, _setPeriodRuleGenerator, {
	      value: _setPeriodRuleGenerator2
	    });
	    Object.defineProperty(this, _replicateParams$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _periodRuleGenerator, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4] = replicateParams;
	    babelHelpers.classPrivateFieldLooseBase(this, _setPeriodRuleGenerator)[_setPeriodRuleGenerator](replicateParams.period);
	  }
	  generate() {
	    return [babelHelpers.classPrivateFieldLooseBase(this, _periodRuleGenerator)[_periodRuleGenerator].generate(), babelHelpers.classPrivateFieldLooseBase(this, _getStartTimeRule)[_getStartTimeRule](), babelHelpers.classPrivateFieldLooseBase(this, _getEndRule)[_getEndRule]()].join(' ');
	  }
	}
	function _setPeriodRuleGenerator2(period) {
	  switch (period) {
	    case tasks_v2_const.ReplicationPeriod.Weekly:
	      {
	        babelHelpers.classPrivateFieldLooseBase(this, _periodRuleGenerator)[_periodRuleGenerator] = new PeriodRuleWeeklyGenerator(babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4]);
	        break;
	      }
	    case tasks_v2_const.ReplicationPeriod.Monthly:
	      {
	        babelHelpers.classPrivateFieldLooseBase(this, _periodRuleGenerator)[_periodRuleGenerator] = new PeriodRuleMonthlyGenerator(babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4]);
	        break;
	      }
	    case tasks_v2_const.ReplicationPeriod.Yearly:
	      {
	        babelHelpers.classPrivateFieldLooseBase(this, _periodRuleGenerator)[_periodRuleGenerator] = new PeriodRuleYearlyGenerator(babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4]);
	        break;
	      }
	    default:
	      {
	        babelHelpers.classPrivateFieldLooseBase(this, _periodRuleGenerator)[_periodRuleGenerator] = new PeriodRuleDailyGenerator(babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4]);
	      }
	  }
	}
	function _getStartTimeRule2() {
	  const timeTs = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4].startTs;
	  return main_core.Loc.getMessage('TASKS_V2_REPLICATION_START_TIME', {
	    '#TIME#': TimeStringConverter.format(timeTs)
	  });
	}
	function _getEndRule2() {
	  const repeatTill = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4].repeatTill;
	  if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Times) {
	    const times = babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4].times;
	    return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_END_AFTER_REPETITIONS', times, {
	      '#COUNT#': times
	    });
	  }
	  if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Date && babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4].endTs) {
	    return main_core.Loc.getMessage('TASKS_V2_REPLICATION_END_DATE', {
	      '#DATE#': main_date.DateTimeFormat.format('d.m.Y', new Date(babelHelpers.classPrivateFieldLooseBase(this, _replicateParams$4)[_replicateParams$4].endTs))
	    });
	  }
	  return '';
	}

	// @vue/component
	const ReplicationContentState = {
	  name: 'ReplicationContentState',
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  setup() {},
	  computed: {
	    readonly() {
	      return !this.isTemplate || !this.task.rights.edit;
	    },
	    ruleFormatted() {
	      return new ReplicateRuleGenerator(this.task.replicateParams).generate();
	    }
	  },
	  methods: {
	    dontReplicate() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        replicate: false,
	        replicateParams: this.task.replicateParams
	      });
	    }
	  },
	  template: `
		<HoverPill :readonly withClear textOnly noOffset style="width: auto" @clear="dontReplicate">
			<TextMd>{{ ruleFormatted }}</TextMd>
		</HoverPill>
	`
	};

	// @vue/component
	const ReplicationContent = {
	  name: 'ReplicationContent',
	  components: {
	    ReplicationContentState,
	    TextSm: ui_system_typography_vue.TextSm,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    isTemplate: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    disabled() {
	      return this.isTemplate && (this.task.isForNewUser || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
	    },
	    tooltip() {
	      if (!this.disabled) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_REPLICATION_TEMPLATE_NOTICE', {
	          '#TPARAM_FOR_NEW_USER#': this.loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER')
	        }),
	        popupOptions: {
	          offsetLeft: this.$refs.add.$el.offsetWidth / 2
	        },
	        timeout: 200
	      });
	    }
	  },
	  template: `
		<div class="tasks-field-replication-wrapper">
			<div class="tasks-field-replication-title">
				<TextSm style="color: var(--ui-color-base-3)">{{ loc('TASKS_V2_REPLICATION_TITLE') }}</TextSm>
			</div>
			<div class="tasks-field-replication-content">
				<ReplicationContentState v-if="task.replicate"/>
				<FieldAdd v-else v-hint="tooltip" :icon="Outline.REPEAT" :disabled ref="add"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ReplicationInterval = {
	  name: 'ReplicationInterval',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    BInput: ui_system_input_vue.BInput,
	    TextXs: ui_system_typography_vue.TextXs,
	    UiCheckbox: tasks_v2_component_elements_checkbox.Checkbox
	  },
	  props: {
	    interval: {
	      type: Number,
	      required: true
	    },
	    useInterval: {
	      type: Boolean,
	      default: false
	    },
	    period: {
	      type: String,
	      default: tasks_v2_const.ReplicationPeriod.Daily,
	      validator: value => {
	        return [tasks_v2_const.ReplicationPeriod.Daily, tasks_v2_const.ReplicationPeriod.Weekly, tasks_v2_const.ReplicationPeriod.Monthly].includes(value);
	      }
	    }
	  },
	  emits: ['update:interval', 'update:useInterval'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      InputSize: ui_system_input_vue.InputSize
	    };
	  },
	  data() {
	    return {
	      prevInterval: this.interval
	    };
	  },
	  computed: {
	    useIntervalValue: {
	      get() {
	        return this.useInterval;
	      },
	      set(value) {
	        this.$emit('update:useInterval', value);
	      }
	    },
	    intervalValue: {
	      get() {
	        var _this$interval;
	        return ((_this$interval = this.interval) == null ? void 0 : _this$interval.toString()) || '';
	      },
	      set(value = '') {
	        var _parseInt;
	        let interval = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) != null ? _parseInt : 0;
	        if (!main_core.Type.isInteger(interval) || interval < 1) {
	          interval = this.prevInterval;
	        }
	        this.prevInterval = interval;
	        this.$emit('update:interval', interval);
	      }
	    },
	    intervalPeriod() {
	      const getMess = period => {
	        switch (period) {
	          case tasks_v2_const.ReplicationPeriod.Weekly:
	            return 'TASKS_V2_REPLICATION_SETTINGS_WEEK';
	          case tasks_v2_const.ReplicationPeriod.Monthly:
	            return 'TASKS_V2_REPLICATION_SETTINGS_MONTH';
	          default:
	            return 'TASKS_V2_REPLICATION_SETTINGS_DAY';
	        }
	      };
	      return main_core.Loc.getMessagePlural(getMess(this.period), this.interval);
	    }
	  },
	  template: `
		<div class="tasks-replication-sheet-action-row" :class="{'--active': useInterval}">
			<UiCheckbox :checked="useIntervalValue" @click="useIntervalValue = !useInterval"/>
			<RichLoc
				class="tasks-field-replication-row --text"
				:text="loc('TASKS_V2_REPLICATION_SETTINGS_INTERVAL')"
				placeholder="[interval/]"
			>
				<template #interval>
					<RichLoc class="tasks-field-replication-row" :text="intervalPeriod" placeholder="[value/]">
						<template #value>
							<BInput
								v-model="intervalValue"
								:size="InputSize.Sm"
								:design="useInterval ? InputDesign.Grey : InputDesign.Disabled"
								:disabled="!useInterval"
								style="width: 5em; padding-bottom: 0;"
							/>
						</template>
					</RichLoc>
				</template>
			</RichLoc>
			<div class="tasks-field-replication-row-grow"></div>
			<slot name="hint"/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsDay = {
	  name: 'ReplicationSettingsDay',
	  components: {
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    ReplicationInterval
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  computed: {
	    period() {
	      return ui_vue3.markRaw(tasks_v2_const.ReplicationPeriod.Daily);
	    },
	    useInterval: {
	      get() {
	        return this.replicateParams.everyDay > 0;
	      },
	      set(useInterval) {
	        this.$emit('update', {
	          everyDay: useInterval ? 1 : null
	        });
	      }
	    },
	    interval: {
	      get() {
	        return this.replicateParams.everyDay || 1;
	      },
	      set(value) {
	        this.$emit('update', {
	          everyDay: value
	        });
	      }
	    },
	    hintText() {
	      return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_SETTINGS_DAY_HINT', this.interval, {
	        '#COUNT#': this.interval
	      });
	    },
	    monthPeriod() {
	      return ui_vue3.markRaw(tasks_v2_const.ReplicationPeriod.Monthly);
	    },
	    useMonthInterval: {
	      get() {
	        return this.replicateParams.dailyMonthInterval > 0;
	      },
	      set(useInterval) {
	        this.$emit('update', {
	          dailyMonthInterval: useInterval ? 1 : null
	        });
	      }
	    },
	    monthInterval: {
	      get() {
	        return this.replicateParams.dailyMonthInterval || 1;
	      },
	      set(value) {
	        this.$emit('update', {
	          dailyMonthInterval: value
	        });
	      }
	    },
	    monthHintText() {
	      return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_SETTINGS_MONTH_HINT', this.monthInterval, {
	        '#COUNT#': this.monthInterval
	      });
	    }
	  },
	  template: `
		<div class="tasks-replication-sheet-replication-settings-day tasks-field-replication-sheet__stack">
			<ReplicationInterval
				v-model:useInterval="useInterval"
				v-model:interval="interval"
				:period
			>
				<template #hint>
					<QuestionMark
						class="tasks-replication-sheet-action-row__hint"
						:hintText
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
			<ReplicationInterval
				v-model:useInterval="useMonthInterval"
				v-model:interval="monthInterval"
				:period="monthPeriod"
			>
				<template #hint>
					<QuestionMark
						class="tasks-replication-sheet-action-row__hint"
						:hintText="monthHintText"
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
		</div>
	`
	};

	const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const weekValues = {
	  Mon: 1,
	  Tue: 2,
	  Wed: 3,
	  Thu: 4,
	  Fri: 5,
	  Sat: 6,
	  Sun: 7
	};

	// @vue/component
	const ReplicationSettingsWeekDaysList = {
	  name: 'ReplicationSettingsWeekDaysList',
	  components: {
	    UiCheckbox: tasks_v2_component_elements_checkbox.Checkbox,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  props: {
	    selectedDays: {
	      /** @type{number[]} */
	      type: Array,
	      required: true
	    }
	  },
	  emits: ['update:selectedDays'],
	  computed: {
	    weekDays() {
	      const weekIndices = {
	        SU: 0,
	        MO: 1,
	        TU: 2,
	        WE: 3,
	        TH: 4,
	        FR: 5,
	        SA: 6
	      };
	      const weekStartIndex = weekIndices[tasks_v2_lib_calendar.calendar.weekStart];
	      return [week.slice(weekStartIndex), week.slice(0, weekStartIndex)].flat(1);
	    },
	    dayLabelMap() {
	      const format = 'D';
	      const todayDayIndex = new Date().getDay();
	      return this.weekDays.map(day => {
	        const dayDate = new Date();
	        const dayDifference = (week.indexOf(day) - todayDayIndex) % 7;
	        dayDate.setDate(dayDate.getDate() + dayDifference);
	        return {
	          label: main_date.DateTimeFormat.format(format, dayDate),
	          value: weekValues[day]
	        };
	      });
	    }
	  },
	  methods: {
	    changeDay(day) {
	      if (this.selectedDays.includes(day)) {
	        this.$emit('update:selectedDays', this.selectedDays.filter(d => d !== day));
	      } else {
	        this.$emit('update:selectedDays', [...this.selectedDays, day]);
	      }
	    }
	  },
	  template: `
		<div class="tasks-replication-sheet-action-row --weekdays">
			<label
				v-for="day in dayLabelMap"
				:key="day.value"
				class="tasks-field-replication-weekday"
				:data-id="'tasks-replication-week-day-' + day.value"
			>
				<UiCheckbox tag="span" :checked="selectedDays.includes(day.value)" @click="changeDay(day.value)"/>
				<TextXs :className="['tasks-field-replication-weekday-text', {
					'--checked': selectedDays.includes(day.value),
				}]">
					{{ day.label }}
				</TextXs>
			</label>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsWeek = {
	  name: 'ReplicationSettingsWeek',
	  components: {
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    ReplicationInterval,
	    ReplicationSettingsWeekDaysList
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  computed: {
	    period() {
	      return ui_vue3.markRaw(tasks_v2_const.ReplicationPeriod.Weekly);
	    },
	    useInterval: {
	      get() {
	        return this.replicateParams.everyWeek > 0;
	      },
	      set(useInterval) {
	        this.$emit('update', {
	          everyWeek: useInterval ? 1 : null
	        });
	      }
	    },
	    interval: {
	      get() {
	        return this.replicateParams.everyWeek || 1;
	      },
	      set(value) {
	        this.$emit('update', {
	          everyWeek: value
	        });
	      }
	    },
	    weekDays: {
	      get() {
	        return this.replicateParams.weekDays;
	      },
	      set(weekDays) {
	        this.$emit('update', {
	          weekDays
	        });
	      }
	    },
	    hintText() {
	      return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_SETTINGS_WEEK_HINT', this.interval, {
	        '#COUNT#': this.interval
	      });
	    }
	  },
	  template: `
		<div class="tasks-replication-sheet-replication-settings-week tasks-field-replication-sheet__stack">
			<ReplicationSettingsWeekDaysList v-model:selectedDays="weekDays"/>
			<ReplicationInterval
				v-model:useInterval="useInterval"
				v-model:interval="interval"
				:period
			>
				<template #hint>
					<QuestionMark
						:hintText
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsMonthlyByDayOfMonth = {
	  name: 'ReplicationSettingsMonthlyByDayOfMonth',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    BInput: ui_system_input_vue.BInput,
	    TextXs: ui_system_typography_vue.TextXs,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio
	  },
	  props: {
	    monthlyType: {
	      type: Number,
	      required: true
	    },
	    dayNumber: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['update:monthlyType', 'update:dayNumber'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      InputSize: ui_system_input_vue.InputSize,
	      ReplicationMonthlyType: tasks_v2_const.ReplicationMonthlyType
	    };
	  },
	  data() {
	    return {
	      prevDayNumber: 0
	    };
	  },
	  computed: {
	    disabled() {
	      return this.monthlyType !== tasks_v2_const.ReplicationMonthlyType.Absolute;
	    }
	  },
	  mounted() {
	    this.prevDayNumber = this.dayNumber;
	  },
	  methods: {
	    updateDayNumber(dayNumber = '') {
	      var _parseInt;
	      let days = (_parseInt = parseInt(dayNumber.replaceAll(/\D/g, ''), 10)) != null ? _parseInt : 0;
	      if (!Number.isInteger(days) || days < 1 || days > 31) {
	        days = this.prevDayNumber;
	      }
	      this.prevDayNumber = days;
	      this.$emit('update:dayNumber', days);
	    }
	  },
	  template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:monthlyType', ReplicationMonthlyType.Absolute)"
		>
			<UiRadio
				:modelValue="monthlyType"
				:value="ReplicationMonthlyType.Absolute"
				inputName="tasks-replication-sheet-monthly-type"
				@update:modelValue="$emit('update:monthlyType', $event)"
			/>
			<RichLoc class="tasks-field-replication-row" :text="loc('TASKS_V2_REPLICATION_NTH_DAY')" placeholder="[day/]">
				<template #day>
					<BInput
						:modelValue="String(dayNumber)"
						:size="InputSize.Sm"
						:design="!disabled ? InputDesign.Grey : InputDesign.Disabled"
						:disabled
						stretched
						style="max-width: 4em; padding-bottom: 0;"
						@update:modelValue="updateDayNumber"
					/>
				</template>
			</RichLoc>
		</div>
	`
	};

	// @vue/component
	const SerialNumberSelect = {
	  name: 'SerialNumberSelect',
	  components: {
	    UiSelect: tasks_v2_component_elements_select.UiSelect
	  },
	  props: {
	    modelValue: {
	      type: Number,
	      default: 0
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    },
	    weekDay: {
	      type: Number,
	      default: null
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    itemLocaleAlt() {
	      if (this.weekDay === tasks_v2_const.ReplicationWeekDayIndex.Sunday) {
	        return '_ALT_1';
	      }
	      if (this.weekDay === tasks_v2_const.ReplicationWeekDayIndex.Wednesday || this.weekDay === tasks_v2_const.ReplicationWeekDayIndex.Friday || this.weekDay === tasks_v2_const.ReplicationWeekDayIndex.Saturday) {
	        return '_ALT_0';
	      }
	      return '';
	    },
	    items() {
	      return [{
	        id: 0,
	        title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FIRST${this.itemLocaleAlt}`)
	      }, {
	        id: 1,
	        title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_SECOND${this.itemLocaleAlt}`)
	      }, {
	        id: 2,
	        title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_THIRD${this.itemLocaleAlt}`)
	      }, {
	        id: 3,
	        title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FOURTH${this.itemLocaleAlt}`)
	      }, {
	        id: 4,
	        title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_LAST${this.itemLocaleAlt}`)
	      }];
	    },
	    item() {
	      return this.items.find(({
	        id
	      }) => id === this.modelValue);
	    }
	  },
	  template: `
		<UiSelect
			:item
			:items
			:disabled
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`
	};

	const week$1 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const weekValues$1 = {
	  Mon: 0,
	  Tue: 1,
	  Wed: 2,
	  Thu: 3,
	  Fri: 4,
	  Sat: 5,
	  Sun: 6
	};

	// @vue/component
	const WeekDaySelect = {
	  name: 'WeekDaySelect',
	  components: {
	    UiSelect: tasks_v2_component_elements_select.UiSelect
	  },
	  props: {
	    /** @description day of the week number */
	    modelValue: {
	      type: Number,
	      default: tasks_v2_const.ReplicationWeekDayIndex.Monday
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    items() {
	      const weekIndices = {
	        SU: 0,
	        MO: 1,
	        TU: 2,
	        WE: 3,
	        TH: 4,
	        FR: 5,
	        SA: 6
	      };
	      const weekStartIndex = weekIndices[tasks_v2_lib_calendar.calendar.weekStart];
	      const format = 'l';
	      const todayDayIndex = new Date().getDay();
	      return [week$1.slice(weekStartIndex), week$1.slice(0, weekStartIndex)].flat(1).map(day => {
	        const dayDate = new Date();
	        const dayDifference = (week$1.indexOf(day) - todayDayIndex) % 7;
	        dayDate.setDate(dayDate.getDate() + dayDifference);
	        return {
	          id: weekValues$1[day],
	          title: main_date.DateTimeFormat.format(format, dayDate)
	        };
	      });
	    },
	    item() {
	      return this.items.find(({
	        id
	      }) => id === this.modelValue);
	    }
	  },
	  template: `
		<UiSelect
			:item
			:items
			:disabled
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`
	};

	// @vue/component
	const ReplicationSettingsMonthlyByDayOfWeek = {
	  name: 'ReplicationSettingsMonthlyByDayOfWeek',
	  components: {
	    SerialNumberSelect,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio,
	    UiSelect: tasks_v2_component_elements_select.UiSelect,
	    WeekDaySelect
	  },
	  props: {
	    monthlyType: {
	      type: Number,
	      required: true
	    },
	    weekDay: {
	      type: Number,
	      required: true
	    },
	    weekDayNumber: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['update:monthlyType', 'update:weekDayNumber', 'update:weekDay'],
	  setup() {
	    return {
	      ReplicationMonthlyType: tasks_v2_const.ReplicationMonthlyType
	    };
	  },
	  computed: {
	    disabled() {
	      return this.monthlyType !== tasks_v2_const.ReplicationMonthlyType.Relative;
	    }
	  },
	  template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:monthlyType', ReplicationMonthlyType.Relative)"
		>
			<UiRadio
				:modelValue="monthlyType"
				:value="ReplicationMonthlyType.Relative"
				inputName="tasks-replication-sheet-monthly-type"
				@update:modelValue="$emit('update:monthlyType', $event)"
			/>
			<SerialNumberSelect
				:modelValue="weekDayNumber"
				:weekDay
				:disabled
				@update:modelValue="$emit('update:weekDayNumber', $event)"
			/>
			<WeekDaySelect
				:modelValue="weekDay"
				:disabled
				@update:modelValue="$emit('update:weekDay', $event)"
			/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsMonth = {
	  name: 'ReplicationSettingsMonth',
	  components: {
	    BInput: ui_system_input_vue.BInput,
	    ReplicationInterval,
	    ReplicationSettingsMonthlyByDayOfMonth,
	    ReplicationSettingsMonthlyByDayOfWeek,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      InputSize: ui_system_input_vue.InputSize
	    };
	  },
	  data() {
	    return {
	      dayNumber: 1,
	      day: 'mon'
	    };
	  },
	  computed: {
	    period() {
	      return ui_vue3.markRaw(tasks_v2_const.ReplicationPeriod.Monthly);
	    },
	    monthlyMonthNum() {
	      return this.monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute ? this.replicateParams.monthlyMonthNum1 : this.replicateParams.monthlyMonthNum2;
	    },
	    useInterval: {
	      get() {
	        return this.monthlyMonthNum > 0;
	      },
	      set(useInterval) {
	        this.updateMonthlyMonthNum(useInterval ? 1 : null);
	      }
	    },
	    interval: {
	      get() {
	        return this.monthlyMonthNum || 1;
	      },
	      set(value) {
	        this.updateMonthlyMonthNum(value);
	      }
	    },
	    monthlyType: {
	      get() {
	        return this.replicateParams.monthlyType;
	      },
	      set(type) {
	        const prevValue = this.monthlyType;
	        this.update({
	          monthlyType: type
	        });
	        if (prevValue !== type) {
	          this.updateFieldsByMonthlyType(type);
	        }
	      }
	    },
	    monthlyDayNum: {
	      get() {
	        return this.replicateParams.monthlyDayNum || 1;
	      },
	      set(value) {
	        this.update({
	          monthlyDayNum: value
	        });
	      }
	    },
	    monthlyWeekDay: {
	      get() {
	        var _this$replicateParams;
	        return (_this$replicateParams = this.replicateParams.monthlyWeekDay) != null ? _this$replicateParams : tasks_v2_const.ReplicationWeekDayIndex.Monday;
	      },
	      set(value) {
	        this.update({
	          monthlyWeekDay: value
	        });
	      }
	    },
	    monthlyWeekDayNum: {
	      get() {
	        var _this$replicateParams2;
	        return (_this$replicateParams2 = this.replicateParams.monthlyWeekDayNum) != null ? _this$replicateParams2 : 0;
	      },
	      set(value) {
	        this.update({
	          monthlyWeekDayNum: value
	        });
	      }
	    },
	    hintText() {
	      return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_SETTINGS_MONTH_HINT', this.interval, {
	        '#COUNT#': this.interval
	      });
	    }
	  },
	  methods: {
	    update(params) {
	      this.$emit('update', params);
	    },
	    updateMonthlyMonthNum(monthlyMonthNum) {
	      if (this.monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute) {
	        this.update({
	          monthlyMonthNum1: monthlyMonthNum
	        });
	      } else {
	        this.update({
	          monthlyMonthNum2: monthlyMonthNum
	        });
	      }
	    },
	    updateFieldsByMonthlyType(monthlyType) {
	      const patch = {};
	      if (monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute) {
	        patch.monthlyWeekDay = null;
	        patch.monthlyWeekDayNum = null;
	        patch.monthlyMonthNum1 = this.replicateParams.monthlyMonthNum2;
	        patch.monthlyMonthNum2 = null;
	      } else {
	        patch.monthlyDayNum = null;
	        patch.monthlyMonthNum2 = this.replicateParams.monthlyMonthNum1;
	        patch.monthlyMonthNum1 = null;
	        patch.monthlyWeekDay = tasks_v2_const.ReplicationWeekDayIndex.Monday;
	        patch.monthlyWeekDayNum = tasks_v2_const.ReplicationWeekDayNum.First;
	      }
	      this.update(patch);
	    }
	  },
	  template: `
		<div class="tasks-field-replication-sheet__stack">
			<ReplicationSettingsMonthlyByDayOfMonth
				v-model:monthlyType="monthlyType"
				v-model:dayNumber="monthlyDayNum"
			/>
			<ReplicationSettingsMonthlyByDayOfWeek
				v-model:monthlyType="monthlyType"
				v-model:weekDay="monthlyWeekDay"
				v-model:weekDayNumber="monthlyWeekDayNum"
			/>
			<ReplicationInterval
				v-model:useInterval="useInterval"
				v-model:interval="interval"
				:period
			>
				<template #hint>
					<QuestionMark
						class="tasks-replication-sheet-action-row__hint"
						:hintText
						:hintMaxWidth="260"
					/>
				</template>
			</ReplicationInterval>
		</div>
	`
	};

	// @vue/component
	const MonthSelect = {
	  name: 'MonthSelect',
	  components: {
	    UiSelect: tasks_v2_component_elements_select.UiSelect
	  },
	  props: {
	    /** @description Month index */
	    modelValue: {
	      type: Number,
	      default: 1
	    },
	    disabled: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    items() {
	      const firstDay = new Date().setDate(1);
	      return Array.from({
	        length: 12
	      }, (_, i) => ({
	        id: i + 1,
	        title: main_core.Text.capitalize(main_date.DateTimeFormat.format('F', new Date(firstDay).setMonth(i) / 1000))
	      }));
	    },
	    item() {
	      return this.items.find(({
	        id
	      }) => id === this.modelValue);
	    },
	    menuOptions() {
	      return {
	        height: 254
	      };
	    }
	  },
	  template: `
		<UiSelect
			:item
			:items
			:disabled
			:menuOptions
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`
	};

	// @vue/component
	const ReplicationSettingsYearAbsoluteDate = {
	  name: 'ReplicationSettingsYearAbsoluteDate',
	  components: {
	    BInput: ui_system_input_vue.BInput,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio,
	    MonthSelect
	  },
	  props: {
	    yearlyType: {
	      type: Number,
	      required: true
	    },
	    yearlyDayNumber: {
	      type: Number,
	      required: true
	    },
	    yearlyMonth: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['update:yearlyType', 'update:yearlyDayNumber', 'update:yearlyMonth'],
	  setup() {
	    return {
	      InputDesign: ui_system_input_vue.InputDesign,
	      InputSize: ui_system_input_vue.InputSize,
	      ReplicationYearlyType: tasks_v2_const.ReplicationYearlyType
	    };
	  },
	  data() {
	    return {
	      prevDayNumber: 0
	    };
	  },
	  computed: {
	    disabled() {
	      return this.yearlyType !== tasks_v2_const.ReplicationYearlyType.Absolute;
	    },
	    dayNumber: {
	      get() {
	        return this.yearlyDayNumber;
	      },
	      set(value) {
	        this.$emit('update:yearlyDayNumber', value);
	      }
	    },
	    month: {
	      get() {
	        return this.yearlyMonth;
	      },
	      set(value) {
	        this.$emit('update:yearlyMonth', value);
	      }
	    }
	  },
	  mounted() {
	    this.prevDayNumber = this.dayNumber;
	  },
	  methods: {
	    updateDayNumber(value = '') {
	      var _parseInt;
	      let day = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) != null ? _parseInt : 0;
	      if (!main_core.Type.isInteger(day) || day < 1 || day > 31) {
	        day = this.prevDayNumber;
	      }
	      this.dayNumber = day;
	    }
	  },
	  template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:yearlyType', ReplicationYearlyType.Absolute)"
		>
			<UiRadio
				tag="label"
				:modelValue="yearlyType"
				:value="ReplicationYearlyType.Absolute"
				inputName="tasks-replication-sheet-yearly-type"
				@update:modelValue="$emit('update:yearlyType', $event)"
			/>
			<BInput
				:modelValue="dayNumber.toString()"
				:size="InputSize.Sm"
				:design="disabled ? InputDesign.Disabled : InputDesign.Grey"
				:disabled
				stretched
				style="max-width: 4em;"
				@update:modelValue="updateDayNumber"
			/>
			<MonthSelect v-model="month" :disabled/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsYearRelativeDate = {
	  name: 'ReplicationSettingsYearRelativeDate',
	  components: {
	    MonthSelect,
	    SerialNumberSelect,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio,
	    WeekDaySelect
	  },
	  props: {
	    yearlyType: {
	      type: Number,
	      required: true
	    },
	    yearlyWeekDay: {
	      type: Number,
	      required: true
	    },
	    yearlyWeekDayNum: {
	      type: Number,
	      required: true
	    },
	    yearlyMonth: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['update:yearlyType', 'update:yearlyWeekDay', 'update:yearlyWeekDayNum', 'update:yearlyMonth'],
	  setup() {
	    return {
	      ReplicationYearlyType: tasks_v2_const.ReplicationYearlyType
	    };
	  },
	  computed: {
	    disabled() {
	      return this.yearlyType !== tasks_v2_const.ReplicationYearlyType.Relative;
	    },
	    weekDay: {
	      get() {
	        return this.yearlyWeekDay;
	      },
	      set(weekDay) {
	        this.$emit('update:yearlyWeekDay', weekDay);
	      }
	    },
	    weekDayNum: {
	      get() {
	        return this.yearlyWeekDayNum;
	      },
	      set(weekDayNum) {
	        this.$emit('update:yearlyWeekDayNum', weekDayNum);
	      }
	    },
	    month: {
	      get() {
	        return this.yearlyMonth;
	      },
	      set(yearlyMonth) {
	        this.$emit('update:yearlyMonth', yearlyMonth);
	      }
	    }
	  },
	  template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:yearlyType', ReplicationYearlyType.Relative)"
		>
			<UiRadio
				tag="label"
				:modelValue="yearlyType"
				:value="ReplicationYearlyType.Relative"
				inputName="tasks-replication-sheet-yearly-type"
				@update:modelValue="$emit('update:yearlyType', $event)"
			/>
			<SerialNumberSelect
				v-model="weekDayNum"
				:weekDay
				:disabled
				style="max-width: 9em"
			/>
			<WeekDaySelect v-model="weekDay" :disabled style="max-width: 11em"/>
			<MonthSelect v-model="month" :disabled style="max-width: 11em"/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettingsYear = {
	  name: 'ReplicationSettingsYear',
	  components: {
	    ReplicationSettingsYearAbsoluteDate,
	    ReplicationSettingsYearRelativeDate
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  computed: {
	    yearlyType: {
	      get() {
	        return this.replicateParams.yearlyType;
	      },
	      set(yearlyType) {
	        const prevValue = this.yearlyType;
	        this.update({
	          yearlyType
	        });
	        if (prevValue !== this.yearlyType) {
	          this.updateByYearlyType(yearlyType);
	        }
	      }
	    },
	    yearlyWeekDay: {
	      get() {
	        return (this.replicateParams.yearlyWeekDay || tasks_v2_const.ReplicationYearlyWeekDayIndex.Monday) - 1;
	      },
	      set(value) {
	        this.update({
	          yearlyWeekDay: main_core.Type.isInteger(value) ? value + 1 : value
	        });
	      }
	    }
	  },
	  methods: {
	    update(params) {
	      this.$emit('update', params);
	    },
	    updateByYearlyType(yearlyType) {
	      if (yearlyType === tasks_v2_const.ReplicationYearlyType.Absolute) {
	        this.update({
	          yearlyWeekDay: null,
	          yearlyWeekDayNum: null,
	          yearlyMonth2: null,
	          yearlyDayNum: 1,
	          yearlyMonth1: 1
	        });
	      } else {
	        this.update({
	          yearlyWeekDay: tasks_v2_const.ReplicationYearlyWeekDayIndex.Monday,
	          yearlyWeekDayNum: tasks_v2_const.ReplicationWeekDayNum.First,
	          yearlyMonth2: 1,
	          yearlyDayNum: null,
	          yearlyMonth1: null
	        });
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-replication-sheet__stack">
			<ReplicationSettingsYearAbsoluteDate
				v-model:yearlyType="yearlyType"
				:yearlyDayNumber="replicateParams.yearlyDayNum || 1"
				:yearlyMonth="replicateParams.yearlyMonth1 || 1"
				@update:yearlyDayNumber="update({ yearlyDayNum: $event })"
				@update:yearlyMonth="update({ yearlyMonth1: $event })"
			/>
			<ReplicationSettingsYearRelativeDate
				v-model:yearlyType="yearlyType"
				v-model:yearlyWeekDay="yearlyWeekDay"
				:yearlyWeekDayNum="replicateParams.yearlyWeekDayNum || 0"
				:yearlyMonth="replicateParams.yearlyMonth2 || 1"
				@update:yearlyWeekDayNum="update({ yearlyWeekDayNum: $event })"
				@update:yearlyMonth="update({ yearlyMonth2: $event })"
			/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSettings = {
	  name: 'ReplicationSettings',
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    UiTabs: tasks_v2_component_elements_uiTabs.UiTabs,
	    ReplicationSettingsDay,
	    ReplicationSettingsWeek,
	    ReplicationSettingsMonth,
	    ReplicationSettingsYear
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  computed: {
	    period: {
	      get() {
	        return this.replicateParams.period;
	      },
	      set(period) {
	        this.$emit('update', {
	          period,
	          ...this.getEmptyPrevTabData(this.replicateParams.period),
	          ...this.getDefaultTabData(period)
	        });
	      }
	    },
	    title() {
	      return this.period === tasks_v2_const.ReplicationPeriod.Weekly ? this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE_ALT') : this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE');
	    },
	    tabs() {
	      return [{
	        id: tasks_v2_const.ReplicationPeriod.Daily,
	        title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_DAY'),
	        component: ReplicationSettingsDay
	      }, {
	        id: tasks_v2_const.ReplicationPeriod.Weekly,
	        title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_WEEK'),
	        component: ReplicationSettingsWeek
	      }, {
	        id: tasks_v2_const.ReplicationPeriod.Monthly,
	        title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_MONTH'),
	        component: ReplicationSettingsMonth
	      }, {
	        id: tasks_v2_const.ReplicationPeriod.Yearly,
	        title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_YEAR'),
	        component: ReplicationSettingsYear
	      }];
	    }
	  },
	  methods: {
	    getEmptyPrevTabData(prevPeriod) {
	      switch (prevPeriod) {
	        case tasks_v2_const.ReplicationPeriod.Daily:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createReplicateParamsDaily();
	        case tasks_v2_const.ReplicationPeriod.Weekly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createReplicateParamsWeekly();
	        case tasks_v2_const.ReplicationPeriod.Monthly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createReplicateParamsMonthly();
	        case tasks_v2_const.ReplicationPeriod.Yearly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createReplicateParamsYearly();
	        default:
	          return {};
	      }
	    },
	    getDefaultTabData(period) {
	      switch (period) {
	        case tasks_v2_const.ReplicationPeriod.Daily:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createDefaultReplicationParamsDaily();
	        case tasks_v2_const.ReplicationPeriod.Weekly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createDefaultReplicationParamsWeekly();
	        case tasks_v2_const.ReplicationPeriod.Monthly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createDefaultReplicationParamsMonthly();
	        case tasks_v2_const.ReplicationPeriod.Yearly:
	          return tasks_v2_provider_service_taskService.ReplicateCreator.createDefaultReplicationParamsYearly();
	        default:
	          return {};
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row">
				<span class="tasks-field-replication-secondary">{{ title }}</span>
			</TextMd>
			<div class="tasks-field-replication-sheet-replication-settings-content">
				<UiTabs
					v-model="period"
					:tabs
				>
					<template v-slot="{ activeTab }">
						<component
							:is="activeTab.component"
							@update="$emit('update', $event)"
						/>
					</template>
				</UiTabs>
			</div>
		</div>
	`
	};

	class DateStringConverter {
	  static format(timestamp) {
	    const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
	    const today = new Date(Date.now() + offset);
	    const day = new Date(timestamp + offset);
	    const isToday = today.getFullYear() === day.getFullYear() && today.getMonth() === day.getMonth() && today.getDate() === day.getDate();
	    if (isToday) {
	      return main_core.Text.capitalize(main_date.DateTimeFormat.format('today'));
	    }
	    return tasks_v2_lib_calendar.calendar.formatDate(timestamp);
	  }
	  static parseServerDate(serverDateString) {
	    if (main_core.Type.isStringFilled(serverDateString)) {
	      return main_date.DateTimeFormat.parse(serverDateString);
	    }
	    const date = new Date();
	    date.setHours(0, 0, 0, 0);
	    return date;
	  }
	  static convertServerDateToTs(serverDate, serverTime = null) {
	    if (main_core.Type.isStringFilled(serverTime)) {
	      tasks_v2_component_fields_replication.TimeStringConverter.applyTimeToDate(serverDate, serverTime);
	    }
	    return main_date.Timezone.ServerTime.toBrowser(serverDate) * 1000;
	  }
	  static convertTsToServerDateString(browserTs) {
	    const browserDate = new Date(browserTs);
	    const serverDate = main_date.Timezone.BrowserTime.toServerDate(browserDate);
	    const serverTsAsMidnight = serverDate.setHours(0, 0, 0, 0) / 1000;
	    return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), serverTsAsMidnight);
	  }
	}

	// @vue/component
	const ReplicationDatepicker = {
	  name: 'ReplicationDatepicker',
	  components: {
	    Popup: ui_vue3_components_popup.Popup
	  },
	  inject: {
	    /** @type{number|string} */
	    taskId: {}
	  },
	  props: {
	    dateTs: {
	      type: Number,
	      required: true
	    },
	    bindElement: {
	      type: HTMLElement,
	      required: true
	    }
	  },
	  emits: ['update:dateTs', 'close'],
	  data() {
	    return {
	      dateTsModel: null
	    };
	  },
	  created() {
	    this.datePicker = this.createDatePicker();
	    const date = new Date(this.dateTs + tasks_v2_lib_timezone.timezone.getOffset(this.dateTs));
	    this.dateTsModel = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	  },
	  mounted() {
	    this.datePicker.show();
	  },
	  unmounted() {
	    var _this$datePicker;
	    (_this$datePicker = this.datePicker) == null ? void 0 : _this$datePicker.destroy();
	  },
	  methods: {
	    createDatePicker() {
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(this.dateTs);
	      const picker = new ui_datePicker.DatePicker({
	        popupOptions: {
	          id: `tasks-replication-date-picker-${this.taskId}-${main_core.Text.getRandom()}`,
	          bindElement: this.bindElement,
	          offsetTop: 5,
	          offsetLeft: -40,
	          targetContainer: document.body,
	          events: {
	            onClose: () => this.$emit('close')
	          }
	        },
	        selectedDates: [this.dateTs + offset],
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            const dateTsModel = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
	            this.$emit('update:dateTs', dateTsModel - tasks_v2_lib_timezone.timezone.getOffset(dateTsModel));
	          }
	        }
	      });
	      picker.getPicker('day').subscribe('onSelect', event => {
	        const {
	          year,
	          month,
	          day
	        } = event.getData();
	        const dateTsModel = new Date(year, month, day).getTime();
	        this.$emit('close');
	        this.dateTsModel = dateTsModel;
	      });
	      return picker;
	    }
	  },
	  template: '<div ref="picker"/>'
	};

	// @vue/component
	const ReplicationStart = {
	  name: 'ReplicationStart',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    TextMd: ui_system_typography_vue.TextMd,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    ReplicationDatepicker,
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      isDatepickerOpened: false
	    };
	  },
	  computed: {
	    startTs: {
	      get() {
	        return this.replicateParams.startTs;
	      },
	      set(startTs) {
	        this.$emit('update', {
	          startTs
	        });
	      }
	    },
	    startLabel() {
	      return DateStringConverter.format(this.startTs);
	    }
	  },
	  beforeMount() {
	    if (!this.replicateParams.startTs) {
	      const workdayStart = tasks_v2_lib_calendar.calendar.workdayStart;
	      const serverTs = new Date().setHours(workdayStart.H, workdayStart.M, 0, 0);
	      this.startTs = serverTs - tasks_v2_lib_timezone.timezone.getOffset(serverTs);
	    }
	  },
	  template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_START')"
				placeholder="[date/]"
			>
				<template #date>
					<HoverPill textOnly noOffset ref="datepickerStartOpener">
						<span class="tasks-field-replication-link" @click="isDatepickerOpened = true">
							{{ startLabel }}
						</span>
					</HoverPill>
					<ReplicationDatepicker
						v-if="isDatepickerOpened"
						v-model:dateTs="startTs"
						:bindElement="$refs.datepickerStartOpener.$el"
						@close="isDatepickerOpened = false"
					/>
				</template>
			</RichLoc>
		</TextMd>
	`
	};

	// @vue/component
	const ReplicationFinish = {
	  name: 'ReplicationFinish',
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    ReplicationDatepicker,
	    TextMd: ui_system_typography_vue.TextMd,
	    TextSm: ui_system_typography_vue.TextSm,
	    TextXs: ui_system_typography_vue.TextXs,
	    UiButton: ui_vue3_components_button.Button,
	    BInput: ui_system_input_vue.BInput,
	    UiRadio: tasks_v2_component_elements_radio.UiRadio,
	    RichLoc: ui_vue3_components_richLoc.RichLoc
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      InputDesign: ui_system_input_vue.InputDesign,
	      InputSize: ui_system_input_vue.InputSize,
	      ReplicationRepeatTill: tasks_v2_const.ReplicationRepeatTill
	    };
	  },
	  data() {
	    return {
	      isDatepickerOpened: false,
	      prevTimes: this.replicateParams.times || 1
	    };
	  },
	  computed: {
	    repeatTill: {
	      get() {
	        return this.replicateParams.repeatTill;
	      },
	      set(value) {
	        const prevValue = this.repeatTill;
	        this.update({
	          repeatTill: value
	        });
	        if (prevValue !== value) {
	          this.updateFieldsByRepeatTill(value);
	        }
	      }
	    },
	    endDateTs() {
	      return main_core.Type.isNil(this.replicateParams.endTs) ? Date.now() + 5 * 24 * 60 * 60 * 1000 : this.replicateParams.endTs;
	    },
	    endDateLabel() {
	      return this.endDateTs ? tasks_v2_lib_calendar.calendar.formatDate(this.endDateTs) : this.loc('TASKS_V2_REPLICATION_FINISH_DATE_UNSET');
	    }
	  },
	  methods: {
	    update(params) {
	      this.$emit('update', params);
	    },
	    updateTimes(value) {
	      var _parseInt;
	      let times = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) != null ? _parseInt : 0;
	      if (!main_core.Type.isInteger(times) || times < 1) {
	        times = this.prevTimes;
	      }
	      this.prevTimes = times;
	      this.update({
	        times
	      });
	    },
	    updateEndDate(endTs) {
	      this.update({
	        endTs
	      });
	    },
	    updateFieldsByRepeatTill(repeatTill) {
	      if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Endless) {
	        this.update({
	          times: null,
	          endless: null
	        });
	      }
	      if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Times) {
	        this.prevTimes = 1;
	        this.update({
	          times: 1,
	          endDate: null
	        });
	      }
	      if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Date) {
	        this.update({
	          times: null,
	          endDate: main_date.DateTimeFormat.format('m-d-Y', (Date.now() + 5 * 24 * 60 * 60 * 1000) / 1000)
	        });
	      }
	    },
	    togglePopup() {
	      this.isDatepickerOpened = !this.isDatepickerOpened;
	    },
	    isRowActive(repeatTill) {
	      return repeatTill === this.repeatTill;
	    },
	    handleClickDatepickerFinishOpener(event) {
	      if (!this.isRowActive(tasks_v2_const.ReplicationRepeatTill.Date)) {
	        return;
	      }
	      const target = event.currentTarget;
	      const disabled = target.getAttribute('disabled');
	      if (!(disabled === 'true')) {
	        this.togglePopup();
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row">
				<span class="tasks-field-replication-secondary">
					{{ loc('TASKS_V2_REPLICATION_FINISH') }}
				</span>
			</TextMd>
			<div>
				<div class="tasks-field-replication-sheet__stack">
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Endless)}"
						@click.self="repeatTill = ReplicationRepeatTill.Endless"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Endless"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<TextXs className="tasks-replication-sheet-action-row__text">
							{{ loc('TASKS_V2_REPLICATION_FINISH_HAND') }}
						</TextXs>
					</div>
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Times)}"
						@click.self="repeatTill = ReplicationRepeatTill.Times"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Times"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<RichLoc
							class="tasks-field-replication-row"
							:text="loc('TASKS_V2_REPLICATION_AFTER_COUNT_REPETITIONS')"
							placeholder="[count/]"
						>
							<template #count>
								<BInput
									:modelValue="String(replicateParams.times ?? '')"
									:size="InputSize.Sm"
									:design="isRowActive(ReplicationRepeatTill.Times) ? InputDesign.Grey : InputDesign.Disabled"
									:disabled="!isRowActive(ReplicationRepeatTill.Times)"
									style="max-width: 4em; padding-bottom: 0;"
									@blur="updateTimes($event.target.value)"
								/>
							</template>
						</RichLoc>
					</div>
					<div
						class="tasks-replication-sheet-action-row --selectable"
						:class="{'--active': isRowActive(ReplicationRepeatTill.Date)}"
						@click.self="repeatTill = ReplicationRepeatTill.Date"
					>
						<UiRadio
							tag="label"
							v-model="repeatTill"
							:value="ReplicationRepeatTill.Date"
							inputName="tasks-replication-sheet-finish-type"
						/>
						<TextXs className="tasks-replication-sheet-action-row__text">
							{{ loc('TASKS_V2_REPLICATION_FINISH_DATE') }}
						</TextXs>
						<HoverPill
							:readonly="!isRowActive(ReplicationRepeatTill.Date)"
							textOnly
							noOffset
							ref="datepickerFinishOpener"
							@click="handleClickDatepickerFinishOpener"
						>
							<span class="tasks-field-replication-link">{{ endDateLabel }}</span>
						</HoverPill>
						<ReplicationDatepicker
							v-if="isDatepickerOpened"
							:dateTs="endDateTs"
							:bindElement="$refs.datepickerFinishOpener.$el"
							@update:dateTs="updateEndDate"
							@close="isDatepickerOpened = false"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ReplicationStartTime = {
	  name: 'ReplicationStartTime',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    TextMd: ui_system_typography_vue.TextMd,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  computed: {
	    startTs: {
	      get() {
	        return this.replicateParams.startTs;
	      },
	      set(startTs) {
	        this.$emit('update', {
	          startTs
	        });
	      }
	    },
	    startTimeFormatted() {
	      return TimeStringConverter.format(this.startTs);
	    }
	  },
	  methods: {
	    showPicker() {
	      var _this$datePicker;
	      (_this$datePicker = this.datePicker) != null ? _this$datePicker : this.datePicker = new ui_datePicker.DatePicker({
	        selectedDates: [this.startTs + tasks_v2_lib_timezone.timezone.getOffset(this.startTs)],
	        type: 'time',
	        events: {
	          [ui_datePicker.DatePickerEvent.SELECT]: event => {
	            const {
	              date
	            } = event.getData();
	            const dateTs = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
	            this.startTs = dateTs - tasks_v2_lib_timezone.timezone.getOffset(dateTs);
	          }
	        },
	        popupOptions: {
	          targetContainer: document.body
	        }
	      });
	      this.datePicker.setTargetNode(this.$refs.time.$el);
	      this.datePicker.show();
	    }
	  },
	  template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_CREATE_AT')"
				placeholder="[time/]"
			>
				<template #time>
					<HoverPill textOnly noOffset ref="time" @click="showPicker">
						<span class="tasks-field-replication-link">{{ startTimeFormatted }}</span>
					</HoverPill>
				</template>
			</RichLoc>
		</TextMd>
	`
	};

	// @vue/component
	const ReplicationDeadline = {
	  name: 'ReplicationDeadline',
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    DeadlineAfterPopup: tasks_v2_component_fields_deadline.DeadlineAfterPopup,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    replicateParams: {},
	    taskId: {}
	  },
	  emits: ['update'],
	  data() {
	    return {
	      isDeadlinePopupShown: false
	    };
	  },
	  computed: {
	    deadlineLabel() {
	      let deadlineAfter = this.replicateParams.deadlineOffset || null;
	      if (!deadlineAfter) {
	        return this.loc('TASKS_V2_REPLICATION_DEADLINE_NOT_SET');
	      }
	      deadlineAfter *= 1000;
	      if (this.isMinutes(deadlineAfter)) {
	        const minutes = deadlineAfter / (60 * 1000);
	        return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DEADLINE_IN_MINUTES', minutes, {
	          '#TASK_DEADLINE#': minutes
	        });
	      }
	      if (this.isHours(deadlineAfter)) {
	        const hours = deadlineAfter / (60 * 60 * 1000);
	        return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DEADLINE_IN_HOURS', hours, {
	          '#TASK_DEADLINE#': hours
	        });
	      }
	      if (this.isWeeks(deadlineAfter)) {
	        const weeks = deadlineAfter / (7 * 24 * 60 * 60 * 1000);
	        return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DEADLINE_IN_WEEKS', weeks, {
	          '#TASK_DEADLINE#': weeks
	        });
	      }
	      const days = deadlineAfter / (24 * 60 * 60 * 1000);
	      return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DEADLINE_IN_DAYS', days, {
	        '#TASK_DEADLINE#': days
	      });
	    },
	    today() {
	      const today = new Date();
	      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
	    }
	  },
	  methods: {
	    update(deadlineOffset) {
	      this.$emit('update', {
	        deadlineOffset
	      });
	    },
	    updateDeadlineAfter(deadlineTs) {
	      this.update(main_core.Type.isNumber(deadlineTs) ? deadlineTs / 1000 : deadlineTs);
	    },
	    isMinutes(durationTs) {
	      const hourTs = 60 * 60 * 1000;
	      return durationTs < hourTs || durationTs % hourTs !== 0;
	    },
	    isHours(durationTs) {
	      const dayTs = 24 * 60 * 60 * 1000;
	      return durationTs < dayTs || durationTs % dayTs !== 0;
	    },
	    isWeeks(durationTs) {
	      const weekTs = 7 * 24 * 60 * 60 * 1000;
	      return durationTs % weekTs === 0;
	    }
	  },
	  template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row">
				<span class="tasks-field-replication-secondary">
					{{ loc('TASKS_V2_REPLICATION_DEADLINE') }}
				</span>
				<HoverPill textOnly noOffset ref="deadline">
					<span class="tasks-field-replication-link" @click="isDeadlinePopupShown = true">
						{{ deadlineLabel }}
					</span>
				</HoverPill>
				<DeadlineAfterPopup
					v-if="isDeadlinePopupShown"
					:deadlineAfter="replicateParams.deadlineAfter"
					:taskId
					:bindElement="$refs.deadline.$el"
					@update:deadlineAfter="updateDeadlineAfter"
					@close="isDeadlinePopupShown = false"
				/>
			</TextMd>
		</div>
	`
	};

	// @vue/component
	const ReplicationWeekend = {
	  name: 'ReplicationWeekend',
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    TextMd: ui_system_typography_vue.TextMd,
	    BMenu: ui_system_menu_vue.BMenu,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill
	  },
	  inject: {
	    replicateParams: {}
	  },
	  emits: ['update'],
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    workdayOnly: {
	      get() {
	        return this.replicateParams.workdayOnly;
	      },
	      set(value) {
	        this.update({
	          workdayOnly: value
	        });
	      }
	    },
	    item() {
	      return this.weekendAttitudeItems.find(item => item.id === this.workdayOnly);
	    },
	    weekendAttitudeItems() {
	      const items = [{
	        id: 'N',
	        value: this.loc('TASKS_V2_REPLICATION_WEEKEND_CREATE')
	      }, {
	        id: 'Y',
	        value: this.loc('TASKS_V2_REPLICATION_WEEKEND_NOT_CREATE')
	      }];
	      return items.map(option => ({
	        id: option.id,
	        title: option.value,
	        isSelected: option.id === this.workdayOnly,
	        onClick: () => {
	          this.workdayOnly = option.id;
	        }
	      }));
	    },
	    options() {
	      return {
	        id: 'weekend-attitude-replicant-popup',
	        bindElement: this.$refs.skipWeekends.$el,
	        items: this.weekendAttitudeItems,
	        offsetTop: 5,
	        targetContainer: document.body
	      };
	    }
	  },
	  beforeMount() {
	    if (!this.replicateParams.workdayOnly) {
	      this.workdayOnly = 'N';
	    }
	  },
	  methods: {
	    update({
	      workdayOnly
	    }) {
	      this.$emit('update', {
	        workdayOnly
	      });
	    }
	  },
	  template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_ON_WEEKEND_DO')"
				placeholder="[do/]"
			>
				<template #do>
					<HoverPill textOnly noOffset ref="skipWeekends" @click="isMenuShown = true">
						<span class="tasks-field-replication-link">{{ item?.title || '' }}</span>
					</HoverPill>
					<BMenu v-if="isMenuShown" :options @close="isMenuShown = false"/>
				</template>
			</RichLoc>
		</TextMd>
	`
	};

	// @vue/component
	const ReplicationSheetFooter = {
	  name: 'ReplicationSheetFooter',
	  components: {
	    UiButton: ui_vue3_components_button.Button
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  props: {
	    replicateParams: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  computed: {
	    wasFilled() {
	      return this.task.filledFields[replicationMeta.id];
	    }
	  },
	  created() {
	    this.wasEmpty = !this.wasFilled || !this.task.replicateParams;
	  },
	  methods: {
	    async save() {
	      this.$emit('close');
	      if (this.wasEmpty) {
	        void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
	      }
	      await tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        replicate: true,
	        replicateParams: this.replicateParams
	      });
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.UpdateReplicateParams);
	    }
	  },
	  template: `
		<div class="tasks-field-replication-sheet-footer">
			<UiButton
				:text="loc('TASKS_V2_REPLICATION_CANCEL')"
				:size="ButtonSize.MEDIUM"
				:color="ButtonColor.LIGHT"
				:style="AirButtonStyle.PLAIN"
				@click="$emit('close')"
			/>
			<UiButton
				:text="loc('TASKS_V2_REPLICATION_SAVE')"
				:size="ButtonSize.MEDIUM"
				:color="ButtonColor.PRIMARY"
				@click="save"
			/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSheetContent = {
	  name: 'ReplicationSheetContent',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    HeadlineMd: ui_system_typography_vue.HeadlineMd,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    ReplicationSettings,
	    ReplicationStart,
	    ReplicationStartTime,
	    ReplicationDatepicker,
	    ReplicationFinish,
	    ReplicationDeadline,
	    ReplicationWeekend,
	    ReplicationSheetFooter,
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    TextMd: ui_system_typography_vue.TextMd
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  provide() {
	    return {
	      replicateParams: ui_vue3.computed(() => this.replicateParams)
	    };
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      replicateParams: tasks_v2_provider_service_taskService.ReplicateCreator.createEmptyReplicateParams()
	    };
	  },
	  computed: {
	    isDailyPeriod() {
	      return this.replicateParams.period === tasks_v2_const.ReplicationPeriod.Daily;
	    }
	  },
	  created() {
	    this.initReplicateParams();
	  },
	  methods: {
	    initReplicateParams() {
	      var _this$task;
	      if (!main_core.Type.isObject(((_this$task = this.task) == null ? void 0 : _this$task.replicateParams) || null)) {
	        return;
	      }
	      this.replicateParams = {
	        ...this.replicateParams,
	        ...this.task.replicateParams,
	        weekDays: [...(this.task.replicateParams.weekDays || [])]
	      };
	    },
	    updateReplicateParams(params = {}) {
	      this.replicateParams = {
	        ...this.replicateParams,
	        ...params
	      };
	    },
	    showHelpDesk() {
	      top.BX.Helper.show('redirect=detail&code=18127718');
	    },
	    close() {
	      this.$emit('close');
	    }
	  },
	  template: `
		<div class="tasks-field-replication-sheet">
			<div class="tasks-field-replication-sheet-header">
				<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_TITLE_SHEET') }}</HeadlineMd>
				<BIcon
					class="tasks-field-replication-sheet-close"
					:name="Outline.CROSS_L"
					hoverable
					@click="close"
				/>
			</div>
			<div class="tasks-field-replication-sheet-body">
				<div v-if="!isTemplate" class="tasks-field-replication-sheet-description">
					<span class="tasks-field-replication-sheet-description-text">
						<RichLoc :text="loc('TASKS_V2_REPLICATION_SHEET_DESCRIPTION')" placeholder="[helpdesk]">
							<template #helpdesk="{ text }">
								<a class="tasks-field-replication-helpdesk" @click="showHelpDesk">{{ text }}</a>
							</template>
						</RichLoc>
					</span>
				</div>
				<ReplicationSettings @update="updateReplicateParams"/>
				<ReplicationStart @update="updateReplicateParams"/>
				<ReplicationFinish @update="updateReplicateParams"/>
				<ReplicationStartTime @update="updateReplicateParams"/>
				<ReplicationDeadline v-if="!isTemplate" @update="updateReplicateParams"/>
				<ReplicationWeekend v-if="isDailyPeriod" @update="updateReplicateParams"/>
			</div>
			<ReplicationSheetFooter :replicateParams @close="close"/>
		</div>
	`
	};

	// @vue/component
	const ReplicationSheet = {
	  name: 'ReplicationSheet',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    ReplicationSheetContent
	  },
	  inject: {
	    task: {}
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
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<BottomSheet
			:sheetBindProps
			customClass="tasks-bottom-sheet-replicate-content"
			@close="$emit('close')"
		>
			<ReplicationSheetContent @close="$emit('close')"/>
		</BottomSheet>
	`
	};

	// @vue/component
	const ReplicationSheetHeader = {
	  name: 'ReplicationSheetHeader',
	  components: {
	    HeadlineMd: ui_system_typography_vue.HeadlineMd,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-field-replication-sheet-header">
			<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_HISTORY_SHEET') }}</HeadlineMd>
			<BIcon
				class="tasks-field-replication-sheet-close"
				:name="Outline.CROSS_L"
				hoverable
				@click="$emit('close')"
			/>
		</div>
	`
	};

	// @vue/component
	const TimeFields = {
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      systemLogTimeRef: [],
	      systemLogTime: []
	    };
	  },
	  methods: {
	    async update() {
	      const time = this.getGrid().querySelectorAll('[data-system-log-time]');
	      this.systemLogTime = [...time].map(systemLogTimeNode => this.getSystemLogTime(systemLogTimeNode));
	      await this.$nextTick();
	      time.forEach(systemLogTimeNode => {
	        const systemLogTime = this.getSystemLogTime(systemLogTimeNode);
	        systemLogTimeNode.append(this.systemLogTimeRef[systemLogTime.rowId]);
	      });
	    },
	    getSystemLogTime(systemLogTimeNode) {
	      const rowId = Number(systemLogTimeNode.closest('[data-id]').dataset.id);
	      const offsetTimestamp = this.getOffsetTimestamp(systemLogTimeNode.dataset.systemLogTime);
	      return {
	        rowId,
	        offsetTimestamp
	      };
	    },
	    getOffsetTimestamp(timestampString) {
	      const timestamp = Number(timestampString) * 1000;
	      const offset = tasks_v2_lib_timezone.timezone.getOffset(timestamp);
	      const offsetTimestamp = (timestamp + offset) / 1000;
	      return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), offsetTimestamp);
	    },
	    setRef(element, rowId) {
	      var _this$systemLogTimeRe;
	      (_this$systemLogTimeRe = this.systemLogTimeRef) != null ? _this$systemLogTimeRe : this.systemLogTimeRef = {};
	      this.systemLogTimeRef[rowId] = element;
	    }
	  },
	  template: `
		<template v-for="(time, id) in systemLogTime" :key="id">
			<div :ref="(el) => setRef(el, time.rowId)">{{ time.offsetTimestamp }}</div>
		</template>
	`
	};

	// @vue/component
	const ErrorHint = {
	  props: {
	    errorMessage: {
	      type: String,
	      default: ''
	    },
	    errorLink: {
	      type: String,
	      default: null
	    }
	  },
	  template: `
		<div class="tasks-field-replication-hint">
			<div>{{ errorMessage.replace('#LINK#', '') }}</div>
			<a v-if="errorLink" :href="errorLink">
				{{ loc('TASKS_V2_REPLICATION_NO_ACCESS_MORE') }}
			</a>
		</div>
	`
	};

	const pattern = /\(#(\d+)\)(?![\S\s]*\(#\d+\))/;

	// @vue/component
	const MessageField = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    ErrorHint
	  },
	  props: {
	    /** @type Message */
	    message: {
	      type: Object,
	      required: true
	    },
	    activeHintRowId: {
	      type: Number,
	      default: null
	    }
	  },
	  emits: ['hintOpen', 'hintClose'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      showHint: false
	    };
	  },
	  computed: {
	    formattedMessage() {
	      var _this$message$message;
	      return (_this$message$message = this.message.message) == null ? void 0 : _this$message$message.replace(pattern, '').trim();
	    },
	    linkText() {
	      var _this$message$message2, _this$message$message3;
	      return (_this$message$message2 = (_this$message$message3 = this.message.message) == null ? void 0 : _this$message$message3.match(pattern)[0]) != null ? _this$message$message2 : null;
	    },
	    errorMessage() {
	      return this.message.errors[0].MESSAGE;
	    },
	    errorLink() {
	      return this.message.errors[0].LINK;
	    },
	    popupOptions() {
	      return {
	        offsetLeft: this.$refs.error.$el.offsetWidth / 2,
	        maxWidth: 494,
	        width: 494
	      };
	    }
	  },
	  methods: {
	    openHint() {
	      if (this.activeHintRowId !== null && this.activeHintRowId !== this.message.rowId) {
	        return;
	      }
	      if (!this.showHint) {
	        this.showHint = true;
	        this.$emit('hintOpen', this.message.rowId);
	      }
	    },
	    closeHint() {
	      if (this.showHint) {
	        this.showHint = false;
	        this.$emit('hintClose', this.message.rowId);
	      }
	    }
	  },
	  template: `
		<div class="tasks-field-replication-message">
			<div v-if="message.link">{{ formattedMessage }} <a :href="message.link">{{ linkText }}</a></div>
			<span v-else>{{ message.message }}</span>
			<BIcon
				v-if="message.errors?.length > 0"
				class="tasks-field-replication-error-icon"
				:name="Outline.ALERT"
				ref="error"
				@mouseenter="openHint"
			/>
			<Hint v-if="showHint" :bindElement="$refs.error.$el" :options="popupOptions" @close="closeHint">
				<ErrorHint :errorMessage :errorLink/>
			</Hint>
		</div>
	`
	};

	// @vue/component
	const MessageFields = {
	  components: {
	    MessageField
	  },
	  props: {
	    getGrid: {
	      type: Function,
	      required: true
	    }
	  },
	  data() {
	    return {
	      systemLogMessageRef: [],
	      systemLogMessage: [],
	      activeHintRowId: null
	    };
	  },
	  methods: {
	    async update() {
	      const message = this.getGrid().querySelectorAll('[data-system-log-message]');
	      this.systemLogMessage = [...message].map(systemLogMessageNode => this.getSystemLogMessage(systemLogMessageNode));
	      await this.$nextTick();
	      message.forEach(systemLogMessageNode => {
	        const systemLogMessage = this.getSystemLogMessage(systemLogMessageNode);
	        systemLogMessageNode.append(this.systemLogMessageRef[systemLogMessage.rowId]);
	      });
	    },
	    getSystemLogMessage(systemLogMessageNode) {
	      const rowId = Number(systemLogMessageNode.closest('[data-id]').dataset.id);

	      /** @type {{ message: ?string, link: ?string, errors: ?array }} */
	      const message = JSON.parse(systemLogMessageNode.dataset.systemLogMessage);
	      return {
	        rowId,
	        message: message.message,
	        link: message.link,
	        errors: message.errors
	      };
	    },
	    setRef(element, rowId) {
	      var _this$systemLogMessag;
	      (_this$systemLogMessag = this.systemLogMessageRef) != null ? _this$systemLogMessag : this.systemLogMessageRef = {};
	      this.systemLogMessageRef[rowId] = element;
	    },
	    onHintOpen(rowId) {
	      this.activeHintRowId = rowId;
	    },
	    onHintClose(rowId) {
	      if (this.activeHintRowId === rowId) {
	        this.activeHintRowId = null;
	      }
	    }
	  },
	  template: `
		<template v-for="(message, id) in systemLogMessage" :key="id">
			<MessageField
				:ref="(el) => setRef(el?.$el, message.rowId)"
				:message="message"
				:activeHintRowId
				@hintOpen="onHintOpen"
				@hintClose="onHintClose"
			/>
		</template>
	`
	};

	// @vue/component
	const GridLoader = {
	  template: `
		<div class="tasks-template-history-grid-loader-spinner-container">
			<div class="tasks-template-history-grid-loader-spinner"/>
		</div>
	`
	};

	const gridId = 'tasks-template-history-grid';

	// @vue/component
	const ReplicationHistorySheetContent = {
	  components: {
	    TimeFields,
	    MessageFields,
	    GridLoader
	  },
	  inject: {
	    taskId: {}
	  },
	  setup() {},
	  computed: {
	    templateId() {
	      return tasks_v2_lib_idUtils.idUtils.unbox(this.taskId);
	    }
	  },
	  mounted() {
	    main_core_events.EventEmitter.subscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
	    main_core_events.EventEmitter.subscribe('Grid::updated', this.update);
	    void this.getData();
	  },
	  beforeUnmount() {
	    var _BX$Main, _BX$Main$gridManager, _PopupManager$getPopu;
	    main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
	    main_core_events.EventEmitter.unsubscribe('Grid::updated', this.update);
	    (_BX$Main = BX.Main) == null ? void 0 : (_BX$Main$gridManager = _BX$Main.gridManager) == null ? void 0 : _BX$Main$gridManager.destroy(gridId);
	    (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(`${gridId}-grid-settings-window`)) == null ? void 0 : _PopupManager$getPopu.destroy();
	  },
	  methods: {
	    async getData() {
	      const {
	        html
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateHistoryGetGrid, {
	        templateId: this.templateId
	      });
	      await main_core.Runtime.html(this.$refs.grid, html);
	      this.update();
	    },
	    handleBeforeGridRequest(event) {
	      const [, eventArgs] = event.getData();
	      if (eventArgs.url) {
	        var _eventArgs$url;
	        this.nav = new main_core.Uri((_eventArgs$url = eventArgs.url) != null ? _eventArgs$url : '').getQueryParams().nav;
	      }
	      eventArgs.url = `/bitrix/services/main/ajax.php?action=tasks.V2.Template.History.getGridData&nav=${this.nav}`;
	      eventArgs.method = 'POST';
	      eventArgs.data = {
	        templateId: this.templateId
	      };
	    },
	    update() {
	      void this.$refs.timeFields.update();
	      void this.$refs.messageFields.update();
	    }
	  },
	  template: `
		<div class="tasks-field-replication-sheet__history-grid-container">
			<div ref="grid" class="tasks-field-replication-sheet__history-grid-main-content"><GridLoader/></div>
			<TimeFields ref="timeFields" :getGrid="() => this.$refs.grid"/>
			<MessageFields ref="messageFields" :getGrid="() => this.$refs.grid"/>
		</div>
	`
	};

	// @vue/component
	const ReplicationHistorySheets = {
	  name: 'ReplicationHistorySheets',
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    ReplicationSheetHeader,
	    ReplicationHistorySheetContent
	  },
	  props: {
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close', 'update'],
	  methods: {
	    update(params) {
	      this.$emit('update', params);
	    }
	  },
	  template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<div class="tasks-field-replication-sheet">
				<ReplicationSheetHeader
					:head="loc('TASKS_V2_REPLICATION_HISTORY_SHEET')"
					@close="$emit('close')"
				/>
				<ReplicationHistorySheetContent/>
			</div>
		</BottomSheet>
	`
	};

	// @vue/component
	const Replication = {
	  name: 'TaskReplication',
	  components: {
	    BLine: ui_system_skeleton_vue.BLine,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextXs: ui_system_typography_vue.TextXs,
	    ReplicationContent,
	    ReplicationSheet,
	    ReplicationHistorySheets
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {},
	    isTemplate: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      required: true
	    },
	    isHistorySheetShown: {
	      type: Boolean,
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown', 'update:isHistorySheetShown'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      replicationMeta
	    };
	  },
	  data() {
	    return {
	      logCount: null,
	      isLoading: true
	    };
	  },
	  computed: {
	    historyTitle() {
	      return this.loc('TASKS_V2_REPLICATION_HISTORY', {
	        '#COUNT#': this.logCount
	      });
	    },
	    readonly() {
	      return !this.isTemplate || !this.task.rights.edit;
	    },
	    disabled() {
	      return this.isTemplate && (this.task.isForNewUser || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
	    }
	  },
	  created() {
	    void this.getLogCount();
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.getLogCount);
	  },
	  unmounted() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.getLogCount);
	  },
	  methods: {
	    async getLogCount() {
	      if (!this.isEdit || !this.isTemplate) {
	        return;
	      }
	      this.isLoading = true;
	      const templateId = tasks_v2_lib_idUtils.idUtils.unbox(this.taskId);
	      const {
	        count
	      } = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateHistoryGetCount, {
	        templateId
	      });
	      this.logCount = count != null ? count : 0;
	      this.isLoading = false;
	    },
	    handleClick() {
	      if (!this.readonly && !this.disabled) {
	        this.setSheetShown(true);
	      }
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    setHistorySheetShown(isShown) {
	      this.$emit('update:isHistorySheetShown', isShown);
	    }
	  },
	  template: `
		<div
			class="tasks-full-card-field-container tasks-field-replication"
			:data-task-id="task.id"
			:data-task-field-id="replicationMeta.id"
			data-field-container
			@click="handleClick"
		>
			<ReplicationContent/>
		</div>
		<template v-if="isEdit && isTemplate && task.replicate">
			<div v-if="isLoading" class="tasks-field-replication-history">
				<BLine :width="120"/>
			</div>
			<div
				v-else-if="logCount > 0"
				class="tasks-field-replication-history"
				@click="setHistorySheetShown(true)"
			>
				<TextXs className="tasks-field-replication-history-title">{{ historyTitle }}</TextXs>
				<BIcon :name="Outline.CHEVRON_RIGHT_M" color="var(--ui-color-base-4)"/>
			</div>
		</template>
		<ReplicationSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
		<ReplicationHistorySheets v-if="isHistorySheetShown" :sheetBindProps @close="setHistorySheetShown(false)"/>
	`
	};

	// @vue/component
	const ReplicationChip = {
	  name: 'ReplicationChip',
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    ReplicationSheet
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
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
	      replicationMeta,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    design() {
	      if (this.disabled) {
	        return ui_system_chip_vue.ChipDesign.ShadowDisabled;
	      }
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return this.task.filledFields[replicationMeta.id];
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.recurrentTask.available;
	    },
	    disabled() {
	      return this.isTemplate && (this.task.isForNewUser || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
	    },
	    tooltip() {
	      if (!this.disabled) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_REPLICATION_TEMPLATE_NOTICE', {
	          '#TPARAM_FOR_NEW_USER#': this.loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER')
	        }),
	        popupOptions: {
	          offsetLeft: this.$refs.chip.$el.offsetWidth / 2
	        },
	        timeout: 200
	      });
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.recurrentTask.featureId,
	          bindElement: this.$el
	        });
	        return;
	      }
	      if (this.disabled) {
	        return;
	      }
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      this.setSheetShown(true);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    }
	  },
	  template: `
		<Chip
			v-hint="tooltip"
			:design
			:icon="Outline.REPEAT"
			:text="loc('TASKS_V2_REPLICATION_TITLE_CHIP')"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="replicationMeta.id"
			ref="chip"
			@click="handleClick"
		/>
		<ReplicationSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.Replication = Replication;
	exports.ReplicationChip = ReplicationChip;
	exports.ReplicationSheet = ReplicationSheet;
	exports.replicationMeta = replicationMeta;
	exports.DateStringConverter = DateStringConverter;
	exports.TimeStringConverter = TimeStringConverter;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.System.Skeleton.Vue,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Vue3,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Fields,BX.UI.Vue3.Components,BX.UI.System.Input.Vue,BX.Tasks.V2.Component.Elements,BX.UI.DatePicker,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Fields,BX.UI.Vue3.Components,BX.UI.System.Menu,BX.Tasks.V2.Component.Elements,BX.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX.UI.System.Typography.Vue,BX,BX.Event,BX.Main,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Main,BX.Tasks.V2.Lib,BX.Vue3.Directives,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib));
//# sourceMappingURL=replication.bundle.js.map
