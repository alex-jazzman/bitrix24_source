import { Type } from 'main.core';
import { Core } from 'tasks.v2.core';
import { Participants } from 'tasks.v2.component.elements.participants';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { analytics } from 'tasks.v2.lib.analytics';
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
		analytics: {},
		cardType: {},
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
		auditorsCount(): number
		{
			return this.task.auditorsIds?.length ?? 0;
		},
	},
	methods: {
		update(auditorsIds: number[]): void
		{
			const hasChanges = taskService.hasChanges(this.task, { auditorsIds })
				&& auditorsIds.length > 0
				&& auditorsIds.length >= this.auditorsCount
			;

			void taskService.update(this.taskId, { auditorsIds });

			if (hasChanges)
			{
				analytics.sendAddViewer(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: auditorsIds.length,
					coexecutorsCount: this.task.accomplicesIds?.length ?? 0,
				});
			}
		},
	},
	template: `
		<Participants
			:taskId
			:context="auditorsMeta.id"
			:userIds="task.auditorsIds"
			:canAdd="task.rights.addAuditors"
			:canRemove="task.rights.edit"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			useRemoveAll
			@update="update"
		/>
	`,
};
