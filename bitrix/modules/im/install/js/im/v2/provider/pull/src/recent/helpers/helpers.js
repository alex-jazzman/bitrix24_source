import { Core } from 'im.v2.application.core';

import type { ImModelRecentItem } from 'im.v2.model';
import type { MessageAddParams } from 'im.v2.provider.pull';

export function buildRecentItem(params: MessageAddParams): ImModelRecentItem
{
	const newRecentItem = {
		id: params.dialogId,
		chatId: params.chatId,
		messageId: params.message.id,
	};

	const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](params.dialogId);
	if (recentItem)
	{
		newRecentItem.isFakeElement = false;
		newRecentItem.isBirthdayPlaceholder = false;
		newRecentItem.liked = false;
	}

	return newRecentItem;
}
