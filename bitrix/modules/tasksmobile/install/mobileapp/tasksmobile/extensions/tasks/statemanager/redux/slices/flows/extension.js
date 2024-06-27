/**
 * @module tasks/statemanager/redux/slices/flows
 */
jn.define('tasks/statemanager/redux/slices/flows', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, entityAdapter } = require('tasks/statemanager/redux/slices/flows/meta');
	const { flowsSelector } = require('tasks/statemanager/redux/slices/flows/selector');

	const flowsInitialState = [];
	const emptyInitialState = entityAdapter.getInitialState();
	const filledState = entityAdapter.upsertMany(emptyInitialState, flowsInitialState);

	const prepareFlow = ({
		id,
		ownerId,
		creatorId,
		groupId,
		templateId,
		efficiency,
		active,
		demo,
		enableFlowUrl,
		plannedCompletionTime,
		plannedCompletionTimeText,
		averagePendingTime,
		averageAtWorkTime,
		averageCompletedTime,
		name,
		distributionType,
		taskCreators,
		taskAssignees,
		pending,
		atWork,
		completed,
		myTasksTotal,
		myTasksCounter,
		activity,
		description,
		responsibleQueue,
		manualDistributorId,
		responsibleCanChangeDeadline,
		matchWorkTime,
		notifyAtHalfTime,
		notifyOnQueueOverflow,
		notifyOnTasksInProgressOverflow,
		notifyWhenEfficiencyDecreases,
	}) => ({
		id: Number(id),
		ownerId,
		creatorId,
		groupId,
		templateId,
		efficiency,
		efficiencySuccess: Number(efficiency) >= 70,
		active,
		demo,
		enableFlowUrl,
		plannedCompletionTime,
		plannedCompletionTimeText,
		averagePendingTime,
		averageAtWorkTime,
		averageCompletedTime,
		name,
		distributionType,
		taskCreators,
		taskAssignees,
		pending,
		atWork,
		completed,
		myTasksTotal,
		myTasksCounter,
		activity,
		description,
		responsibleQueue,
		manualDistributorId,
		responsibleCanChangeDeadline,
		matchWorkTime,
		notifyAtHalfTime,
		notifyOnQueueOverflow,
		notifyOnTasksInProgressOverflow,
		notifyWhenEfficiencyDecreases,
	});

	const flowsSlice = createSlice({
		name: sliceName,
		initialState: filledState,
		reducers: {
			flowsUpserted: {
				reducer: entityAdapter.upsertMany,
				prepare: (flows) => ({
					payload: flows.map((flow) => prepareFlow(flow)),
				}),
			},
			flowsAdded: {
				reducer: entityAdapter.addMany,
				prepare: (flows) => ({
					payload: flows.map((flow) => prepareFlow(flow)),
				}),
			},
		},
	});

	const { reducer, actions } = flowsSlice;
	const { flowsUpserted, flowsAdded } = actions;

	ReducerRegistry.register(sliceName, reducer);

	module.exports = {
		flowsReducer: reducer,
		flowsSelector,
		flowsUpserted,
		flowsAdded,
	};
});
