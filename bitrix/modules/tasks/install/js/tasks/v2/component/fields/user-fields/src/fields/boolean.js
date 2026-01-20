import { Type } from 'main.core';

import { TextMd, TextXs } from 'ui.system.typography.vue';

import { Checkbox } from 'tasks.v2.component.elements.checkbox';

import './fields.css';

// @vue/component
export const UserFieldBoolean = {
	components: {
		TextMd,
		TextXs,
		Checkbox,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		value: {
			type: [Boolean, String],
			default: false,
		},
		mandatory: {
			type: Boolean,
			default: false,
		},
		isLast: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		preparedValue(): boolean
		{
			if (Type.isString(this.value))
			{
				return this.value === '1';
			}

			return this.value === true;
		},
		mandatoryClass(): string
		{
			return this.mandatory ? 'tasks-user-field-value-mandatory' : '';
		},
	},
	template: `
		<div
			class="tasks-user-field --boolean"
			:class="{ '--last': isLast }"
		>
			<div class="tasks-user-field-boolean-row">
				<Checkbox :checked="preparedValue" disabled/>
				<TextMd :className="mandatoryClass">
					{{ title }}
				</TextMd>
			</div>
		</div>
	`,
};
