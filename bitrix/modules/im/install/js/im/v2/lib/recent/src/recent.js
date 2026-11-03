import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings, RecentType, type RecentTypeItem } from 'im.v2.const';
import { MessageManager } from 'im.v2.lib.message';
import { Utils } from 'im.v2.lib.utils';

import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';

export const RecentManager = {
	getSortDate(dialogId: string): ?Date
	{
		const recentItem: ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem)
		{
			return null;
		}

		const { messageId, lastActivityDate } = recentItem;
		const messageDate = Core.getStore().getters['messages/getById'](messageId)?.date;

		const fakeActivityDate = getFakeActivityDate(recentItem, messageDate);
		if (fakeActivityDate)
		{
			return fakeActivityDate;
		}

		const shouldUseActivityDate = Type.isDate(lastActivityDate) && lastActivityDate > messageDate;
		if (shouldUseActivityDate)
		{
			return lastActivityDate;
		}

		return messageDate ?? lastActivityDate;
	},
	// The row is high in the list, but nothing behind it moved on the server side.
	hasFakeActivityDate(dialogId: string): boolean
	{
		const recentItem: ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem)
		{
			return false;
		}

		const messageDate = Core.getStore().getters['messages/getById'](recentItem.messageId)?.date;

		return getFakeActivityDate(recentItem, messageDate) !== null;
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
	// recent type includes not only root elements (parentChatId = 0) but children elements too (parentChatId > 0)
	isTypeWithNestedChats(type: RecentTypeItem): boolean
	{
		const RECENT_TYPES_WITH_NESTED_CHATS = [RecentType.taskComments];

		return RECENT_TYPES_WITH_NESTED_CHATS.includes(type);
	},
};

// Client-side rules that raise a row: an unsent draft and the birthday placeholder.
// Not to be confused with isFakeElement - that one marks the whole row, not its date.
const getFakeActivityDate = (recentItem: ImModelRecentItem, messageDate: ?Date): ?Date => {
	const { draft, dialogId } = recentItem;

	if (Type.isDate(draft.date) && draft.date > messageDate)
	{
		return draft.date;
	}

	if (RecentManager.needsBirthdayPlaceholder(dialogId))
	{
		return Utils.date.getStartOfTheDay();
	}

	return null;
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
