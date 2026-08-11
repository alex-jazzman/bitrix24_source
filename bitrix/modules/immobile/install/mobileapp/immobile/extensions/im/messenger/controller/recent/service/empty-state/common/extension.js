/**
 * @module im/messenger/controller/recent/service/empty-state/common
 */
jn.define('im/messenger/controller/recent/service/empty-state/common', (require, exports, module) => {
	const { Type } = require('type');
	const { isEqual } = require('utils/object');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const CommonFilterEmptyScreen = require('im/messenger/controller/recent/service/empty-state/lib/filter/common');

	/**
	 * @implements {IEmptyStateService}
	 * @class CommonEmptyStateService
	 * @extends {BaseUiRecentService<CommonEmptyStateServiceProps>}
	 */
	class CommonEmptyStateService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.WelcomeScreenClass = require(this.props.welcomeScreenExtension);
			this.itemCollectionSize = null;
		}

		/**
		 * @param {BaseList} ui
		 */
		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			this.ui = ui;
			this.renderedWelcomeScreen = null;
		}

		subscribeEvents()
		{
			this.recentLocator.get('emitter')
				.on(
					RecentEventType.render.itemCollectionSizeChanged,
					this.itemCollectionSizeChangedHandler,
				)
			;
		}

		unsubscribeEvents()
		{
			this.recentLocator.get('emitter')
				.off(
					RecentEventType.render.itemCollectionSizeChanged,
					this.itemCollectionSizeChangedHandler,
				)
			;
		}

		redraw()
		{
			this.itemCollectionSize = null;
			const size = this.recentLocator.get('render').getItemCollectionSize();
			void this.itemCollectionSizeChangedHandler(size);
		}

		/**
		 * @private
		 */
		get isWelcomeScreenShown()
		{
			return !Type.isNull(this.renderedWelcomeScreen);
		}

		/**
		 * @private
		 */
		async show()
		{
			this.logger.log('show');
			await this.uiReadyPromise;
			this.renderWelcomeScreen();
		}

		/**
		 * @desc Fires the optional onActivatedWhenEmpty callback if the recent list is currently
		 * empty (the empty-state condition: no items and no selected filter). Called on tab
		 * activation only — it does NOT render anything, so switching tabs does not re-render the
		 * welcome screen, and a spontaneous size change (e.g. hiding the last chat) does not
		 * trigger it. Used e.g. to auto-open the copilot draft chat when entering an empty tab.
		 */
		notifyActivatedWhenEmpty()
		{
			if (this.hasSelectedFilter || !Type.isFunction(this.props.onActivatedWhenEmpty))
			{
				return;
			}

			if (this.recentLocator.get('render').getItemCollectionSize() !== 0)
			{
				return;
			}

			void this.props.onActivatedWhenEmpty();
		}

		/**
		 * @private
		 */
		async hide()
		{
			this.logger.log('hide');
			await this.uiReadyPromise;
			if (this.isWelcomeScreenShown === false)
			{
				return;
			}

			this.ui.welcomeScreen.hide();
			this.renderedWelcomeScreen = null;
			this.logger.log('hide complete');
		}

		/**
		 * @private
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		get hasSelectedFilter()
		{
			if (!this.recentLocator.has('filter'))
			{
				return false;
			}

			return this.recentLocator.get('filter').hasSelectedFilter();
		}

		/**
		 * @private
		 * @return {Promise<void>}
		 */
		itemCollectionSizeChangedHandler = async (itemCollectionSize) => {
			this.logger.log('itemCollectionSizeChangedHandler', itemCollectionSize);

			const needWelcomeScreen = itemCollectionSize === 0;
			const isWelcomeScreenShown = this.isWelcomeScreenShown;
			if (itemCollectionSize === this.itemCollectionSize && needWelcomeScreen === isWelcomeScreenShown)
			{
				this.logger.log('itemCollectionSizeChangedHandler skipped', this.itemCollectionSize, isWelcomeScreenShown, itemCollectionSize, needWelcomeScreen);

				return;
			}

			if (needWelcomeScreen)
			{
				await this.show();
			}
			else
			{
				await this.hide();
			}

			this.itemCollectionSize = itemCollectionSize;
			this.logger.log('itemCollectionSizeChangedHandler complete', this.itemCollectionSize, isWelcomeScreenShown, itemCollectionSize, needWelcomeScreen);
		};

		/**
		 * @private
		 */
		renderWelcomeScreen()
		{
			const welcomeScreen = this.#getWelcomeScreen();

			if (isEqual(welcomeScreen, this.renderedWelcomeScreen))
			{
				return;
			}

			this.ui.welcomeScreen.hide();
			this.#showWelcomeScreen(welcomeScreen);

			this.renderedWelcomeScreen = welcomeScreen;
			this.logger.log('renderWelcomeScreen complete');
		}

		/**
		 * @private
		 */
		#showWelcomeScreen(welcomeScreen)
		{
			const useLayout = Feature.isWelcomeScreenLayoutComponentSupported
				&& welcomeScreen.isLayoutComponentSupported?.();

			if (useLayout)
			{
				this.ui.welcomeScreen.showLayout(welcomeScreen.toLayoutComponent());

				return;
			}

			this.ui.welcomeScreen.show(welcomeScreen.toChatRecentWidgetItem());
		}

		/**
		 * @return {IWelcomeScreen}
		 */
		#getWelcomeScreen()
		{
			const WelcomeScreenClass = this.hasSelectedFilter ? CommonFilterEmptyScreen : this.WelcomeScreenClass;
			const welcomeScreenProps = this.props.welcomeScreenProps ?? {};

			return new WelcomeScreenClass(welcomeScreenProps);
		}
	}

	module.exports = CommonEmptyStateService;
});
