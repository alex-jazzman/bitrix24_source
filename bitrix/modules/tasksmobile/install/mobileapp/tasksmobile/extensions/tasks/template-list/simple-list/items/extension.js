/**
 * @module tasks/template-list/simple-list/items
 */
jn.define('tasks/template-list/simple-list/items', (require, exports, module) => {
	const { Template } = require('tasks/template-list/simple-list/items/template');
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');
	const { ListItemType } = require('tasks/template-list/simple-list/items/type');

	class TemplateListItemsFactory extends BaseListItemsFactory
	{
		static create(getProps, data)
		{
			const props = getProps(data.item);

			return new Template({
				...data,
				...props,
			});
		}
	}

	module.exports = { TemplateListItemsFactory, ListItemType };
});
