import { TextSm } from 'ui.system.typography.vue';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Switcher } from 'ui.vue3.components.switcher';

import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

// @vue/component
export const DatePlanSwitcher = {
	components: {
		TextSm,
		Switcher,
		QuestionMark,
		BIcon,
	},
	props: {
		modelValue: {
			type: Boolean,
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
		hint: {
			type: String,
			default: '',
		},
		lock: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		options(): SwitcherOptions
		{
			return {
				size: SwitcherSize.extraSmall,
				useAirDesign: true,
			};
		},
	},
	template: `
		<div class="tasks-field-date-plan-switcher" @click="$emit('update:modelValue', !modelValue)">
			<Switcher :isChecked="modelValue" :options/>
			<TextSm>{{ text }}</TextSm>
			<QuestionMark v-if="hint" :hintText="hint" @click.stop/>
			<BIcon v-if="lock" :name="Outline.LOCK_M" class="tasks-field-date-plan-switcher-lock"/>
		</div>
	`,
};
