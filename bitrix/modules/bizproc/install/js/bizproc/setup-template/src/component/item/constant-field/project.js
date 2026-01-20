import { Type } from 'main.core';
import type { ItemId } from 'ui.entity-selector';
import { TagItem, TagSelector } from 'ui.entity-selector';

const ENTITY_TYPES = Object.freeze({
	PROJECT: 'project',
});

// @vue/component
export const ConstantProject = {
	name: 'ConstantProject',
	props: {
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array, Number],
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	mounted(): void
	{
		this.initializeSelector();
	},
	beforeUnmount(): void
	{
		if (this.tagSelector)
		{
			this.tagSelector.getDialog().destroy();
			this.tagSelector = null;
		}
	},
	methods: {
		syncValue(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			const tags = this.tagSelector.getTags();
			const newValues = tags.map((tag: TagItem) => {
				return tag.getId();
			}).filter(Boolean);

			if (this.item.multiple)
			{
				this.$emit('update:modelValue', newValues);
			}
			else
			{
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
			}
		},
		getPreselectedItems(): Array<ItemId>
		{
			return this.normalizeModelValues().map((value: number): ItemId => [ENTITY_TYPES.PROJECT, value]);
		},
		normalizeModelValues(): Array<number>
		{
			if (Type.isArray(this.modelValue))
			{
				return this.modelValue
					.map((v) => Number(v))
					.filter((v: number) => Type.isNumber(v))
				;
			}

			return this.modelValue
				? [Number(this.modelValue)].filter((v: number) => Type.isNumber(v))
				: []
			;
		},
		initializeSelector(): void
		{
			this.tagSelector = new TagSelector({
				multiple: this.item.multiple,
				dialogOptions: {
					context: `BIZPROC_PROJECT_SELECTOR_${this.item.id}`,
					popupOptions: {
						className: 'bizproc-setup-template__no-tabs-selector-popup',
					},
					width: 500,
					entities: [
						{
							id: ENTITY_TYPES.PROJECT,
						},
					],
					multiple: this.item.multiple,
					dropdownMode: true,
					compactView: true,
					height: 250,
					preselectedItems: this.getPreselectedItems(),
				},
				events: {
					onAfterTagAdd: this.syncValue,
					onAfterTagRemove: this.syncValue,
				},
			});

			this.tagSelector.renderTo(this.$refs.container);
		},
	},
	template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-project"></div>
	`,
};
