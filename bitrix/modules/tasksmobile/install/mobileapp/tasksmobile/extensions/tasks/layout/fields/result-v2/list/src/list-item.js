/**
 * @module tasks/layout/fields/result-v2/list/src/list-item
 */
jn.define('tasks/layout/fields/result-v2/list/src/list-item', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { ListItemContent } = require('tasks/layout/fields/result-v2/list/src/list-item-content');

	const LIST_ITEM_TYPE = 'TaskResult';

	class ListItem extends Base
	{
		renderItemContent()
		{
			const { id, showBorder } = this.props.item;

			return ListItemContent({ id, showBorder });
		}
	}

	module.exports = {
		ListItem,
		LIST_ITEM_TYPE,
	};
});
