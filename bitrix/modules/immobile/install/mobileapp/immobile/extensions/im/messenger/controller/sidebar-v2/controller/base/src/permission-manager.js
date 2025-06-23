/**
 * @module im/messenger/controller/sidebar-v2/controller/base/src/permission-manager
 */
jn.define('im/messenger/controller/sidebar-v2/controller/base/src/permission-manager', (require, exports, module) => {
	const { ChatPermission, UserPermission } = require('im/messenger/lib/permission-manager');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');

	class SidebarPermissionManager
	{
		constructor({ dialogId, dialogHelper })
		{
			this.dialogId = dialogId;
			this.dialogHelper = dialogHelper;
			this.chatPermission = ChatPermission;
			this.userPermission = UserPermission;
			this.userId = serviceLocator.get('core').getUserId();
		}

		canPin()
		{
			return false; // todo enable when pin service will be ready
		}

		canCall()
		{
			return this.chatPermission.isCanCall(this.dialogId);
		}

		canEdit()
		{
			return Feature.isChatComposerSupported && this.chatPermission.isCanEditDialog(this.dialogId);
		}

		canLeave()
		{
			return this.chatPermission.isCanLeaveFromChat(this.dialogId);
		}

		canDelete()
		{
			return this.dialogHelper.canBeDeleted;
		}

		canCopyLink()
		{
			return this.dialogHelper.canCopyChatLink;
		}

		canRemoveUserById(userId, dialogData)
		{
			return ChatPermission.isCanRemoveUserById(userId, dialogData);
		}

		canRemoveParticipants()
		{
			return ChatPermission.isCanRemoveParticipants(this.dialogId);
		}

		canMention()
		{
			return ChatPermission.isCanMention(this.dialogId);
		}

		canAddParticipants()
		{
			return this.chatPermission.isCanAddParticipants(this.dialogId);
		}

		/**
		 * @return {string|null}
		 */
		getCallForbiddenReason()
		{
			const currentContext = this.chatPermission.isCanCall(this.dialogId, true);

			if (currentContext)
			{
				if (currentContext.isMoreOne === false)
				{
					return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CALL_ERROR_MOREONE');
				}

				if (currentContext.isLimit === true)
				{
					return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CALL_ERROR_LIMIT');
				}
			}

			return null;
		}
	}

	module.exports = { SidebarPermissionManager };
});
