/**
 * @module tasks/statemanager/redux/slices/checklists/selector
 */
jn.define('tasks/statemanager/redux/slices/checklists/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName, checklistsAdapter } = require('tasks/statemanager/redux/slices/checklists/meta');
	const { calcCounters } = require('tasks/statemanager/redux/slices/checklists/model');
	const {
		selectItemsByEntity,
	} = require('tasks/statemanager/redux/slices/checklist-items/selector');

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = checklistsAdapter.getSelectors((state) => state[sliceName]);

	/**
	 * @type {(state: object, entityType: ChecklistEntityType, entityId: number|string) => ChecklistReduxModel[]}
	 */
	const selectChecklistsByEntity = createDraftSafeSelector(
		selectAll,
		(state, entityType) => entityType,
		(state, entityType, entityId) => entityId,
		(checklists, entityType, entityId) => checklists
			.filter((checklist) => checklist.entityType === entityType && checklist.entityId === entityId)
			.sort((a, b) => a.sortIndex - b.sortIndex),
	);

	/**
	 * @type {(state: object, entityType: ChecklistEntityType, entityId: number|string) => ChecklistStats}
	 */
	const selectChecklistStats = createDraftSafeSelector(
		selectChecklistsByEntity,
		selectItemsByEntity,
		(checklists, items) => {
			let completed = 0;
			let uncompleted = 0;

			const checklistDetails = checklists.map((checklist) => {
				const ownItems = items.filter((item) => item.checklistId === checklist.id);
				const counters = calcCounters(ownItems);
				completed += counters.completed;
				uncompleted += counters.uncompleted;

				return {
					title: checklist.title,
					completed: counters.completed,
					uncompleted: counters.uncompleted,
				};
			});

			return { completed, uncompleted, checklistDetails };
		},
	);

	/**
	 * @type {(state: object, entityType: ChecklistEntityType, entityId: number|string) => boolean}
	 */
	const selectHasChecklist = createDraftSafeSelector(
		selectChecklistStats,
		(stats) => (stats.completed + stats.uncompleted) > 0,
	);

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectChecklistsByEntity,
		selectChecklistStats,
		selectHasChecklist,
	};
});
