/**
 * @module im/messenger/controller/recent/service/render/lib/convertor/chats
 */
jn.define('im/messenger/controller/recent/service/render/lib/convertor/chats', (require, exports, module) => {
	const { RecentUiConverter } = require('im/messenger/lib/converter/ui/recent');
	const { RecentItemType } = require('im/messenger/controller/recent/service/render/lib/convertor/const');

	function convertToRecentItems(items)
	{
		const loaders = [];
		const callItems = [];
		const itemsToConvert = [];

		for (const item of items)
		{
			if (item?.type === RecentItemType.loader)
			{
				loaders.push(item);
				continue;
			}

			if (item?.type === RecentItemType.call)
			{
				const { call, callStatus } = item;
				callItems.push(RecentUiConverter.toCallItem(callStatus, call));
				continue;
			}

			itemsToConvert.push(item);
		}

		const converted = RecentUiConverter.toList(itemsToConvert, this.itemOptions);

		return [
			...callItems,
			...converted,
			...loaders,
		];
	}

	module.exports = convertToRecentItems;
});
