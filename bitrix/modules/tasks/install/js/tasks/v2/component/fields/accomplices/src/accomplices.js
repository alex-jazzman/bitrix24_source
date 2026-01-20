import { Core } from 'tasks.v2.core';
import { Participants } from 'tasks.v2.component.elements.participants';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { accomplicesMeta } from './accomplices-meta';

// @vue/component
export const Accomplices = {
	name: 'TaskAccomplices',
	components: {
		Participants,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			accomplicesMeta,
		};
	},
	computed: {
		dataset(): Object
		{
			return {
				'data-task-id': this.taskId,
				'data-task-field-id': accomplicesMeta.id,
				'data-task-field-value': this.task.accomplicesIds.join(','),
			};
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.stakeholder.featureId;
		},
	},
	methods: {
		update(accomplicesIds: number[]): void
		{
			void taskService.update(this.taskId, { accomplicesIds });
		},
	},
	template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
			:dataset
			:isLocked
			:featureId
			@update="update"
		/>
	`,
};
