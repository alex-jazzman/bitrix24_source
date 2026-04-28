import { Text, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';

import type { JsonObject } from 'main.core';

export const prepareManagerList = (managerList: number[] | string[]): number[] => {
	const result = [];

	managerList.forEach((rawUserId) => {
		const userId = Number.parseInt(rawUserId, 10);
		if (userId > 0)
		{
			result.push(userId);
		}
	});

	return result;
};

export const prepareChatName = (chatName: string | number): string => {
	return Text.decode(chatName.toString());
};

export const prepareAvatar = (avatar: string): string => {
	let result = '';

	if (!avatar || avatar.endsWith('/js/im/images/blank.gif'))
	{
		result = '';
	}
	else if (avatar.startsWith('http'))
	{
		result = avatar;
	}
	else
	{
		result = Core.getHost() + avatar;
	}

	if (result)
	{
		result = encodeURI(result);
	}

	return result;
};

export const prepareMuteStatus = (muteList: number[] | Record<userId, boolean>): boolean => {
	if (Type.isArray(muteList))
	{
		return muteList.includes(Core.getUserId());
	}

	if (Type.isPlainObject(muteList))
	{
		const currentUserEntry = muteList[Core.getUserId()];

		return currentUserEntry === true;
	}

	return false;
};

type LastMessageViews = { countOfViewers: number, firstViewers: Object[], messageId: number };
export const prepareLastMessageViews = (rawLastMessageViews: JsonObject): LastMessageViews => {
	const {
		countOfViewers,
		firstViewers: rawFirstViewers = [],
		messageId,
	} = rawLastMessageViews;

	let firstViewer = null;
	for (const rawFirstViewer of rawFirstViewers)
	{
		if (rawFirstViewer.userId === Core.getUserId())
		{
			continue;
		}

		firstViewer = {
			userId: rawFirstViewer.userId,
			userName: rawFirstViewer.userName,
			date: Utils.date.cast(rawFirstViewer.date),
		};
		break;
	}

	if (countOfViewers > 0 && !firstViewer)
	{
		throw new Error('Chats model: no first viewer for message');
	}

	return {
		countOfViewers,
		firstViewer,
		messageId,
	};
};
