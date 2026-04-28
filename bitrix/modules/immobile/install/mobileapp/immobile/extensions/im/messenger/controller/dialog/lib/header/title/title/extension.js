/**
 * @module im/messenger/controller/dialog/lib/header/title/title
 */
jn.define('im/messenger/controller/dialog/lib/header/title/title', (require, exports, module) => {
	const { DialogType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UserUtils } = require('im/messenger/lib/utils');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const {
		DialogHelper,
		UserHelper,
	} = require('im/messenger/lib/helper');
	const { applyAppStatusToTitleParams } = require('im/messenger/controller/dialog/lib/header/title/status');

	/**
	 * @class HeaderTitle
	 * @implements IDialogHeaderTitle
	 */
	class HeaderTitle
	{
		/**
		 * @param {() => DialoguesModelState} getDialog
		 * @param {RelatedEntityData} relatedEntity
		 */
		constructor({ getDialog, relatedEntity })
		{
			/**
			 * @protected
			 * @type {() => DialoguesModelState} */
			this.getDialog = getDialog;

			/**
			 * @protected
			 * @type {RelatedEntityData}
			 * */
			this.relatedEntity = relatedEntity;
		}

		/**
		 * @return JNWidgetTitleParams
		 */
		createTitleParams()
		{
			const dialogId = this.getDialog()?.dialogId;

			if (!dialogId)
			{
				return {};
			}

			const avatar = ChatAvatar.createFromDialogId(dialogId);
			const title = ChatTitle.createFromDialogId(dialogId);
			const result = {
				...avatar.getTitleParams(),
				...title.getTitleParams({
					useNotes: true,
				}),
			};

			if (avatar.type !== DialogType.comment)
			{
				result.avatar = avatar.getDialogHeaderAvatarProps();
			}

			if (UserHelper.isCurrentUser(dialogId))
			{
				// now CoPilot can write to notes chat
				return result;
			}

			if (DialogHelper.isChatId(dialogId) && !result.hasInputActions)
			{
				const userData = serviceLocator.get('core').getStore().getters['usersModel/getById'](dialogId);
				if (userData?.status)
				{
					result.detailText = (new UserUtils()).getLastDateText(userData);
				}
			}

			applyAppStatusToTitleParams(result);

			return result;
		}
	}

	module.exports = {
		HeaderTitle,
	};
});
