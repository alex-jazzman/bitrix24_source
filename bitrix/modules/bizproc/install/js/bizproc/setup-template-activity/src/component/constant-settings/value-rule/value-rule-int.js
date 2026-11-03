import { Text } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';

import { VALUE_RULE_KEYS } from '../../../constants';
import { readBound, writeBound } from './value-rule-bound';

import './value-rule.css';

export const ValueRuleIntConstantSettings: BitrixVueComponentProps = {
	name: 'ValueRuleIntConstantSettings',

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

	data(): { minId: string, maxId: string }
	{
		// the label of a field names it by id, so two editors open at once must not share one
		const fieldId = `bizproc-setuptemplateactivity-value-rule-int-${Text.getRandom()}`;

		return {
			minId: `${fieldId}-min`,
			maxId: `${fieldId}-max`,
		};
	},

	computed: {
		min: {
			get(): string
			{
				return readBound(this.modelValue, VALUE_RULE_KEYS.MIN);
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', writeBound(this.modelValue, VALUE_RULE_KEYS.MIN, value));
			},
		},
		max: {
			get(): string
			{
				return readBound(this.modelValue, VALUE_RULE_KEYS.MAX);
			},
			set(value: string): void
			{
				this.$emit('update:modelValue', writeBound(this.modelValue, VALUE_RULE_KEYS.MAX, value));
			},
		},
		minLabel(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_SETTINGS_VALUE_RULE_MIN');
		},
		maxLabel(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_SETTINGS_VALUE_RULE_MAX');
		},
	},

	template: `
		<div
			class="bizproc-setuptemplateactivity-value-rule"
			data-testid="bizproc-setup-template-constant-edit-value-rule-int"
		>
			<div class="ui-ctl-container bizproc-setuptemplateactivity-value-rule__field">
				<div class="ui-ctl-top">
					<label class="ui-ctl-title" :for="minId">{{ minLabel }}</label>
				</div>
				<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
					<input
						:id="minId"
						v-model="min"
						class="ui-ctl-element"
						type="number"
						step="1"
						data-testid="bizproc-setup-template-constant-edit-value-rule-min-input"
					/>
				</div>
			</div>
			<div class="ui-ctl-container bizproc-setuptemplateactivity-value-rule__field">
				<div class="ui-ctl-top">
					<label class="ui-ctl-title" :for="maxId">{{ maxLabel }}</label>
				</div>
				<div class="ui-ctl ui-ctl-w100 ui-ctl-sm">
					<input
						:id="maxId"
						v-model="max"
						class="ui-ctl-element"
						type="number"
						step="1"
						data-testid="bizproc-setup-template-constant-edit-value-rule-max-input"
					/>
				</div>
			</div>
		</div>
	`,
};
