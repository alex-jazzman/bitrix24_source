/**
 * @module tasks/onboarding/src/condition
 */
jn.define('tasks/onboarding/src/condition', (require, exports, module) => {
	const { ConditionBase } = require('onboarding/condition');

	class Condition extends ConditionBase
	{
		static isEmptyTaskList()
		{
			return (context) => {
				return context?.itemQuantity === 0;
			};
		}

		static hasTasksMoreThan(quantity)
		{
			return async (context) => {
				try
				{
					const store = require('statemanager/redux/store');
					const { selectTaskEntities } = require('tasks/statemanager/redux/slices/tasks');

					const entities = selectTaskEntities(store.getState(), context?.ownerId);

					const tasksCount = Object.keys(entities || {}).length;

					return tasksCount >= quantity;
				}
				catch
				{
					return false;
				}
			};
		}
	}

	module.exports = {
		Condition,
	};
});
