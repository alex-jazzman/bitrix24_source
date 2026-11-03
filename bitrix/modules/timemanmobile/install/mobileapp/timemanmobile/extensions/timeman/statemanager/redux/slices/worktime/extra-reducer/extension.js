/**
 * @module timeman/statemanager/redux/slices/worktime/extra-reducer
 */
jn.define('timeman/statemanager/redux/slices/worktime/extra-reducer', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { RecordStatus, FetchStatus, ActionStatus } = require('timeman/statemanager/redux/slices/worktime/meta');
	const {
		getNowTimestamp,
		prepareRecord,
		prepareState,
		prepareShift,
		prepareSchedule,
	} = require('timeman/statemanager/redux/slices/worktime/utils');

	// pause start comes from pull events only; the rest action leaves it empty,
	// so it is restored as startTime + duration + breakLength
	const calculateCurrentBreak = (record, nowSec) => {
		if (Number.isFinite(record?.endTime))
		{
			return Math.max(0, nowSec - record.endTime);
		}

		if (!Number.isFinite(record?.startTime) || !Number.isFinite(record?.duration))
		{
			return 0;
		}

		return Math.max(0, nowSec - record.startTime - record.duration - (record.breakLength ?? 0));
	};

	const calculateWorkedDuration = (record, nowSec) => {
		if (!Number.isFinite(record?.startTime))
		{
			return record?.duration ?? 0;
		}

		return Math.max(0, nowSec - record.startTime - (record.breakLength ?? 0));
	};

	const fetchCurrentRecordPending = (state) => {
		state.fetchStatus = FetchStatus.LOADING;
	};

	const fetchCurrentRecordFulfilled = (state, { payload }) => {
		const { record: data } = payload;
		const { status, actions } = prepareState(data);

		state.record = prepareRecord(data);
		state.status = status;
		state.actions = actions;
		state.shift = prepareShift(data);
		state.schedule = prepareSchedule(data);
		state.fetchStatus = FetchStatus.LOADED;
		state.recommendedCloseTimestamp = data?.state?.recommendedCloseTime ?? null;
	};

	const fetchCurrentRecordRejected = (state) => {
		state.fetchStatus = FetchStatus.ERROR;
	};

	const workdayActionPending = (state) => {
		state.actionStatus = ActionStatus.PENDING;
	};

	const workdayActionRejected = (state) => {
		state.actionStatus = ActionStatus.ERROR;
	};

	const startWorkdayFulfilled = (state) => {
		const nowSec = getNowTimestamp();

		state.record = {
			...state.record,
			id: state.record?.id ?? 0,
			userId: state.record?.userId ?? 0,
			startTime: nowSec,
			endTime: null,
			duration: 0,
			breakLength: 0,
			isApproved: false,
		};
		state.status = RecordStatus.OPENED;
		state.actions = {
			canStart: false,
			canPause: true,
			canStop: true,
			canContinue: false,
			canReopen: false,
			canEdit: false,
		};
		state.actionStatus = ActionStatus.IDLE;
	};

	const pauseWorkdayFulfilled = (state) => {
		const nowSec = getNowTimestamp();

		if (state.record)
		{
			state.record.duration = calculateWorkedDuration(state.record, nowSec);
			state.record.endTime = nowSec;
		}
		state.status = RecordStatus.PAUSED;
		state.actions = {
			canStart: false,
			canPause: false,
			canStop: true,
			canContinue: true,
			canReopen: false,
			canEdit: false,
		};
		state.actionStatus = ActionStatus.IDLE;
	};

	const continueWorkdayFulfilled = (state) => {
		const nowSec = getNowTimestamp();

		if (state.record)
		{
			const pauseDuration = calculateCurrentBreak(state.record, nowSec);

			state.record.breakLength = (state.record.breakLength ?? 0) + pauseDuration;
			state.record.endTime = null;
		}
		state.status = RecordStatus.OPENED;
		state.actions = {
			canStart: false,
			canPause: true,
			canStop: true,
			canContinue: false,
			canReopen: false,
			canEdit: false,
		};
		state.actionStatus = ActionStatus.IDLE;
	};

	const stopWorkdayFulfilled = (state) => {
		const nowSec = getNowTimestamp();

		if (state.record)
		{
			const wasPaused = state.status === RecordStatus.PAUSED;
			const extraBreak = wasPaused ? calculateCurrentBreak(state.record, nowSec) : 0;
			const newBreakLength = (state.record.breakLength ?? 0) + extraBreak;

			state.record.endTime = nowSec;
			state.record.breakLength = newBreakLength;
			state.record.duration = state.record.startTime
				? nowSec - state.record.startTime - newBreakLength
				: 0;
		}
		state.status = RecordStatus.CLOSED;
		state.actions = {
			canStart: false,
			canPause: false,
			canStop: false,
			canContinue: false,
			canReopen: true,
			canEdit: false,
		};
		state.actionStatus = ActionStatus.IDLE;
	};

	module.exports = {
		fetchCurrentRecordPending,
		fetchCurrentRecordFulfilled,
		fetchCurrentRecordRejected,
		workdayActionPending,
		workdayActionRejected,
		startWorkdayFulfilled,
		pauseWorkdayFulfilled,
		continueWorkdayFulfilled,
		stopWorkdayFulfilled,
	};
});
