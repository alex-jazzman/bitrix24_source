import { Core } from 'tasks.v2.core';
import { Participants } from 'tasks.v2.component.elements.participants';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { auditorsMeta } from './auditors-meta';

// @vue/component
export const Auditors = {
	name: 'TaskAuditors',
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
			auditorsMeta,
		};
	},
	computed: {
		dataset(): Object
		{
			return {
				'data-task-id': this.taskId,
				'data-task-field-id': auditorsMeta.id,
				'data-task-field-value': this.task.auditorsIds.join(','),
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
		update(auditorsIds: number[]): void
		{
			void taskService.update(this.taskId, { auditorsIds });
		},
	},
	template: `
		<Participants
			:taskId
			:context="auditorsMeta.id"
			:userIds="task.auditorsIds"
			:canAdd="task.rights.addAuditors"
			:canRemove="task.rights.edit"
			:dataset
			:isLocked
			:featureId
			useRemoveAll
			@update="update"
		/>
	`,
};
