/**
 * @module layout/ui/gratitude-list/src/factory
 */
jn.define('layout/ui/gratitude-list/src/factory', (require, exports, module) => {
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');
	const { GratitudeListItem } = require('layout/ui/gratitude-list/src/item');
	const { ReduxGratitudeListItem } = require('layout/ui/gratitude-list/src/redux-item');

	const ListItemType = {
		GRATITUDE: 'gratitude',
		REDUX_GRATITUDE: 'redux_gratitude',
	};

	class ListItemsFactory extends BaseListItemsFactory
	{
		static create(type, data)
		{
			if (type === ListItemType.GRATITUDE)
			{
				return new GratitudeListItem(data);
			}

			if (type === ListItemType.REDUX_GRATITUDE)
			{
				return new ReduxGratitudeListItem(data);
			}

			return super.create(type, data);
		}
	}

	module.exports = {
		ListItemsFactory,
		ListItemType,
	};
});
