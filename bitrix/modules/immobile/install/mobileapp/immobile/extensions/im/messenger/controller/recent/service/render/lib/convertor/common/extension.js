/**
 * @module im/messenger/controller/recent/service/render/lib/convertor/common
 */
jn.define('im/messenger/controller/recent/service/render/lib/convertor/common', (require, exports, module) => {
	const { RecentUiConverter } = require('im/messenger/lib/converter/ui/recent');
	const { RecentItemType } = require('im/messenger/controller/recent/service/render/lib/convertor/const');

	/**
	 * @param {Array<RecentItem | object>} items
	 * @returns {Array<RecentWidgetItem | object>}
	 */
	function convertToRecentItems(items)
	{
		const loaders = [];
		const itemsToConvert = [];

		for (const item of items)
		{
			if (item?.type === RecentItemType.loader)
			{
				loaders.push(item);
				continue;
			}

			itemsToConvert.push(item);
		}

		const converted = RecentUiConverter.toList(itemsToConvert, this.itemOptions);

		return [
			...converted,
			...loaders,
		];
	}

	module.exports = convertToRecentItems;
});
