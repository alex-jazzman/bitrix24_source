import { Dom } from 'main.core';
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
	data(): Object
	{
		return {
			isDialogShown: false,
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
		opensDialog(): boolean
		{
			return !this.isSelected;
		},
	},
	watch: {
		isDialogShown(): void
		{
			this.syncAria();
		},
		opensDialog(): void
		{
			this.syncAria();
		},
	},
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		syncAria(): void
		{
			const el = this.$refs.chip?.$el;
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-haspopup', this.opensDialog ? 'dialog' : null);
			Dom.attr(el, 'aria-expanded', this.opensDialog ? String(this.isDialogShown) : null);
		},
		handleClick(): void
		{
			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			this.isDialogShown = true;
			tagsDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onClose: this.handleDialogClose,
			});
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.handleClick();
		},
		handleDialogClose(): void
		{
			this.isDialogShown = false;

			this.highlightField();
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
			data-testid="tasks-tags-chip"
			ref="chip"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
	`,
};
