import { Text } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { VALUE_RULE_KEYS } from '../../../constants';
import { readBound, writeBound } from './value-rule-bound';

import './value-rule.css';

export const ValueRuleLengthConstantSettings: BitrixVueComponentProps = {
	name: 'ValueRuleLengthConstantSettings',

	emits: ['update:modelValue'],

	props: {
		modelValue: {
			type: Object,
			required: true,
		},
		/** @type ConstantConfiguration */
		constantConfiguration: {
			type: Object,
			required: true,
		},
	},

	data(): { maxLengthId: string }
	{
		// the label of a field names it by id, so two editors open at once must not share one
		return {
			maxLengthId: `bizproc-setuptemplateactivity-value-rule-length-${Text.getRandom()}-max-length`,
		};
	},

	computed: {
		maxLength: {
			get(): string
			{
				return readBound(this.modelValue, VALUE_RULE_KEYS.MAX_LENGTH);
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', writeBound(this.modelValue, VALUE_RULE_KEYS.MAX_LENGTH, value));
			},
		},
		maxLengthLabel(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_SETTINGS_VALUE_RULE_MAX_LENGTH',
			);
		},
	},

	template: `
		<div
			class="bizproc-setuptemplateactivity-value-rule"
			data-testid="bizproc-setup-template-constant-edit-value-rule-length"
		>
			<div class="ui-ctl-container bizproc-setuptemplateactivity-value-rule__field">
				<div class="ui-ctl-top">
					<label class="ui-ctl-title" :for="maxLengthId">{{ maxLengthLabel }}</label>
				</div>
				<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
					<input
						:id="maxLengthId"
						v-model="maxLength"
						class="ui-ctl-element"
						type="number"
						step="1"
						min="1"
						data-testid="bizproc-setup-template-constant-edit-value-rule-max-length-input"
					/>
				</div>
			</div>
		</div>
	`,
};
