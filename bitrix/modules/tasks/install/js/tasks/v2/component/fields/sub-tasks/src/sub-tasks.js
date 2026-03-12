import { Core } from 'tasks.v2.core';
import { RelationTasks } from 'tasks.v2.component.fields.relation-tasks';
import { subTasksDialog } from 'tasks.v2.lib.relation-tasks-dialog';
import { subTasksMeta } from './sub-tasks-meta';

// @vue/component
export const SubTasks = {
	name: 'TaskSubTasks',
	components: {
		RelationTasks,
	},
	inject: {
		taskId: {},
		isTemplate: {},
		analytics: {},
	},
	setup(): Object
	{
		return {
			subTasksMeta,
		};
	},
	computed: {
		isLocked(): boolean
		{
			return this.isTemplate && !Core.getParams().restrictions.templatesSubtasks.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.templatesSubtasks.featureId;
		},
	},
	methods: {
		handleAdd(targetNode: HTMLElement): void
		{
			subTasksDialog.show({
				targetNode,
				taskId: this.taskId,
				analytics: this.analytics,
			});
		},
	},
	template: `
		<RelationTasks 
			:meta="subTasksMeta"
			:isLocked
			:featureId
			@add="handleAdd"
		/>
	`,
};
