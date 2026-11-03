import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { AnalyticsEvent, AnalyticsSection, AnalyticsSubSection, AnalyticsTool } from '../const';
import { getCategoryByChat } from '../helpers/get-category-by-chat-type';
import { getChatType } from '../helpers/get-chat-type';
import { getUserType } from '../helpers/get-user-type.js';

// The panel of bulk actions over selected messages. It shares `click_create_ai_task` with the
// message context menu (`MessageContextMenu.onCreateAiTask`) and differs from it by c_sub_section
// alone, so the two entry points stay comparable row by row. The panel has no menu levels, so it
// reports no c_element.
export class BulkActionsPanel
{
	onCreateAiTask(dialogId: string): void
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChat(chat),
			event: AnalyticsEvent.clickCreateAiTask,
			c_section: AnalyticsSection.chatWindow,
			c_sub_section: AnalyticsSubSection.multiselectPanel,
			p1: `chatType_${getChatType(chat)}`,
			p2: getUserType(),
		});
	}
}
