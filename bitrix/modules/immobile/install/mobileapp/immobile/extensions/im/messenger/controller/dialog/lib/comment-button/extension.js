/**
 * @module im/messenger/controller/dialog/lib/comment-button
 */
jn.define('im/messenger/controller/dialog/lib/comment-button', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const { DialogType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification } = require('im/messenger/lib/ui/notification');

	/**
	 * @class CommentButton
	 */
	class CommentButton
	{
		/**
		 * @param {DialogView} view
		 * @param {number} dialogId
		 */
		constructor(view, dialogId)
		{
			this.view = view;
			this.dialogId = dialogId;
			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
			/**  @type {DialoguesModelState} */
			this.dialog = null;

			this.isShowButton = false;

			this.bindViewEventHandlers();
			this.subscribeViewEvents();
		}

		bindViewEventHandlers()
		{
			this.onButtonTap = debounce(this.onButtonTap, 300, this, true);
		}

		subscribeViewEvents()
		{
			if (!this.view.commentsButton)
			{
				return;
			}

			this.view.commentsButton.on('tap', this.onButtonTap);
		}

		drawButton()
		{
			this.dialog ??= this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (![DialogType.channel, DialogType.openChannel].includes(this.dialog.type))
			{
				return;
			}

			const unreadComments = this.store.getters['commentModel/getChannelCounters'](this.dialog.chatId);

			const commentsButton = this.view.commentsButton;
			if (!commentsButton)
			{
				return;
			}

			if (unreadComments > 0)
			{
				if (!this.isShowButton)
				{
					commentsButton.setCounter(String(unreadComments));
					commentsButton.show();
					this.isShowButton = true;

					return;
				}

				commentsButton.setCounter(String(unreadComments));

				return;
			}

			if (this.isShowButton)
			{
				commentsButton.hide();
				this.isShowButton = false;
			}
		}

		onButtonTap()
		{
			Notification.showComingSoon();
		}
	}

	module.exports = { CommentButton };
});
