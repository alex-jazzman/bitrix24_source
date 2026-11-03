import { Dom, Event, Runtime, Text, Type } from 'main.core';

import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Notifier } from 'ui.notification-manager';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineMd, TextSm } from 'ui.system.typography.vue';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { BMenu } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Endpoint } from 'tasks.v2.const';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { Duration } from 'tasks.v2.component.elements.duration';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import { showLimit } from 'tasks.v2.lib.show-limit';

import { datePlanMeta } from './date-plan-meta';
import { DatePlanSwitcher } from './components/date-plan-switcher';
import './date-plan.css';

const MAX_INT = 2 ** 31;
const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];
const VISIBLE_LABEL_SELECTOR = '.ui-system-input-label:not(.--error)';

type Trigger = {
	ref: string,
	label: string,
	inputValue: string,
	isOpen: boolean,
	disabled: boolean,
	open: () => void,
};

// @vue/component
export const DatePlanSheet = {
	components: {
		BottomSheet,
		BIcon,
		UiButton,
		HeadlineMd,
		TextSm,
		BInput,
		BMenu,
		DatePlanSwitcher,
		Duration,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			InputDesign,
			ButtonSize,
			ButtonColor,
			wasEmpty: false,
			pickerPopupId: `tasks-date-plan-picker-${Text.getRandom()}`,
		};
	},
	data(): Object
	{
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
			matchesSubTasksTimeTemp: null,
		};
	},
	computed: {
		wasFilled(): boolean
		{
			return this.task.filledFields[datePlanMeta.id];
		},
		duration: {
			get(): number
			{
				return this.durationTs;
			},
			set(durationTs: number): void
			{
				if (durationTs === this.durationTs)
				{
					return;
				}

				this.durationTs = durationTs;

				this.updateRangeFromDuration();
			},
		},
		matchesWorkTime: {
			get(): boolean
			{
				return this.isMatchesWorkTimeLocked
					? false
					: this.matchesWorkTimeTemp ?? this.task.matchesWorkTime ?? false;
			},
			set(matchesWorkTime: boolean): void
			{
				if (this.isMatchesWorkTimeLocked)
				{
					void showLimit({
						featureId: Core.getParams().restrictions.skipWeekends.featureId,
					});

					return;
				}

				if (matchesWorkTime === this.matchesWorkTimeTemp)
				{
					return;
				}

				this.matchesWorkTimeTemp = matchesWorkTime;

				this.update();
			},
		},
		matchesSubTasksTime: {
			get(): boolean
			{
				return this.isMatchesSubTasksTimeLocked
					? false
					: this.matchesSubTasksTimeTemp ?? this.task.matchesSubTasksTime ?? false;
			},
			set(matchesSubTasksTime: boolean): void
			{
				if (this.isMatchesSubTasksTimeLocked)
				{
					void showLimit({
						featureId: Core.getParams().restrictions.relatedSubtaskDeadlines.featureId,
					});

					return;
				}

				this.matchesSubTasksTimeTemp = matchesSubTasksTime;
			},
		},
		allowsChangeDatePlan: {
			get(): boolean
			{
				if (this.isTemplate)
				{
					return this.task.allowsChangeDeadline ?? false;
				}

				return this.task.allowsChangeDatePlan ?? false;
			},
			set(allowsChangeDatePlan: boolean): void
			{
				if (this.isTemplate)
				{
					void taskService.update(this.taskId, { allowsChangeDeadline: allowsChangeDatePlan });

					return;
				}

				void taskService.update(this.taskId, { allowsChangeDatePlan });
			},
		},
		maxDurationReached(): boolean
		{
			return this.endTs && this.startTs && Math.floor((this.endTs - this.startTs) / 1000) >= MAX_INT;
		},
		inputDesign(): string
		{
			return this.matchesSubTasksTime ? InputDesign.Disabled : InputDesign.Grey;
		},
		isMatchesWorkTimeLocked(): boolean
		{
			return !Core.getParams().restrictions.skipWeekends.available;
		},
		isMatchesSubTasksTimeLocked(): boolean
		{
			return !Core.getParams().restrictions.relatedSubtaskDeadlines.available;
		},
		description(): string
		{
			if (this.isTemplate)
			{
				return this.loc('TASKS_V2_DATE_PLAN_DESCRIPTION_TEMPLATE');
			}

			return this.loc('TASKS_V2_DATE_PLAN_DESCRIPTION');
		},
		allowChangeText(): string
		{
			if (this.isTemplate)
			{
				return this.loc('TASKS_V2_DATE_PLAN_ALLOW_CHANGE_TEMPLATE');
			}

			return this.loc('TASKS_V2_DATE_PLAN_ALLOW_CHANGE');
		},
		matchWorkTimeHint(): string
		{
			if (this.isTemplate)
			{
				return this.loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME_HINT_TEMPLATE');
			}

			return this.loc('TASKS_V2_DATE_PLAN_MATCH_WORK_TIME_HINT');
		},
		isDisabled(): boolean
		{
			return this.inputDesign === InputDesign.Disabled;
		},
		triggers(): Trigger[]
		{
			return [
				{
					ref: 'start',
					label: this.loc('TASKS_V2_DATE_PLAN_START'),
					inputValue: this.formatDate(this.startTs),
					isOpen: this.isPickerShown && !this.isEndPicker,
					disabled: this.isDisabled,
					open: (): void => this.handleDateClick({ currentTarget: this.triggerEl('start') }, { isEnd: false }),
				},
				{
					ref: 'end',
					label: this.loc('TASKS_V2_DATE_PLAN_END'),
					inputValue: this.formatDate(this.endTs),
					isOpen: this.isPickerShown && this.isEndPicker,
					disabled: this.isDisabled,
					open: (): void => this.handleDateClick({ currentTarget: this.triggerEl('end') }, { isEnd: true }),
				},
			];
		},
	},
	watch: {
		// The sheet body renders through a slot, so the component's own updated() hook
		// is not guaranteed to run; a post-flush watcher syncs after the DOM settles.
		triggers: {
			handler(): void
			{
				this.syncAria();
			},
			flush: 'post',
		},
	},
	created(): void
	{
		this.wasEmpty = !this.wasFilled;
		this.updateDuration(this.task.startPlanTs, this.task.endPlanTs);
		this.startDatePlanAfter = this.task.startDatePlanAfter;
		this.templateDuration = this.task.endDatePlanAfter - this.task.startDatePlanAfter;
		this.showErrorDebounced = Runtime.debounce(this.showError, 300, this);
	},
	mounted(): void
	{
		this.syncAria();

		// main.popup closes the sheet from a capture-phase keyup listener on the document,
		// so an Escape that only dismisses the picker has to be claimed earlier: capture at
		// the window always runs before capture at the document, whatever the bind order.
		Event.bind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	beforeUnmount(): void
	{
		Event.unbind(window, 'keyup', this.handleWindowKeyUp, true);
	},
	methods: {
		triggerEl(ref: string): ?HTMLElement
		{
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
		syncAria(): void
		{
			for (const trigger: Trigger of this.triggers)
			{
				const node = this.triggerEl(trigger.ref);
				const input = node?.querySelector('input');
				if (!input)
				{
					continue;
				}

				Dom.attr(node, 'role', 'combobox');
				Dom.attr(node, 'aria-label', trigger.label);
				Dom.attr(node, 'aria-haspopup', 'dialog');
				Dom.attr(node, 'aria-expanded', trigger.isOpen ? 'true' : 'false');
				Dom.attr(node, 'aria-controls', trigger.isOpen ? this.pickerPopupId : null);
				Dom.attr(node, 'aria-disabled', trigger.disabled ? 'true' : null);
				Dom.attr(node, 'tabindex', trigger.disabled ? null : '0');
				Dom.attr(node.querySelector(VISIBLE_LABEL_SELECTOR), 'aria-hidden', 'true');
				Dom.attr(input, 'tabindex', trigger.disabled ? null : '-1');
				Dom.attr(input, 'aria-hidden', trigger.inputValue ? null : 'true');
			}
		},
		handleKeydown(event: KeyboardEvent, ref: string): void
		{
			if (this.isDisabled || !OPEN_KEYS.includes(event.key))
			{
				return;
			}

			const trigger = this.triggers.find((item: Trigger) => item.ref === ref);

			// The open picker runs its own arrow navigation, so ArrowDown has nothing to move
			// here: cancelling the page default would leave the key doing nothing at all.
			if (trigger.isOpen && event.key === 'ArrowDown')
			{
				return;
			}

			event.preventDefault();

			if (trigger.isOpen)
			{
				this.getDatePicker().hide();

				return;
			}

			trigger.open();
		},
		handleWindowKeyUp(event: KeyboardEvent): void
		{
			if (event.key !== 'Escape' || !this.isPickerShown)
			{
				return;
			}

			event.stopImmediatePropagation();
			this.getDatePicker().hide();
		},
		clearStart(): void
		{
			this.duration = 0;
			this.updatePlan(null, this.endTs);
		},
		clearEnd(): void
		{
			this.duration = 0;
			this.updatePlan(this.startTs, null);
		},
		handleDateClick({ currentTarget }: { currentTarget: HTMLElement }, { isEnd }: { isEnd: boolean }): void
		{
			this.updateDuration(this.startTs, this.endTs);
			this.isEndPicker = isEnd;

			const datePicker = this.getDatePicker();
			datePicker.setTargetNode(currentTarget);
			datePicker.show();
			if (this.isEndPicker && this.endTs)
			{
				datePicker.setFocusDate(this.endTs + timezone.getOffset(this.endTs));
			}
		},
		getDatePicker(): DatePicker
		{
			this.handlePickerChangedDebounced ??= Runtime.debounce(this.handlePickerChanged, 10, this);
			this.datePicker ??= new DatePicker({
				enableTime: true,
				selectionMode: 'range',
				defaultTime: calendar.dayEndTime,
				events: {
					[DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
					[DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
					onShow: (): void => {
						this.isPickerShown = true;
					},
					onHide: (): void => {
						this.isPickerShown = false;
					},
				},
				popupOptions: {
					id: this.pickerPopupId,
					animation: 'fading',
					targetContainer: this.sheetBindProps.getTargetContainer(),
				},
			});

			return this.datePicker;
		},
		handlePickerChanged(): void
		{
			let startPlanTs = this.preparePickerTimestamp(this.datePicker.getRangeStart());
			let endPlanTs = this.preparePickerTimestamp(this.datePicker.getRangeEnd());
			if (this.isEndPicker && !endPlanTs && !this.startTs)
			{
				[startPlanTs, endPlanTs] = [null, startPlanTs];
			}

			if (startPlanTs && !this.startTs)
			{
				startPlanTs = calendar.setHours(startPlanTs, calendar.workdayStart.H, calendar.workdayStart.M);
			}

			this.updateDuration(startPlanTs, endPlanTs);
		},
		updateDuration(startTs: number, endTs: number): void
		{
			const [start, end] = this.prepareRange(startTs, endTs);
			if (!start || !end)
			{
				this.duration = 0;

				this.updatePlan(start, end);

				return;
			}

			this.duration = this.matchesWorkTime ? calendar.calculateDuration(start, end) : end - start;

			this.updatePlan(start, end);
		},
		update(): void
		{
			const [startPlanTs, endPlanTs] = this.prepareRange(this.startTs, this.endTs);
			if (startPlanTs && endPlanTs)
			{
				this.updateRangeFromDuration();
			}
			else
			{
				this.updatePlan(startPlanTs, endPlanTs);
			}
		},
		updateRangeFromDuration(): void
		{
			let [startPlanTs, endPlanTs] = this.prepareRange(this.startTs, this.endTs);
			if (!startPlanTs && !endPlanTs)
			{
				return;
			}

			if (this.isEndDuration)
			{
				startPlanTs = null;
			}

			if (this.matchesWorkTime)
			{
				startPlanTs = calendar.calculateStartTs(startPlanTs, endPlanTs, this.duration);
				endPlanTs = calendar.calculateEndTs(startPlanTs, endPlanTs, this.duration);
			}
			else
			{
				startPlanTs ??= endPlanTs - this.duration;
				endPlanTs = startPlanTs + this.duration;
			}

			this.updatePlan(startPlanTs, endPlanTs);
		},
		updatePlan(startPlanTs: ?number, endPlanTs: ?number): void
		{
			this.startTs = startPlanTs;
			this.endTs = endPlanTs;
			if (this.maxDurationReached)
			{
				return;
			}

			const datePicker = this.getDatePicker();
			const options = { emitEvents: false };
			if (startPlanTs || endPlanTs)
			{
				const rangeStart = startPlanTs + timezone.getOffset(startPlanTs);
				const rangeEnd = endPlanTs ? endPlanTs + timezone.getOffset(endPlanTs) : null;
				if (startPlanTs)
				{
					datePicker.selectRange(rangeStart, rangeEnd, options);
				}
				else
				{
					datePicker.selectRange(rangeEnd, null, options);
				}
			}
			else
			{
				datePicker.deselectAll(options);
			}
		},
		prepareRange(startTs: number, endTs: number): [?number, ?number]
		{
			if (this.matchesWorkTime)
			{
				return [calendar.clampWorkDateTime(startTs), calendar.clampWorkDateTime(endTs)];
			}

			return [startTs, endTs];
		},
		preparePickerTimestamp(date: ?Date): ?number
		{
			if (!date)
			{
				return null;
			}

			const dateTs = calendar.createDateFromUtc(date).getTime();

			return dateTs - timezone.getOffset(dateTs);
		},
		formatDate(timestamp: number): string
		{
			return calendar.formatDateTime(timestamp, { forceYear: true });
		},
		close(): void
		{
			if (this.isTemplate)
			{
				this.handleTemplateUpdate();
			}
			else if (!this.maxDurationReached)
			{
				void this.handleTaskUpdate();
			}

			if (this.wasEmpty && this.wasFilled)
			{
				void fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
			}

			this.$emit('close');
		},
		handleTemplateUpdate(): void
		{
			const updateFields = {
				startDatePlanAfter: Number(this.startDatePlanAfter),
				endDatePlanAfter: Number(this.startDatePlanAfter + this.templateDuration),
				matchesWorkTime: this.matchesWorkTime,
			};

			const isMatchesWorkTimeChanged = this.task.matchesWorkTime !== this.matchesWorkTime;

			if (
				this.task.deadlineAfter
				&& isMatchesWorkTimeChanged
			)
			{
				updateFields.deadlineAfter = calendar.recalculateDurationByMatchWorkTime(
					this.task.deadlineAfter,
					this.task.matchesWorkTime,
					this.matchesWorkTime,
				);
			}

			void taskService.update(this.taskId, updateFields);
		},
		async handleTaskUpdate(): void
		{
			taskService.setSilentErrorMode(true);

			const result = await taskService.update(this.taskId, Object.fromEntries(Object.entries({
				startPlanTs: this.matchesSubTasksTime ? undefined : Number(this.startTs),
				endPlanTs: this.matchesSubTasksTime ? undefined : Number(this.endTs),
				matchesWorkTime: this.matchesWorkTime,
				matchesSubTasksTime: this.matchesSubTasksTime,
			}).filter(([, value]) => !Type.isUndefined(value))));

			taskService.setSilentErrorMode(false);

			if (result[Endpoint.TaskPlanUpdate]?.length)
			{
				const error = result[Endpoint.TaskPlanUpdate][0];

				this.showErrorDebounced(error);
			}
		},
		showError(error): void
		{
			Notifier.notifyViaBrowserProvider({
				id: 'tasks-date-plan-update-error',
				text: error?.message,
			});
		},
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
	`,
};
