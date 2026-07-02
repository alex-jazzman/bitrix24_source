/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core_events, ui_system_typography_vue, ui_system_skeleton_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, ui_vue3_directives_hint, tasks_v2_component_elements_fieldAdd, tasks_v2_component_elements_hint, tasks_v2_component_elements_hoverPill, tasks_v2_provider_service_taskService, main_core, main_date, tasks_v2_lib_timezone, tasks_v2_lib_calendar, tasks_v2_component_elements_bottomSheet, ui_vue3, ui_vue3_components_richLoc, tasks_v2_component_elements_uiTabs, tasks_v2_component_elements_questionMark, ui_system_input_vue, tasks_v2_component_elements_checkbox, tasks_v2_component_elements_radio, tasks_v2_component_elements_select, ui_vue3_components_button, tasks_v2_component_fields_replication, ui_vue3_components_popup, ui_datePicker, tasks_v2_component_fields_deadline, ui_system_menu_vue, tasks_v2_lib_fieldHighlighter, main_popup, ui_system_chip_vue, tasks_v2_core, tasks_v2_lib_showLimit) {
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

	function _classPrivateFieldInitSpec$4(e, t, a) { _checkPrivateRedeclaration$4(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$4(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$4(s, a) { return s.get(_assertClassBrand$4(s, a)); }
	function _classPrivateFieldSet$4(s, a, r) { return s.set(_assertClassBrand$4(s, a), r), r; }
	function _assertClassBrand$4(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _replicateParams$4 = /*#__PURE__*/new WeakMap();
	class PeriodRuleDailyGenerator {
		constructor(replicateParams) {
			_classPrivateFieldInitSpec$4(this, _replicateParams$4, void 0);
			_classPrivateFieldSet$4(_replicateParams$4, this, replicateParams);
		}
		generate() {
			const dailyMonthInterval = _classPrivateFieldGet$4(_replicateParams$4, this).dailyMonthInterval;
			const everyDay = _classPrivateFieldGet$4(_replicateParams$4, this).everyDay || 1;
			if (dailyMonthInterval > 0) {
				return main_core.Loc.getMessage('TASKS_V2_REPLICATION_MONTHLY_2', {
					'#DAY_NUMBER#': main_date.DateTimeFormat.format('ddiff', 0, everyDay * 60 * 60 * 24, true),
					'#WEEKDAY_NAME#': '',
					'#NUMBER#': " ".concat(dailyMonthInterval + 1)
				});
			}
			return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DAILY', everyDay, {
				'#NUMBER#': everyDay > 1 ? " ".concat(everyDay) : ''
			});
		}
	}

	function _classPrivateMethodInitSpec$3(e, a) { _checkPrivateRedeclaration$3(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$3(e, t, a) { _checkPrivateRedeclaration$3(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateGetter(s, r, a) { return a(_assertClassBrand$3(s, r)); }
	function _classPrivateFieldGet$3(s, a) { return s.get(_assertClassBrand$3(s, a)); }
	function _classPrivateFieldSet$3(s, a, r) { return s.set(_assertClassBrand$3(s, a), r), r; }
	function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _replicateParams$3 = /*#__PURE__*/new WeakMap();
	var _PeriodRuleWeeklyGenerator_brand = /*#__PURE__*/new WeakSet();
	class PeriodRuleWeeklyGenerator {
		constructor(replicateParams) {
			_classPrivateMethodInitSpec$3(this, _PeriodRuleWeeklyGenerator_brand);
			_classPrivateFieldInitSpec$3(this, _replicateParams$3, void 0);
			_classPrivateFieldSet$3(_replicateParams$3, this, replicateParams);
		}
		generate() {
			const everyWeek = _classPrivateFieldGet$3(_replicateParams$3, this).everyWeek || 1;
			const weekDaysLabel = _classPrivateGetter(_PeriodRuleWeeklyGenerator_brand, this, _get_weekDays).length === 7 ? main_core.Loc.getMessage('TASKS_V2_REPLICATION_WEEKLY_EVERYDAY') : _classPrivateGetter(_PeriodRuleWeeklyGenerator_brand, this, _get_weekDays).map(wd => main_core.Loc.getMessage("TASKS_V2_REPLICATION_WD_".concat(wd))).join(', ');
			return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_WEEKLY', everyWeek, {
				'#NUMBER#': everyWeek > 1 ? " ".concat(everyWeek) : '',
				'#WEEKDAYS#': " (".concat(weekDaysLabel, ")")
			});
		}
	}
	function _get_weekDays(_this) {
		const weekDays = _classPrivateFieldGet$3(_replicateParams$3, _this).weekDays;
		return [...((weekDays === null || weekDays === void 0 ? void 0 : weekDays.length) > 0 ? weekDays : [1])].sort();
	}

	function _classPrivateMethodInitSpec$2(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$2(e, t, a) { _checkPrivateRedeclaration$2(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$2(s, a) { return s.get(_assertClassBrand$2(s, a)); }
	function _classPrivateFieldSet$2(s, a, r) { return s.set(_assertClassBrand$2(s, a), r), r; }
	function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _replicateParams$2 = /*#__PURE__*/new WeakMap();
	var _PeriodRuleMonthlyGenerator_brand = /*#__PURE__*/new WeakSet();
	class PeriodRuleMonthlyGenerator {
		constructor(replicateParams) {
			_classPrivateMethodInitSpec$2(this, _PeriodRuleMonthlyGenerator_brand);
			_classPrivateFieldInitSpec$2(this, _replicateParams$2, void 0);
			_classPrivateFieldSet$2(_replicateParams$2, this, replicateParams);
		}
		generate() {
			return _classPrivateFieldGet$2(_replicateParams$2, this).monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute ? _assertClassBrand$2(_PeriodRuleMonthlyGenerator_brand, this, _generateAbsolute$1).call(this) : _assertClassBrand$2(_PeriodRuleMonthlyGenerator_brand, this, _generateRelative$1).call(this);
		}
	}
	function _generateAbsolute$1() {
		const monthlyMonthNum = _classPrivateFieldGet$2(_replicateParams$2, this).monthlyMonthNum1 || 1;
		return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_MONTHLY_1', monthlyMonthNum, {
			'#NUMBER#': monthlyMonthNum > 1 ? " ".concat(monthlyMonthNum) : '',
			'#DAY_NUMBER#': _classPrivateFieldGet$2(_replicateParams$2, this).monthlyDayNum
		});
	}
	function _generateRelative$1() {
		const monthlyWeekDay = _classPrivateFieldGet$2(_replicateParams$2, this).monthlyWeekDay;
		const weekDayNum = _classPrivateFieldGet$2(_replicateParams$2, this).monthlyWeekDayNum;
		const localePostfix = getWeekDayGender(monthlyWeekDay);
		const dayNumber = main_core.Loc.getMessage("TASKS_V2_REPLICATION_NUMBER_".concat(weekDayNum).concat(localePostfix));
		const weekDay = main_core.Loc.getMessage("TASKS_V2_REPLICATION_WD_ALT_".concat(monthlyWeekDay + 1));
		const monthlyMonthNum = _classPrivateFieldGet$2(_replicateParams$2, this).monthlyMonthNum2 || 1;
		return main_core.Loc.getMessage("TASKS_V2_REPLICATION_MONTHLY_2".concat(_assertClassBrand$2(_PeriodRuleMonthlyGenerator_brand, this, _getLocaleMonthlyOfDayType2Alt).call(this)), {
			'#DAY_NUMBER#': dayNumber,
			'#WEEKDAY_NAME#': weekDay,
			'#NUMBER#': monthlyMonthNum > 1 ? " ".concat(monthlyMonthNum) : ''
		});
	}
	function _getLocaleMonthlyOfDayType2Alt() {
		const weekDay = _classPrivateFieldGet$2(_replicateParams$2, this).monthlyWeekDay;
		if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Sunday) {
			return '_ALT_1';
		}
		if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Wednesday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Friday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Saturday) {
			return '_ALT_0';
		}
		return '';
	}

	function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
	function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _replicateParams$1 = /*#__PURE__*/new WeakMap();
	var _PeriodRuleYearlyGenerator_brand = /*#__PURE__*/new WeakSet();
	class PeriodRuleYearlyGenerator {
		constructor(replicateParams) {
			_classPrivateMethodInitSpec$1(this, _PeriodRuleYearlyGenerator_brand);
			_classPrivateFieldInitSpec$1(this, _replicateParams$1, void 0);
			_classPrivateFieldSet$1(_replicateParams$1, this, replicateParams);
		}
		generate() {
			return _classPrivateFieldGet$1(_replicateParams$1, this).yearlyType === tasks_v2_const.ReplicationYearlyType.Absolute ? _assertClassBrand$1(_PeriodRuleYearlyGenerator_brand, this, _generateAbsolute).call(this) : _assertClassBrand$1(_PeriodRuleYearlyGenerator_brand, this, _generateRelative).call(this);
		}
	}
	function _generateAbsolute() {
		const yearlyDayNum = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyDayNum || 1;
		const yearlyMonth = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyMonth1 || 1;
		return main_core.Loc.getMessage('TASKS_V2_REPLICATION_YEARLY_1', {
			'#NUMBER#': " ".concat(yearlyDayNum),
			'#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
		});
	}
	function _generateRelative() {
		const yearlyWeekDayNum = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyWeekDayNum || 0;
		const yearlyWeekDay = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyWeekDay || 0;
		const yearlyMonth = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyMonth2 || 1;
		const dayNumberLabel = main_core.Loc.getMessage("TASKS_V2_REPLICATION_NUMBER_".concat(yearlyWeekDayNum).concat(getWeekDayGender(yearlyWeekDay - 1)));
		return main_core.Loc.getMessage("TASKS_V2_REPLICATION_YEARLY_2".concat(_assertClassBrand$1(_PeriodRuleYearlyGenerator_brand, this, _getLocaleType2Alt).call(this)), {
			'#DAY_NUMBER#': dayNumberLabel,
			'#WEEK_DAY#': main_core.Loc.getMessage("TASKS_V2_REPLICATION_WD_ALT_".concat(yearlyWeekDay)),
			'#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
		});
	}
	function _getLocaleType2Alt() {
		const weekDay = _classPrivateFieldGet$1(_replicateParams$1, this).yearlyWeekDay;
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
			const _timeString$split = timeString.split(':'),
				_timeString$split2 = babelHelpers.slicedToArray(_timeString$split, 2),
				hours = _timeString$split2[0],
				minutes = _timeString$split2[1];
			date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
			return date;
		}
		static convertTsToServerTimeString(browserTs) {
			const serverTs = main_date.Timezone.BrowserTime.toServer(browserTs / 1000);
			return main_date.DateTimeFormat.format('H:i', serverTs);
		}
	}

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _replicateParams = /*#__PURE__*/new WeakMap();
	var _periodRuleGenerator = /*#__PURE__*/new WeakMap();
	var _ReplicateRuleGenerator_brand = /*#__PURE__*/new WeakSet();
	class ReplicateRuleGenerator {
		constructor(replicateParams) {
			_classPrivateMethodInitSpec(this, _ReplicateRuleGenerator_brand);
			_classPrivateFieldInitSpec(this, _replicateParams, void 0);
			_classPrivateFieldInitSpec(this, _periodRuleGenerator, void 0);
			_classPrivateFieldSet(_replicateParams, this, replicateParams);
			_assertClassBrand(_ReplicateRuleGenerator_brand, this, _setPeriodRuleGenerator).call(this, replicateParams.period);
		}
		generate() {
			return [_classPrivateFieldGet(_periodRuleGenerator, this).generate(), _assertClassBrand(_ReplicateRuleGenerator_brand, this, _getStartTimeRule).call(this), _assertClassBrand(_ReplicateRuleGenerator_brand, this, _getEndRule).call(this)].join(' ');
		}
	}
	function _setPeriodRuleGenerator(period) {
		switch (period) {
			case tasks_v2_const.ReplicationPeriod.Weekly:
				{
					_classPrivateFieldSet(_periodRuleGenerator, this, new PeriodRuleWeeklyGenerator(_classPrivateFieldGet(_replicateParams, this)));
					break;
				}
			case tasks_v2_const.ReplicationPeriod.Monthly:
				{
					_classPrivateFieldSet(_periodRuleGenerator, this, new PeriodRuleMonthlyGenerator(_classPrivateFieldGet(_replicateParams, this)));
					break;
				}
			case tasks_v2_const.ReplicationPeriod.Yearly:
				{
					_classPrivateFieldSet(_periodRuleGenerator, this, new PeriodRuleYearlyGenerator(_classPrivateFieldGet(_replicateParams, this)));
					break;
				}
			default:
				{
					_classPrivateFieldSet(_periodRuleGenerator, this, new PeriodRuleDailyGenerator(_classPrivateFieldGet(_replicateParams, this)));
				}
		}
	}
	function _getStartTimeRule() {
		const timeTs = _classPrivateFieldGet(_replicateParams, this).startTs;
		return main_core.Loc.getMessage('TASKS_V2_REPLICATION_START_TIME', {
			'#TIME#': TimeStringConverter.format(timeTs)
		});
	}
	function _getEndRule() {
		const repeatTill = _classPrivateFieldGet(_replicateParams, this).repeatTill;
		if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Times) {
			const times = _classPrivateFieldGet(_replicateParams, this).times;
			return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_END_AFTER_REPETITIONS', times, {
				'#COUNT#': times
			});
		}
		if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Date && _classPrivateFieldGet(_replicateParams, this).endTs) {
			return main_core.Loc.getMessage('TASKS_V2_REPLICATION_END_DATE', {
				'#DATE#': main_date.DateTimeFormat.format('d.m.Y', new Date(_classPrivateFieldGet(_replicateParams, this).endTs))
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
		template: "\n\t\t<HoverPill :readonly withClear textOnly noOffset style=\"width: auto\" @clear=\"dontReplicate\">\n\t\t\t<TextMd>{{ ruleFormatted }}</TextMd>\n\t\t</HoverPill>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-wrapper\">\n\t\t\t<div class=\"tasks-field-replication-title\">\n\t\t\t\t<TextSm style=\"color: var(--ui-color-base-3)\">{{ loc('TASKS_V2_REPLICATION_TITLE') }}</TextSm>\n\t\t\t</div>\n\t\t\t<div class=\"tasks-field-replication-content\">\n\t\t\t\t<ReplicationContentState v-if=\"task.replicate\"/>\n\t\t\t\t<FieldAdd v-else v-hint=\"tooltip\" :icon=\"Outline.REPEAT\" :disabled ref=\"add\"/>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	const ReplicationIntervalControlType = Object.freeze({
		Checkbox: 'checkbox',
		Radio: 'radio',
		None: 'none'
	});

	// @vue/component
	const ReplicationInterval = {
		name: 'ReplicationInterval',
		components: {
			RichLoc: ui_vue3_components_richLoc.RichLoc,
			BInput: ui_system_input_vue.BInput,
			TextXs: ui_system_typography_vue.TextXs,
			UiCheckbox: tasks_v2_component_elements_checkbox.Checkbox,
			UiRadio: tasks_v2_component_elements_radio.UiRadio
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
			},
			controlType: {
				type: String,
				default: ReplicationIntervalControlType.Checkbox,
				validator: value => {
					return Object.values(ReplicationIntervalControlType).includes(value);
				}
			},
			inputName: {
				type: String,
				default: ''
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
					return ((_this$interval = this.interval) === null || _this$interval === void 0 ? void 0 : _this$interval.toString()) || '';
				},
				set() {
					var _parseInt;
					let value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
					let interval = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) !== null && _parseInt !== void 0 ? _parseInt : 0;
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
			},
			isCheckbox() {
				return this.controlType === ReplicationIntervalControlType.Checkbox;
			},
			isRadio() {
				return this.controlType === ReplicationIntervalControlType.Radio;
			},
			radioValue() {
				return this.useInterval ? 'selected' : '';
			}
		},
		methods: {
			toggleCheckbox() {
				this.useIntervalValue = !this.useInterval;
			},
			selectRadio() {
				if (!this.useInterval) {
					this.$emit('update:useInterval', true);
				}
			}
		},
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-replication-sheet-action-row\"\n\t\t\t:class=\"{\n\t\t\t\t'--active': useInterval,\n\t\t\t\t'--selectable': isRadio,\n\t\t\t}\"\n\t\t\t@click.self=\"isRadio && selectRadio()\"\n\t\t>\n\t\t\t\t<UiCheckbox\n\t\t\t\t\tv-if=\"isCheckbox\"\n\t\t\t\t\t:checked=\"useIntervalValue\"\n\t\t\t\t\t@click=\"toggleCheckbox\"\n\t\t\t\t/>\n\t\t\t\t<UiRadio\n\t\t\t\t\tv-else-if=\"isRadio\"\n\t\t\t\t\ttag=\"label\"\n\t\t\t\t\t:modelValue=\"radioValue\"\n\t\t\t\t\tvalue=\"selected\"\n\t\t\t\t:inputName\n\t\t\t\t@update:modelValue=\"selectRadio\"\n\t\t\t/>\n\t\t\t<RichLoc\n\t\t\t\tclass=\"tasks-field-replication-row --text\"\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_SETTINGS_INTERVAL')\"\n\t\t\t\tplaceholder=\"[interval/]\"\n\t\t\t>\n\t\t\t\t<template #interval>\n\t\t\t\t\t<RichLoc class=\"tasks-field-replication-row\" :text=\"intervalPeriod\" placeholder=\"[value/]\">\n\t\t\t\t\t\t<template #value>\n\t\t\t\t\t\t\t<BInput\n\t\t\t\t\t\t\t\tv-model=\"intervalValue\"\n\t\t\t\t\t\t\t\t:size=\"InputSize.Sm\"\n\t\t\t\t\t\t\t\t:design=\"useInterval ? InputDesign.Grey : InputDesign.Disabled\"\n\t\t\t\t\t\t\t\t:disabled=\"!useInterval\"\n\t\t\t\t\t\t\t\tstyle=\"width: 5em; padding-bottom: 0;\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</template>\n\t\t\t\t\t</RichLoc>\n\t\t\t\t</template>\n\t\t\t</RichLoc>\n\t\t\t<div class=\"tasks-field-replication-row-grow\"></div>\n\t\t\t<slot name=\"hint\"/>\n\t\t</div>\n\t"
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
					return true;
				},
				set(useInterval) {
					if (!useInterval) {
						return;
					}
					this.$emit('update', {
						everyDay: this.interval
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
		template: "\n\t\t<div class=\"tasks-replication-sheet-replication-settings-day tasks-field-replication-sheet__stack\">\n\t\t\t<ReplicationInterval\n\t\t\t\tv-model:useInterval=\"useInterval\"\n\t\t\t\tv-model:interval=\"interval\"\n\t\t\t\t:period\n\t\t\t\tcontrolType=\"radio\"\n\t\t\t\tinputName=\"tasks-replication-sheet-daily-interval-type\"\n\t\t\t>\n\t\t\t\t<template #hint>\n\t\t\t\t\t<QuestionMark\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row__hint\"\n\t\t\t\t\t\t:hintText\n\t\t\t\t\t\t:hintMaxWidth=\"260\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</ReplicationInterval>\n\t\t\t<ReplicationInterval\n\t\t\t\tv-model:useInterval=\"useMonthInterval\"\n\t\t\t\tv-model:interval=\"monthInterval\"\n\t\t\t\t:period=\"monthPeriod\"\n\t\t\t>\n\t\t\t\t<template #hint>\n\t\t\t\t\t<QuestionMark\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row__hint\"\n\t\t\t\t\t\t:hintText=\"monthHintText\"\n\t\t\t\t\t\t:hintMaxWidth=\"260\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</ReplicationInterval>\n\t\t</div>\n\t"
	};

	const week$1 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const weekValues$1 = {
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
				return [week$1.slice(weekStartIndex), week$1.slice(0, weekStartIndex)].flat(1);
			},
			dayLabelMap() {
				const format = 'D';
				const todayDayIndex = new Date().getDay();
				return this.weekDays.map(day => {
					const dayDate = new Date();
					const dayDifference = (week$1.indexOf(day) - todayDayIndex) % 7;
					dayDate.setDate(dayDate.getDate() + dayDifference);
					return {
						label: main_date.DateTimeFormat.format(format, dayDate),
						value: weekValues$1[day]
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
		template: "\n\t\t<div class=\"tasks-replication-sheet-action-row --weekdays\">\n\t\t\t<label\n\t\t\t\tv-for=\"day in dayLabelMap\"\n\t\t\t\t:key=\"day.value\"\n\t\t\t\tclass=\"tasks-field-replication-weekday\"\n\t\t\t\t:data-id=\"'tasks-replication-week-day-' + day.value\"\n\t\t\t>\n\t\t\t\t<UiCheckbox tag=\"span\" :checked=\"selectedDays.includes(day.value)\" @click=\"changeDay(day.value)\"/>\n\t\t\t\t<TextXs :className=\"['tasks-field-replication-weekday-text', {\n\t\t\t\t\t'--checked': selectedDays.includes(day.value),\n\t\t\t\t}]\">\n\t\t\t\t\t{{ day.label }}\n\t\t\t\t</TextXs>\n\t\t\t</label>\n\t\t</div>\n\t"
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
		created() {
			if (this.replicateParams.everyWeek > 0) {
				return;
			}
			this.$emit('update', {
				everyWeek: this.interval
			});
		},
		computed: {
			period() {
				return ui_vue3.markRaw(tasks_v2_const.ReplicationPeriod.Weekly);
			},
			useInterval: {
				get() {
					return true;
				},
				set(useInterval) {
					if (!useInterval) {
						return;
					}
					this.$emit('update', {
						everyWeek: this.interval
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
		template: "\n\t\t<div class=\"tasks-replication-sheet-replication-settings-week tasks-field-replication-sheet__stack\">\n\t\t\t<ReplicationSettingsWeekDaysList v-model:selectedDays=\"weekDays\"/>\n\t\t\t\t<ReplicationInterval\n\t\t\t\t\tv-model:useInterval=\"useInterval\"\n\t\t\t\t\tv-model:interval=\"interval\"\n\t\t\t\t\t:period\n\t\t\t\t\tcontrolType=\"radio\"\n\t\t\t\t\tinputName=\"tasks-replication-sheet-weekly-interval-type\"\n\t\t\t\t>\n\t\t\t\t<template #hint>\n\t\t\t\t\t<QuestionMark\n\t\t\t\t\t\t:hintText\n\t\t\t\t\t\t:hintMaxWidth=\"260\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</ReplicationInterval>\n\t\t</div>\n\t"
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
			updateDayNumber() {
				var _parseInt;
				let dayNumber = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
				let days = (_parseInt = parseInt(dayNumber.replaceAll(/\D/g, ''), 10)) !== null && _parseInt !== void 0 ? _parseInt : 0;
				if (!Number.isInteger(days) || days < 1 || days > 31) {
					days = this.prevDayNumber;
				}
				this.prevDayNumber = days;
				this.$emit('update:dayNumber', days);
			}
		},
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t@click.self=\"$emit('update:monthlyType', ReplicationMonthlyType.Absolute)\"\n\t\t>\n\t\t\t<UiRadio\n\t\t\t\t:modelValue=\"monthlyType\"\n\t\t\t\t:value=\"ReplicationMonthlyType.Absolute\"\n\t\t\t\tinputName=\"tasks-replication-sheet-monthly-type\"\n\t\t\t\t@update:modelValue=\"$emit('update:monthlyType', $event)\"\n\t\t\t/>\n\t\t\t<RichLoc class=\"tasks-field-replication-row\" :text=\"loc('TASKS_V2_REPLICATION_NTH_DAY')\" placeholder=\"[day/]\">\n\t\t\t\t<template #day>\n\t\t\t\t\t<BInput\n\t\t\t\t\t\t:modelValue=\"String(dayNumber)\"\n\t\t\t\t\t\t:size=\"InputSize.Sm\"\n\t\t\t\t\t\t:design=\"!disabled ? InputDesign.Grey : InputDesign.Disabled\"\n\t\t\t\t\t\t:disabled\n\t\t\t\t\t\tstretched\n\t\t\t\t\t\tstyle=\"max-width: 4em; padding-bottom: 0;\"\n\t\t\t\t\t\t@update:modelValue=\"updateDayNumber\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</RichLoc>\n\t\t</div>\n\t"
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
					title: this.loc("TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FIRST".concat(this.itemLocaleAlt))
				}, {
					id: 1,
					title: this.loc("TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_SECOND".concat(this.itemLocaleAlt))
				}, {
					id: 2,
					title: this.loc("TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_THIRD".concat(this.itemLocaleAlt))
				}, {
					id: 3,
					title: this.loc("TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FOURTH".concat(this.itemLocaleAlt))
				}, {
					id: 4,
					title: this.loc("TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_LAST".concat(this.itemLocaleAlt))
				}];
			},
			item() {
				return this.items.find(_ref => {
					let id = _ref.id;
					return id === this.modelValue;
				});
			}
		},
		template: "\n\t\t<UiSelect\n\t\t\t:item\n\t\t\t:items\n\t\t\t:disabled\n\t\t\t@update:item=\"$emit('update:modelValue', $event.id)\"\n\t\t/>\n\t"
	};

	const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const weekValues = {
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
				return [week.slice(weekStartIndex), week.slice(0, weekStartIndex)].flat(1).map(day => {
					const dayDate = new Date();
					const dayDifference = (week.indexOf(day) - todayDayIndex) % 7;
					dayDate.setDate(dayDate.getDate() + dayDifference);
					return {
						id: weekValues[day],
						title: main_date.DateTimeFormat.format(format, dayDate)
					};
				});
			},
			item() {
				return this.items.find(_ref => {
					let id = _ref.id;
					return id === this.modelValue;
				});
			}
		},
		template: "\n\t\t<UiSelect\n\t\t\t:item\n\t\t\t:items\n\t\t\t:disabled\n\t\t\t@update:item=\"$emit('update:modelValue', $event.id)\"\n\t\t/>\n\t"
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
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t@click.self=\"$emit('update:monthlyType', ReplicationMonthlyType.Relative)\"\n\t\t>\n\t\t\t<UiRadio\n\t\t\t\t:modelValue=\"monthlyType\"\n\t\t\t\t:value=\"ReplicationMonthlyType.Relative\"\n\t\t\t\tinputName=\"tasks-replication-sheet-monthly-type\"\n\t\t\t\t@update:modelValue=\"$emit('update:monthlyType', $event)\"\n\t\t\t/>\n\t\t\t<SerialNumberSelect\n\t\t\t\t:modelValue=\"weekDayNumber\"\n\t\t\t\t:weekDay\n\t\t\t\t:disabled\n\t\t\t\t@update:modelValue=\"$emit('update:weekDayNumber', $event)\"\n\t\t\t/>\n\t\t\t<WeekDaySelect\n\t\t\t\t:modelValue=\"weekDay\"\n\t\t\t\t:disabled\n\t\t\t\t@update:modelValue=\"$emit('update:weekDay', $event)\"\n\t\t\t/>\n\t\t</div>\n\t"
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
					return true;
				},
				set(useInterval) {
					if (!useInterval) {
						return;
					}
					this.updateMonthlyMonthNum(this.interval);
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
					return (_this$replicateParams = this.replicateParams.monthlyWeekDay) !== null && _this$replicateParams !== void 0 ? _this$replicateParams : tasks_v2_const.ReplicationWeekDayIndex.Monday;
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
					return (_this$replicateParams2 = this.replicateParams.monthlyWeekDayNum) !== null && _this$replicateParams2 !== void 0 ? _this$replicateParams2 : 0;
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet__stack\">\n\t\t\t<ReplicationSettingsMonthlyByDayOfMonth\n\t\t\t\tv-model:monthlyType=\"monthlyType\"\n\t\t\t\tv-model:dayNumber=\"monthlyDayNum\"\n\t\t\t/>\n\t\t\t<ReplicationSettingsMonthlyByDayOfWeek\n\t\t\t\tv-model:monthlyType=\"monthlyType\"\n\t\t\t\tv-model:weekDay=\"monthlyWeekDay\"\n\t\t\t\tv-model:weekDayNumber=\"monthlyWeekDayNum\"\n\t\t\t/>\n\t\t\t\t<ReplicationInterval\n\t\t\t\t\tv-model:useInterval=\"useInterval\"\n\t\t\t\t\tv-model:interval=\"interval\"\n\t\t\t\t\t:period\n\t\t\t\t\tcontrolType=\"none\"\n\t\t\t\t>\n\t\t\t\t<template #hint>\n\t\t\t\t\t<QuestionMark\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row__hint\"\n\t\t\t\t\t\t:hintText\n\t\t\t\t\t\t:hintMaxWidth=\"260\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</ReplicationInterval>\n\t\t</div>\n\t"
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
				return this.items.find(_ref => {
					let id = _ref.id;
					return id === this.modelValue;
				});
			},
			menuOptions() {
				return {
					height: 254
				};
			}
		},
		template: "\n\t\t<UiSelect\n\t\t\t:item\n\t\t\t:items\n\t\t\t:disabled\n\t\t\t:menuOptions\n\t\t\t@update:item=\"$emit('update:modelValue', $event.id)\"\n\t\t/>\n\t"
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
			updateDayNumber() {
				var _parseInt;
				let value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
				let day = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) !== null && _parseInt !== void 0 ? _parseInt : 0;
				if (!main_core.Type.isInteger(day) || day < 1 || day > 31) {
					day = this.prevDayNumber;
				}
				this.dayNumber = day;
			}
		},
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t@click.self=\"$emit('update:yearlyType', ReplicationYearlyType.Absolute)\"\n\t\t>\n\t\t\t<UiRadio\n\t\t\t\ttag=\"label\"\n\t\t\t\t:modelValue=\"yearlyType\"\n\t\t\t\t:value=\"ReplicationYearlyType.Absolute\"\n\t\t\t\tinputName=\"tasks-replication-sheet-yearly-type\"\n\t\t\t\t@update:modelValue=\"$emit('update:yearlyType', $event)\"\n\t\t\t/>\n\t\t\t<BInput\n\t\t\t\t:modelValue=\"dayNumber.toString()\"\n\t\t\t\t:size=\"InputSize.Sm\"\n\t\t\t\t:design=\"disabled ? InputDesign.Disabled : InputDesign.Grey\"\n\t\t\t\t:disabled\n\t\t\t\tstretched\n\t\t\t\tstyle=\"max-width: 4em;\"\n\t\t\t\t@update:modelValue=\"updateDayNumber\"\n\t\t\t/>\n\t\t\t<MonthSelect v-model=\"month\" :disabled/>\n\t\t</div>\n\t"
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
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t@click.self=\"$emit('update:yearlyType', ReplicationYearlyType.Relative)\"\n\t\t>\n\t\t\t<UiRadio\n\t\t\t\ttag=\"label\"\n\t\t\t\t:modelValue=\"yearlyType\"\n\t\t\t\t:value=\"ReplicationYearlyType.Relative\"\n\t\t\t\tinputName=\"tasks-replication-sheet-yearly-type\"\n\t\t\t\t@update:modelValue=\"$emit('update:yearlyType', $event)\"\n\t\t\t/>\n\t\t\t<SerialNumberSelect\n\t\t\t\tv-model=\"weekDayNum\"\n\t\t\t\t:weekDay\n\t\t\t\t:disabled\n\t\t\t\tstyle=\"max-width: 9em\"\n\t\t\t/>\n\t\t\t<WeekDaySelect v-model=\"weekDay\" :disabled style=\"max-width: 11em\"/>\n\t\t\t<MonthSelect v-model=\"month\" :disabled style=\"max-width: 11em\"/>\n\t\t</div>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet__stack\">\n\t\t\t<ReplicationSettingsYearAbsoluteDate\n\t\t\t\tv-model:yearlyType=\"yearlyType\"\n\t\t\t\t:yearlyDayNumber=\"replicateParams.yearlyDayNum || 1\"\n\t\t\t\t:yearlyMonth=\"replicateParams.yearlyMonth1 || 1\"\n\t\t\t\t@update:yearlyDayNumber=\"update({ yearlyDayNum: $event })\"\n\t\t\t\t@update:yearlyMonth=\"update({ yearlyMonth1: $event })\"\n\t\t\t/>\n\t\t\t<ReplicationSettingsYearRelativeDate\n\t\t\t\tv-model:yearlyType=\"yearlyType\"\n\t\t\t\tv-model:yearlyWeekDay=\"yearlyWeekDay\"\n\t\t\t\t:yearlyWeekDayNum=\"replicateParams.yearlyWeekDayNum || 0\"\n\t\t\t\t:yearlyMonth=\"replicateParams.yearlyMonth2 || 1\"\n\t\t\t\t@update:yearlyWeekDayNum=\"update({ yearlyWeekDayNum: $event })\"\n\t\t\t\t@update:yearlyMonth=\"update({ yearlyMonth2: $event })\"\n\t\t\t/>\n\t\t</div>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-section\">\n\t\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-row\">\n\t\t\t\t<span class=\"tasks-field-replication-secondary\">{{ title }}</span>\n\t\t\t</TextMd>\n\t\t\t<div class=\"tasks-field-replication-sheet-replication-settings-content\">\n\t\t\t\t<UiTabs\n\t\t\t\t\tv-model=\"period\"\n\t\t\t\t\t:tabs\n\t\t\t\t>\n\t\t\t\t\t<template v-slot=\"{ activeTab }\">\n\t\t\t\t\t\t<component\n\t\t\t\t\t\t\t:is=\"activeTab.component\"\n\t\t\t\t\t\t\t@update=\"$emit('update', $event)\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</template>\n\t\t\t\t</UiTabs>\n\t\t\t</div>\n\t\t</div>\n\t"
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
		static convertServerDateToTs(serverDate) {
			let serverTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
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
			(_this$datePicker = this.datePicker) === null || _this$datePicker === void 0 || _this$datePicker.destroy();
		},
		methods: {
			createDatePicker() {
				const offset = tasks_v2_lib_timezone.timezone.getOffset(this.dateTs);
				const picker = new ui_datePicker.DatePicker({
					popupOptions: {
						id: "tasks-replication-date-picker-".concat(this.taskId, "-").concat(main_core.Text.getRandom()),
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
							const _event$getData = event.getData(),
								date = _event$getData.date;
							const dateTsModel = tasks_v2_lib_calendar.calendar.createDateFromUtc(date).getTime();
							this.$emit('update:dateTs', dateTsModel - tasks_v2_lib_timezone.timezone.getOffset(dateTsModel));
						}
					}
				});
				picker.getPicker('day').subscribe('onSelect', event => {
					const _event$getData2 = event.getData(),
						year = _event$getData2.year,
						month = _event$getData2.month,
						day = _event$getData2.day;
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
		template: "\n\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-section\">\n\t\t\t<RichLoc\n\t\t\t\tclass=\"tasks-field-replication-row tasks-field-replication-secondary\"\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_START')\"\n\t\t\t\tplaceholder=\"[date/]\"\n\t\t\t>\n\t\t\t\t<template #date>\n\t\t\t\t\t<HoverPill textOnly noOffset ref=\"datepickerStartOpener\">\n\t\t\t\t\t\t<span class=\"tasks-field-replication-link\" @click=\"isDatepickerOpened = true\">\n\t\t\t\t\t\t\t{{ startLabel }}\n\t\t\t\t\t\t</span>\n\t\t\t\t\t</HoverPill>\n\t\t\t\t\t<ReplicationDatepicker\n\t\t\t\t\t\tv-if=\"isDatepickerOpened\"\n\t\t\t\t\t\tv-model:dateTs=\"startTs\"\n\t\t\t\t\t\t:bindElement=\"$refs.datepickerStartOpener.$el\"\n\t\t\t\t\t\t@close=\"isDatepickerOpened = false\"\n\t\t\t\t\t/>\n\t\t\t\t</template>\n\t\t\t</RichLoc>\n\t\t</TextMd>\n\t"
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
				let times = (_parseInt = parseInt(value.replaceAll(/\D/g, ''), 10)) !== null && _parseInt !== void 0 ? _parseInt : 0;
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
		template: "\n\t\t<div class=\"tasks-field-replication-section\">\n\t\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-row\">\n\t\t\t\t<span class=\"tasks-field-replication-secondary\">\n\t\t\t\t\t{{ loc('TASKS_V2_REPLICATION_FINISH') }}\n\t\t\t\t</span>\n\t\t\t</TextMd>\n\t\t\t<div>\n\t\t\t\t<div class=\"tasks-field-replication-sheet__stack\">\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t\t\t\t:class=\"{'--active': isRowActive(ReplicationRepeatTill.Endless)}\"\n\t\t\t\t\t\t@click.self=\"repeatTill = ReplicationRepeatTill.Endless\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<UiRadio\n\t\t\t\t\t\t\ttag=\"label\"\n\t\t\t\t\t\t\tv-model=\"repeatTill\"\n\t\t\t\t\t\t\t:value=\"ReplicationRepeatTill.Endless\"\n\t\t\t\t\t\t\tinputName=\"tasks-replication-sheet-finish-type\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<TextXs className=\"tasks-replication-sheet-action-row__text\">\n\t\t\t\t\t\t\t{{ loc('TASKS_V2_REPLICATION_FINISH_HAND') }}\n\t\t\t\t\t\t</TextXs>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t\t\t\t:class=\"{'--active': isRowActive(ReplicationRepeatTill.Times)}\"\n\t\t\t\t\t\t@click.self=\"repeatTill = ReplicationRepeatTill.Times\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<UiRadio\n\t\t\t\t\t\t\ttag=\"label\"\n\t\t\t\t\t\t\tv-model=\"repeatTill\"\n\t\t\t\t\t\t\t:value=\"ReplicationRepeatTill.Times\"\n\t\t\t\t\t\t\tinputName=\"tasks-replication-sheet-finish-type\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<RichLoc\n\t\t\t\t\t\t\tclass=\"tasks-field-replication-row\"\n\t\t\t\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_AFTER_COUNT_REPETITIONS')\"\n\t\t\t\t\t\t\tplaceholder=\"[count/]\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<template #count>\n\t\t\t\t\t\t\t\t<BInput\n\t\t\t\t\t\t\t\t\t:modelValue=\"String(replicateParams.times ?? '')\"\n\t\t\t\t\t\t\t\t\t:size=\"InputSize.Sm\"\n\t\t\t\t\t\t\t\t\t:design=\"isRowActive(ReplicationRepeatTill.Times) ? InputDesign.Grey : InputDesign.Disabled\"\n\t\t\t\t\t\t\t\t\t:disabled=\"!isRowActive(ReplicationRepeatTill.Times)\"\n\t\t\t\t\t\t\t\t\tstyle=\"max-width: 4em; padding-bottom: 0;\"\n\t\t\t\t\t\t\t\t\t@blur=\"updateTimes($event.target.value)\"\n\t\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t</template>\n\t\t\t\t\t\t</RichLoc>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div\n\t\t\t\t\t\tclass=\"tasks-replication-sheet-action-row --selectable\"\n\t\t\t\t\t\t:class=\"{'--active': isRowActive(ReplicationRepeatTill.Date)}\"\n\t\t\t\t\t\t@click.self=\"repeatTill = ReplicationRepeatTill.Date\"\n\t\t\t\t\t>\n\t\t\t\t\t\t<UiRadio\n\t\t\t\t\t\t\ttag=\"label\"\n\t\t\t\t\t\t\tv-model=\"repeatTill\"\n\t\t\t\t\t\t\t:value=\"ReplicationRepeatTill.Date\"\n\t\t\t\t\t\t\tinputName=\"tasks-replication-sheet-finish-type\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<TextXs className=\"tasks-replication-sheet-action-row__text\">\n\t\t\t\t\t\t\t{{ loc('TASKS_V2_REPLICATION_FINISH_DATE') }}\n\t\t\t\t\t\t</TextXs>\n\t\t\t\t\t\t<HoverPill\n\t\t\t\t\t\t\t:readonly=\"!isRowActive(ReplicationRepeatTill.Date)\"\n\t\t\t\t\t\t\ttextOnly\n\t\t\t\t\t\t\tnoOffset\n\t\t\t\t\t\t\tref=\"datepickerFinishOpener\"\n\t\t\t\t\t\t\t@click=\"handleClickDatepickerFinishOpener\"\n\t\t\t\t\t\t>\n\t\t\t\t\t\t\t<span class=\"tasks-field-replication-link\">{{ endDateLabel }}</span>\n\t\t\t\t\t\t</HoverPill>\n\t\t\t\t\t\t<ReplicationDatepicker\n\t\t\t\t\t\t\tv-if=\"isDatepickerOpened\"\n\t\t\t\t\t\t\t:dateTs=\"endDateTs\"\n\t\t\t\t\t\t\t:bindElement=\"$refs.datepickerFinishOpener.$el\"\n\t\t\t\t\t\t\t@update:dateTs=\"updateEndDate\"\n\t\t\t\t\t\t\t@close=\"isDatepickerOpened = false\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
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
				(_this$datePicker = this.datePicker) !== null && _this$datePicker !== void 0 ? _this$datePicker : this.datePicker = new ui_datePicker.DatePicker({
					selectedDates: [this.startTs + tasks_v2_lib_timezone.timezone.getOffset(this.startTs)],
					type: 'time',
					events: {
						[ui_datePicker.DatePickerEvent.SELECT]: event => {
							const _event$getData = event.getData(),
								date = _event$getData.date;
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
		template: "\n\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-section\">\n\t\t\t<RichLoc\n\t\t\t\tclass=\"tasks-field-replication-row tasks-field-replication-secondary\"\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_CREATE_AT')\"\n\t\t\t\tplaceholder=\"[time/]\"\n\t\t\t>\n\t\t\t\t<template #time>\n\t\t\t\t\t<HoverPill textOnly noOffset ref=\"time\" @click=\"showPicker\">\n\t\t\t\t\t\t<span class=\"tasks-field-replication-link\">{{ startTimeFormatted }}</span>\n\t\t\t\t\t</HoverPill>\n\t\t\t\t</template>\n\t\t\t</RichLoc>\n\t\t</TextMd>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-section\">\n\t\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-row\">\n\t\t\t\t<span class=\"tasks-field-replication-secondary\">\n\t\t\t\t\t{{ loc('TASKS_V2_REPLICATION_DEADLINE') }}\n\t\t\t\t</span>\n\t\t\t\t<HoverPill textOnly noOffset ref=\"deadline\">\n\t\t\t\t\t<span class=\"tasks-field-replication-link\" @click=\"isDeadlinePopupShown = true\">\n\t\t\t\t\t\t{{ deadlineLabel }}\n\t\t\t\t\t</span>\n\t\t\t\t</HoverPill>\n\t\t\t\t<DeadlineAfterPopup\n\t\t\t\t\tv-if=\"isDeadlinePopupShown\"\n\t\t\t\t\t:deadlineAfter=\"replicateParams.deadlineAfter\"\n\t\t\t\t\t:taskId\n\t\t\t\t\t:bindElement=\"$refs.deadline.$el\"\n\t\t\t\t\t@update:deadlineAfter=\"updateDeadlineAfter\"\n\t\t\t\t\t@close=\"isDeadlinePopupShown = false\"\n\t\t\t\t/>\n\t\t\t</TextMd>\n\t\t</div>\n\t"
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
			update(_ref) {
				let workdayOnly = _ref.workdayOnly;
				this.$emit('update', {
					workdayOnly
				});
			}
		},
		template: "\n\t\t<TextMd tag=\"div\" className=\"tasks-field-replication-section\">\n\t\t\t<RichLoc\n\t\t\t\tclass=\"tasks-field-replication-row tasks-field-replication-secondary\"\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_ON_WEEKEND_DO')\"\n\t\t\t\tplaceholder=\"[do/]\"\n\t\t\t>\n\t\t\t\t<template #do>\n\t\t\t\t\t<HoverPill textOnly noOffset ref=\"skipWeekends\" @click=\"isMenuShown = true\">\n\t\t\t\t\t\t<span class=\"tasks-field-replication-link\">{{ item?.title || '' }}</span>\n\t\t\t\t\t</HoverPill>\n\t\t\t\t\t<BMenu v-if=\"isMenuShown\" :options @close=\"isMenuShown = false\"/>\n\t\t\t\t</template>\n\t\t\t</RichLoc>\n\t\t</TextMd>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet-footer\">\n\t\t\t<UiButton\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_CANCEL')\"\n\t\t\t\t:size=\"ButtonSize.MEDIUM\"\n\t\t\t\t:color=\"ButtonColor.LIGHT\"\n\t\t\t\t:style=\"AirButtonStyle.PLAIN\"\n\t\t\t\t@click=\"$emit('close')\"\n\t\t\t/>\n\t\t\t<UiButton\n\t\t\t\t:text=\"loc('TASKS_V2_REPLICATION_SAVE')\"\n\t\t\t\t:size=\"ButtonSize.MEDIUM\"\n\t\t\t\t:color=\"ButtonColor.PRIMARY\"\n\t\t\t\t@click=\"save\"\n\t\t\t/>\n\t\t</div>\n\t"
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
				if (!main_core.Type.isObject(((_this$task = this.task) === null || _this$task === void 0 ? void 0 : _this$task.replicateParams) || null)) {
					return;
				}
				this.replicateParams = {
					...this.replicateParams,
					...this.task.replicateParams,
					weekDays: [...(this.task.replicateParams.weekDays || [])]
				};
			},
			updateReplicateParams() {
				let params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet\">\n\t\t\t<div class=\"tasks-field-replication-sheet-header\">\n\t\t\t\t<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_TITLE_SHEET') }}</HeadlineMd>\n\t\t\t\t<BIcon\n\t\t\t\t\tclass=\"tasks-field-replication-sheet-close\"\n\t\t\t\t\t:name=\"Outline.CROSS_L\"\n\t\t\t\t\thoverable\n\t\t\t\t\t@click=\"close\"\n\t\t\t\t/>\n\t\t\t</div>\n\t\t\t<div class=\"tasks-field-replication-sheet-body\">\n\t\t\t\t<div v-if=\"!isTemplate\" class=\"tasks-field-replication-sheet-description\">\n\t\t\t\t\t<span class=\"tasks-field-replication-sheet-description-text\">\n\t\t\t\t\t\t<RichLoc :text=\"loc('TASKS_V2_REPLICATION_SHEET_DESCRIPTION')\" placeholder=\"[helpdesk]\">\n\t\t\t\t\t\t\t<template #helpdesk=\"{ text }\">\n\t\t\t\t\t\t\t\t<a class=\"tasks-field-replication-helpdesk\" @click=\"showHelpDesk\">{{ text }}</a>\n\t\t\t\t\t\t\t</template>\n\t\t\t\t\t\t</RichLoc>\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t\t<ReplicationSettings @update=\"updateReplicateParams\"/>\n\t\t\t\t<ReplicationStart @update=\"updateReplicateParams\"/>\n\t\t\t\t<ReplicationFinish @update=\"updateReplicateParams\"/>\n\t\t\t\t<ReplicationStartTime @update=\"updateReplicateParams\"/>\n\t\t\t\t<ReplicationDeadline v-if=\"!isTemplate\" @update=\"updateReplicateParams\"/>\n\t\t\t\t<ReplicationWeekend v-if=\"isDailyPeriod\" @update=\"updateReplicateParams\"/>\n\t\t\t</div>\n\t\t\t<ReplicationSheetFooter :replicateParams @close=\"close\"/>\n\t\t</div>\n\t"
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
		template: "\n\t\t<BottomSheet\n\t\t\t:sheetBindProps\n\t\t\tcustomClass=\"tasks-bottom-sheet-replicate-content\"\n\t\t\t@close=\"$emit('close')\"\n\t\t>\n\t\t\t<ReplicationSheetContent @close=\"$emit('close')\"/>\n\t\t</BottomSheet>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet-header\">\n\t\t\t<HeadlineMd>{{ loc('TASKS_V2_REPLICATION_HISTORY_SHEET') }}</HeadlineMd>\n\t\t\t<BIcon\n\t\t\t\tclass=\"tasks-field-replication-sheet-close\"\n\t\t\t\t:name=\"Outline.CROSS_L\"\n\t\t\t\thoverable\n\t\t\t\t@click=\"$emit('close')\"\n\t\t\t/>\n\t\t</div>\n\t"
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
				(_this$systemLogTimeRe = this.systemLogTimeRef) !== null && _this$systemLogTimeRe !== void 0 ? _this$systemLogTimeRe : this.systemLogTimeRef = {};
				this.systemLogTimeRef[rowId] = element;
			}
		},
		template: "\n\t\t<template v-for=\"(time, id) in systemLogTime\" :key=\"id\">\n\t\t\t<div :ref=\"(el) => setRef(el, time.rowId)\">{{ time.offsetTimestamp }}</div>\n\t\t</template>\n\t"
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
		template: "\n\t\t<div class=\"tasks-field-replication-hint\">\n\t\t\t<div>{{ errorMessage.replace('#LINK#', '') }}</div>\n\t\t\t<a v-if=\"errorLink\" :href=\"errorLink\">\n\t\t\t\t{{ loc('TASKS_V2_REPLICATION_NO_ACCESS_MORE') }}\n\t\t\t</a>\n\t\t</div>\n\t"
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
				return (_this$message$message = this.message.message) === null || _this$message$message === void 0 ? void 0 : _this$message$message.replace(pattern, '').trim();
			},
			linkText() {
				var _this$message$message2, _this$message$message3;
				return (_this$message$message2 = (_this$message$message3 = this.message.message) === null || _this$message$message3 === void 0 ? void 0 : _this$message$message3.match(pattern)[0]) !== null && _this$message$message2 !== void 0 ? _this$message$message2 : null;
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
		template: "\n\t\t<div class=\"tasks-field-replication-message\">\n\t\t\t<div v-if=\"message.link\">{{ formattedMessage }} <a :href=\"message.link\">{{ linkText }}</a></div>\n\t\t\t<span v-else>{{ message.message }}</span>\n\t\t\t<BIcon\n\t\t\t\tv-if=\"message.errors?.length > 0\"\n\t\t\t\tclass=\"tasks-field-replication-error-icon\"\n\t\t\t\t:name=\"Outline.ALERT\"\n\t\t\t\tref=\"error\"\n\t\t\t\t@mouseenter=\"openHint\"\n\t\t\t/>\n\t\t\t<Hint v-if=\"showHint\" :bindElement=\"$refs.error.$el\" :options=\"popupOptions\" @close=\"closeHint\">\n\t\t\t\t<ErrorHint :errorMessage :errorLink/>\n\t\t\t</Hint>\n\t\t</div>\n\t"
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
				(_this$systemLogMessag = this.systemLogMessageRef) !== null && _this$systemLogMessag !== void 0 ? _this$systemLogMessag : this.systemLogMessageRef = {};
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
		template: "\n\t\t<template v-for=\"(message, id) in systemLogMessage\" :key=\"id\">\n\t\t\t<MessageField\n\t\t\t\t:ref=\"(el) => setRef(el?.$el, message.rowId)\"\n\t\t\t\t:message=\"message\"\n\t\t\t\t:activeHintRowId\n\t\t\t\t@hintOpen=\"onHintOpen\"\n\t\t\t\t@hintClose=\"onHintClose\"\n\t\t\t/>\n\t\t</template>\n\t"
	};

	// @vue/component
	const GridLoader = {
		template: "\n\t\t<div class=\"tasks-template-history-grid-loader-spinner-container\">\n\t\t\t<div class=\"tasks-template-history-grid-loader-spinner\"/>\n\t\t</div>\n\t"
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
			var _BX$Main, _PopupManager$getPopu;
			main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.update);
			(_BX$Main = BX.Main) === null || _BX$Main === void 0 || (_BX$Main = _BX$Main.gridManager) === null || _BX$Main === void 0 || _BX$Main.destroy(gridId);
			(_PopupManager$getPopu = main_popup.PopupManager.getPopupById("".concat(gridId, "-grid-settings-window"))) === null || _PopupManager$getPopu === void 0 || _PopupManager$getPopu.destroy();
		},
		methods: {
			async getData() {
				const _await$apiClient$post = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateHistoryGetGrid, {
						templateId: this.templateId
					}),
					html = _await$apiClient$post.html;
				await main_core.Runtime.html(this.$refs.grid, html);
				this.update();
			},
			handleBeforeGridRequest(event) {
				const _event$getData = event.getData(),
					_event$getData2 = babelHelpers.slicedToArray(_event$getData, 2),
					eventArgs = _event$getData2[1];
				if (eventArgs.url) {
					var _eventArgs$url;
					this.nav = new main_core.Uri((_eventArgs$url = eventArgs.url) !== null && _eventArgs$url !== void 0 ? _eventArgs$url : '').getQueryParams().nav;
				}
				eventArgs.url = "/bitrix/services/main/ajax.php?action=tasks.V2.Template.History.getGridData&nav=".concat(this.nav);
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
		template: "\n\t\t<div class=\"tasks-field-replication-sheet__history-grid-container\">\n\t\t\t<div ref=\"grid\" class=\"tasks-field-replication-sheet__history-grid-main-content\"><GridLoader/></div>\n\t\t\t<TimeFields ref=\"timeFields\" :getGrid=\"() => this.$refs.grid\"/>\n\t\t\t<MessageFields ref=\"messageFields\" :getGrid=\"() => this.$refs.grid\"/>\n\t\t</div>\n\t"
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
		template: "\n\t\t<BottomSheet :sheetBindProps @close=\"$emit('close')\">\n\t\t\t<div class=\"tasks-field-replication-sheet\">\n\t\t\t\t<ReplicationSheetHeader\n\t\t\t\t\t:head=\"loc('TASKS_V2_REPLICATION_HISTORY_SHEET')\"\n\t\t\t\t\t@close=\"$emit('close')\"\n\t\t\t\t/>\n\t\t\t\t<ReplicationHistorySheetContent/>\n\t\t\t</div>\n\t\t</BottomSheet>\n\t"
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
				const _await$apiClient$post = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateHistoryGetCount, {
						templateId
					}),
					count = _await$apiClient$post.count;
				this.logCount = count !== null && count !== void 0 ? count : 0;
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
		template: "\n\t\t<div\n\t\t\tclass=\"tasks-full-card-field-container tasks-field-replication\"\n\t\t\t:data-task-id=\"task.id\"\n\t\t\t:data-task-field-id=\"replicationMeta.id\"\n\t\t\tdata-field-container\n\t\t\t@click=\"handleClick\"\n\t\t>\n\t\t\t<ReplicationContent/>\n\t\t</div>\n\t\t<template v-if=\"isEdit && isTemplate && task.replicate\">\n\t\t\t<div v-if=\"isLoading\" class=\"tasks-field-replication-history\">\n\t\t\t\t<BLine :width=\"120\"/>\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tv-else-if=\"logCount > 0\"\n\t\t\t\tclass=\"tasks-field-replication-history\"\n\t\t\t\t@click=\"setHistorySheetShown(true)\"\n\t\t\t>\n\t\t\t\t<TextXs className=\"tasks-field-replication-history-title\">{{ historyTitle }}</TextXs>\n\t\t\t\t<BIcon :name=\"Outline.CHEVRON_RIGHT_M\" color=\"var(--ui-color-base-4)\"/>\n\t\t\t</div>\n\t\t</template>\n\t\t<ReplicationSheet v-if=\"isSheetShown\" :sheetBindProps @close=\"setSheetShown(false)\"/>\n\t\t<ReplicationHistorySheets v-if=\"isHistorySheetShown\" :sheetBindProps @close=\"setHistorySheetShown(false)\"/>\n\t"
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
		template: "\n\t\t<Chip\n\t\t\tv-hint=\"tooltip\"\n\t\t\t:design\n\t\t\t:icon=\"Outline.REPEAT\"\n\t\t\t:text=\"loc('TASKS_V2_REPLICATION_TITLE_CHIP')\"\n\t\t\t:lock=\"isLocked\"\n\t\t\t:data-task-id=\"taskId\"\n\t\t\t:data-task-chip-id=\"replicationMeta.id\"\n\t\t\tref=\"chip\"\n\t\t\t@click=\"handleClick\"\n\t\t/>\n\t\t<ReplicationSheet\n\t\t\tv-if=\"isSheetShown\"\n\t\t\t:sheetBindProps\n\t\t\t@close=\"setSheetShown(false)\"\n\t\t/>\n\t"
	};

	exports.DateStringConverter = DateStringConverter;
	exports.Replication = Replication;
	exports.ReplicationChip = ReplicationChip;
	exports.ReplicationSheet = ReplicationSheet;
	exports.TimeStringConverter = TimeStringConverter;
	exports.replicationMeta = replicationMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.Event, BX.UI.System.Typography.Vue, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, BX, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Vue3.Directives, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX, BX.Main, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Vue3, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.UI.System.Input.Vue, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Vue3.Components, BX.Tasks.V2.Component.Fields, BX.UI.Vue3.Components, BX.UI.DatePicker, BX.Tasks.V2.Component.Fields, BX.UI.System.Menu, BX.Tasks.V2.Lib, BX.Main, BX.UI.System.Chip.Vue, BX.Tasks.V2, BX.Tasks.V2.Lib);
//# sourceMappingURL=replication.bundle.js.map
