import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { showLimit } from 'tasks.v2.lib.show-limit';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { crmMeta } from './crm-meta';
import { crmDialog } from './crm-dialog';
import './crm.css';

// @vue/component
export const CrmChip = {
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
			crmMeta,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[crmMeta.id];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.crmIntegration.available;
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

			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.crmIntegration.featureId,
				});

				return;
			}

			crmDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
				onClose: this.highlightField,
			});
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(crmMeta.id);
		},
	},
	template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:icon="Outline.CRM"
			:lock="isLocked"
			:text="loc('TASKS_V2_CRM_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="crmMeta.id"
			:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			@click="handleClick"
		/>
	`,
};
