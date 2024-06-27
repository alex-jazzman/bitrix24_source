/**
 * @module tasks/dashboard/src/sorting
 */
jn.define('tasks/dashboard/src/sorting', (require, exports, module) => {
	const { Views } = require('tasks/statemanager/redux/types');
	const { BaseListSorting } = require('layout/ui/list/base-sorting');

	/**
	 * @class TasksDashboardSorting
	 * @extends BaseListSorting
	 */
	class TasksDashboardSorting extends BaseListSorting
	{
		/**
		 * @public
		 * @static
		 * @returns {Object}
		 */
		static get types()
		{
			return {
				ACTIVITY: 'ACTIVITY',
				DEADLINE: 'DEADLINE',
			};
		}

		/**
		 * @param {Object} data
		 */
		constructor(data = {})
		{
			super({
				types: TasksDashboardSorting.types,
				type: data.type,
				isASC: !(data.type === TasksDashboardSorting.types.ACTIVITY),
				noPropertyValue: data.noPropertyValue ?? Infinity,
			});

			this.view = data.view;
		}

		/**
		 * @public
		 * @param {string} view
		 */
		setView(view)
		{
			this.view = view;
		}

		/**
		 * @public
		 * @returns {string}
		 */
		toggle()
		{
			this.type = (this.type === this.types.ACTIVITY ? this.types.DEADLINE : this.types.ACTIVITY);

			return this.type;
		}

		/**
		 * @public
		 * @return {null|string}
		 */
		getConvertedType()
		{
			switch (this.type)
			{
				case TasksDashboardSorting.types.ACTIVITY:
					return 'activityDate';
				case TasksDashboardSorting.types.DEADLINE:
					return 'deadline';
				default:
					return null;
			}
		}

		/**
		 * @private
		 * @param {object} item
		 * @return {number}
		 */
		getPropertyValue = (item) => {
			const value = item[this.getConvertedType()];

			return value === null ? undefined : (new Date(value)).getTime();
		};

		/**
		 * @private
		 * @param {Object} item
		 * @return {number}
		 */
		getSortingSection(item)
		{
			return this.view === Views.LIST ? (item.isPinned ? 0 : 1) : 0;
		}

		/**
		 * @private
		 * @static
		 * @param {object} item
		 * @return {number}
		 */
		static getSortingSection(item)
		{
			return item.isPinned ? 0 : 1;
		}
	}

	module.exports = { TasksDashboardSorting };
});
