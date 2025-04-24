/**
 * @module im/messenger/lib/notifier
 */
jn.define('im/messenger/lib/notifier', (require, exports, module) => {
	/* global InAppNotifier, include, ChatUtils  */
	const { Type } = require('type');
	const { transparent } = require('utils/color');

	const { Theme } = require('im/lib/theme');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { EventType } = require('im/messenger/const');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { MessengerParams } = require('im/messenger/lib/params');

	/**
	 * @class Notifier
	 */
	class Notifier
	{
		constructor()
		{
			include('InAppNotifier');

			this.delayShow = {};
			this.visibilityManager = VisibilityManager.getInstance();

			this.isInitialized = !Type.isUndefined(InAppNotifier);
			if (this.isInitialized)
			{
				InAppNotifier.setHandler((data) => {
					if (data && data.dialogId)
					{
						if (data.dialogId === 'notify')
						{
							MessengerEmitter.emit(EventType.messenger.openNotifications);

							return;
						}

						MessengerEmitter.emit(EventType.messenger.openDialog, { dialogId: data.dialogId });
					}
				});
			}
		}

		/**
		 * Sends an in-app notification
		 *
		 * @param {Object} options
		 * @param {string} options.dialogId
		 * @param {string} options.title
		 * @param {string} options.text
		 * @param {string} [options.avatar]
		 * @param delay
		 *
		 * @returns {Promise<boolean>} has a notification been sent
		 */
		async notify(options, delay = true)
		{
			if (!this.isInitialized || !options.dialogId)
			{
				return false;
			}

			clearTimeout(this.delayShow[options.dialogId]);
			if (delay !== false)
			{
				this.delayShow[options.dialogId] = setTimeout(
					() => this.notify(options, false),
					1500,
				);

				return true;
			}

			/** @type NavigationContext * */
			const navigationContext = await PageManager.getNavigator().getNavigationContext();
			if (navigationContext.isTabActive)
			{
				const activeTabInfo = await this.visibilityManager.getActiveTabInfo();
				if (activeTabInfo.componentCode === MessengerParams.getComponentCode())
				{
					return false;
				}
			}

			const isDialogVisible = await this.visibilityManager.checkIsDialogVisible({
				dialogId: options.dialogId,
			});
			if (isDialogVisible)
			{
				return false;
			}

			this.showNotification(options);

			return true;
		}

		showNotification(options)
		{
			const notification = {
				title: ChatUtils.htmlspecialcharsback(options.title),
				backgroundColor: transparent(Theme.colors.baseBlackFixed, 0.8),
				message: ChatUtils.htmlspecialcharsback(options.text),
				data: options,
			};

			if (options.avatar)
			{
				notification.imageUrl = options.avatar;
			}

			InAppNotifier.showNotification(notification);
		}
	}

	module.exports = {
		Notifier: new Notifier(),
	};
});
