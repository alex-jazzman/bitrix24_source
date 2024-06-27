/**
 * @module tasks/statemanager/redux/slices/stage-settings/src/selector
 */
jn.define('tasks/statemanager/redux/slices/stage-settings/src/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const {
		sliceName,
		adapter,
	} = require('tasks/statemanager/redux/slices/stage-settings/meta');

	const {
		selectById,
		selectEntities,
	} = adapter.getSelectors((state) => state[sliceName]);

	const selectByViewAndProjectId = createDraftSafeSelector(
		selectEntities,
		(state, viewAndProject) => viewAndProject,
		(stages, viewAndProject) => Object.values(stages).filter(
			(item) => item.view === viewAndProject.view && item.projectId === viewAndProject.projectId,
		),
	);

	const selectFirstStage = createDraftSafeSelector(
		(state, stageIds) => Object.values(selectEntities(state)).filter((stage) => stageIds.includes(stage.id)),
		(stages) => {
			const minSort = Math.min(...stages.map((stage) => stage.sort));

			return stages.find((stage) => stage.sort === minSort);
		},
	);

	module.exports = {
		selectById,
		selectEntities,
		selectByViewAndProjectId,
		selectFirstStage,
	};
});
