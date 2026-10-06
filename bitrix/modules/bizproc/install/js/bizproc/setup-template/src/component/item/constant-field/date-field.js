import { ConstantDateControl } from './date';
import { MultipleConstantField } from './multiple-field';

// Date field of the form: a single date row, or the list of rows of a multiple constant.
// @vue/component
export const ConstantDate = {
	name: 'ConstantDate',
	components: {
		ConstantDateControl,
		MultipleConstantField,
	},
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array],
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		labelledbyId: {
			type: String,
			default: '',
		},
		describedbyId: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="modelValue"
			testIdPrefix="bizproc-setup-template__form-date"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, update }">
				<ConstantDateControl v-bind="$props" :modelValue="value" @update:modelValue="update"/>
			</template>
		</MultipleConstantField>
		<ConstantDateControl
			v-else
			v-bind="$props"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	`,
};
