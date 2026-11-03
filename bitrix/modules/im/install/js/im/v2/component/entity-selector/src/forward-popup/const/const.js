import { Messenger } from 'im.public';

import { ChatType } from 'im.v2.const';

export const ForwardChatOpeners: { [string]: (dialogId: string) => Promise } = {
	[ChatType.taskComments]: (dialogId) => Messenger.openTaskComments(dialogId),
	[ChatType.collab]: (dialogId) => Messenger.openCollab(dialogId),
	[ChatType.openChannel]: (dialogId) => Messenger.openChannel(dialogId),
	[ChatType.generalChannel]: (dialogId) => Messenger.openChannel(dialogId),
	[ChatType.copilot]: (dialogId) => Messenger.openCopilot(dialogId),
	default: (dialogId) => Messenger.openChat(dialogId),
};
