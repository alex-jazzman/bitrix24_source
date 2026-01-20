/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2/observers/stateful-list-observer
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2/observers/stateful-list-observer', (require, exports, module) => {
	const { selectResultsByTaskId } = require('tasks/statemanager/redux/slices/tasks-results-v2/selector');

	const observeListChange = (store, onChange, { taskId }) => {
		let prevResults = selectResultsByTaskId(store.getState(), taskId);

		return store.subscribe(() => {
			const nextResults = selectResultsByTaskId(store.getState(), taskId);

			const { removed, added } = getDiffForTasksResultsObserver(prevResults, nextResults);
			if (removed.length > 0 || added.length > 0)
			{
				onChange({ removed, added });
			}

			prevResults = nextResults;
		});
	};

	/**
	 * @private
	 * @param {Array} prevResults
	 * @param {Array} nextResults
	 * @return {{removed: Array, added: Array}}
	 */
	const getDiffForTasksResultsObserver = (prevResults, nextResults) => {
		const removed = [];
		const added = [];

		if (prevResults === nextResults)
		{
			return { added, removed };
		}

		nextResults.forEach((nextResult) => {
			if (!prevResults.some((prevResult) => prevResult.id === nextResult.id))
			{
				added.push(nextResult);
			}
		});

		prevResults.forEach((prevResult) => {
			if (!nextResults.some((nextResult) => nextResult.id === prevResult.id))
			{
				removed.push(prevResult);
			}
		});

		return { removed, added };
	};

	module.exports = { observeListChange };
});
