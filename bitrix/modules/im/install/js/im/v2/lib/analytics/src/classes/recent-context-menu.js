import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';

import { AnalyticsEvent, AnalyticsSubSection, AnalyticsTool, AnalyticsCategory } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat } from 'im.v2.model';
import type { ExtendedChatType } from '../helpers/get-chat-type';

export class RecentContextMenu
{
	onUnread(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.seeLater,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onPin(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.pinChat,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onUnpin(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.unpinChat,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onOpenProfile(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.openProfile,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onFindChatsWithUser(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.findCommonChats,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onMute(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.mute,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onUnmute(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.unmute,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onHide(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.hideChat,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onRead(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.readAll,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
			p1: `chatType_${this.#getChatType(dialogId)}`,
		};

		sendData(params);
	}

	onLeave(dialogId: string): void
	{
		const params = {
			event: AnalyticsEvent.leave,
			tool: AnalyticsTool.im,
			category: this.#getChatCategory(dialogId),
			c_section: `${this.#getLayout()}_tab`,
			c_sub_section: AnalyticsSubSection.recentContextMenu,
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

	#getLayout(): string
	{
		return Core.getStore().getters['application/getLayout'].name;
	}
}
