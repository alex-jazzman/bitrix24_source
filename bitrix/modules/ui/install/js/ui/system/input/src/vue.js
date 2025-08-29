import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { InputSize, InputDesign } from './const';
export { InputSize, InputDesign };

import './input.css';

// @vue/component
export const BInput = {
	name: 'BInput',
	components: {
		BIcon,
	},
	expose: ['blur'],
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		label: {
			type: String,
			default: '',
		},
		labelInline: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		error: {
			type: String,
			default: '',
		},
		size: {
			type: String,
			default: InputSize.Lg,
		},
		design: {
			type: String,
			default: InputDesign.Grey,
		},
		icon: {
			type: String,
			default: '',
		},
		center: {
			type: Boolean,
			default: false,
		},
		withClear: {
			type: Boolean,
			default: false,
		},
		dropdown: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:modelValue',
		'click',
		'focus',
		'blur',
		'input',
		'clear',
	],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		value: {
			get(): string
			{
				return this.modelValue;
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', value);
			},
		},
		disabled(): boolean
		{
			return this.design === InputDesign.Disabled;
		},
	},
	template: `
		<div
			class="ui-system-input"
			:class="[
				'--' + design,
				'--' + size,
				{
					'--center': center,
					'--with-icon': icon,
					'--with-clear': withClear,
					'--with-dropdown': dropdown,
					'--active': active,
					'--error': error && !disabled,
				},
			]">
			<div v-if="label" class="ui-system-input-label" :class="{ '--inline': labelInline }">{{ label }}</div>
			<div class="ui-system-input-container">
				<input
					v-model="value"
					class="ui-system-input-value"
					:placeholder="placeholder"
					:disabled="disabled"
					ref="input"
					@click="$emit('click', $event)"
					@focus="$emit('focus', $event)"
					@blur="$emit('blur', $event)"
					@input="$emit('input', $event)"
				>
				<BIcon v-if="icon" class="ui-system-input-icon" :name="icon"/>
				<BIcon v-if="withClear" class="ui-system-input-cross" :name="Outline.CROSS_L" @click="$emit('clear')"/>
				<BIcon v-if="dropdown" class="ui-system-input-dropdown" :name="Outline.CHEVRON_DOWN_L"/>
			</div>
			<div v-if="error?.trim() && !disabled" class="ui-system-input-label --inline --error">{{ error }}</div>
		</div>
	`,
};
