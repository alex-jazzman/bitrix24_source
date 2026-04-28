/**
 * @module intranet/simple-list/items
 */
jn.define('intranet/simple-list/items', (require, exports, module) => {
	const { User } = require('intranet/simple-list/items/user-redux');
	const { Login } = require('intranet/simple-list/items/login');
	const { ListItemsFactory: BaseListItemsFactory, ListItemType: BaseListItemType } = require('layout/ui/simple-list/items');

	const ListItemType = {
		...BaseListItemType,
		USER: 'user',
		LOGIN: 'login',
	};

	/**
	 * @class ListItemsFactory
	 */
	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === ListItemType.USER)
			{
				return new User(data);
			}

			if (type === ListItemType.LOGIN)
			{
				return new Login(data);
			}

			return BaseListItemsFactory.create(type, data);
		}
	}

	module.exports = { ListItemsFactory, ListItemType };
});
