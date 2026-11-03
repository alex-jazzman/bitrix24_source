import { Dom } from 'main.core';

import { Core } from 'tasks.v2.core';
import { RelationTasks } from 'tasks.v2.component.fields.relation-tasks';
import { restoreOpenerFocus } from 'tasks.v2.lib.entity-selector-dialog';
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
			Dom.attr(targetNode, 'aria-expanded', 'true');

			subTasksDialog.show({
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
			:meta="subTasksMeta"
			:isLocked
			:featureId
			@add="handleAdd"
		/>
	`,
};
