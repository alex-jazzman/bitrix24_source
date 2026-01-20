export type ReminderModelState = {
	collection: { [reminderId: string]: ReminderModel },
};

export type ReminderModel = {
	id: ?number,
	taskId: ?number,
	userId: ?number,
	nextRemindTs: ?number,
	remindBy: ?RemindBy,
	remindVia: ?RemindVia,
	recipient: ?ReminderRecipient,
	before: number,
};

export type RemindBy = 'deadline' | 'date';
export type RemindVia = 'notification' | 'email';
export type ReminderRecipient = 'responsible' | 'creator' | 'accomplice' | 'myself';
