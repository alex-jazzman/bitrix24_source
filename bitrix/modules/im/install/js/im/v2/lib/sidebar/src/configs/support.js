import { Core } from 'im.v2.application.core';
import { SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isSupport = (chatContext: ImModelChat) => Core.getStore().getters['sidebar/multidialog/isSupport'](chatContext.dialogId);

const supportConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.support,
		SidebarMainPanelBlock.tariffLimit,
		SidebarMainPanelBlock.multidialog,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
	],
});

export { isSupport, supportConfig };
