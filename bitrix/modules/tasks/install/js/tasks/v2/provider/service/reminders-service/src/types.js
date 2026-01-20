import type { RemindBy, ReminderRecipient, RemindVia } from 'tasks.v2.model.reminders';

export type ReminderDto = {
	id: ?number,
	taskId: ?number,
	userId: ?number,
	nextRemindTs: ?number,
	remindBy: ?RemindBy,
	remindVia: ?RemindVia,
	recipient: ?ReminderRecipient,
	before: number,
};
