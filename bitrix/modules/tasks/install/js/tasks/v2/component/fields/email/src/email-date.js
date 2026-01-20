import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { calendar } from 'tasks.v2.lib.calendar';
import type { EmailModel, TaskModel } from 'tasks.v2.model.tasks';

import { emailMeta } from './email-meta';

// @vue/component
export const EmailDate = {
	name: 'TaskEmailDate',
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
		emailDate(): string
		{
			return calendar.formatDate(this.email.dateTs);
		},
	},
	template: `
		<div
			v-if="emailDate"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id + '_date'"
			:data-task-field-value="email.id"
		>
			<div class="tasks-field-email-content">
				<BIcon :name="Outline.CALENDAR"/>
				<div class="tasks-field-email-title">{{ emailDate }}</div>
			</div>
		</div>
	`,
};
