import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextSm } from 'ui.system.typography.vue';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { Switcher } from 'ui.vue3.components.switcher';

import { QuestionMark } from 'tasks.v2.component.elements.question-mark';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './for-new-user-switcher.css';

// @vue/component
export const ForNewUserSwitcher = {
	name: 'ForNewUserSwitcher',
	components: {
		Switcher,
		TextSm,
		QuestionMark,
	},
	directives: { hint },
	inject: {
		task: {},
		isTemplate: {},
	},
	props: {
		isChecked: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:isChecked'],
	setup(): { task: TaskModel } {},
	computed: {
		disabled(): boolean
		{
			return this.isTemplate && (this.task.replicate || idUtils.isTemplate(this.task.parentId));
		},
		options(): SwitcherOptions
		{
			return {
				size: SwitcherSize.extraSmall,
				useAirDesign: true,
			};
		},
		tooltip(): ?Function
		{
			if (!this.disabled)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_TYPE_NEW_TEMPLATE_NOTICE'),
				popupOptions: {
					offsetLeft: 10,
				},
				timeout: 200,
			});
		},
	},
	methods: {
		handleClick(): void
		{
			if (!this.disabled)
			{
				this.$emit('update:isChecked', !this.isChecked);
			}
		},
	},
	template: `
		<div :class="['tasks-field-responsible-new-user', { '--disabled': disabled }]">
			<div v-hint="tooltip" class="tasks-field-responsible-new-user-switcher" @click="handleClick">
				<Switcher :isChecked :options/>
				<TextSm className="tasks-field-responsible-new-user-text">
					{{ loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER') }}
				</TextSm>
			</div>
			<QuestionMark :hintText="loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER_HINT')" :hintMaxWidth="320" @click.stop/>
		</div>
	`,
};
