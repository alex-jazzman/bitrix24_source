/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, ui_system_typography_vue, ui_system_skeleton_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_component_elements_fieldList, tasks_v2_component_elements_fieldHoverButton, ui_vue3_directives_hint, tasks_v2_component_elements_fieldAdd, tasks_v2_component_elements_hint, tasks_v2_core, tasks_v2_component_elements_hoverPill, tasks_v2_provider_service_replicationService, tasks_v2_application_taskCard, main_date, tasks_v2_lib_timezone, tasks_v2_lib_calendar, tasks_v2_component_elements_bottomSheet, ui_vue3, ui_vue3_components_richLoc, ui_dialogs_messagebox, tasks_v2_lib_reactiveUtils, ui_system_input_vue, tasks_v2_component_elements_select, tasks_v2_component_elements_questionMark, tasks_v2_component_elements_radio, tasks_v2_component_elements_checkbox, ui_vue3_components_button, tasks_v2_component_fields_replication, ui_vue3_components_popup, ui_datePicker, tasks_v2_component_fields_deadline, ui_system_menu_vue, tasks_v2_lib_fieldHighlighter, main_popup, ui_system_chip_vue, tasks_v2_lib_showLimit) {
	'use strict';

	const replicationMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Replication,
		title: main_core.Loc.getMessage('TASKS_V2_REPLICATION_TITLE')
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

	class PeriodRuleDailyGenerator {
		#replicateParams;
		constructor(replicateParams) {
			this.#replicateParams = replicateParams;
		}
		generate() {
			const dailyMonthInterval = this.#replicateParams.dailyMonthInterval;
			const everyDay = this.#replicateParams.everyDay || 1;
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

	class PeriodRuleWeeklyGenerator {
		#replicateParams;
		constructor(replicateParams) {
			this.#replicateParams = replicateParams;
		}
		generate() {
			const everyWeek = this.#replicateParams.everyWeek || 1;
			const weekDaysLabel = this.#weekDays.length === 7 ? main_core.Loc.getMessage('TASKS_V2_REPLICATION_WEEKLY_EVERYDAY') : this.#weekDays.map(wd => main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_${wd}`)).join(', ');
			return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_WEEKLY', everyWeek, {
				'#NUMBER#': everyWeek > 1 ? ` ${everyWeek}` : '',
				'#WEEKDAYS#': ` (${weekDaysLabel})`
			});
		}
		get #weekDays() {
			const weekDays = this.#replicateParams.weekDays;
			return [...(weekDays?.length > 0 ? weekDays : [1])].sort();
		}
	}

	class PeriodRuleMonthlyGenerator {
		#replicateParams;
		constructor(replicateParams) {
			this.#replicateParams = replicateParams;
		}
		generate() {
			return this.#replicateParams.monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute ? this.#generateAbsolute() : this.#generateRelative();
		}
		#generateAbsolute() {
			const monthlyMonthNum = this.#replicateParams.monthlyMonthNum1 || 1;
			return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_MONTHLY_1', monthlyMonthNum, {
				'#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : '',
				'#DAY_NUMBER#': this.#replicateParams.monthlyDayNum
			});
		}
		#generateRelative() {
			const monthlyWeekDay = this.#replicateParams.monthlyWeekDay;
			const weekDayNum = this.#replicateParams.monthlyWeekDayNum;
			const localePostfix = getWeekDayGender(monthlyWeekDay);
			const dayNumber = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${weekDayNum}${localePostfix}`);
			const weekDay = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${monthlyWeekDay + 1}`);
			const monthlyMonthNum = this.#replicateParams.monthlyMonthNum2 || 1;
			return main_core.Loc.getMessage(`TASKS_V2_REPLICATION_MONTHLY_2${this.#getLocaleMonthlyOfDayType2Alt()}`, {
				'#DAY_NUMBER#': dayNumber,
				'#WEEKDAY_NAME#': weekDay,
				'#NUMBER#': monthlyMonthNum > 1 ? ` ${monthlyMonthNum}` : ''
			});
		}
		#getLocaleMonthlyOfDayType2Alt() {
			const weekDay = this.#replicateParams.monthlyWeekDay;
			if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Sunday) {
				return '_ALT_1';
			}
			if (weekDay === tasks_v2_const.ReplicationWeekDayIndex.Wednesday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Friday || weekDay === tasks_v2_const.ReplicationWeekDayIndex.Saturday) {
				return '_ALT_0';
			}
			return '';
		}
	}

	class PeriodRuleYearlyGenerator {
		#replicateParams;
		constructor(replicateParams) {
			this.#replicateParams = replicateParams;
		}
		generate() {
			return this.#replicateParams.yearlyType === tasks_v2_const.ReplicationYearlyType.Absolute ? this.#generateAbsolute() : this.#generateRelative();
		}
		#generateAbsolute() {
			const yearlyDayNum = this.#replicateParams.yearlyDayNum || 1;
			const yearlyMonth = this.#replicateParams.yearlyMonth1 || 1;
			return main_core.Loc.getMessage('TASKS_V2_REPLICATION_YEARLY_1', {
				'#NUMBER#': ` ${yearlyDayNum}`,
				'#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
			});
		}
		#generateRelative() {
			const yearlyWeekDayNum = this.#replicateParams.yearlyWeekDayNum || 0;
			const yearlyWeekDay = this.#replicateParams.yearlyWeekDay || 0;
			const yearlyMonth = this.#replicateParams.yearlyMonth2 || 1;
			const dayNumberLabel = main_core.Loc.getMessage(`TASKS_V2_REPLICATION_NUMBER_${yearlyWeekDayNum}${getWeekDayGender(yearlyWeekDay - 1)}`);
			return main_core.Loc.getMessage(`TASKS_V2_REPLICATION_YEARLY_2${this.#getLocaleType2Alt()}`, {
				'#DAY_NUMBER#': dayNumberLabel,
				'#WEEK_DAY#': main_core.Loc.getMessage(`TASKS_V2_REPLICATION_WD_ALT_${yearlyWeekDay}`),
				'#MONTH#': main_date.DateTimeFormat.format('F', new Date().setMonth(yearlyMonth - 1) / 1000)
			});
		}
		#getLocaleType2Alt() {
			const weekDay = this.#replicateParams.yearlyWeekDay;
			if (weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Sunday) {
				return '_ALT_1';
			}
			if (weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Wednesday || weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Saturday || weekDay === tasks_v2_const.ReplicationYearlyWeekDayIndex.Friday) {
				return '_ALT_0';
			}
			return '';
		}
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

	class ReplicateRuleGenerator {
		#replicateParams;
		#periodRuleGenerator;
		constructor(replicateParams) {
			this.#replicateParams = replicateParams;
			this.#setPeriodRuleGenerator(replicateParams.period);
		}
		#setPeriodRuleGenerator(period) {
			switch (period) {
				case tasks_v2_const.ReplicationPeriod.Weekly:
					{
						this.#periodRuleGenerator = new PeriodRuleWeeklyGenerator(this.#replicateParams);
						break;
					}
				case tasks_v2_const.ReplicationPeriod.Monthly:
					{
						this.#periodRuleGenerator = new PeriodRuleMonthlyGenerator(this.#replicateParams);
						break;
					}
				case tasks_v2_const.ReplicationPeriod.Yearly:
					{
						this.#periodRuleGenerator = new PeriodRuleYearlyGenerator(this.#replicateParams);
						break;
					}
				default:
					{
						this.#periodRuleGenerator = new PeriodRuleDailyGenerator(this.#replicateParams);
					}
			}
		}
		generate() {
			return [this.#periodRuleGenerator.generate(), this.#getStartTimeRule(), this.#getEndRule()].join(' ');
		}
		#getStartTimeRule() {
			const timeTs = this.#replicateParams.startTs;
			return main_core.Loc.getMessage('TASKS_V2_REPLICATION_START_TIME', {
				'#TIME#': TimeStringConverter.format(timeTs)
			});
		}
		#getEndRule() {
			const repeatTill = this.#replicateParams.repeatTill;
			if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Times) {
				const times = this.#replicateParams.times;
				return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_END_AFTER_REPETITIONS', times, {
					'#COUNT#': times
				});
			}
			if (repeatTill === tasks_v2_const.ReplicationRepeatTill.Date && this.#replicateParams.endTs) {
				return main_core.Loc.getMessage('TASKS_V2_REPLICATION_END_DATE', {
					'#DATE#': main_date.DateTimeFormat.format('d.m.Y', new Date(this.#replicateParams.endTs))
				});
			}
			return '';
		}
	}

	// @vue/component
	const ReplicationContentState = {
		name: 'ReplicationContentState',
		components: {
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			task: {},
			taskId: {},
			isTemplate: {},
			isEdit: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			readonly() {
				return !this.task?.rights?.edit;
			},
			ruleFormatted() {
				return new ReplicateRuleGenerator(this.task.replicateParams).generate();
			},
			isReplicate() {
				return this.task.replicate;
			},
			isCreator() {
				return tasks_v2_core.Core.getParams().currentUser.id === this.task.creatorId;
			},
			templateId() {
				return this.task.forkedByTemplate?.id ?? this.task.replicateTemplate?.id;
			},
			hasLinkedTemplate() {
				return !this.isTemplate && this.templateId;
			},
			linkedTemplate() {
				return this.task.forkedByTemplate ?? this.task.replicateTemplate;
			},
			canEditLinkedTemplate() {
				return this.linkedTemplate && this.linkedTemplate?.rights?.edit;
			},
			canToggle() {
				return !this.readonly && (this.templateId && this.canEditLinkedTemplate || this.isTemplate);
			},
			toggleText() {
				return this.isReplicate ? this.loc('TASKS_V2_REPLICATION_PAUSE_REPLICATE') : this.loc('TASKS_V2_REPLICATION_RESUME_REPLICATE');
			}
		},
		methods: {
			clearReplication() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					replicate: false,
					replicateParams: null
				});
				void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
					id: this.taskId,
					fieldName: tasks_v2_const.TaskField.Replication,
					isFilled: false
				});
			},
			toggleReplication() {
				void tasks_v2_provider_service_replicationService.replicationService.setReplicationState(this.taskId, {
					...this.task,
					replicate: !this.isReplicate
				});
			},
			openTemplate() {
				tasks_v2_application_taskCard.TaskCard.showFullCard({
					taskId: tasks_v2_lib_idUtils.idUtils.boxTemplate(this.templateId)
				});
			}
		},
		template: `
		<HoverPill
			class="tasks-replication-content-text-wrapper"
			:readonly="readonly || (isEdit && !canEditLinkedTemplate)"
			:withClear="!isEdit"
			:style="{ background: isEdit ? 'none' : '' }"
			noOffset
			@clear="clearReplication"
		>
			<TextMd 
				className="tasks-replication-content-text"
				:class="{'task-replication-content-text-pause': task.replicateParams && !isReplicate}"
			>
				{{ ruleFormatted }}
			</TextMd>
		</HoverPill>
		<div v-if="isEdit && task.replicateParams" class="task-replication-content-control">
			<div
				v-if="canToggle"
				class="tasks-replication-content-element"
				@click.stop="toggleReplication"
			>
				<BIcon
					:name="isReplicate ? Outline.PAUSE_L : Outline.PLAY_L"
					:size="20"
					color="var(--ui-color-base-4)"
					hoverable
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ toggleText }}
				</TextSm>
			</div>
			<div
				v-else-if="!isReplicate"
				class="tasks-replication-content-element"
				style="pointer-events: none"
			>
				<BIcon
					:name="Outline.PAUSE_L"
					:size="20"
					color="var(--ui-color-base-4)"
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ loc('TASKS_V2_REPLICATION_ON_PAUSE') }}
				</TextSm>
			</div>
			<div
				v-if="hasLinkedTemplate"
				class="tasks-replication-content-element"
				@click.stop="openTemplate"
			>
				<BIcon
					:name="Outline.GO_TO_L"
					:size="20"
					color="var(--ui-color-base-4)"
					hoverable
				/>
				<TextSm className="tasks-replication-content-element-text">
					{{ loc('TASKS_V2_REPLICATION_OPEN_TEMPLATE') }}
				</TextSm>
			</div>
		</div>
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
		<div class="tasks-field-replication-content">
			<ReplicationContentState v-if="task.replicateParams"/>
			<FieldAdd v-else v-hint="tooltip" :icon="Outline.REPEAT" :disabled ref="add"/>
		</div>
	`
	};

	// @vue/component
	const ReplicationInterval = {
		name: 'ReplicationInterval',
		components: {
			BInput: ui_system_input_vue.BInput
		},
		props: {
			interval: {
				type: Number,
				required: true
			},
			period: {
				type: String,
				default: tasks_v2_const.ReplicationPeriod.Daily,
				validator: value => {
					return [tasks_v2_const.ReplicationPeriod.Daily, tasks_v2_const.ReplicationPeriod.Weekly, tasks_v2_const.ReplicationPeriod.Monthly].includes(value);
				}
			}
		},
		emits: ['update:interval'],
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
			intervalValue: {
				get() {
					return this.interval?.toString() || '';
				},
				set(value = '') {
					let interval = parseInt(value.replaceAll(/\D/g, ''), 10) ?? 0;
					if (!main_core.Type.isInteger(interval) || interval < 1) {
						interval = this.prevInterval;
					}
					this.prevInterval = interval;
					this.$emit('update:interval', interval);
				}
			}
		},
		template: `
		<div class="task-field-replication-interval">
			<BInput
				v-model="intervalValue"
				:size="InputSize.Lg"
				:design="InputDesign.Grey"
				style="padding-bottom: 0;"
			/>
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
				let days = parseInt(dayNumber.replaceAll(/\D/g, ''), 10) ?? 0;
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
					return this.replicateParams.monthlyWeekDay ?? tasks_v2_const.ReplicationWeekDayIndex.Monday;
				},
				set(value) {
					this.update({
						monthlyWeekDay: value
					});
				}
			},
			monthlyWeekDayNum: {
				get() {
					return this.replicateParams.monthlyWeekDayNum ?? 0;
				},
				set(value) {
					this.update({
						monthlyWeekDayNum: value
					});
				}
			}
		},
		methods: {
			update(params) {
				this.$emit('update', params);
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
			ReplicationSettingsWeekDaysList
		},
		inject: {
			replicateParams: {}
		},
		emits: ['update'],
		computed: {
			weekDays: {
				get() {
					return this.replicateParams.weekDays;
				},
				set(weekDays) {
					this.$emit('update', {
						weekDays
					});
				}
			}
		},
		template: `
		<div class="tasks-replication-sheet-replication-settings-week tasks-field-replication-sheet__stack">
			<ReplicationSettingsWeekDaysList v-model:selectedDays="weekDays"/>
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
				localDayNumber: '',
				lastValidDayNumber: 1
			};
		},
		watch: {
			yearlyDayNumber: {
				immediate: true,
				handler(value) {
					this.lastValidDayNumber = value;
					this.localDayNumber = String(value);
				}
			}
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
		methods: {
			updateDayNumber(value = '') {
				this.localDayNumber = value.replaceAll(/\D/g, '').slice(0, 2);
			},
			handleDayNumberBlur() {
				const day = parseInt(this.localDayNumber, 10);
				if (!main_core.Type.isInteger(day) || day < 1 || day > 31) {
					this.localDayNumber = String(this.lastValidDayNumber);
					return;
				}
				this.lastValidDayNumber = day;
				this.localDayNumber = String(day);
				this.$emit('update:yearlyDayNumber', day);
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
				:modelValue="localDayNumber"
				:size="InputSize.Sm"
				:design="disabled ? InputDesign.Disabled : InputDesign.Grey"
				:disabled
				stretched
				style="max-width: 4em;"
				@update:modelValue="updateDayNumber"
				@blur="handleDayNumberBlur"
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
					if (prevValue !== yearlyType) {
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
			UiSelect: tasks_v2_component_elements_select.UiSelect,
			ReplicationInterval,
			ReplicationSettingsMonth,
			ReplicationSettingsWeek,
			ReplicationSettingsYear
		},
		inject: {
			replicateParams: {}
		},
		emits: ['update'],
		setup() {
			return {
				InputSize: ui_system_input_vue.InputSize
			};
		},
		computed: {
			period: {
				get() {
					return this.replicateParams.period;
				},
				set(period) {
					this.update({
						period,
						...this.getEmptyPrevTabData(this.replicateParams.period),
						...this.getDefaultTabData(period)
					});
				}
			},
			interval: {
				get() {
					switch (this.period) {
						case tasks_v2_const.ReplicationPeriod.Daily:
							return this.replicateParams.everyDay || 1;
						case tasks_v2_const.ReplicationPeriod.Weekly:
							return this.replicateParams.everyWeek || 1;
						case tasks_v2_const.ReplicationPeriod.Monthly:
							return (this.replicateParams.monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute ? this.replicateParams.monthlyMonthNum1 : this.replicateParams.monthlyMonthNum2) || 1;
						default:
							return 1;
					}
				},
				set(value) {
					switch (this.period) {
						case tasks_v2_const.ReplicationPeriod.Daily:
							this.update({
								everyDay: value
							});
							break;
						case tasks_v2_const.ReplicationPeriod.Weekly:
							this.update({
								everyWeek: value
							});
							break;
						case tasks_v2_const.ReplicationPeriod.Monthly:
							if (this.replicateParams.monthlyType === tasks_v2_const.ReplicationMonthlyType.Absolute) {
								this.update({
									monthlyMonthNum1: value
								});
							} else {
								this.update({
									monthlyMonthNum2: value
								});
							}
							break;
					}
				}
			},
			selectWidth() {
				return 160;
			},
			showInterval() {
				return this.period !== tasks_v2_const.ReplicationPeriod.Yearly;
			},
			title() {
				return this.period === tasks_v2_const.ReplicationPeriod.Weekly ? this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE_ALT') : this.loc('TASKS_V2_REPLICATION_SETTINGS_TITLE');
			},
			items() {
				return [{
					id: tasks_v2_const.ReplicationPeriod.Daily,
					title: this.loc('TASKS_V2_REPLICATION_SETTINGS_TAB_DAY'),
					component: null
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
			},
			item() {
				return this.items.find(({
					id
				}) => id === this.replicateParams.period) ?? this.items[0];
			},
			menuOptions() {
				return {
					width: this.selectWidth
				};
			}
		},
		methods: {
			update(params) {
				this.$emit('update', params);
			},
			onSelectItem(selectedItem) {
				const prevPeriod = this.replicateParams.period;
				const newPeriod = selectedItem.id;
				if (prevPeriod === newPeriod) {
					return;
				}
				this.update({
					period: newPeriod,
					...this.getEmptyPrevTabData(prevPeriod),
					...this.getDefaultTabData(newPeriod)
				});
			},
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
		<div class="tasks-field-replication-settings">
			<div class="tasks-field-replication-repeat-select">
				<TextMd tag="div" className="tasks-field-replication-secondary">
					{{ title }}
				</TextMd>
				<ReplicationInterval
					v-if="showInterval"
					v-model:interval="interval"
					:period="period"
				/>
				<div class="tasks-field-replication-period-select">
					<UiSelect
						:item="item"
						:items="items"
						:size="InputSize.Lg"
						:style="{ width: selectWidth }"
						:menuOptions="menuOptions"
						@update:item="onSelectItem"
					/>
				</div>
			</div>
			<component
				:is="item.component"
				@update="$emit('update', $event)"
			/>
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
			this.datePicker?.destroy();
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
		<div class="tasks-field-replication-settings">
			<TextMd tag="div" className="tasks-field-replication-section">
				<RichLoc
					class="tasks-field-replication-row tasks-field-replication-secondary"
					:text="loc('TASKS_V2_REPLICATION_START_MSGVER_1')"
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
		</div>
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
				let times = parseInt(value.replaceAll(/\D/g, ''), 10) ?? 0;
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
		<div class="tasks-field-replication-settings">
			<div class="tasks-field-replication-section">
				<TextMd tag="div" className="tasks-field-replication-row" style="margin-bottom: 14px;">
					<span class="tasks-field-replication-secondary">
						{{ loc('TASKS_V2_REPLICATION_FINISH_MSGVER_1') }}
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
				this.datePicker ??= new ui_datePicker.DatePicker({
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
			taskId: {},
			task: {}
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
				const days = deadlineAfter / this.dayDuration;
				return main_core.Loc.getMessagePlural('TASKS_V2_REPLICATION_DEADLINE_IN_DAYS', days, {
					'#TASK_DEADLINE#': days
				});
			},
			dayDuration() {
				return this.task?.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : 24 * 60 * 60 * 1000;
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
				return durationTs < this.dayDuration || durationTs % this.dayDuration !== 0;
			},
			isWeeks(durationTs) {
				const weekTs = 7 * 24 * 60 * 60 * 1000;
				return durationTs % weekTs === 0;
			}
		},
		template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row tasks-field-replication-secondary">
				<span>
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
		emits: ['close', 'save'],
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
				if (this.wasEmpty) {
					void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
				}
				this.$emit('save');
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
			isTemplate: {},
			isEdit: {}
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
				replicateParams: tasks_v2_provider_service_taskService.ReplicateCreator.createEmptyReplicateParams(),
				initialReplicateParams: {}
			};
		},
		computed: {
			isDailyPeriod() {
				return this.replicateParams.period === tasks_v2_const.ReplicationPeriod.Daily;
			},
			hasChanges() {
				return JSON.stringify(this.replicateParams) !== JSON.stringify(this.initialReplicateParams);
			}
		},
		created() {
			this.initReplicateParams();
		},
		mounted() {
			this.initialReplicateParams = tasks_v2_lib_reactiveUtils.deepToRaw(this.replicateParams);
		},
		methods: {
			initReplicateParams() {
				if (!main_core.Type.isObject(this.task?.replicateParams || null)) {
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
			updateReplication() {
				const payload = {
					replicate: true,
					replicateParams: this.replicateParams
				};
				this.$emit('close');
				if (!this.isEdit) {
					const deadlineOffset = this.replicateParams.deadlineOffset;
					if (deadlineOffset) {
						const deadlineOffsetTs = deadlineOffset * 1000;
						const now = Date.now();
						payload.deadlineTs = this.task.matchesWorkTime ? tasks_v2_lib_calendar.calendar.calculateEndTs(now, now, deadlineOffsetTs) : now + deadlineOffsetTs;
					}
					tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, payload);
					return;
				}
				void tasks_v2_provider_service_replicationService.replicationService.update(this.task, payload);
			},
			showHelpDesk() {
				top.BX.Helper.show('redirect=detail&code=18127718');
			},
			showSaveConfirmDialog() {
				ui_dialogs_messagebox.MessageBox.show({
					title: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_TITLE'),
					message: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_MESSAGE'),
					useAirDesign: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.YES_NO,
					yesCaption: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_SAVE'),
					noCaption: this.loc('TASKS_V2_REPLICATION_SAVE_CHANGES_CANCEL'),
					onYes: box => {
						box.close();
						this.updateReplication();
					},
					onNo: box => {
						box.close();
						this.$emit('close');
					}
				});
			},
			async save() {
				if (!this.isEdit) {
					this.updateReplication();
					return;
				}
				const hasExistingReplication = Boolean(this.task?.replicateParams);
				if (!hasExistingReplication) {
					if (this.isTemplate) {
						this.updateReplication();
						return;
					}
					this.$emit('close');
					await tasks_v2_provider_service_replicationService.replicationService.add(this.taskId, {
						...this.task,
						replicate: true,
						replicateParams: this.replicateParams
					});
					return;
				}
				if (!this.hasChanges) {
					this.$emit('close');
					return;
				}
				this.showSaveConfirmDialog();
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
					@click="save"
				/>
			</div>
			<div class="tasks-field-replication-sheet-body">
				<div v-if="!isTemplate && !task.replicateParams" class="tasks-field-replication-sheet-description">
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
				<div class="tasks-field-replication-settings">
					<ReplicationStartTime @update="updateReplicateParams"/>
					<ReplicationDeadline v-if="!isTemplate" @update="updateReplicateParams"/>
					<ReplicationWeekend v-if="isDailyPeriod" @update="updateReplicateParams"/>
				</div>
			</div>
			<ReplicationSheetFooter :replicateParams @close="$emit('close')" @save="save"/>
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
				this.systemLogTimeRef ??= {};
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
				return this.message.message?.replace(pattern, '').trim();
			},
			linkText() {
				return this.message.message?.match(pattern)[0] ?? null;
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
				this.systemLogMessageRef ??= {};
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
			main_core_events.EventEmitter.unsubscribe('Grid::beforeRequest', this.handleBeforeGridRequest);
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.update);
			BX.Main?.gridManager?.destroy(gridId);
			main_popup.PopupManager.getPopupById(`${gridId}-grid-settings-window`)?.destroy();
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
					this.nav = new main_core.Uri(eventArgs.url ?? '').getQueryParams().nav;
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
			FieldList: tasks_v2_component_elements_fieldList.FieldList,
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
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
				isLoading: true,
				isHovered: false
			};
		},
		computed: {
			historyTitle() {
				return this.loc('TASKS_V2_REPLICATION_HISTORY', {
					'#COUNT#': this.logCount
				});
			},
			readonly() {
				return !this.task.rights.edit;
			},
			replicateParams() {
				return this.task.replicateParams;
			},
			replicateTemplateId() {
				return this.task?.replicateTemplate?.id;
			},
			linkedTemplateId() {
				return this.task?.replicateTemplate?.id ?? this.task?.forkedByTemplate?.id;
			},
			linkedTemplate() {
				return this.task.forkedByTemplate ?? this.task.replicateTemplate;
			},
			disabled() {
				return this.isTemplate && (this.task.isForNewUser || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
			},
			canOpenSheet() {
				return !this.isEdit || this.isTemplate || this.linkedTemplate?.rights?.edit;
			},
			fields() {
				return [{
					title: replicationMeta.title,
					component: ReplicationContent
				}];
			}
		},
		created() {
			void this.getLogCount();
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.getLogCount);
			if (!this.isTemplate && this.linkedTemplateId) {
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.handleUpdateReplicateParams);
			}
		},
		unmounted() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.getLogCount);
			if (!this.isTemplate && this.linkedTemplateId) {
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.UpdateReplicateParams, this.handleUpdateReplicateParams);
			}
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
				this.logCount = count ?? 0;
				this.isLoading = false;
			},
			handleUpdateReplicateParams(event) {
				const {
					templateId,
					replicate,
					replicateParams
				} = event.getData();
				if (templateId !== this.linkedTemplateId) {
					return;
				}
				void tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
					...(!main_core.Type.isUndefined(replicate) && {
						replicate
					}),
					...(!main_core.Type.isUndefined(replicateParams) && {
						replicateParams
					})
				});
			},
			handleClick() {
				if (!this.readonly && !this.disabled && this.canOpenSheet) {
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
			class="tasks-field-replication"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<div
				class="tasks-field-replication-content-wrapper"
				:class="{ '--readonly': readonly || disabled || !canOpenSheet }"
				:data-task-id="task.id"
				:data-task-field-id="replicationMeta.id"
				@click="handleClick"
			>
				<FieldHoverButton
					v-if="!readonly && !disabled && isEdit && replicateParams && canOpenSheet"
					:icon="Outline.EDIT_L"
					:isVisible="isHovered"
					@click="handleClick"
				/>
				<FieldList :fields/>
			</div>
			<template v-if="isEdit && isTemplate && task.replicateParams">
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
		</div>
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
			v-if="isSheetShown && !isSelected"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.DateStringConverter = DateStringConverter;
	exports.Replication = Replication;
	exports.ReplicationChip = ReplicationChip;
	exports.ReplicationSheet = ReplicationSheet;
	exports.TimeStringConverter = TimeStringConverter;
	exports.replicationMeta = replicationMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Event, BX.UI.System.Typography.Vue, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Vue3.Directives, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Application, BX.Main, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Vue3, BX.UI.Vue3.Components, BX.UI.Dialogs, BX.Tasks.V2.Lib, BX.UI.System.Input.Vue, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Vue3.Components, BX.Tasks.V2.Component.Fields, BX.UI.Vue3.Components, BX.UI.DatePicker, BX.Tasks.V2.Component.Fields, BX.UI.System.Menu, BX.Tasks.V2.Lib, BX.Main, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=replication.bundle.js.map
