import { Type } from 'main.core';
import { BOOL_VALUES } from '../../../lib/constant-bool/constant-bool';
import { ConstantBoolControl } from './bool';
import { MultipleConstantField, toMultipleValues } from './multiple-field';

// An empty value belongs to a constant that was never filled in: the switcher has no third state
// and shows such a value as "no", so N is what gets stored for it as well.
function toStoredBoolValue(value: mixed): string
{
	return Type.isStringFilled(value) ? value : BOOL_VALUES.NO;
}

function isSameValue(left: mixed, right: mixed): boolean
{
	if (Type.isArray(left) && Type.isArray(right))
	{
		return left.length === right.length && left.every((value: mixed, index: number) => value === right[index]);
	}

	return left === right;
}

// Bool field of the form: a single switcher, or the list of switchers of a multiple constant.
// @vue/component
export const ConstantBool = {
	name: 'ConstantBool',
	components: {
		ConstantBoolControl,
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
	computed: {
		/**
		 * A bool constant always has a value, so an empty one is stored as N. The whole value is
		 * normalized here, in the single place that sees it: the rows of a multiple constant are
		 * created within one render, so a row publishing its own N would build the new list from
		 * a prop that does not hold the values of its siblings yet, and only the last row would
		 * survive.
		 */
		normalizedValue(): string | Array<string>
		{
			return this.item.multiple
				? toMultipleValues(this.modelValue).map((value: mixed) => toStoredBoolValue(value))
				: toStoredBoolValue(this.modelValue)
			;
		},
	},
	watch: {
		normalizedValue: {
			immediate: true,
			handler(value: string | Array<string>): void
			{
				if (!isSameValue(value, this.modelValue))
				{
					this.$emit('update:modelValue', value);
				}
			},
		},
	},
	template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="normalizedValue"
			testIdPrefix="bizproc-setup-template__form-bool"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, rowKey, update }">
				<ConstantBoolControl
					v-bind="$props"
					:modelValue="value"
					:rowKey="rowKey"
					@update:modelValue="update"
				/>
			</template>
		</MultipleConstantField>
		<ConstantBoolControl
			v-else
			v-bind="$props"
			:modelValue="normalizedValue"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	`,
};
