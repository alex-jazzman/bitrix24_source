import { ReplicationYearlyType } from 'tasks.v2.const';
import { UiRadio } from 'tasks.v2.component.elements.radio';

import { SerialNumberSelect } from '../../components/serial-number-select';
import { MonthSelect } from '../../components/month-select';
import { WeekDaySelect } from '../../components/week-day-select';

// @vue/component
export const ReplicationSettingsYearRelativeDate = {
	name: 'ReplicationSettingsYearRelativeDate',
	components: {
		MonthSelect,
		SerialNumberSelect,
		UiRadio,
		WeekDaySelect,
	},
	props: {
		yearlyType: {
			type: Number,
			required: true,
		},
		yearlyWeekDay: {
			type: Number,
			required: true,
		},
		yearlyWeekDayNum: {
			type: Number,
			required: true,
		},
		yearlyMonth: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:yearlyType', 'update:yearlyWeekDay', 'update:yearlyWeekDayNum', 'update:yearlyMonth'],
	setup(): Object
	{
		return {
			ReplicationYearlyType,
		};
	},
	computed: {
		disabled(): boolean
		{
			return this.yearlyType !== ReplicationYearlyType.Relative;
		},
		weekDay: {
			get(): number
			{
				return this.yearlyWeekDay;
			},
			set(weekDay: number): void
			{
				this.$emit('update:yearlyWeekDay', weekDay);
			},
		},
		weekDayNum: {
			get(): number
			{
				return this.yearlyWeekDayNum;
			},
			set(weekDayNum: number): void
			{
				this.$emit('update:yearlyWeekDayNum', weekDayNum);
			},
		},
		month: {
			get(): number
			{
				return this.yearlyMonth;
			},
			set(yearlyMonth: number): void
			{
				this.$emit('update:yearlyMonth', yearlyMonth);
			},
		},
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
	`,
};
