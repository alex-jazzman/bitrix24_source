/**
 * @module timeman/statemanager/redux/slices/worktime/meta
 */
jn.define('timeman/statemanager/redux/slices/worktime/meta', (require, exports, module) => {
	const sliceName = 'timeman:worktime';

	const RecordStatus = Object.freeze({
		OPENED: 'opened',
		PAUSED: 'paused',
		CLOSED: 'closed',
		EXPIRED: 'expired',
		UNKNOWN: 'unknown',
	});

	const FetchStatus = Object.freeze({
		IDLE: 'idle',
		LOADING: 'loading',
		LOADED: 'loaded',
		ERROR: 'error',
	});

	const ActionStatus = Object.freeze({
		IDLE: 'idle',
		PENDING: 'pending',
		ERROR: 'error',
	});

	const defaultState = {
		record: null,
		status: RecordStatus.UNKNOWN,
		actions: {
			canStart: false,
			canPause: false,
			canStop: false,
			canContinue: false,
			canReopen: false,
			canEdit: false,
		},
		shift: null,
		schedule: null,
		fetchStatus: FetchStatus.IDLE,
		actionStatus: ActionStatus.IDLE,
		recommendedCloseTimestamp: null,
	};

	module.exports = {
		sliceName,
		initialState: defaultState,
		RecordStatus,
		FetchStatus,
		ActionStatus,
	};
});
