/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_date, main_core_events, ui_vue3, ui_notificationManager, ui_vue3_directives_hint, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_component_taskSettingsPopup, tasks_v2_component_elements_settingsLabel, tasks_v2_component_elements_hint, tasks_v2_component_elements_hoverPill, tasks_v2_lib_idUtils, tasks_v2_lib_calendar, tasks_v2_lib_deadlineRules, tasks_v2_lib_analytics, tasks_v2_lib_onboardingBanners, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_heightTransition, tasks_v2_provider_service_taskService, ui_system_chip_vue, ui_vue3_components_popup, ui_datePicker, tasks_v2_lib_timezone, ui_system_input_vue, ui_vue3_components_button, ui_forms, tasks_v2_component_elements_questionMark, tasks_v2_component_elements_duration) {
	'use strict';

	const unitDurations$2 = main_date.DurationFormat.getUnitDurations();
	const taskDeadlineMonthDuration = 30 * unitDurations$2.d;
	function formatExpiredDuration(duration) {
		const absoluteDuration = Math.abs(duration);
		const durationFormat = new main_date.DurationFormat(absoluteDuration);
		if (absoluteDuration < taskDeadlineMonthDuration || durationFormat.years > 0) {
			return durationFormat.formatClosest();
		}
		const months = Math.floor(absoluteDuration / taskDeadlineMonthDuration);
		return new main_date.DurationFormat(months * unitDurations$2.m).format({
			format: 'm'
		});
	}

	// @vue/component
	const DeadlineDefaultView = {
		components: {
			TextMd: ui_system_typography_vue.TextMd,
			Text2Xs: ui_system_typography_vue.Text2Xs,
			BIcon: ui_iconSet_api_vue.BIcon,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			SettingsLabel: tasks_v2_component_elements_settingsLabel.SettingsLabel
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			deadlineFormatted: {
				type: String,
				required: true
			},
			deadlineFormattedForPrint: {
				type: String,
				required: true
			},
			isExpired: {
				type: Boolean,
				required: true
			},
			readonly: {
				type: Boolean,
				required: true
			},
			isPopupShown: {
				type: Boolean,
				required: true
			},
			deadlineTs: {
				type: Number,
				default: null
			},
			isFlowFilledOnAdd: {
				type: Boolean,
				required: true
			},
			isTemplate: {
				type: Boolean,
				required: true
			},
			isHovered: {
				type: Boolean,
				required: true
			},
			isFieldHovered: {
				type: Boolean,
				required: true
			},
			isSettingsPopupShown: {
				type: Boolean,
				required: true
			},
			expiredDuration: {
				type: Number,
				required: true
			}
		},
		emits: ['click', 'clear', 'settingsClick', 'update:isExceededHintShown'],
		computed: {
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			canChangeSettings() {
				const features = tasks_v2_core.Core.getParams().features;
				if (!features.isV2Enabled) {
					return false;
				}
				return this.task.rights.edit;
			},
			iconName() {
				return this.isFlowFilledOnAdd ? ui_iconSet_api_vue.Outline.BOTTLENECK : ui_iconSet_api_vue.Outline.CALENDAR_WITH_SLOTS;
			},
			expiredFormatted() {
				return this.loc('TASKS_V2_DEADLINE_EXPIRED', {
					'#EXPIRED_DURATION#': formatExpiredDuration(this.expiredDuration)
				});
			},
			hintBindElement() {
				return this.$refs.deadlineIcon?.$el ?? this.$refs.deadline?.$el;
			},
			ariaLabel() {
				if (this.readonly) {
					return '';
				}
				return this.loc('TASKS_V2_DEADLINE_VALUE_ARIA_LABEL', {
					'#VALUE#': this.deadlineFormatted
				});
			}
		},
		methods: {
			getHintBindElement() {
				return this.hintBindElement;
			},
			focusDeadline() {
				this.$refs.deadline?.$el?.querySelector('.b24-hover-pill-content')?.focus();
			}
		},
		template: `
		<div
			class="tasks-field-deadline"
			:class="{ '--expired': isExpired }"
			data-testid="tasks-deadline"
		>
			<div class="tasks-field-deadline-inner">
				<HoverPill
					:withClear="Boolean(deadlineTs)"
					:readonly="readonly"
					:textOnly="false"
					:noOffset="false"
					:active="isPopupShown"
					:alert="isExpired"
					:ariaLabel
					:ariaHaspopup="readonly ? '' : 'dialog'"
					:ariaExpanded="readonly ? null : isPopupShown"
					:clearAriaLabel="loc('TASKS_V2_DEADLINE_CLEAR_ARIA_LABEL')"
					@click="$emit('click')"
					@clear="$emit('clear')"
					@mouseover="$emit('update:isExceededHintShown', true)"
					@mouseleave="$emit('update:isExceededHintShown', false)"
					data-testid="tasks-deadline-field-btn"
					ref="deadline"
				>
					<BIcon
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
						:accent="isExpired"
					>
						{{ deadlineFormattedForPrint }}
					</TextMd>
				</HoverPill>
				<div
					v-if="!isFlowFilledOnAdd"
					class="tasks-field-deadline-settings-label"
					:class="{ '--visible': isHovered || isFieldHovered || isSettingsPopupShown }"
					ref="settings"
				>
					<SettingsLabel
						v-if="canChangeSettings"
						data-settings-label
						data-testid="tasks-deadline-settings-btn"
						:ariaLabel="loc('TASKS_V2_DEADLINE_SETTINGS_ARIA_LABEL')"
						@click="$emit('settingsClick')"
					/>
				</div>
			</div>
			<Text2Xs v-if="isExpired" class="tasks-field-deadline-expired print-ignore">{{ expiredFormatted }}</Text2Xs>
		</div>
	`
	};

	// @vue/component
	const DeadlineChipView = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			deadlineFormatted: {
				type: String,
				required: true
			},
			isExpired: {
				type: Boolean,
				required: true
			},
			readonly: {
				type: Boolean,
				required: true
			},
			taskStatus: {
				type: String,
				required: true
			},
			isFlowFilledOnAdd: {
				type: Boolean,
				required: true
			},
			isTemplate: {
				type: Boolean,
				required: true
			},
			deadlineTs: {
				type: Number,
				default: null
			},
			isPopupShown: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click', 'update:isExceededHintShown'],
		setup() {
			return {
				ChipSize: ui_system_chip_vue.ChipSize,
				ChipDesign: ui_system_chip_vue.ChipDesign,
				DeadlineState: tasks_v2_const.DeadlineState
			};
		},
		computed: {
			deadlineState() {
				if (this.taskStatus === tasks_v2_const.TaskStatus.Completed) {
					return tasks_v2_const.DeadlineState.Completed;
				}
				if (this.taskStatus === tasks_v2_const.TaskStatus.Deferred) {
					return tasks_v2_const.DeadlineState.Deferred;
				}
				if (this.taskStatus === tasks_v2_const.TaskStatus.SupposedlyCompleted) {
					return tasks_v2_const.DeadlineState.SupposedlyCompleted;
				}
				if (!this.deadlineTs) {
					return tasks_v2_const.DeadlineState.None;
				}
				if (this.isExpired) {
					return tasks_v2_const.DeadlineState.Expired;
				}
				if (tasks_v2_lib_calendar.calendar.isToday(this.deadlineTs)) {
					return tasks_v2_const.DeadlineState.Today;
				}
				if (tasks_v2_lib_calendar.calendar.isTomorrow(this.deadlineTs)) {
					return tasks_v2_const.DeadlineState.Tomorrow;
				}
				if (tasks_v2_lib_calendar.calendar.isThisWeek(this.deadlineTs)) {
					return tasks_v2_const.DeadlineState.ThisWeek;
				}
				if (tasks_v2_lib_calendar.calendar.isNextWeek(this.deadlineTs)) {
					return tasks_v2_const.DeadlineState.NextWeek;
				}
				return tasks_v2_const.DeadlineState.MoreThanTwoWeeks;
			},
			design() {
				const designMap = {
					[tasks_v2_const.DeadlineState.None]: ui_system_chip_vue.ChipDesign.Outline,
					[tasks_v2_const.DeadlineState.Completed]: ui_system_chip_vue.ChipDesign.OutlineNoAccent,
					[tasks_v2_const.DeadlineState.Deferred]: ui_system_chip_vue.ChipDesign.Outline,
					[tasks_v2_const.DeadlineState.SupposedlyCompleted]: ui_system_chip_vue.ChipDesign.OutlineWarning,
					[tasks_v2_const.DeadlineState.Expired]: ui_system_chip_vue.ChipDesign.TintedAlert,
					[tasks_v2_const.DeadlineState.Today]: ui_system_chip_vue.ChipDesign.TintedWarning,
					[tasks_v2_const.DeadlineState.Tomorrow]: ui_system_chip_vue.ChipDesign.TintedSuccess,
					[tasks_v2_const.DeadlineState.ThisWeek]: ui_system_chip_vue.ChipDesign.Tinted,
					[tasks_v2_const.DeadlineState.NextWeek]: ui_system_chip_vue.ChipDesign.OutlineAccent2,
					[tasks_v2_const.DeadlineState.MoreThanTwoWeeks]: ui_system_chip_vue.ChipDesign.TintedNoAccent
				};
				return designMap[this.deadlineState] || ui_system_chip_vue.ChipDesign.Outline;
			},
			text() {
				if (this.isFlowFilledOnAdd || this.isTemplate) {
					return this.deadlineFormatted;
				}
				if (this.deadlineState === tasks_v2_const.DeadlineState.Completed) {
					return this.loc('TASKS_V2_DEADLINE_COMPLETED');
				}
				if (this.deadlineState === tasks_v2_const.DeadlineState.Deferred) {
					return this.loc('TASKS_V2_DEADLINE_DEFERRED');
				}
				if (this.deadlineState === tasks_v2_const.DeadlineState.SupposedlyCompleted) {
					return this.loc('TASKS_V2_DEADLINE_SUPPOSEDLY_COMPLETED');
				}
				if (this.deadlineState === tasks_v2_const.DeadlineState.Today) {
					return this.loc('TASKS_V2_DEADLINE_TODAY_FORMATTED', {
						'#TIME#': tasks_v2_lib_calendar.calendar.formatTime(this.deadlineTs)
					});
				}
				if (this.deadlineState === tasks_v2_const.DeadlineState.Tomorrow) {
					return this.loc('TASKS_V2_DEADLINE_TOMORROW_FORMATTED', {
						'#TIME#': tasks_v2_lib_calendar.calendar.formatTime(this.deadlineTs)
					});
				}
				return this.deadlineFormatted;
			},
			hintBindElement() {
				return this.$refs.deadline;
			},
			ariaLabel() {
				return this.loc('TASKS_V2_DEADLINE_VALUE_ARIA_LABEL', {
					'#VALUE#': this.text
				});
			}
		},
		watch: {
			isPopupShown() {
				this.syncAria();
			},
			readonly() {
				this.syncAria();
			},
			text() {
				this.syncAria();
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			focusDeadline() {
				this.$refs.chip?.$el?.focus();
			},
			getHintBindElement() {
				return this.hintBindElement;
			},
			handleKeydown(event) {
				if (this.readonly || event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.$emit('click');
			},
			syncAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				const isTrigger = !this.readonly;
				main_core.Dom.attr(el, 'role', isTrigger ? 'button' : null);
				main_core.Dom.attr(el, 'aria-haspopup', isTrigger ? 'dialog' : null);
				main_core.Dom.attr(el, 'aria-expanded', isTrigger ? String(this.isPopupShown) : null);
				main_core.Dom.attr(el, 'aria-label', isTrigger ? this.ariaLabel : null);
			}
		},
		template: `
		<div
			class="tasks-field-deadline-chip"
			:class="{ '--read-only': readonly }"
			ref="deadline"
			@keydown="handleKeydown"
		>
			<Chip
				:size="ChipSize.Sm"
				:text
				:design
				rounded
				ref="chip"
				@click="$emit('click')"
			/>
		</div>
	`
	};

	// @vue/component
	const DeadlinePopupContent = {
		components: {
			Hint: tasks_v2_component_elements_hint.Hint
		},
		inject: {
			analytics: {},
			cardType: {},
			analyticsSubSection: {
				default: tasks_v2_const.Analytics.SubSection.TaskCard
			}
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
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			maxDeadlineDate() {
				if (tasks_v2_lib_deadlineRules.deadlineRules.canChangeWithoutLimitation(this.taskId) || !this.task.maxDeadlineChangeDate) {
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
			},
			limitReasonId() {
				return `tasks-deadline-preset-limit-${this.taskId}`;
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
						textColor: 'var(--ui-color-base-6)'
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
				tasks_v2_lib_analytics.analytics.sendDeadlineSet(this.analytics, {
					element,
					cardType: this.cardType,
					subSection: this.analyticsSubSection,
					taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds?.length ?? 0,
					coexecutorsCount: this.task.accomplicesIds?.length ?? 0
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
					<button
						type="button"
						:data-task-preset-id="preset.id"
						:class="['tasks-field-deadline-preset', { '--disabled': preset.disabled }]"
						:aria-disabled="preset.disabled ? 'true' : null"
						:aria-describedby="preset.disabled && limitHintText ? limitReasonId : null"
						@click="selectPresetDate(preset.timestamp, preset.disabled)"
						@mouseenter="focusDate(preset.timestamp, preset.disabled, $event)"
						@mouseleave="focusDate(null, preset.disabled, $event)"
					>
						<div class="tasks-field-deadline-preset-title">{{ preset.title }}</div>
						<div class="tasks-field-deadline-preset-date">{{ preset.formatted }}</div>
					</button>
				</template>
			</div>
			<span v-if="limitHintText" :id="limitReasonId" class="tasks-field-deadline-preset-limit-reason">{{ limitHintText }}</span>
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
				const baseOptions = {
					id: `tasks-field-deadline-popup-${this.taskId}`,
					bindElement: this.bindElement,
					padding: 24,
					offsetTop: 5,
					offsetLeft: -100,
					targetContainer: document.body,
					focusTrap: true,
					closeByEsc: true,
					ariaLabel: this.loc('TASKS_V2_DEADLINE_ARIA_LABEL')
				};
				if (this.coordinates?.x) {
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
					targetContainer: document.body,
					focusTrap: true,
					closeByEsc: true,
					ariaLabelledBy: this.titleId
				};
			},
			titleId() {
				return `tasks-deadline-change-reason-title-${this.taskId}`;
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
				if (this.reason.trim() === '') {
					return;
				}
				this.$emit('close');
			}
		},
		template: `
		<Popup :options @close="handleClose">
			<div class="tasks-deadline-change-reason-popup-header">
				<div :id="titleId" class="tasks-deadline-change-reason-popup-title">
					{{ loc('TASKS_V2_DEADLINE_CHANGE_REASON_POPUP_TITLE') }}
				</div>
				<button
					type="button"
					class="tasks-deadline-change-reason-popup-close"
					:aria-label="loc('TASKS_V2_DEADLINE_CHANGE_REASON_CLOSE_ARIA_LABEL')"
					@click="handleClose"
				>
					<BIcon
						:name="Outline.CROSS_L"
						hoverable
						class="tasks-deadline-change-reason-popup-close-icon"
						aria-hidden="true"
					/>
				</button>
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
					:disabled="reason.trim() === ''"
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

	const unitDurations$1 = main_date.DurationFormat.getUnitDurations();
	const Presets = Object.freeze({
		DAY_1: {
			id: '1d',
			multiplier: 1
		},
		DAYS_3: {
			id: '3d',
			multiplier: 3
		},
		WEEK: {
			id: '7d',
			multiplier: 7
		},
		WEEKS_2: {
			id: '14d',
			multiplier: 14
		}
	});

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
					this.$emit('update', {
						id: null,
						duration: deadlineAfter
					});
				}
			},
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			presets() {
				const dayDuration = this.task?.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : unitDurations$1.d;
				return [{
					...Presets.DAY_1,
					duration: dayDuration * Presets.DAY_1.multiplier,
					title: new main_date.DurationFormat(unitDurations$1.d).format()
				}, {
					...Presets.DAYS_3,
					duration: dayDuration * Presets.DAYS_3.multiplier,
					title: new main_date.DurationFormat(unitDurations$1.d * 3).format()
				}, {
					...Presets.WEEK,
					duration: dayDuration * Presets.WEEK.multiplier,
					title: this.loc('TASKS_V2_DEADLINE_A_WEEK')
				}, {
					...Presets.WEEKS_2,
					duration: dayDuration * Presets.WEEKS_2.multiplier,
					title: this.loc('TASKS_V2_DEADLINE_TWO_WEEKS')
				}];
			}
		},
		created() {
			this.deadlineAfter = this.task?.deadlineAfter;
		},
		methods: {
			applyPreset(preset) {
				this.$emit('update', preset);
				this.$emit('close');
			}
		},
		template: `
		<div class="tasks-field-deadline-after-header">
			<TextSm>{{ loc('TASKS_V2_DEADLINE_AFTER_TEXT') }}</TextSm>
			<QuestionMark :hintText="loc('TASKS_V2_DEADLINE_AFTER_HINT')"/>
		</div>
		<div class="tasks-field-deadline-after-chips">
			<template v-for="preset in presets" :key="preset.id">
				<Chip
					:text="preset.title"
					:design="ChipDesign.Outline"
					:compact="false"
					@click="applyPreset(preset)"
				/>
			</template>
		</div>
		<Duration
			v-model="duration"
			:label="loc('TASKS_V2_DEADLINE_AFTER_CUSTOM')"
			:unitAriaLabel="loc('TASKS_V2_DEADLINE_AFTER_DURATION_UNIT_ARIA_LABEL')"
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
			presetId: {
				type: [String, null],
				default: null
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['update:deadlineAfter', 'update:presetId', 'close'],
		computed: {
			options() {
				return {
					id: `tasks-field-deadline-after-popup-${this.taskId}`,
					bindElement: this.bindElement,
					width: 300,
					padding: 24,
					offsetTop: 5,
					targetContainer: document.body,
					focusTrap: true,
					closeByEsc: true,
					ariaLabel: this.loc('TASKS_V2_DEADLINE_ARIA_LABEL')
				};
			}
		},
		methods: {
			handleUpdate(preset) {
				this.$emit('update:deadlineAfter', preset.duration);
				this.$emit('update:presetId', preset.id);
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

	const unitDurations = main_date.DurationFormat.getUnitDurations();

	// SC-003: the aha popup UI (popup + css + image asset) is loaded lazily — only a new
	// user past the counter threshold ever sees it, so the heavy extension must not sit in
	// the hot deadline field's rel. The promise is cached module-wide so many mounted
	// deadline fields load the extension at most once. On failure the cached promise is
	// dropped (and the error rethrown), so a rejected load is not memoized: a later trigger
	// retries instead of re-awaiting a permanently rejected promise. Consumers swallow the
	// rejection, so it never surfaces as an unhandled rejection.
	let deadlineAhaExtensionPromise = null;
	function loadDeadlineAha() {
		deadlineAhaExtensionPromise ??= main_core.Runtime.loadExtension('tasks.v2.component.onboarding.deadline-aha').catch(error => {
			deadlineAhaExtensionPromise = null;
			throw error;
		});
		return deadlineAhaExtensionPromise;
	}

	// SC-001: carries the banner's async-load failure from DeadlineBanner.onError (which has
	// no component instance in scope) to the Deadline field's errorCaptured() below. The
	// acquireSlot() mutex guarantees at most one banner load is ever in flight, so a single
	// module-scoped slot needs no per-instance keying.
	let deadlineBannerLoadError = null;

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
			TaskSettingsPopup: tasks_v2_component_taskSettingsPopup.TaskSettingsPopup,
			DeadlineDefaultView,
			DeadlineChipView,
			// SC-001: inline onboarding banner loaded lazily so its extension (popup/css/
			// asset) stays out of the hot deadline field's rel; it renders only once the
			// v-if gate below arms it for a new user (a rare truthy -> falsy deadline change).
			// Built with a raw async component (not BitrixVue.defineAsyncComponent, whose loader
			// swallows load failures) so a failed chunk load reaches onError and frees the
			// onboarding slot the watcher grabbed — otherwise the mutex would suppress
			// SC-002/SC-003 for the whole card session.
			DeadlineBanner: ui_vue3.defineAsyncComponent({
				loader: () => main_core.Runtime.loadExtension('tasks.v2.component.onboarding.deadline-banner').then(exports => exports.DeadlineBanner),
				onError(error, retry, fail) {
					// The banner chunk failed to load: the async component will never mount and
					// the user can never dismiss it. Release the shared onboarding slot so the
					// mutex stops suppressing SC-002/SC-003 (best-effort, mirrors
					// onboardingBanners.setViewed()). fail() settles the wrapper (nulls Vue's
					// cached request so a later card retries) and routes the error to the
					// Deadline field's errorCaptured(), which disarms this instance's banner.
					tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadline');
					deadlineBannerLoadError = error;
					fail(error);
				}
			})
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			analytics: {},
			cardType: {}
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
				deadlineMeta,
				DeadlineState: tasks_v2_const.DeadlineState,
				deadlineAha: null
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
				isDeadlineDeniedHintShown: false,
				isDeadlineOnboardingShown: false,
				dateTs: null,
				externalBindElement: null,
				coordinates: null,
				saveCallback: null,
				changeReason: '',
				selectedPreset: null
			};
		},
		computed: {
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			taskStatus() {
				return this.task.status;
			},
			isEdit() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
			},
			taskDeadline() {
				return tasks_v2_lib_deadlineRules.deadlineRules.getCurrentDeadline(this.taskId);
			},
			deadlineTs() {
				return this.dateTs ?? this.taskDeadline;
			},
			expiredDuration() {
				const isCompleted = this.taskStatus === tasks_v2_const.TaskStatus.Completed || this.taskStatus === tasks_v2_const.TaskStatus.SupposedlyCompleted;
				const cannotExpire = this.isTemplate || !this.deadlineTs || this.isFlowFilledOnAdd || isCompleted;
				return cannotExpire ? 0 : this.nowTs - this.deadlineTs;
			},
			isExpired() {
				return this.expiredDuration > 0;
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
						'#DURATION#': formatExpiredDuration(this.expiredDuration)
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
			bindElement() {
				return this.externalBindElement ?? this.$refs.container;
			},
			isFlowFilledOnAdd() {
				return !this.isEdit && this.task.flowId > 0;
			},
			readonly() {
				if (this.isCompactReadonly) {
					return true;
				}
				return !tasks_v2_lib_deadlineRules.deadlineRules.canChange(this.taskId) || this.isFlowFilledOnAdd;
			},
			isCompactReadonly() {
				return this.compact && [tasks_v2_const.TaskStatus.Completed, tasks_v2_const.TaskStatus.SupposedlyCompleted, tasks_v2_const.TaskStatus.Deferred].includes(this.taskStatus);
			},
			exceededChangeCount() {
				return tasks_v2_lib_deadlineRules.deadlineRules.isChangeCountExceeded(this.taskId);
			},
			canChangeTooltip() {
				if (this.isCompactReadonly) {
					return null;
				}
				if (!this.isEdit || !this.readonly || this.exceededChangeCount || this.task.allowsChangeDeadline || this.isDeadlineDeniedHintShown) {
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
				return this.$refs.deadlineView?.getHintBindElement?.() ?? this.$refs.container;
			},
			hintAngleOffset() {
				return this.hintBindElement.offsetWidth / 2;
			}
		},
		watch: {
			async isSettingsPopupShown(value) {
				if (this.isTemplate && value === false) {
					await this.$nextTick();
					this.recalculateDeadlineAfterFromPresets();
				}
				this.$emit('isSettingsPopupShown', value);
			},
			// SC-001: react to deadline changes.
			'task.deadlineTs': function watchTaskDeadlineTs(value, oldValue) {
				// The same component is mounted in compact mode inside V2 list rows
				// (task-line); the inline banner is designed for the card layout only.
				// readonly is excluded too: the banner CTA runs handleClick() -> showPopup() only
				// when !readonly, so arming it in a readonly field would be a no-op that still holds
				// the shared onboarding slot.
				if (this.isTemplate || this.compact || this.readonly) {
					return;
				}
				if (!value && oldValue) {
					// SC-001 / ALG-01: show inline banner when deadline becomes empty.
					if (!this.isDeadlineOnboardingShown && tasks_v2_lib_onboardingBanners.onboardingBanners.shouldShow('deadline') && tasks_v2_lib_onboardingBanners.onboardingBanners.acquireSlot('deadline')) {
						this.isDeadlineOnboardingShown = true;
					}
				} else if (value && this.isDeadlineOnboardingShown) {
					// AC-004: hide banner when deadline is actually set.
					this.isDeadlineOnboardingShown = false;
					tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadline');
				}
			}
		},
		mounted() {
			tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
			this.nowTsInterval = setInterval(() => {
				this.nowTs = Date.now();
			}, 1000);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);

			// SC-003 (AC-013): show aha popup on the new-task create form only. The
			// !isTemplate && !isEdit && !readonly gate stays here — before any load/allocation —
			// so edit rows, templates and readonly states (e.g. a flow with an auto deadline)
			// never touch the aha extension (RF2-8). Readonly is excluded because the CTA runs
			// handleClick() -> showPopup() only when !readonly, so the aha popup there would be a no-op.
			if (!this.isTemplate && !this.isEdit && !this.readonly) {
				void this.tryShowDeadlineAha();
			}
		},
		created() {
			this.showErrorDebounce = main_core.Runtime.debounce(this.showError, 300);
			if (this.isTemplate) {
				this.setCurrentPreset();
			}
		},
		updated() {
			tasks_v2_lib_heightTransition.heightTransition.animate(this.$refs.container);
		},
		beforeUnmount() {
			// Guards the async tryShowDeadlineAha() continuation from creating a popup for a
			// component that has already unmounted (create form closed while loading).
			this.isUnmounted = true;
			clearInterval(this.nowTsInterval);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenDeadlinePicker, this.handleOpenDeadlinePickerEvent);

			// SC-001: release slot if banner is still shown (e.g. component unmounted before user closed it).
			if (this.isDeadlineOnboardingShown) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadline');
				this.isDeadlineOnboardingShown = false;
			}

			// SC-003: destroy aha popup (releases slot internally if still shown).
			this.deadlineAha?.destroy();
			this.deadlineAha = null;
		},
		// SC-001: the async banner failed to load (its slot was already freed in
		// DeadlineBanner.onError). Disarm this instance's banner and stop the error here
		// (return false) so it does not reach the global handler. Identity-matched against the
		// banner load error so unrelated descendant errors keep propagating (return true).
		errorCaptured(error) {
			const isBannerLoadError = error === deadlineBannerLoadError;
			if (isBannerLoadError) {
				deadlineBannerLoadError = null;
				this.isDeadlineOnboardingShown = false;
			}
			return !isBannerLoadError;
		},
		methods: {
			// AC-003: user closed the SC-001 inline banner via × button.
			onDeadlineOnboardingClose() {
				tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
					event: tasks_v2_const.Analytics.Event.CloseSuggestBanner,
					element: tasks_v2_const.Analytics.Element.Deadline,
					cardType: this.cardType
				});
				tasks_v2_lib_onboardingBanners.onboardingBanners.setViewed('deadline');
				this.isDeadlineOnboardingShown = false;
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('deadline');
			},
			// SC-001 CTA: user clicked the title → open deadline picker only.
			// Banner is hidden only after deadline is actually set (AC-004), not here.
			onDeadlineOnboardingAction() {
				tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
					event: tasks_v2_const.Analytics.Event.ClickSuggestBanner,
					element: tasks_v2_const.Analytics.Element.Deadline,
					cardType: this.cardType
				});
				this.handleClick();
			},
			// SC-003: lazy-load the aha popup extension, then show it. The lightweight
			// shouldShow() gate runs BEFORE the load so the heavy extension is fetched only
			// for the rare qualifying new user; the slot mutex and its re-check stay inside
			// DeadlineAha.tryShow() so the show sequencing (AC-016) is unchanged.
			async tryShowDeadlineAha() {
				if (!tasks_v2_lib_onboardingBanners.onboardingBanners.shouldShow('deadlineAha')) {
					return;
				}

				// SC-003: skip the aha when the auto deadline is off (defaultDeadlineInSeconds <= 0) —
				// its text ("a deadline of #DAYS# days is set automatically") would read "0 days".
				// Gate BEFORE loadDeadlineAha() so the heavy aha extension is never fetched in that
				// case; the getter comes from the already-loaded core (Model.Interface), not the aha
				// extension, so it is safe to read here. The slot mutex and setViewed live inside
				// DeadlineAha.tryShow(), so returning here does not burn the one-shot viewed state:
				// the popup can still show once the auto deadline is enabled.
				const secondsInDay = 86400;
				const deadlineUserOption = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Interface}/deadlineUserOption`];
				if (!(Number(deadlineUserOption?.defaultDeadlineInSeconds) > 0)) {
					return;
				}

				// Best-effort: if the aha popup extension fails to load, silently skip the show
				// (mirrors onboardingBanners.setViewed()); loadDeadlineAha() dropped the cached
				// rejection so a later trigger retries.
				const ahaModule = await loadDeadlineAha().catch(() => null);
				if (!ahaModule || this.isUnmounted) {
					return;
				}
				const {
					DeadlineAha
				} = ahaModule;

				// SC-003: feed the real default-deadline duration into the aha text
				// (#DAYS# + plural) instead of a hardcoded number.
				const defaultDeadlineDays = Math.round((Number(deadlineUserOption?.defaultDeadlineInSeconds) || 0) / secondsInDay);
				this.deadlineAha = new DeadlineAha(this.taskId, () => this.hintBindElement,
				// SC-003 CTA: open the default-deadline settings (not the one-off picker for this
				// task) — the popup text promises the deadline is saved for new tasks, which is
				// what TaskSettingsPopup + handleSave persist.
				() => {
					tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
						event: tasks_v2_const.Analytics.Event.ClickSuggestBanner,
						element: tasks_v2_const.Analytics.Element.Refresh,
						cardType: this.cardType
					});
					this.isSettingsPopupShown = true;
				},
				// SC-003: genuine close (× / outside click / drag / destroy). DeadlineAha routes
				// the CTA path away from this callback, so one interaction sends exactly one event.
				() => {
					tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
						event: tasks_v2_const.Analytics.Event.CloseSuggestBanner,
						element: tasks_v2_const.Analytics.Element.Refresh,
						cardType: this.cardType
					});
				}, defaultDeadlineDays);
				this.deadlineAha.tryShow();
			},
			handleOpenDeadlinePickerEvent(event) {
				const {
					taskId
				} = event.getData();
				if (String(taskId) === String(this.taskId)) {
					setTimeout(() => {
						tasks_v2_lib_fieldHighlighter.fieldHighlighter.scrollToField(deadlineMeta.id);
						if (!this.readonly) {
							this.showPopup();
						} else if (this.exceededChangeCount) {
							this.isExceededHintShown = true;
						} else {
							this.isDeadlineDeniedHintShown = true;
						}
					}, 200);
				}
			},
			handleClick() {
				if (!this.readonly) {
					this.showPopup();
				}
			},
			handleApplyPreset(presetId) {
				this.selectedPreset = Object.values(Presets).find(preset => preset.id === presetId) ?? null;
			},
			showPopup(bindElement, coordinates) {
				this.dateTs = this.deadlineTs;
				this.externalBindElement = bindElement;
				this.coordinates = coordinates;
				this.isPopupShown = true;
			},
			handleCrossClick() {
				if (tasks_v2_lib_deadlineRules.deadlineRules.requiresChangeReason(this.taskId)) {
					this.isChangeReasonPopupShown = true;
					this.saveCallback = this.clearDeadline;
				} else {
					void this.clearDeadline();
				}
			},
			handleClose() {
				// A single close is reported twice: once by the popup content and once by main.popup,
				// which fires onPopupClose when the unmounted wrapper destroys the instance. By the
				// second one the save may have already reset dateTs, and an empty dateTs reads as
				// "no deadline" for a template — that is what used to clear a just picked deadline.
				if (!this.isPopupShown) {
					return;
				}
				if (tasks_v2_lib_deadlineRules.deadlineRules.requiresChangeReason(this.taskId) && this.dateTs && this.dateTs !== this.taskDeadline) {
					this.isChangeReasonPopupShown = true;
					this.saveCallback = this.saveDeadline;
				} else {
					void this.saveDeadline();
				}
				this.isPopupShown = false;
				if (this.$refs?.deadlineView) {
					this.$refs.deadlineView.focusDeadline();
				}
			},
			async handleChangeReasonPopupClose() {
				this.isChangeReasonPopupShown = false;
				await this.saveCallback();
				this.saveCallback = null;
			},
			async saveDeadline() {
				const result = await tasks_v2_lib_deadlineRules.deadlineRules.saveDeadline(this.taskId, {
					deadlineTs: this.dateTs,
					changeReason: this.changeReason,
					deadlineManuallySet: this.resolveDeadlineManuallySet(this.dateTs)
				});
				if (result.status === tasks_v2_lib_deadlineRules.DeadlineSaveStatus.ReasonRequired) {
					this.dateTs = this.taskDeadline;
					return;
				}
				this.handleSaveResult(result);
			},
			async clearDeadline() {
				const result = await tasks_v2_lib_deadlineRules.deadlineRules.clearDeadline(this.taskId, {
					changeReason: this.changeReason,
					deadlineManuallySet: this.resolveDeadlineManuallySet(0)
				});
				if (result.status === tasks_v2_lib_deadlineRules.DeadlineSaveStatus.ReasonRequired) {
					return;
				}
				this.handleSaveResult(result);
				await this.$nextTick();
				this.$refs.deadlineView?.focusDeadline();
			},
			handleSaveResult(result) {
				if (result.status === tasks_v2_lib_deadlineRules.DeadlineSaveStatus.Failed) {
					this.showErrorDebounce(result.errors?.[0]);
				}
				if (result.status !== tasks_v2_lib_deadlineRules.DeadlineSaveStatus.Skipped || this.dateTs === this.taskDeadline) {
					this.dateTs = null;
				}
			},
			// SC-003 (AC-013): record that the user set the deadline through the field while
			// creating a task. Read by the create form's addTask() and forwarded to OnTaskAdd as
			// the manual-deadline marker, so an accepted default auto deadline is not mistaken for
			// a manual one. A cleared deadline (dateTs === 0) is not manual. Only relevant during
			// creation; edit flows never read it, so the field is omitted (not just falsy) for them.
			resolveDeadlineManuallySet(dateTs) {
				if (this.isEdit) {
					return undefined;
				}

				// Do not treat the calendar closing on the unchanged auto deadline as a manual set:
				// the flag is true only for a real non-empty change — dateTs > 0 and it differs from
				// the pre-update this.taskDeadline. Once manual it stays manual, so a later no-op
				// close does not demote it back to auto.
				return dateTs > 0 && (this.task.deadlineManuallySet === true || dateTs !== this.taskDeadline);
			},
			recalculateDeadlineAfterFromPresets() {
				if (!this.selectedPreset) {
					return;
				}
				this.dateTs = this.calculateDayDuration() * this.selectedPreset.multiplier;
				void this.saveDeadline();
				this.$refs.deadlineView?.focusDeadline();
			},
			calculateDayDuration() {
				return this.task?.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : unitDurations.d;
			},
			setCurrentPreset() {
				const dayDuration = this.calculateDayDuration();
				this.selectedPreset = Object.values(Presets).find(preset => this.deadlineTs === dayDuration * preset.multiplier) ?? null;
			},
			showError(error) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-deadline-update-error',
					text: error?.message
				});
			},
			mouseover() {
				this.isFieldHovered = true;
				if (this.compact) {
					this.isExceededHintShown = true;
				}
			},
			mouseleave() {
				this.isFieldHovered = false;
				if (this.compact) {
					this.isExceededHintShown = false;
				}
			}
		},
		template: `
		<div
			class="tasks-field-deadline-wrapper"
			:data-task-id="taskId"
			:data-task-field-id="deadlineMeta.id"
			:data-task-field-value="task.deadlineTs"
			@mouseover="mouseover"
			@mouseleave="mouseleave"
			ref="container"
		>
			<DeadlineChipView
				v-if="compact"
				v-hint="canChangeTooltip"
				:deadlineFormatted
				:isExpired
				:readonly
				:taskStatus
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				:isPopupShown
				@click="handleClick"
				ref="deadlineView"
			/>
			<DeadlineDefaultView
				v-else
				v-hint="canChangeTooltip"
				:taskId
				:deadlineFormatted
				:deadlineFormattedForPrint
				:isExpired
				:expiredDuration
				:readonly
				:isPopupShown
				:deadlineTs
				:isFlowFilledOnAdd
				:isTemplate
				:isHovered
				:isFieldHovered
				:isSettingsPopupShown
				@click="handleClick"
				@clear="handleCrossClick"
				@settingsClick="isSettingsPopupShown = true"
				@update:isExceededHintShown="isExceededHintShown = $event"
				ref="deadlineView"
			/>
		</div>
		<DeadlineBanner
			v-if="!compact && isDeadlineOnboardingShown"
			@close="onDeadlineOnboardingClose"
			@action="onDeadlineOnboardingAction"
		/>
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
			@update:presetId="handleApplyPreset"
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
			v-if="exceededChangeCount && isExceededHintShown && !isCompactReadonly"
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
		<Hint
			v-if="isDeadlineDeniedHintShown"
			:bindElement="hintBindElement"
			:options="{
				width: 280,
				offsetLeft: hintAngleOffset + 3,
				closeIcon: false,
			}"
			@close="isDeadlineDeniedHintShown = false"
		>
			{{ loc('TASKS_V2_DEADLINE_CAN_CHANGE_HINT') }}
		</Hint>
	`
	};

	exports.Deadline = Deadline;
	exports.DeadlineAfterPopup = DeadlineAfterPopup;
	exports.DeadlineChangeReasonPopup = DeadlineChangeReasonPopup;
	exports.DeadlinePopup = DeadlinePopup;
	exports.deadlineMeta = deadlineMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Main, BX.Event, BX.Vue3, BX.UI.NotificationManager, BX.Vue3.Directives, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.System.Chip.Vue, BX.UI.Vue3.Components, BX.UI.DatePicker, BX.Tasks.V2.Lib, BX.UI.System.Input.Vue, BX.Vue3.Components, BX, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements);
//# sourceMappingURL=deadline.bundle.js.map
