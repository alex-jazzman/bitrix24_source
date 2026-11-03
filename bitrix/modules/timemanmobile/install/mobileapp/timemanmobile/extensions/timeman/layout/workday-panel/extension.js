/**
 * @module timeman/layout/workday-panel
 */
jn.define('timeman/layout/workday-panel', (require, exports, module) => {
	const { Alert } = require('alert');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Indent, Color, Corner } = require('tokens');
	const { Loc } = require('loc');
	const { inAppUrl } = require('in-app-url');

	const { formatHHMMSS } = require('utils/time');

	const { Text3, Text4 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');

	const { connect } = require('statemanager/redux/connect');
	const { getState, subscribe } = require('statemanager/redux/store');
	const { isEqual } = require('utils/object');

	const { getFeatureFlags, FeatureFlagType } = require('feature-flag');
	const { showErrorToast } = require('toast');

	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { Line } = require('utils/skeleton');
	const { PureComponent } = require('layout/pure-component');

	const { DailyReportBox } = require('timeman/work-reports/submit/daily');

	const {
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,

		selectRecord,
		selectRecordId,
		selectStatus,
		selectIsOpened,
		selectIsPaused,
		selectIsClosed,
		selectIsExpired,
		selectIsCompleted,
		selectCanStart,
		selectStartTime,
		selectEndTime,
		selectBreakLength,
		selectDuration,
		selectIsActionPending,
		selectFetchStatus,
		selectRecommendedCloseTimestamp,

		RecordStatus,
		FetchStatus,
	} = require('timeman/statemanager/redux/slices/worktime');

	const SECONDS_TO_MS = 1000;

	/**
	 * @class WorkdayPanel
	 */
	class WorkdayPanel extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				now: Date.now(),
				isReportSubmitting: false,
				worktime: selectWorktime(getState()),
			};

			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});

			this.openWorkTime = this.openWorkTime.bind(this);
			this.handleCloseWorkTime = this.handleCloseWorkTime.bind(this);
			this.refetch = this.refetch.bind(this);
			this.syncWorktime = this.syncWorktime.bind(this);

			this.enabledDailyReportBox = false;
		}

		componentDidMount()
		{
			this.unsubscribeFromStore = subscribe(this.syncWorktime);
			this.syncWorktime();

			if (!selectRecord(getState()))
			{
				this.props.fetchCurrentRecord();
			}

			this.updateLiveTimer();

			getFeatureFlags()
				.then(({ data }) => {
					const isEnabled = data[FeatureFlagType.WORK_REPORTS] && data[FeatureFlagType.WORK_REPORTS_WITH_AI];
					this.enabledDailyReportBox = Boolean(isEnabled);
				})
				.catch(console.error);

			this.props.onComponentMount?.({ refetch: this.refetch });
		}

		componentDidUpdate(prevProps, prevState)
		{
			const statusChanged = prevState.worktime.status !== this.state.worktime.status;

			if (statusChanged)
			{
				this.updateLiveTimer();
			}
		}

		componentWillUnmount()
		{
			this.props.onComponentWillUnmount?.();

			this.unsubscribeFromStore?.();
			this.unsubscribeFromStore = null;

			if (this.liveTimer)
			{
				clearInterval(this.liveTimer);
				this.liveTimer = null;
			}
		}

		refetch()
		{
			this.props.fetchCurrentRecord();
		}

		// the slice is mirrored into state instead of being read from connect props: a Connect re-render
		// with equal props swallows a store update that lands in the same tick and leaves the props stale
		syncWorktime()
		{
			if (!this.unsubscribeFromStore)
			{
				return;
			}

			const worktime = selectWorktime(getState());

			if (!isEqual(worktime, this.state.worktime))
			{
				this.setState({ worktime });
			}
		}

		updateLiveTimer()
		{
			const { isOpened, isPaused } = this.state.worktime;
			const shouldRun = isOpened || isPaused;

			if (shouldRun && !this.liveTimer)
			{
				this.liveTimer = setInterval(() => this.setState({ now: Date.now() }), 1000);
			}
			else if (!shouldRun && this.liveTimer)
			{
				clearInterval(this.liveTimer);
				this.liveTimer = null;
			}
		}

		render()
		{
			const { fetchStatus, record } = this.state.worktime;

			if (
				fetchStatus === FetchStatus.IDLE
				|| (
					!record
					&& fetchStatus === FetchStatus.LOADING
				)
			)
			{
				return this.renderSkelet();
			}

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							flexShrink: 2,
						},
					},
					this.renderIcon(),
					View(
						{
							style: {
								flexShrink: 2,
								marginRight: Indent.XS.toNumber(),
							},
							onClick: this.openWorkTime,
						},
						this.renderHeader(),
						this.renderTimer(),
					),
				),
				this.renderActions(),
			);
		}

		renderSkelet()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						justifyContent: 'space-between',
					},
				},
				View(
					{
						style: {
							width: 40,
							height: 40,
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Line(32, 32, 0, 0, Corner.M.toNumber()),
				),
				View(
					{
						style: {
							flexDirection: 'row',
							flexGrow: 2,
							justifyContent: 'space-between',
						},
					},
					View(
						{
							style: {
								flexDirection: 'column',
								justifyContent: 'space-between',
								marginVertical: Indent.XS2.toNumber(),
							},
						},
						Line(93, 9),
						Line(102, 9),
					),
					Line(115, 36, 0, 0, Corner.M.toNumber()),
				),
			);
		}

		renderIcon()
		{
			if (device.screen.width <= 360)
			{
				return null;
			}

			return View(
				{
					style: {
						width: 40,
						height: 40,
						marginRight: Indent.XS.toNumber(),
					},
					onClick: this.openWorkTime,
				},
				Image({
					testId: this.getTestId('image'),
					uri: makeLibraryImagePath('worktime.png', 'workday-panel', 'timeman'),
					style: {
						width: 44,
						height: 44,
						position: 'absolute',
						top: -2,
						right: -3,
					},
					resizeMode: 'cover',
				}),
			);
		}

		renderHeader()
		{
			return View(
				{
					testId: this.getTestId('header'),
					style: {
						flexShrink: 2,
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Text3({
					testId: this.getTestId('status'),
					text: this.getStatusText(),
					color: Color.base1,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				}),
				IconView({
					testId: this.getTestId('chevron'),
					size: 20,
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base1,
					resizeMode: 'cover',
					style: {
						marginTop: 2,
						width: 10,
						height: 16,
						marginLeft: Indent.XS.toNumber(),
					},
				}),
			);
		}

		getStatusText()
		{
			const { isExpired, isOpened, isPaused, isCompleted } = this.state.worktime;

			if (isExpired)
			{
				return Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TITLE_EXPIRED');
			}

			if (isOpened)
			{
				return Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TITLE_OPENED');
			}

			if (isPaused)
			{
				return Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TITLE_PAUSED');
			}

			if (isCompleted)
			{
				return Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TITLE_CLOSED');
			}

			return Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TITLE_START');
		}

		renderTimer()
		{
			const { status, canStartWorkday } = this.state.worktime;

			if (
				!status
				|| status === RecordStatus.UNKNOWN
				|| canStartWorkday
			)
			{
				return Text4({
					testId: this.getTestId('timer-placeholder'),
					text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TIME_PLACEHOLDER'),
					color: Color.base3,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						flexShrink: 2,
					},
				});
			}

			return View(
				{
					style: {
						flexDirection: 'row',
					},
				},
				Text4({
					testId: this.getTestId('timer'),
					text: this.getDisplayTime(),
					color: this.getDisplayTimeColor(),
					numberOfLines: 1,
					ellipsize: 'end',
				}),
			);
		}

		getDisplayTimeColor()
		{
			const { isOpened, isPaused, isExpired } = this.state.worktime;

			if (isOpened || isPaused)
			{
				return Color.accentMainPrimary;
			}

			if (isExpired)
			{
				return Color.accentExtraOrange;
			}

			return Color.base3;
		}

		getBreakTime()
		{
			const { now, worktime } = this.state;
			const { startTime, endTime, breakLength, duration } = worktime;
			const breakMs = (breakLength ?? 0) * SECONDS_TO_MS;

			// pause start comes from pull events only; the rest action leaves it empty,
			// so it is restored as startTime + duration + breakLength
			if (Number.isFinite(endTime))
			{
				return formatHHMMSS(Math.max(breakMs + now - (endTime * SECONDS_TO_MS), 0));
			}

			if (!Number.isFinite(startTime) || !Number.isFinite(duration))
			{
				return formatHHMMSS(Math.max(breakMs, 0));
			}

			const totalBreakMs = now - (startTime * SECONDS_TO_MS) - (duration * SECONDS_TO_MS);

			return formatHHMMSS(Math.max(totalBreakMs, 0));
		}

		getDisplayTime()
		{
			const { now, worktime } = this.state;
			const {
				status,
				startTime,
				breakLength,
				duration,
				recommendedCloseTimestamp,
				isExpired,
			} = worktime;

			if (status === RecordStatus.OPENED && !isExpired)
			{
				if (!Number.isFinite(startTime))
				{
					return '00:00:00';
				}

				const startMs = startTime * SECONDS_TO_MS;
				const breakMs = (breakLength ?? 0) * SECONDS_TO_MS;
				const elapsedMs = now - startMs - breakMs;

				return formatHHMMSS(Math.max(elapsedMs, 0));
			}

			if (status === RecordStatus.PAUSED)
			{
				return this.getBreakTime();
			}

			if (status === RecordStatus.CLOSED)
			{
				const durationMs = (duration ?? 0) * SECONDS_TO_MS;

				return durationMs > 0 ? formatHHMMSS(durationMs) : '00:00:00';
			}

			if (isExpired)
			{
				if (recommendedCloseTimestamp)
				{
					const d = new Date(recommendedCloseTimestamp * SECONDS_TO_MS);
					const pad = (num) => String(num).padStart(2, '0');

					return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
				}

				return '00:00:00';
			}

			return null;
		}

		renderActions()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexGrow: 2,
						justifyContent: 'flex-end',
					},
				},
				this.state.worktime.isOpened && !this.state.worktime.isExpired && this.renderPauseButton(),
				this.renderMainButton(),
			);
		}

		renderPauseButton()
		{
			return Button({
				testId: this.getTestId('pause-button'),
				leftIcon: Icon.PAUSE,
				size: ButtonSize.M,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				onClick: () => {
					this.pauseWorkTime();
				},
				style: {
					marginRight: Indent.M.toNumber(),
				},
				loading: this.isBusy(),
			});
		}

		renderMainButton()
		{
			const { isExpired, isCompleted, isPaused, isOpened } = this.state.worktime;
			const isActionPending = this.isBusy();

			if (isExpired)
			{
				return Button({
					testId: this.getTestId('stop-button'),
					text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_BUTTON_STOP'),
					size: ButtonSize.M,
					design: ButtonDesign.FILLED,
					onClick: () => {
						this.openWorkTime();
					},
					loading: isActionPending,
					style: {
						flexShrink: 2,
					},
				});
			}

			if (isCompleted)
			{
				return Button({
					testId: this.getTestId('reopen-button'),
					leftIcon: Icon.REFRESH,
					text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_BUTTON_REOPEN'),
					size: ButtonSize.M,
					design: ButtonDesign.FILLED,
					onClick: () => {
						this.handleContinueWorkday();
					},
					loading: isActionPending,
					style: {
						flexShrink: 2,
					},
				});
			}

			if (isPaused)
			{
				return Button({
					testId: this.getTestId('resume-button'),
					leftIcon: Icon.PLAY,
					text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_BUTTON_RESUME'),
					size: ButtonSize.M,
					design: ButtonDesign.FILLED,
					onClick: () => {
						this.handleContinueWorkday();
					},
					loading: isActionPending,
					style: {
						flexShrink: 2,
					},
				});
			}

			if (isOpened)
			{
				return Button({
					testId: this.getTestId('stop-button'),
					text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_BUTTON_STOP'),
					size: ButtonSize.M,
					design: ButtonDesign.FILLED,
					onClick: this.handleCloseWorkTime,
					loading: isActionPending,
					style: {
						flexShrink: 2,
					},
				});
			}

			return Button({
				testId: this.getTestId('start-button'),
				leftIcon: Icon.PLAY,
				text: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_BUTTON_START'),
				size: ButtonSize.M,
				design: ButtonDesign.FILLED,
				onClick: () => {
					this.handleStartWorkday();
				},
				loading: isActionPending,
				style: {
					flexShrink: 2,
				},
			});
		}

		isBusy()
		{
			return this.state.worktime.isActionPending || this.state.isReportSubmitting;
		}

		handleStartWorkday()
		{
			if (this.isBusy())
			{
				return;
			}

			this.props.onStartWorkDay?.();

			this.props.startWorkday()
				.unwrap()
				.catch((error) => this.showActionError(error));
		}

		handleContinueWorkday()
		{
			if (this.isBusy())
			{
				return;
			}

			this.props.onResumeWorkDay?.();
			this.props.continueWorkday()
				.unwrap()
				.catch((error) => this.showActionError(error));
		}

		pauseWorkTime()
		{
			if (this.isBusy())
			{
				return;
			}

			this.props.onPauseWorkDay?.();
			this.props.pauseWorkday()
				.unwrap()
				.catch((error) => this.showActionError(error));
		}

		handleCloseWorkTime()
		{
			if (this.isBusy())
			{
				return;
			}

			this.props.onFinishWorkDay?.();

			if (!this.enabledDailyReportBox)
			{
				this.props.stopWorkday()
					.unwrap()
					.catch((error) => this.showActionError(error));

				return;
			}

			this.setState({ isReportSubmitting: true });

			const { recordId: closedRecordId, startTime } = this.state.worktime;

			DailyReportBox.open({
				prepareRequest: async () => {
					await this.props.stopWorkday().unwrap();

					if (closedRecordId)
					{
						return { recordId: closedRecordId };
					}

					return {
						dateFilter: {
							from: startTime ? new Date(startTime * 1000) : undefined,
							to: new Date(),
						},
					};
				},
			})
				.catch((error) => {
					if (error?.code === 'ERROR_FOR_USER')
					{
						this.showActionError(error);
					}
					else
					{
						showErrorToast();
						console.error(error);
					}
				})
				.finally(() => {
					this.setState({ isReportSubmitting: false });
				});
		}

		showActionError(error)
		{
			if (error?.code === 'ERROR_FOR_USER')
			{
				Alert.alert(
					'',
					error.message,
					() => {},
					Loc.getMessage('TIMEMAN_WORKDAY_PANEL_ERROR_BUTTON_OK'),
				);
			}
		}

		openWorkTime()
		{
			inAppUrl.open('/timeman/work.time', {
				title: Loc.getMessage('TIMEMAN_WORKDAY_PANEL_TIME_PLACEHOLDER'),
			});
		}
	}

	const selectWorktime = (state) => {
		return {
			record: selectRecord(state),
			recordId: selectRecordId(state),
			status: selectStatus(state),
			isOpened: selectIsOpened(state),
			isPaused: selectIsPaused(state),
			isClosed: selectIsClosed(state),
			isExpired: selectIsExpired(state),
			isCompleted: selectIsCompleted(state),
			canStartWorkday: selectCanStart(state),
			startTime: selectStartTime(state),
			endTime: selectEndTime(state),
			breakLength: selectBreakLength(state),
			duration: selectDuration(state),
			isActionPending: selectIsActionPending(state),
			fetchStatus: selectFetchStatus(state),
			recommendedCloseTimestamp: selectRecommendedCloseTimestamp(state),
		};
	};

	const mapDispatchToProps = ({
		fetchCurrentRecord,
		startWorkday,
		pauseWorkday,
		continueWorkday,
		stopWorkday,
	});

	WorkdayPanel.propTypes = {
		testId: PropTypes.string.isRequired,
		fetchCurrentRecord: PropTypes.func,
		startWorkday: PropTypes.func,
		pauseWorkday: PropTypes.func,
		continueWorkday: PropTypes.func,
		stopWorkday: PropTypes.func,
		onComponentMount: PropTypes.func,
		onComponentWillUnmount: PropTypes.func,
		onStartWorkDay: PropTypes.func,
		onResumeWorkDay: PropTypes.func,
		onPauseWorkDay: PropTypes.func,
		onFinishWorkDay: PropTypes.func,
	};

	const ConnectedWorkdayPanel = connect(null, mapDispatchToProps)(WorkdayPanel);

	module.exports = {
		WorkdayPanel: ConnectedWorkdayPanel,
	};
});
