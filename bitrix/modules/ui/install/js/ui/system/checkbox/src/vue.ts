import { BIcon, Outline } from 'ui.icon-set.api.vue';
// @ts-ignore
import 'ui.icon-set.outline';

import { CheckboxSize } from './const';

import './checkbox.css';

export * from './const';
export * from './types';

// @vue/component
export const Checkbox = {
	name: 'UiCheckbox',
	components: {
		BIcon,
	},
	inheritAttrs: false,
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		indeterminate: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		size: {
			type: String,
			default: CheckboxSize.Md,
			validator: (value: string): boolean => (Object.values(CheckboxSize) as string[]).includes(value),
		},
	},
	emits: ['update:modelValue', 'update:indeterminate'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		ariaChecked(this: any): string | null
		{
			return this.indeterminate ? 'mixed' : null;
		},
		rootClasses(this: any): Array<string | { [key: string]: boolean }>
		{
			return [
				'ui-checkbox',
				`--size-${this.size}`,
				{
					'--checked': this.modelValue && !this.indeterminate,
					'--indeterminate': this.indeterminate,
					'--disabled': this.disabled,
				},
			];
		},
	},
	mounted(this: any): void
	{
		this.syncIndeterminate();
	},
	updated(this: any): void
	{
		this.syncIndeterminate();
	},
	methods: {
		syncIndeterminate(this: any): void
		{
			const input = this.$refs.input;
			if (input)
			{
				input.indeterminate = this.indeterminate;
			}
		},
		handleChange(this: any, event: Event): void
		{
			const input = event.target as HTMLInputElement;

			if (this.indeterminate)
			{
				input.checked = true;
				this.$emit('update:indeterminate', false);
				this.$emit('update:modelValue', true);

				return;
			}

			this.$emit('update:modelValue', input.checked);
		},
	},
	template: `
		<label :class="rootClasses">
			<input
				v-bind="$attrs"
				ref="input"
				type="checkbox"
				class="ui-checkbox__input"
				:checked="modelValue"
				:disabled="disabled"
				:aria-checked="ariaChecked"
				@change="handleChange"
			/>
			<span class="ui-checkbox__box" aria-hidden="true">
				<span v-if="indeterminate" class="ui-checkbox__dash"/>
				<BIcon v-else-if="modelValue" class="ui-checkbox__icon" :name="Outline.CHECK_M"/>
			</span>
		</label>
	`,
};
