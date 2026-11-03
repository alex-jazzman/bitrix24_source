/**
 * @module qrauth/show-code/src/code-sheet
 */
jn.define('qrauth/show-code/src/code-sheet', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color, Indent } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { QrCodeFrame, QR_CODE_BORDER_GRADIENT } = require('layout/ui/qr-code-frame');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showSafeToast } = require('toast');
	const { createTestIdGenerator } = require('utils/test');
	const { QrCodeCache } = require('qrauth/show-code/src/code-cache');
	const { RefreshScheduler } = require('qrauth/show-code/src/refresh-scheduler');
	const { QrCodeTimer } = require('qrauth/show-code/src/code-timer');

	const SHEET_HEIGHT = 480;
	const REFRESH_LOADER_SIZE = 40;
	// Mirrors the frame size of layout/ui/qr-code-frame: the error takes the place of the code
	// instead of collapsing the sheet content.
	const CODE_FRAME_SIZE = 245;
	// Also mirrored from layout/ui/qr-code-frame: the cover must fill the code area only, so the
	// gradient border around it stays visible while the next code is on its way.
	const CODE_COVER_INSET = 8;
	const CODE_COVER_BORDER_RADIUS = 24;
	const BACKGROUND_RECHECK_DELAY = 500;
	const BACKGROUND_RECHECK_ATTEMPTS = 5;
	const GET_LOGIN_CODE_ACTION = 'mobile.QrAuth.getLoginCode';
	const HASH_INVALIDATED_MODULE_ID = 'mobile';
	const HASH_INVALIDATED_COMMAND = 'onDeeplinkShouldRefresh';

	class QrLoginCodeSheet extends LayoutComponent
	{
		#isReleased = false;
		#activeRequestId = 0;
		#isRequestInFlight = false;
		#hasPendingRefresh = false;
		#widgetListenersAttached = false;
		#tickListener = null;
		#backgroundRecheckTimeout = null;
		#backgroundRecheckAttemptsLeft = BACKGROUND_RECHECK_ATTEMPTS;

		/**
		 * @param {{ parentWidget?: PageManager, onLoginOnNewDevice?: function(): void }} [params]
		 * @return {Promise<PageManager>}
		 */
		static open({ parentWidget = PageManager, onLoginOnNewDevice } = {})
		{
			return new BottomSheet({
				titleParams: {
					text: Loc.getMessage('M_QRAUTH_SHOW_CODE_CODE_TITLE'),
					type: 'dialog',
				},
				component: (layoutWidget) => new QrLoginCodeSheet({ layoutWidget, onLoginOnNewDevice }),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.setMediumPositionHeight(SHEET_HEIGHT, true)
				.open();
		}

		/**
		 * @param {{ layoutWidget?: PageManager, onLoginOnNewDevice?: function(): void }} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				qrCodeSvg: null,
				hasError: false,
				isRefreshing: false,
			};

			this.scheduler = new RefreshScheduler({
				onRefresh: this.#requestCode,
				onTick: this.#handleTick,
			});
			this.unsubscribeFromHashInvalidation = null;

			this.getTestId = createTestIdGenerator({
				prefix: 'qrauth-code',
			});
		}

		componentDidMount()
		{
			this.#isReleased = false;

			BX.addCustomEvent('onAppPaused', this.#handleAppPaused);
			BX.addCustomEvent('onAppActive', this.#handleAppActive);

			this.#subscribeToHashInvalidation();
			this.#attachWidgetListeners();

			if (!this.#showCachedCode())
			{
				this.#requestCode();
			}
		}

		/**
		 * @return {boolean}
		 */
		#showCachedCode()
		{
			const cachedCode = QrCodeCache.get(AppTheme.id === 'dark');

			if (cachedCode === null)
			{
				return false;
			}

			this.setState({ qrCodeSvg: cachedCode.image, hasError: false, isRefreshing: false });

			this.scheduler.start(cachedCode.secondsLeft);

			return true;
		}

		#attachWidgetListeners()
		{
			if (this.#widgetListenersAttached)
			{
				return;
			}

			const { layoutWidget } = this.props;

			layoutWidget?.on('onViewHidden', this.#releaseResources);
			layoutWidget?.on('onViewRemoved', this.#releaseResources);

			this.#widgetListenersAttached = true;
		}

		componentWillUnmount()
		{
			this.#releaseResources();
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					safeArea: {
						bottom: true,
					},
				},
				AreaList(
					{
						withScroll: false,
					},
					Area(
						{
							isFirst: true,
							style: {
								alignItems: 'center',
							},
						},
						Text4({
							testId: this.getTestId('subtitle'),
							text: Loc.getMessage('M_QRAUTH_SHOW_CODE_CODE_SUBTITLE'),
							color: Color.base2,
							style: {
								textAlign: 'center',
							},
						}),
						View(
							{
								style: {
									marginTop: Indent.XL4.toNumber(),
									marginBottom: Indent.XL3.toNumber(),
								},
							},
							this.#renderCodeFrame(),
						),
						this.#renderTimer(),
						Text5({
							testId: this.getTestId('warning'),
							text: Loc.getMessage('M_QRAUTH_SHOW_CODE_CODE_WARNING'),
							color: Color.base3,
							style: {
								textAlign: 'center',
							},
						}),
					),
				),
			);
		}

		#renderTimer()
		{
			const { qrCodeSvg, hasError } = this.state;

			if (hasError || !qrCodeSvg)
			{
				return null;
			}

			return QrCodeTimer({
				testId: this.getTestId('timer'),
				subscribeToTick: this.#subscribeToTick,
				getSecondsLeft: this.#getSecondsLeft,
			});
		}

		#subscribeToTick = (listener) => {
			this.#tickListener = listener;

			return () => {
				if (this.#tickListener === listener)
				{
					this.#tickListener = null;
				}
			};
		};

		#getSecondsLeft = () => this.scheduler.getSecondsLeft();

		#handleTick = (secondsLeft) => {
			this.#tickListener?.(secondsLeft);
		};

		#renderCodeFrame()
		{
			const { qrCodeSvg, hasError, isRefreshing } = this.state;

			return View(
				{
					style: {
						position: 'relative',
					},
				},
				QrCodeFrame({
					testId: this.getTestId(),
					qrCodeSvg,
					hasError,
					borderGradient: QR_CODE_BORDER_GRADIENT,
					renderError: this.#renderError,
				}),
				isRefreshing && qrCodeSvg ? this.#renderRefreshCover() : null,
			);
		}

		// The shown code is already invalidated on the server while the next one is on its way.
		#renderRefreshCover()
		{
			return View(
				{
					testId: this.getTestId('refresh-cover'),
					style: {
						position: 'absolute',
						top: CODE_COVER_INSET,
						right: CODE_COVER_INSET,
						bottom: CODE_COVER_INSET,
						left: CODE_COVER_INSET,
						borderRadius: CODE_COVER_BORDER_RADIUS,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				Loader({
					style: {
						width: REFRESH_LOADER_SIZE,
						height: REFRESH_LOADER_SIZE,
					},
					tintColor: Color.accentMainPrimary.toHex(),
					animating: true,
					size: 'small',
				}),
			);
		}

		#renderError = () => {
			return View(
				{
					testId: this.getTestId('error'),
					style: {
						width: CODE_FRAME_SIZE,
						height: CODE_FRAME_SIZE,
						alignSelf: 'center',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Text4({
					text: Loc.getMessage('M_QRAUTH_SHOW_CODE_ERROR_TEXT'),
					color: Color.base2,
					style: {
						textAlign: 'center',
					},
				}),
				Button({
					testId: this.getTestId('retry-button'),
					text: Loc.getMessage('M_QRAUTH_SHOW_CODE_RETRY_BUTTON'),
					design: ButtonDesign.OUTLINE,
					size: ButtonSize.M,
					onClick: this.#handleRetry,
					style: {
						marginTop: Indent.XL3.toNumber(),
					},
				}),
			);
		};

		#handleRetry = () => {
			if (this.#isReleased)
			{
				return;
			}

			this.setState({ qrCodeSvg: null, hasError: false, isRefreshing: false }, this.#requestCode);
		};

		#requestCode = () => {
			if (this.#isReleased)
			{
				return;
			}

			if (Application.isBackground())
			{
				this.scheduler.pause();
				this.#scheduleBackgroundRecheck();

				return;
			}

			this.#resetBackgroundRecheck();

			// Every issue drops the previous hit-auth hash on the server, so overlapping requests
			// can leave the client holding a code the server has already invalidated: requestId only
			// discards a stale response, it does not order the server-side handling.
			if (this.#isRequestInFlight)
			{
				this.#hasPendingRefresh = true;

				return;
			}

			if (this.state.qrCodeSvg && !this.state.isRefreshing)
			{
				this.setState({ isRefreshing: true });
			}

			this.#activeRequestId += 1;
			const requestId = this.#activeRequestId;
			const isDarkMode = AppTheme.id === 'dark';
			this.#isRequestInFlight = true;

			new RunActionExecutor(
				GET_LOGIN_CODE_ACTION,
				{
					isDarkMode,
				},
			)
				.enableJson()
				.setCacheId('')
				.setHandler((response) => {
					this.#handleCodeResponse(response, requestId, isDarkMode);
					this.#finishRequest(requestId);
				})
				.call()
				.catch(() => {
					this.#showError(requestId);
					this.#finishRequest(requestId);
				});
		};

		/**
		 * @param {number} requestId
		 */
		#finishRequest(requestId)
		{
			if (requestId !== this.#activeRequestId || !this.#isRequestInFlight)
			{
				return;
			}

			this.#isRequestInFlight = false;

			if (!this.#hasPendingRefresh)
			{
				return;
			}

			this.#hasPendingRefresh = false;

			if (this.#isReleased)
			{
				return;
			}

			this.#requestCode();
		}

		/**
		 * @param {ActionResponse} response
		 * @param {number} requestId
		 * @param {boolean} isDarkMode
		 */
		#handleCodeResponse = (response, requestId, isDarkMode) => {
			if (this.#isObsoleteRequest(requestId))
			{
				return;
			}

			const { image, ttl } = response?.data ?? {};

			// API-01: the applied lifetime always comes from the server, there is no client-side default.
			if (!Type.isStringFilled(image) || !Type.isNumber(ttl) || ttl <= 0)
			{
				this.#showError(requestId);

				return;
			}

			QrCodeCache.set({ image, ttl, isDarkMode });

			this.setState({ qrCodeSvg: image, hasError: false, isRefreshing: false });

			this.scheduler.start(ttl);
		};

		/**
		 * @param {number} requestId
		 * @return {boolean}
		 */
		#isObsoleteRequest(requestId)
		{
			return this.#isReleased || requestId !== this.#activeRequestId;
		}

		/**
		 * @param {number} requestId
		 */
		#showError = (requestId) => {
			if (this.#isObsoleteRequest(requestId))
			{
				return;
			}

			QrCodeCache.clear();

			this.setState({ qrCodeSvg: null, hasError: true, isRefreshing: false });
		};

		#handleAppPaused = () => {
			this.#resetBackgroundRecheck();
			this.scheduler.pause();
		};

		#handleAppActive = () => {
			this.#resetBackgroundRecheck();
			this.scheduler.resume();
		};

		// The activation event can outrun the native background flag: resume() would then land in the
		// background branch of #requestCode, and pause() would leave the sheet without intervals with no
		// further event to revive it. The recheck only re-reads the flag, so it costs no extra request.
		#scheduleBackgroundRecheck()
		{
			if (this.#backgroundRecheckTimeout !== null || this.#backgroundRecheckAttemptsLeft <= 0)
			{
				return;
			}

			this.#backgroundRecheckAttemptsLeft -= 1;
			this.#backgroundRecheckTimeout = setTimeout(this.#recheckBackground, BACKGROUND_RECHECK_DELAY);
		}

		#recheckBackground = () => {
			this.#backgroundRecheckTimeout = null;

			if (this.#isReleased)
			{
				return;
			}

			if (Application.isBackground())
			{
				this.#scheduleBackgroundRecheck();

				return;
			}

			this.scheduler.resume();
		};

		#resetBackgroundRecheck()
		{
			if (this.#backgroundRecheckTimeout !== null)
			{
				clearTimeout(this.#backgroundRecheckTimeout);
				this.#backgroundRecheckTimeout = null;
			}

			this.#backgroundRecheckAttemptsLeft = BACKGROUND_RECHECK_ATTEMPTS;
		}

		#subscribeToHashInvalidation()
		{
			if (!BX.PULL)
			{
				return;
			}

			this.unsubscribeFromHashInvalidation = BX.PULL.subscribe({
				moduleId: HASH_INVALIDATED_MODULE_ID,
				command: HASH_INVALIDATED_COMMAND,
				callback: this.#handleLoginOnNewDevice,
			});
		}

		#handleLoginOnNewDevice = () => {
			QrCodeCache.clear();

			showSafeToast({
				message: Loc.getMessage('M_QRAUTH_SHOW_CODE_LOGIN_SUCCESS'),
			});

			this.#releaseResources();

			const { layoutWidget, onLoginOnNewDevice } = this.props;

			if (layoutWidget)
			{
				layoutWidget.close(() => onLoginOnNewDevice?.());

				return;
			}

			onLoginOnNewDevice?.();
		};

		#releaseResources = () => {
			if (this.#isReleased)
			{
				return;
			}

			this.#isReleased = true;
			this.#isRequestInFlight = false;
			this.#hasPendingRefresh = false;

			this.#resetBackgroundRecheck();
			this.scheduler.stop();

			this.unsubscribeFromHashInvalidation?.();
			this.unsubscribeFromHashInvalidation = null;

			BX.removeCustomEvent('onAppPaused', this.#handleAppPaused);
			BX.removeCustomEvent('onAppActive', this.#handleAppActive);
		};
	}

	module.exports = { QrLoginCodeSheet };
});
