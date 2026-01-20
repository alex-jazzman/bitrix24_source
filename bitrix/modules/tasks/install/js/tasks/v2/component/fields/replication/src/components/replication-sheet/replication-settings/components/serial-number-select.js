import { UiSelect } from 'tasks.v2.component.elements.select';
import { ReplicationWeekDayIndex } from 'tasks.v2.const';
import type { Item as SelectItem } from 'tasks.v2.component.elements.select';

// @vue/component
export const SerialNumberSelect = {
	name: 'SerialNumberSelect',
	components: {
		UiSelect,
	},
	props: {
		modelValue: {
			type: Number,
			default: 0,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		weekDay: {
			type: Number,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		itemLocaleAlt(): string
		{
			if (this.weekDay === ReplicationWeekDayIndex.Sunday)
			{
				return '_ALT_1';
			}

			if (
				this.weekDay === ReplicationWeekDayIndex.Wednesday
				|| this.weekDay === ReplicationWeekDayIndex.Friday
				|| this.weekDay === ReplicationWeekDayIndex.Saturday
			)
			{
				return '_ALT_0';
			}

			return '';
		},
		items(): SelectItem[]
		{
			return [
				{ id: 0, title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FIRST${this.itemLocaleAlt}`) },
				{ id: 1, title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_SECOND${this.itemLocaleAlt}`) },
				{ id: 2, title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_THIRD${this.itemLocaleAlt}`) },
				{ id: 3, title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_FOURTH${this.itemLocaleAlt}`) },
				{ id: 4, title: this.loc(`TASKS_V2_REPLICATION_SETTINGS_WEEK_DAY_NUMBER_LAST${this.itemLocaleAlt}`) },
			];
		},
		item(): SelectItem
		{
			return this.items.find(({ id }) => id === this.modelValue);
		},
	},
	template: `
		<UiSelect
			:item
			:items
			:disabled
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`,
};
