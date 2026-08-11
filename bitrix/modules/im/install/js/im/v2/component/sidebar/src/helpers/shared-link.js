import { Core } from 'im.v2.application.core';
import { ActionByRole, ActionByUserType, ChatType } from 'im.v2.const';
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

	const { parentChatId, type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	if (parentChatId > 0)
	{
		return false;
	}

	if (type === ChatType.collab || type === ChatType.lines)
	{
		return false;
	}

	const permissionManager = PermissionManager.getInstance();

	const canPerformActionByRole = permissionManager.canPerformActionByRole(ActionByRole.extend, dialogId);
	const canPerformActionByUserType = permissionManager.canPerformActionByUserType(ActionByUserType.extend);

	return canPerformActionByRole && canPerformActionByUserType;
}

export function isGuestLinkCopyAllowed(dialogId: string): boolean
{
	return GuestManager.getInstance().isGuestLinkAvailable(dialogId);
}
