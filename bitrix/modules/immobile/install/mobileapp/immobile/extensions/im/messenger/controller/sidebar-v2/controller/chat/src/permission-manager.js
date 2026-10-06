/**
 * @module im/messenger/controller/sidebar-v2/controller/chat/src/permission-manager
 */
jn.define('im/messenger/controller/sidebar-v2/controller/chat/src/permission-manager', (require, exports, module) => {
	const { ActionByUserType } = require('im/messenger/const');
	const { SidebarPermissionManager } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');

	class ChatSidebarPermissionManager extends SidebarPermissionManager
	{
		canCall()
		{
			return this.userPermission.canCall(this.dialogId);
		}

		canOpenProfile()
		{
			return this.userPermission.canPerformActionByUserType(ActionByUserType.openProfile)
				&& this.userPermission.canPerformActionByUserType(ActionByUserType.openProfile, Number(this.dialogId));
		}

		canOpenCalendar()
		{
			return this.userPermission.canPerformActionByUserType(ActionByUserType.openCalendar)
				&& this.userPermission.canPerformActionByUserType(ActionByUserType.openCalendar, Number(this.dialogId));
		}

		canAddParticipants()
		{
			return super.canAddParticipants()
				&& this.userPermission.canPerformActionByUserType(ActionByUserType.joinChat, Number(this.dialogId));
		}

		getCallForbiddenReason()
		{
			const currentContext = this.userPermission.canCall(this.dialogId, true);

			if (currentContext && currentContext.isLive === false)
			{
				return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CALL_ERROR_LIVE');
			}

			return null;
		}
	}

	module.exports = { ChatSidebarPermissionManager };
});
