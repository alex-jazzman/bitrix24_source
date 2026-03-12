import { TextSm } from 'ui.system.typography.vue';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Switcher } from 'ui.vue3.components.switcher';

import { showLimit } from 'tasks.v2.lib.show-limit';
import { QuestionMark } from 'tasks.v2.component.elements.question-mark';

import './task-setting.css';

// @vue/component
export const TaskSetting = {
	name: 'TasksTaskSetting',
	components: {
		Switcher,
		TextSm,
		QuestionMark,
		BIcon,
	},
	props: {
		modelValue: {
			type: Boolean,
			required: true,
		},
		label: {
			type: String,
			default: '',
		},
		questionMarkHint: {
			type: String,
			default: '',
		},
		lock: {
			type: Boolean,
			default: false,
		},
		featureId: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.small,
				useAirDesign: true,
			};
		},
		hasLabelSlot(): boolean
		{
			return Boolean(this.$slots.label);
		},
	},
	methods: {
		handleContainerClick(): void
		{
			if (this.lock)
			{
				this.handleLockClick();

				return;
			}

			this.$emit('update:modelValue', !this.modelValue);
		},
		handleLockClick(): void
		{
			if (!this.featureId)
			{
				return;
			}

			void showLimit({
				featureId: this.featureId,
			});
		},
	},
	template: `
		<div class="tasks-task-setting">
			<div class="tasks-task-setting-switcher">
				<Switcher
					:isChecked="modelValue"
					:options="switcherOptions"
					@click="handleContainerClick"
				/>
				<slot v-if="hasLabelSlot" name="label"/>
				<TextSm
					v-else
					class="tasks-task-setting-switcher-label"
					@click="handleContainerClick"
				>{{ label }}</TextSm>
				<QuestionMark v-if="questionMarkHint" :hintText="questionMarkHint"/>
				<BIcon 
					v-if="lock"
					:name="Outline.LOCK_M"
					class="tasks-task-setting-switcher-lock"
					@click="handleLockClick"
				/>
			</div>
			<div v-if="modelValue && $slots.default" class="tasks-task-setting-content">
				<slot/>
			</div>
		</div>
	`,
};
