import { Core } from 'im.v2.application.core';
import { Notifier } from 'im.v2.lib.notifier';
import { type ImModelChat } from 'im.v2.model';
import { ChatType } from 'im.v2.const';

import { AccessService } from './classes/access-service';
import { ParentAccessPopup } from './classes/parent-access-popup';

export const ChatAccessManager = {
	/**
	 * The whole selection weighed against the parent chat. People are weighed by their access to it;
	 * a node of the org structure has no such list of its own - the server resolves who stands behind
	 * the node and mirrors the link onto the parent chat itself, so the node is asked about as a
	 * whole. The mobile window asks the same way (ProjectAccessGuard.canAddEntitiesToProjectChildChat).
	 */
	canAddSelection(dialogId: string, userIds: string[], structureNodes: Array<mixed>): Promise<boolean>
	{
		const parentChat: ImModelChat = Core.getStore().getters['chats/getParent'](dialogId);
		if (!parentChat || !addsMembersToParent(dialogId))
		{
			return true;
		}

		if (structureNodes.length > 0)
		{
			return this.askForParentAccess();
		}

		return this.canAddUsersToParent(parentChat.dialogId, userIds);
	},

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
