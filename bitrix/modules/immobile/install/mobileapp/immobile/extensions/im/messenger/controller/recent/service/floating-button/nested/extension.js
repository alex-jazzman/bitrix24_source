/**
 * @module im/messenger/controller/recent/service/floating-button/nested
 */
jn.define('im/messenger/controller/recent/service/floating-button/nested', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { isEqual } = require('utils/object');
	const { Icon } = require('ui-system/blocks/icon');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { CollabEntityCreationController } = require('im/messenger/controller/collab-entity-creation-selector');

	/**
	 * @implements {IFloatingButtonService}
	 * @class NestedFloatingButtonService
	 * @extends {BaseUiRecentService<NestedFloatingButtonServiceProps>}
	 */
	class NestedFloatingButtonService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.isTapProcessing = false;
			this.renderedButton = {};
			this.itemCollectionSize = null;

			this.checkShouldShowButton = Type.isFunction(this.props.checkShouldShowButton)
				? this.props.checkShouldShowButton
				: () => true
			;

			if (Type.isFunction(this.props.onDirectCreate))
			{
				this.tapHandler = async () => {
					if (this.isTapProcessing)
					{
						return;
					}
					this.isTapProcessing = true;

					try
					{
						const parentChatId = this.recentLocator.get('parentChatId');
						await this.props.onDirectCreate(parentChatId);
					}
					catch (error)
					{
						this.logger.error('tapHandler: error in onDirectCreate', error);
					}
					finally
					{
						this.isTapProcessing = false;
					}
				};
			}
			else
			{
				this.tapHandler = async () => {
					if (this.isTapProcessing)
					{
						return;
					}
					this.isTapProcessing = true;

					try
					{
						const parentChatId = this.recentLocator.get('parentChatId');
						const controller = new CollabEntityCreationController(parentChatId);
						await controller.open();
					}
					catch (error)
					{
						this.logger.error('tapHandler: error', error);
					}
					finally
					{
						this.isTapProcessing = false;
					}
				};
			}
		}

		async onUiReady(ui)
		{
			this.logger.log('onUiReady');
			this.ui = ui;
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
			const size = this.recentLocator.get('render').getItemCollectionSize();
			void this.itemCollectionSizeChangedHandler(size);
		}

		async renderButton()
		{
			if (!this.checkShouldShowButton())
			{
				return;
			}

			void this.setFloatingButtonIfNeeded(this.createButton());
		}

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
		 */
		itemCollectionSizeChangedHandler = async (itemCollectionSize) => {
			if (itemCollectionSize === this.itemCollectionSize)
			{
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
		}
	}

	module.exports = NestedFloatingButtonService;
});
