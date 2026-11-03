import { type AnalyticsOptions, sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import {
	AnalyticsCategory,
	AnalyticsTool,
	AnalyticsEvent,
	AnalyticsType,
	AnalyticsSection,
	AnalyticsSubSection,
	AnalyticsElement,
	AnalyticsStatus,
} from '../const';
import { getChatType } from '../helpers/get-chat-type';

type SendDataHandler = (data: AnalyticsOptions) => void;

export class TaskComments
{
	#sendData: SendDataHandler;

	constructor(sendDataHandler: SendDataHandler = sendData)
	{
		this.#sendData = sendDataHandler;
	}

	onOpenCard(dialogId: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		this.#sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chat,
			event: AnalyticsEvent.openTaskCard,
			c_section: AnalyticsSection.taskCommentsLayout,
			c_sub_section: AnalyticsSubSection.chatHeader,
			c_element: AnalyticsElement.taskButton,
			p1: `chatType_${chatType}`,
		});
	}

	onOpenCardFromMessage(dialogId: string)
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatType = getChatType(chat);

		this.#sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.chat,
			event: AnalyticsEvent.openTaskCard,
			c_section: AnalyticsSection.taskCommentsLayout,
			c_sub_section: AnalyticsSubSection.message,
			p1: `chatType_${chatType}`,
		});
	}

	onOpenSideCard(taskId: number): void
	{
		this.#sendSideCardEvent(taskId, AnalyticsEvent.openSideCard, AnalyticsElement.openButton);
	}

	onCloseSideCard(taskId: number): void
	{
		this.#sendSideCardEvent(taskId, AnalyticsEvent.closeSideCard, AnalyticsElement.closeButton);
	}

	#sendSideCardEvent(taskId: number, event: string, element: string): void
	{
		this.#sendData({
			tool: AnalyticsTool.tasks,
			category: AnalyticsCategory.taskOperations,
			event,
			type: AnalyticsType.chatTask,
			c_section: AnalyticsSection.chatTasks,
			c_sub_section: AnalyticsSubSection.chatTaskCard,
			c_element: element,
			status: Number.isInteger(taskId) && taskId > 0 ? AnalyticsStatus.success : AnalyticsStatus.error,
			p1: `taskId_${taskId}`,
		});
	}
}
