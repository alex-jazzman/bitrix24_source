import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { ReminderSheetContent } from './reminder-sheet-content';

// @vue/component
export const ReminderSheet = {
	name: 'TaskReminderSheet',
	components: {
		BottomSheet,
		ReminderSheetContent,
	},
	props: {
		reminderId: {
			type: [Number, String],
			default: 0,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		title(): string
		{
			return this.reminderId
				? this.loc('TASKS_V2_REMINDERS_UPDATE_SHEET')
				: this.loc('TASKS_V2_REMINDERS_ADD_SHEET');
		},
	},
	template: `
		<BottomSheet :sheetBindProps :ariaLabel="title" @close="$emit('close')">
			<ReminderSheetContent
				:reminderId
				:title
				:close="() => $emit('close')"
			/>
		</BottomSheet>
	`,
};
