/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/src/permission-manager
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/src/permission-manager', (require, exports, module) => {
	const { SidebarPermissionManager } = require('im/messenger/controller/sidebar-v2/controller/base');

	class CollabSidebarPermissionManager extends SidebarPermissionManager
	{
		canEdit()
		{
			return this.chatPermission.iaCanUpdateDialogByRole(this.dialogId);
		}

		canLeave()
		{
			return this.userPermission.canLeaveFromCollab(this.userId)
				&& this.chatPermission.isCanLeaveFromChat(this.dialogId);
		}
	}

	module.exports = { CollabSidebarPermissionManager };
});
