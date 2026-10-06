import { ConstantDatetimeControl } from './datetime';
import { MultipleConstantField } from './multiple-field';

// Date and time field of the form: a single row, or the list of rows of a multiple constant.
// @vue/component
export const ConstantDatetime = {
	name: 'ConstantDatetime',
	components: {
		ConstantDatetimeControl,
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
	emits: ['update:modelValue', 'dateMissingChange'],
	data(): Object
	{
		return {
			// Rows are addressed by their own key, the way the list itself addresses them: a removed row
			// shifts the indexes of the rows that stay, and those rows keep their state and republish
			// nothing. A row drops its key by reporting itself valid before it is unmounted.
			dateMissingKeys: [],
		};
	},
	methods: {
		setRowDateMissing(rowKey: number, isDateMissing: boolean): void
		{
			const keys = this.dateMissingKeys.filter((key: number) => key !== rowKey);
			if (isDateMissing)
			{
				keys.push(rowKey);
			}

			this.dateMissingKeys = keys;
			this.$emit('dateMissingChange', keys.length > 0);
		},
	},
	template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="modelValue"
			testIdPrefix="bizproc-setup-template__form-datetime"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, rowKey, update }">
				<ConstantDatetimeControl
					v-bind="$props"
					:modelValue="value"
					@update:modelValue="update"
					@dateMissingChange="setRowDateMissing(rowKey, $event)"
				/>
			</template>
		</MultipleConstantField>
		<ConstantDatetimeControl
			v-else
			v-bind="$props"
			@update:modelValue="$emit('update:modelValue', $event)"
			@dateMissingChange="$emit('dateMissingChange', $event)"
		/>
	`,
};
