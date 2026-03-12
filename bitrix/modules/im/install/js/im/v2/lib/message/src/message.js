import { Core } from 'im.v2.application.core';
import { MessageComponent } from 'im.v2.const';

export const MessageManager = {
	isEditable(id: string | number): string
	{
		const isRealMessage = Core.getStore().getters['messages/isRealMessage'](id);
		const isExists = Core.getStore().getters['messages/isExists'](id);
		const isSticker = Core.getStore().getters['stickers/messages/isSticker'](id);
		const isOwnMessage = this.isOwnMessage(id);
		const isCheckIn = this.isCheckInMessage(id);

		if (!isRealMessage || !isExists || !isOwnMessage || isSticker || isCheckIn)
		{
			return false;
		}

		const isForward = Core.getStore().getters['messages/isForward'](id);
		const isVideoNote = Core.getStore().getters['messages/isVideoNote'](id);

		return !isForward && !isVideoNote;
	},
	isOwnMessage(id: number | string): boolean
	{
		const message = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		return message.authorId === Core.getUserId();
	},
	isCheckInMessage(id: number | string): boolean
	{
		const message = Core.getStore().getters['messages/getById'](id);
		if (!message)
		{
			return false;
		}

		return message.componentId === MessageComponent.checkIn;
	},
};
