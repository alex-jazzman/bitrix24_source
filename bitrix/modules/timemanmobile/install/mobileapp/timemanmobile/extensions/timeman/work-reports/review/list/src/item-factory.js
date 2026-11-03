/**
 * @module timeman/work-reports/review/list/src/item-factory
 */
jn.define('timeman/work-reports/review/list/src/item-factory', (require, exports, module) => {
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');
	const { ReportItem, REPORT_ITEM_TYPE } = require('timeman/work-reports/review/list/src/report-item');
	const { UserItem, USER_ITEM_TYPE } = require('timeman/work-reports/review/list/src/user-item');

	class ListItemsFactory extends BaseListItemsFactory
	{
		static handlers = {};

		static setHandlers(handlers)
		{
			ListItemsFactory.handlers = handlers || {};
		}

		static create(type, data)
		{
			if (type === REPORT_ITEM_TYPE)
			{
				return new ReportItem({
					...data,
					item: {
						...data?.item,
						onMarkChange: ListItemsFactory.handlers.onMarkChange,
					},
				});
			}

			if (type === USER_ITEM_TYPE)
			{
				return new UserItem(data);
			}

			return super.create(type, data);
		}
	}

	module.exports = {
		ListItemsFactory,
		REPORT_ITEM_TYPE,
		USER_ITEM_TYPE,
	};
});
