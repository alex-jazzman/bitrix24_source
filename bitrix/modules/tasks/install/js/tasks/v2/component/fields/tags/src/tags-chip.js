import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { tagsMeta } from './tags-meta';
import { tagsDialog } from './tags-dialog';

// @vue/component
export const TagsChip = {
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
			Outline,
			tagsMeta,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[tagsMeta.id];
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

			tagsDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onClose: this.highlightField,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(tagsMeta.id);
		},
	},
	template: `
		<Chip
			:design
			:icon="Outline.TAG"
			:text="loc('TASKS_V2_TAGS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="tagsMeta.id"
			:data-task-chip-value="task.tags.join(',')"
			@click="handleClick"
		/>
	`,
};
