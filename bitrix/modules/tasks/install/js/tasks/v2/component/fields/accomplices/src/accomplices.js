import { Type } from 'main.core';
import { Core } from 'tasks.v2.core';
import { Participants } from 'tasks.v2.component.elements.participants';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { analytics } from 'tasks.v2.lib.analytics';
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
		analytics: {},
		cardType: {},
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
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.stakeholder.featureId;
		},
		accomplicesCount(): number
		{
			return this.task.accomplicesIds?.length ?? 0;
		},
	},
	methods: {
		update(accomplicesIds: number[]): void
		{
			const hasChanges = taskService.hasChanges(this.task, { accomplicesIds })
				&& accomplicesIds.length > 0
				&& accomplicesIds.length >= this.accomplicesCount
			;

			void taskService.update(this.taskId, { accomplicesIds });

			if (hasChanges)
			{
				analytics.sendAddCoexecutor(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds?.length ?? 0,
					coexecutorsCount: accomplicesIds.length,
				});
			}
		},
	},
	template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			@update="update"
		/>
	`,
};
