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
	template: `
		<BottomSheet :sheetBindProps @close="$emit('close')">
			<ReminderSheetContent
				:reminderId
				:close="() => $emit('close')"
			/>
		</BottomSheet>
	`,
};
