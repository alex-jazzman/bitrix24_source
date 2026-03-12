import { Type } from 'main.core';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { analytics } from 'tasks.v2.lib.analytics';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { auditorsMeta } from './auditors-meta';

// @vue/component
export const AuditorsChip = {
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
			auditorsMeta,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[auditorsMeta.id];
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
				ids: this.task.auditorsIds,
				onClose: this.handleClose,
			});
		},
		handleClose(auditorsIds: number[]): void
		{
			if (!this.isSelected && auditorsIds.length > 0)
			{
				this.highlightField();

				analytics.sendAddViewer(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: auditorsIds.length,
					coexecutorsCount: this.task.accomplicesIds?.length ?? 0,
				});
			}

			void taskService.update(this.taskId, { auditorsIds });
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(auditorsMeta.id);
		},
	},
	template: `
		<Chip
			v-if="isSelected || task.rights.addAuditors"
			:design
			:icon="Outline.OBSERVER"
			:lock="isLocked"
			:text="loc('TASKS_V2_AUDITORS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="auditorsMeta.id"
			:data-task-chip-value="task.auditorsIds.join(',')"
			@click="handleClick"
		/>
	`,
};
