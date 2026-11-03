import { ConstantTimeControl } from './time';
import { MultipleConstantField } from './multiple-field';

// Time field of the form: a single time row, or the list of rows of a multiple constant.
// @vue/component
export const ConstantTime = {
	name: 'ConstantTime',
	components: {
		ConstantTimeControl,
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
			testIdPrefix="bizproc-setup-template__form-time"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, update }">
				<ConstantTimeControl v-bind="$props" :modelValue="value" @update:modelValue="update"/>
			</template>
		</MultipleConstantField>
		<ConstantTimeControl
			v-else
			v-bind="$props"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	`,
};
