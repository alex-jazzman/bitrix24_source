import { ChatType, SidebarMainPanelBlock } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';
import { CollabManager } from 'im.v2.lib.collab';

import { SidebarPreset } from '../classes/preset';

const isCollab = (chatContext: ImModelChat) => chatContext.type === ChatType.collab;

const collabPreset = new SidebarPreset({
	blocks: [
		SidebarMainPanelBlock.chat,
		SidebarMainPanelBlock.info,
		SidebarMainPanelBlock.fileList,
		SidebarMainPanelBlock.fileUnsortedList,
		SidebarMainPanelBlock.collabHelpdesk,
	],
	getHeaderTitle: () => CollabManager.getSidebarHeaderText(),
});

export { isCollab, collabPreset };
