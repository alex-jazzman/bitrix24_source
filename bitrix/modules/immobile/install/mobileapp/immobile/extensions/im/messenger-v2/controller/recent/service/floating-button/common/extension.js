/**
 * @module im/messenger-v2/controller/recent/service/floating-button/common
 */
jn.define('im/messenger-v2/controller/recent/service/floating-button/common', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { isEqual } = require('utils/object');
	const { Icon } = require('ui-system/blocks/icon');
	const { RecentEventType } = require('im/messenger-v2/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BaseUiRecentService } = require('im/messenger-v2/controller/recent/service/base');

	/**
	 * @implements {IFloatingButtonService}
	 * @class CommonFloatingButtonService
	 * @extends {BaseUiRecentService<CommonFloatingButtonServiceProps>}
	 */
	class CommonFloatingButtonService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			if (Type.isFunction(this.props.onTap))
			{
				this.tapHandler = this.props.onTap;
			}
			else
			{
				this.logger.error('onInit: props.onTap must be a function');
			}

			this.checkShouldShowButton = Type.isFunction(this.props.checkShouldShowButton)
				? this.props.checkShouldShowButton
				: () => true
			;

			this.renderedButton = {};
			this.itemCollectionSize = null;
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');
			/** @type {BaseList} */
			this.ui = ui;
		}

		// region public interface

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

		// endregion public interface

		/**
		 * @private
		 */
		async renderButton()
		{
			if (!this.checkShouldShowButton())
			{
				return;
			}

			void this.setFloatingButtonIfNeeded(this.createButton());
		}

		/**
		 * @private
		 */
		async renderAccentButton()
		{
			if (!this.checkShouldShowButton())
			{
				return;
			}

			void this.setFloatingButtonIfNeeded(this.createAccentButton());
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
				await this.renderButton();
			}
			else
			{
				await this.renderAccentButton();
			}

			this.itemCollectionSize = itemCollectionSize;
			this.logger.log('itemCollectionSizeChangedHandler complete');
		};

		/**
		 * @private
		 */
		createButton()
		{
			return {
				type: 'plus',
				callback: this.tapHandler,
				icon: Icon.PLUS.getIconName(),
				animation: 'hide_on_scroll',
				color: Color.accentBrandBlue.toHex(),
				showLoader: false,
				accentByDefault: false,
			};
		}

		/**
		 * @private
		 */
		createAccentButton()
		{
			const button = this.createButton();
			button.accentByDefault = true;

			return button;
		}

		/**
		 * @private
		 */
		async setFloatingButtonIfNeeded(button)
		{
			await this.uiReadyPromise;

			const noChanges = isEqual(button, this.renderedButton);
			if (noChanges)
			{
				return;
			}

			this.ui.setFloatingButton(button);
			this.renderedButton = button;

			this.logger.log('setFloatingButtonIfNeeded complete');
		}
	}

	module.exports = CommonFloatingButtonService;
});
