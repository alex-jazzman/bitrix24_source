import { GanttPopup } from 'tasks.v2.application.gantt-popup';
import { RelationTasksChip } from 'tasks.v2.component.fields.relation-tasks';
import { ganttMeta } from './gantt-meta';

// @vue/component
export const GanttChip = {
	components: {
		RelationTasksChip,
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
			onDialogClose: null,
		};
	},
	methods: {
		handleAdd(addButton: HTMLElement, onClose: Function): void
		{
			this.bindElement = addButton;
			this.onDialogClose = onClose;
		},
		handleClose(): void
		{
			this.bindElement = null;
			this.onDialogClose?.();
			this.onDialogClose = null;
		},
	},
	template: `
		<RelationTasksChip :meta="ganttMeta" @add="handleAdd"/>
		<GanttPopup v-if="bindElement" :bindElement @close="handleClose"/>
	`,
};
