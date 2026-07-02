const NotificationOn = Object.freeze({
	info: 'isInfoNotificationOn',
	confirmation: 'isConfirmationNotificationOn',
	reminder: 'isReminderNotificationOn',
	delayed: 'isDelayedNotificationOn',
	feedback: 'isFeedbackNotificationOn',
	cancellation: 'isCancellationNotificationOn',
});

const TemplateType = Object.freeze({
	info: 'templateTypeInfo',
	confirmation: 'templateTypeConfirmation',
	reminder: 'templateTypeReminder',
	delayed: 'templateTypeDelayed',
	feedback: 'templateTypeFeedback',
});

const Settings = Object.freeze({
	info: ['infoNotificationDelay'],
	confirmation: ['confirmationNotificationDelay', 'confirmationNotificationRepetitions', 'confirmationNotificationRepetitionsInterval', 'confirmationCounterDelay'],
	reminder: ['reminderNotificationDelay'],
	delayed: ['delayedNotificationDelay', 'delayedCounterDelay'],
	feedback: [],
	cancellation: ['cancellationNotificationDelay'],
});

export const NotificationFieldsMap = Object.freeze({
	NotificationOn,
	TemplateType,
	Settings,
});
