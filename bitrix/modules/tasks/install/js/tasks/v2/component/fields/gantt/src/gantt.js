import { Dom } from 'main.core';

import { RelationTasks } from 'tasks.v2.component.fields.relation-tasks';
import { GanttPopup } from 'tasks.v2.application.gantt-popup';

import { ganttMeta } from './gantt-meta';

// @vue/component
export const Gantt = {
	name: 'TaskGantt',
	components: {
		RelationTasks,
		GanttPopup,
	},
	setup(): Object
	{
		return {
			ganttMeta,
		};
	},
	data(): Object
	{
		return {
			bindElement: null,
		};
	},
	methods: {
		handleAdd(addButton: HTMLElement): void
		{
			this.bindElement = addButton;
			Dom.attr(addButton, 'aria-expanded', 'true');
		},
		handleClose(): void
		{
			Dom.attr(this.bindElement, 'aria-expanded', 'false');
			this.bindElement = null;
		},
	},
	template: `
		<RelationTasks
			:meta="ganttMeta"
			:fields="new Set(['gantt'])"
			:shouldShowSubTasksOption="false"
			@add="handleAdd"
		/>
		<GanttPopup v-if="bindElement" :bindElement @close="handleClose"/>
	`,
};
