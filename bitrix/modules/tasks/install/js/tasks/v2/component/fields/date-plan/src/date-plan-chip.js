import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { datePlanMeta } from './date-plan-meta';
import { DatePlanSheet } from './date-plan-sheet';

// @vue/component
export const DatePlanChip = {
	components: {
		Chip,
		DatePlanSheet,
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
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			datePlanMeta,
		};
	},
	computed: {
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return this.task.filledFields[datePlanMeta.id];
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

			this.setSheetShown(true);
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(datePlanMeta.id);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:icon="Outline.PLANNING"
			:text="loc('TASKS_V2_DATE_PLAN_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="datePlanMeta.id"
			:data-task-plan-start="task.startPlanTs"
			:data-task-plan-end="task.endPlanTs"
			@click="handleClick"
		/>
		<DatePlanSheet v-if="isSheetShown" :sheetBindProps @close="setSheetShown(false)"/>
	`,
};
