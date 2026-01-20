import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { remindersService } from 'tasks.v2.provider.service.reminders-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { List } from './components/list/list';
import { ReminderSheet } from './components/reminder-sheet/reminder-sheet';
import './reminders-sheet.css';

// @vue/component
export const RemindersSheet = {
	name: 'TasksRemindersSheet',
	components: {
		BIcon,
		BottomSheet,
		HeadlineMd,
		List,
		UiButton,
		ReminderSheet,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			ButtonIcon,
			ButtonColor,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isLoading: true,
			isSheetShown: false,
		};
	},
	async mounted(): Promise<void>
	{
		await remindersService.list(this.taskId);

		this.isLoading = false;
	},
	template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<div class="tasks-field-reminders-sheet">
				<div class="tasks-field-reminders-sheet-header">
					<HeadlineMd>{{ loc('TASKS_V2_REMINDERS_TITLE_SHEET') }}</HeadlineMd>
					<BIcon
						class="tasks-field-reminders-sheet-close"
						:name="Outline.CROSS_L"
						hoverable
						@click="$emit('close')"
					/>
				</div>
				<div class="tasks-field-reminders-sheet-content">
					<List
						:numbers="task.numberOfReminders"
						:loading="isLoading"
						:sheetBindProps
					/>
				</div>
				<div class="tasks-field-reminders-sheet-footer">
					<UiButton
						:text="loc('TASKS_V2_REMINDERS_ADD')"
						:size="ButtonSize.SMALL"
						:leftIcon="ButtonIcon.ADD"
						:style="AirButtonStyle.TINTED"
						@click="isSheetShown = true"
					/>
				</div>
			</div>
		</BottomSheet>
		<ReminderSheet
			v-if="isSheetShown"
			:sheetBindProps
			@close="isSheetShown = false"
		/>
	`,
};
