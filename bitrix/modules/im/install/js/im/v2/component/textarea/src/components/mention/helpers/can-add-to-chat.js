import { Core } from 'im.v2.application.core';
import { ActionByRole, ActionByUserType, ChatType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelChat } from 'im.v2.model';

export function canAddToChat(dialogId: string, userId: number | string): boolean
{
	const isCurrentUserGuest = Core.getStore().getters['users/isGuest'](Core.getUserId());
	const isGuestItem = Core.getStore().getters['users/isGuest'](userId);

	if (isCurrentUserGuest || isGuestItem)
	{
		return false;
	}

	const permissionManager = PermissionManager.getInstance();

	const { type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

	if (type === ChatType.user && !permissionManager.canPerformActionByUserType(ActionByUserType.createChat))
	{
		return false;
	}

	return permissionManager.canPerformActionByRole(ActionByRole.extend, dialogId);
}
