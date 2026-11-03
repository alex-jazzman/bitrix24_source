import { Core } from 'im.v2.application.core';
import { FakeDraftMessagePrefix, FakeMessagePrefix, MessageComponent } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

type MessageId = string | number;

export const MessageManager = {
	isEditable(id: MessageId): boolean
	{
		return isEditableMessageType(id) && isExistingOwnMessage(id);
	},
	isOwnMessage(id: MessageId): boolean
	{
		const message = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		return message.authorId === Core.getUserId();
	},
	isCheckInMessage(id: MessageId): boolean
	{
		const message = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		return message.componentId === MessageComponent.checkIn;
	},
	isCallMessage(id: MessageId): boolean
	{
		const message = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		return message.componentId === MessageComponent.callMessage;
	},
	isTodayMessage(id: MessageId): boolean
	{
		const message: ImModelMessage = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		if (MessageManager.isPlaceholderMessage(message.id))
		{
			return false;
		}

		return Utils.date.isToday(message.date);
	},
	isTempMessage(messageId: MessageId): boolean
	{
		return MessageManager.isPendingMessage(messageId) || MessageManager.isPlaceholderMessage(messageId);
	},
	isPendingMessage(messageId: MessageId): boolean
	{
		return Utils.text.isUuidV4(messageId);
	},
	isPlaceholderMessage(messageId: MessageId): boolean
	{
		const preparedMessageId = String(messageId);

		return preparedMessageId.startsWith(FakeMessagePrefix) || preparedMessageId.startsWith(FakeDraftMessagePrefix);
	},
};

export function messageHasError(message: ImModelMessage): boolean
{
	return Boolean(message.error || message.notDelivered);
}

function isEditableMessageType(id: MessageId): boolean
{
	const isSticker = Core.getStore().getters['stickers/messages/isSticker'](id);
	const isCheckIn = MessageManager.isCheckInMessage(id);
	const isCall = MessageManager.isCallMessage(id);
	const isBuilder = Core.getStore().getters['messages/builder/hasBlocks'](id);
	const isForward = Core.getStore().getters['messages/isForward'](id);
	const isContact = Core.getStore().getters['messages/getById'](id)?.componentId === MessageComponent.contactMessage;

	return !isSticker && !isCheckIn && !isCall && !isBuilder && !isForward && !isContact && isEditableVideoNote(id);
}

function isEditableVideoNote(id: MessageId): boolean
{
	const isVideoNote = Core.getStore().getters['messages/isVideoNote'](id);

	return !isVideoNote || FeatureManager.isFeatureAvailable(Feature.isVideoNoteCaptionAvailable);
}

function isExistingOwnMessage(id: MessageId): boolean
{
	const isRealMessage = Core.getStore().getters['messages/isRealMessage'](id);
	const isExists = Core.getStore().getters['messages/isExists'](id);

	return isRealMessage && isExists && MessageManager.isOwnMessage(id);
}
