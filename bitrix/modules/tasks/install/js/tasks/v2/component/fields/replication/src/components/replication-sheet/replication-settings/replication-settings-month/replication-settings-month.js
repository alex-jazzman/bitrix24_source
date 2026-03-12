import { Loc } from 'main.core';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { markRaw } from 'ui.vue3';

import {
	ReplicationMonthlyType,
	ReplicationPeriod,
	ReplicationWeekDayNum,
	ReplicationWeekDayIndex,
} from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { UiRadio } from 'tasks.v2.component.elements.radio';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationSettingsMonthlyByDayOfMonth } from './monthly-by-day-of-month/repllication-settings-monthly-by-day-of-month';
import { ReplicationSettingsMonthlyByDayOfWeek } from './monthly-by-day-of-week/replication-settings-monthly-by-day-of-week';
import { ReplicationInterval } from '../interval/interval';
import './replication-settings-month.css';

// @vue/component
export const ReplicationSettingsMonth = {
	name: 'ReplicationSettingsMonth',
	components: {
		BInput,
		ReplicationInterval,
		ReplicationSettingsMonthlyByDayOfMonth,
		ReplicationSettingsMonthlyByDayOfWeek,
		QuestionMark,
		UiRadio,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	setup(): { InputDesign: typeof InputDesign, InputSize: typeof InputSize, replicateParams: TaskReplicateParams }
	{
		return {
			InputDesign,
			InputSize,
		};
	},
	data(): { dayNumber: number, day: string }
	{
		return {
			dayNumber: 1,
			day: 'mon',
		};
	},
	computed: {
		period(): string
		{
			return markRaw(ReplicationPeriod.Monthly);
		},
		monthlyMonthNum(): number | null
		{
			return this.monthlyType === ReplicationMonthlyType.Absolute
				? this.replicateParams.monthlyMonthNum1
				: this.replicateParams.monthlyMonthNum2;
		},
		useInterval: {
			get(): boolean
			{
				return this.monthlyMonthNum > 0;
			},
			set(useInterval: boolean): void
			{
				this.updateMonthlyMonthNum(useInterval ? 1 : null);
			},
		},
		interval: {
			get(): number
			{
				return this.monthlyMonthNum || 1;
			},
			set(value: number): void
			{
				this.updateMonthlyMonthNum(value);
			},
		},
		monthlyType: {
			get(): number
			{
				return this.replicateParams.monthlyType;
			},
			set(type: number): void
			{
				const prevValue = this.monthlyType;

				this.update({ monthlyType: type });

				if (prevValue !== type)
				{
					this.updateFieldsByMonthlyType(type);
				}
			},
		},
		monthlyDayNum: {
			get(): number
			{
				return this.replicateParams.monthlyDayNum || 1;
			},
			set(value: number): void
			{
				this.update({ monthlyDayNum: value });
			},
		},
		monthlyWeekDay: {
			get(): number
			{
				return this.replicateParams.monthlyWeekDay ?? ReplicationWeekDayIndex.Monday;
			},
			set(value: number | null): void
			{
				this.update({ monthlyWeekDay: value });
			},
		},
		monthlyWeekDayNum: {
			get(): number
			{
				return this.replicateParams.monthlyWeekDayNum ?? 0;
			},
			set(value: number | null): void
			{
				this.update({ monthlyWeekDayNum: value });
			},
		},
		hintText(): string
		{
			return Loc.getMessagePlural(
				'TASKS_V2_REPLICATION_SETTINGS_MONTH_HINT',
				this.interval,
				{
					'#COUNT#': this.interval,
				},
			);
		},
	},
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
		},
		updateMonthlyMonthNum(monthlyMonthNum: number | null): void
		{
			if (this.monthlyType === ReplicationMonthlyType.Absolute)
			{
				this.update({ monthlyMonthNum1: monthlyMonthNum });
			}
			else
			{
				this.update({ monthlyMonthNum2: monthlyMonthNum });
			}
		},
		updateFieldsByMonthlyType(monthlyType: number): void
		{
			const patch: Partial<TaskReplicateParams> = {};

			if (monthlyType === ReplicationMonthlyType.Absolute)
			{
				patch.monthlyWeekDay = null;
				patch.monthlyWeekDayNum = null;
				patch.monthlyMonthNum1 = this.replicateParams.monthlyMonthNum2;
				patch.monthlyMonthNum2 = null;
			}
			else
			{
				patch.monthlyDayNum = null;
				patch.monthlyMonthNum2 = this.replicateParams.monthlyMonthNum1;
				patch.monthlyMonthNum1 = null;
				patch.monthlyWeekDay = ReplicationWeekDayIndex.Monday;
				patch.monthlyWeekDayNum = ReplicationWeekDayNum.First;
			}

			this.update(patch);
		},
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
	`,
};
