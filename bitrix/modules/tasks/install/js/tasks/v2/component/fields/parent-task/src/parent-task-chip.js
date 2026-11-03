import { Dom } from 'main.core';

import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { restoreOpenerFocus } from 'tasks.v2.lib.entity-selector-dialog';
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
	data(): Object
	{
		return {
			isDialogShown: false,
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
		text(): void
		{
			this.syncAria();
		},
	},
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		handleClick(): void
		{
			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			this.isDialogShown = true;
			parentTaskDialog.show({
				targetNode: this.$refs.chip.$el,
				taskId: this.taskId,
				withTemplates: !this.task.replicate && !this.task.isForNewUser,
				onClose: this.handleDialogClose,
			});
		},
		handleDialogClose(): void
		{
			this.isDialogShown = false;
			restoreOpenerFocus(this.$refs.chip?.$el);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(parentTaskMeta.id);
		},
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
			Dom.attr(el, 'aria-label', this.text);
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
