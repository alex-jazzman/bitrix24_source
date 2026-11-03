/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, ui_iconSet_api_core, tasks_v2_component_elements_fieldList, tasks_v2_component_elements_fieldHoverButton, tasks_v2_const, tasks_v2_component_elements_hoverPill, tasks_v2_lib_calendar, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_component_elements_fieldAdd, tasks_v2_component_elements_questionMark, ui_datePicker, ui_notificationManager, ui_vue3_components_button, ui_system_typography_vue, ui_system_input_vue, ui_system_menu_vue, tasks_v2_core, tasks_v2_component_elements_bottomSheet, tasks_v2_component_elements_duration, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_timezone, tasks_v2_provider_service_taskService, tasks_v2_lib_showLimit, ui_switcher, ui_vue3_components_switcher, ui_system_chip_vue) {
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
			}
		},
		setup() {
			return {
				calendar: tasks_v2_lib_calendar.calendar
			};
		},
		template: `
		<div>
			<HoverPill textOnly readonly :withTabStop="false">
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
			<HoverPill textOnly :readonly :withTabStop="false">
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
		props: {
			isSheetShown: {
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
			readonly() {
				return !this.task.rights.datePlan;
			}
		},
		template: `
		<HoverPill v-if="task.matchesSubTasksTime" textOnly readonly :withTabStop="false">
			<div class="tasks-field-date-plan-content">
				<div>{{ loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME_STATE') }}</div>
				<QuestionMark :hintText="loc('TASKS_V2_DATE_PLAN_NO_SUBTASKS_HINT')"/>
			</div>
		</HoverPill>
		<FieldAdd
			v-else
			:icon="Outline.PLANNING"
			data-testid="tasks-date-plan-add-btn"
			:ariaLabel="readonly ? '' : loc('TASKS_V2_DATE_PLAN_ADD_ARIA_LABEL')"
			:ariaHaspopup="readonly ? '' : 'dialog'"
			:ariaExpanded="readonly ? null : isSheetShown"
			:withTabStop="!readonly"
		/>
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
		emits: ['update:modelValue'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				labelId: `tasks-date-plan-switch-${main_core.Text.getRandom()}`,
				lockReasonId: `tasks-date-plan-switch-lock-${main_core.Text.getRandom()}`
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
		methods: {
			handleClick() {
				this.$emit('update:modelValue', !this.modelValue);
			},
			handleKeydown(event) {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			}
		},
		template: `
		<div
			class="tasks-field-date-plan-switcher"
			role="switch"
			:aria-checked="modelValue"
			:aria-labelledby="labelId"
			:aria-describedby="lock ? lockReasonId : null"
			tabindex="0"
			@click="handleClick"
			@keydown="handleKeydown"
		>
			<Switcher :isChecked="modelValue" :options/>
			<TextSm :id="labelId">{{ text }}</TextSm>
			<QuestionMark v-if="hint" :hintText="hint" @click.stop/>
			<template v-if="lock">
				<BIcon :name="Outline.LOCK_M" class="tasks-field-date-plan-switcher-lock" aria-hidden="true"/>
				<span :id="lockReasonId" class="tasks-field-date-plan-visually-hidden">
					{{ loc('TASKS_V2_DATE_PLAN_LOCK_ARIA_DESCRIPTION') }}
				</span>
			</template>
		</div>
	`
	};

	const MAX_INT = 2 ** 31;
	const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
	const VISIBLE_LABEL_SELECTOR = '.ui-system-input-label:not(.--error)';
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
				wasEmpty: false,
				pickerPopupId: `tasks-date-plan-picker-${main_core.Text.getRandom()}`
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
					return this.isMatchesWorkTimeLocked ? false : this.matchesWorkTimeTemp ?? this.task.matchesWorkTime ?? false;
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
					return this.isMatchesSubTasksTimeLocked ? false : this.matchesSubTasksTimeTemp ?? this.task.matchesSubTasksTime ?? false;
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
					if (this.isTemplate) {
						return this.task.allowsChangeDeadline ?? false;
					}
					return this.task.allowsChangeDatePlan ?? false;
				},
				set(allowsChangeDatePlan) {
					if (this.isTemplate) {
						void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
							allowsChangeDeadline: allowsChangeDatePlan
						});
						return;
					}
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
			},
			isDisabled() {
				return this.inputDesign === ui_system_input_vue.InputDesign.Disabled;
			},
			triggers() {
				return [{
					ref: 'start',
					label: this.loc('TASKS_V2_DATE_PLAN_START'),
					inputValue: this.formatDate(this.startTs),
					isOpen: this.isPickerShown && !this.isEndPicker,
					disabled: this.isDisabled,
					open: () => this.handleDateClick({
						currentTarget: this.triggerEl('start')
					}, {
						isEnd: false
					})
				}, {
					ref: 'end',
					label: this.loc('TASKS_V2_DATE_PLAN_END'),
					inputValue: this.formatDate(this.endTs),
					isOpen: this.isPickerShown && this.isEndPicker,
					disabled: this.isDisabled,
					open: () => this.handleDateClick({
						currentTarget: this.triggerEl('end')
					}, {
						isEnd: true
					})
				}];
			}
		},
		watch: {
			// The sheet body renders through a slot, so the component's own updated() hook
			// is not guaranteed to run; a post-flush watcher syncs after the DOM settles.
			triggers: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			}
		},
		created() {
			this.wasEmpty = !this.wasFilled;
			this.updateDuration(this.task.startPlanTs, this.task.endPlanTs);
			this.startDatePlanAfter = this.task.startDatePlanAfter;
			this.templateDuration = this.task.endDatePlanAfter - this.task.startDatePlanAfter;
			this.showErrorDebounced = main_core.Runtime.debounce(this.showError, 300, this);
		},
		mounted() {
			this.syncAria();

			// main.popup closes the sheet from a capture-phase keyup listener on the document,
			// so an Escape that only dismisses the picker has to be claimed earlier: capture at
			// the window always runs before capture at the document, whatever the bind order.
			main_core.Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		beforeUnmount() {
			main_core.Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
		},
		methods: {
			triggerEl(ref) {
				return this.$refs[ref]?.$el;
			},
			/**
			 * The trigger is the input wrapper, not the inner input: BInput blurs the input
			 * on focus in the clickable mode, so a tab stop on it swallows the focus.
			 *
			 * A combobox reads its value off the text of its own subtree, so whatever is not
			 * the value has to leave the accessibility tree: the visible label would repeat
			 * the name in place of the value, and a date input showing nothing adds its name
			 * on top of that. A disabled input is out of the tab order natively.
			 */
			syncAria() {
				for (const trigger of this.triggers) {
					const node = this.triggerEl(trigger.ref);
					const input = node?.querySelector('input');
					if (!input) {
						continue;
					}
					main_core.Dom.attr(node, 'role', 'combobox');
					main_core.Dom.attr(node, 'aria-label', trigger.label);
					main_core.Dom.attr(node, 'aria-haspopup', 'dialog');
					main_core.Dom.attr(node, 'aria-expanded', trigger.isOpen ? 'true' : 'false');
					main_core.Dom.attr(node, 'aria-controls', trigger.isOpen ? this.pickerPopupId : null);
					main_core.Dom.attr(node, 'aria-disabled', trigger.disabled ? 'true' : null);
					main_core.Dom.attr(node, 'tabindex', trigger.disabled ? null : '0');
					main_core.Dom.attr(node.querySelector(VISIBLE_LABEL_SELECTOR), 'aria-hidden', 'true');
					main_core.Dom.attr(input, 'tabindex', trigger.disabled ? null : '-1');
					main_core.Dom.attr(input, 'aria-hidden', trigger.inputValue ? null : 'true');
				}
			},
			handleKeydown(event, ref) {
				if (this.isDisabled || !OPEN_KEYS.includes(event.key)) {
					return;
				}
				const trigger = this.triggers.find(item => item.ref === ref);

				// The open picker runs its own arrow navigation, so ArrowDown has nothing to move
				// here: cancelling the page default would leave the key doing nothing at all.
				if (trigger.isOpen && event.key === 'ArrowDown') {
					return;
				}
				event.preventDefault();
				if (trigger.isOpen) {
					this.getDatePicker().hide();
					return;
				}
				trigger.open();
			},
			handleWindowKeyUp(event) {
				if (event.key !== 'Escape' || !this.isPickerShown) {
					return;
				}
				event.stopImmediatePropagation();
				this.getDatePicker().hide();
			},
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
				this.handlePickerChangedDebounced ??= main_core.Runtime.debounce(this.handlePickerChanged, 10, this);
				this.datePicker ??= new ui_datePicker.DatePicker({
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
						id: this.pickerPopupId,
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
					startPlanTs ??= endPlanTs - this.duration;
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
					this.handleTemplateUpdate();
				} else if (!this.maxDurationReached) {
					void this.handleTaskUpdate();
				}
				if (this.wasEmpty && this.wasFilled) {
					void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
				}
				this.$emit('close');
			},
			handleTemplateUpdate() {
				const updateFields = {
					startDatePlanAfter: Number(this.startDatePlanAfter),
					endDatePlanAfter: Number(this.startDatePlanAfter + this.templateDuration),
					matchesWorkTime: this.matchesWorkTime
				};
				const isMatchesWorkTimeChanged = this.task.matchesWorkTime !== this.matchesWorkTime;
				if (this.task.deadlineAfter && isMatchesWorkTimeChanged) {
					updateFields.deadlineAfter = tasks_v2_lib_calendar.calendar.recalculateDurationByMatchWorkTime(this.task.deadlineAfter, this.task.matchesWorkTime, this.matchesWorkTime);
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, updateFields);
			},
			async handleTaskUpdate() {
				tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
				const result = await tasks_v2_provider_service_taskService.taskService.update(this.taskId, Object.fromEntries(Object.entries({
					startPlanTs: this.matchesSubTasksTime ? undefined : Number(this.startTs),
					endPlanTs: this.matchesSubTasksTime ? undefined : Number(this.endTs),
					matchesWorkTime: this.matchesWorkTime,
					matchesSubTasksTime: this.matchesSubTasksTime
				}).filter(([, value]) => !main_core.Type.isUndefined(value))));
				tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
				if (result[tasks_v2_const.Endpoint.TaskPlanUpdate]?.length) {
					const error = result[tasks_v2_const.Endpoint.TaskPlanUpdate][0];
					this.showErrorDebounced(error);
				}
			},
			showError(error) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'tasks-date-plan-update-error',
					text: error?.message
				});
			}
		},
		template: `
		<BottomSheet
			:sheetBindProps
			:ariaLabel="loc('TASKS_V2_DATE_PLAN_TITLE_SHEET')"
			@close="close"
		>
			<div class="tasks-field-date-plan-sheet" data-testid="tasks-date-plan-sheet">
				<div class="tasks-field-date-plan-header">
					<HeadlineMd>{{ loc('TASKS_V2_DATE_PLAN_TITLE_SHEET') }}</HeadlineMd>
					<button
						type="button"
						class="tasks-field-date-plan-close"
						:aria-label="loc('TASKS_V2_DATE_PLAN_SHEET_CLOSE_ARIA_LABEL')"
						data-testid="tasks-date-plan-sheet-close-btn"
						@click="close"
					>
						<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
					</button>
				</div>
				<TextSm class="tasks-field-date-plan-description">{{ description }}</TextSm>
				<div class="tasks-field-date-plan-fields">
					<template v-if="isTemplate">
						<Duration
							v-model="startDatePlanAfter"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_START_AFTER')"
							:unitAriaLabel="loc('TASKS_V2_DATE_PLAN_DURATION_UNIT_ARIA_LABEL')"
							data-testid="tasks-date-plan-start-after-duration"
							:design="inputDesign"
						/>
						<Duration
							v-model="templateDuration"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_DURATION')"
							:unitAriaLabel="loc('TASKS_V2_DATE_PLAN_DURATION_UNIT_ARIA_LABEL')"
							data-testid="tasks-date-plan-template-duration"
							:design="inputDesign"
						/>
					</template>
					<template v-else>
						<BInput
							:modelValue="formatDate(startTs)"
							:label="loc('TASKS_V2_DATE_PLAN_START')"
							:ariaLabel="loc('TASKS_V2_DATE_PLAN_START')"
							:design="inputDesign"
							:icon="Outline.CALENDAR_WITH_SLOTS"
							:withClear="Boolean(startTs)"
							clickable
							:active="isPickerShown && !isEndPicker"
							:data-task-plan-start="startTs"
							ref="start"
							data-testid="tasks-date-plan-start-input"
							@clear="clearStart"
							@click="handleDateClick($event, { isEnd: false })"
							@keydown="handleKeydown($event, 'start')"
						/>
						<BInput
							:modelValue="formatDate(endTs)"
							:label="loc('TASKS_V2_DATE_PLAN_END')"
							:ariaLabel="loc('TASKS_V2_DATE_PLAN_END')"
							:design="inputDesign"
							:icon="Outline.CALENDAR_WITH_SLOTS"
							:withClear="Boolean(endTs)"
							clickable
							:active="isPickerShown && isEndPicker"
							:data-task-plan-end="endTs"
							ref="end"
							data-testid="tasks-date-plan-end-input"
							@clear="clearEnd"
							@click="handleDateClick($event, { isEnd: true })"
							@keydown="handleKeydown($event, 'end')"
						/>
						<Duration
							v-model="duration"
							:matchesWorkTime
							:label="loc('TASKS_V2_DATE_PLAN_DURATION')"
							:unitAriaLabel="loc('TASKS_V2_DATE_PLAN_DURATION_UNIT_ARIA_LABEL')"
							data-testid="tasks-date-plan-duration"
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
						data-testid="tasks-date-plan-allow-change-switcher"
					/>
					<DatePlanSwitcher
						v-model="matchesWorkTime"
						:text="loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME')"
						:hint="matchWorkTimeHint"
						:lock="isMatchesWorkTimeLocked"
						data-testid="tasks-date-plan-match-work-time-switcher"
					/>
					<DatePlanSwitcher
						v-if="!isTemplate"
						v-model="matchesSubTasksTime"
						:text="loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME')"
						:hint="loc('TASKS_V2_DATE_PLAN_MATCH_SUBTASKS_TIME_HINT')"
						:lock="isMatchesSubTasksTimeLocked"
						data-testid="tasks-date-plan-match-subtasks-switcher"
					/>
				</div>
				<div class="tasks-field-date-plan-footer" data-testid="tasks-date-plan-sheet-footer">
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
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
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
				Outline: ui_iconSet_api_core.Outline,
				datePlanMeta
			};
		},
		data() {
			return {
				isHovered: false
			};
		},
		computed: {
			fields() {
				if (this.isTemplate) {
					if (this.isEmpty) {
						return [{
							title: datePlanMeta.title,
							component: DatePlanContent,
							props: {
								isSheetShown: this.isSheetShown
							}
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
				if (this.isEmpty && (this.task.filledFields[datePlanMeta.id] || this.task.matchesSubTasksTime)) {
					return [{
						title: datePlanMeta.title,
						component: DatePlanContent,
						props: {
							isSheetShown: this.isSheetShown
						}
					}];
				}
				return [{
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_START'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.startPlanTs
					}
				}, {
					title: this.loc('TASKS_V2_DATE_PLAN_FIELD_END'),
					component: DatePlanDate,
					props: {
						dateTs: this.task.endPlanTs
					}
				}].filter(({
					props: {
						dateTs
					}
				}) => dateTs);
			},
			isEmpty() {
				if (this.isTemplate) {
					return !this.task.startDatePlanAfter && !this.task.endDatePlanAfter;
				}
				return !this.task.startPlanTs && !this.task.endPlanTs;
			},
			readonly() {
				return !this.task.rights.datePlan;
			},
			dependsOnSubTasks() {
				return !this.isTemplate && Boolean(this.task.matchesSubTasksTime);
			},
			isEditActive() {
				return !this.readonly && (!this.isEmpty || this.dependsOnSubTasks);
			}
		},
		methods: {
			handleClick(event) {
				if (!this.readonly) {
					this.getOpener(event)?.focus({
						preventScroll: true
					});
					this.setSheetShown(true);
				}
			},
			getOpener(event) {
				if (main_core.Type.isElementNode(event.target)) {
					const eventTrigger = event.target.closest('button, [role="button"]');
					if (eventTrigger && this.$refs.container?.contains(eventTrigger)) {
						return eventTrigger;
					}
				}
				return this.$refs.editButton?.$el ?? this.$refs.field?.querySelector('button, [role="button"]') ?? null;
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			}
		},
		template: `
		<div
			ref="container"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<FieldHoverButton
				v-if="isEditActive"
				ref="editButton"
				:icon="Outline.EDIT_L"
				:isVisible="isHovered || isSheetShown"
				:ariaLabel="loc('TASKS_V2_DATE_PLAN_ARIA_LABEL')"
				:ariaHaspopup="'dialog'"
				:ariaExpanded="isSheetShown"
				data-testid="tasks-date-plan-edit-btn"
				@click="handleClick"
			/>
			<div
				ref="field"
				class="tasks-field-date-plan"
				data-testid="tasks-date-plan"
				:class="{ '--readonly': readonly }"
				:data-task-id="taskId"
				:data-task-field-id="datePlanMeta.id"
				:data-task-plan-start="task.startPlanTs"
				:data-task-plan-end="task.endPlanTs"
				@click="handleClick"
			>
				<FieldList :fields/>
			</div>
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
			},
			opensSheet() {
				return !this.isSelected;
			}
		},
		watch: {
			isSheetShown() {
				this.syncAria();
			},
			opensSheet() {
				this.syncAria();
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			syncAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-haspopup', this.opensSheet ? 'dialog' : null);
				main_core.Dom.attr(el, 'aria-expanded', this.opensSheet ? String(this.isSheetShown) : null);
			},
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				this.$refs.chip?.$el.focus({
					preventScroll: true
				});
				this.setSheetShown(true);
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
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
			data-testid="tasks-date-plan-chip"
			ref="chip"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
		<DatePlanSheet v-if="isSheetShown && opensSheet" :sheetBindProps @close="setSheetShown(false)"/>
	`
	};

	exports.DatePlan = DatePlan;
	exports.DatePlanChip = DatePlanChip;
	exports.DatePlanSheet = DatePlanSheet;
	exports.datePlanMeta = datePlanMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.UI.IconSet, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.UI.IconSet, window, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.UI.DatePicker, BX.UI.NotificationManager, BX.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.System.Input.Vue, BX.UI.System.Menu, BX.Tasks.V2, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.UI, BX.UI.Vue3.Components, BX.UI.System.Chip.Vue);
//# sourceMappingURL=date-plan.bundle.js.map
