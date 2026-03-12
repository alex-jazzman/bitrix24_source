import { Core } from 'tasks.v2.core';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { tooltip } from 'tasks.v2.component.elements.hint';
import { RelationTasksChip } from 'tasks.v2.component.fields.relation-tasks';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { subTasksDialog } from 'tasks.v2.lib.relation-tasks-dialog';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { subTasksMeta } from './sub-tasks-meta';

// @vue/component
export const SubTasksChip = {
	components: {
		RelationTasksChip,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
		isTemplate: {},
		analytics: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			subTasksMeta,
		};
	},
	computed: {
		disabled(): boolean
		{
			return !this.isEdit && !this.isLocked && !this.task.templateId;
		},
		isLocked(): boolean
		{
			return this.isTemplate && !Core.getParams().restrictions.templatesSubtasks.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.templatesSubtasks.featureId;
		},
		tooltip(): ?Function
		{
			if (!this.disabled)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc(this.isTemplate ? 'TASKS_V2_SUB_TEMPLATES_DISABLED_HINT' : 'TASKS_V2_SUB_TASKS_DISABLED_HINT'),
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
					targetContainer: document.querySelector(`[data-task-card-scroll="${this.taskId}"]`),
				},
				timeout: 200,
			});
		},
	},
	methods: {
		handleAdd(targetNode: HTMLElement): void
		{
			subTasksDialog.show({
				targetNode,
				taskId: this.taskId,
				onClose: this.highlightField,
				analytics: this.analytics,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(subTasksMeta.id);
		},
	},
	template: `
		<RelationTasksChip 
			v-hint="tooltip" 
			:meta="subTasksMeta" 
			:disabled
			:isLocked
			:featureId
			@add="handleAdd"
		/>
	`,
};
