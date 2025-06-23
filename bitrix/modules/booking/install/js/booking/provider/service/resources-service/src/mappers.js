import type { ResourceModel } from 'booking.model.resources';
import type { ResourceDto } from './types';

export function mapDtoToModel(resourceDto: ResourceDto): ResourceModel
{
	return {
		id: resourceDto.id,
		typeId: resourceDto.type.id,
		name: resourceDto.name,
		description: resourceDto.description,
		slotRanges: resourceDto.slotRanges.map((slotRange) => ({
			...slotRange,
			weekDays: Object.values(slotRange.weekDays),
		})),
		counter: resourceDto.counter,
		isMain: resourceDto.isMain,
		createdBy: resourceDto.createdBy,
		createdAt: resourceDto.createdAt,
		updatedAt: resourceDto.updatedAt,

		// info
		isInfoNotificationOn: resourceDto.isInfoNotificationOn,
		templateTypeInfo: resourceDto.templateTypeInfo,
		infoNotificationDelay: resourceDto.infoNotificationDelay,

		// confirmation
		isConfirmationNotificationOn: resourceDto.isConfirmationNotificationOn,
		templateTypeConfirmation: resourceDto.templateTypeConfirmation,
		confirmationNotificationDelay: resourceDto.confirmationNotificationDelay,
		confirmationNotificationRepetitions: resourceDto.confirmationNotificationRepetitions,
		confirmationNotificationRepetitionsInterval: resourceDto.confirmationNotificationRepetitionsInterval,
		confirmationCounterDelay: resourceDto.confirmationCounterDelay,

		// reminder
		isReminderNotificationOn: resourceDto.isReminderNotificationOn,
		templateTypeReminder: resourceDto.templateTypeReminder,
		reminderNotificationDelay: resourceDto.reminderNotificationDelay,

		// delayed
		isDelayedNotificationOn: resourceDto.isDelayedNotificationOn,
		templateTypeDelayed: resourceDto.templateTypeDelayed,
		delayedNotificationDelay: resourceDto.delayedNotificationDelay,
		delayedCounterDelay: resourceDto.delayedCounterDelay,

		// feedback
		isFeedbackNotificationOn: resourceDto.isFeedbackNotificationOn,
		templateTypeFeedback: resourceDto.templateTypeFeedback,
	};
}

export function mapModelToDto(resource: ResourceModel): ResourceDto
{
	return {
		id: resource.id,
		type: {
			id: resource.typeId,
		},
		name: resource.name,
		description: resource.description,
		slotRanges: resource.slotRanges,
		counter: null,
		isMain: resource.isMain,
		createdBy: null,
		createdAt: null,
		updatedAt: null,

		// info
		isInfoNotificationOn: resource.isInfoNotificationOn,
		templateTypeInfo: resource.templateTypeInfo,
		infoNotificationDelay: resource.infoNotificationDelay,

		// confirmation
		isConfirmationNotificationOn: resource.isConfirmationNotificationOn,
		templateTypeConfirmation: resource.templateTypeConfirmation,
		confirmationNotificationDelay: resource.confirmationNotificationDelay,
		confirmationNotificationRepetitions: resource.confirmationNotificationRepetitions,
		confirmationNotificationRepetitionsInterval: resource.confirmationNotificationRepetitionsInterval,
		confirmationCounterDelay: resource.confirmationCounterDelay,

		// reminder
		isReminderNotificationOn: resource.isReminderNotificationOn,
		templateTypeReminder: resource.templateTypeReminder,
		reminderNotificationDelay: resource.reminderNotificationDelay,

		// delayed
		isDelayedNotificationOn: resource.isDelayedNotificationOn,
		templateTypeDelayed: resource.templateTypeDelayed,
		delayedNotificationDelay: resource.delayedNotificationDelay,
		delayedCounterDelay: resource.delayedCounterDelay,

		// feedback
		isFeedbackNotificationOn: resource.isFeedbackNotificationOn,
		templateTypeFeedback: resource.templateTypeFeedback,
	};
}
