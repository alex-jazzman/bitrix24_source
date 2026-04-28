import type { SlotRange, IntegrationCalendarType, Skus, SkuRelations } from 'booking.model.resources';

export type ResourceDto = {
	id: number | null,
	type: {
		id: number,
	},
	name: string,
	description: string | null,
	avatar: {
		id: number | null,
		url: string | null,
	} | null,
	isMain: boolean,
	isPrimary: boolean,
	isDeleted: boolean,
	slotRanges: SlotRange[],
	counter: number | null,
	createdBy: number | null,
	createdAt: number | null,
	updatedAt: number | null,
	deletedAt: number | null,

	senderCode: string,

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

	// integrationCalendar
	entities: IntegrationCalendarType[],

	// skus
	skus: Skus[],
	skusYandex: Skus[],
};

export type ResourceDtoWithFile = ResourceDto & {
	avatar: {
		id: number | null,
		url: string | null,
		encodedFile: string | null,
	} | null,
};

export type ResourceSkuRelationsDto = {
	avatar: {
		id: number | null,
		url: string | null,
	} | null,
	id: number,
	type: {
		id: number,
	},
	name: string,
	skus: SkuRelations[],
};
