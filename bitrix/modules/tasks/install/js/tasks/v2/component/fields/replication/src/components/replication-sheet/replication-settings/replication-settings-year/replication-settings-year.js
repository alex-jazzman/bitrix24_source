import { Type } from 'main.core';

import {
	ReplicationWeekDayNum,
	ReplicationYearlyType,
	ReplicationYearlyWeekDayIndex,
} from 'tasks.v2.const';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationSettingsYearAbsoluteDate } from './absolute-date/absolute-date';
import { ReplicationSettingsYearRelativeDate } from './relative-date/relative-date';

// @vue/component
export const ReplicationSettingsYear = {
	name: 'ReplicationSettingsYear',
	components: {
		ReplicationSettingsYearAbsoluteDate,
		ReplicationSettingsYearRelativeDate,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	computed: {
		yearlyType: {
			get(): number
			{
				return this.replicateParams.yearlyType;
			},
			set(yearlyType: number): void
			{
				const prevValue = this.yearlyType;

				this.update({ yearlyType });

				if (prevValue !== this.yearlyType)
				{
					this.updateByYearlyType(yearlyType);
				}
			},
		},
		yearlyWeekDay: {
			get(): number
			{
				return (this.replicateParams.yearlyWeekDay || ReplicationYearlyWeekDayIndex.Monday) - 1;
			},
			set(value: number | null): void
			{
				this.update({ yearlyWeekDay: Type.isInteger(value) ? value + 1 : value });
			},
		},
	},
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
		},
		updateByYearlyType(yearlyType: number): void
		{
			if (yearlyType === ReplicationYearlyType.Absolute)
			{
				this.update({
					yearlyWeekDay: null,
					yearlyWeekDayNum: null,
					yearlyMonth2: null,
					yearlyDayNum: 1,
					yearlyMonth1: 1,
				});
			}
			else
			{
				this.update({
					yearlyWeekDay: ReplicationYearlyWeekDayIndex.Monday,
					yearlyWeekDayNum: ReplicationWeekDayNum.First,
					yearlyMonth2: 1,
					yearlyDayNum: null,
					yearlyMonth1: null,
				});
			}
		},
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
	`,
};
