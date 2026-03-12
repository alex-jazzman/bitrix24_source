import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsTool, AnalyticsType } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';

export class FormatToolbar
{
	onCodeClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatCode);
	}

	onLinkClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatLink);
	}

	onStrikethroughClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatStrikethrough);
	}

	onUnderlineClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatUnderline);
	}

	onItalicClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatItalic);
	}

	onBoldClick(dialogId: string)
	{
		this.#sendData(dialogId, AnalyticsType.formatBold);
	}

	#sendData(dialogId: string, type: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		const chatType = getChatType(chat);

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(chatType),
			event: AnalyticsEvent.useFormatToolbar,
			p1: `chatType_${chatType}`,
			type,
		});
	}
}
