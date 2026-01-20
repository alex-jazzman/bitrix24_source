import { Text } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { UiSelect } from 'tasks.v2.component.elements.select';
import type { Item as SelectItem, MenuOptions } from 'tasks.v2.component.elements.select';

// @vue/component
export const MonthSelect = {
	name: 'MonthSelect',
	components: {
		UiSelect,
	},
	props: {
		/** @description Month index */
		modelValue: {
			type: Number,
			default: 1,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		items(): SelectItem[]
		{
			return Array.from({ length: 12 }, (_, i) => ({
				id: i + 1,
				title: Text.capitalize(DateTimeFormat.format('F', new Date().setMonth(i) / 1000)),
			}));
		},
		item(): SelectItem
		{
			return this.items.find(({ id }) => id === this.modelValue);
		},
		menuOptions(): MenuOptions
		{
			return {
				height: 254,
			};
		},
	},
	template: `
		<UiSelect
			:item
			:items
			:disabled
			:menuOptions
			@update:item="$emit('update:modelValue', $event.id)"
		/>
	`,
};
