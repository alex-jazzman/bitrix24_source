/**
 * @module timeman/statemanager/redux/slices/worktime/selector
 */
jn.define('timeman/statemanager/redux/slices/worktime/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName, RecordStatus, FetchStatus, ActionStatus } = require('timeman/statemanager/redux/slices/worktime/meta');

	const selectSlice = (state) => state[sliceName];

	const selectRecord = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.record ?? null,
	);

	const selectRecordId = createDraftSafeSelector(
		selectRecord,
		(record) => record?.id ?? null,
	);

	const selectStatus = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.status ?? RecordStatus.UNKNOWN,
	);

	const selectActions = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.actions ?? {},
	);

	const selectShift = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.shift ?? null,
	);

	const selectSchedule = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.schedule ?? null,
	);

	const selectFetchStatus = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.fetchStatus ?? FetchStatus.IDLE,
	);

	const selectIsOpened = createDraftSafeSelector(
		selectStatus,
		(status) => status === RecordStatus.OPENED,
	);

	const selectIsPaused = createDraftSafeSelector(
		selectStatus,
		(status) => status === RecordStatus.PAUSED,
	);

	const selectIsClosed = createDraftSafeSelector(
		selectStatus,
		(status) => status === RecordStatus.CLOSED,
	);

	const selectIsLoading = createDraftSafeSelector(
		selectFetchStatus,
		(fetchStatus) => fetchStatus === FetchStatus.LOADING,
	);

	const selectIsLoaded = createDraftSafeSelector(
		selectFetchStatus,
		(fetchStatus) => fetchStatus === FetchStatus.LOADED,
	);

	const selectDuration = createDraftSafeSelector(
		selectRecord,
		(record) => record?.duration ?? 0,
	);

	const selectBreakLength = createDraftSafeSelector(
		selectRecord,
		(record) => record?.breakLength ?? 0,
	);

	const selectIsExpired = createDraftSafeSelector(
		selectStatus,
		(status) => status === RecordStatus.EXPIRED,
	);

	const selectStartTime = createDraftSafeSelector(
		selectRecord,
		(record) => record?.startTime ?? null,
	);

	const selectEndTime = createDraftSafeSelector(
		selectRecord,
		(record) => record?.endTime ?? null,
	);

	const selectRecommendedCloseTimestamp = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.recommendedCloseTimestamp ?? null,
	);

	const selectIsCompleted = createDraftSafeSelector(
		selectIsClosed,
		selectActions,
		(isClosed, actions) => isClosed && (actions.canReopen || (!actions.canStart && !actions.canReopen)),
	);

	const selectCanStart = createDraftSafeSelector(
		selectIsClosed,
		selectActions,
		(isClosed, actions) => isClosed && actions.canStart,
	);

	const selectActionStatus = createDraftSafeSelector(
		selectSlice,
		(slice) => slice?.actionStatus ?? ActionStatus.IDLE,
	);

	const selectIsActionPending = createDraftSafeSelector(
		selectActionStatus,
		(actionStatus) => actionStatus === ActionStatus.PENDING,
	);

	const selectWorkdayState = (() => {
		const { WorkdayState } = require('timeman/const');

		return createDraftSafeSelector(
			selectIsExpired,
			selectIsOpened,
			selectIsPaused,
			selectIsClosed,
			selectActions,
			(isExpired, isOpened, isPaused, isClosed, actions) => {
				if (isExpired)
				{
					return WorkdayState.EXPIRED;
				}

				if (isOpened)
				{
					return WorkdayState.OPENED;
				}

				if (isPaused)
				{
					return WorkdayState.PAUSED;
				}

				if (isClosed)
				{
					return (actions.canStart && !actions.canReopen) ? WorkdayState.NOT_STARTED : WorkdayState.CLOSED;
				}

				return WorkdayState.NOT_STARTED;
			},
		);
	})();

	module.exports = {
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
	};
});
