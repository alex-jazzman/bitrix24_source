import { EntityTypes } from 'humanresources.company-structure.utils';
import { Loc } from 'main.core';
import type { TabOptions } from 'ui.entity-selector';

export const getChatDialogEntity = function(): Object {
	return {
		id: 'im-chat-only',
		dynamicLoad: true,
		dynamicSearch: true,
		filters: [
			{
				id: 'im.chatOnlyDataFilter',
				options: {
					includeSubtitle: true,
				},
			},
		],
		tagOptions: {
			default: {
				textColor: '#11A9D9',
				bgColor: '#D3F4FF',
				avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-chat-tag.svg',
			},
		},
		itemOptions: {
			default: {
				avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-chat-item.svg',
			},
		},
		options: {
			searchChatTypes: ['O', 'C'],
		},
	};
};

export const getChannelDialogEntity = function(): Object {
	return {
		id: 'im-chat-only',
		filters: [
			{
				id: 'im.chatOnlyDataFilter',
				options: {
					includeSubtitle: true,
				},
			},
		],
		dynamicLoad: true,
		dynamicSearch: true,
		tagOptions: {
			default: {
				textColor: '#8DBB00',
				bgColor: '#EAF6C3',
				avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-channel-tag.svg',
				avatarOptions: {
					borderRadius: '50%',
				},
			},
		},
		itemOptions: {
			default: {
				avatar: '/bitrix/js/humanresources/company-structure/structure-components/src/images/selectors/bind-chat-channel-item.svg',
				avatarOptions: {
					borderRadius: '6px',
				},
			},
		},
		options: {
			searchChatTypes: ['N', 'J'],
		},
	};
};

export const ChatTypeDict: Record<string, string> = Object.freeze({
	chat: 'chat',
	channel: 'channel',
});

export const getChatRecentTabOptions = function(
	entityType: string,
	chatType: ChatTypeDict.chat | ChatTypeDict.channel,
): TabOptions {
	let title = '';

	if (chatType === ChatTypeDict.chat)
	{
		title = entityType === EntityTypes.team
			? Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHAT_TEAM_STUB_TITLE')
			: Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHAT_DEPARTMENT_STUB_TITLE');
	}
	else
	{
		title = entityType === EntityTypes.team
			? Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHANNEL_TEAM_STUB_TITLE')
			: Loc.getMessage('HUMANRESOURCES_STRUCTURE_COMPONENTS_CHANNEL_DEPARTMENT_STUB_TITLE');
	}

	return {
		visible: false,
		stub: true,
		stubOptions: {
			title,
		},
	};
};
