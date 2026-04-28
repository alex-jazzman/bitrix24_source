/**
 * @module im/messenger/controller/recent/service/render/lib/convertor/openlines
 */
jn.define('im/messenger/controller/recent/service/render/lib/convertor/openlines', (require, exports, module) => {
	const { RecentUiConverter } = require('im/messenger/lib/converter/ui/recent');
	const { RecentItemType } = require('im/messenger/controller/recent/service/render/lib/convertor/const');

	/**
	 * @param {Array<RecentItem | object>} items
	 * @returns {Array<RecentWidgetItem | object>}
	 */
	function convertToRecentItems(items)
	{
		const loaders = [];
		const openlineItems = [];

		for (const item of items)
		{
			if (item?.type === RecentItemType.loader)
			{
				loaders.push(item);
				continue;
			}

			openlineItems.push(RecentUiConverter.toOpenlineItem(item, this.itemOptions));
		}

		return [
			...openlineItems,
			...loaders,
		];
	}

	module.exports = convertToRecentItems;
});
