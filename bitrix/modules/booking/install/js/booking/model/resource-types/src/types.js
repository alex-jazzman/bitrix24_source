import { Communication } from 'booking.const';

export type ResourceTypesState = {
	collection: { [id: number]: ResourceTypeModel },
};

export type ResourceTypeModel = {
	id: number | null,
	moduleId: string | null,
	name: string,
	code: string,
	resourcesCnt: number | null,

	senderCode: $Values<typeof Communication>;

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

	// cancellation
	isCancellationNotificationOn: boolean,
	cancellationNotificationDelay: number,

	// feedback
	isFeedbackNotificationOn: boolean,
	templateTypeFeedback: string,
};
