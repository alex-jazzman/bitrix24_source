/**
 * @module im/messenger/controller/recent/service/item-button/common
 */
jn.define('im/messenger/controller/recent/service/item-button/common', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	const ItemButtonId = Object.freeze({
		open: 'open',
	});

	/**
	 * @implements {IItemButtonService}
	 * @extends {BaseUiRecentService<ItemButtonServiceProps>}
	 */
	class CommonItemButtonService extends BaseUiRecentService
	{
		#subscribedUi = null;
		#isSubscribed = false;

		onInit()
		{
			this.logger.log('onInit');
		}

		/**
		 * @param {BaseList} ui
		 */
		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			if (!Feature.isRecentItemButtonAvailable)
			{
				return;
			}

			this.subscribeEvents(ui);
		}

		/**
		 * @param {ItemButtonTapEventData} eventData
		 */
		onItemButtonTap = async (eventData) => {
			this.logger.log('onItemButtonTap', eventData);

			const itemId = eventData?.itemId;
			const buttonId = eventData?.buttonId;
			if (typeof itemId !== 'string' || itemId.length === 0)
			{
				this.logger.error('onItemButtonTap invalid itemId:', itemId);

				return;
			}

			if (buttonId !== ItemButtonId.open)
			{
				this.logger.error('onItemButtonTap unknown buttonId:', buttonId);

				return;
			}

			if (typeof this.props?.onItemButtonTap !== 'function')
			{
				this.logger.error('onItemButtonTap handler is not configured');

				return;
			}

			try
			{
				await this.props.onItemButtonTap(itemId);
			}
			catch (error)
			{
				this.logger.error('onItemButtonTap handler error', error);
			}
		};

		/**
		 * @param {BaseList} ui
		 */
		subscribeEvents(ui)
		{
			if (!ui || this.#isSubscribed)
			{
				return;
			}

			ui.on(EventType.recent.itemButtonTap, this.onItemButtonTap);
			this.#subscribedUi = ui;
			this.#isSubscribed = true;
		}

		async unsubscribeEvents()
		{
			if (!this.#isSubscribed)
			{
				return;
			}

			const subscribedUi = this.#subscribedUi;
			this.#subscribedUi = null;
			this.#isSubscribed = false;

			try
			{
				const ui = subscribedUi ?? await this.recentLocator.get('ui');
				ui?.off(EventType.recent.itemButtonTap, this.onItemButtonTap);
			}
			catch (error)
			{
				this.logger.error('unsubscribeEvents error', error);
			}
		}
	}

	module.exports = CommonItemButtonService;
});
