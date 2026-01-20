/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2/selector
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName } = require('tasks/statemanager/redux/slices/tasks-results-v2/meta');

	const selectResultsByTaskId = createDraftSafeSelector(
		(state) => state[sliceName],
		(_, taskId) => Number(taskId),
		(sliceState, taskId) => (
			Object.values(sliceState.results.entities)
				.filter((result) => result.taskId === taskId)
				.sort((a, b) => b.id - a.id)
		),
	);

	const selectMapByTaskId = createDraftSafeSelector(
		(state) => state[sliceName],
		(_, taskId) => Number(taskId),
		(sliceState, taskId) => (
			Object.keys(sliceState.map[taskId] ?? {})
				.map((id) => Number(id))
				.sort((a, b) => b - a)
		),
	);

	const selectLastResult = createDraftSafeSelector(
		selectResultsByTaskId,
		selectMapByTaskId,
		(results, map) => (results.find((result) => result.id === map[0]) ?? null),
	);

	const selectResultById = createDraftSafeSelector(
		(state) => state[sliceName],
		(_, resultId) => Number(resultId),
		(sliceState, resultId) => (sliceState.results.entities[resultId] ?? null),
	);

	const selectResultIdByTaskIdAndMessageId = createDraftSafeSelector(
		(state) => state[sliceName],
		(_, taskId) => Number(taskId),
		(_, __, messageId) => Number(messageId),
		(sliceState, taskId, messageId) => {
			const taskMap = sliceState.map[taskId] ?? {};
			const resultId = Object.keys(taskMap).find((id) => taskMap[id] === messageId);

			return resultId ? Number(resultId) : null;
		},
	);

	module.exports = {
		selectResultsByTaskId,
		selectMapByTaskId,
		selectLastResult,
		selectResultById,
		selectResultIdByTaskIdAndMessageId,
	};
});
