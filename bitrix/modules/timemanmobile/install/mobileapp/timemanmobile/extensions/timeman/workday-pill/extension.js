/**
 * @module timeman/workday-pill
 */
jn.define('timeman/workday-pill', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { WorkDayPillShimmer } = require('timeman/workday-pill/src/ui/pill-shimmer');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Icon } = require('ui-system/blocks/icon');
	const { inAppUrl } = require('in-app-url');
	const { Loc } = require('loc');
	const { connect } = require('statemanager/redux/connect');
	const { getFeatureFlags, FeatureFlagType } = require('feature-flag');
	const { showErrorToast } = require('toast');
	const { WorkdayState } = require('timeman/const');
	const { WorkdayAnalytics } = require('timeman/analytics/workday-analytics');
	const {
		selectWorkdayState,
		selectRecord,
		selectRecordId,
		selectBreakLength,
		selectDuration,
		selectShift,
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,
		subscribeToWorkDayState,
	} = require('timeman/statemanager/redux/slices/worktime');
	const { DailyReportBox } = require('timeman/work-reports/submit/daily');
	const { PillView } = require('timeman/workday-pill/src/ui/pill-view');

	function computeDuration(workdayState, { startTime, breakLength, duration, workTimeEnd })
	{
		if (workdayState === WorkdayState.NOT_STARTED)
		{
			return 0;
		}

		if (workdayState === WorkdayState.EXPIRED)
		{
			return workTimeEnd ?? 0;
		}

		if (startTime === null)
		{
			return duration ?? 0;
		}

		const nowSec = Math.floor(Date.now() / 1000);

		if (workdayState === WorkdayState.OPENED)
		{
			return Math.max(0, nowSec - startTime - (breakLength ?? 0));
		}

		if (workdayState === WorkdayState.PAUSED)
		{
			return Math.max(0, nowSec - startTime - (duration ?? 0));
		}

		return duration ?? 0;
	}

	const NEXT_STATE_BY_ACTION = new Map([
		[startWorkday, WorkdayState.OPENED],
		[pauseWorkday, WorkdayState.PAUSED],
		[continueWorkday, WorkdayState.OPENED],
		[stopWorkday, WorkdayState.CLOSED],
	]);

	const MENU_ACTIONS_BY_STATE = {
		[WorkdayState.NOT_STARTED]: ({ onDispatch }) => [
			{
				id: 'start',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_START'),
				icon: Icon.PLAY,
				onItemSelected: () => onDispatch(startWorkday),
			},
		],
		[WorkdayState.OPENED]: ({ onDispatch, onStop }) => [
			{
				id: 'pause',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_PAUSE'),
				icon: Icon.PAUSE,
				onItemSelected: () => onDispatch(pauseWorkday),
			},
			{
				id: 'stop',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_STOP'),
				icon: Icon.POWER,
				onItemSelected: () => onStop(),
			},
		],
		[WorkdayState.PAUSED]: ({ onDispatch, onStop }) => [
			{
				id: 'continue',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_CONTINUE'),
				icon: Icon.PLAY,
				onItemSelected: () => onDispatch(continueWorkday),
			},
			{
				id: 'stop',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_STOP'),
				icon: Icon.POWER,
				onItemSelected: () => onStop(),
			},
		],
		[WorkdayState.CLOSED]: ({ onDispatch }) => [
			{
				id: 'reopen',
				title: Loc.getMessage('M_TIMEMAN_WORK_DAY_ACTION_REOPEN'),
				icon: Icon.REFRESH,
				onItemSelected: () => onDispatch(continueWorkday),
			},
		],
	};

	class WorkDayPill extends LayoutComponent
	{
		#liveTimer = null;
		#enabledDailyReportBox = false;

		constructor(props)
		{
			super(props);

			this.state = {
				now: Date.now(),
				isActionLoading: false,
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'work-day-pill',
				context: this,
			});
		}

		componentDidMount()
		{
			this.props.onStateChanged?.(this.props.workdayState);

			getFeatureFlags()
				.then(({ data }) => {
					const isEnabled = data[FeatureFlagType.WORK_REPORTS] && data[FeatureFlagType.WORK_REPORTS_WITH_AI];
					this.#enabledDailyReportBox = Boolean(DailyReportBox && isEnabled);
				})
				.catch(console.error);
		}

		componentWillReceiveProps(nextProps)
		{
			if (nextProps.workdayState !== this.props.workdayState)
			{
				nextProps.onStateChanged?.(nextProps.workdayState);
			}
		}

		componentWillUnmount()
		{
			if (this.#liveTimer)
			{
				clearInterval(this.#liveTimer);
				this.#liveTimer = null;
			}
		}

		#pillRef = null;

		#setActionLoading(loading)
		{
			this.setState({ isActionLoading: loading });
		}

		#updateLiveTimer(workdayState)
		{
			const needsTimer = workdayState === WorkdayState.OPENED || workdayState === WorkdayState.PAUSED;

			if (needsTimer && !this.#liveTimer)
			{
				this.#liveTimer = setInterval(() => this.setState({ now: Date.now() }), 1000);
			}
			else if (!needsTimer && this.#liveTimer)
			{
				clearInterval(this.#liveTimer);
				this.#liveTimer = null;
			}
		}

		#handlePress = () => {
			const { workdayState } = this.props;

			if (workdayState === WorkdayState.EXPIRED)
			{
				inAppUrl.open('/timeman/work.time');

				return;
			}

			const factory = MENU_ACTIONS_BY_STATE[workdayState];
			if (factory)
			{
				const actions = factory({
					onDispatch: (thunk) => this.#dispatchAction(thunk),
					onStop: () => this.#stopWorkday(),
				});
				new PopupMenu(actions).show({ target: this.#pillRef });
			}
		};

		async #dispatchAction(thunk)
		{
			this.#setActionLoading(true);
			const prevState = this.props.workdayState;
			try
			{
				await this.props.dispatch(thunk()).unwrap();
				this.#sendStateChangeAnalytics(prevState, NEXT_STATE_BY_ACTION.get(thunk));
			}
			catch (error)
			{
				console.error(error);
			}
			finally
			{
				await this.props.dispatch(fetchCurrentRecord());
				this.#setActionLoading(false);
			}
		}

		#sendStateChangeAnalytics(prevState, newState)
		{
			const { section, element } = this.props.analytics ?? {};
			if (!section)
			{
				return;
			}

			WorkdayAnalytics.handleStateChange(prevState, newState, section, element);
		}

		async #stopWorkday()
		{
			if (!this.#enabledDailyReportBox)
			{
				this.#dispatchAction(stopWorkday);

				return;
			}

			this.#setActionLoading(true);
			const closedRecordId = this.props.recordId;
			const prevState = this.props.workdayState;
			const { section } = this.props.analytics ?? {};
			try
			{
				await DailyReportBox.open({
					...(section ? { analytics: { section, element: 'day_summary' } } : {}),
					prepareRequest: async () => {
						await this.props.dispatch(stopWorkday()).unwrap();
						this.#sendStateChangeAnalytics(prevState, WorkdayState.CLOSED);
						const { payload } = await this.props.dispatch(fetchCurrentRecord());
						const record = payload?.record;

						if (closedRecordId)
						{
							return { recordId: closedRecordId };
						}

						return {
							dateFilter: {
								from: record?.startTime ? new Date(record.startTime * 1000) : undefined,
								to: record?.endTime ? new Date(record.endTime * 1000) : new Date(),
							},
						};
					},
				});
			}
			catch (error)
			{
				if (error?.code === 'ERROR_FOR_USER' && error.message)
				{
					showErrorToast({ message: error.message });
				}
				else
				{
					showErrorToast();
					console.error('DailyReportBox failed', error);
				}
			}
			finally
			{
				this.#setActionLoading(false);
			}
		}

		render()
		{
			const { workdayState, startTime, breakLength, duration: storeDuration, workTimeEnd } = this.props;
			const duration = computeDuration(workdayState, { startTime, breakLength, duration: storeDuration, workTimeEnd });

			this.#updateLiveTimer(workdayState);

			return PillView({
				testId: this.getTestId('view'),
				widgetState: workdayState,
				duration,
				loading: this.state.isActionLoading,
				onPress: this.#handlePress,
				forwardRef: (ref) => {
					this.#pillRef = ref;
				},
			});
		}
	}

	const mapStateToProps = (state) => {
		return {
			workdayState: selectWorkdayState(state),
			recordId: selectRecordId(state),
			startTime: selectRecord(state)?.startTime ?? null,
			breakLength: selectBreakLength(state) ?? 0,
			duration: selectDuration(state) ?? 0,
			workTimeEnd: selectShift(state)?.workTimeEnd ?? 0,
		};
	};

	module.exports = {
		WorkDayPill: connect(mapStateToProps)(WorkDayPill),
		WorkDayPillShimmer,
		WorkdayState,
		subscribeToWorkDayState,
	};
});
