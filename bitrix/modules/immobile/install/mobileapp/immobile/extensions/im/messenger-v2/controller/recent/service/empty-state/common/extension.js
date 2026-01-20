/**
 * @module im/messenger-v2/controller/recent/service/empty-state/common
 */
jn.define('im/messenger-v2/controller/recent/service/empty-state/common', (require, exports, module) => {
	const { Type } = require('type');
	const { isEqual } = require('utils/object');
	const { RecentEventType } = require('im/messenger-v2/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseUiRecentService } = require('im/messenger-v2/controller/recent/service/base');

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

		redraw()
		{
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
			this.renderWelcomeScreenIfNeeded();
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

		/**
		 * @private
		 * @return {Promise<void>}
		 */
		itemCollectionSizeChangedHandler = async (itemCollectionSize) => {
			this.logger.log('itemCollectionSizeChangedHandler', itemCollectionSize);

			if (itemCollectionSize === this.itemCollectionSize)
			{
				this.logger.log('itemCollectionSizeChangedHandler skipped');

				return;
			}

			if (itemCollectionSize > 0)
			{
				await this.hide();
			}
			else
			{
				await this.show();
			}

			this.itemCollectionSize = itemCollectionSize;
			this.logger.log('itemCollectionSizeChangedHandler complete');
		};

		/**
		 * @private
		 */
		renderWelcomeScreenIfNeeded()
		{
			const welcomeScreen = new this.WelcomeScreenClass();
			if (isEqual(welcomeScreen, this.renderedWelcomeScreen))
			{
				this.logger.log('renderWelcomeScreenIfNeeded skipped');

				return;
			}

			this.ui.welcomeScreen.show(welcomeScreen.toChatRecentWidgetItem());

			this.renderedWelcomeScreen = welcomeScreen;
			this.logger.log('renderWelcomeScreenIfNeeded complete');
		}
	}

	module.exports = CommonEmptyStateService;
});
