import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool, AnalyticsType } from '../const';
import { getChatType, type ExtendedChatType } from '../helpers/get-chat-type';

type SendDataHandler = (data: AnalyticsOptions) => void;

type RecordSentParams = {
	dialogId: string,
	durationSeconds: number,
	isLocked: boolean,
};

/**
 * The recording of a voice message. A record that reached the chat is counted once, and the mode it
 * was made in travels with it: the locked recording is the gesture the mobile application has not.
 */
export class VoiceRecorder
{
	#sendData: SendDataHandler;

	constructor(sendDataHandler: SendDataHandler = sendData)
	{
		this.#sendData = sendDataHandler;
	}

	onRecordSent({ dialogId, durationSeconds, isLocked }: RecordSentParams): void
	{
		this.#sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.audioMessage,
			event: AnalyticsEvent.record,
			type: isLocked ? AnalyticsType.lockedRecord : AnalyticsType.quickRecord,
			p1: `chatType_${this.#getChatType(dialogId)}`,
			p3: `recordLength_${durationSeconds}`,
		});
	}

	// a chat the store does not hold answers with a blank one instead of throwing: counting an event
	// must not be able to break the recording it is counting
	#getChatType(dialogId: string): ExtendedChatType
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		return getChatType(chat);
	}
}
