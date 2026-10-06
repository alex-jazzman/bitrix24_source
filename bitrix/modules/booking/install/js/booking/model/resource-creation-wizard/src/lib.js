import { toRaw } from 'ui.vue3';
import { Core } from 'booking.core';
import { Communication, NotificationTemplateType } from 'booking.const';
import type { NotificationsSenderModel } from 'booking.model.notifications';
import type { ResourceModel } from './types';

export function resolveDefaultSenderCode(senders: NotificationsSenderModel[]): string
{
	const aiCall = senders.find((s) => s.code === Communication.AiCall);

	return aiCall?.canUse ? Communication.AiCall : Communication.Bitrix24;
}

export function getResource(resourceId: number): ResourceModel
{
	const store = Core.getStore();
	const resource = store.getters['resources/getById'](resourceId);

	return structuredClone(toRaw(resource));
}

export function getEmptyResource(): ResourceModel
{
	return {
		id: null,
		typeId: null,
		name: '',
		description: null,
		avatar: null,
		slotRanges: [],
		counter: null,
		entities: [],
		isMain: true,
		isPrimary: false,
		isDeleted: false,
		isConfirmationNotificationOn: false,
		isCancellationNotificationOn: false,
		isFeedbackNotificationOn: false,
		isInfoNotificationOn: false,
		isDelayedNotificationOn: false,
		isReminderNotificationOn: false,
		templateTypeConfirmation: NotificationTemplateType.Animate,
		templateTypeFeedback: NotificationTemplateType.Animate,
		templateTypeInfo: NotificationTemplateType.Animate,
		templateTypeDelayed: NotificationTemplateType.Animate,
		templateTypeReminder: NotificationTemplateType.Base,
		createdBy: 0,
		createdAt: 0,
		updatedAt: null,
		skus: [],
		skusYandex: [],
	};
}
