/**
 * @module im/messenger/controller/sidebar-v2/user-actions/attach-chat
 */
jn.define('im/messenger/controller/sidebar-v2/user-actions/attach-chat', (require, exports, module) => {
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { Icon } = require('assets/icons');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogActionType } = require('im/messenger/const');
	const { runAttachFlow, runDetachFlow } = require('im/messenger/controller/attach-chat/flow');
	const {
		SidebarContextMenuActionId,
		SidebarContextMenuActionPosition,
		SIDEBAR_DEFAULT_TOAST_OFFSET,
	} = require('im/messenger/controller/sidebar-v2/const');

	/**
	 * Returns either the "Attach to project" or "Detach from project" menu item for the chat's
	 * sidebar context menu. The two items are mutually exclusive: parentChatId decides which one
	 * is shown. Visibility is gated by the backend permissions AttachToParent / DetachFromParent:
	 * attach requires ROLE_OWNER on a regular group chat and is ROLE_NONE on open chats and other
	 * non-eligible types, so an open chat never exposes the attach item. Detach is gated by its own
	 * backend permission independently.
	 *
	 * @param {DialoguesModelState} dialog
	 * @param {object|null} [widget] - sidebar widget used as toast anchor; does not affect confirm-widget presentation
	 * @return {?SidebarContextMenuItem}
	 */
	function getAttachChatMenuItem(dialog, widget = null)
	{
		if (!Feature.isAttachChatToProjectAvailable)
		{
			return null;
		}

		if (!dialog)
		{
			return null;
		}

		const parentChatId = Number(dialog.parentChatId ?? dialog.parent_chat_id ?? 0);

		if (parentChatId === 0)
		{
			if (!ChatPermission.canPerformActionByRole(DialogActionType.attachToParent, dialog))
			{
				return null;
			}

			return {
				id: SidebarContextMenuActionId.ATTACH_TO_PROJECT,
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_ATTACH_TO_PROJECT'),
				icon: Icon.GO_TO_MESSAGE,
				testId: 'sidebar-context-menu-attach-to-project',
				sort: SidebarContextMenuActionPosition.MIDDLE,
				onItemSelected: () => runAttachFlow({ dialog, parentWidget: PageManager, toastAnchor: widget, toastOffset: SIDEBAR_DEFAULT_TOAST_OFFSET }),
			};
		}

		if (!ChatPermission.canPerformActionByRole(DialogActionType.detachFromParent, dialog))
		{
			return null;
		}

		return {
			id: SidebarContextMenuActionId.DETACH_FROM_PROJECT,
			title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_DETACH_FROM_PROJECT'),
			icon: Icon.GO_TO_MESSAGE,
			testId: 'sidebar-context-menu-detach-from-project',
			sort: SidebarContextMenuActionPosition.MIDDLE,
			onItemSelected: () => runDetachFlow({ dialog, parentWidget: PageManager, toastAnchor: widget, toastOffset: SIDEBAR_DEFAULT_TOAST_OFFSET }),
		};
	}

	module.exports = {
		getAttachChatMenuItem,
	};
});
