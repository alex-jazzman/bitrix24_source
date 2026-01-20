/**
 * @module im/messenger/lib/integration/tasksmobile/comments/header/buttons
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/header/buttons', (require, exports, module) => {
	const { Type } = require('type');
	const { inAppUrl } = require('in-app-url');
	const { isOnline } = require('device/connection');
	const { DialogHeaderButtons } = require('im/messenger/api/dialog-integration/header/buttons');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const {
		CallAudioButton,
	} = require('im/messenger/controller/dialog/lib/header/buttons/buttons/button-configuration');
	const { CallManager } = require('im/messenger/lib/integration/callmobile/call-manager');
	const { Feature } = require('im/messenger/lib/feature');
	const { Icon } = require('assets/icons');

	/** @type DialogHeaderButton */
	const OpenTaskButton = {
		id: 'open_task',
		testId: 'dialog-header-button-open-task',
		type: Icon.CIRCLE_CHECK.getIconName(),
		color: null,
	};

	/**
	 * @class CommentsHeaderButtons
	 */
	class CommentsHeaderButtons extends DialogHeaderButtons
	{
		/**
		 * @param {() => DialoguesModelState} getDialog
		 * @param {RelatedEntityData} relatedEntity
		 */
		constructor({ getDialog, relatedEntity })
		{
			super({ getDialog, relatedEntity });

			/** @private */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @return {DialogId}
		 */
		get dialogId()
		{
			return this.getDialog().dialogId;
		}

		/**
		 * @protected
		 * @return {Array<DialogHeaderButton>}
		 */
		getButtons()
		{
			const buttons = [];

			const dialog = this.getDialog();
			if (ChatPermission.canCall(dialog))
			{
				buttons.push(CallAudioButton);
			}

			if (Feature.isDialogHeaderButtonIconSupported)
			{
				buttons.push(OpenTaskButton);
			}

			return buttons;
		}

		/**
		 * @protected
		 * @param {string} buttonId
		 * @return void
		 */
		tapHandler(buttonId)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			switch (buttonId)
			{
				case CallAudioButton.id:
					CallManager.getInstance().createAudioCall(this.dialogId);
					break;

				case OpenTaskButton.id:
					// eslint-disable-next-line no-case-declarations
					const dialog = this.getDialog();
					if (!Type.isStringFilled(dialog.entityLink.url))
					{
						return;
					}

					// eslint-disable-next-line no-case-declarations
					const url = `${currentDomain}${dialog.entityLink.url}`;
					inAppUrl.open(url);

					break;

				default:
					break;
			}
		}
	}

	module.exports = {
		CommentsHeaderButtons,
	};
});
