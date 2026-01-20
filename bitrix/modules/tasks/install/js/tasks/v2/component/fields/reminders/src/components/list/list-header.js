import { Text2Xs } from 'ui.system.typography.vue';

import './list-header.css';

// @vue/component
export const ListHeader = {
	name: 'TasksRemindersListHeader',
	components: {
		Text2Xs,
	},
	template: `
		<div class="tasks-field-reminders-row --header">
			<div class="tasks-field-reminders-column --header --via">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_VIA') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --date">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_DATE') }}</Text2Xs>
			</div>
			<div class="tasks-field-reminders-column --header --recipients">
				<Text2Xs>{{ loc('TASKS_V2_REMINDERS_LIST_COLUMN_TO') }}</Text2Xs>
			</div>
		</div>
	`,
};
