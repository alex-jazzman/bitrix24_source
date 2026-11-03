/**
 * @module mail/simple-list/items
 */
jn.define('mail/simple-list/items', (require, exports, module) => {
	const { Message } = require('mail/simple-list/items/message-redux');
	const { listItemRegistry } = require('mail/simple-list/items/src/item-registry');
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');

	const ListItemType = {
		MESSAGE: 'Message',
		CONVERSATION: 'Conversation',
	};

	/**
	 * @class ListItemsFactory
	 */
	class ListItemsFactory extends BaseListItemsFactory
	{
		static register(type, ItemConstructor)
		{
			listItemRegistry.register(type, ItemConstructor);
		}

		static create(type, data)
		{
			if (type === ListItemType.MESSAGE)
			{
				return new Message(data);
			}

			const registeredItem = listItemRegistry.create(type, data);
			if (registeredItem !== null)
			{
				return registeredItem;
			}

			return BaseListItemsFactory.create(type, data);
		}
	}

	module.exports = { ListItemsFactory, ListItemType };
});
