import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool } from '../const';
import { getChatType } from '../helpers/get-chat-type';

export class Guest
{
	onShowGuestNamePopup(dialogId: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.viewJoinPopup,
			p1: `chatType_${chatType}`,
		});
	}

	onCopyGuestInviteLink(dialogId: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.copyGuestLink,
			p1: `chatType_${chatType}`,
		});
	}
}
