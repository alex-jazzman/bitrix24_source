/**
 * @module im/messenger/view/dialog/join-button
 */
jn.define('im/messenger/view/dialog/join-button', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogJoinButton
	 */
	class DialogJoinButton extends ProxyView
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
		 * @param {boolean} [isAnimated=false]
		 */
		hide(isAnimated = false)
		{
			if (this.isUiAvailable())
			{
				this.ui.hide({ animated: isAnimated });
			}
		}

		/**
		 * @param {JoinButtonShowParams} params
		 */
		show(params)
		{
			if (this.isUiAvailable())
			{
				this.ui.show(params);
			}
		}
	}

	module.exports = {
		DialogJoinButton,
	};
});
