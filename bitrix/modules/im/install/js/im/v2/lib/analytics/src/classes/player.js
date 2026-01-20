import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { AudioPlaybackRate, TranscriptionStatus } from 'im.v2.const';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool } from '../const';
import { getChatType } from '../helpers/get-chat-type';

import type { ImModelChat, ImModelFile } from 'im.v2.model';
import type { ExtendedChatType } from '../helpers/get-chat-type';

export class Player
{
	onViewTranscription(fileId: number, status: $Values<typeof TranscriptionStatus>): void
	{
		const file: ImModelFile = Core.getStore().getters['files/get'](fileId);
		const chatType = this.#getTypeByChatId(file.chatId);
		const category = this.#getCategoryByFileType(file);
		const normalizedStatus = status.toLowerCase();

		sendData({
			tool: AnalyticsTool.im,
			category,
			event: AnalyticsEvent.viewTranscription,
			status: normalizedStatus,
			p1: `chatType_${chatType}`,
		});
	}

	onPlay(fileId: number): void
	{
		const file: ImModelFile = Core.getStore().getters['files/get'](fileId);
		const chatType = this.#getTypeByChatId(file.chatId);
		const category = this.#getCategoryByFileType(file);

		sendData({
			tool: AnalyticsTool.im,
			category,
			event: AnalyticsEvent.play,
			p1: `chatType_${chatType}`,
		});
	}

	onPause(fileId: number): void
	{
		const file: ImModelFile = Core.getStore().getters['files/get'](fileId);
		const chatType = this.#getTypeByChatId(file.chatId);
		const category = this.#getCategoryByFileType(file);

		sendData({
			tool: AnalyticsTool.im,
			category,
			event: AnalyticsEvent.pause,
			p1: `chatType_${chatType}`,
		});
	}

	onChangeRate(chatId: number, rate: $Values<typeof AudioPlaybackRate>): void
	{
		const chatType = this.#getTypeByChatId(chatId);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.audioMessage,
			event: AnalyticsEvent.changeSpeed,
			p1: `chatType_${chatType}`,
			p2: `speed_${rate}`,
		});
	}

	#getTypeByChatId(chatId: number): ExtendedChatType
	{
		const chat: ImModelChat = Core.getStore().getters['chats/getByChatId'](chatId);

		return getChatType(chat);
	}

	#getCategoryByFileType(file: ImModelFile): $Values<typeof AnalyticsCategory>
	{
		if (file.isVideoNote)
		{
			return AnalyticsCategory.videoMessage;
		}

		return AnalyticsCategory.audioMessage;
	}
}
