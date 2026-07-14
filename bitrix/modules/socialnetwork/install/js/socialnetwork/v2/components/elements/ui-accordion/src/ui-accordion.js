import './ui-accordion.css';

// @vue/component
export const UiAccordion = {
	name: 'UiAccordion',
	provide(): { accordion: typeof UiAccordion }
	{
		return {
			accordion: this,
		};
	},
	props: {
		value: {
			type: [Number, String, Array, null],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value'],
	expose: ['isItemOpen', 'toggleItem'],
	methods: {
		isItemOpen(itemValue: string | number): boolean
		{
			if (this.multiple)
			{
				const values = Array.isArray(this.value) ? this.value : [];

				return values.includes(itemValue);
			}

			return this.value === itemValue;
		},
		toggleItem(itemValue: string | number): void
		{
			if (this.disabled)
			{
				return;
			}

			if (this.multiple)
			{
				const values = Array.isArray(this.value) ? [...this.value] : [];
				const index = values.indexOf(itemValue);

				if (index >= 0)
				{
					values.splice(index, 1);
				}
				else
				{
					values.push(itemValue);
				}

				this.$emit('update:value', values);

				return;
			}

			this.$emit('update:value', this.value === itemValue ? null : itemValue);
		},
	},
	template: `
		<div class="sonet--ui-accordion">
			<slot></slot>
		</div>
	`,
};
