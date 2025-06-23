/**
 * @module im/messenger/view/dialog/pin-panel
 */
jn.define('im/messenger/view/dialog/pin-panel', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');
	const { Feature } = require('im/messenger/lib/feature');

	/**
	 * @class DialogPinPanel
	 */
	class DialogPinPanel extends ProxyView
	{
		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [],
			};
		}

		/**
		 * @param {PinPanelShowParams} pinPanelParams
		 */
		show(pinPanelParams)
		{
			if (this.isUiAvailable())
			{
				this.ui.show(pinPanelParams);
			}
		}

		/**
		 * @void
		 */
		hide()
		{
			if (this.isUiAvailable())
			{
				this.ui.hide();
			}
		}

		/**
		 * @param {PinPanelShowParams} pinPanelParams
		 */
		update(pinPanelParams)
		{
			if (this.isUiAvailable() && Feature.isPinPanelNewAPIAvailable)
			{
				this.ui.update(pinPanelParams);
			}
		}

		/**
		 * @param {object} itemData
		 */
		updateItem(itemData)
		{
			if (!this.isUiAvailable())
			{
				return;
			}

			if (Feature.isPinPanelNewAPIAvailable)
			{
				this.ui.updateItems([itemData]);
			}
			else
			{
				this.ui.updateItem(itemData.item);
			}
		}

		/**
		 * @param {object[]} itemData
		 */
		updateItems(items)
		{
			if (!this.isUiAvailable() && Feature.isPinPanelNewAPIAvailable)
			{
				this.ui.updateItems(items);
			}
		}

		/**
		 * @void
		 */
		showNextItem()
		{
			if (this.isUiAvailable())
			{
				this.ui.showNextItem();
			}
		}

		/**
		 * @void
		 */
		showPreviousItem()
		{
			if (this.isUiAvailable())
			{
				this.ui.showPreviousItem();
			}
		}

		/**
		 * @param {string} id
		 */
		showItemById(id)
		{
			if (this.isUiAvailable())
			{
				this.ui.showItemById(id);
			}
		}
	}

	module.exports = {
		DialogPinPanel,
	};
});
