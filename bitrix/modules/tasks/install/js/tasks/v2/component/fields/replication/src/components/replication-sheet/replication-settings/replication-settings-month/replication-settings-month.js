import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';

import {
	ReplicationMonthlyType,
	ReplicationWeekDayNum,
	ReplicationWeekDayIndex,
} from 'tasks.v2.const';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { UiRadio } from 'tasks.v2.component.elements.radio';
import type { TaskReplicateParams } from 'tasks.v2.model.tasks';

import { ReplicationSettingsMonthlyByDayOfMonth } from './monthly-by-day-of-month/repllication-settings-monthly-by-day-of-month';
import { ReplicationSettingsMonthlyByDayOfWeek } from './monthly-by-day-of-week/replication-settings-monthly-by-day-of-week';
import './replication-settings-month.css';

// @vue/component
export const ReplicationSettingsMonth = {
	name: 'ReplicationSettingsMonth',
	components: {
		BInput,
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
	},
	methods: {
		update(params: Partial<TaskReplicateParams>): void
		{
			this.$emit('update', params);
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
		</div>
	`,
};
