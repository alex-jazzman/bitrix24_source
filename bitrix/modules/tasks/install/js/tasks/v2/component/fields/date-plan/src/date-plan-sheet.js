import { Runtime, Type } from 'main.core';

import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineMd, TextSm } from 'ui.system.typography.vue';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { BMenu } from 'ui.system.menu.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
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
				return this.task.allowsChangeDatePlan ?? false;
			},
			set(allowsChangeDatePlan: boolean): void
			{
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
	},
	created(): void
	{
		this.wasEmpty = !this.wasFilled;
		this.updateDuration(this.task.startPlanTs, this.task.endPlanTs);
		this.startDatePlanAfter = this.task.startDatePlanAfter;
		this.templateDuration = this.task.endDatePlanAfter - this.task.startDatePlanAfter;
	},
	methods: {
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
				void taskService.update(this.taskId, {
					startDatePlanAfter: this.startDatePlanAfter,
					endDatePlanAfter: this.startDatePlanAfter + this.templateDuration,
					matchesWorkTime: this.matchesWorkTime,
				});
			}
			else if (!this.maxDurationReached)
			{
				void taskService.update(this.taskId, Object.fromEntries(Object.entries({
					startPlanTs: this.matchesSubTasksTime ? undefined : this.startTs,
					endPlanTs: this.matchesSubTasksTime ? undefined : this.endTs,
					matchesWorkTime: this.matchesWorkTime,
					matchesSubTasksTime: this.matchesSubTasksTime,
				}).filter(([, value]) => !Type.isUndefined(value))));
			}

			if (this.wasEmpty && this.wasFilled)
			{
				void fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
			}

			this.$emit('close');
		},
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
	`,
};
