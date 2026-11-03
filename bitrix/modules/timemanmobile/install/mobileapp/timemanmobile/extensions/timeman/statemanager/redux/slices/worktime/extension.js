/**
 * @module timeman/statemanager/redux/slices/worktime
 */
jn.define('timeman/statemanager/redux/slices/worktime', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, initialState, RecordStatus, FetchStatus, ActionStatus } = require('timeman/statemanager/redux/slices/worktime/meta');
	const {
		selectRecord,
		selectRecordId,
		selectStatus,
		selectActions,
		selectShift,
		selectSchedule,
		selectFetchStatus,
		selectIsOpened,
		selectIsPaused,
		selectIsClosed,
		selectIsLoading,
		selectIsLoaded,
		selectDuration,
		selectBreakLength,
		selectIsExpired,
		selectStartTime,
		selectEndTime,
		selectRecommendedCloseTimestamp,
		selectIsCompleted,
		selectCanStart,
		selectActionStatus,
		selectIsActionPending,
		selectWorkdayState,
	} = require('timeman/statemanager/redux/slices/worktime/selector');
	const {
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,
	} = require('timeman/statemanager/redux/slices/worktime/thunk');
	const {
		prepareRecord,
		prepareState,
		prepareShift,
		prepareSchedule,
	} = require('timeman/statemanager/redux/slices/worktime/utils');
	const {
		fetchCurrentRecordPending,
		fetchCurrentRecordFulfilled,
		fetchCurrentRecordRejected,
		workdayActionPending,
		workdayActionRejected,
		startWorkdayFulfilled,
		pauseWorkdayFulfilled,
		continueWorkdayFulfilled,
		stopWorkdayFulfilled,
	} = require('timeman/statemanager/redux/slices/worktime/extra-reducer');
	const { initSubscriptions } = require('timeman/statemanager/redux/slices/worktime/subscription');

	const worktimeSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			worktimeRecordSet: {
				reducer: (state, { payload }) => {
					state.record = payload.record;
					state.status = payload.status;
					state.actions = payload.actions;
					state.shift = payload.shift;
					state.schedule = payload.schedule;
				},
				prepare: (data) => {
					const { status, actions } = prepareState(data);

					return {
						payload: {
							record: prepareRecord(data),
							status,
							actions,
							shift: prepareShift(data),
							schedule: prepareSchedule(data),
						},
					};
				},
			},
			worktimeRecordCleared: (state) => {
				state.record = initialState.record;
				state.status = initialState.status;
				state.actions = initialState.actions;
				state.shift = initialState.shift;
				state.schedule = initialState.schedule;
				state.fetchStatus = FetchStatus.IDLE;
				state.actionStatus = ActionStatus.IDLE;
				state.recommendedCloseTimestamp = null;
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(fetchCurrentRecord.pending, fetchCurrentRecordPending)
				.addCase(fetchCurrentRecord.fulfilled, fetchCurrentRecordFulfilled)
				.addCase(fetchCurrentRecord.rejected, fetchCurrentRecordRejected)
				.addCase(startWorkday.pending, workdayActionPending)
				.addCase(startWorkday.fulfilled, startWorkdayFulfilled)
				.addCase(startWorkday.rejected, workdayActionRejected)
				.addCase(pauseWorkday.pending, workdayActionPending)
				.addCase(pauseWorkday.fulfilled, pauseWorkdayFulfilled)
				.addCase(pauseWorkday.rejected, workdayActionRejected)
				.addCase(continueWorkday.pending, workdayActionPending)
				.addCase(continueWorkday.fulfilled, continueWorkdayFulfilled)
				.addCase(continueWorkday.rejected, workdayActionRejected)
				.addCase(stopWorkday.pending, workdayActionPending)
				.addCase(stopWorkday.fulfilled, stopWorkdayFulfilled)
				.addCase(stopWorkday.rejected, workdayActionRejected);
		},
	});

	const {
		worktimeRecordSet,
		worktimeRecordCleared,
	} = worktimeSlice.actions;

	const { reducer } = worktimeSlice;

	ReducerRegistry.register(sliceName, reducer);

	initSubscriptions(worktimeRecordSet);

	// TODO: remove subscribeToWorkDayState
	const { subscribe, getState } = require('statemanager/redux/store');

	/**
	 * Subscribe to workday state changes.
	 * Fires callback synchronously with current state, then on every relevant store change.
	 *
	 * @param {Function} callback - receives WorkdayState value
	 * @return {Function} unsubscribe
	 */
	function subscribeToWorkDayState(callback)
	{
		let prevWorkdayState = null;
		let prevRecord = null;

		const check = () => {
			const state = getState();
			const workdayState = selectWorkdayState(state);
			const record = selectRecord(state);

			if (workdayState !== prevWorkdayState || record !== prevRecord)
			{
				prevWorkdayState = workdayState;
				prevRecord = record;
				callback(workdayState);
			}
		};

		check();

		return subscribe(check);
	}

	module.exports = {
		worktimeReducer: reducer,
		selectRecord,
		selectRecordId,
		selectStatus,
		selectActions,
		selectShift,
		selectSchedule,
		selectFetchStatus,
		selectIsOpened,
		selectIsPaused,
		selectIsClosed,
		selectIsLoading,
		selectIsLoaded,
		selectDuration,
		selectBreakLength,
		selectIsExpired,
		selectStartTime,
		selectEndTime,
		selectRecommendedCloseTimestamp,
		selectIsCompleted,
		selectCanStart,
		selectActionStatus,
		selectIsActionPending,
		selectWorkdayState,
		worktimeRecordSet,
		worktimeRecordCleared,
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,
		subscribeToWorkDayState,
		RecordStatus,
		FetchStatus,
		ActionStatus,
	};
});
