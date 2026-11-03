import { Dom } from 'main.core';

import { RelationTasks } from 'tasks.v2.component.fields.relation-tasks';
import { restoreOpenerFocus } from 'tasks.v2.lib.entity-selector-dialog';
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
		analytics: {},
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
			Dom.attr(targetNode, 'aria-expanded', 'true');

			relatedTasksDialog.show({
				targetNode,
				taskId: this.taskId,
				analytics: this.analytics,
				onClose: () => {
					Dom.attr(targetNode, 'aria-expanded', 'false');
					restoreOpenerFocus(targetNode);
				},
			});
		},
	},
	template: `
		<RelationTasks
			:meta="relatedTasksMeta"
			:shouldShowSubTasksOption="false"
			@add="handleAdd"
		/>
	`,
};
