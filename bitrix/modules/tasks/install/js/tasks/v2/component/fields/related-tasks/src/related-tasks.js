import { RelationTasks } from 'tasks.v2.component.fields.relation-tasks';
import { relatedTasksDialog } from 'tasks.v2.lib.relation-tasks-dialog';
import { relatedTasksMeta } from './related-tasks-meta';

// @vue/component
export const RelatedTasks = {
	name: 'TaskRelatedTasks',
	components: {
		RelationTasks,
	},
	inject: {
		taskId: {},
	},
	setup(): Object
	{
		return {
			relatedTasksMeta,
		};
	},
	methods: {
		handleAdd(targetNode: HTMLElement): void
		{
			relatedTasksDialog.show({
				targetNode,
				taskId: this.taskId,
			});
		},
	},
	template: `
		<RelationTasks :meta="relatedTasksMeta" @add="handleAdd"/>
	`,
};
