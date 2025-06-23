import { Core } from 'im.v2.application.core';
import { UserType, SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isBot = (chatContext: ImModelChat) => {
	const user = Core.getStore().getters['users/get'](chatContext.dialogId);

	return user?.type === UserType.bot;
};

const botConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.user,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
		SidebarMainPanelBlock.marketAppList,
	],
});

export { isBot, botConfig };
