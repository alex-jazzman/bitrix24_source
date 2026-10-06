import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { GuestManager } from 'im.v2.lib.guest';
import { PermissionManager } from 'im.v2.lib.permission';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

export function isSharedLinkCopyAllowed(dialogId: string): boolean
{
	if (!FeatureManager.isFeatureAvailable(Feature.chatSharedLinkAvailable))
	{
		return false;
	}

	const { type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	if (isCollabChat(type) || type === ChatType.lines)
	{
		return false;
	}

	return PermissionManager.getInstance().canManageUsersAdd(dialogId);
}

export function isGuestLinkCopyAllowed(dialogId: string): boolean
{
	return GuestManager.getInstance().isGuestLinkAvailable(dialogId);
}

function isCollabChat(type: ChatTypeItem): boolean
{
	const isCollabV2 = FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);

	return !isCollabV2 && type === ChatType.collab;
}
