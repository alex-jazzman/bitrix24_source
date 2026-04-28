import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';
import { MessageManager } from 'im.v2.lib.message';
import { Utils } from 'im.v2.lib.utils';

import { type ImModelChat, type ImModelMessage, type ImModelRecentItem } from 'im.v2.model';

export const RecentManager = {
	getSortDate(dialogId: string): ?Date
	{
		const recentItem: ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem)
		{
			return null;
		}

		const { messageId, draft, lastActivityDate } = recentItem;

		const message: ImModelMessage = Core.getStore().getters['messages/getById'](messageId);
		const messageDate = message?.date;
		if (Type.isDate(draft.date) && draft.date > messageDate)
		{
			return draft.date;
		}

		if (this.needsBirthdayPlaceholder(dialogId))
		{
			return Utils.date.getStartOfTheDay();
		}

		const lastActivity = lastActivityDate;
		const shouldUseActivityDate = Type.isDate(lastActivity) && lastActivity > messageDate;
		if (ChannelManager.isChannel(dialogId) && shouldUseActivityDate)
		{
			return lastActivity;
		}

		return messageDate ?? lastActivity;
	},
	needToShowItem(item: ImModelRecentItem): boolean
	{
		if (item.isBirthdayPlaceholder && !isBirthdayOptionEnabled())
		{
			return false;
		}

		if (item.isFakeElement)
		{
			return needToShowFakeItem(item);
		}

		return true;
	},
	needsBirthdayPlaceholder(dialogId: string): boolean
	{
		if (!isBirthdayOptionEnabled())
		{
			return false;
		}

		const hasBirthday = Core.getStore().getters['users/hasBirthday'](dialogId);
		if (!hasBirthday)
		{
			return false;
		}

		return needsPlaceholder(dialogId);
	},
	needsVacationPlaceholder(dialogId: string): boolean
	{
		const hasVacation = Core.getStore().getters['users/hasVacation'](dialogId);
		if (!hasVacation)
		{
			return false;
		}

		return needsPlaceholder(dialogId);
	},
};

const isBirthdayOptionEnabled = (): boolean => {
	return Core.getStore().getters['application/settings/get'](Settings.recent.showBirthday);
};

const isInvitedOptionEnabled = (): boolean => {
	return Core.getStore().getters['application/settings/get'](Settings.recent.showInvited);
};

const needsPlaceholder = (dialogId: string): boolean => {
	const recentItem = Core.getStore().getters['recent/get'](dialogId);
	if (!recentItem)
	{
		return false;
	}

	const dialog: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
	if (!dialog || dialog.type !== ChatType.user)
	{
		return false;
	}

	const isSelfChat = Core.getStore().getters['chats/isSelfChat'](dialogId);
	if (isSelfChat)
	{
		return false;
	}

	const hasTodayMessage = MessageManager.isTodayMessage(recentItem.messageId);
	if (hasTodayMessage)
	{
		return false;
	}

	const chatCounter = Core.getStore().getters['counters/getCounterByChatId'](dialog.chatId);

	return chatCounter === 0;
};

const needToShowFakeItem = (item: ImModelRecentItem): boolean => {
	if (isInvitedOptionEnabled())
	{
		return true;
	}

	// we show fake invited users only if it is their birthday
	if (!isBirthdayOptionEnabled())
	{
		return false;
	}

	const isUser = Core.getStore().getters['chats/isUser'](item.dialogId);
	if (!isUser)
	{
		return false;
	}

	return Core.getStore().getters['users/hasBirthday'](item.dialogId);
};
