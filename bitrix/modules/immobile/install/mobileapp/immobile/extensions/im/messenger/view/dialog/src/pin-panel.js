/**
 * @module im/messenger/view/dialog/pin-panel
 */
jn.define('im/messenger/view/dialog/pin-panel', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

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
		 * @param {object} itemData
		 */
		updateItem(itemData)
		{
			if (this.isUiAvailable())
			{
				this.ui.updateItem(itemData);
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
