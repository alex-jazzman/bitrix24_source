import { Text } from 'main.core';
import { DateTimeFormat } from 'main.date';
import type { BaseEvent } from 'main.core.events';

import { mapGetters } from 'ui.vue3.vuex';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { TextSm } from 'ui.system.typography.vue';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { TaskSetting } from './task-setting';

import './task-deadline-settings.css';

const limitType = Object.freeze({
	date: 'date',
	count: 'count',
});

// @vue/component
export const TaskDeadlineSettings = {
	name: 'TasksTaskDeadlineSettings',
	components: {
		BInput,
		TaskSetting,
		TextSm,
		RichLoc,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	emits: [
		'updateDeadlineUserOption',
		'freeze',
		'unfreeze',
	],
	setup(): { task: TaskModel }
	{
		return {
			InputDesign,
			Outline,
		};
	},
	data(): Object
	{
		return {
			limitDeadline: false,
			limitType: limitType.date,
			isCalendarShown: false,
			localDeadlineUserOption: {
				requireDeadlineChangeReason: false,
				maxDeadlineChangeDate: this.formatDate(this.getDefaultDate()),
				maxDeadlineChanges: 1,
			},
		};
	},
	computed: {
		...mapGetters({
			deadlineUserOption: `${Model.Interface}/deadlineUserOption`,
		}),
		requireDeadlineChangeReason: {
			get(): boolean
			{
				return this.localDeadlineUserOption.requireDeadlineChangeReason === true;
			},
			set(value: boolean): void
			{
				this.localDeadlineUserOption.requireDeadlineChangeReason = value;
				this.emitDeadlineUserOptionUpdate();
			},
		},
		localMaxDeadlineChangeDate: {
			get(): ?Date
			{
				return DateTimeFormat.parse(this.localDeadlineUserOption.maxDeadlineChangeDate);
			},
			set(date: ?Date): void
			{
				this.localDeadlineUserOption.maxDeadlineChangeDate = this.formatDate(date);
				this.emitDeadlineUserOptionUpdate();
			},
		},
		localMaxDeadlineChanges: {
			get(): string
			{
				return String(this.localDeadlineUserOption.maxDeadlineChanges ?? '');
			},
			set(value: string): void
			{
				this.localDeadlineUserOption.maxDeadlineChanges = value === '' ? 1 : value;
				this.emitDeadlineUserOptionUpdate();
			},
		},
		limitByDate(): boolean
		{
			return this.limitType === limitType.date;
		},
		limitByCount(): boolean
		{
			return this.limitType === limitType.count;
		},
	},
	watch: {
		isCalendarShown(value: boolean): void
		{
			if (value)
			{
				this.datePicker.show();
			}
			else
			{
				this.datePicker.hide();
			}

			this.$emit(value ? 'freeze' : 'unfreeze');
		},
	},
	created(): void
	{
		if (this.isEdit)
		{
			this.localDeadlineUserOption.requireDeadlineChangeReason = this.task.requireDeadlineChangeReason;
			this.localDeadlineUserOption.maxDeadlineChangeDate = this.task.maxDeadlineChangeDate;
			this.localDeadlineUserOption.maxDeadlineChanges = this.task.maxDeadlineChanges;
		}
		else
		{
			this.localDeadlineUserOption.requireDeadlineChangeReason = this.deadlineUserOption.requireDeadlineChangeReason;
			this.localDeadlineUserOption.maxDeadlineChangeDate = this.deadlineUserOption.maxDeadlineChangeDate;
			this.localDeadlineUserOption.maxDeadlineChanges = this.deadlineUserOption.maxDeadlineChanges;
		}

		if (this.localDeadlineUserOption.maxDeadlineChangeDate)
		{
			void this.switchToDateLimit();
		}

		if (this.localDeadlineUserOption.maxDeadlineChanges)
		{
			this.switchToCountLimit();
		}

		this.limitDeadline = Boolean(this.localMaxDeadlineChangeDate || this.localMaxDeadlineChanges);
	},
	unmounted(): void
	{
		this.datePicker?.destroy();
	},
	methods: {
		createDatePicker(): DatePicker
		{
			const selectedDateTs = this.localMaxDeadlineChangeDate ? this.localMaxDeadlineChangeDate.getTime() : null;

			return new DatePicker({
				popupOptions: {
					id: `tasks-deadline-settings-calendar-popup-${Text.getRandom()}`,
					bindElement: this.$refs.calendarInput.$el,
					offsetTop: -8,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top',
					},
				},
				selectedDates: selectedDateTs ? [selectedDateTs] : null,
				enableTime: false,
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						this.localMaxDeadlineChangeDate = calendar.createDateFromUtc(date);
						this.isCalendarShown = false;
					},
				},
			});
		},
		emitDeadlineUserOptionUpdate(): void
		{
			const maxDeadlineChangeDate = this.limitByDate ? this.localDeadlineUserOption.maxDeadlineChangeDate : null;
			const maxDeadlineChanges = this.limitByDate ? null : this.localDeadlineUserOption.maxDeadlineChanges;

			this.$emit('updateDeadlineUserOption', {
				requireDeadlineChangeReason: this.localDeadlineUserOption.requireDeadlineChangeReason,
				maxDeadlineChangeDate: this.limitDeadline ? maxDeadlineChangeDate : null,
				maxDeadlineChanges: this.limitDeadline ? maxDeadlineChanges : null,
			});
		},
		toggleLimit(): void
		{
			this.limitDeadline = !this.limitDeadline;

			if (
				this.limitDeadline
				&& !this.localDeadlineUserOption.maxDeadlineChangeDate
				&& !this.localDeadlineUserOption.maxDeadlineChanges
			)
			{
				void this.switchToDateLimit();
			}

			this.emitDeadlineUserOptionUpdate();
		},
		async switchToDateLimit(): Promise<void>
		{
			if (!this.limitDeadline)
			{
				this.limitDeadline = true;
			}

			if (!this.localDeadlineUserOption.maxDeadlineChangeDate)
			{
				this.localMaxDeadlineChangeDate = this.getDefaultDate();
			}

			this.limitType = limitType.date;

			await this.$nextTick();
			this.datePicker = this.createDatePicker();

			this.emitDeadlineUserOptionUpdate();
		},
		switchToCountLimit(): void
		{
			if (!this.limitDeadline)
			{
				this.limitDeadline = true;
			}

			if (!this.localDeadlineUserOption.maxDeadlineChanges)
			{
				this.localMaxDeadlineChanges = 1;
			}

			this.limitType = limitType.count;

			this.emitDeadlineUserOptionUpdate();
		},
		getDefaultDate(): Date
		{
			const now = new Date();

			return new Date(
				now.getFullYear(),
				now.getMonth() + 1,
				now.getDate(),
			);
		},
		formatDate(date: ?Date): ?string
		{
			if (!date)
			{
				return null;
			}

			return DateTimeFormat.format(DateTimeFormat.getFormat('SHORT_DATE_FORMAT'), date);
		},
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
	`,
};
