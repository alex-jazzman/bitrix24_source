/**
 * @module tasks/statemanager/redux/slices/checklists/observers/stats-observer
 */
jn.define('tasks/statemanager/redux/slices/checklists/observers/stats-observer', (require, exports, module) => {
	const { isEqual } = require('utils/object');
	const { selectChecklistStats } = require('tasks/statemanager/redux/slices/checklists/selector');
	const { updateChecklist } = require('tasks/statemanager/redux/slices/tasks');

	/**
	 * @param {object} store
	 * @param {{entityType: ChecklistEntityType, entityId: number|string, taskId: number|string}} params
	 * @return {function(): void}
	 */
	const observeChecklistStats = (store, { entityType, entityId, taskId }) => {
		let prevStats = selectChecklistStats(store.getState(), entityType, entityId);

		return store.subscribe(() => {
			const nextStats = selectChecklistStats(store.getState(), entityType, entityId);

			if (!isEqual(prevStats, nextStats))
			{
				prevStats = nextStats;

				// setTimeout: dispatching directly from a subscribe callback is forbidden by redux
				setTimeout(() => {
					store.dispatch(updateChecklist({
						taskId,
						checklist: {
							completed: nextStats.completed,
							uncompleted: nextStats.uncompleted,
						},
						checklistDetails: nextStats.checklistDetails,
					}));
				}, 0);
			}
		});
	};

	module.exports = { observeChecklistStats };
});
