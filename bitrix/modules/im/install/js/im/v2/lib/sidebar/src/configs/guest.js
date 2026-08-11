import { Core } from 'im.v2.application.core';
import { SidebarMainPanelBlock } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { SidebarPreset } from '../classes/preset';

const isGuest = (chatContext: ImModelChat) => {
	return Core.getStore().getters['users/isGuest'](chatContext.dialogId);
};

const guestPreset = new SidebarPreset({
	blocks: [
		SidebarMainPanelBlock.user,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
	],
});

export { isGuest, guestPreset };
