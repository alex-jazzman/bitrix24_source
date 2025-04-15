/**
 * @module im/messenger/view/dialog/mention-panel
 */
jn.define('im/messenger/view/dialog/mention-panel', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogMentionPanel
	 */
	class DialogMentionPanel extends ProxyView
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
		 * @param {Array<MentionItem>} items
		 */
		open(items)
		{
			if (this.isUiAvailable())
			{
				this.ui.open(items);
			}
		}

		/**
		 * @void
		 */
		close()
		{
			if (this.isUiAvailable())
			{
				this.ui.close();
			}
		}

		/**
		 * @param {Array<MentionItem>} items
		 */
		setItems(items)
		{
			if (this.isUiAvailable())
			{
				this.ui.setItems(items);
			}
		}

		/**
		 * @void
		 */
		showLoader()
		{
			if (this.isUiAvailable())
			{
				this.ui.showLoader();
			}
		}

		/**
		 * @void
		 */
		hideLoader()
		{
			if (this.isUiAvailable())
			{
				this.ui.hideLoader();
			}
		}
	}

	module.exports = {
		DialogMentionPanel,
	};
});
