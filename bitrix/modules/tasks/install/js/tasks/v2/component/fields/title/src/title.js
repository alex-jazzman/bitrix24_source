import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
import { Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { titleMeta } from './title-meta';
import './title.css';

// @vue/component
export const Title = {
	name: 'TaskTitle',
	components: {
		GrowingTextArea,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			titleMeta,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		isEdit(): boolean
		{
			return Number.isInteger(this.taskId) && this.taskId > 0;
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	methods: {
		handleInput(title: string): void
		{
			if (!this.isEdit)
			{
				this.updateTaskTitle(title);
			}
		},
		handleUpdate(title: string): void
		{
			this.updateTaskTitle(title);
		},
		updateTaskTitle(title: string): void
		{
			void taskService.update(
				this.taskId,
				{ title },
			);
		},
	},
	template: `
		<GrowingTextArea
			class="tasks-field-title"
			:data-task-id="taskId"
			:data-task-field-id="titleMeta.id"
			:data-task-field-value="task.title"
			data-field-container
			:initialValue="task.title"
			:placeholderValue="loc('TASKS_V2_TITLE_PLACEHOLDER')"
			:readonly="disabled"
			@input="handleInput"
			@update="handleUpdate"
		/>
	`,
};
