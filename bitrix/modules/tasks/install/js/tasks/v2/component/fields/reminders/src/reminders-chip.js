import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { ReminderSheet } from './components/reminder-sheet/reminder-sheet';
import { remindersMeta } from './reminders-meta';

// @vue/component
export const RemindersChip = {
	name: 'TasksRemindersChip',
	components: {
		Chip,
		ReminderSheet,
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
			remindersMeta,
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
			return this.task.filledFields[remindersMeta.id];
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
			void fieldHighlighter.setContainer(this.$root.$el).highlight(remindersMeta.id);
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<Chip
			v-if="isSelected || task.rights.reminder"
			:design
			:icon="Outline.NOTIFICATION"
			:text="loc('TASKS_V2_REMINDERS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="remindersMeta.id"
			@click="handleClick"
		/>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`,
};
