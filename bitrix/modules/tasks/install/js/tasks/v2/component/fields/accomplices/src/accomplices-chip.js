import { Type } from 'main.core';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { analytics } from 'tasks.v2.lib.analytics';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { accomplicesMeta } from './accomplices-meta';

// @vue/component
export const AccomplicesChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
		analytics: {},
		cardType: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			accomplicesMeta,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[accomplicesMeta.id];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.stakeholder.available;
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
					featureId: Core.getParams().restrictions.stakeholder.featureId,
					bindElement: this.$el,
				});

				return;
			}

			void usersDialog.show({
				targetNode: this.$el,
				ids: this.task.accomplicesIds,
				onClose: this.handleClose,
			});
		},
		handleClose(accomplicesIds: number[]): void
		{
			if (!this.isSelected && accomplicesIds.length > 0)
			{
				this.highlightField();

				analytics.sendAddCoexecutor(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds?.length ?? 0,
					coexecutorsCount: accomplicesIds.length,
				});
			}

			void taskService.update(this.taskId, { accomplicesIds });
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(accomplicesMeta.id);
		},
	},
	template: `
		<Chip
			v-if="isSelected || task.rights.changeAccomplices"
			:design
			:icon="Outline.PERSON"
			:lock="isLocked"
			:text="loc('TASKS_V2_ACCOMPLICES_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="accomplicesMeta.id"
			:data-task-chip-value="task.accomplicesIds.join(',')"
			@click="handleClick"
		/>
	`,
};
