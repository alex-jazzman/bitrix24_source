/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/src/permission-manager
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/src/permission-manager', (require, exports, module) => {
	const { SidebarPermissionManager } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { Feature } = require('im/messenger/lib/feature');

	class CollabSidebarPermissionManager extends SidebarPermissionManager
	{
		canEdit()
		{
			return this.chatPermission.canUpdateDialogByRole(this.dialogId);
		}

		canLeave()
		{
			return this.userPermission.canLeaveFromCollab(this.userId)
				&& this.chatPermission.canLeaveFromChat(this.dialogId);
		}

		canDelete()
		{
			if (Feature.isNestedChatAvailable)
			{
				return false;
			}

			return super.canDelete();
		}
	}

	module.exports = { CollabSidebarPermissionManager };
});
