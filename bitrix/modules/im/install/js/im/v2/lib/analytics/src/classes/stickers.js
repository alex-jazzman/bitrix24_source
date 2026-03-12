import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsSection, AnalyticsTool, AnalyticsType, AnalyticsCategory } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';
import type { ExtendedChatType } from '../helpers/get-chat-type';

export class Stickers
{
	onOpenEmoteSelector(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.openEmoteSelector,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onOpenStickerTab(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.openStickerTab,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onViewPromoPopup(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.viewStickerPopup,
			type: AnalyticsType.stickers,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onShowCreateForm(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.clickCreateStickerPack,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onLinkPackFromPopup(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.addStickerPack,
			c_section: AnalyticsSection.stickerPackPopup,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	#getChatCategory(dialogId: string): $Values<typeof AnalyticsCategory>
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getCategoryByChatType(chat.type);
	}

	#getChatType(dialogId: string): ExtendedChatType
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		return getChatType(chat);
	}
}
