import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { RemindTo, RemindBy, RemindVia, TaskField } from 'tasks.v2.const';

export const remindersMeta = Object.freeze({
	id: TaskField.Reminders,
	title: Loc.getMessage('TASKS_V2_CHECK_LIST_TITLE'),
	to: {
		[RemindTo.Responsible]: {
			icon: Outline.PERSON,
			title: Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_RESPONSIBLE'),
		},
		[RemindTo.Creator]: {
			icon: Outline.CROWN,
			title: Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_CREATOR'),
		},
		[RemindTo.Accomplice]: {
			icon: Outline.GROUP,
			title: Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_ACCOMPLICE'),
		},
		[RemindTo.Myself]: {
			icon: Outline.BOOKMARK,
			title: Loc.getMessage('TASKS_V2_REMINDERS_RECIPIENT_MYSELF'),
		},
	},
	by: {
		[RemindBy.Date]: Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DATE'),
		[RemindBy.Deadline]: Loc.getMessage('TASKS_V2_REMINDERS_REMIND_BY_DEADLINE'),
	},
	via: {
		[RemindVia.Notification]: {
			icon: Outline.EMPTY_MESSAGE,
			title: Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_NOTIFICATION'),
		},
		[RemindVia.Email]: {
			icon: Outline.MAIL,
			title: Loc.getMessage('TASKS_V2_REMINDERS_SEND_VIA_EMAIL'),
		},
	},
});
