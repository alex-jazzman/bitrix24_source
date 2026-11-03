/**
 * @module im/messenger/controller/recent/config/src/lib/item-button
 *
 * The single place wiring the recent item button contract into tab configs:
 * the render-side provider and the tap-handling service descriptor.
 */
jn.define('im/messenger/controller/recent/config/src/lib/item-button', (require, exports, module) => {
	const {
		getRecentItemButton,
		handleRecentItemButtonTap,
	} = require('im/messenger/lib/integration/mobile/vibecode');

	const ITEM_BUTTON_SERVICE_EXTENSION = 'im/messenger/controller/recent/service/item-button/common';

	/**
	 * Render service item options that let a recent row draw the item button.
	 * @return {{ getRecentItemButton: function(string): ?RecentWidgetItemButton }}
	 */
	function createItemButtonItemOptions()
	{
		return { getRecentItemButton };
	}

	/**
	 * Service descriptor that handles taps on the rendered item button.
	 * @return {{ extension: string, props: ItemButtonServiceProps }}
	 */
	function createItemButtonServiceConfig()
	{
		return {
			extension: ITEM_BUTTON_SERVICE_EXTENSION,
			props: {
				onItemButtonTap: handleRecentItemButtonTap,
			},
		};
	}

	module.exports = {
		createItemButtonItemOptions,
		createItemButtonServiceConfig,
	};
});
