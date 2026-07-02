import { Type } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { type BitrixVueComponentProps } from 'ui.vue3';

export const ConstantEntitySelector: BitrixVueComponentProps = {
	name: 'ConstantEntitySelector',

	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
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
		getPreselectedItems(): Array
		{
			let defaultValue = this.item.default;
			if (!Type.isArray(defaultValue))
			{
				defaultValue = [defaultValue];
			}

			const preselectedItems = [];
			defaultValue.forEach((value) => {
				if (Type.isStringFilled(value.id) && Type.isStringFilled(value.entityId))
				{
					preselectedItems.push([
						value.entityId,
						value.id,
					]);
				}
			});

			return preselectedItems;
		},
		syncValue(): void
		{
			if (!this.tagSelector)
			{
				return;
			}

			const tags = this.tagSelector.getTags();
			const newValues = tags.map((tag) => {
				return {
					id: tag.getId(),
					entityId: tag.getEntityId(),
				};
			});

			if (this.item.multiple)
			{
				this.$emit('update:modelValue', newValues);
			}
			else
			{
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : []);
			}
		},
		initializeSelector(): void
		{
			this.tagSelector = new TagSelector({
				multiple: this.item.multiple,
				showCreateButton: false,
				dialogOptions: {
					context: `BIZPROC_ENTITYSELECTOR_${this.item.id}`,
					preselectedItems: this.getPreselectedItems(),
					width: 500,
					multiple: this.item.multiple,
					showAvatars: true,
					dropdownMode: true,
					compactView: true,
					height: 250,
					...this.item.settings.selector.dialogOptions,
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
		<div ref="container" data-test-id="bizproc-setup-template__form-entityselector"></div>
	`,
};
