import { Hint } from 'tasks.v2.component.elements.hint';
import { highlighter } from 'tasks.v2.lib.highlighter';

import './task-settings-hint.css';

// @vue/component
export const TaskSettingsHint = {
	name: 'TasksTaskSettingsHint',
	components: {
		Hint,
	},
	props: {
		isShown: {
			type: Boolean,
			required: true,
		},
		bindElement: {
			type: HTMLElement,
			default: () => null,
		},
	},
	computed: {},
	created()
	{
		void highlighter.highlight(this.bindElement);
	},
	template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				maxWidth: 460,
				closeIcon: true,
				offsetLeft: 14,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-task-settings-hint">
				<div class="tasks-task-settings-hint-image">
					<div class="tasks-task-settings-hint-icon"/>
				</div>
				<div class="tasks-task-settings-hint-content">
					<div class="tasks-task-settings-hint-title">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_TASK_SETTINGS_HINT_TITLE') }}
					</div>
					<div class="tasks-task-settings-hint-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_TASK_SETTINGS_HINT_TEXT') }}
					</div>
				</div>
			</div>
		</Hint>
	`,
};
