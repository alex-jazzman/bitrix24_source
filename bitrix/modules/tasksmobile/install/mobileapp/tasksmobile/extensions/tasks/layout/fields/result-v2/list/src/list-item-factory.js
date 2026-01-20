/**
 * @module tasks/layout/fields/result-v2/list/src/list-item-factory
 */
jn.define('tasks/layout/fields/result-v2/list/src/list-item-factory', (require, exports, module) => {
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');
	const { ListItem, LIST_ITEM_TYPE } = require('tasks/layout/fields/result-v2/list/src/list-item');

	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === LIST_ITEM_TYPE)
			{
				return new ListItem(data);
			}

			return super.create(type, data);
		}
	}

	module.exports = {
		ListItemsFactory,
		LIST_ITEM_TYPE,
	};
});
