import { Core } from 'im.v2.application.core';
import { ActionByRole, ChatType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { FeatureManager, Feature } from 'im.v2.lib.feature';

import type { ImModelChat } from 'im.v2.model';

export function isSharedLinkCopyAllowed(dialogId: string): boolean
{
	if (!FeatureManager.isFeatureAvailable(Feature.chatSharedLinkAvailable))
	{
		return false;
	}

	const { type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

	if (type === ChatType.collab || type === ChatType.lines)
	{
		return false;
	}

	const permissionManager = PermissionManager.getInstance();

	return permissionManager.canPerformActionByRole(ActionByRole.extend, dialogId);
}
