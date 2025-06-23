/**
 * @module im/messenger/view/dialog/comments-button
 */
jn.define('im/messenger/view/dialog/comments-button', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogCommentsButton
	 */
	class DialogCommentsButton extends ProxyView
	{
		/**
		 * @constructor
		 * @param {JNBaseClassInterface} ui
		 * @param {EventFilter} eventFilter
		 */
		constructor(ui, eventFilter)
		{
			super(ui, eventFilter);

			this.currentCounterValue = null;
		}

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
		 * @void
		 */
		show()
		{
			if (this.isUiAvailable())
			{
				this.ui.show();
			}
		}

		/**
		 * @param {boolean} [isAnimated=false]
		 */
		hide({ isAnimated = false } = {})
		{
			if (this.isUiAvailable())
			{
				this.ui.hide(isAnimated);
			}
		}

		/**
		 * @param {string} value
		 */
		setCounter(value)
		{
			const isNewCounterValue = this.currentCounterValue !== value;
			if (this.isUiAvailable() && isNewCounterValue)
			{
				this.ui.setCounter(value);
				this.currentCounterValue = value;
			}
		}
	}

	module.exports = {
		DialogCommentsButton,
	};
});
