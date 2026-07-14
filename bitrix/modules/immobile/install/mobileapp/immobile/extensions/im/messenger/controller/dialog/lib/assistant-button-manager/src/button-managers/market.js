/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');
	// const { MarketAppManager } = require('market-app-manager'); TODO uncomment this import after bp mobile 26.500.0 is released

	const { MarketButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');

	const { MessengerParams } = require('im/messenger/lib/params');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--market-manager');

	const MARKET_SECTION_CODE = 'general';
	const MARKET_PLACEMENT_CODE = 'IMMOBILE_CONTEXT_MENU';

	/**
	 * @class MarketManager
	 */
	class MarketManager
	{
		/** @type {DialogId} */
		#dialogId;

		/** @type {PlacementRecord[]} */
		#apps = [];

		/** @type {DialogPopupMenu|null} */
		#popupMenu = null;

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogLocator })
		{
			this.#dialogId = dialogLocator.get('dialogId');
		}

		/**
		 * @returns {boolean}
		 */
		get isActive()
		{
			return false;
		}

		async menuButtonTapHandler()
		{
			logger.log(`${this.constructor.name}.menuButtonTapHandler`);

			try
			{
				const { MarketAppManager } = require('market-app-manager'); // TODO: delete this import after bp mobile 26.500.0 is released
				this.#apps = await MarketAppManager.getList(MARKET_PLACEMENT_CODE);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.menuButtonTapHandler: getList failed`, error);
				Notification.showToast(ToastType.marketAppsEmpty);

				return;
			}

			if (!Type.isArrayFilled(this.#apps))
			{
				Notification.showToast(ToastType.marketAppsEmpty);

				return;
			}

			this.#openPopupMenu();
		}

		#openPopupMenu()
		{
			const menuItems = this.#apps.map((app) => ({
				id: String(app.ID),
				title: app.TITLE || app.APP_NAME || '',
				sectionCode: MARKET_SECTION_CODE,
				iconName: Icon.PRODUCT.getIconName(),
			}));

			const sections = [{ id: MARKET_SECTION_CODE }];

			if (!this.#popupMenu)
			{
				this.#popupMenu = dialogs.createPopupMenu();
			}

			this.#popupMenu.setTarget(MarketButton.viewId);
			this.#popupMenu.setData(menuItems, sections, (event, item) => {
				if (event === 'onItemSelected')
				{
					this.#popupMenuItemTapHandler(item.id);
				}
			});
			this.#popupMenu.show();
		}

		#popupMenuItemTapHandler(itemId)
		{
			this.#popupMenu?.hide();

			const app = this.#apps.find((item) => String(item.ID) === itemId);
			if (!app)
			{
				return;
			}

			MarketAppManager.openApp({
				app,
				placementOptions: { dialogId: this.#dialogId },
			});
		}
	}

	module.exports = { MarketManager };
});
