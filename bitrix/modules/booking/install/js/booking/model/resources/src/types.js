export type ResourcesState = {
	collection: { [resourceId: string]: ResourceModel },
};

export type ResourceModel = {
	id: number | null,
	typeId: number,
	name: string,
	description: string | null,
	slotRanges: SlotRange[],
	counter: number | null,
	isMain: false,
	createdBy: number,
	createdAt: number,
	updatedAt: number | null,

	// info
	isInfoNotificationOn: boolean,
	templateTypeInfo: string,
	infoNotificationDelay: number,

	// confirmation
	isConfirmationNotificationOn: boolean,
	templateTypeConfirmation: string,
	confirmationNotificationDelay: number,
	confirmationNotificationRepetitions: number,
	confirmationNotificationRepetitionsInterval: number,
	confirmationCounterDelay: number,

	// reminder
	isReminderNotificationOn: boolean,
	templateTypeReminder: string,
	reminderNotificationDelay: number,

	// delayed
	isDelayedNotificationOn: boolean,
	templateTypeDelayed: string,
	delayedNotificationDelay: number,
	delayedCounterDelay: number,

	// feedback
	isFeedbackNotificationOn: boolean,
	templateTypeFeedback: string,
};

export type SlotRange = {
	id: number | string | null,
	from: number,
	to: number,
	weekDays: string[],
	slotSize: number,
	timezone: string,
};
