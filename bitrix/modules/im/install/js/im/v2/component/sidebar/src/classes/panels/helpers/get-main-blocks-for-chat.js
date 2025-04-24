import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

import { MainPanels, MainPanelType } from '../../panel-config';

export function getMainBlocksForChat(dialogId: string): string[]
{
	const panelType = getMainPanelType(dialogId);

	return Object.entries(MainPanels[panelType])
		.sort(([, order1], [, order2]) => order1 - order2)
		.map(([block]) => block);
}

function getMainPanelType(dialogId: string): $Keys<typeof MainPanelType>
{
	if (isSupportChat(dialogId))
	{
		return MainPanelType.support24Question;
	}

	const chatType = getChatType(dialogId);

	if (chatType === ChatType.user && Number.parseInt(dialogId, 10) === Core.getUserId())
	{
		return MainPanelType.notes;
	}

	return MainPanelType[chatType] ?? MainPanelType.chat;
}

const isSupportChat = (dialogId: string): boolean => {
	return Core.getStore().getters['sidebar/multidialog/isSupport'](dialogId);
};

const getChatType = (dialogId: string): $Keys<typeof ChatType> => {
	return Core.getStore().getters['chats/get'](dialogId, true).type;
};
