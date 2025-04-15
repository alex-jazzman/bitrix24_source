/**
 * @module im/messenger/view/dialog/selector
 */
jn.define('im/messenger/view/dialog/selector', (require, exports, module) => {
	const { EventFilterType, EventType } = require('im/messenger/const');

	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogSelector
	 */
	class DialogSelector extends ProxyView
	{
		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [
					EventType.dialog.multiSelect.selected,
					EventType.dialog.multiSelect.unselected,
					EventType.dialog.multiSelect.maxCountExceeded,
				],
			};
		}

		/**
		 * @param {boolean} value
		 */
		async setEnabled(value)
		{
			if (this.isUiAvailable())
			{
				return this.ui.setEnabled(value);
			}

			return false;
		}

		/**
		 * @param {Array<string>} messageIds
		 */
		async select(messageIds)
		{
			if (this.isUiAvailable())
			{
				return this.ui.select(messageIds);
			}

			return false;
		}

		/**
		 * @param {Array<string>} messageIds
		 */
		async unselect(messageIds)
		{
			if (this.isUiAvailable())
			{
				return this.ui.unselect(messageIds);
			}

			return false;
		}

		/**
		 * @return {Array<string>} messageIds
		 */
		async getSelectedItems(messageIds)
		{
			if (this.isUiAvailable())
			{
				return this.ui.getSelectedItems(messageIds);
			}

			return [];
		}

		/**
		 * @return {boolean}
		 */
		getSelectEnable()
		{
			if (this.isUiAvailable())
			{
				return this.ui.enabled;
			}

			return false;
		}

		/**
		 * @param {number} count
		 * @return {boolean}
		 */
		async setSelectMaxCount(count)
		{
			if (this.isUiAvailable())
			{
				this.ui.maxCount = count;

				return true;
			}

			return false;
		}
	}

	module.exports = {
		DialogSelector,
	};
});
