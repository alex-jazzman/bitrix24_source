import { Core } from 'tasks.v2.core';
import { Participants } from 'tasks.v2.component.elements.participants';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { creatorMeta } from './creator-meta';

// @vue/component
export const Creator = {
	name: 'TaskCreator',
	components: {
		Participants,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			creatorMeta,
		};
	},
	computed: {
		currentUserId(): number
		{
			return Core.getParams().currentUser.id;
		},
		hintText(): string
		{
			if (this.task.flowId > 0)
			{
				return this.loc('TASKS_V2_CREATOR_CANT_CHANGE_FLOW');
			}

			if (this.task.responsibleIds.length > 1)
			{
				return this.loc('TASKS_V2_CREATOR_CANT_CHANGE_MANY');
			}

			return this.loc('TASKS_V2_CREATOR_CANT_CHANGE');
		},
		dataset(): Object
		{
			return {
				'data-task-id': this.taskId,
				'data-task-field-id': creatorMeta.id,
				'data-task-field-value': this.task.creatorId,
			};
		},
		isAdmin(): boolean
		{
			return Core.getParams().rights.user.admin;
		},
	},
	methods: {
		updateTask(userIds: number[]): void
		{
			const creatorId = userIds[0] || this.task.creatorId;

			void taskService.update(this.taskId, { creatorId });
		},
		handleHintClick(): void
		{
			void taskService.update(this.taskId, { responsibleIds: [this.currentUserId] });
		},
	},
	template: `
		<Participants
			:taskId
			:context="creatorMeta.id"
			:userIds="[task.creatorId || currentUserId]"
			:canAdd="task.rights.edit"
			:canRemove="task.rights.edit"
			:withHint="!isAdmin && !isEdit && (task.responsibleIds.length > 1 || task.responsibleIds[0] !== currentUserId)"
			:hintText
			single
			inline
			:dataset
			:showMenu="false"
			@hintClick="handleHintClick"
			@update="updateTask"
		/>
	`,
};
