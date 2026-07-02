/**
 * @module im/messenger/lib/notifier
 */
jn.define('im/messenger/lib/notifier', (require, exports, module) => {
	/* global InAppNotifier, include  */
	const { Type } = require('type');
	const { transparent } = require('utils/color');

	const { Theme } = require('im/lib/theme');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const {
		EventType,
		RecentTabByNavigationTab,
	} = require('im/messenger/const');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

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
		}

		/**
		 * Sends an in-app notification
		 *
		 * @param {Object} options
		 * @param {string} options.dialogId
		 * @param {string} options.title
		 * @param {string} options.text
		 * @param {object} options.recentConfig
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
			if (
				navigationContext.isTabActive
				&& Type.isPlainObject(options.recentConfig)
				&& Type.isArrayFilled(options.recentConfig.sections)
			)
			{
				const sections = options.recentConfig.sections;
				const tabId = serviceLocator.get('recent-manager').getActiveRecentId();
				const currentRecentTab = RecentTabByNavigationTab[tabId];
				if (sections.includes(currentRecentTab))
				{
					return false;
				}

				if (this.#isDialogInActiveNestedNavigation(options))
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

		/**
		 * @param {Object} options
		 * @return {boolean}
		 */
		#isDialogInActiveNestedNavigation(options)
		{
			const navigationManager = serviceLocator.get('navigation-manager');
			if (!navigationManager?.hasNestedNavigation())
			{
				return false;
			}

			const chatId = options.recentConfig?.chatId;
			if (!chatId)
			{
				return false;
			}

			if (navigationManager.isTopNestedNavigationForChat(chatId))
			{
				return true;
			}

			const store = serviceLocator.get('core')?.getStore();
			if (!store)
			{
				return false;
			}

			const dialog = store.getters['dialoguesModel/getById'](options.dialogId);

			return dialog?.parentChatId > 0
				&& navigationManager.isTopNestedNavigationForChat(dialog.parentChatId)
			;
		}

		showNotification(options)
		{
			const notification = {
				title: jnComponent.convertHtmlEntities(options.title),
				backgroundColor: transparent(Theme.colors.baseBlackFixed, 0.8),
				message: jnComponent.convertHtmlEntities(options.text),
				data: options,
			};

			if (options.avatar)
			{
				notification.imageUrl = options.avatar;
			}

			this.#setInAppNotifierHandler();
			InAppNotifier.showNotification(notification);
		}

		/**
		 * InAppNotifier keeps a single native tap handler and can lose the JS handler after navigation changes.
		 * Register it right before showing a notification so tapping the currently visible notification opens the dialog.
		 */
		#setInAppNotifierHandler()
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

	module.exports = {
		Notifier: new Notifier(),
	};
});
