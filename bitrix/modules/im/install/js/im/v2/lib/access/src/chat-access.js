import { Core } from 'im.v2.application.core';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelChat } from 'im.v2.model';
import { ChatType } from 'im.v2.const';

import { AccessService } from './classes/access-service';
import { ParentAccessPopup } from './classes/parent-access-popup';

export const ChatAccessManager = {
	canAddUsers(dialogId: string, userIds: string[]): Promise<boolean>
	{
		const parentChat: ImModelChat = Core.getStore().getters['chats/getParent'](dialogId);
		if (!parentChat || !addsMembersToParent(dialogId))
		{
			return true;
		}

		return this.canAddUsersToParent(parentChat.dialogId, userIds);
	},

	async canAddUsersToParent(parentDialogId: string, userIds: string[]): Promise<boolean>
	{
		try
		{
			const everyoneHasParentAccess = await AccessService.checkChatAccessByUserIds(parentDialogId, userIds);
			if (!everyoneHasParentAccess)
			{
				return this.askForParentAccess();
			}

			return true;
		}
		catch
		{
			Notifier.onDefaultError();

			return false;
		}
	},

	askForParentAccess(): Promise<boolean>
	{
		let promiseResolver = null;
		const promise = new Promise((resolve) => {
			promiseResolver = resolve;
		});

		const parentAccessPopup = new ParentAccessPopup();
		parentAccessPopup.subscribeOnce(ParentAccessPopup.events.onConfirm, () => promiseResolver(true));
		parentAccessPopup.subscribeOnce(ParentAccessPopup.events.onCancel, () => promiseResolver(false));

		parentAccessPopup.show();

		return promise;
	},
};

const addsMembersToParent = (dialogId: string): boolean => {
	const TYPES_ADDING_MEMBERS_TO_PARENT = new Set([ChatType.chat, ChatType.copilot]);

	const { type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	return TYPES_ADDING_MEMBERS_TO_PARENT.has(type);
};
