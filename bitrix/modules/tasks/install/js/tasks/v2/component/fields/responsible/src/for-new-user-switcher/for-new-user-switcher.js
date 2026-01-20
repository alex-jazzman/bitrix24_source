import { TextSm } from 'ui.system.typography.vue';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { Switcher } from 'ui.vue3.components.switcher';

import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import './for-new-user-switcher.css';

// @vue/component
export const ForNewUserSwitcher = {
	name: 'ForNewUserSwitcher',
	components: {
		Switcher,
		TextSm,
		QuestionMark,
	},
	props: {
		modelValue: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:modelValue'],
	computed: {
		switcherOptions(): SwitcherOptions
		{
			return Object.freeze({
				size: SwitcherSize.extraSmall,
				useAirDesign: true,
			});
		},
		hint(): string
		{
			return this.loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER_HINT');
		},
	},
	methods: {
		toggleChecked(checked: boolean)
		{
			this.$emit('update:modelValue', checked);
		},
	},
	template: `
		<div class="tasks-field-responsible-for-new-user-switcher" @click="toggleChecked(!this.modelValue)">
			<Switcher :isChecked="modelValue" :options="switcherOptions"/>
			<TextSm className="tasks-field-responsible-for-new-user-switcher-label">
				{{ loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER') }}
			</TextSm>
			<QuestionMark v-if="hint" :hintText="hint" :hintMaxWidth="320" @click.stop/>
		</div>
	`,
};
