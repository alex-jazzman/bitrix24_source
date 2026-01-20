import { Core } from 'im.v2.application.core';

export const MessageManager = {
	isEditable(id: string | number): string
	{
		const isRealMessage = Core.getStore().getters['messages/isRealMessage'](id);
		const isExists = Core.getStore().getters['messages/isExists'](id);
		const isSticker = Core.getStore().getters['messages/stickers/isStickerMessage'](id);
		const isOwnMessage = this.isOwnMessage(id);
		if (!isRealMessage || !isExists || !isOwnMessage || isSticker)
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
};
