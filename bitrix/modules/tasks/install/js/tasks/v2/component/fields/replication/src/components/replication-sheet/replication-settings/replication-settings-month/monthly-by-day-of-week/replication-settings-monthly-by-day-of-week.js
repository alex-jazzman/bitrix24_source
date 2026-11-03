import { ReplicationMonthlyType } from 'tasks.v2.const';
import { UiRadio } from 'tasks.v2.component.elements.radio';
import { UiSelect } from 'tasks.v2.component.elements.select';

import { SerialNumberSelect } from '../../components/serial-number-select';
import { WeekDaySelect } from '../../components/week-day-select';

import '../../../replication-sheet-content.css';

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
				tag="label"
				class="tasks-replication-sheet-action-row__option"
				:modelValue="monthlyType"
				:value="ReplicationMonthlyType.Relative"
				inputName="tasks-replication-sheet-monthly-type"
				data-testid="tasks-replication-monthly-relative-radio"
				@update:modelValue="$emit('update:monthlyType', $event)"
			>
				<span class="tasks-field-replication-vh">
					{{ loc('TASKS_V2_REPLICATION_BY_WEEK_DAY_ARIA_LABEL') }}
				</span>
			</UiRadio>
			<SerialNumberSelect
				:modelValue="weekDayNumber"
				:weekDay
				:disabled
				data-testid="tasks-replication-monthly-week-day-number-select"
				@update:modelValue="$emit('update:weekDayNumber', $event)"
			/>
			<WeekDaySelect
				:modelValue="weekDay"
				:disabled
				data-testid="tasks-replication-monthly-week-day-select"
				@update:modelValue="$emit('update:weekDay', $event)"
			/>
		</div>
	`,
};
