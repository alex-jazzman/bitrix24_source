import { sendData } from 'ui.analytics';

import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';

import { AnalyticsCategory, AnalyticsEvent, AnalyticsTool, CreateChatContext, PROJECT_CHAT_TYPE } from '../const';
import { getCategoryByChatType } from '../helpers/get-category-by-chat-type';
import { getFolderSection } from '../helpers/get-folder-section';
import { getLayoutName } from '../helpers/get-layout-name';
import { getUserType } from '../helpers/get-user-type';

export class ChatCreate
{
	onStartClick(type: ChatTypeItem): void
	{
		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);
		const resolvedType = type === ChatType.collab ? PROJECT_CHAT_TYPE : type;

		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(type),
			event: AnalyticsEvent.clickCreateNew,
			type: resolvedType,
			c_section: getFolderSection(currentLayout),
			p2: getUserType(),
		});
	}

	onProjectEmptyStateCreateClick(): void
	{
		sendData({
			tool: AnalyticsTool.im,
			category: getCategoryByChatType(ChatType.collab),
			event: AnalyticsEvent.clickCreateNew,
			type: PROJECT_CHAT_TYPE,
			c_section: CreateChatContext.projectEmptyState,
			p2: getUserType(),
		});
	}

	onMenuCreateClick(): void
	{
		const currentLayout = getLayoutName(Core.getStore().getters['application/getLayout'].name);

		sendData({
			tool: AnalyticsTool.im,
			category: AnalyticsCategory.messenger,
			event: AnalyticsEvent.openCreateMenu,
			c_section: getFolderSection(currentLayout),
		});
	}
}
