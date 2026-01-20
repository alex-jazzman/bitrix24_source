import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import type { EmailModel, TaskModel } from 'tasks.v2.model.tasks';

import { emailMeta } from './email-meta';

// @vue/component
export const EmailFrom = {
	name: 'TaskEmailFrom',
	components: {
		BIcon,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			emailMeta,
			Outline,
		};
	},
	computed: {
		email(): EmailModel | undefined
		{
			return this.task.email;
		},
	},
	template: `
		<div
			v-if="email.from"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id + '_from'"
			:data-task-field-value="email.id"
		>
			<div class="tasks-field-email-content">
				<BIcon :name="Outline.PERSON"/>
				<div class="tasks-field-email-title">{{ email.from }}</div>
			</div>
		</div>
	`,
};
