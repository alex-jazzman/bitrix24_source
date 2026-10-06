/**
 * @module tasks/task/remove
 */
jn.define('tasks/task/remove', (require, exports, module) => {
	const { Feature } = require('feature');
	const { Loc } = require('loc');
	const { showRemoveToast } = require('toast/remove');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		markAsRemoved,
		unmarkAsRemoved,
		remove,
		taskRemoved,
		selectById,
	} = require('tasks/statemanager/redux/slices/tasks');

	function removeTask(taskId)
	{
		const task = selectById(store.getState(), taskId);
		if (!task)
		{
			return;
		}

		const deleteAnalyticsLabel = {
			tool: 'tasks',
			category: 'task_operations',
			type: 'task',
			event: 'task_delete',
			p1: `taskId_${taskId}`,
		};

		if (!Feature.isToastSupported())
		{
			if (task.isCreationErrorExist)
			{
				dispatch(taskRemoved({ taskId }));
			}
			else
			{
				dispatch(remove({ taskId, analyticsLabel: deleteAnalyticsLabel }));
			}

			return;
		}

		dispatch(
			markAsRemoved({ taskId }),
		);

		showRemoveToast(
			{
				message: Loc.getMessage('M_TASKS_TASK_REMOVE_TOAST_MESSAGE'),
				offset: 86,
				onButtonTap: () => {
					dispatch(
						unmarkAsRemoved({ taskId }),
					);
				},
				onTimerOver: () => {
					if (task.isCreationErrorExist)
					{
						dispatch(taskRemoved({ taskId }));
					}
					else
					{
						dispatch(remove({ taskId, analyticsLabel: deleteAnalyticsLabel }));
					}
				},
			},
		);
	}

	module.exports = { removeTask };
});
