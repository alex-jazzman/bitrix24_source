/**
 * @module im/messenger/view/dialog/status-field
 */
jn.define('im/messenger/view/dialog/status-field', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogStatusField
	 */
	class DialogStatusField extends ProxyView
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

		clear()
		{
			if (this.isUiAvailable())
			{
				this.ui.clear();
			}
		}

		/**
		 * @param {StatusFieldSetParams} params
		 */
		set(params)
		{
			if (this.isUiAvailable())
			{
				this.ui.set(params);
			}
		}
	}

	module.exports = {
		DialogStatusField,
	};
});
