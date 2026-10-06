/**
 * @module tasks/project-list/simple-list/items
 */
jn.define('tasks/project-list/simple-list/items', (require, exports, module) => {
	const { Project } = require('tasks/project-list/simple-list/items/project-redux');
	const { ListItemsFactory: BaseListItemsFactory } = require('layout/ui/simple-list/items');

	const ListItemType = {
		PROJECT: 'Project',
	};

	/**
	 * @class ProjectListItemsFactory
	 */
	class ProjectListItemsFactory extends BaseListItemsFactory
	{
		/**
		 * @param {string} type
		 * @param {ProjectListItemFactoryData} data
		 * @returns {object}
		 */
		static create(type, data)
		{
			if (type === ListItemType.PROJECT)
			{
				return new Project(data);
			}

			return BaseListItemsFactory.create(type, data);
		}
	}

	module.exports = { ProjectListItemsFactory, ListItemType };
});
