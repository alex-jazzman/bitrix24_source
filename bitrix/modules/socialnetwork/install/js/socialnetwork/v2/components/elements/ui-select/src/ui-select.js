import { type BaseEvent } from 'main.core.events';
import { defineComponent } from 'ui.vue3';
import { Select } from 'ui.select';
import { type UiSelectItem } from './types';

import './ui-select.css';

// @vue/component
export const UiSelect = defineComponent({
	name: 'UiSelect',
	props: {
		modelValue: {
			type: [String, Number, null],
			default: null,
		},
		label: {
			type: String,
			default: '',
		},
		/** @type{Array<UiSelectItem>} */
		items: {
			type: Array,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		inputClassName: {
			type: String,
			default: '',
		},
		targetContainer: {
			type: [HTMLElement, null],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	watch: {
		modelValue(value: string | number | null): void
		{
			this.select.setValue(String(value ?? ''));
		},
		items(): void
		{
			this.initSelect();
		},
		disabled(): void
		{
			this.updateDisabled();
		},
	},
	mounted(): void
	{
		this.initSelect();
	},
	methods: {
		initSelect(): void
		{
			this.select = new Select({
				options: this.items.map((item: UiSelectItem) => {
					return {
						value: String(item.id),
						label: item.title,
					};
				}),
				value: String(this.modelValue ?? ''),
				placeholder: this.label,
				containerClassname: `socialnetwork--ui-select ${this.inputClassName}`,
				popupParams: {
					targetContainer: this.targetContainer || document.body,
				},
			});
			this.select.subscribe('update', this.handleUpdate);
			this.select.renderTo(this.$refs.container);
			this.updateDisabled();
		},
		handleUpdate(event: BaseEvent<string>): void
		{
			const selectedItem = this.items.find((item: UiSelectItem) => String(item.id) === event.getData());
			if (selectedItem && selectedItem.id !== this.modelValue)
			{
				this.$emit('update:modelValue', selectedItem.id);
			}
		},
		updateDisabled(): void
		{
			this.select.getInput().disabled = this.disabled;
		},
	},
	template: `
		<div ref="container"></div>
	`,
});
