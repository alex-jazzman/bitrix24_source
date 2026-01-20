import { ReplicationMonthlyType } from 'tasks.v2.const';
import { UiRadio } from 'tasks.v2.component.elements.radio';
import { UiSelect } from 'tasks.v2.component.elements.select';

import { SerialNumberSelect } from '../../components/serial-number-select';
import { WeekDaySelect } from '../../components/week-day-select';

// @vue/component
export const ReplicationSettingsMonthlyByDayOfWeek = {
	name: 'ReplicationSettingsMonthlyByDayOfWeek',
	components: {
		SerialNumberSelect,
		UiRadio,
		UiSelect,
		WeekDaySelect,
	},
	props: {
		monthlyType: {
			type: Number,
			required: true,
		},
		weekDay: {
			type: Number,
			required: true,
		},
		weekDayNumber: {
			type: Number,
			required: true,
		},
	},
	emits: ['update:monthlyType', 'update:weekDayNumber', 'update:weekDay'],
	setup(): Object
	{
		return {
			ReplicationMonthlyType,
		};
	},
	computed: {
		disabled(): boolean
		{
			return this.monthlyType !== ReplicationMonthlyType.Relative;
		},
	},
	template: `
		<div
			class="tasks-replication-sheet-action-row --selectable"
			@click.self="$emit('update:monthlyType', ReplicationMonthlyType.Relative)"
		>
			<UiRadio
				:modelValue="monthlyType"
				:value="ReplicationMonthlyType.Relative"
				inputName="tasks-replication-sheet-monthly-type"
				@update:modelValue="$emit('update:monthlyType', $event)"
			/>
			<SerialNumberSelect
				:modelValue="weekDayNumber"
				:weekDay
				:disabled
				@update:modelValue="$emit('update:weekDayNumber', $event)"
			/>
			<WeekDaySelect
				:modelValue="weekDay"
				:disabled
				@update:modelValue="$emit('update:weekDay', $event)"
			/>
		</div>
	`,
};
