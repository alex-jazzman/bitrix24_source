import { DateTimeFormat } from 'main.date';
import { TextXs } from 'ui.system.typography.vue';

import { Checkbox as UiCheckbox } from 'tasks.v2.component.elements.checkbox';
import { calendar } from 'tasks.v2.lib.calendar';

import './replication-settings-week-days-list.css';

const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekValues = {
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
	Sun: 7,
};

// @vue/component
export const ReplicationSettingsWeekDaysList = {
	name: 'ReplicationSettingsWeekDaysList',
	components: {
		UiCheckbox,
		TextXs,
	},
	props: {
		selectedDays: {
			/** @type{number[]} */
			type: Array,
			required: true,
		},
	},
	emits: ['update:selectedDays'],
	computed: {
		weekDays(): string[]
		{
			const weekIndices = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
			const weekStartIndex = weekIndices[calendar.weekStart];

			return [week.slice(weekStartIndex), week.slice(0, weekStartIndex)].flat(1);
		},
		dayLabelMap(): { label: string, ariaLabel: string, value: number }[]
		{
			const shortDayFormat = 'D';
			const fullDayFormat = 'l';
			const todayDayIndex = new Date().getDay();

			return this.weekDays.map((day) => {
				const dayDate = new Date();
				const dayDifference = (week.indexOf(day) - todayDayIndex) % 7;

				dayDate.setDate(dayDate.getDate() + dayDifference);

				const label = DateTimeFormat.format(shortDayFormat, dayDate);
				const fullName = DateTimeFormat.format(fullDayFormat, dayDate).toLowerCase();

				return {
					label,
					ariaLabel: `${label}, ${fullName}`,
					value: weekValues[day],
				};
			});
		},
	},
	methods: {
		changeDay(day: number): void
		{
			if (this.selectedDays.includes(day))
			{
				this.$emit('update:selectedDays', this.selectedDays.filter((d) => d !== day));
			}
			else
			{
				this.$emit('update:selectedDays', [...this.selectedDays, day]);
			}
		},
	},
	template: `
		<div
			class="tasks-replication-sheet-action-row --weekdays"
			role="group"
			:aria-label="loc('TASKS_V2_REPLICATION_WEEKDAYS_GROUP_ARIA_LABEL')"
		>
			<label
				v-for="day in dayLabelMap"
				:key="day.value"
				class="tasks-field-replication-weekday"
				:data-id="'tasks-replication-week-day-' + day.value"
				:data-testid="'tasks-replication-week-day-' + day.value"
			>
				<UiCheckbox
					tag="span"
					:ariaLabel="day.ariaLabel"
					:checked="selectedDays.includes(day.value)"
					@click="changeDay(day.value)"
				/>
				<TextXs :className="['tasks-field-replication-weekday-text', {
					'--checked': selectedDays.includes(day.value),
				}]">
					{{ day.label }}
				</TextXs>
			</label>
		</div>
	`,
};
