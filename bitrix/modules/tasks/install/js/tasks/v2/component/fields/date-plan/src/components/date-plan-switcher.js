import { Text } from 'main.core';

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
	emits: ['update:modelValue'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			labelId: `tasks-date-plan-switch-${Text.getRandom()}`,
			lockReasonId: `tasks-date-plan-switch-lock-${Text.getRandom()}`,
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
	methods: {
		handleClick(): void
		{
			this.$emit('update:modelValue', !this.modelValue);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.handleClick();
		},
	},
	template: `
		<div
			class="tasks-field-date-plan-switcher"
			role="switch"
			:aria-checked="modelValue"
			:aria-labelledby="labelId"
			:aria-describedby="lock ? lockReasonId : null"
			tabindex="0"
			@click="handleClick"
			@keydown="handleKeydown"
		>
			<Switcher :isChecked="modelValue" :options/>
			<TextSm :id="labelId">{{ text }}</TextSm>
			<QuestionMark v-if="hint" :hintText="hint" @click.stop/>
			<template v-if="lock">
				<BIcon :name="Outline.LOCK_M" class="tasks-field-date-plan-switcher-lock" aria-hidden="true"/>
				<span :id="lockReasonId" class="tasks-field-date-plan-visually-hidden">
					{{ loc('TASKS_V2_DATE_PLAN_LOCK_ARIA_DESCRIPTION') }}
				</span>
			</template>
		</div>
	`,
};
