/**
 * @module im/messenger/view/dialog/action-panel
 */
jn.define('im/messenger/view/dialog/action-panel', (require, exports, module) => {
	const { Type } = require('type');
	const { EventFilterType, EventType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogActionPanel
	 */
	class DialogActionPanel extends ProxyView
	{
		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [EventType.dialog.actionPanel.buttonTap],
			};
		}

		async hide()
		{
			if (this.isUiAvailable())
			{
				return this.ui.hide();
			}

			return false;
		}

		/**
		 * @param {object} titleData
		 * @param {Array<ActionPanelButton>} buttons
		 */
		async show(titleData, buttons = [])
		{
			if (this.isUiAvailable())
			{
				const title = Type.isStringFilled(titleData?.text) ? titleData : { text: '' };

				return this.ui.show(title, buttons);
			}

			return false;
		}

		/**
		 * @param {object} title
		 */
		async setTitle(title)
		{
			if (this.isUiAvailable())
			{
				return this.ui.setTitle(title);
			}

			return false;
		}

		/**
		 * @param {Array<ActionPanelButton>} buttons
		 */
		async setButtons(buttons)
		{
			if (this.isUiAvailable())
			{
				return this.ui.setButtons(buttons);
			}

			return false;
		}
	}

	module.exports = {
		DialogActionPanel,
	};
});
