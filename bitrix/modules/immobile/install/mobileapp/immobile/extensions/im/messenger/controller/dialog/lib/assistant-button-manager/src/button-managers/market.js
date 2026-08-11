/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/button-managers/market', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');
	const { MarketAppManager } = require('market-app-manager');

	const { MarketButton } = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons');

	const { Feature } = require('im/messenger/lib/feature');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--market-manager');

	const MARKET_SECTION_CODE = 'general';
	const MARKET_PLACEMENT_CODE = 'IMMOBILE_CONTEXT_MENU';

	let hasApps = false;

	/**
	 * @class MarketManager
	 */
	class MarketManager
	{
		/** @type {Object} */
		#view;

		/** @type {DialogId} */
		#dialogId;

		/** @type {PlacementRecord[]} */
		#apps = [];

		/** @type {DialogPopupMenu|null} */
		#popupMenu = null;

		/** @type {?AssistantButton} */
		#currentButton = null;

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor({ dialogLocator })
		{
			this.#view = dialogLocator.get('view');
			this.#dialogId = dialogLocator.get('dialogId');
			this.#apps = [];
		}

		/**
		 * @returns {boolean}
		 */
		get isActive()
		{
			return false;
		}

		/**
		 * @returns {Promise<boolean>}
		 */
		async canShow()
		{
			if (!Feature.isAssistantMarketButtonAvailable)
			{
				return false;
			}

			if (hasApps)
			{
				return true;
			}

			try
			{
				await this.loadApps();
				hasApps = Type.isArrayFilled(this.#apps);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.canShow: getList failed`, error);

				return false;
			}

			return hasApps;
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildButton()
		{
			return { ...MarketButton };
		}

		/**
		 * @returns {AssistantButton}
		 */
		buildCurrentButton()
		{
			return this.#currentButton ?? this.buildButton();
		}

		/**
		 * @param {boolean} hasAnyActive
		 */
		applyCollapsedOverlay(hasAnyActive)
		{
			const text = hasAnyActive ? '' : MarketButton.text;
			void this.#applyButton({ ...MarketButton, text });
		}

		/**
		 * @param {AssistantButton} button
		 * @returns {Promise<any>}
		 */
		#applyButton(button)
		{
			this.#currentButton = button;

			return this.#view.textField.updateAssistantButton(button.id, button);
		}

		async loadApps()
		{
			if (Type.isArrayFilled(this.#apps))
			{
				return this.#apps;
			}

			this.#apps = await MarketAppManager.getList(MARKET_PLACEMENT_CODE);
		}

		async menuButtonTapHandler()
		{
			logger.log(`${this.constructor.name}.menuButtonTapHandler`);

			try
			{
				await this.loadApps();
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
