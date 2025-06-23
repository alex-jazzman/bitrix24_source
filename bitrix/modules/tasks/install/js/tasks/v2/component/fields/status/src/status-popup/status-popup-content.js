import { DateTimeFormat } from 'main.date';
import { Model, TaskStatus } from 'tasks.v2.const';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './status-popup.css';

// @vue/component
export const StatusPopupContent = {
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			dateFormat: DateTimeFormat.getFormat('SHORT_DATE_FORMAT'),
			timeFormat: DateTimeFormat.getFormat('SHORT_TIME_FORMAT'),
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		statusFormatted(): string
		{
			const statuses = {
				[TaskStatus.Pending]: 'TASKS_V2_STATUS_PENDING_FROM',
				[TaskStatus.InProgress]: 'TASKS_V2_STATUS_IN_PROGRESS_FROM',
				[TaskStatus.SupposedlyCompleted]: 'TASKS_V2_STATUS_SUPPOSEDLY_COMPLETED_FROM',
				[TaskStatus.Completed]: 'TASKS_V2_STATUS_COMPLETED_AT',
				[TaskStatus.Deferred]: 'TASKS_V2_STATUS_DEFERRED_AT',
			};

			return this.loc(statuses[this.task.status], {
				'#DATE#': DateTimeFormat.format(this.dateFormat, this.task.statusChangedTs / 1000),
				'#TIME#': DateTimeFormat.format(this.timeFormat, this.task.statusChangedTs / 1000),
			});
		},
		createdAtFormatted(): string
		{
			return this.loc('TASKS_V2_STATUS_CREATED_AT', {
				'#DATE#': DateTimeFormat.format(this.dateFormat, this.task.createdTs / 1000),
				'#TIME#': DateTimeFormat.format(this.timeFormat, this.task.createdTs / 1000),
			});
		},
	},
	template: `
		<div class="tasks-field-status-popup">
			<div>{{ statusFormatted }}</div>
			<div>{{ createdAtFormatted }}</div>
		</div>
	`,
};
