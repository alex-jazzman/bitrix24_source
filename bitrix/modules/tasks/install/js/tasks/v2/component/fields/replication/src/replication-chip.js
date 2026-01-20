import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskId } from 'tasks.v2.lib.id-utils';
import type { TaskModel } from 'tasks.v2.model.tasks';
import { showLimit } from 'tasks.v2.lib.show-limit';

import { ReplicationSheet } from './replication-sheet';
import { replicationMeta } from './replication-meta';

type Inject = { task: TaskModel, taskId: TaskId };

// @vue/component
export const ReplicationChip = {
	name: 'ReplicationChip',
	components: {
		Chip,
		ReplicationSheet,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:isSheetShown'],
	setup(): { Outline: typeof Outline, replicationMeta: typeof replicationMeta } & Inject
	{
		return {
			replicationMeta,
			Outline,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[replicationMeta.id];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.recurrentTask.available;
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.recurrentTask.featureId,
					bindElement: this.$el,
				});

				return;
			}

			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			this.setSheetShown(true);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(replicationMeta.id);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<Chip
			:design
			:icon="Outline.REPEAT"
			:text="loc('TASKS_V2_REPLICATION_TITLE_CHIP')"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="replicationMeta.id"
			@click="handleClick"
		/>
		<ReplicationSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`,
};
