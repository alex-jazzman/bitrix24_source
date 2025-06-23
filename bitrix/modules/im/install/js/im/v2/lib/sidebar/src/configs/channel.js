import { Loc } from 'main.core';

import { ChannelManager } from 'im.v2.lib.channel';
import { SidebarMainPanelBlock } from 'im.v2.const';

import { SidebarConfig } from '../classes/config';

import type { ImModelChat } from 'im.v2.model';

const isChannel = (chatContext: ImModelChat) => ChannelManager.isChannel(chatContext.dialogId);

const channelConfig = new SidebarConfig({
	blocks: [
		SidebarMainPanelBlock.chat,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
	],
	headerTitle: Loc.getMessage('IM_SIDEBAR_CHANNEL_HEADER_TITLE'),
});

export { isChannel, channelConfig };
