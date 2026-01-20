import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { parentTaskMeta } from './parent-task-meta';
import { parentTaskDialog } from './parent-task-dialog';

// @vue/component
export const ParentTaskChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			parentTaskMeta,
			Outline,
		};
	},
	computed: {
		text(): string
		{
			if (idUtils.isTemplate(this.task.parentId))
			{
				return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE_CHIP');
			}

			return this.loc('TASKS_V2_PARENT_TASK_TITLE_CHIP');
		},
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[parentTaskMeta.id];
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			parentTaskDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onUpdate: this.highlightField,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(parentTaskMeta.id);
		},
	},
	template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:text
			:icon="Outline.SUBTASK"
			:data-task-id="taskId"
			:data-task-chip-id="parentTaskMeta.id"
			ref="chip"
			@click="handleClick"
		/>
	`,
};
