/**
 * @module market/app-list-item/factory
 */
jn.define('market/app-list-item/factory', (require, exports, module) => {
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');
	const { MarketListItem } = require('market/app-list-item');

	const ListItemType = {
		MARKET: 'market',
	};

	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === ListItemType.MARKET)
			{
				return MarketListItem(data);
			}

			return super.create(type, data);
		}
	}

	module.exports = {
		ListItemsFactory,
		ListItemType,
	};
});
