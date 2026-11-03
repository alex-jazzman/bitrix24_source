/**
 * @module timeman/statemanager/redux/slices/worktime/utils
 */
jn.define('timeman/statemanager/redux/slices/worktime/utils', (require, exports, module) => {
	const { initialState, RecordStatus } = require('timeman/statemanager/redux/slices/worktime/meta');

	const getNowTimestamp = () => Math.floor(Date.now() / 1000);

	const prepareRecord = (data) => {
		if (!data)
		{
			return null;
		}

		return {
			id: Number(data.id),
			userId: Number(data.userId),
			startTime: data.startTime ?? null,
			endTime: data.endTime ?? null,
			duration: data.duration ?? null,
			breakLength: data.breakLength ?? null,
			isApproved: Boolean(data.isApproved),
		};
	};

	const resolveStatus = (status, actions) => {
		const isExpiredOpened = status === RecordStatus.OPENED
			&& !actions.canPause
			&& !actions.canContinue
			&& !actions.canStart;
		const isExpiredPaused = status === RecordStatus.PAUSED && !actions.canContinue;

		return (isExpiredOpened || isExpiredPaused) ? RecordStatus.EXPIRED : status;
	};

	const prepareState = (data) => {
		if (!data?.state)
		{
			return {
				status: initialState.status,
				actions: initialState.actions,
			};
		}

		const { state } = data;
		const actions = {
			canStart: Boolean(state.actions?.canStart),
			canPause: Boolean(state.actions?.canPause),
			canStop: Boolean(state.actions?.canStop),
			canContinue: Boolean(state.actions?.canContinue),
			canReopen: Boolean(state.actions?.canReopen),
			canEdit: Boolean(state.actions?.canEdit),
		};

		return {
			status: resolveStatus(state.status ?? RecordStatus.UNKNOWN, actions),
			actions,
		};
	};

	const toSecondsTimestamp = (value) => {
		if (!value)
		{
			return null;
		}

		if (typeof value === 'number')
		{
			return value;
		}

		return Math.floor(new Date(value).getTime() / 1000) || null;
	};

	const prepareShift = (data) => {
		if (!data?.shift)
		{
			return null;
		}

		const { shift } = data;

		return {
			id: Number(shift.id),
			name: shift.name ?? '',
			workTimeStart: shift.workTimeStart ?? 0,
			workTimeEnd: shift.workTimeEnd ?? 0,
			start: toSecondsTimestamp(shift.start),
			stop: toSecondsTimestamp(shift.stop),
		};
	};

	const prepareSchedule = (data) => {
		if (!data?.schedule)
		{
			return null;
		}

		const { schedule } = data;

		return {
			id: Number(schedule.id),
			name: schedule.name ?? '',
			type: schedule.type ?? '',
		};
	};

	module.exports = {
		getNowTimestamp,
		prepareRecord,
		prepareState,
		prepareShift,
		prepareSchedule,
	};
});
