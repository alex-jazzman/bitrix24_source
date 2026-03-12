import { Dom, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import type { BaseEvent } from 'main.core.events';

import { mapGetters } from 'ui.vue3.vuex';
import { DatePicker, DatePickerEvent, createDate, createUtcDate } from 'ui.date-picker';

import { Core } from 'tasks.v2.core';
import { Model, Analytics } from 'tasks.v2.const';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';
import { analytics } from 'tasks.v2.lib.analytics';
import { Hint } from 'tasks.v2.component.elements.hint';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './deadline-popup-content.css';

type Preset = {
	id: string,
	title: string,
	timestamp: number,
	formatted: string,
	disabled: boolean,
};

// @vue/component
export const DeadlinePopupContent = {
	components: {
		Hint,
	},
	inject: {
		analytics: {},
		cardType: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['update', 'close'],
	setup(): Object
	{
		return {
			today: new Date(),
			/** @type DatePicker */
			datePicker: null,
			dateTs: null,
			hour: null,
		};
	},
	data(): Object
	{
		return {
			isLimitHintShown: false,
			hintBindElement: null,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		isCreator(): boolean
		{
			return this.currentUserId === this.task.creatorId;
		},
		isAdmin(): boolean
		{
			return Core.getParams().rights.user.admin;
		},
		canChangeDeadlineWithoutLimitation(): boolean
		{
			return (
				!this.isEdit
				|| this.isCreator
				|| this.task.rights.edit
				|| this.isAdmin
			);
		},
		maxDeadlineDate(): Date | null
		{
			if (this.canChangeDeadlineWithoutLimitation || !this.task.maxDeadlineChangeDate)
			{
				return null;
			}

			const dateFormat = DateTimeFormat.getFormat('FORMAT_DATETIME');

			return createDate(this.task.maxDeadlineChangeDate, dateFormat);
		},
		presets(): Preset[]
		{
			const [year, month, date] = [this.today.getFullYear(), this.today.getMonth(), this.today.getDate()];
			const format = DateTimeFormat.getFormat('DAY_OF_WEEK_MONTH_FORMAT');

			const allPresets = [
				{
					id: `today-${this.taskId}`,
					title: this.loc('TASKS_V2_DEADLINE_TODAY'),
					date: new Date(year, month, date),
				},
				{
					id: `tomorrow-${this.taskId}`,
					title: this.loc('TASKS_V2_DEADLINE_TOMORROW'),
					date: new Date(year, month, date + 1),
				},
				{
					id: `end-week-${this.taskId}`,
					title: this.loc('TASKS_V2_DEADLINE_IN_THE_END_OF_THE_WEEK'),
					date: new Date(year, month, date - this.today.getDay() + 5),
				},
				{
					id: `in-week-${this.taskId}`,
					title: this.loc('TASKS_V2_DEADLINE_IN_A_WEEK'),
					date: new Date(year, month, date + 7),
				},
				{
					id: `month-${this.taskId}`,
					title: this.loc('TASKS_V2_DEADLINE_IN_THE_END_OF_THE_MONTH'),
					date: new Date(year, month + 1, 0),
				},
			];

			return allPresets.map((preset: Object): Preset => {
				let disabled = false;

				if (this.maxDeadlineDate)
				{
					const presetUtcDate = createUtcDate(
						preset.date.getFullYear(),
						preset.date.getMonth(),
						preset.date.getDate(),
					);
					const maxUtcDate = createUtcDate(
						this.maxDeadlineDate.getUTCFullYear(),
						this.maxDeadlineDate.getUTCMonth(),
						this.maxDeadlineDate.getUTCDate(),
					);

					disabled = presetUtcDate > maxUtcDate;
				}

				return {
					id: preset.id,
					title: preset.title,
					timestamp: preset.date.getTime(),
					formatted: DateTimeFormat.format(format, preset.date),
					disabled,
				};
			});
		},
		limitHintText(): string
		{
			if (!this.maxDeadlineDate)
			{
				return '';
			}

			const format = DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
			const date = DateTimeFormat.format(format, this.maxDeadlineDate.getTime() / 1000);

			return this.loc('TASKS_V2_DEADLINE_CAN_MAX_CHANGE_DATE_HINT', { '#DATE#': date });
		},
	},
	created(): void
	{
		this.datePicker = this.createDatePicker();

		const date = new Date(this.task.deadlineTs + timezone.getOffset(this.task.deadlineTs));
		this.dateTs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
		this.hour = date.getHours();
	},
	mounted(): void
	{
		this.datePicker.setTargetNode(this.$refs.picker);
		this.datePicker.show();
	},
	beforeUnmount(): void
	{
		this.datePicker.destroy();
	},
	methods: {
		createDatePicker(): DatePicker
		{
			const offset = timezone.getOffset(this.task.deadlineTs);

			const dayColors = [];
			if (this.maxDeadlineDate)
			{
				dayColors.push({
					matcher: (date: Date) => {
						const compareDate = createUtcDate(
							date.getUTCFullYear(),
							date.getUTCMonth(),
							date.getUTCDate(),
						);

						return compareDate > this.maxDeadlineDate;
					},
					textColor: '#DFE0E3',
				});
			}

			const picker = new DatePicker({
				selectedDates: this.task.deadlineTs ? [this.task.deadlineTs + offset] : null,
				defaultTime: calendar.dayEndTime,
				inline: true,
				enableTime: true,
				dayColors,
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						const dateTs = calendar.createDateFromUtc(date).getTime();
						this.$emit('update', dateTs - timezone.getOffset(dateTs));
					},
					[DatePickerEvent.BEFORE_SELECT]: (event: BaseEvent) => {
						if (!this.maxDeadlineDate)
						{
							return;
						}

						const { date } = event.getData();
						const selectedDate = createUtcDate(
							date.getUTCFullYear(),
							date.getUTCMonth(),
							date.getUTCDate(),
						);

						if (selectedDate > this.maxDeadlineDate)
						{
							event.preventDefault();
						}
					},
				},
			});

			picker.getPicker('day').subscribe('onSelect', (event: BaseEvent) => {
				const { year, month, day } = event.getData();
				const dateTs = new Date(year, month, day).getTime();

				this.close();
				this.sendAnalytics(Analytics.Element.Calendar);

				this.dateTs = dateTs;
			});

			picker.getPicker('day').subscribe('onFocus', this.handleDayFocus);

			picker.getPicker('time').subscribe('onSelect', (event: BaseEvent) => {
				const { hour, minute } = event.getData();
				if (Number.isInteger(minute) || hour === this.hour)
				{
					this.close();
				}

				this.hour = hour;
			});

			return picker;
		},
		async focusDate(timestamp: ?number, disabled: boolean = false, event: ?Event = null): Promise<void>
		{
			if (this.maxDeadlineDate)
			{
				this.isLimitHintShown = false;
				this.hintBindElement = null;

				await this.$nextTick();

				if (disabled && event)
				{
					const presetElement = event.currentTarget;
					if (presetElement && timestamp)
					{
						this.hintBindElement = presetElement;
						this.isLimitHintShown = true;
					}

					return;
				}
			}

			this.datePicker.setFocusDate(timestamp);
		},
		selectPresetDate(timestamp: number, disabled: boolean = false): void
		{
			if (disabled)
			{
				return;
			}

			const date = new Date(timestamp);
			const [year, mount, day] = [date.getFullYear(), date.getMonth(), date.getDate()];

			this.datePicker.selectDate(new Date(`${mount + 1}/${day}/${year} ${calendar.dayEndTime}`));
			this.sendAnalytics(Analytics.Element.DeadlinePreset);

			this.close();
		},
		close(): void
		{
			this.$emit('close');
		},
		sendAnalytics(element: string): void
		{
			analytics.sendDeadlineSet(this.analytics, {
				element,
				cardType: this.cardType,
				taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
				viewersCount: this.task.auditorsIds?.length ?? 0,
				coexecutorsCount: this.task.accomplicesIds?.length ?? 0,
			});
		},
		async handleDayFocus(event: BaseEvent): Promise<void>
		{
			const { year, month, day } = event.getData();
			const dayPicker = event.getTarget();

			if (!this.maxDeadlineDate)
			{
				return;
			}

			const dayElement = dayPicker
				.getMonthContainer()
				.querySelector(
					`.ui-day-picker-day[data-year="${year}"][data-month="${month}"][data-day="${day}"]`,
				)
			;
			if (!dayElement)
			{
				return;
			}

			Dom.style(dayElement, 'cursor', 'pointer');

			this.isLimitHintShown = false;
			this.hintBindElement = null;

			await this.$nextTick();

			const focusedDate = createUtcDate(year, month, day);
			const maxUtcDate = createUtcDate(
				this.maxDeadlineDate.getUTCFullYear(),
				this.maxDeadlineDate.getUTCMonth(),
				this.maxDeadlineDate.getUTCDate(),
			);

			if (focusedDate > maxUtcDate)
			{
				this.datePicker.setFocusDate(null);

				Dom.style(dayElement, 'cursor', 'default');

				this.hintBindElement = dayElement;
				this.isLimitHintShown = true;
			}
		},
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
	`,
};
