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
		},
	},
	template: `
		<RelationTasks :meta="ganttMeta" :fields="new Set(['gantt'])" @add="handleAdd"/>
		<GanttPopup v-if="bindElement" :bindElement @close="bindElement = null"/>
	`,
};
