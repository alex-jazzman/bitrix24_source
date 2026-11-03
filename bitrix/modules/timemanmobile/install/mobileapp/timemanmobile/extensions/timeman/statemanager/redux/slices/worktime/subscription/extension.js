/**
 * @module timeman/statemanager/redux/slices/worktime/subscription
 */
jn.define('timeman/statemanager/redux/slices/worktime/subscription', (require, exports, module) => {
	const { dispatch, getState } = require('statemanager/redux/store');
	const { RecordStatus } = require('timeman/statemanager/redux/slices/worktime/meta');
	const {
		selectRecord,
		selectShift,
		selectSchedule,
	} = require('timeman/statemanager/redux/slices/worktime/selector');
	const { fetchCurrentRecord } = require('timeman/statemanager/redux/slices/worktime/thunk');
	const { debounce } = require('utils/function');

	const DEBOUNCE_DELAY = 500;
	const APP_ACTIVE_REFETCH_DELAY = 1000;

	const WORKTIME_COMMANDS = new Set([
		'start',
		'pause',
		'continue',
		'stop',
		'relaunch',
		'edit',
		'approve',
	]);

	const STATE_MAP = {
		OPENED: RecordStatus.OPENED,
		PAUSED: RecordStatus.PAUSED,
		CLOSED: RecordStatus.CLOSED,
		EXPIRED: RecordStatus.EXPIRED,
	};

	const toTimestamp = (value) => {
		const timestamp = Number(value);

		return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
	};

	const toSeconds = (value) => {
		if (value === null || value === undefined || value === '')
		{
			return null;
		}

		const seconds = Number(value);

		return Number.isFinite(seconds) ? seconds : null;
	};

	/**
	 * @param {Function} worktimeRecordSet
	 */
	const initSubscriptions = (worktimeRecordSet) => {
		const applyPullData = (params) => {
			const info = params?.info;
			if (!info)
			{
				return;
			}

			const { entityId } = params;
			const state = getState();
			const currentRecord = selectRecord(state);

			const status = STATE_MAP[info.state] ?? RecordStatus.UNKNOWN;
			const isOpened = status === RecordStatus.OPENED;
			const isPaused = status === RecordStatus.PAUSED;
			const isClosed = status === RecordStatus.CLOSED;
			const isExpired = status === RecordStatus.EXPIRED;

			// legacy DURATION is filled only when the day is closed, so an active day keeps the known duration
			const pullDuration = isClosed ? toSeconds(info.duration) : null;

			dispatch(worktimeRecordSet({
				id: entityId ?? currentRecord?.id,
				userId: currentRecord?.userId ?? env.userId,
				startTime: toTimestamp(info.dateStart) ?? currentRecord?.startTime ?? null,
				endTime: toTimestamp(info.dateFinish),
				duration: pullDuration ?? currentRecord?.duration ?? null,
				breakLength: toSeconds(info.timeLeaks) ?? currentRecord?.breakLength ?? null,
				isApproved: currentRecord?.isApproved ?? false,
				state: {
					status,
					actions: {
						// canOpen names the main action of a closed day: OPEN starts a new one, REOPEN returns to the last one
						canStart: isClosed && info.canOpen === 'OPEN',
						canPause: isOpened,
						canStop: isOpened || isPaused || isExpired,
						canContinue: isPaused,
						canReopen: isClosed && info.canOpen === 'REOPEN',
						canEdit: false,
					},
				},
				shift: selectShift(state),
				schedule: selectSchedule(state),
			}));
		};

		const applyPullDataDebounced = debounce((params) => {
			applyPullData(params);
		}, DEBOUNCE_DELAY);

		const handlePullEvent = (data) => {
			// the legacy web widget pushes its own event for the same command with an uppercase payload;
			// it is dropped here so that it cannot replace the actual update inside the debounce window
			if (!WORKTIME_COMMANDS.has(data.command) || !data.params?.info)
			{
				return;
			}

			applyPullDataDebounced(data.params);
		};

		BX.addCustomEvent('onPullEvent-timeman', (command, params) => {
			handlePullEvent({ command, params });
		});

		BX.addCustomEvent('onAppActive', () => {
			setTimeout(() => {
				dispatch(fetchCurrentRecord());
			}, APP_ACTIVE_REFETCH_DELAY);
		});
	};

	module.exports = {
		initSubscriptions,
	};
});
