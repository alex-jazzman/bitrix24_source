import { GrowingTextArea } from 'tasks.v2.component.elements.growing-text-area';
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
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
	},
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			titleMeta,
		};
	},
	computed: {
		title: {
			get(): string
			{
				return this.task.title;
			},
			set(title: string): void
			{
				void taskService.update(this.taskId, { title });
			},
		},
	},
	methods: {
		handleInput(title: string): void
		{
			if (!this.isEdit)
			{
				this.title = title;
			}
		},
	},
	template: `
		<GrowingTextArea
			v-model="title"
			class="tasks-field-title"
			:data-task-id="taskId"
			:data-task-field-id="titleMeta.id"
			:data-task-field-value="task.title"
			data-field-container
			:placeholder="titleMeta.getTitle(isTemplate)"
			:readonly="!task.rights.edit || disabled"
			@input="handleInput"
		/>
	`,
};
