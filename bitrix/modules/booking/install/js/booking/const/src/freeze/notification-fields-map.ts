enum NotificationOn {
	info = 'isInfoNotificationOn',
	confirmation = 'isConfirmationNotificationOn',
	reminder = 'isReminderNotificationOn',
	delayed = 'isDelayedNotificationOn',
	feedback = 'isFeedbackNotificationOn',
	cancellation = 'isCancellationNotificationOn',
}

enum TemplateType {
	info = 'templateTypeInfo',
	confirmation = 'templateTypeConfirmation',
	reminder = 'templateTypeReminder',
	delayed = 'templateTypeDelayed',
	feedback = 'templateTypeFeedback',
}

const Settings = Object.freeze({
	info: ['infoNotificationDelay'],
	confirmation: ['confirmationNotificationDelay', 'confirmationNotificationRepetitions', 'confirmationNotificationRepetitionsInterval', 'confirmationCounterDelay'],
	reminder: ['reminderNotificationDelay'],
	delayed: ['delayedNotificationDelay', 'delayedCounterDelay'],
	feedback: [],
	cancellation: ['cancellationNotificationDelay'],
} as const);

export const NotificationFieldsMap = Object.freeze({
	NotificationOn,
	TemplateType,
	Settings,
} as const);

export type NotificationFieldsMap = typeof NotificationFieldsMap;
