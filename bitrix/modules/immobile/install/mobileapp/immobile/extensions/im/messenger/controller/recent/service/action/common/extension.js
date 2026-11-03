/**
 * @module im/messenger/controller/recent/service/action/common
 */
jn.define('im/messenger/controller/recent/service/action/common', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const { Analytics, EventType } = require('im/messenger/const');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { handlers } = require('im/messenger/controller/recent/service/action/lib/handler');

	/**
	 * @implements {IActionService}
	 * @class CommonActionService
	 */
	class CommonActionService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');
			this.ui = ui;
			this.subscribeEvents(ui);
		}

		/**
		 * @param {ItemActionEventData} itemActionData
		 */
		onItemAction = async (itemActionData) => {
			await this.#runAction(itemActionData, Analytics.SubSection.recentSwipeMenu);
		};

		/**
		 * @desc One action, two surfaces to reach it from - the swipe of an item and its long tap - and
		 *       the labels of the actions are read by that difference. The value is decided here, where
		 *       the two entries are still apart, and travels to the handler: below this point the event
		 *       of the swipe and the tap of the menu are the same call.
		 * @param {ItemActionEventData} itemActionData
		 * @param {string} subSection
		 */
		async #runAction(itemActionData, subSection)
		{
			this.logger.log('onItemAction', itemActionData, subSection);

			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const action = itemActionData.action?.identifier;
			const itemId = itemActionData.item.params?.id;
			if (!action || !itemId)
			{
				this.logger.error('onItemAction invalid event data:', action, itemId);

				return;
			}

			if (!handlers[action])
			{
				this.logger.error(`onItemAction unknown action: ${action}`);

				return;
			}

			try
			{
				await handlers[action](
					{
						store: this.store,
						logger: this.logger,
						recentLocator: this.recentLocator,
						subSection,
					},
					itemId,
				);
			}
			catch (error)
			{
				this.logger.error(`onItemAction error handling action "${action}":`, error);
			}
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string} itemId
		 * @param {string} popupMenuItemId
		 */
		onPopupMenuItemTap = async (itemId, popupMenuItemId) => {
			this.logger.log('onPopupMenuItemTap', itemId, popupMenuItemId);

			const itemActionData = {
				action: { identifier: popupMenuItemId },
				item: { params: { id: itemId } },
			};

			await this.#runAction(itemActionData, Analytics.SubSection.recentContextMenu);
		};

		subscribeEvents(ui)
		{
			ui?.on(EventType.recent.itemAction, this.onItemAction);
			ui?.on(EventType.recent.popupMenuItemTap, this.onPopupMenuItemTap);
		}

		unsubscribeEvents()
		{
			this.recentLocator.get('ui')
				.then((ui) => {
					ui?.off(EventType.recent.itemAction, this.onItemAction);
					ui?.off(EventType.recent.popupMenuItemTap, this.onPopupMenuItemTap);
				})
				.catch((error) => {
					this.logger.error('unsubscribeEvents error', error);
				})
			;
		}
	}

	module.exports = CommonActionService;
});
