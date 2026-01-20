/**
 * @module mail/simple-list/items
 */
jn.define('mail/simple-list/items', (require, exports, module) => {
	const { Message } = require('mail/simple-list/items/message-redux');
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');

	const ListItemType = {
		MESSAGE: 'Message',
	};

	/**
	 * @class ListItemsFactory
	 */
	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === ListItemType.MESSAGE)
			{
				return new Message(data);
			}

			return BaseListItemsFactory.create(type, data);
		}
	}

	module.exports = { ListItemsFactory, ListItemType };
});
