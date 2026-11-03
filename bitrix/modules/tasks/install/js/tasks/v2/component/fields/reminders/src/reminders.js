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
					offsetLeft: this.$refs.add.offsetWidth / 2,
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
		<div class="tasks-field-reminders" :data-task-id="taskId" :data-task-field-id="remindersMeta.id" data-testid="tasks-reminders">
			<div class="tasks-field-reminders-title">
				<button
					type="button"
					class="tasks-field-reminders-main"
					:class="{ '--readonly': readonly }"
					ref="title"
					aria-haspopup="dialog"
					:aria-expanded="isListSheetShown"
					data-testid="tasks-reminders-open-btn"
					@click="setListSheetShown(true)"
				>
					<BIcon :name="Outline.NOTIFICATION" aria-hidden="true"/>
					<TextMd accent>{{ text }}</TextMd>
				</button>
				<div
					v-if="!readonly"
					v-hint="tooltip"
					class="tasks-field-reminders-edit-container"
				>
					<button
						type="button"
						class="tasks-field-reminders-icon"
						:aria-label="loc('TASKS_V2_REMINDERS_ADD')"
						aria-haspopup="dialog"
						:aria-expanded="isSheetShown"
						data-testid="tasks-reminders-add-btn"
						ref="add"
						@click="setSheetShown(true)"
					>
						<BIcon :name="Outline.PLUS_L" hoverable aria-hidden="true"/>
					</button>
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
