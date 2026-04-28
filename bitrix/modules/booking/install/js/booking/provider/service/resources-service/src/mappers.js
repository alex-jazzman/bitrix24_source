import { Utils } from 'booking.lib.utils';
import { ResourceEntityType } from 'booking.const';
import type { IntegrationCalendarType, ResourceModel, ResourceModelWithFile, ResourceSkuRelationsModel } from 'booking.model.resources';
import type { ResourceDto, ResourceDtoWithFile, ResourceSkuRelationsDto } from './types';

export function mapDtoToModel(resourceDto: ResourceDto | ResourceDtoWithFile): ResourceModel
{
	return {
		id: resourceDto.id,
		typeId: resourceDto.type.id,
		name: resourceDto.name,
		description: resourceDto.description,
		avatar: resourceDto?.avatar ? {
			id: resourceDto.avatar.id,
			url: resourceDto.avatar.url,
		} : null,
		slotRanges: resourceDto.slotRanges.map((slotRange) => ({
			...slotRange,
			weekDays: Object.values(slotRange.weekDays),
		})),
		counter: resourceDto.counter,
		isMain: resourceDto.isMain,
		isPrimary: resourceDto.isPrimary,
		isDeleted: resourceDto.isDeleted,
		createdBy: resourceDto.createdBy,
		createdAt: resourceDto.createdAt,
		updatedAt: resourceDto.updatedAt,
		deletedAt: resourceDto.deletedAt,

		senderCode: resourceDto.senderCode,

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

		// integrationCalendar
		entities: resourceDto.entities || [],

		// skus
		skus: resourceDto.skus,
		skusYandex: resourceDto.skusYandex,
	};
}

export async function mapModelToDto(resource: ResourceModelWithFile): ResourceDtoWithFile
{
	return {
		id: resource.id,
		type: {
			id: resource.typeId,
		},
		name: resource.name,
		description: resource.description,
		avatar: resource?.avatar ? {
			id: resource.avatar.id,
			url: resource.avatar.url,
			encodedFile: resource.avatar.file ? await Utils.file.getBase64(resource.avatar.file) : null,
		} : null,
		slotRanges: resource.slotRanges,
		counter: null,
		isMain: resource.isMain,
		isDeleted: resource.isDeleted,
		createdBy: null,
		createdAt: null,
		updatedAt: null,

		senderCode: resource.senderCode,

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

		// integrationCalendar
		entities: entitiesToDto(resource.entities),

		// skus
		skus: resource.skus,
		skusYandex: resource.skusYandex,
	};
}

function entitiesToDto(entities: IntegrationCalendarType): Array
{
	return checkEntityCalendar(entities);
}

function checkEntityCalendar(entities: IntegrationCalendarType): Array
{
	// eslint-disable-next-line max-len
	return entities.filter((entity) => !(entity.entityType === ResourceEntityType.Calendar && entity.data?.userIds.length === 0));
}

export function mapResourceSkuRelationsDtoToModel(resource: ResourceSkuRelationsDto): ResourceSkuRelationsModel
{
	return {
		id: resource.id,
		typeId: resource.type?.id,
		name: resource.name,
		skus: resource.skus,
		avatar: resource?.avatar ? {
			id: resource.avatar.id,
			url: resource.avatar.url,
		} : null,
	};
}

// eslint-disable-next-line max-len
export function mapResourceSkuRelationsModelToDto(resource: ResourceSkuRelationsModel | ResourceModel): ResourceSkuRelationsDto
{
	return {
		id: resource.id,
		type: {
			id: resource.typeId,
		},
		name: resource.name,
		skus: resource.skus,
		avatar: resource?.avatar ? {
			id: resource.avatar.id,
			url: resource.avatar.url,
		} : null,
	};
}
