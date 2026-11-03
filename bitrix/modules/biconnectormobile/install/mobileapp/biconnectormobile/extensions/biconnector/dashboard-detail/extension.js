/**
 * @module biconnector/dashboard-detail
 */
jn.define('biconnector/dashboard-detail', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const AppTheme = require('apptheme');
	const { PureComponent } = require('layout/pure-component');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { PulseLoader } = require('biconnector/dashboard-detail/src/pulse-loader');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Icon } = require('ui-system/blocks/icon');
	const { Text3 } = require('ui-system/typography/text');
	const { Box } = require('ui-system/layout/box');
	const { BottomSheet } = require('bottom-sheet');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { PerfPoint } = require('debug/prism');

	const { Alert, ButtonType } = require('alert');
	const { showErrorToast, showOfflineToast } = require('toast');
	const { isOffline } = require('device/connection');

	const UNPIN_ACTION = 'biconnectormobile.Dashboard.unpin';
	const NO_ACCESS_REASON = 'no_access';

	const EMBEDDED_PAGE_PATH = '/mobile/biconnector/dashboard-embedded.php';

	const STATE_ACTION = 'biconnectormobile.Dashboard.getViewState';
	const PREPARE_ACTION = 'biconnectormobile.Dashboard.prepareView';
	const SUBSCRIBE_ACTION = 'biconnectormobile.Dashboard.subscribeToUpdates';
	const DESCRIPTION_ACTION = 'biconnectormobile.Dashboard.getDescription';

	// Readiness is pushed by biconnector over pull, the same way the web startup page learns about it.
	const PULL_MODULE_ID = 'biconnector';
	const PULL_WATCH_TAG = 'superset_dashboard';
	const PullCommand = {
		DASHBOARD_STATUS: 'onDashboardStatusUpdated',
		SUPERSET_STATUS: 'onSupersetStatusUpdated',
	};

	// Guards the embedding of a report the server has already called ready: the page has an embed timeout
	// of its own (45s) and this one is the last resort for a frame that never answers at all. It is armed
	// only while the frame is mounted - preparing a report is not a frame load and has no deadline.
	const EMBED_TIMEOUT_MS = 50000;

	// The pull event is the channel readiness arrives by; the poll only covers a lost event, so it runs
	// rarely on purpose.
	const STATE_POLL_INTERVAL_MS = 20000;

	// Past this the wait is called out as a long one: installing a report and starting an instance up
	// legitimately take minutes. The wait itself goes on - the server keeps preparing the report.
	const LONG_WAIT_MS = 90000;

	const LOADING_INDICATOR_SIZE = 64;

	// The frame reports this when the report it was opened for is being prepared again - the instance was
	// frozen between the answer of the state action and the load of the page. It is not a failure: the
	// screen goes back to the server for the state.
	const NOT_READY_REASON = 'not_ready';

	// Frame bridge event types (frozen contract). Envelope key from native is `eventType`.
	// The very same set lives on the other side of the border - in the template of the embedded page,
	// biconnector/install/components/bitrix/biconnector.apachesuperset.dashboard.detail/templates/.default/mobile.php -
	// and neither side of the bridge changes it alone. The frame is mounted only for a report the server
	// has called ready, so the bridge carries the outcome of the embedding and nothing else.
	const BridgeEvent = {
		INIT: 'INIT',
		READY: 'READY',
		ERROR: 'ERROR',
	};

	// Wire values of DashboardViewState::STATE_*, plus the state the screen is in while the very first
	// answer of the server is still on its way.
	const ViewState = {
		LOADING: 'loading',
		PREPARING: 'preparing',
		READY: 'ready',
		ERROR: 'error',
	};

	// Wire value of SupersetDashboardTable::DASHBOARD_TYPE_CUSTOM: a report of the user's own is created
	// rather than opened, and the web says so.
	const CUSTOM_DASHBOARD_TYPE = 'CUSTOM';
	const NOT_INSTALLED_DASHBOARD_STATUS = 'N';

	const ERROR_VIEW_BY_REASON = {
		superset_unavailable: {
			titleId: 'M_BIC_DASHBOARD_DETAIL_ERROR_UNAVAILABLE_TITLE',
			descId: 'M_BIC_DASHBOARD_DETAIL_ERROR_UNAVAILABLE_DESC',
		},
		no_access: {
			titleId: 'M_BIC_DASHBOARD_DETAIL_ERROR_NO_ACCESS_TITLE',
			descId: 'M_BIC_DASHBOARD_DETAIL_ERROR_NO_ACCESS_DESC',
		},
		timeout: {
			titleId: 'M_BIC_DASHBOARD_DETAIL_ERROR_TIMEOUT_TITLE',
			descId: 'M_BIC_DASHBOARD_DETAIL_ERROR_TIMEOUT_DESC',
		},
	};

	const COMMON_ERROR_VIEW = {
		titleId: 'M_BIC_DASHBOARD_DETAIL_ERROR_COMMON_TITLE',
		descId: 'M_BIC_DASHBOARD_DETAIL_ERROR_COMMON_DESC',
	};

	// Codes of the prefilters guarding the actions: FEATURE_DISABLED is ours (MobileBIFeatureAccess), the
	// rest come from biconnector BIConstructorAccess. A refusal never reaches the body of the action, so
	// the reason of the screen is read off the errors of the response instead.
	const NO_ACCESS_ERROR_CODES = ['FEATURE_DISABLED', 'INSUFFICIENT_TARIFF', 'TOOL_DISABLED', 'ACCESS_DENIED'];

	/**
	 * A failed action answers the same way a successful one does - the executor hands the answer to the
	 * handler either way - so success is told from failure by the answer itself.
	 * Pure.
	 *
	 * @param {?object} response
	 * @returns {boolean}
	 */
	const isFailedResponse = (response) => (
		response?.status === 'error'
		|| (Array.isArray(response?.errors) && response.errors.length > 0)
	);

	/**
	 * Tells a refusal by rights apart from any other failed request, so a user without access is not
	 * offered to retry into the same wall.
	 * Pure.
	 *
	 * @param {?object} response
	 * @returns {?string}
	 */
	const mapResponseErrorToReason = (response) => {
		const errors = Array.isArray(response?.errors) ? response.errors : [];
		const isRefusal = errors.some((error) => NO_ACCESS_ERROR_CODES.includes(error?.code));

		return isRefusal ? 'no_access' : null;
	};

	/**
	 * Maps an ERROR.reason of the bridge (or a synthesised timeout) to error-screen phrase ids.
	 * Pure: unknown or empty reasons fall back to the common error view.
	 *
	 * @param {?string} reason
	 * @returns {{ titleId: string, descId: string }}
	 */
	const mapErrorReasonToView = (reason) => ERROR_VIEW_BY_REASON[reason] || COMMON_ERROR_VIEW;

	/**
	 * Picks the phrases of the waiting screen, mirroring what the web skeleton prints: a report of the
	 * user's own is being created rather than opened, the explanation of the minutes it takes belongs to
	 * the first startup only, and a wait that has already dragged on says so instead.
	 *
	 * @param {object} params
	 * @param {?string} [params.dashboardType]
	 * @param {?string} [params.dashboardStatus]
	 * @param {boolean} [params.isFirstStartup]
	 * @param {boolean} [params.isLongWait]
	 * @returns {{ titleId: string, descId: ?string }}
	 */
	const resolveWaitingView = ({
		dashboardType,
		dashboardStatus,
		isFirstStartup = false,
		isLongWait = false,
	} = {}) => {
		if (isLongWait)
		{
			return {
				titleId: 'M_BIC_DASHBOARD_DETAIL_LONG_WAIT_TITLE',
				// The notification is registered by the startup of the instance (SupersetInitializer::
				// saveInitData), the very case the server calls a first startup. A report merely being
				// installed on a running instance sends none, so the wait is not to promise one.
				descId: isFirstStartup
					? 'M_BIC_DASHBOARD_DETAIL_LONG_WAIT_NOTIFY_DESC'
					: 'M_BIC_DASHBOARD_DETAIL_LONG_WAIT_DESC',
			};
		}

		const isCreating = dashboardType === CUSTOM_DASHBOARD_TYPE
			&& dashboardStatus === NOT_INSTALLED_DASHBOARD_STATUS;

		return {
			titleId: isCreating
				? 'M_BIC_DASHBOARD_DETAIL_CREATING_TITLE'
				: 'M_BIC_DASHBOARD_DETAIL_OPENING_TITLE',
			descId: isFirstStartup
				? (isCreating ? 'M_BIC_DASHBOARD_DETAIL_CREATING_DESC' : 'M_BIC_DASHBOARD_DETAIL_OPENING_DESC')
				: null,
		};
	};

	/**
	 * Builds the portal frame URL for the given dashboard id.
	 *
	 * @param {string|number} dashboardId
	 * @returns {string}
	 */
	const buildEmbeddedUrl = (dashboardId) => `${EMBEDDED_PAGE_PATH}?dashboardId=${encodeURIComponent(dashboardId)}`;

	/**
	 * The content of the sheet with the description of the report. It is a component and not a view on
	 * purpose: the widget of the sheet draws what it is given through `showComponent`, and that one takes
	 * a descendant of LayoutComponent only - a bare view is refused with "Invalid component. It should be
	 * inherited from LayoutComponent" and the sheet opens empty.
	 *
	 * @class DashboardDescriptionSheet
	 */
	class DashboardDescriptionSheet extends LayoutComponent
	{
		/**
		 * @param {object} options
		 * @param {object} options.parentWidget the widget of the screen the sheet is opened over
		 * @param {string} options.text
		 */
		static open({ parentWidget, text })
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('M_BIC_DASHBOARD_DETAIL_DESCRIPTION_TITLE'),
					type: 'dialog',
				},
				component: () => new DashboardDescriptionSheet({ text }),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				// A description of a Marketplace application runs long: the sheet has to be draggable up to
				// the top, and the text scrolls inside it.
				.enableShowOnTop()
				.open();
		}

		render()
		{
			return Box(
				{
					testId: 'bic-dashboard-detail-description',
					withScroll: true,
					withPaddingHorizontal: true,
					safeArea: { bottom: true },
				},
				Text3({
					testId: 'bic-dashboard-detail-description-text',
					text: this.props.text,
					color: Color.base1,
					style: {
						marginVertical: Indent.XL.toNumber(),
					},
				}),
			);
		}
	}

	/**
	 * Detail screen container. The lifecycle of the report belongs to the server: the screen asks it for
	 * the state, asks it to prepare a report that is not ready yet, and mounts the WebView with the
	 * Superset frame only once the answer is `ready`. Readiness arrives as a pull event; the poll below
	 * is a safety net for a lost one.
	 *
	 * @class DashboardDetail
	 */
	class DashboardDetail extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.webViewRef = null;
			this.embedTimeout = null;
			this.statePoll = null;
			this.longWaitTimeout = null;
			this.themeSent = false;
			this.stateRequestId = 0;
			this.unsubscribePull = null;
			this.isUnmounted = false;
			this.openPerfPoint = null;
			this.activePerfPointKeys = new Set();

			this.state = {
				viewState: ViewState.LOADING,
				errorReason: null,
				dashboardType: null,
				dashboardStatus: null,
				isFirstStartup: false,
				isLongWait: false,
				frameReady: false,
				reloadToken: 0,
				description: '',
				isUnpinning: false,
				isPinningEnabled: false,
			};

			this.openDescription = this.openDescription.bind(this);
			this.onReceiveEvent = this.onReceiveEvent.bind(this);
			this.onPullEvent = this.onPullEvent.bind(this);
			this.bindWebViewRef = this.bindWebViewRef.bind(this);
			this.loadState = this.loadState.bind(this);
			this.retry = this.retry.bind(this);
			this.confirmUnpin = this.confirmUnpin.bind(this);
		}

		componentDidMount()
		{
			this.startOpenPerfPoint();
			this.subscribeToUpdates();
			this.loadState();
			this.loadDescription();
		}

		componentWillUnmount()
		{
			// An answer still on its way would otherwise arm the poll and the long wait again, with nobody
			// left to disarm them.
			this.isUnmounted = true;
			this.finishOpenPerfPoint({ source: 'unmount' });
			this.clearEmbedTimeout();
			this.clearStatePoll();
			this.clearLongWaitTimeout();
			this.unsubscribeFromUpdates();
		}

		// region server state

		/**
		 * Asks the server for the state of the report and applies it. Answers of a request the screen has
		 * already moved on from are dropped: a poll and a pull event can be in flight at the same time.
		 * An answer that outlives the screen itself is dropped as well - it would arm the timers again.
		 *
		 * @returns {Promise<void>}
		 */
		loadState()
		{
			const requestId = ++this.stateRequestId;
			const isCurrentRequest = () => requestId === this.stateRequestId;
			const isAnswerWanted = () => !this.isUnmounted && isCurrentRequest();

			return new RunActionExecutor(STATE_ACTION, { dashboardId: this.props.dashboardId })
				.setHandler((response) => {
					if (!isAnswerWanted())
					{
						return;
					}

					if (isFailedResponse(response))
					{
						this.showError(mapResponseErrorToReason(response));

						return;
					}

					this.applyServerState(response?.data);
				})
				.call(false)
				// The promise only rejects when the request never happened at all: an answer of the
				// server, failed or not, reaches the handler above.
				.catch(() => {
					if (isAnswerWanted())
					{
						this.showError(null);
					}
				});
		}

		/**
		 * @param {?object} serverState
		 */
		applyServerState(serverState)
		{
			const state = serverState || {};

			this.setState({
				isPinningEnabled: state.isPinningEnabled === true,
			});

			if (state.state === ViewState.READY)
			{
				this.showFrame(state);

				return;
			}

			if (state.state === ViewState.PREPARING)
			{
				this.showPreparing(state);

				return;
			}

			this.showError(state.reason);
		}

		showPreparing(serverState)
		{
			this.clearEmbedTimeout();
			this.startPerfPoint('Await Report Preparation');
			this.startLongWaitTimeout();
			this.startStatePoll();

			this.setState({
				viewState: ViewState.PREPARING,
				errorReason: null,
				dashboardType: serverState.dashboardType || null,
				dashboardStatus: serverState.dashboardStatus || null,
				isFirstStartup: serverState.isFirstStartup === true,
				frameReady: false,
			});

			this.requestPreparation();
		}

		/**
		 * The server refuses a second run itself, so a repeated call is safe and is what restarts a
		 * preparation whose process died. The answer is not applied: it is the very state the screen has
		 * just been given.
		 */
		requestPreparation()
		{
			new RunActionExecutor(PREPARE_ACTION, { dashboardId: this.props.dashboardId })
				.call(false)
				.catch(() => {});
		}

		showFrame(serverState)
		{
			this.clearStatePoll();
			this.clearLongWaitTimeout();
			this.finishPerfPoint('Await Report Preparation', { source: 'ready' });

			if (this.state.viewState === ViewState.READY)
			{
				return;
			}

			this.startPerfPoint('Load Dashboard Frame');
			this.themeSent = false;
			this.webViewRef = null;

			this.setState(
				{
					viewState: ViewState.READY,
					errorReason: null,
					dashboardType: serverState.dashboardType || null,
					dashboardStatus: serverState.dashboardStatus || null,
					isFirstStartup: false,
					isLongWait: false,
					frameReady: false,
					reloadToken: this.state.reloadToken + 1,
				},
				() => this.startEmbedTimeout(),
			);
		}

		showReady()
		{
			this.finishOpenPerfPoint({ source: 'ready' });
			this.clearEmbedTimeout();

			if (!this.state.frameReady)
			{
				this.setState({ frameReady: true });
			}
		}

		showError(reason)
		{
			this.finishOpenPerfPoint({ source: 'error', reason: reason || null });
			this.clearEmbedTimeout();
			this.clearStatePoll();
			this.clearLongWaitTimeout();

			this.setState({
				viewState: ViewState.ERROR,
				errorReason: reason || null,
				frameReady: false,
			});
		}

		retry()
		{
			this.setState(
				{
					viewState: ViewState.LOADING,
					errorReason: null,
					isLongWait: false,
					frameReady: false,
				},
				this.loadState,
			);
		}

		confirmUnpin()
		{
			if (!this.state.isPinningEnabled)
			{
				return;
			}

			if (this.state.isUnpinning || this.props.isPinned !== true)
			{
				return;
			}

			Alert.confirm(
				Loc.getMessage('M_BIC_DASHBOARD_DETAIL_UNPIN_CONFIRM_TITLE'),
				Loc.getMessage('M_BIC_DASHBOARD_DETAIL_UNPIN_CONFIRM_DESC'),
				[
					{
						text: Loc.getMessage('M_BIC_DASHBOARD_DETAIL_UNPIN_CANCEL'),
						type: ButtonType.CANCEL,
					},
					{
						text: Loc.getMessage('M_BIC_DASHBOARD_DETAIL_UNPIN_CONFIRM'),
						type: ButtonType.DESTRUCTIVE,
						onPress: () => {
							void this.unpinUnavailableDashboard();
						},
					},
				],
			);
		}

		async unpinUnavailableDashboard()
		{
			if (!this.state.isPinningEnabled)
			{
				return;
			}

			if (this.state.isUnpinning)
			{
				return;
			}

			if (isOffline())
			{
				showOfflineToast({}, this.props.layout);

				return;
			}

			this.setState({ isUnpinning: true });

			try
			{
				const response = await new RunActionExecutor(
					UNPIN_ACTION,
					{
						dashboardId: this.props.dashboardId,
						filter: {},
					},
				).call(false);

				if (isFailedResponse(response))
				{
					const message = response?.errors?.[0]?.message;

					showErrorToast(
						message ? { message } : {},
						this.props.layout,
					);

					return;
				}

				this.props.layout?.close?.();
			}
			catch (error)
			{
				if (isOffline())
				{
					showOfflineToast({}, this.props.layout);
				}
				else
				{
					showErrorToast({}, this.props.layout);
				}
			}
			finally
			{
				if (!this.isUnmounted)
				{
					this.setState({ isUnpinning: false });
				}
			}
		}

		// endregion

		// region description

		/**
		 * Asks the server for the description of the report. It travels apart from the state on purpose:
		 * for a report of Bitrix24 or of Marketplace the server fetches the description from Marketplace,
		 * and that request must not stand between the user and the report. A report without a description
		 * leaves the header as it is.
		 *
		 * @returns {Promise<void>}
		 */
		loadDescription()
		{
			return new RunActionExecutor(DESCRIPTION_ACTION, { dashboardId: this.props.dashboardId })
				.setHandler((response) => {
					const description = isFailedResponse(response) ? '' : (response?.data?.description || '');
					if (this.isUnmounted || description === '')
					{
						return;
					}

					this.setState({ description }, () => this.showDescriptionButton());
				})
				.call(false)
				.catch(() => {});
		}

		showDescriptionButton()
		{
			this.props.layout?.setRightButtons?.([
				{
					testId: 'bic-dashboard-detail-description-button',
					type: Icon.INFO_CIRCLE.getIconName(),
					color: Color.base4.toHex(),
					callback: this.openDescription,
				},
			]);
		}

		openDescription()
		{
			if (this.state.description === '')
			{
				return;
			}

			DashboardDescriptionSheet.open({
				parentWidget: this.props.layout,
				text: this.state.description,
			});
		}

		// endregion

		// region updates

		subscribeToUpdates()
		{
			// Nothing is read off the answer: the watch either registers or it does not, and a report
			// whose readiness never arrives by pull is still picked up by the poll.
			new RunActionExecutor(SUBSCRIBE_ACTION, {})
				.call(false)
				.catch(() => {});

			if (!BX.PULL)
			{
				return;
			}

			BX.PULL.extendWatch(PULL_WATCH_TAG, true);
			this.unsubscribePull = BX.PULL.subscribe({
				moduleId: PULL_MODULE_ID,
				callback: this.onPullEvent,
			});
		}

		unsubscribeFromUpdates()
		{
			if (typeof this.unsubscribePull === 'function')
			{
				this.unsubscribePull();
			}
			this.unsubscribePull = null;
		}

		/**
		 * The events only say that something about the report or the instance has changed; what that means
		 * for the screen is decided by the server, so every event of interest re-asks it.
		 *
		 * @param {object} event
		 */
		onPullEvent(event)
		{
			const { command, params } = event || {};

			if (command === PullCommand.SUPERSET_STATUS)
			{
				this.loadState();

				return;
			}

			if (command !== PullCommand.DASHBOARD_STATUS)
			{
				return;
			}

			const dashboardList = params?.dashboardList;
			if (!Array.isArray(dashboardList))
			{
				return;
			}

			const isOurs = dashboardList.some(
				(dashboard) => Number(dashboard?.id) === Number(this.props.dashboardId),
			);
			if (isOurs)
			{
				this.loadState();
			}
		}

		// endregion

		// region timers

		startEmbedTimeout()
		{
			this.clearEmbedTimeout();
			this.embedTimeout = setTimeout(() => {
				this.embedTimeout = null;
				if (!this.state.frameReady)
				{
					this.showError('timeout');
				}
			}, EMBED_TIMEOUT_MS);
		}

		clearEmbedTimeout()
		{
			if (this.embedTimeout)
			{
				clearTimeout(this.embedTimeout);
				this.embedTimeout = null;
			}
		}

		// Armed once per waiting period and never re-armed by a later answer: the wait is counted as a
		// whole, and the report keeps being prepared past it.
		startLongWaitTimeout()
		{
			if (this.longWaitTimeout || this.state.isLongWait)
			{
				return;
			}

			this.longWaitTimeout = setTimeout(() => {
				this.longWaitTimeout = null;
				this.setState({ isLongWait: true });
			}, LONG_WAIT_MS);
		}

		clearLongWaitTimeout()
		{
			if (this.longWaitTimeout)
			{
				clearTimeout(this.longWaitTimeout);
				this.longWaitTimeout = null;
			}
		}

		startStatePoll()
		{
			if (this.statePoll)
			{
				return;
			}

			this.statePoll = setInterval(this.loadState, STATE_POLL_INTERVAL_MS);
		}

		clearStatePoll()
		{
			if (this.statePoll)
			{
				clearInterval(this.statePoll);
				this.statePoll = null;
			}
		}

		// endregion

		// region perf

		startOpenPerfPoint()
		{
			this.openPerfPoint = new PerfPoint(
				'BI Dashboard Detail Open',
				`dashboard ${this.props.dashboardId}`,
			).start();
			this.startPerfPoint('Resolve Report State');
		}

		startPerfPoint(key)
		{
			// A repeated startPoint of the same key loses the perfId of the running one, and that one
			// then stays open forever.
			if (!this.openPerfPoint || this.activePerfPointKeys.has(key))
			{
				return;
			}

			this.openPerfPoint.startPoint(key);
			this.activePerfPointKeys.add(key);
		}

		finishPerfPoint(key, extra = {})
		{
			if (!this.openPerfPoint || !this.activePerfPointKeys.has(key))
			{
				return;
			}

			this.openPerfPoint.endPoint(key, extra);
			this.activePerfPointKeys.delete(key);
		}

		finishOpenPerfPoint(extra = {})
		{
			if (!this.openPerfPoint)
			{
				return;
			}

			for (const key of this.activePerfPointKeys)
			{
				this.openPerfPoint.endPoint(key, extra);
			}
			this.activePerfPointKeys.clear();
			this.openPerfPoint.end();
			this.openPerfPoint = null;
		}

		// endregion

		// region frame bridge

		bindWebViewRef(ref)
		{
			this.webViewRef = ref || null;

			// Push the theme once the frame WebView is mounted (bridge: native -> page).
			if (this.webViewRef && !this.themeSent)
			{
				this.themeSent = true;
				this.sendInit();
			}
		}

		sendInit()
		{
			this.webViewRef?.sendEvent(BridgeEvent.INIT, { colorScheme: AppTheme.id });
		}

		onReceiveEvent(event)
		{
			const { eventType, data } = event || {};

			if (eventType === BridgeEvent.READY)
			{
				this.showReady();
			}
			else if (eventType === BridgeEvent.ERROR)
			{
				if (data?.reason === NOT_READY_REASON)
				{
					this.clearEmbedTimeout();
					// The frame is of no use any more, and the screen leaves READY before asking again: a
					// server answering `ready` once more would otherwise find the screen in the very state
					// showFrame() returns early from, and the frame - which reports itself once per load -
					// would never be remounted.
					this.setState({ viewState: ViewState.LOADING, frameReady: false }, this.loadState);
				}
				else
				{
					this.showError(data?.reason);
				}
			}
		}

		// endregion

		render()
		{
			return View(
				{
					testId: 'bic-dashboard-detail',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderContent(),
			);
		}

		renderContent()
		{
			if (this.state.viewState === ViewState.ERROR)
			{
				return this.renderError();
			}

			if (this.state.viewState === ViewState.READY)
			{
				return this.renderFrame();
			}

			return this.renderWaiting('bic-dashboard-detail-preparing');
		}

		renderFrame()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderWebView(),
				this.state.frameReady ? null : this.renderLoadingOverlay(),
			);
		}

		renderWebView()
		{
			const { dashboardId } = this.props;

			return WebView({
				// A fresh key forces a clean frame remount on retry (same url otherwise reuses the native view).
				key: `bic-dashboard-frame-${this.state.reloadToken}`,
				style: {
					height: '100%',
				},
				data: {
					url: buildEmbeddedUrl(dashboardId),
				},
				// Let Superset handle scrolling inside the frame; the native WebView scroll would
				// otherwise intercept gestures and make inner elements (tables, filters) scroll poorly.
				scrollDisabled: true,
				ref: this.bindWebViewRef,
				onReceiveEvent: this.onReceiveEvent,
			});
		}

		renderLoadingOverlay()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderWaiting('bic-dashboard-detail-loading'),
			);
		}

		renderWaiting(testId)
		{
			const view = resolveWaitingView({
				dashboardType: this.state.dashboardType,
				dashboardStatus: this.state.dashboardStatus,
				isFirstStartup: this.state.isFirstStartup,
				isLongWait: this.state.isLongWait,
			});

			return StatusBlock({
				testId,
				title: Loc.getMessage(view.titleId),
				description: view.descId ? Loc.getMessage(view.descId) : null,
				image: PulseLoader({
					size: LOADING_INDICATOR_SIZE,
					testId: 'bic-dashboard-detail-waiting-loader',
				}),
			});
		}

		renderError()
		{
			const errorView = mapErrorReasonToView(this.state.errorReason);

			return StatusBlock({
				testId: 'bic-dashboard-detail-error',
				title: Loc.getMessage(errorView.titleId),
				description: Loc.getMessage(errorView.descId),
				buttons: this.buildErrorButtons(),
			});
		}

		buildErrorButtons()
		{
			const buttons = [];

			if (this.state.errorReason !== NO_ACCESS_REASON)
			{
				buttons.push(Button({
					testId: 'bic-dashboard-detail-retry',
					text: Loc.getMessage('M_BIC_DASHBOARD_DETAIL_RETRY'),
					design: ButtonDesign.OUTLINE,
					size: ButtonSize.M,
					onClick: this.retry,
				}));
			}

			if (this.state.isPinningEnabled && this.props.isPinned === true)
			{
				buttons.push(Button({
					testId: 'bic-dashboard-detail-unpin-unavailable',
					text: Loc.getMessage('M_BIC_DASHBOARD_DETAIL_UNPIN'),
					design: ButtonDesign.OUTLINE,
					size: ButtonSize.M,
					loading: this.state.isUnpinning,
					disabled: this.state.isUnpinning,
					onClick: this.confirmUnpin,
				}));
			}

			return buttons;
		}
	}

	module.exports = {
		DashboardDetail,
		DashboardDescriptionSheet,
		ViewState,
		BridgeEvent,
		mapErrorReasonToView,
		mapResponseErrorToReason,
		isFailedResponse,
		resolveWaitingView,
		buildEmbeddedUrl,
	};
});
