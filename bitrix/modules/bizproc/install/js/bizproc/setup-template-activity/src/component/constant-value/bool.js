import { Loc } from 'main.core';
import { BOOL_VALUES, normalizeBoolValue } from 'bizproc.setup-template';

// The label is the only part of a bool value the wizard owns: the value itself and its synonyms
// live in bizproc.setup-template, so the form of the constant and the launch form never diverge.
export function getBoolValueLabel(value: mixed): string
{
	const key = normalizeBoolValue(value) === BOOL_VALUES.YES
		? 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_YES'
		: 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_NO';

	return Loc.getMessage(key);
}

// @vue/component
export const ConstantValueBool = {
	name: 'ConstantValueBool',
	props: {
		modelValue: {
			type: String,
			default: BOOL_VALUES.NO,
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		return { BOOL_VALUES };
	},
	computed: {
		selectedValue(): string
		{
			return normalizeBoolValue(this.modelValue);
		},
	},
	methods: {
		handleChange(event: Event): void
		{
			this.$emit('update:modelValue', event.target.value);
		},
	},
	template: `
		<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 ui-ctl-sm">
			<div class="ui-ctl-after ui-ctl-icon-angle"></div>
			<select
				:value="selectedValue"
				class="ui-ctl-element"
				:aria-label="$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_EDIT_VALUE')"
				data-testid="bizproc-setup-template-constant-value-bool"
				@change="handleChange"
			>
				<option :value="BOOL_VALUES.YES">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_YES') }}
				</option>
				<option :value="BOOL_VALUES.NO">
					{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_VALUE_BOOL_NO') }}
				</option>
			</select>
		</div>
	`,
};
