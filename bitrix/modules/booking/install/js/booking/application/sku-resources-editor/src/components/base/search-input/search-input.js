import { Runtime, Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import './search-input.css';

// @vue/component
export const SearchInput = {
	name: 'SearchInput',
	components: {
		BIcon,
	},
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		placeholderText: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	data(): { searchDebounced: Function }
	{
		return {
			searchDebounced: Runtime.debounce(this.search, 200, this),
		};
	},
	methods: {
		inputQuery(event: InputEvent): void
		{
			const query = event.target.value;

			if (Type.isStringFilled(query))
			{
				this.searchDebounced(query);
			}
			else
			{
				this.search(query);
			}
		},
		search(query: string): void
		{
			if (this.modelValue !== query)
			{
				this.$emit('update:modelValue', query);
			}
		},
	},
	template: `
		<div class="booking-services-settings-popup__search-input_wrapper">
			<BIcon :name="Outline.SEARCH" :size="20" color="rgba(168, 173, 180, 1)"/>
			<input
				:value="modelValue"
				type="text"
				id="booking-services-settings-popup__search-input"
				class="booking-services-settings-popup__search-input"
				data-id="booking-services-settings-popup__search-input"
				:placeholder="placeholderText"
				@input="inputQuery"
			/>
		</div>
	`,
};
