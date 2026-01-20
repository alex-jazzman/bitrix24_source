import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { tooltip } from 'tasks.v2.component.elements.hint';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { remindersMeta } from './reminders-meta';
import { RemindersSheet } from './reminders-sheet';
import { ReminderSheet } from './components/reminder-sheet/reminder-sheet';
import './reminders.css';

// @vue/component
export const Reminders = {
	name: 'TasksReminders',
	components: {
		BIcon,
		TextMd,
		RemindersSheet,
		ReminderSheet,
	},
	directives: { hint },
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			required: true,
		},
		isListSheetShown: {
			type: Boolean,
			required: true,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			remindersMeta,
			Outline,
		};
	},
	computed: {
		text(): string
		{
			return this.loc('TASKS_V2_REMINDERS_TITLE', {
				'#NUMBER#': this.task.numberOfReminders,
			});
		},
		readonly(): boolean
		{
			return !this.task.rights.reminder;
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_REMINDERS_ADD'),
				popupOptions: {
					offsetLeft: this.$refs.add.$el.offsetWidth / 2,
				},
			});
		},
	},
	methods: {
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
		setListSheetShown(isShown: boolean): void
		{
			this.$emit('update:isListSheetShown', isShown);
		},
	},
	template: `
		<div class="tasks-field-reminders" :data-task-id="taskId" :data-task-field-id="remindersMeta.id">
			<div class="tasks-field-reminders-title">
				<div
					class="tasks-field-reminders-main"
					:class="{ '--readonly': readonly }"
					ref="title"
					@click="setListSheetShown(true)"
				>
					<BIcon :name="Outline.NOTIFICATION"/>
					<TextMd accent>{{ text }}</TextMd>
				</div>
				<div
					v-if="!readonly"
					v-hint="tooltip"
					class="tasks-field-reminders-edit-container"
				>
					<BIcon
						class="tasks-field-reminders-icon"
						:name="Outline.PLUS_L"
						hoverable
						ref="add"
						@click="setSheetShown(true)"
					/>
				</div>
			</div>
		</div>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
		<RemindersSheet
			v-if="isListSheetShown"
			:sheetBindProps
			@close="setListSheetShown(false)"
		/>
	`,
};
