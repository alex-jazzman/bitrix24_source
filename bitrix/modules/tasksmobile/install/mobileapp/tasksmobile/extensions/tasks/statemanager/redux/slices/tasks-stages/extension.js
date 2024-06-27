/**
 * @module tasks/statemanager/redux/slices/tasks-stages
 */
jn.define('tasks/statemanager/redux/slices/tasks-stages', (require, exports, module) => {
	const { StateCache } = require('statemanager/redux/state-cache');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice, createEntityAdapter, createAction } = require('statemanager/redux/toolkit');

	const sliceName = 'tasks:tasksStages';

	const selectId = ({ taskId, viewMode, userId }) => `${taskId}_${viewMode}_${userId}`;

	const entityAdapter = createEntityAdapter({ selectId });
	const initialState = StateCache.getReducerState(sliceName, entityAdapter.getInitialState());

	const { selectById } = entityAdapter.getSelectors((state) => state[sliceName]);

	/**
	 * @public
	 * @param {object} state
	 * @param {number} taskId
	 * @param {string} viewMode
	 * @param {number} userId
	 * @return {{ stageId: number, canMoveStage: boolean} | undefined}
	 */
	const selectTaskStage = (state, taskId, viewMode, userId = Number(env.userId)) => {
		const id = selectId({ taskId, viewMode, userId });

		return selectById(state, id);
	};

	const selectTaskStageByTaskIdOrGuid = (state, taskId, taskGuid, viewMode, userId = Number(env.userId)) => {
		return (
			selectTaskStage(state, taskId, viewMode, userId)
			|| selectTaskStage(state, taskGuid, viewMode, userId)
		);
	};

	/**
	 * @public
	 * @param {object} state
	 * @param {number} taskId
	 * @param {string} viewMode
	 * @param {number} userId
	 * @return {number|undefined}
	 */
	const selectTaskStageId = (state, taskId, viewMode, userId = env.userId) => {
		const { stageId } = selectTaskStage(state, taskId, viewMode, userId) || {};

		return stageId;
	};

	const setTaskStage = createAction(`${sliceName}/setTaskStage`);

	const tasksStagesSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			taskStageUpserted: {
				reducer: entityAdapter.upsertMany,
			},
			taskStageAdded: {
				reducer: entityAdapter.addMany,
			},
		},
		extraReducers: (builder) => {
			builder.addCase(setTaskStage, (state, action) => {
				const { taskId, viewMode, userId, nextStageId: stageId } = action.payload;

				entityAdapter.upsertOne(state, {
					taskId,
					viewMode,
					userId,
					stageId,
				});
			});
		},
	});

	const { taskStageUpserted, taskStageAdded } = tasksStagesSlice.actions;

	ReducerRegistry.register(sliceName, tasksStagesSlice.reducer);

	module.exports = {
		taskStageUpserted,
		taskStageAdded,
		selectTaskStage,
		selectTaskStageByTaskIdOrGuid,
		selectTaskStageId,
		setTaskStage,
	};
});
