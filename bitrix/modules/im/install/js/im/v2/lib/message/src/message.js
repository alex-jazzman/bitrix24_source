import { Core } from 'im.v2.application.core';
import { FakeDraftMessagePrefix, FakeMessagePrefix, MessageComponent } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelMessage } from 'im.v2.model';

type MessageId = string | number;

export const MessageManager = {
	isEditable(id: MessageId): boolean
	{
		if (!isEditableMessageType(id) || !isExistingOwnMessage(id))
		{
			return false;
		}

		const isForward = Core.getStore().getters['messages/isForward'](id);
		const isVideoNote = Core.getStore().getters['messages/isVideoNote'](id);

		return !isForward && !isVideoNote;
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

function isEditableMessageType(id: MessageId): boolean
{
	const isSticker = Core.getStore().getters['stickers/messages/isSticker'](id);
	const isCheckIn = MessageManager.isCheckInMessage(id);
	const isBuilder = Core.getStore().getters['messages/builder/hasBlocks'](id);
	const isForward = Core.getStore().getters['messages/isForward'](id);
	const isVideoNote = Core.getStore().getters['messages/isVideoNote'](id);

	return !isSticker && !isCheckIn && !isBuilder && !isForward && !isVideoNote;
}

function isExistingOwnMessage(id: MessageId): boolean
{
	const isRealMessage = Core.getStore().getters['messages/isRealMessage'](id);
	const isExists = Core.getStore().getters['messages/isExists'](id);

	return isRealMessage && isExists && MessageManager.isOwnMessage(id);
}
