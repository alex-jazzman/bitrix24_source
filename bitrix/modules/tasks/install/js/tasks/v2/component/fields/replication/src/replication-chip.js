import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { tooltip } from 'tasks.v2.component.elements.hint';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { showLimit } from 'tasks.v2.lib.show-limit';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReplicationSheet } from './replication-sheet';
import { replicationMeta } from './replication-meta';

// @vue/component
export const ReplicationChip = {
	name: 'ReplicationChip',
	components: {
		Chip,
		ReplicationSheet,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
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
	setup(): { task: TaskModel }
	{
		return {
			replicationMeta,
			Outline,
		};
	},
	computed: {
		design(): string
		{
			if (this.disabled)
			{
				return ChipDesign.ShadowDisabled;
			}

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
		disabled(): boolean
		{
			return this.isTemplate && (this.task.isForNewUser || idUtils.isTemplate(this.task.parentId));
		},
		tooltip(): ?Function
		{
			if (!this.disabled)
			{
				return null;
			}

			return (): HintParams => tooltip({
				text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_REPLICATION_TEMPLATE_NOTICE', {
					'#TPARAM_FOR_NEW_USER#': this.loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER'),
				}),
				popupOptions: {
					offsetLeft: this.$refs.chip.$el.offsetWidth / 2,
				},
				timeout: 200,
			});
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

			if (this.disabled)
			{
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
			v-hint="tooltip"
			:design
			:icon="Outline.REPEAT"
			:text="loc('TASKS_V2_REPLICATION_TITLE_CHIP')"
			:lock="isLocked"
			:data-task-id="taskId"
			:data-task-chip-id="replicationMeta.id"
			ref="chip"
			@click="handleClick"
		/>
		<ReplicationSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`,
};
