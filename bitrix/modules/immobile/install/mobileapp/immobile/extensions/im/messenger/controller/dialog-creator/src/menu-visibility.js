/**
 * @module im/messenger/controller/dialog-creator/menu-visibility
 */
jn.define('im/messenger/controller/dialog-creator/menu-visibility', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { ActionByUserType } = require('im/messenger/const');

	const MenuVisibility = {
		canCreateChat: () => UserPermission.canPerformActionByUserType(ActionByUserType.createChat),
		canCreateCopilot: () => Feature.isCopilotEnabled && UserPermission.canPerformActionByUserType(ActionByUserType.createCopilot),
		canCreateChannel: () => UserPermission.canPerformActionByUserType(ActionByUserType.createChannel),
		canCreateCollab: () => Feature.isCollabAvailable
			&& Feature.isCollabCreationAvailable
			&& UserPermission.canPerformActionByUserType(ActionByUserType.createCollab),
		canCreateFolder: () => Feature.isChatFoldersAvailable,
		showInviteBanner: () => Feature.isIntranetInvitationAvailable,
	};

	function getVisibleMenuItemsCount()
	{
		return Object.values(MenuVisibility)
			.filter((isVisible) => isVisible())
			.length;
	}

	module.exports = { MenuVisibility, getVisibleMenuItemsCount };
});
