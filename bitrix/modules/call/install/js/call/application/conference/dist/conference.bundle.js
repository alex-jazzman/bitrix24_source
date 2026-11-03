/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, main_core, main_core_events, main_date, promise, ui_buttons, ui_notification, ui_notificationManager, ui_progressround, ui_viewer, ui_vue, ui_vue_vuex, im_application_launch, im_const, im_controller, im_debug, im_lib_clipboard, im_lib_cookie, im_lib_localstorage, im_lib_logger, im_lib_utils, im_provider_pull, im_v2_lib_desktopApi, pull_client, call_application_conferenceChannel, call_legacy_component_conference_conferencePublic, call_const, Call, call_mapping, call_lib_analytics, call_lib_callTokenManager, call_lib_settingsManager, call_model, rest_client) {
	'use strict';

	function _interopNamespaceDefault(e) {
		var n = Object.create(null);
		if (e) {
			for (var k in e) {
				n[k] = e[k];
			}
		}
		n.default = e;
		return Object.freeze(n);
	}

	var Call__namespace = /*#__PURE__*/_interopNamespaceDefault(Call);

	const RestAuth = Object.freeze({
		guest: 'guest'
	});
	class CallRestClient {
		constructor(params) {
			this.queryAuthRestore = false;
			this.setAuthId(RestAuth.guest);
			this.restClient = new rest_client.RestClient({
				endpoint: params.endpoint,
				queryParams: this.queryParams,
				cors: true
			});
		}
		setAuthId(authId, customAuthId = '') {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			if (authId == RestAuth.guest || typeof authId === 'string' && authId.match(/^[a-f0-9]{32}$/)) {
				this.queryParams.call_auth_id = authId;
			} else {
				console.error(`%CallRestClient.setAuthId: auth is not correct (%c${authId}%c)`, "color: black;", "font-weight: bold; color: red", "color: black");
				return false;
			}
			if (authId == RestAuth.guest && typeof customAuthId === 'string' && customAuthId.match(/^[a-f0-9]{32}$/)) {
				this.queryParams.call_custom_auth_id = customAuthId;
			}
			return true;
		}
		setChatId(chatId) {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			this.queryParams.call_chat_id = chatId;
		}
		setConfId(alias) {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			this.queryParams.videoconf_id = alias;
		}
		setPassword(password) {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			this.queryParams.videoconf_password = password;
		}
		callMethod(method, params, callback, sendCallback, logTag = null) {
			if (!logTag) {
				logTag = im_lib_utils.Utils.getLogTrackingParams({
					name: method
				});
			}
			const promise = new BX.Promise();

			// TODO: Callbacks methods will not work!
			this.restClient.callMethod(method, params, null, sendCallback, logTag).then(result => {
				this.queryAuthRestore = false;
				promise.fulfill(result);
			}).catch(result => {
				let error = result.error();
				if (error.ex.error == 'LIVECHAT_AUTH_WIDGET_USER') {
					this.setAuthId(error.ex.hash);
					if (method === RestMethod.widgetUserRegister) {
						console.warn(`BX.LiveChatRestClient: ${error.ex.error_description} (${error.ex.error})`);
						this.queryAuthRestore = false;
						promise.reject(result);
						return false;
					}
					if (!this.queryAuthRestore) {
						console.warn('BX.LiveChatRestClient: your auth-token has expired, send query with a new token');
						this.queryAuthRestore = true;
						this.restClient.callMethod(method, params, null, sendCallback, logTag).then(result => {
							this.queryAuthRestore = false;
							promise.fulfill(result);
						}).catch(result => {
							this.queryAuthRestore = false;
							promise.reject(result);
						});
						return false;
					}
				}
				this.queryAuthRestore = false;
				promise.reject(result);
			});
			return promise;
		}
		callBatch(calls, callback, bHaltOnError, sendCallback, logTag) {
			let resultCallback = result => {
				for (let method in calls) {
					if (!calls.hasOwnProperty(method)) {
						continue;
					}
					let error = result[method].error();
					if (error && error.ex.error == 'LIVECHAT_AUTH_WIDGET_USER') {
						this.setAuthId(error.ex.hash);
						if (method === RestMethod.widgetUserRegister) {
							console.warn(`BX.LiveChatRestClient: ${error.ex.error_description} (${error.ex.error})`);
							this.queryAuthRestore = false;
							callback(result);
							return false;
						}
						if (!this.queryAuthRestore) {
							console.warn('BX.LiveChatRestClient: your auth-token has expired, send query with a new token');
							this.queryAuthRestore = true;
							this.restClient.callBatch(calls, callback, bHaltOnError, sendCallback, logTag);
							return false;
						}
					}
				}
				this.queryAuthRestore = false;
				callback(result);
				return true;
			};
			return this.restClient.callBatch(calls, resultCallback, bHaltOnError, sendCallback, logTag);
		}
	}

	/**
	 * Bitrix Im
	 * Conference application
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2021 Bitrix
	 */

	class ConferenceApplication {
		/* region 01. Initialize */
		constructor(params = {}) {
			this.inited = false;
			this.hardwareInited = false;
			this.dialogInited = false;
			this.initPromise = new BX.Promise();
			this.params = params;
			this.params.userId = this.params.userId ? parseInt(this.params.userId) : 0;
			this.params.siteId = this.params.siteId || '';
			this.params.chatId = this.params.chatId ? parseInt(this.params.chatId) : 0;
			this.params.dialogId = this.params.chatId ? `chat${this.params.chatId.toString()}` : '0';
			this.params.passwordRequired = Boolean(this.params.passwordRequired);
			this.params.isBroadcast = Boolean(this.params.isBroadcast);
			BX.Messenger.Lib.Logger.setConfig(params.loggerConfig);
			this.messagesQueue = [];
			this.template = null;
			this.rootNode = this.params.node || document.createElement('div');
			this.event = new ui_vue.VueVendorV2();
			this.callContainer = null;
			this.viewPort = null;
			this.preCall = null;
			this.currentCall = null;
			// Calls where the user explicitly picked a microphone - hot-plug auto-switch must not override it.
			this.callsWithManualMicrophone = new WeakSet();
			this.callToken = this.params.callToken ?? null;
			this.videoStrategy = null;
			this.callDetails = {};
			this.showFeedback = true;
			this.callScheme = null;
			this.promotedToAdminTimeoutValue = 10 * 1000; // 10 sec
			this.promotedToAdminTimeout = null;
			this.featureConfig = {};
			(params.featureConfig || []).forEach(limit => {
				this.featureConfig[limit.id] = limit;
			});
			this.localVideoStream = null;

			// save reconnect camera
			this.lastUsedCameraId = null;
			this.reconnectingCameraId = null;
			this.conferencePageTagInterval = null;
			this.#initHandlers();
			call_lib_settingsManager.CallLogContextRegistry.registerProvider(this.#provideCallLogContext);
			this.waitingForCallStatus = false;
			this.waitingForCallStatusTimeout = null;
			this.callEventReceived = false;
			this.commonRecord = this.#getDefaultCommonRecord();
			this.screenShareStartTime = null;
			this.loopTimers = {};
			this.resizeObserver = new BX.ResizeObserver(() => {});
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				call_application_conferenceChannel.ConferenceChannel.getInstance().setExecuter(callUuid => {
					const currentCallUuid = this.params.alias;
					const hasView = Boolean(this.viewPort);
					const hasActiveCall = currentCallUuid === callUuid && hasView;
					if (hasActiveCall) {
						BXDesktopSystem.SetActiveTab();
					}
					return hasActiveCall;
				});
			}
			this.initDesktopEvents().then(() => this.initAdditionalEvents()).then(() => this.initRestClient()).then(() => this.subscribePreCallChanges()).then(() => this.subscribeNotifierEvents()).then(() => this.initPullClient()).then(() => this.initCore()).then(() => this.setModelData()).then(() => this.initComponent()).then(() => this.initCallInterface()).then(() => this.initHardware()).then(() => this.initUserComplete()).catch(error => {
				console.error('Init error', error);
			});
		}

		/**
		 * The identifier of the current user, the same one the rest of the client reads. `params.userId`
		 * does not answer it: a guest joins with a zero there and gets the real one only through
		 * `registerGuestUser`, which hands it to the controller and to the store.
		 */
		get userId() {
			return this.controller?.getUserId();
		}
		#startingCallLogContext = null;

		// One analytics event per reconnect series on each end of it; the engines limit reconnect events
		// differently, so the decision belongs here.
		#reconnectSeriesReporter = new Call.ReconnectSeriesReporter({
			getCall: () => this.currentCall,
			getCallId: () => this._getCallIdentifier(this.currentCall),
			getCallType: () => this.getCallType(),
			isVpnActive: () => this.#isVpnConnected()
		});

		// Live snapshot for accident log records; chatId is known before the call is created
		#provideCallLogContext = () => {
			const call = this.currentCall;
			const startingContext = this.#startingCallLogContext;

			// A mid-join to a different room must win over a call still lingering in currentCall
			if (main_core.Type.isStringFilled(startingContext?.roomId) && call?.uuid !== startingContext.roomId) {
				return startingContext;
			}
			if (call) {
				return {
					roomId: main_core.Type.isStringFilled(call.uuid) ? call.uuid : undefined,
					callId: this.#toCallLogNumber(call.id),
					chatId: this.#toCallLogNumber(this.params.chatId)
				};
			}

			// Before the call is bound, keep the ids known from join arguments; chatId is always known
			return startingContext ?? {
				chatId: this.#toCallLogNumber(this.params.chatId)
			};
		};
		#toCallLogNumber(value) {
			const numericValue = Number(value);
			return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
		}
		#beginStartingCallLogContext(context) {
			this.#startingCallLogContext = context;
			return context;
		}
		#endStartingCallLogContext(context) {
			if (this.#startingCallLogContext === context) {
				this.#startingCallLogContext = null;
			}
		}
		#initHandlers() {
			this.#initCallHandlers();
			this.#initAuxHandlers();
		}
		#initCallHandlers() {
			this.onCallUserInvitedHandler = this.onCallUserInvited.bind(this);
			this.onCallUserJoinedHandler = this.onCallUserJoined.bind(this);
			this.onCallDestroyHandler = this.onCallDestroy.bind(this);
			this.onCallUserStateChangedHandler = this.onCallUserStateChanged.bind(this);
			this.onCallUserMicrophoneStateHandler = this.onCallUserMicrophoneState.bind(this);
			this.onCallUserCameraStateHandler = this.onCallUserCameraState.bind(this);
			this.onNeedResetMediaDevicesStateHandler = this.onNeedResetMediaDevicesState.bind(this);
			this.onCallUserVideoPausedHandler = this.onCallUserVideoPaused.bind(this);
			this.onCallLocalMediaReceivedHandler = this.#onCallLocalMediaReceived.bind(this);
			this.onCallLocalMediaStoppedHandler = this.onCallLocalMediaStopped.bind(this);
			this.onCallRemoteMediaReceivedHandler = this.onCallRemoteMediaReceived.bind(this);
			this.onCallRemoteMediaStoppedHandler = this.onCallRemoteMediaStopped.bind(this);
			this.onCallRemoteMediaAvailableHandler = this.onCallRemoteMediaAvailable.bind(this);
			this.onCallRemoteMediaUnavailableHandler = this.onCallRemoteMediaUnavailable.bind(this);
			this.onCallUserVoiceStartedHandler = this.onCallUserVoiceStarted.bind(this);
			this.onCallUserVoiceStoppedHandler = this.onCallUserVoiceStopped.bind(this);
			this.onUserStatsReceivedHandler = this.onUserStatsReceived.bind(this);
			this.onCallUserScreenStateHandler = this.onCallUserScreenState.bind(this);
			this.onCallUserCommonRecordStateHandler = this.#onCallUserCommonRecordState.bind(this);
			this.onCloudRecordStatusChangedHandler = this.onCloudRecordStatusChanged.bind(this);
			this.onCallUserFloorRequestHandler = this.onCallUserFloorRequest.bind(this);
			this.onMicrophoneLevelHandler = this.onMicrophoneLevel.bind(this);
			this.onCallFailureHandler = this.#onCallFailure.bind(this);
		}
		#initAuxHandlers() {
			this._onCallJoinHandler = this.onCallJoin.bind(this);
			this.onCallLeaveHandler = this.onCallLeave.bind(this);
			this.onReconnectingHandler = this.onReconnecting.bind(this);
			this.onReconnectedHandler = this.onReconnected.bind(this);
			this.onReconnectingFailedHandler = this.onReconnectingFailed.bind(this);
			this.onReconnectSeriesOutcomeHandler = this.onReconnectSeriesOutcome.bind(this);
			this._onParticipantReconnectingHandler = this._onParticipantReconnecting.bind(this);
			this._onParticipantReconnectedHandler = this._onParticipantReconnected.bind(this);
			this.onUpdateLastUsedCameraIdHandler = this.onUpdateLastUsedCameraId.bind(this);
			this.onCallConnectionQualityChangedHandler = this.onCallConnectionQualityChanged.bind(this);
			this.onCallToggleRemoteParticipantVideoHandler = this.onCallToggleRemoteParticipantVideo.bind(this);
			this._onGetUserMediaEndedHandler = this.updateMediaDevices.bind(this);
			this._onGetUserMediaFailedHandler = this.onGetUserMediaFailed.bind(this);
			this._onSwitchTrackRecordStatusHandler = this.onUpdateCallCopilotState.bind(this);
			this.onCameraPublishingHandler = this.onCameraPublishing.bind(this);
			this.onMicrophonePublishingdHandler = this.onMicrophonePublishingd.bind(this);
			this._onTurnOnCameraHandler = this.onTurnOnCamera.bind(this);
			this._onAllParticipantsAudioMutedHandler = this.onAllParticipantsAudioMuted.bind(this);
			this._onAllParticipantsVideoMutedHandler = this.onAllParticipantsVideoMuted.bind(this);
			this._onAllParticipantsScreenshareHandler = this.onAllParticipantsScreenshareMuted.bind(this);
			this.onRoomSettingsChangedHandler = this.onRoomSettingsChanged.bind(this);
			this.onUserPermissionsChangedHandler = this.onUserPermissionsChanged.bind(this);
			this.onUserRoleChangedHandler = this.onUserRoleChanged.bind(this);
			this._onYouMuteAllParticipantsHandler = this.onYouMuteAllParticipants.bind(this);
			this.onInputFocusHandler = this.onInputFocus.bind(this);
			this.onInputBlurHandler = this.onInputBlur.bind(this);
			this.onPreCallDestroyHandler = this.onPreCallDestroy.bind(this);
			this.onPreCallUserStateChangedHandler = this.updatePreCallCounter.bind(this);
		}
		#onCallLocalMediaReceived(e) {
			if (this.viewPort) {
				const flipVideo = e.tag === 'main' || e.mediaRenderer ? Call__namespace.Hardware.enableMirroring : false;
				this.viewPort.setLocalStream(e);
				this.viewPort.flipLocalVideo(flipVideo);
				this.viewPort.setButtonActive('screen', this.currentCall.isScreenSharingStarted());
				if (this.currentCall.isScreenSharingStarted()) {
					this.screenShareStartTime = new Date();
					call_lib_analytics.Analytics.getInstance().onScreenShareStarted({
						callId: this.currentCall.uuid,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
					});
					this.togglePictureInPictureCallWindow({
						mediaReceived: true
					});
					if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
						this.layoutService?.showWebScreenSharePopup(Call__namespace.WebScreenSharePopup, this.viewPort.getButtonElement('screen'), () => this.onCallViewToggleScreenSharingButtonClick(), this.viewPort.container);
					}
					this.viewPort.updateButtons();
				} else {
					call_lib_analytics.Analytics.getInstance().onScreenShareStopped({
						callId: this.currentCall.uuid,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
						status: call_lib_analytics.Analytics.AnalyticsStatus.success,
						screenShareLength: Call.Util.getTimeText(this.screenShareStartTime)
					});
					this.screenShareStartTime = null;
					this.togglePictureInPictureCallWindow({
						mediaReceived: true
					});
					this.floatingWindowService?.hideScreenShareWindow();
					this.layoutService?.closeWebScreenSharePopup();
				}
				if (!this.currentCall.callFromMobile && !this.isViewerMode()) {
					this.checkAvailableCamera();
					this.checkAvailableMicrophone();
				}
			}
			if (this.currentCall && Call__namespace.Hardware.isCameraOn && e.tag === 'main' && e.stream.getVideoTracks().length === 0) {
				Call__namespace.Hardware.isCameraOn = false;
			}
		}
		#onCallUserCommonRecordState(e) {
			if (this.#canCloudRecord()) {
				return;
			}
			this.commonRecord.state = e.commonRecordState.state;
			this.commonRecord.initiatorId = e.commonRecordState.userId;
			if (Call.Util.isCommonRecordStateInactive(e.commonRecordState.state)) {
				this.commonRecord.info = null;
				this.commonRecord.initiatorId = null;
			} else {
				this.commonRecord.info = e.commonRecordState;
			}
			this.recordingUiService?.handleCommonRecordState({
				state: e.commonRecordState.state,
				initiatorId: e.commonRecordState.userId,
				currentUserId: this.userId,
				commonRecordState: e.commonRecordState,
				callId: this.currentCall.uuid,
				callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
			});
			if (this.#canLocalRecord() && e.userId === this.userId) {
				if (e.commonRecordState.state === Call__namespace.CallCommonRecordState.Started && e.commonRecordState.userId === this.userId) {
					this.recordingUiService?.handleLocalRecordStart({
						callId: this.currentCall.uuid,
						desktopCallId: Call__namespace.Util.getCallIdentifier(this.currentCall),
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
						callApiId: this.currentCall.id,
						callUuid: this.currentCall.uuid,
						dialogId: this.params.dialogId,
						dialogName: this.params.conferenceTitle,
						formatRecordDate: this.params.formatRecordDate || 'd.m.Y',
						recordType: this.commonRecord.type,
						isMicrophoneMuted: Call__namespace.Hardware.isMicrophoneMuted,
						// The conference lives in a window of its own, and the client puts no id into it.
						windowId: window.bxdWindowId || window.document.title
					});
				} else if (e.commonRecordState.state === Call__namespace.CallCommonRecordState.Stopped) {
					this.#stopCommonRecord();
				}
			}
		}
		#onCallFailure(e) {
			this.viewPort?.notifyConnectionLost();
			const errorCode = e.code || e.name || e.error;
			this.notificationService?.handleCallFailure({
				errorCode,
				isHttps: true,
				viewPort: this.viewPort
			});
			this.autoCloseCallView = false;
			if (this.currentCall) {
				// Above removeCallEvents(): this branch destroys the call itself, so neither onLeave nor
				// onDestroy reaches the conference afterwards.
				this.#reconnectSeriesReporter.reportCallLost();
				this.removeCallEvents();
				this.removeVideoStrategy();
				this.currentCall.destroy();
				this.currentCall = null;
			}
			Call__namespace.Hardware.isMicrophoneMuted = false;
		}

		/* region 01. Initialize methods */
		initDesktopEvents() {
			if (!im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				return Promise.resolve();
			}
			im_v2_lib_desktopApi.DesktopApi.subscribe('BXScreenMediaSharing', (id, title, x, y, width, height, app) => this.floatingWindowService?.showScreenShareWindow({
				title,
				x,
				y,
				width,
				height,
				app
			}));
			im_v2_lib_desktopApi.DesktopApi.subscribe('bxImUpdateCounterMessage', counter => {
				if (!this.controller) {
					return false;
				}
				this.controller.getStore().commit('conference/common', {
					messageCount: counter
				});
			});
			im_v2_lib_desktopApi.DesktopApi.subscribe('BXVpnStatusChange', status => {
				if (status) {
					this.notificationService?.showVpnIsActiveNotification();
				}
			});
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.focus, this.onInputFocusHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.blur, this.onInputBlurHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.userRenameFocus, this.onInputFocusHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.userRenameBlur, this.onInputBlurHandler);
			return Promise.resolve();
		}
		initAdditionalEvents() {
			// todo: fix it during refactoring
			window.addEventListener('focus', () => this.onWindowFocus());
			window.addEventListener('blur', () => this.onWindowBlur());
			document.body.addEventListener('click', evt => this.onDocumentBodyClick(evt));
			return Promise.resolve();
		}
		initRestClient() {
			this.restClient = new CallRestClient({
				endpoint: `${this.getHost()}/rest`
			});
			this.restClient.setConfId(this.params.conferenceId);
			return Promise.resolve();
		}
		subscribePreCallChanges() {
			BX.addCustomEvent(window, 'CallEvents::callCreated', this.onCallCreated.bind(this));
		}
		subscribeNotifierEvents() {
			ui_notificationManager.Notifier.subscribe('click', event => {
				const {
					id
				} = event.getData();
				if (id.startsWith('im-videconf')) {
					this.toggleChat();
				}
			});
		}
		initPullClient() {
			if (!this.params.isIntranetOrExtranet) {
				this.pullClient = new pull_client.PullClient({
					serverEnabled: true,
					userId: this.params.userId,
					siteId: this.params.siteId,
					restClient: this.restClient,
					skipStorageInit: true,
					configTimestamp: 0,
					skipCheckRevision: true,
					getPublicListMethod: 'call.channel.public.list'
				});
				return Promise.resolve();
			}
			this.pullClient = BX.PULL;
			return this.pullClient.start().then(() => {
				return Promise.resolve();
			});
		}
		initCore() {
			this.controller = new im_controller.Controller({
				host: this.getHost(),
				siteId: this.params.siteId,
				userId: this.params.userId,
				languageId: this.params.language,
				pull: {
					client: this.pullClient
				},
				rest: {
					client: this.restClient
				},
				vuexBuilder: {
					database: !im_lib_utils.Utils.browser.isIe(),
					databaseName: 'imol/call',
					databaseType: ui_vue_vuex.VuexBuilder.DatabaseType.localStorage,
					models: [call_model.ConferenceModel.create(), call_model.CallModel.create()]
				}
			});
			window.BX.Messenger.Application.Core = {
				controller: this.controller
			};
			return new Promise((resolve, reject) => {
				this.controller.ready().then(() => {
					resolve();
				});
			});
		}
		setModelData() {
			this.controller.getStore().commit('application/set', {
				dialog: {
					chatId: this.getChatId(),
					dialogId: this.getDialogId()
				},
				options: {
					darkBackground: true
				}
			});

			// set presenters ID list
			const presentersIds = this.params.presenters.map(presenter => presenter.id);
			this.controller.getStore().dispatch('conference/setBroadcastMode', {
				broadcastMode: this.params.isBroadcast
			});
			this.controller.getStore().dispatch('conference/setPresenters', {
				presenters: presentersIds
			});

			// set presenters info in users model
			this.params.presenters.forEach(presenter => {
				this.controller.getStore().dispatch('users/set', presenter);
			});
			if (this.params.passwordRequired) {
				this.controller.getStore().commit('conference/common', {
					passChecked: false
				});
			}
			if (this.params.conferenceTitle) {
				this.controller.getStore().dispatch('conference/setConferenceTitle', {
					conferenceTitle: this.params.conferenceTitle
				});
			}
			if (this.params.alias) {
				this.controller.getStore().commit('conference/setAlias', {
					alias: this.params.alias
				});
			}
			return Promise.resolve();
		}
		initComponent() {
			if (this.getStartupErrorCode()) {
				this.setError(this.getStartupErrorCode());
			}
			return new Promise((resolve, reject) => {
				this.controller.createVue(this, {
					el: this.rootNode,
					data: () => {
						return {
							dialogId: this.getDialogId()
						};
					},
					template: '<bx-im-component-conference-public :dialogId="dialogId"/>'
				}).then(vue => {
					this.template = vue;
					resolve();
				}).catch(error => reject(error));
			});
		}
		async initCallInterface() {
			try {
				this.callContainer = document.getElementById('bx-im-component-call-container');
				let hiddenButtons = ['camera', 'microphone', 'document'];
				if (this.isViewerMode()) {
					hiddenButtons = ['screen', 'record', 'floorRequest', 'document'];
				}
				if (!this.params.isIntranetOrExtranet) {
					hiddenButtons.push('record');
				}
				if (!Call.Util.isConferenceChatEnabled()) {
					hiddenButtons.push('chat');
				}
				const {
					View: LegacyView,
					LegacyCallViewAdapter
				} = await BX.Runtime.loadExtension('call.view');
				this.viewPort = new LegacyCallViewAdapter(new LegacyView({
					container: this.callContainer,
					showChatButtons: true,
					showUsersButton: true,
					showShareButton: this.getFeatureState('screenSharing') !== ConferenceApplication.FeatureState.Disabled,
					showRecordButton: this.getFeatureState('record') !== ConferenceApplication.FeatureState.Disabled,
					userLimit: Call.Util.getUserLimit(),
					isIntranetOrExtranet: Boolean(this.params.isIntranetOrExtranet),
					language: this.params.language,
					layout: im_lib_utils.Utils.device.isMobile() ? call_mapping.ViewLayout.Mobile : call_mapping.ViewLayout.Centered,
					uiState: call_mapping.ViewUiState.Preparing,
					blockedButtons: ['camera', 'microphone', 'floorRequest', 'screen', 'copilot'],
					localUserState: Call__namespace.UserState.Idle,
					hiddenTopButtons: !this.isBroadcast() || this.getBroadcastPresenters().length > 1 ? [] : ['grid'],
					hiddenButtons,
					broadcastingMode: this.isBroadcast(),
					broadcastingPresenters: this.getBroadcastPresenters(),
					isCopilotFeaturesEnabled: false,
					isCopilotActive: false,
					isWindowFocus: this.layoutService?.isWindowFocus ?? true,
					isVideoconf: true
				}));
				this.viewPort.subscribe(call_mapping.ViewEvent.onButtonClick, this.onCallButtonClick.bind(this));
				this.viewPort.subscribe(call_mapping.ViewEvent.onReplaceCamera, event => {
					const cameraId = event.data.deviceId;
					if (this.reconnectingCameraId) {
						this.setReconnectingCameraId(null);
					}
					Call__namespace.Hardware.defaultCamera = cameraId;
					if (this.currentCall) {
						this.currentCall.setCameraId(cameraId);
					} else {
						this.template.$emit('cameraSelected', cameraId);
					}
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onReplaceMicrophone, event => {
					const microphoneId = event.data.deviceId;
					Call__namespace.Hardware.defaultMicrophone = microphoneId;
					if (this.viewPort) {
						this.viewPort.setMicrophoneId(microphoneId);
					}
					if (this.currentCall) {
						this.callsWithManualMicrophone.add(this.currentCall);
						this.currentCall.setMicrophoneId(microphoneId);
					} else {
						this.template.$emit('micSelected', event.data.deviceId);
					}
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onReplaceSpeaker, event => {
					Call__namespace.Hardware.defaultSpeaker = event.data.deviceId;
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onHasMainStream, event => {
					if (this.currentCall && this.currentCall.provider === Call__namespace.Provider.Bitrix) {
						this.currentCall.setMainStream(event.data);
					}
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onChangeNoiseSuppression, event => {
					Call__namespace.Hardware.enableNoiseSuppression = event.data.allowNoiseSuppression;
					Call__namespace.Hardware.turnNoiseSuppression();
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onChangeMicAutoParams, event => {
					Call__namespace.Hardware.enableMicAutoParameters = event.data.allowMicAutoParams;
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onChangeFaceImprove, event => {
					if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
						im_v2_lib_desktopApi.DesktopApi.setCameraSmoothingStatus(event.data.faceImproveEnabled);
					}
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onUserRename, event => {
					if (!this.isExternalUser()) {
						return;
					}
					im_lib_utils.Utils.device.isMobile() ? this.renameGuestMobile(event.data.newName) : this.renameGuest(event.data.newName);
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onUserPinned, event => {
					if (event.data.userId) {
						this.updateCallUser(event.data.userId, {
							pinned: true
						});
						return;
					}
					this.controller.getStore().dispatch('call/unpinUser');
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onToggleSubscribe, e => {
					if (this.currentCall && this.currentCall.provider === Call__namespace.Provider.Bitrix && e.data) {
						this.currentCall.toggleRemoteParticipantVideo(e.data.participants, e.data.showVideo, true);
					}
				});
				this.viewPort.subscribe(call_mapping.ViewEvent.onCommonRecordMenu, event => {
					const isPlainCall = this.currentCall?.provider === Call__namespace.Provider.Plain;
					const isBitrixCall = this.currentCall?.provider === Call__namespace.Provider.Bitrix;
					this.recordingUiService?.onCommonRecordMenu(event.data, {
						commonRecordState: this.commonRecord,
						cloudRecordEnabled: isPlainCall && this.currentCall?.isCloudRecordFeaturesEnabled || isBitrixCall,
						isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
						callId: this.currentCall?.id
					});
				});

				// the panel builds its buttons while it renders, so this is the first moment the record
				// button exists: a kind told to the view before it was created was skipped
				this.viewPort.subscribe(call_mapping.ViewEvent.onShow, () => this.#syncRecordButtonPopupKind());
				this.viewPort.setCallback(call_mapping.ViewEvent.onChangeVideoQuality, event => {
					if (this.currentCall && this.currentCall.provider === Call__namespace.Provider.Bitrix) {
						this.currentCall.setVideoQualityForStreams({
							isCameraWasEnabledBeforeQualityChanged: event.isCameraWasEnabledBeforeQualityChanged,
							videoQuality: event.videoQuality,
							otherUsers: this.currentCall.users
						});
					}
				});
				this.viewPort.setCallback(call_mapping.ViewEvent.onTurnOffParticipantMic, e => this._onCallViewTurnOffParticipantStream(e, 'mic'));
				this.viewPort.setCallback(call_mapping.ViewEvent.onTurnOffParticipantCam, e => this._onCallViewTurnOffParticipantStream(e, 'cam'));
				this.viewPort.setCallback(call_mapping.ViewEvent.onTurnOffParticipantScreenshare, e => this._onCallViewTurnOffParticipantStream(e, 'screenshare'));
				this.viewPort.setCallback(call_mapping.ViewEvent.onAllowSpeakPermission, e => this._onCallViewChangeSpeakPermission(e, true));
				this.viewPort.setCallback(call_mapping.ViewEvent.onDisallowSpeakPermission, e => this._onCallViewChangeSpeakPermission(e, false));
				this.viewPort.setCallback(call_mapping.ViewEvent.onPushToTalkShortPress, () => this.onPushToTalkShortPress());
				this.viewPort.blockAddUser();
				this.viewPort.blockHistoryButton();
				if (!im_lib_utils.Utils.device.isMobile()) {
					this.viewPort.show();
				}
				this._initUiServices();
			} catch (error) {
				im_lib_logger.Logger.error('creating call interface conference', error);
				let errorCode = 'UNKNOWN_ERROR';
				if (main_core.Type.isString(error)) {
					errorCode = error;
				} else if (main_core.Type.isPlainObject(error) && error.code) {
					errorCode = error.code == 'access_denied' ? 'ACCESS_DENIED' : error.code;
				}
				this.onCallFailure({
					code: errorCode,
					message: error.message || ''
				});
				throw new Error('call interface error');
			}
		}
		_initUiServices() {
			this.buttonStateService = new Call.ButtonStateService({
				viewPort: this.viewPort
			});
			this.layoutService = new Call.LayoutService({
				viewPort: this.viewPort,
				container: this.callContainer,
				resizeObserver: this.resizeObserver
			});
			this.notificationService = new Call.NotificationService({
				viewPort: this.viewPort,
				container: this.callContainer,
				onAskSpeakButtonClicked: () => this.onCallViewFloorRequestButtonClick(),
				onUnmuteMicButtonClicked: () => this.onCallViewToggleMuteButtonClick({
					data: {
						muted: false
					}
				})
			});
			this.pipService = new Call.PictureInPictureService({
				viewPort: this.viewPort
			});
			this.layoutService.subscribe('LayoutService::onFold', () => {
				this.copilotUiService?.closeNotify();
				this.pipService?.toggle({
					hasActiveCall: Boolean(this.currentCall),
					isFolded: this.layoutService.isFolded,
					isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
					enableAutoPip: this.viewPort?.enableAutoPip
				});
				this.notificationService?.onFolded();
			});
			this.layoutService.subscribe('LayoutService::onUnfold', ({
				data
			}) => {
				const {
					fromPiP
				} = data;
				this.pipService?.toggle({
					isForceClose: fromPiP,
					hasActiveCall: Boolean(this.currentCall),
					isFolded: false,
					isScreenSharing: false
				});
			});
			this.layoutService.subscribe('LayoutService::onUnfoldDetached', () => {
				this.floatingWindowService?.hide();
				this.floatingWindowService?.hideScreenShareWindow();
			});
			this.layoutService.subscribe('LayoutService::onShowChat', () => this.layoutService.fold(this.params.name ?? ''));
			this.layoutService.subscribe('LayoutService::onShowWebScreenSharePopup', () => {
				this.layoutService?.showWebScreenSharePopup(Call__namespace.WebScreenSharePopup, this.viewPort?.getButtonElement('screen'), () => this.onCallViewToggleScreenSharingButtonClick(), this.viewPort?.container);
			});
			this.layoutService.subscribe('LayoutService::onHideScreenShare', () => {
				this.floatingWindowService?.hideScreenShareWindow();
			});
			this.layoutService.subscribe('LayoutService::onTogglePiP', () => {
				this.togglePictureInPictureCallWindow();
			});
			this.hangupOptionsUiService = new Call.HangupOptionsUiService({
				viewPort: this.viewPort,
				container: this.callContainer
			});
			this.feedbackUiService = new Call.FeedbackUiService({
				viewPort: this.viewPort,
				container: this.callContainer
			});
			this.hangupOptionsUiService.subscribe('HangupOptionsUiService::onFinishForAll', ({
				data
			}) => {
				const {
					callId,
					callType,
					chatId,
					callUsersCount,
					callLength
				} = data;
				call_lib_analytics.Analytics.getInstance().onFinishCall({
					callId,
					callType,
					status: call_lib_analytics.Analytics.AnalyticsStatus.finishedForAll,
					chatId,
					callUsersCount,
					callLength
				});
				this.stopLocalVideoStream();
				this.endCall(true);
			});
			this.hangupOptionsUiService.subscribe('HangupOptionsUiService::onLeaveCall', ({
				data
			}) => {
				const {
					callId,
					callType
				} = data;
				call_lib_analytics.Analytics.getInstance().onDisconnectCall({
					callId,
					callType,
					subSection: call_lib_analytics.Analytics.AnalyticsSubSection.contextMenu,
					mediaParams: {
						video: Call__namespace.Hardware.isCameraOn,
						audio: !Call__namespace.Hardware.isMicrophoneMuted
					}
				});
				this.stopLocalVideoStream();
				this.endCall();
			});
			this.recordingUiService = new Call.RecordingUiService({
				viewPort: this.viewPort
			});
			this.recordingUiService.subscribe('RecordingUiService::onStartRecord', ({
				data
			}) => {
				const {
					recordType,
					isCloud
				} = data;
				this.commonRecord.type = recordType;
				if (isCloud) {
					const kind = recordType === Call__namespace.CallCommonRecordType.Audio ? Call__namespace.CloudRecordKind.AUDIO : Call__namespace.CloudRecordKind.VIDEO;
					this.buttonStateService?.blockRecordButton();
					this.currentCall.setCloudRecordState(Call__namespace.CloudRecordStatus.STARTED, kind);
				} else {
					this.commonRecord.state = Call__namespace.CallCommonRecordState.Started;
					this.buttonStateService?.activateRecordButton(true);
					this.currentCall.sendLocalRecordState({
						action: Call__namespace.CallCommonRecordState.Started,
						type: this.commonRecord.type,
						date: new Date()
					});
				}
			});
			this.recordingUiService.subscribe('RecordingUiService::onStopRecord', ({
				data
			}) => {
				const {
					state,
					isCloud
				} = data;
				if (isCloud) {
					const cloudStatusMap = {
						[Call__namespace.CallCommonRecordState.Paused]: Call__namespace.CloudRecordStatus.PAUSED,
						[Call__namespace.CallCommonRecordState.Resumed]: Call__namespace.CloudRecordStatus.STARTED,
						[Call__namespace.CallCommonRecordState.Stopped]: Call__namespace.CloudRecordStatus.STOPPED
					};
					this.currentCall.setCloudRecordState(cloudStatusMap[state]);
					this.commonRecord.state = state;
					return;
				}
				if (state === Call__namespace.CallCommonRecordState.Paused && this.#canLocalRecord()) {
					BXDesktopSystem.CallRecordPause(true);
				} else if (state === Call__namespace.CallCommonRecordState.Resumed && this.#canLocalRecord()) {
					BXDesktopSystem.CallRecordPause(false);
				}
				this.currentCall.sendLocalRecordState({
					action: state,
					type: this.commonRecord.type,
					date: new Date()
				});
				this.commonRecord.state = state;
			});
			this.recordingUiService.subscribe('RecordingUiService::onDestroyRecord', ({
				data
			}) => {
				const {
					isCloud
				} = data;
				if (isCloud) {
					this.currentCall.setCloudRecordState(Call__namespace.CloudRecordStatus.DESTROYED);
					this.commonRecord.state = Call__namespace.CallCommonRecordState.Destroyed;
					return;
				}
				this.currentCall.sendLocalRecordState({
					action: Call__namespace.CallCommonRecordState.Destroyed,
					type: this.commonRecord.type,
					date: new Date()
				});
				this.commonRecord.state = Call__namespace.CallCommonRecordState.Destroyed;
			});
			this.recordingUiService.subscribe('RecordingUiService::onLocalRecordStartFailed', () => {
				this.notificationService?.showLocalRecordStartFailed();
				this.#stopCommonRecord();
			});
			this.copilotUiService = new Call.CopilotUiService({
				viewPort: this.viewPort,
				container: this.callContainer,
				CopilotPopupClass: Call.CopilotPopup,
				onTariffGate: () => Call.Util.openArticle(Call.CallAI.helpSlider)
			});
			this.copilotUiService.subscribe('CopilotUiService::onChangeStateCopilot', ({
				data
			}) => {
				const {
					desiredState
				} = data;
				const actionMap = {
					enabled: 'call.Track.start',
					paused: 'call.Track.stop',
					destroyed: 'call.Track.destroy'
				};
				const action = actionMap[desiredState];
				if (!action) {
					return;
				}
				BX.ajax.runAction(action, {
					data: {
						callId: this.currentCall?.id
					}
				}).then(() => {
					const isCopilotActive = desiredState === 'enabled';
					this.onUpdateCallCopilotState({
						isTrackRecordOn: isCopilotActive
					});
					this.copilotUiService?.updateState({
						isCopilotActive,
						callId: this.currentCall?.id
					});
				});
			});
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				this.floatingWindowService = new Call.FloatingWindowService({
					floatingVideo: false,
					floatingScreenShare: true,
					darkMode: false
				});
				this.floatingWindowService.subscribe('FloatingWindowService::onBackToCall', () => {
					im_v2_lib_desktopApi.DesktopApi.activateWindow();
					im_v2_lib_desktopApi.DesktopApi.changeTab('im');
					this.layoutService?.unfold();
				});
				this.floatingWindowService.subscribe('FloatingWindowService::onStopSharing', () => {
					im_v2_lib_desktopApi.DesktopApi.activateWindow();
					im_v2_lib_desktopApi.DesktopApi.changeTab('im');
					this.onCallViewToggleScreenSharingButtonClick();
				});
				this.floatingWindowService.subscribe('FloatingWindowService::onChangeScreen', () => {
					if (this.currentCall) {
						this.currentCall.startScreenSharing(true);
					}
				});
			}

			// the services are built after the panel has been shown, so the first onShow found nobody to
			// answer it: the button is already rendered and is told its layer here
			this.#syncRecordButtonPopupKind();
		}
		initUserComplete() {
			return new Promise((resolve, reject) => {
				this.initUser().then(() => this.tryJoinExistingCall()).then(() => this.initCall()).then(() => this.startPageTagInterval()).then(() => this.initPullHandlers()).then(() => this.subscribeToStoreChanges()).then(() => this.initComplete()).then(() => resolve).catch(error => reject(error));
			});
		}
		/* endregion 01. Initialize methods */

		/* region 02. initUserComplete methods */
		initUser() {
			return new Promise((resolve, reject) => {
				if (this.getStartupErrorCode() || !this.getConference().common.passChecked) {
					return reject();
				}
				if (this.params.userId > 0) {
					this.controller.setUserId(this.params.userId);
					if (this.params.isIntranetOrExtranet) {
						this.switchToSessAuth();
						this.controller.getStore().commit('conference/user', {
							id: this.params.userId
						});
					} else {
						const hashFromCookie = this.getUserHashCookie();
						if (hashFromCookie) {
							call_lib_callTokenManager.CallTokenManager.setQueryParams({
								call_auth_id: hashFromCookie,
								videoconf_id: this.params.conferenceId
							});
							this.restClient.setAuthId(hashFromCookie);
							this.restClient.setChatId(this.getChatId());
							this.controller.getStore().commit('conference/user', {
								id: this.params.userId,
								hash: hashFromCookie,
								hasCustomName: this.params.hasCustomName
							});
							this.pullClient.start();
						}
					}
					return resolve();
				}
				return this.registerGuestUser(resolve);
			});
		}
		registerGuestUser(resolve) {
			this.restClient.setAuthId('guest');
			this.restClient.setChatId(this.getChatId());
			if (typeof BX.SidePanel !== 'undefined') {
				BX.SidePanel.Instance.disableAnchorBinding();
			}
			return this.restClient.callMethod('call.user.register', {
				alias: this.params.alias,
				user_hash: this.getUserHashCookie() || ''
			}).then(result => {
				const {
					id,
					hash,
					hasCustomName,
					userToken,
					created
				} = result.data();
				main_core.Loc.setMessage('USER_ID', String(id));
				this.controller.getStore().commit('conference/user', {
					id,
					hash,
					hasCustomName
				});
				this.controller.setUserId(id);
				this.viewPort.setLocalUserId(id);
				Call__namespace.Engine.setCurrentUserId(this.controller.getUserId());
				Call__namespace.EngineLegacy.setCurrentUserId(this.controller.getUserId());
				call_lib_callTokenManager.CallTokenManager.setUserToken(userToken);
				if (created) {
					this.params.userCount++;
				}
				call_lib_callTokenManager.CallTokenManager.setQueryParams({
					call_auth_id: hash,
					videoconf_id: this.params.conferenceId
				});
				this.restClient.setAuthId(hash);
				void this.pullClient.start();
				return resolve();
			});
		}
		startPageTagInterval() {
			return new Promise(resolve => {
				clearInterval(this.conferencePageTagInterval);
				this.conferencePageTagInterval = setInterval(() => {
					im_lib_localstorage.LocalStorage.set(this.params.siteId, this.params.userId, this.callEngine.getConferencePageTag(this.params.dialogId), 'Y', 2);
				}, 1000);
				resolve();
			});
		}
		tryJoinExistingCall() {
			return new Promise((resolve, reject) => {
				const url = call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled ? 'call.Call.tryJoinCall' : 'call.CallManager.tryJoinCall';
				const callTypeKey = call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled ? 'callType' : 'type';
				BX.ajax.runAction(url, {
					data: {
						entityType: 'chat',
						entityId: this.params.dialogId,
						provider: Call__namespace.Provider.Bitrix,
						[callTypeKey]: Call__namespace.Type.Permanent
					}
				}).then(result => {
					const data = result.data;
					im_lib_logger.Logger.warn('tryJoinCall', data);
					if (data.success) {
						this.waitingForCallStatus = true;
						this.callScheme = data.call.SCHEME;
						if (this.callScheme === Call__namespace.CallScheme.jwt) {
							this.callToken = data.callToken;
							Call__namespace.Engine.instantiateCall(data.call, data.callToken, data.logToken, data.userData);
						} else {
							Call__namespace.EngineLegacy.instantiateCall(data.call, data.users, data.logToken, data.connectionData, data.userData);
						}
						this.waitingForCallStatusTimeout = setTimeout(() => {
							this.waitingForCallStatus = false;
							if (!this.callEventReceived) {
								this.setConferenceStatus(false);
							}
							this.callEventReceived = false;
						}, 5000);
					} else {
						this.setConferenceStatus(false);
					}
					resolve();
				}).catch(() => {
					this.setConferenceStatus(false);
					resolve();
				});
			});
		}
		initCall() {
			return new Promise(resolve => {
				if (this.callScheme) {
					this.callEngine = this.callScheme === Call__namespace.CallScheme.jwt ? Call__namespace.Engine : Call__namespace.EngineLegacy;
				} else {
					this.callEngine = call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled ? Call__namespace.Engine : Call__namespace.EngineLegacy;
				}
				Call__namespace.Engine.setRestClient(this.restClient);
				Call__namespace.Engine.setPullClient(this.pullClient);

				// this is a workaround to use actual parameters for conference guests in Util
				// since we don't know if a call is legacy or not when we make a REST request
				Call__namespace.EngineLegacy.setRestClient(this.restClient);
				Call__namespace.EngineLegacy.setPullClient(this.pullClient);
				this.viewPort.unblockButtons(['chat']);
				this.controller.getStore().commit('conference/common', {
					inited: true
				});
				resolve();
			});
		}
		initPullHandlers() {
			this.pullClient.subscribe(new im_provider_pull.ImCallPullHandler({
				store: this.controller.getStore(),
				application: this,
				controller: this.controller
			}));
			return Promise.resolve();
		}
		subscribeToStoreChanges() {
			this.controller.getStore().subscribe((mutation, state) => {
				const {
					payload,
					type
				} = mutation;
				if (type === 'users/update' && payload.fields.name) {
					if (!this.viewPort) {
						return false;
					}
					this.layoutService?.setAuthoritativeUserName(payload.id, payload.fields.name);
					this.viewPort.updateUserData({
						[payload.id]: {
							name: payload.fields.name
						}
					});
				} else if (type === 'dialogues/set') {
					if (payload[0].dialogId !== this.getDialogId()) {
						return false;
					}
					if (!im_lib_utils.Utils.platform.isBitrixDesktop()) {
						if (Number.isNaN(parseInt(payload[0].counter, 10))) {
							Call.Util.sendLog(`[conf] setButtonCounter chat: payload[0].counter = ${payload[0].counter} (NaN)`);
						}
						this.buttonStateService?.setChatCounter(payload[0].counter);
					}
				} else if (type === 'dialogues/update') {
					if (payload.dialogId !== this.getDialogId()) {
						return false;
					}
					if (typeof payload.fields.counter === 'number' && this.viewPort) {
						if (im_lib_utils.Utils.platform.isBitrixDesktop()) {
							if (payload.actionName === 'decreaseCounter' && !payload.dialogMuted && typeof payload.fields.previousCounter === 'number') {
								let counter = payload.fields.counter;
								if (this.getConference().common.messageCount) {
									counter = this.getConference().common.messageCount - (payload.fields.previousCounter - counter);
									if (counter < 0) {
										counter = 0;
									}
								}
								if (Number.isNaN(parseInt(counter, 10))) {
									Call.Util.sendLog(`[conf] setButtonCounter chat: counter = ${counter} (NaN)`);
								}
								this.buttonStateService?.setChatCounter(counter);
							}
						} else {
							if (Number.isNaN(parseInt(payload.fields.counter, 10))) {
								Call.Util.sendLog(`[conf] setButtonCounter chat:  payload.fields.counter = ${payload.fields.counter} (NaN)`);
							}
							this.buttonStateService?.setChatCounter(payload.fields.counter);
						}
					}
					if (typeof payload.fields.name !== 'undefined') {
						document.title = payload.fields.name.toString();
					}
				} else if (type === 'conference/common' && typeof payload.messageCount === 'number' && this.viewPort) {
					if (Number.isNaN(parseInt(payload.messageCount, 10))) {
						Call.Util.sendLog(`[conf] setButtonCounter chat: payload.messageCount = ${payload.messageCount} (NaN)`);
					}
					this.buttonStateService?.setChatCounter(payload.messageCount);
				}
			});
		}
		initComplete() {
			if (this.isExternalUser()) {
				if (this.viewPort.localUser) {
					this.viewPort.localUser.userModel.allowRename = true;
				}
			}
			if (this.getConference().common.inited) {
				this.inited = true;
				this.initPromise.resolve(this);
			}
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				im_v2_lib_desktopApi.DesktopApi.emitToMainWindow('bxConferenceLoadComplete', []);
			}
			return Promise.resolve();
		}
		/* endregion 02. initUserComplete methods */
		/* endregion 01. Initialize */

		/* region 02. Methods */

		/* region 01. Call methods */
		initHardware() {
			return new Promise((resolve, reject) => {
				Call__namespace.Hardware.init().then(() => {
					if (this.hardwareInited) {
						resolve();
						return true;
					}
					if (Object.values(Call__namespace.Hardware.microphoneList).length === 0) {
						this.setError(call_const.ConferenceErrorCode.missingMicrophone);
					}
					if (!this.isViewerMode()) {
						this.checkAvailableCamera();
						this.checkAvailableMicrophone();
						this.viewPort.enableMediaSelection();
					}
					Call__namespace.Hardware.subscribe(Call__namespace.Hardware.Events.deviceChanged, this._onDeviceChange.bind(this));
					this.hardwareInited = true;
					resolve();
				}).catch(error => {
					if (error === 'NO_WEBRTC' && this.isHttps()) {
						this.setError(call_const.ConferenceErrorCode.unsupportedBrowser);
					} else if (error === 'NO_WEBRTC' && !this.isHttps()) {
						this.setError(call_const.ConferenceErrorCode.unsafeConnection);
					}
					im_lib_logger.Logger.error('Init hardware error', error);
					reject(error);
				});
			});
		}
		_onDeviceChange(e) {
			if (!this.currentCall || !this.currentCall.ready) {
				this.checkAvailableCamera();
				this.checkAvailableMicrophone();
				return;
			}
			const allAddedDevice = e.data.added;
			const allRemovedDevice = e.data.removed;
			const removed = Call__namespace.Hardware.getRemovedUsedDevices(e.data.removed, {
				microphoneId: this.currentCall.microphoneId,
				cameraId: this.currentCall.cameraId,
				speakerId: this.viewPort.speakerId
			});
			if (allAddedDevice) {
				setTimeout(() => this.useDevicesInCurrentCall(allAddedDevice), 500);
			}
			this.notificationService?.showDevicesDetachedNotification(removed);
			if (allRemovedDevice) {
				setTimeout(() => this.removeDevicesFromCurrentCall(allRemovedDevice), 500);
			}
		}
		#setDefaultDeviceIfNeeded(type) {
			const hasDevice = type === 'camera' ? Call__namespace.Hardware.hasCamera() : Call__namespace.Hardware.hasMicrophone();
			const defaultKey = type === 'camera' ? 'defaultCamera' : 'defaultMicrophone';
			const listKey = type === 'camera' ? 'cameraList' : 'microphoneList';
			const defaultDevice = Call__namespace.Hardware[defaultKey];
			const deviceList = Call__namespace.Hardware[listKey];
			if (!hasDevice || defaultDevice && defaultDevice in deviceList) {
				return;
			}
			if (!defaultDevice && Object.keys(deviceList).length > 0) {
				Call__namespace.Hardware[defaultKey] = Object.keys(deviceList)[0];
				return;
			}
			Call__namespace.Hardware[defaultKey] = '';
		}
		checkAvailableCamera() {
			const isCameraButtonHasBlocked = this.viewPort.isButtonBlocked('camera');
			if (!this.currentCall && !Call__namespace.Hardware.hasCamera()) {
				this.buttonStateService?.blockCameraButton();
			} else {
				this.buttonStateService?.unblockCameraButton();
			}
			this.#setDefaultDeviceIfNeeded('camera');
			const isActiveState = Call__namespace.Hardware.hasCamera() && Call__namespace.Hardware.defaultCamera;
			if (!this.currentCall && isCameraButtonHasBlocked) {
				this.template.$emit('setCameraState', isActiveState);
				this.template.$emit('cameraSelected', Call__namespace.Hardware.defaultCamera);
			}
			this.viewPort.updateButtons();
		}
		checkAvailableMicrophone() {
			if (!this.currentCall && !Call__namespace.Hardware.hasMicrophone()) {
				this.buttonStateService?.blockMicrophoneButton();
			} else {
				this.buttonStateService?.unblockMicrophoneButton();
			}
			this.#setDefaultDeviceIfNeeded('microphone');
			const isActiveState = Call__namespace.Hardware.hasMicrophone();
			if (!this.currentCall) {
				this.template.$emit('setMicState', isActiveState);
				this.template.$emit('micSelected', Call__namespace.Hardware.defaultCamera);
			}
			this.viewPort.updateButtons();
		}
		useDevicesInCurrentCall(deviceList, isForceUse = false) {
			if (!this.currentCall || !this.currentCall.ready) {
				return;
			}
			for (const deviceInfo of deviceList) {
				switch (deviceInfo.kind) {
					case 'audioinput':
						{
							// Pick up any plugged-in microphone, but never override an explicit manual choice.
							const microphoneManuallySelected = this.callsWithManualMicrophone.has(this.currentCall);
							if (isForceUse || !microphoneManuallySelected) {
								const newDeviceId = Call__namespace.Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audioinput');
								this.currentCall.setMicrophoneId(newDeviceId);
								this.viewPort.setMicrophoneId(newDeviceId);
							}
							this.checkAvailableMicrophone();
							break;
						}
					case 'videoinput':
						if (deviceInfo.deviceId === 'default' || isForceUse) {
							this.currentCall.setCameraId(deviceInfo.deviceId);
						}
						if (this.reconnectingCameraId === deviceInfo.deviceId && !Call__namespace.Hardware.isCameraOn) {
							this.updateCameraSettingsInCurrentCallAfterReconnecting(deviceInfo.deviceId);
						}
						this.checkAvailableCamera();
						break;
					case 'audiooutput':
						if (this.viewPort && deviceInfo.deviceId === 'default' || isForceUse) {
							const newDeviceId = Call__namespace.Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audiooutput');
							this.viewPort.setSpeakerId(newDeviceId);
						}
						break;
				}
			}
		}
		removeDevicesFromCurrentCall(deviceList) {
			if (!this.currentCall || !this.currentCall.ready) {
				return;
			}
			for (const deviceInfo of deviceList) {
				switch (deviceInfo.kind) {
					case 'audioinput':
						if (this.currentCall.microphoneId == deviceInfo.deviceId) {
							const microphoneIds = Object.keys(Call__namespace.Hardware.microphoneList);
							let deviceId;
							if (microphoneIds.includes('default')) {
								const deviceGroup = Call__namespace.Hardware.getDeviceGroupIdByDeviceId('default', 'audioinput');
								deviceId = Call__namespace.Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audioinput');
							}
							if (!deviceId) {
								deviceId = microphoneIds.length > 0 ? microphoneIds[0] : '';
							}
							this.currentCall.setMicrophoneId(deviceId);
							if (this.currentCall.provider === Call__namespace.Provider.Bitrix) {
								this.viewPort.setMicrophoneId(deviceId);
							}
						}
						this.checkAvailableMicrophone();
						break;
					case 'videoinput':
						if (this.currentCall.cameraId == deviceInfo.deviceId) {
							const cameraIds = Object.keys(Call__namespace.Hardware.cameraList);
							this.currentCall.setCameraId(cameraIds.length > 0 ? cameraIds[0] : '');
						}
						this.checkAvailableCamera();
						break;
					case 'audiooutput':
						if (this.viewPort && this.viewPort.speakerId == deviceInfo.deviceId) {
							const speakerIds = Object.keys(Call__namespace.Hardware.audioOutputList);
							let deviceId;
							if (speakerIds.includes('default')) {
								const deviceGroup = Call__namespace.Hardware.getDeviceGroupIdByDeviceId('default', 'audiooutput');
								deviceId = Call__namespace.Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audiooutput');
							}
							if (!deviceId) {
								this.viewPort.setSpeakerId(speakerIds.length > 0 ? speakerIds[0] : '');
							}
						}
						break;
				}
			}
		}
		startCall(videoEnabled, viewerMode = false, withCopilot) {
			if (this.initCallPromise) {
				return;
			}
			if (im_lib_utils.Utils.device.isMobile()) {
				this.viewPort.show();
				if (Number.isNaN(parseInt(this.getDialogData().counter, 10))) {
					Call.Util.sendLog(`[conf] setButtonCounter chat: this.getDialogData().counter = ${this.getDialogData().counter} (NaN)`);
				}
				this.buttonStateService?.setChatCounter(this.getDialogData().counter);
			} else {
				this.viewPort.setLayout(call_mapping.ViewLayout.Grid);
			}
			this.viewPort.setUiState(call_mapping.ViewUiState.Calling);
			if (videoEnabled && !Call__namespace.Hardware.hasCamera()) {
				this.notificationService?.showNotification(BX.message('IM_CALL_NO_CAMERA_ERROR'));
				videoEnabled = false;
			}
			if (this.localVideoStream && !videoEnabled) {
				this.stopLocalVideoStream();
			}
			this.controller.getStore().commit('conference/startCall');
			let createdCall = null;
			let callTokenPromise = Promise.resolve(this.callToken);
			if (call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled && !this.callToken) {
				callTokenPromise = call_lib_callTokenManager.CallTokenManager.getToken(this.params.chatId);
			}
			callTokenPromise.then(callToken => {
				this.callToken = callToken;
				call_lib_callTokenManager.CallTokenManager.setToken(this.params.chatId, this.callToken);
				return this.callEngine.createCall(this.getCallConfig(videoEnabled)).then(e => {
					im_lib_logger.Logger.warn('call created', e);
					this.currentCall = e.call;
					createdCall = e.call;
					if (this.promotedToAdminTimeout) {
						clearTimeout(this.promotedToAdminTimeout);
					}
					if (!call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled) {
						this.onUpdateCallCopilotState({
							isTrackRecordOn: this.currentCall.isCopilotActive
						});
					}
					if (Call__namespace.Hardware.defaultMicrophone) {
						this.currentCall.setMicrophoneId(Call__namespace.Hardware.defaultMicrophone);
					}
					if (Call__namespace.Hardware.defaultCamera) {
						this.currentCall.setCameraId(Call__namespace.Hardware.defaultCamera);
					}
					this.checkAvailableMicrophone();
					this.checkAvailableCamera();
					if (!im_lib_utils.Utils.device.isMobile()) {
						this.viewPort.setLayout(call_mapping.ViewLayout.Grid);
					}
					if (call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled) {
						const userData = this.controller.getStore().getters['users/get'](this.controller.getUserId(), true);
						this.viewPort.appendUsers([userData.id]);
						this.viewPort.updateUserData({
							[userData.id]: userData
						});
					} else {
						this.viewPort.appendUsers(this.currentCall.getUsers());
						Call.Util.getUsers(this.currentCall.id, this.getCallUsers(true)).then(userData => {
							this.updateCallViewUsers(userData);
						});
					}
					this.releasePreCall();
					this.bindCallEvents();
					this.updateCallUser(this.currentCall.userId, {
						microphoneState: !Call__namespace.Hardware.isMicrophoneMuted
					});
					if (e.isNew) {
						call_lib_analytics.Analytics.getInstance().onStartVideoconf({
							callId: this.currentCall?.uuid,
							withVideo: videoEnabled,
							mediaParams: {
								video: Call__namespace.Hardware.isCameraOn,
								audio: !Call__namespace.Hardware.isMicrophoneMuted
							},
							status: call_lib_analytics.Analytics.AnalyticsStatus.success,
							isCopilotActive: this.currentCall.isCopilotActive,
							isVpnActive: this.#isVpnConnected(),
							userCounter: this.currentCall.associatedEntity?.userCounter
						});
						this.currentCall.inviteUsers();
					} else {
						this.currentCall.answer({
							joinAsViewer: viewerMode
						});
						call_lib_analytics.Analytics.getInstance().onJoinVideoconf({
							callId: this.currentCall?.uuid,
							withVideo: videoEnabled,
							mediaParams: {
								video: Call__namespace.Hardware.isCameraOn,
								audio: !Call__namespace.Hardware.isMicrophoneMuted
							},
							status: call_lib_analytics.Analytics.AnalyticsStatus.success,
							isVpnActive: this.#isVpnConnected()
						});
					}
					this.checkVpnStatus();
					this.onUpdateLastUsedCameraId();
				});
			}).catch(error => {
				im_lib_logger.Logger.error('creating call error', error);
				let errorCode = Call__namespace.Util.getCallConnectionErrorCode(error);
				const errorMessage = Call__namespace.Util.getCallConnectionErrorMessage(error);
				if (errorCode === 'CLIENT_UNCLASSIFIED' && error?.message) {
					errorCode = Call__namespace.getUnknownErrorType(error?.message);
				}
				const accidentLogger = main_core.Reflection.getClass('BX.Call.Lib.accidentLogger');
				void accidentLogger?.addLog(error, errorCode);
				call_lib_analytics.Analytics.getInstance().onStartCallError({
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					// The room of this attempt, not this.currentCall: a failure before the room
					// exists sends no identifier rather than the one of a call still running.
					callId: Call.Util.getCallIdentifier(createdCall),
					errorCode,
					errorMessage,
					isVpnActive: this.#isVpnConnected(),
					isOffline: Call.Util.isOfflineJoinFailure(errorCode, navigator.onLine)
				});
				this.initCallPromise = null;
			});
		}

		/**
		 * @param {int} callUuid
		 * @param {object} options
		 */
		joinCall(callId, callUuid, options) {
			if (this.initCallPromise) {
				return;
			}
			const video = BX.prop.getBoolean(options, 'video', false);
			const joinAsViewer = BX.prop.getBoolean(options, 'joinAsViewer', false);
			Call__namespace.Hardware.isCameraOn = Boolean(video);
			if (im_lib_utils.Utils.device.isMobile()) {
				this.viewPort.show();
			} else {
				this.viewPort.setLayout(call_mapping.ViewLayout.Grid);
			}
			if (joinAsViewer) {
				this.viewPort.setLocalUserDirection(Call__namespace.EndpointDirection.RecvOnly);
			} else {
				this.viewPort.setLocalUserDirection(Call__namespace.EndpointDirection.SendRecv);
			}
			this.viewPort.setUiState(call_mapping.ViewUiState.Calling);
			const isLegacyCall = Boolean(callId) || this.callScheme === Call__namespace.CallScheme.classic || !this.callScheme && !call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled;

			// Preserve ids known from join arguments until currentCall is bound: an early
			// connection error must still carry roomId/callId, not only chatId
			const startingCallLogContext = this.#beginStartingCallLogContext({
				roomId: main_core.Type.isStringFilled(callUuid) ? callUuid : undefined,
				callId: this.#toCallLogNumber(callId),
				chatId: this.#toCallLogNumber(this.params.chatId)
			});
			this.initCallPromise = Promise.resolve(this.callToken);
			if (!isLegacyCall && !this.callToken) {
				this.initCallPromise = call_lib_callTokenManager.CallTokenManager.getToken(this.params.chatId);
			}
			this.initCallPromise.then(callToken => {
				if (isLegacyCall) {
					return Call__namespace.EngineLegacy.getCallWithId(callId, this.getCallConfig(video, true));
				}
				this.callToken = callToken;
				call_lib_callTokenManager.CallTokenManager.setToken(this.params.chatId, this.callToken);
				return Call__namespace.Engine.getCallWithId(callUuid, this.getCallConfig(video, true, callUuid));
			}).then(result => {
				this.currentCall = result.call;
				this.releasePreCall();
				this.bindCallEvents();
				if (this.promotedToAdminTimeout) {
					clearTimeout(this.promotedToAdminTimeout);
				}
				if (this.currentCall?.scheme === Call__namespace.CallScheme.classic || !call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled) {
					this.onUpdateCallCopilotState({
						isTrackRecordOn: this.currentCall.isCopilotActive
					});
				}
				this.controller.getStore().commit('conference/startCall');
				if (this.currentCall?.scheme === Call__namespace.CallScheme.jwt) {
					const userData = this.controller.getStore().getters['users/get'](this.controller.getUserId(), true);
					this.viewPort.appendUsers([userData.id]);
					this.viewPort.updateUserData({
						[userData.id]: userData
					});
				} else {
					this.viewPort.appendUsers(this.currentCall.getUsers());
					Call.Util.getUsers(this.currentCall.id, this.getCallUsers(true)).then(userData => {
						this.updateCallViewUsers(userData);
					});
				}
				if (!joinAsViewer) {
					if (Call__namespace.Hardware.defaultMicrophone) {
						this.currentCall.setMicrophoneId(Call__namespace.Hardware.defaultMicrophone);
					}
					if (Call__namespace.Hardware.defaultCamera) {
						this.currentCall.setCameraId(Call__namespace.Hardware.defaultCamera);
					}
					this.checkAvailableMicrophone();
					this.checkAvailableCamera();
					this.updateCallUser(this.currentCall.userId, {
						microphoneState: !Call__namespace.Hardware.isMicrophoneMuted
					});
				}
				this.currentCall.answer({
					joinAsViewer
				});
				call_lib_analytics.Analytics.getInstance().onJoinVideoconf({
					callId: this.currentCall?.uuid,
					withVideo: Call__namespace.Hardware.isCameraOn,
					mediaParams: {
						video: Call__namespace.Hardware.isCameraOn,
						audio: !Call__namespace.Hardware.isMicrophoneMuted
					},
					status: call_lib_analytics.Analytics.AnalyticsStatus.success,
					isVpnActive: this.#isVpnConnected()
				});
				this.checkVpnStatus();
				this.onUpdateLastUsedCameraId();
			}).catch(error => {
				let errorCode = Call__namespace.Util.getCallConnectionErrorCode(error);
				const errorMessage = Call__namespace.Util.getCallConnectionErrorMessage(error);
				if (errorCode === 'CLIENT_UNCLASSIFIED' && error?.message) {
					errorCode = Call__namespace.getUnknownErrorType(error?.message);
				}

				// addLog captures the call context synchronously, so nothing has to be awaited here:
				// the starting context is released by finally, on this outcome as on every other one.
				const accidentLogger = main_core.Reflection.getClass('BX.Call.Lib.accidentLogger');
				void accidentLogger?.addLog(error, errorCode);
				call_lib_analytics.Analytics.getInstance().onJoinCallError({
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					errorCode,
					callId: callUuid,
					errorMessage,
					isVpnActive: this.#isVpnConnected(),
					isRoomClosed: error?.isRoomClosed === true,
					isOffline: Call.Util.isOfflineJoinFailure(errorCode, navigator.onLine)
				});
				this.initCallPromise = null;
			}).finally(() => this.#endStartingCallLogContext(startingCallLogContext));
		}
		endCall(finishCall = false) {
			if (this.#isLocalRecordStarted()) {
				call_lib_analytics.Analytics.getInstance().onRecordStop({
					callId: this.currentCall.uuid,
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					subSection: finishCall ? call_lib_analytics.Analytics.AnalyticsSubSection.contextMenu : call_lib_analytics.Analytics.AnalyticsSubSection.window,
					element: finishCall ? call_lib_analytics.Analytics.AnalyticsElement.finishForAllButton : call_lib_analytics.Analytics.AnalyticsElement.disconnectButton,
					recordTime: Call.Util.getRecordTimeText(this.commonRecord.info, true),
					storageType: call_lib_analytics.Analytics.AnalyticsStorageType.local
				});
			}
			// Conference is always a group call: an ordinary leave does not stop the shared cloud
			// recording for the others, so report record_stop on disconnect only on finish-for-all.
			else if (finishCall && this.#canCloudRecord() && this.#isCommonRecordStarted()) {
				this.recordingUiService?.trackCloudRecordStopOnDisconnect(this.currentCall.uuid, call_lib_analytics.Analytics.AnalyticsType.videoconf, this.commonRecord.info, finishCall);
			}
			this.#stopCommonRecord();
			this.setConferenceHasErrorInCall(false);
			this.showFeedback = Boolean(this.currentCall?.wasConnected);
			if (this.currentCall) {
				this.callDetails = {
					id: this.currentCall.uuid,
					provider: this.currentCall.provider,
					userCount: this.currentCall.users.length,
					browser: Call.Util.getBrowserForStatistics(),
					isMobile: BX.browser.IsMobile(),
					isConference: true
				};

				// Every user-driven exit from a conference goes through here, and removeCallEvents() below
				// silences both onLeave and onDestroy, so this is the last moment an open series is heard.
				this.#reconnectSeriesReporter.reportCallLost();
				this.removeCallEvents();
				this.removeAdditionalEvents();
				if (this.currentCall.isScreenSharingStarted()) {
					this.currentCall.stopScreenSharing();
				}
				this.currentCall.hangup(false, '', finishCall);
			}
			if (im_lib_utils.Utils.platform.isBitrixDesktop()) {
				this.floatingWindowService?.destroy();
				this.floatingWindowService = null;
				window.close();
				// if the conference was opened incorrectly, then "window.close();" may not work in some cases
				// as a workaround, we can redirect the user back to the portal's front page.
				location.href = '/';
			} else {
				this.viewPort.releaseLocalMedia();
				this.viewPort.close();
				this.notificationService?.closeReconnectingBalloon();
				this.#destroyUiServices();
				this.setError(call_const.ConferenceErrorCode.userLeftCall);
				this.controller.getStore().commit('conference/endCall');
			}
			this.notificationService?.closeRiseYouHandToTalkPopup();
			this.layoutService?.closeWebScreenSharePopup();
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.focus, this.onInputFocusHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.blur, this.onInputBlurHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.userRenameFocus, this.onInputFocusHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.userRenameBlur, this.onInputBlurHandler);
		}
		restart() {
			if (this.currentCall) {
				this.removeCallEvents();
				this.currentCall = null;
			}
			if (this.promotedToAdminTimeout) {
				clearTimeout(this.promotedToAdminTimeout);
			}
			if (this.viewPort) {
				this.viewPort.releaseLocalMedia();
				this.viewPort.close();
				this.notificationService?.closeReconnectingBalloon();
				this.viewPort.destroy();
				this.#destroyUiServices();
				this.viewPort = null;
			}
			this.initCallInterface();
			this.initCall();
			this.controller.getStore().commit('conference/endCall');
		}
		#destroyUiServices() {
			const services = ['buttonStateService', 'layoutService', 'notificationService', 'hangupOptionsUiService', 'feedbackUiService', 'pipService', 'recordingUiService', 'copilotUiService', 'floatingWindowService'];
			for (const name of services) {
				this[name]?.destroy();
				this[name] = null;
			}
		}
		kickFromCall() {
			this.setError(call_const.ConferenceErrorCode.kickedFromCall);
			this.pullClient.disconnect();
			this.endCall();
		}
		getCallUsers(includeSelf) {
			if (!this.currentCall) {
				return [];
			}
			const result = Object.keys(this.currentCall.getUsers());
			if (includeSelf) {
				result.push(this.currentCall.userId);
			}
			return result;
		}
		updateCallViewUsers(userData) {
			userData = userData ?? {};
			const resolvedUserData = this.layoutService?.updateUsers(this.currentCall, userData, Object.keys(userData), {
				forceFetch: true,
				getCurrentName: userId => this.controller.getStore().getters['users/get'](userId, true)?.name
			}) ?? userData;
			this.updateConferenceUsers(resolvedUserData);
			if (!this.layoutService) {
				this.viewPort.updateUserData(resolvedUserData);
			}
		}
		updateConferenceUsers(userData) {
			if (!userData || Object.keys(userData).length === 0) {
				return;
			}
			this.controller.getStore().dispatch('users/set', Object.values(userData));
			this.controller.getStore().dispatch('conference/setUsers', {
				users: Object.keys(userData)
			});
		}
		getActiveCallUsers() {
			const userStates = this.currentCall.getUsers();
			const activeUsers = [];
			for (const userId in userStates) {
				if (userStates.hasOwnProperty(userId) && (userStates[userId] === Call__namespace.UserState.Connected || userStates[userId] === Call__namespace.UserState.Connecting || userStates[userId] === Call__namespace.UserState.Calling)) {
					activeUsers.push(userId);
				}
			}
			return activeUsers;
		}
		setLocalVideoStream(stream) {
			this.localVideoStream = stream;
		}
		updateMediaDevices() {
			Call__namespace.Hardware.getCurrentDeviceList();
		}
		stopLocalVideoStream() {
			if (this.localVideoStream) {
				this.localVideoStream.getTracks().forEach(tr => tr.stop());
			}
			this.localVideoStream = null;
		}
		setSelectedCamera(cameraId) {
			if (this.viewPort) {
				this.viewPort.setCameraId(cameraId);
			}
		}
		setSelectedMic(micId) {
			if (this.viewPort) {
				this.viewPort.setMicrophoneId(micId);
			}
		}
		getFeature(id) {
			if (typeof this.featureConfig[id] === 'undefined') {
				return {
					id,
					state: ConferenceApplication.FeatureState.Enabled,
					articleCode: ''
				};
			}
			return this.featureConfig[id];
		}
		getFeatureState(id) {
			return this.getFeature(id).state;
		}
		#canLocalRecord() {
			const isDesktop = im_lib_utils.Utils.platform.isBitrixDesktop();
			const isValidApi = im_lib_utils.Utils.platform.getDesktopVersion() >= 54;

			// It's a desktop with the right API version.
			if (!isDesktop || !isValidApi) {
				return false;
			}

			// If cloud recording is disabled, can record local
			if (!Call__namespace.CallCloudRecord.serviceEnabled) {
				return true;
			}

			// If the cloud recording tariff is not available, can record local
			if (!Call__namespace.CallCloudRecord.tariffAvailable) {
				return true;
			}

			// If the cloud recording is active, and it is a paid plan, then we turn it on only in plain
			return this.currentCall.provider === Call__namespace.Provider.Plain;
		}
		#canCloudRecord() {
			return Call__namespace.CallCloudRecord.serviceEnabled && Call__namespace.CallCloudRecord.tariffAvailable;
		}
		#canCommonRecord() {
			return this.#canLocalRecord() || this.#canCloudRecord();
		}

		/**
		 * What the record button opens and what it announces are decided from one set of flags: two sets
		 * would let the announcement and the click disagree.
		 */
		#getRecordButtonState() {
			return {
				isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
				callId: this.currentCall?.id,
				isServiceEnabled: Call__namespace.CallCloudRecord.serviceEnabled,
				// the announcement is synchronised before the conference is joined, and the local record
				// asks the provider of a call that does not exist yet
				canRecord: Boolean(this.currentCall) && this.#canCommonRecord(),
				isRecordLimitReached: this.#isRecordLimitReached()
			};
		}

		/**
		 * The recording limit is applied by the view before the click ever reaches this controller
		 * (`onClickButtonWithLimit`): the button opens the limit article instead of the menu, so it must
		 * announce no layer either. Read from the portal features, the same source the view reads.
		 */
		#isRecordLimitReached() {
			return !Call.Util.getCallFeatures()?.call_record?.enable;
		}

		/**
		 * Tells the record button which layer it opens. Called when a reason of the route changes, not on
		 * every update of the recording: the route does not depend on the state of the recording at all.
		 */
		#syncRecordButtonPopupKind() {
			this.recordingUiService?.syncRecordButtonPopupKind(this.#getRecordButtonState());
		}
		#isLocalRecordStarted() {
			return this.#canLocalRecord() && this.commonRecord.state != Call__namespace.CallCommonRecordState.Stopped && this.commonRecord.state != Call__namespace.CallCommonRecordState.Destroyed;
		}
		#isCommonRecordStarted() {
			return this.#canCommonRecord() && this.commonRecord.state != Call__namespace.CallCommonRecordState.Stopped && this.commonRecord.state != Call__namespace.CallCommonRecordState.Destroyed;
		}
		showFeatureLimitSlider(id) {
			const articleCode = this.getFeature(id).articleCode;
			if (!articleCode || !window.BX.UI.InfoHelper) {
				console.warn('Limit article not found', id);
				return false;
			}
			window.BX.UI.InfoHelper.show(articleCode);
			return true;
		}
		#isVpnConnected() {
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop() && typeof BXDesktopSystem?.IsVpnConnected === 'function' && BXDesktopSystem.IsVpnConnected()) {
				return true;
			}
			return false;
		}
		checkVpnStatus() {
			if (this.#isVpnConnected()) {
				this.notificationService?.showVpnIsActiveNotification();
			}
		}
		isViewerMode() {
			let viewerMode = false;
			const isBroadcast = this.isBroadcast();
			if (isBroadcast) {
				const presenters = this.getBroadcastPresenters();
				const currentUserId = this.controller.getStore().state.application.common.userId;
				const isCurrentUserPresenter = presenters.includes(currentUserId);
				viewerMode = isBroadcast && !isCurrentUserPresenter;
			}
			return viewerMode;
		}
		onCallCreated(e) {
			im_lib_logger.Logger.warn('we got event onCallCreated', e);
			if (this.preCall || this.currentCall) {
				return;
			}
			const call = e.call;
			if (call.associatedEntity.type === 'chat' && call.associatedEntity.id === this.params.dialogId) {
				this.preCall = e.call;
				this.updatePreCallCounter();
				this.preCall.addEventListener(Call__namespace.Event.onUserStateChanged, this.onPreCallUserStateChangedHandler);
				this.preCall.addEventListener(Call__namespace.Event.onDestroy, this.onPreCallDestroyHandler);
				if (this.waitingForCallStatus) {
					this.callEventReceived = true;
				}
				this.setConferenceStatus(true);
				this.setConferenceStartDate(e.call.startDate);
			}
			const userReadyToJoin = this.getConference().common.userReadyToJoin;
			if (userReadyToJoin) {
				const viewerMode = this.isViewerMode();
				const videoEnabled = this.getConference().common.joinWithVideo;
				im_lib_logger.Logger.warn('ready to join call after waiting', videoEnabled, viewerMode);
				setTimeout(() => {
					Call__namespace.Hardware.init().then(() => {
						if (viewerMode && this.preCall) {
							this.joinCall(this.preCall.id, this.preCall.uuid, {
								joinAsViewer: true
							});
						} else {
							this.joinCall(this.preCall.id, this.preCall.uuid, {
								video: videoEnabled
							});
						}
					});
				}, 1000);
			}
		}
		releasePreCall() {
			if (this.preCall) {
				this.preCall.removeEventListener(Call__namespace.Event.onUserStateChanged, this.onPreCallUserStateChangedHandler);
				this.preCall.removeEventListener(Call__namespace.Event.onDestroy, this.onPreCallDestroyHandler);
				this.preCall = null;
			}
		}
		onPreCallDestroy(e) {
			if (this.waitingForCallStatusTimeout) {
				clearTimeout(this.waitingForCallStatusTimeout);
			}
			this.setConferenceStatus(false);
			this.releasePreCall();
		}
		updatePreCallCounter() {
			if (this.preCall) {
				const count = this.preCall.getParticipatingUsers().length;
				this.controller.getStore().commit('conference/common', {
					userInCallCount: count
				});
			} else {
				this.controller.getStore().commit('conference/common', {
					userInCallCount: 0
				});
			}
		}
		createVideoStrategy() {
			if (this.videoStrategy) {
				this.videoStrategy.destroy();
			}
			const strategyType = im_lib_utils.Utils.device.isMobile() ? VideoStrategy.Type.OnlySpeaker : VideoStrategy.Type.AllowAll;
			this.videoStrategy = new VideoStrategy({
				call: this.currentCall,
				callView: this.viewPort,
				strategyType
			});
		}
		removeVideoStrategy() {
			if (this.videoStrategy) {
				this.videoStrategy.destroy();
			}
			this.videoStrategy = null;
		}
		_onCallViewTurnOffParticipantStream(e, typeOfStream) {
			this.currentCall.turnOffParticipantStream({
				typeOfStream,
				userId: e.userId,
				fromUserId: this.callEngine.getCurrentUserId()
			});
			call_lib_analytics.Analytics.getInstance().onTurnOffParticipantStream({
				callId: this._getCallIdentifier(this.currentCall),
				callType: this.getCallType(),
				typeOfSetting: typeOfStream
			});
		}
		_onCallViewChangeSpeakPermission(e, allow) {
			this.currentCall.allowSpeakPermission({
				allow,
				userId: e.userId
			});
			if (allow) {
				call_lib_analytics.Analytics.getInstance().onAllowPermissionToSpeakResponse({
					callId: this._getCallIdentifier(this.currentCall),
					callType: this.getCallType()
				});
			} else {
				call_lib_analytics.Analytics.getInstance().onDisallowPermissionToSpeakResponse({
					callId: this._getCallIdentifier(this.currentCall),
					callType: this.getCallType()
				});
			}
		}
		async renameGuest(newName) {
			if (this.viewPort.localUser) {
				this.viewPort.localUser.userModel.renameRequested = true;
			}
			try {
				const response = await this.setUserName(newName);
				const result = response?.answer?.result;
				if (main_core.Type.isString(result?.userToken) && result.userToken.length > 0) {
					call_lib_callTokenManager.CallTokenManager.setUserToken(result.userToken);
				}
				this.currentCall?.updateUserData({
					name: newName
				});
				if (this.viewPort.localUser) {
					this.viewPort.localUser.userModel.wasRenamed = true;
				}
				im_lib_logger.Logger.log('setting name to', newName);
			} catch (error) {
				im_lib_logger.Logger.error('error setting name', error);
			}
		}
		renameGuestMobile(newName) {
			this.setUserName(newName).then(() => {
				im_lib_logger.Logger.log('setting mobile name to', newName);
				if (this.viewPort.renameSlider) {
					this.viewPort.renameSlider.close();
				}
			}).catch(error => {
				im_lib_logger.Logger.error('error setting name', error);
			});
		}
		onCallButtonClick(event) {
			const buttonName = event.data.buttonName;
			im_lib_logger.Logger.warn('Button clicked!', buttonName);
			const handlers = {
				hangup: () => {
					call_lib_analytics.Analytics.getInstance().onDisconnectCall({
						callId: this.currentCall?.uuid,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
						subSection: call_lib_analytics.Analytics.AnalyticsSubSection.finishButton,
						mediaParams: {
							video: Call__namespace.Hardware.isCameraOn,
							audio: !Call__namespace.Hardware.isMicrophoneMuted
						}
					});
					this.stopLocalVideoStream();
					this.endCall();
				},
				hangupOptions: () => this.hangupOptionsUiService.show(this.viewPort.getButtonElement('hangupOptions'), {
					callId: this.currentCall?.uuid,
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					chatId: this.currentCall?.associatedEntity.id,
					callUsersCount: this.getCallUsers(true).length,
					callLength: Call.Util.getTimeInSeconds(this.currentCall?.startDate)
				}),
				close: () => {
					this.stopLocalVideoStream();
					this.endCall();
				},
				toggleMute: this.onCallViewToggleMuteButtonClick.bind(this),
				toggleScreenSharing: this.onCallViewToggleScreenSharingButtonClick.bind(this),
				record: () => {
					call_lib_analytics.Analytics.getInstance().onRecordBtnClick({
						callId: this.currentCall?.uuid,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
					});
					this.recordingUiService?.onRecordButtonClick(this.#getRecordButtonState());
				},
				toggleVideo: event => {
					event.data.video = Boolean(event.data.video);
					call_lib_analytics.Analytics.getInstance().onToggleCamera({
						video: event.data.video,
						callId: this.currentCall ? this.currentCall.uuid : 0,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
					});
					this.#onCallViewToggleVideoButtonClickHandler(event.data);
				},
				toggleSpeaker: event => {
					this.viewPort.muteSpeaker(!event.data.speakerMuted);
					if (event.data.fromHotKey) {
						this.notificationService?.showSpeakerToggleNotification(this.viewPort.speakerMuted);
					}
				},
				showChat: () => {
					call_lib_analytics.Analytics.getInstance().onShowChat({
						callId: this.currentCall?.uuid,
						callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
					});
					this.toggleChat();
				},
				toggleUsers: () => this.toggleUserList(),
				share: () => {
					const w = im_lib_utils.Utils.device.isMobile() && document.body.clientWidth < 400 ? document.body.clientWidth - 40 : 400;
					this.notificationService?.showLinkCopiedNotification(main_core.Loc.getMessage('BX_IM_VIDEOCONF_LINK_COPY_DONE'), w);
					im_lib_clipboard.Clipboard.copy(this.getDialogData().public.link);
				},
				fullscreen: () => this.toggleFullScreen(),
				floorRequest: this.onCallViewFloorRequestButtonClick.bind(this),
				feedback: () => this.feedbackUiService?.onButtonClick({
					callId: this.currentCall?.uuid,
					instanceId: this.currentCall?.instanceId,
					provider: this.currentCall?.provider,
					userCount: (this.currentCall?.users.length ?? 0) + 1,
					userId: this.params?.userId
				}),
				callcontrol: this._onCallcontrolButtonClick.bind(this),
				onUserClick: e => call_lib_analytics.Analytics.getInstance().onClickUser({
					callId: this.currentCall.uuid,
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					layout: Object.keys(call_mapping.ViewLayout).find(key => call_mapping.ViewLayout[key] === e.layout)
				}),
				copilot: () => this.copilotUiService?.onButtonClick({
					isCopilotActive: this.currentCall?.isCopilotActive ?? false,
					isCopilotFeaturesEnabled: this.currentCall?.isCopilotFeaturesEnabled ?? false,
					callId: this.currentCall?.id
				})
			};
			if (handlers[buttonName]) {
				handlers[buttonName](event);
			} else {
				im_lib_logger.Logger.error('Button handler not found!', buttonName);
			}
		}

		/**
		 * Second trigger of the mute hint: the hold policy reports a short press that led to nothing. The
		 * anchor is resolved exactly as the first trigger resolves it, and whether the hint is due at all
		 * is answered by the notification service.
		 */
		onPushToTalkShortPress() {
			if (!this.notificationService?.allowMutePopup) {
				return;
			}
			this.notificationService?.showPushToTalkHint(this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon);
		}
		onCallViewToggleMuteButtonClick(event) {
			// the report goes out after the command, not before it: the handler applies the state
			// synchronously, but leaves silently when there is no microphone and when the user is
			// not the room speaker, and an unapplied command must not reach analytics
			this.#onCallViewToggleMuteHandler(event.data);
			const applied = Call.Hardware.isMicrophoneMuted === event.data.muted;

			// ahead of the analytics gate: the gate also lets a mute through, and a mute must not count as
			// having used the mode. Only a successful use stops the hint, hence the applied command
			if (applied && !event.data.muted && event.data.source === call_lib_analytics.Analytics.AnalyticsElement.pushToTalk) {
				this.notificationService?.onPushToTalkUsed();
			}
			if (!call_lib_analytics.shouldSendToggleMicrophone({
				source: event.data.source,
				muted: event.data.muted,
				applied
			})) {
				return;
			}
			call_lib_analytics.Analytics.getInstance().onToggleMicrophone({
				muted: event.data.muted,
				source: event.data.source,
				callId: this.currentCall ? this.currentCall.uuid : 0,
				callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
			});
		}
		#onCallViewToggleMuteHandler(e) {
			if (!e.muted && !Call.Hardware?.hasMicrophone()) {
				return;
			}
			const currentRoom = this.currentCall && this.currentCall.currentRoom && this.currentCall.currentRoom();
			if (currentRoom && currentRoom.speaker != this.userId && !e.muted) {
				this.currentCall.requestRoomSpeaker();
				return;
			}
			if (this.currentCall && !this.currentCall.microphoneId && !e.muted) {
				this.currentCall.setMicrophoneId(Call.Hardware.defaultMicrophone);
			}
			Call.Hardware.setIsMicrophoneMuted({
				isMicrophoneMuted: e.muted,
				calledProgrammatically: Boolean(e.calledProgrammatically)
			});
			this.notificationService?.closeMutePopup();
			if (!e.muted) {
				if (Call.Util.havePermissionToBroadcast('mic')) {
					if (this.notificationService) {
						this.notificationService.allowMutePopup = true;
					}
				} else {
					this.notificationService?.showRiseYouHandToTalkNotification({
						initiatorName: this.lastCalledChangeSettingsUserName,
						bindElement: this.viewPort?.buttons?.microphone?.elements?.icon ?? null
					});
				}
			}
			if (this.#isCommonRecordStarted() && this.#canLocalRecord()) {
				BXDesktopSystem.CallRecordMute(e.muted);
			}
			if (this.currentCall?.userId) {
				this.updateCallUser(this.currentCall.userId, {
					microphoneState: !e.muted
				});
			}
			if (!this.currentCall) {
				this.template.$emit('setMicState', !e.muted);
			}
		}
		onCallViewToggleScreenSharingButtonClick() {
			call_lib_analytics.Analytics.getInstance().onScreenShareBtnClick({
				callId: this.currentCall.uuid,
				callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
			});
			if (this.getFeatureState('screenSharing') === ConferenceApplication.FeatureState.Limited) {
				this.showFeatureLimitSlider('screenSharing');
				return;
			}
			if (this.getFeatureState('screenSharing') === ConferenceApplication.FeatureState.Disabled) {
				return;
			}
			if (this.currentCall.isScreenSharingStarted()) {
				this.currentCall.stopScreenSharing();
				if (this.#isCommonRecordStarted() && this.#canLocalRecord()) {
					BXDesktopSystem.CallRecordStopSharing();
				}
				this.floatingWindowService?.hideScreenShareWindow();
				this.layoutService?.closeWebScreenSharePopup();
			} else {
				BX.ajax.runAction('call.Call.onShareScreen', {
					data: {
						callUuid: this.currentCall.uuid
					}
				});
				this.currentCall.startScreenSharing();
				this.togglePictureInPictureCallWindow({
					isForceOpen: true
				});
			}
		}
		togglePictureInPictureCallWindow(config = {}) {
			this.pipService?.toggle({
				...config,
				hasActiveCall: Boolean(this.currentCall),
				isFolded: this.layoutService.isFolded,
				isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
				enableAutoPip: this.viewPort?.enableAutoPip
			});
		}
		#startCommonRecord(type) {
			const isPlainCall = this.currentCall.provider === Call__namespace.Provider.Plain;
			this.commonRecord.type = type;
			if (Call__namespace.CallCloudRecord.serviceEnabled && !isPlainCall) {
				const kind = type === 'audio' ? Call__namespace.CloudRecordKind.AUDIO : Call__namespace.CloudRecordKind.VIDEO;
				this.buttonStateService?.blockRecordButton();
				this.currentCall.setCloudRecordState(Call__namespace.CloudRecordStatus.STARTED, kind);
				return;
			}
			this.buttonStateService?.activateRecordButton(true);
			this.currentCall.sendLocalRecordState({
				action: Call__namespace.CallCommonRecordState.Started,
				type: this.commonRecord.type,
				date: new Date()
			});
			this.commonRecord.state = Call__namespace.CallCommonRecordState.Started;
		}
		#stopCommonRecord() {
			const initiatorId = this.commonRecord.initiatorId;
			const state = this.commonRecord.state;
			this.commonRecord = this.#getDefaultCommonRecord();

			// The desktop gate says nothing about the record commands: a client without them refuses
			// the start, and the rollback has to survive that instead of failing on the same absence.
			if (this.#canLocalRecord() && main_core.Type.isFunction(window.BXDesktopSystem?.CallRecordStop)) {
				window.BXDesktopSystem.CallRecordStop();
			}
			if (this.viewPort) {
				this.viewPort.setCommonRecordState(this.viewPort.getDefaultCommonRecordState());
				this.buttonStateService?.activateRecordButton(false);
			}
			if (state !== Call__namespace.CallCommonRecordState.Stopped && this.currentCall && this.currentCall.isAnyoneParticipating() && initiatorId === this.currentCall.userId) {
				this.currentCall.sendLocalRecordState({
					action: Call__namespace.CallCommonRecordState.Stopped,
					userId: this.currentCall.userId
				});
			}
		}

		/**
		 * @param { Object } event
		 * @param { string } event.data.state
		 * @param { string } event.data.kind
		 * @param { boolean } event.data.hotkey
		 */
		#onCallViewToggleVideoButtonClickHandler(e) {
			if (!Call.Hardware.initialized) {
				return;
			}
			if (e.video && Object.values(Call.Hardware.cameraList).length === 0) {
				return;
			}
			Call.Hardware.setIsCameraOn({
				isCameraOn: e.video,
				calledProgrammatically: Boolean(e.calledProgrammatically)
			});
			if (this.currentCall && !e.video && !this.currentCall.isScreenSharingStarted()) {
				this.viewPort.releaseLocalMedia();
			}
			if (this.currentCall && !this.currentCall.cameraId && e.video) {
				this.currentCall.setCameraId(Call.Hardware.defaultCamera);
			}
			if (!this.currentCall) {
				this.template.$emit('setCameraState', e.video);
			}
		}
		clearPictureInPictureDebounceForOpen() {
			this.pipService?.clearDebounceForOpen();
		}
		onInputFileOpenedStateUpdate(isActive) {
			this.pipService?.onInputFileOpenedStateUpdate(isActive, {
				hasActiveCall: Boolean(this.currentCall),
				isFolded: this.layoutService.isFolded,
				isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
				enableAutoPip: this.viewPort?.enableAutoPip
			});
		}
		onDocumentBodyClick(event) {
			const {
				target
			} = event;
			if (target.matches('input[type="file"]')) {
				this.onInputFileOpenedStateUpdate(true);
			}
		}
		onWindowFocus() {
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				this.floatingWindowService?.hideScreenShareWindow();
			}
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop() && this.pipService?.isFileChooserActive) {
				this.onInputFileOpenedStateUpdate(false);
			}
			this.layoutService?.updateWindowFocusState(true);
		}
		onWindowBlur() {
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop() && this.currentCall && this.currentCall.isScreenSharingStarted()) {
				this.floatingWindowService?.showScreenShareWindow(null);
			}
			this.layoutService?.updateWindowFocusState(false);
		}
		fold(foldedCallTitle) {
			if (this.layoutService.isFolded) {
				return;
			}
			this.layoutService.fold(foldedCallTitle ?? this.params.name ?? '');
			BX.onCustomEvent(this, 'ConferenceApplication::onFold', {});
		}
		unfold(options = {}) {
			this.layoutService.unfold(options);
			BX.onCustomEvent(this, 'ConferenceApplication::onUnfold', {});
		}
		showChat() {
			this.layoutService.showChat();
		}
		isFullScreen() {
			return this.layoutService.isFullScreen();
		}
		toggleFullScreen() {
			this.layoutService.toggleFullScreen();
		}
		enterFullScreen() {
			this.layoutService.enterFullScreen();
		}
		exitFullScreen() {
			this.layoutService.exitFullScreen();
		}
		_onCallcontrolButtonClick(e) {
			if (!Call.Util.canControlChangeSettings()) {
				return;
			}
			if (this.participantsPermissionPopup) {
				this.participantsPermissionPopup.close();
				return;
			}
			this.participantsPermissionPopup = new Call.ParticipantsPermissionPopup({
				targetContainer: this.viewPort.container,
				turnOffAllParticipansStream: options => {
					if (this.currentCall) {
						this.currentCall.turnOffAllParticipansStream(options);
					}
					call_lib_analytics.Analytics.getInstance().onTurnOffAllParticipansStream({
						callId: this._getCallIdentifier(this.currentCall),
						callType: this.getCallType(),
						typeOfStream: options.data?.typeOfStream
					});
				},
				onPermissionChanged: options => {
					this.currentCall.changeSettings(options);
					if (!options.settingEnabled) {
						// send only when it turned off
						call_lib_analytics.Analytics.getInstance().onCallSettingsChanged({
							callId: this._getCallIdentifier(this.currentCall),
							callType: this.getCallType(),
							typeOfSetting: options.typeOfSetting,
							settingEnabled: options.settingEnabled
						});
					}
				},
				onClose: () => {
					this.participantsPermissionPopup = null;
					this.notificationService?.setCallControlPanelOpen(false);
				},
				onOpen: () => {
					this.notificationService?.setCallControlPanelOpen(true);
					call_lib_analytics.Analytics.getInstance().onOpenCallSettings({
						callId: this._getCallIdentifier(this.currentCall),
						callType: this.getCallType()
					});
				}
			});
			if (this.participantsPermissionPopup) {
				this.participantsPermissionPopup.toggle();
			}
		}
		onUpdateCallCopilotState({
			isTrackRecordOn
		}) {
			const updateCopilotActive = this.currentCall.scheme ? this.currentCall.scheme === Call__namespace.CallScheme.classic : !call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled;
			if (updateCopilotActive) {
				this.currentCall.isCopilotActive = isTrackRecordOn;
			}
			this.viewPort.updateCopilotState(this.currentCall.isCopilotActive);
		}
		onCallViewFloorRequestButtonClick() {
			call_lib_analytics.Analytics.getInstance().onFloorRequest({
				callId: this.currentCall.uuid,
				callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
			});
			const floorState = this.viewPort.getUserFloorRequestState(this.callEngine.getCurrentUserId());
			const talkingState = this.viewPort.getUserTalking(this.callEngine.getCurrentUserId());
			this.viewPort.setUserFloorRequestState(this.callEngine.getCurrentUserId(), !floorState);
			if (this.currentCall) {
				this.currentCall.requestFloor(!floorState);
			}
			clearTimeout(this.viewPortFloorRequestTimeout);
			if (talkingState && !floorState) {
				this.viewPortFloorRequestTimeout = setTimeout(() => {
					if (this.currentCall) {
						this.currentCall.requestFloor(false);
					}
				}, 1500);
			}
			if (!floorState) {
				this.notificationService?.closeRiseYouHandToTalkPopup();
			}
		}
		bindCallEvents() {
			this.currentCall.addEventListener(Call__namespace.Event.onUserInvited, this.onCallUserInvitedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserJoined, this.onCallUserJoinedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onDestroy, this.onCallDestroyHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserStateChanged, this.onCallUserStateChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserMicrophoneState, this.onCallUserMicrophoneStateHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserCameraState, this.onCallUserCameraStateHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onNeedResetMediaDevicesState, this.onNeedResetMediaDevicesStateHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserVideoPaused, this.onCallUserVideoPausedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onLocalMediaReceived, this.onCallLocalMediaReceivedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onLocalMediaStopped, this.onCallLocalMediaStoppedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onRemoteMediaReceived, this.onCallRemoteMediaReceivedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onRemoteMediaStopped, this.onCallRemoteMediaStoppedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onRemoteMediaAvailable, this.onCallRemoteMediaAvailableHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onRemoteMediaUnavailable, this.onCallRemoteMediaUnavailableHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserVoiceStarted, this.onCallUserVoiceStartedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserVoiceStopped, this.onCallUserVoiceStoppedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserStatsReceived, this.onUserStatsReceivedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserScreenState, this.onCallUserScreenStateHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserCommonRecordState, this.onCallUserCommonRecordStateHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onCloudRecordStatusChanged, this.onCloudRecordStatusChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserFloorRequest, this.onCallUserFloorRequestHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onMicrophoneLevel, this.onMicrophoneLevelHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onCallFailure, this.onCallFailureHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onJoin, this._onCallJoinHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onLeave, this.onCallLeaveHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onReconnecting, this.onReconnectingHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onReconnected, this.onReconnectedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onReconnectingFailed, this.onReconnectingFailedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onReconnectSeriesOutcome, this.onReconnectSeriesOutcomeHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onParticipantReconnecting, this._onParticipantReconnectingHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onParticipantReconnected, this._onParticipantReconnectedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUpdateLastUsedCameraId, this.onUpdateLastUsedCameraIdHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onConnectionQualityChanged, this.onCallConnectionQualityChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onToggleRemoteParticipantVideo, this.onCallToggleRemoteParticipantVideoHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onSwitchTrackRecordStatus, this._onSwitchTrackRecordStatusHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onCameraPublishing, this.onCameraPublishingHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onMicrophonePublishing, this.onMicrophonePublishingdHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onTurnOnCamera, this._onTurnOnCameraHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onRoomSettingsChanged, this.onRoomSettingsChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserPermissionsChanged, this.onUserPermissionsChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onUserRoleChanged, this.onUserRoleChangedHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
			this.currentCall.addEventListener(Call__namespace.Event.onParticipantMuted, this.#onParticipantMuted);

			// what can be recorded is known only once the call and its provider are: until then the button
			// announces the route of a call that does not exist yet
			this.#syncRecordButtonPopupKind();
		}
		removeCallEvents() {
			this.currentCall.removeEventListener(Call__namespace.Event.onUserInvited, this.onCallUserInvitedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserJoined, this.onCallUserJoinedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onDestroy, this.onCallDestroyHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserStateChanged, this.onCallUserStateChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserMicrophoneState, this.onCallUserMicrophoneStateHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserCameraState, this.onCallUserCameraStateHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onNeedResetMediaDevicesState, this.onNeedResetMediaDevicesStateHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserVideoPaused, this.onCallUserVideoPausedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onLocalMediaReceived, this.onCallLocalMediaReceivedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onLocalMediaStopped, this.onCallLocalMediaStoppedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onRemoteMediaReceived, this.onCallRemoteMediaReceivedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onRemoteMediaStopped, this.onCallRemoteMediaStoppedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onRemoteMediaAvailable, this.onCallRemoteMediaAvailableHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onRemoteMediaUnavailable, this.onCallRemoteMediaUnavailableHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserVoiceStarted, this.onCallUserVoiceStartedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserVoiceStopped, this.onCallUserVoiceStoppedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserStatsReceived, this.onUserStatsReceivedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserScreenState, this.onCallUserScreenStateHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserCommonRecordState, this.onCallUserCommonRecordStateHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onCloudRecordStatusChanged, this.onCloudRecordStatusChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserFloorRequest, this.onCallUserFloorRequestHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onMicrophoneLevel, this.onMicrophoneLevelHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onCallFailure, this.onCallFailureHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onJoin, this._onCallJoinHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onLeave, this.onCallLeaveHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onReconnecting, this.onReconnectingHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onReconnected, this.onReconnectedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onReconnectingFailed, this.onReconnectingFailedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onReconnectSeriesOutcome, this.onReconnectSeriesOutcomeHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onParticipantReconnecting, this._onParticipantReconnectingHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onParticipantReconnected, this._onParticipantReconnectedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUpdateLastUsedCameraId, this.onUpdateLastUsedCameraIdHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onConnectionQualityChanged, this.onCallConnectionQualityChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onToggleRemoteParticipantVideo, this.onCallToggleRemoteParticipantVideoHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onSwitchTrackRecordStatus, this._onSwitchTrackRecordStatusHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onCameraPublishing, this.onCameraPublishingHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onMicrophonePublishing, this.onMicrophonePublishingdHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onTurnOnCamera, this._onTurnOnCameraHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onRoomSettingsChanged, this.onRoomSettingsChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserPermissionsChanged, this.onUserPermissionsChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onUserRoleChanged, this.onUserRoleChangedHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
			this.currentCall.removeEventListener(Call__namespace.Event.onParticipantMuted, this.#onParticipantMuted);
		}
		onCallUserInvited(e) {
			this.layoutService?.handleUserJoinEvent('onUserInvited', e, this.currentCall);
		}
		onCallUserJoined(e) {
			this.layoutService?.handleUserJoinEvent('onUserJoined', e, this.currentCall);
		}
		onCallUserStateChanged(e) {
			if (e.state !== Call__namespace.UserState.Connected && this.loopTimers[e.userId] === undefined) {
				this.loopConnectionQuality(e.userId, 1);
			}
			if (e.state === Call__namespace.UserState.Connected) {
				this.clearConnectionQualityTimer(e.userId);
				this.viewPort?.setUserConnectionQuality(e.userId, 5);
			}
			if (e.state === Call__namespace.UserState.Idle && e.previousState === Call__namespace.UserState.Connected && !this.#canCloudRecord() && e.userId === this.commonRecord.initiatorId) {
				this.#stopCommonRecord();
			}
			this.viewPort?.setUserState(e.userId, e.state);
			this.updateCallUser(e.userId, {
				state: e.state
			});
			if (e.state === Call__namespace.UserState.Idle && e.previousState === Call__namespace.UserState.Connected) {
				this.layoutService?.handleUserEvent('onUserLeft', e);
			}
			if (!this.#isCommonRecordStarted()) {
				this.buttonStateService?.unblockRecordButton();
			}
		}
		onCallUserMicrophoneState(e) {
			this.layoutService?.handleUserEvent('onUserMicrophoneState', e);
		}
		onCallUserCameraState(e) {
			this.layoutService?.handleUserEvent('onUserCameraState', e);
		}
		onNeedResetMediaDevicesState() {
			Call__namespace.Hardware.isMicrophoneMuted = true;
			Call__namespace.Hardware.isCameraOn = false;
			this.notificationService?.showMediaDevicesResetStateHint();
		}
		onCallUserVideoPaused(e) {
			this.layoutService?.handleUserEvent('onUserVideoPaused', e);
		}
		onCallLocalMediaStopped(e) {
			if (this.viewPort && e.kind === 'audio') {
				Call__namespace.Hardware.isMicrophoneMuted = true;
			}
		}
		onCallRemoteMediaReceived(e) {
			this.layoutService?.handleMediaEvent(e);
		}
		onCallRemoteMediaStopped(e) {
			this.layoutService?.handleMediaEvent({
				...e,
				stopped: true
			});
		}
		onCallUserVoiceStarted(e) {
			// before the local branch: it returns unconditionally, and the silence limit must see every
			// signal - otherwise the countdown stops being reset and the limit cuts off real speech
			this.viewPort?.notifySpeechSignal({
				userId: e.userId,
				local: e.local
			}, true);
			if (e.local) {
				if (this.currentCall.muted && this.notificationService?.allowMutePopup) {
					this.notificationService?.showMicMutedNotification(this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon);
				}
				return;
			}
			this.layoutService?.handleUserEvent('onUserVoiceStarted', e);
			if (e.userId === this.viewPort?.localUser?.id) {
				this.viewPort?.setUserFloorRequestState(e.userId, false);
			}
			this.updateCallUser(e.userId, {
				talking: true,
				floorRequestState: false
			});
		}
		onCallUserVoiceStopped(e) {
			this.viewPort?.notifySpeechSignal({
				userId: e.userId,
				local: e.local
			}, false);
			if (!e.local) {
				this.updateCallUser(e.userId, {
					talking: false
				});
			}
			this.layoutService?.handleUserEvent('onUserVoiceStopped', e);
		}
		onUserStatsReceived(e) {
			this.viewPort?.setUserStats(e.userId, e.report, e.mediaServerId);
		}
		onCallUserScreenState(e) {
			this.layoutService?.handleScreenStateEvent(e, this.currentCall);
			this.updateCallUser(e.userId, {
				screenState: e.screenState
			});
		}
		onCloudRecordStatusChanged(event) {
			this.recordingUiService?.trackCloudRecordStateChange({
				currentUserId: this.controller.getUserId(),
				eventUserId: event.userId,
				newState: event.commonRecordState.state,
				recordType: event.commonRecordState.type,
				previousState: this.commonRecord.state,
				commonRecordInfo: this.commonRecord.info,
				callId: this.currentCall.uuid,
				callType: call_lib_analytics.Analytics.AnalyticsType.videoconf
			});
			this.commonRecord.state = event.commonRecordState.state;
			this.commonRecord.initiatorId = event.initiatorId;
			if (Call.Util.isCommonRecordStateInactive(event.commonRecordState.state)) {
				this.commonRecord.info = null;
				this.commonRecord.initiatorId = null;
			} else {
				this.commonRecord.info = structuredClone(event.commonRecordState);
			}
			this.recordingUiService?.updateView(event.commonRecordState, {
				type: 'cloudRecord',
				userId: event.userId,
				currentUserId: this.controller.getUserId(),
				justJoined: event.justJoined,
				eventRecordState: event.commonRecordState
			});
		}
		onCallUserFloorRequest(e) {
			this.layoutService?.handleUserEvent('onUserFloorRequest', e);
		}
		onMicrophoneLevel(e) {
			this.layoutService?.handleUserEvent('onMicrophoneLevel', e);
		}
		onCallConnectionQualityChanged(e) {
			this.layoutService?.handleUserEvent('onConnectionQualityChanged', e);
		}
		onCallToggleRemoteParticipantVideo(e) {
			this.notificationService?.handleRemoteParticipantVideoToggle(e.isVideoShown);
		}
		onGetUserMediaFailed(data) {
			this.notificationService?.showGetUserMediaFailedNotification(data);
		}
		onCameraPublishing(e) {
			if (e.publishing) {
				this.buttonStateService?.blockCameraButton();
			} else {
				this.buttonStateService?.unblockCameraButton();
			}
			this.viewPort?.updateButtons();
		}
		onMicrophonePublishingd(e) {
			if (e.publishing) {
				this.buttonStateService?.blockMicrophoneButton();
			} else {
				this.buttonStateService?.unblockMicrophoneButton();
			}
			this.viewPort?.updateButtons();
		}
		onTurnOnCamera() {
			this.#onCallViewToggleVideoButtonClickHandler({
				video: true,
				calledProgrammatically: true
			});
		}
		onAllParticipantsAudioMuted(e) {
			this._onAllParticipantsMuted(e, 'audio');
		}
		onAllParticipantsVideoMuted(e) {
			this._onAllParticipantsMuted(e, 'video');
		}
		onAllParticipantsScreenshareMuted(e) {
			this._onAllParticipantsMuted(e, 'screenshare');
		}
		onRoomSettingsChanged(e) {
			const result = this.notificationService?.showRoomSettingsChangedNotification(e.data, this.userId);
			if (this.viewPort && !result?.isAllow) {
				this.viewPort.setAllUserPermissionToSpeakState(false);
			}
			if (this.participantsPermissionPopup) {
				this.participantsPermissionPopup.updateStatePermissions();
			}
			if (e.data?.eft === true && e.data?.act === 'audio' && !Call.Util.havePermissionToBroadcast('mic')) {
				this.lastCalledChangeSettingsUserName = result?.initiatorName ?? '';
				this.notificationService?.showRiseYouHandToTalkNotification({
					initiatorName: this.lastCalledChangeSettingsUserName,
					bindElement: this.viewPort?.buttons?.microphone?.elements?.icon
				});
			}
			this.viewPort?.updateButtons();
			this.#updateCamMicButtonsPermissions();
		}
		onUserPermissionsChanged(e) {
			if (!e.data?.allow) {
				const floorState = this.viewPort?.getUserFloorRequestState(this.callEngine?.getCurrentUserId());
				if (floorState) {
					this.onCallViewFloorRequestButtonClick();
				}
			}
			this.notificationService?.showPermissionsChangedNotification(e.data);
			if (this.viewPort) {
				this.viewPort.setUserPermissionToSpeakState(e.data?.toUserId, e.data?.allow);
			}
			this.viewPort?.updateButtons();
			this.#updateCamMicButtonsPermissions();
		}
		onUserRoleChanged(e) {
			const content = this.notificationService?.getRoleChangedNotificationContent(e.data, this.userId);
			if (content) {
				this.notificationService?.showNotification(content);
			}
			if (this.viewPort) {
				this.viewPort.updateButtons();
				this.viewPort.updateFloorRequestNotification();
			}
			this.#updateCamMicButtonsPermissions();
		}
		#updateCamMicButtonsPermissions() {
			if (Call.Util.havePermissionToBroadcast('cam')) {
				this.buttonStateService?.unblockCameraButton();
			} else {
				this.buttonStateService?.blockCameraButton();
			}
			if (Call.Util.havePermissionToBroadcast('mic')) {
				this.buttonStateService?.unblockMicrophoneButton();
			} else {
				this.buttonStateService?.blockMicrophoneButton();
				// all three ways the right can be revoked - permissions, role, room settings - end up
				// here, and none of them touches the state of the microphone
				this.viewPort?.notifyBroadcastRightLost();
			}
		}
		onYouMuteAllParticipants(e) {
			this.notificationService?.showYouMuteAllNotification(e);
		}
		#onParticipantMuted = e => {
			const {
				data
			} = e;
			const {
				toUserId,
				track
			} = data || {};
			this.notificationService?.showParticipantMutedNotification(data, this.params.userId);
			const isMutedForMe = Number(toUserId) === this.params.userId && track?.muted === true;
			const isRegularUser = Call.Util.isRegularUser(Call.Util.getCurrentUserRole());
			if (!isMutedForMe || !isRegularUser) {
				return;
			}
			switch (track?.type) {
				case call_const.ParticipantTrackType.AUDIO:
					this.#onCallViewToggleMuteHandler({
						muted: true,
						calledProgrammatically: true
					});
					break;
				case call_const.ParticipantTrackType.VIDEO:
					this.#onCallViewToggleVideoButtonClickHandler({
						video: false,
						calledProgrammatically: true
					});
					break;
				case call_const.ParticipantTrackType.SCREENSHARE:
					if (this.currentCall?.isScreenSharingStarted()) {
						this.onCallViewToggleScreenSharingButtonClick();
					}
					break;
			}
		};
		removeAdditionalEvents() {
			window.removeEventListener('focus', () => this.onWindowFocus());
			window.removeEventListener('blur', () => this.onWindowBlur());
			document.body.removeEventListener('click', evt => this.onDocumentBodyClick(evt));
		}
		onCallRemoteMediaAvailable(e) {
			this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
		}
		onCallRemoteMediaUnavailable(e) {
			this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
		}
		isLegacyCall(provider, scheme = null) {
			if (scheme) {
				return scheme === Call__namespace.CallScheme.classic;
			}
			const isLegacyPlainCall = provider === Call__namespace.Provider.Plain && !call_lib_settingsManager.CallSettingsManager.isJwtInPlainCallsEnabled();
			const isLegacyBitrixCall = provider === Call__namespace.Provider.Bitrix && !call_lib_settingsManager.CallSettingsManager.jwtCallsEnabled;
			return isLegacyPlainCall || isLegacyBitrixCall;
		}
		_getCallIdentifier(call) {
			if (!call) {
				return null;
			}
			return this.isLegacyCall(call.provider, call.scheme) ? call.id : call.uuid;
		}
		getCallType() {
			return call_lib_analytics.Analytics.AnalyticsType.videoconf;
		}
		loopConnectionQuality(userId, quality, timeout = 200) {
			if (this.viewPort) {
				this.loopTimers[userId] = setTimeout(() => {
					this.viewPort.setUserConnectionQuality(userId, quality);
					const newQuality = quality >= 4 ? 1 : quality + 1;
					this.loopConnectionQuality(userId, newQuality, timeout);
				}, timeout);
			}
		}
		clearConnectionQualityTimer(userId) {
			if (this.loopTimers[userId] !== undefined) {
				clearTimeout(this.loopTimers[userId]);
				delete this.loopTimers[userId];
			}
		}
		_onAllParticipantsMuted(e, type) {
			this.notificationService?.showAllParticipantsMutedNotification(e, type);
			if (!Call.Util.isRegularUser(Call.Util.getCurrentUserRole())) {
				return;
			}
			if (type === 'audio') {
				this.#onCallViewToggleMuteHandler({
					muted: true,
					calledProgrammatically: true
				});
			} else if (type === 'video') {
				this.#onCallViewToggleVideoButtonClickHandler({
					video: false,
					calledProgrammatically: true
				});
			} else if (type === 'screenshare' && this.currentCall.isScreenSharingStarted()) {
				this.onCallViewToggleScreenSharingButtonClick();
			}
		}
		onCallJoin(e) {
			if (!e.local) {
				return;
			}
			if (!this.isViewerMode()) {
				this.buttonStateService?.unblockFloorRequestAndScreenButtons();
				this.checkAvailableCamera();
				this.checkAvailableMicrophone();
			}
			if (this.viewPort.getConnectedUserCount(false)) {
				this.buttonStateService?.unblockRecordButton();
			}
			this.viewPort.setUiState(call_mapping.ViewUiState.Connected);
		}
		onCallLeave(e) {
			if (!e.local) {
				return;
			}
			this.layoutService?.closeWebScreenSharePopup();

			// Best-effort record_stop for cloud recording when this leave actually ends the call:
			// on last-user-left the engine auto-hangups and emits onLeave (onDestroy sees no record state).
			// No Plain branch here: a conference is always a group call (never a Plain 1-on-1).
			if (this.currentCall && this.#canCloudRecord() && this.#isCommonRecordStarted() && this.getActiveCallUsers().length === 0) {
				this.recordingUiService?.trackCloudRecordStopOnDisconnect(this.currentCall.uuid, call_lib_analytics.Analytics.AnalyticsType.videoconf, this.commonRecord.info, false);
			}
			this.#stopCommonRecord();
			this.commonRecord.state = Call__namespace.CallCommonRecordState.Stopped;
			this.commonRecord.type = Call__namespace.CallCommonRecordType.None;
			this.togglePictureInPictureCallWindow({
				isForceClose: true
			});
			if (this.getActiveCallUsers().length === 0) {
				call_lib_analytics.Analytics.getInstance().onFinishCall({
					callId: this.currentCall?.uuid,
					callType: call_lib_analytics.Analytics.AnalyticsType.videoconf,
					status: call_lib_analytics.Analytics.AnalyticsStatus.lastUserLeft,
					chatId: this.currentCall?.associatedEntity.id,
					callUsersCount: this.getCallUsers(true).length,
					callLength: Call.Util.getTimeText(this.currentCall.startDate)
				});
			}
			this.endCall();
		}
		onCallDestroy(e) {
			// At the very top: currentCall is cleared below, and with it the identifier of the series.
			// Only CallLegacy reaches the conference by this event alone: its destroy() raises no onLeave.
			this.#reconnectSeriesReporter.reportCallLost();

			// Best-effort record_stop for cloud recording when the call is destroyed externally.
			// Must run before currentCall is cleared, as the call uuid is read below.
			if (this.#canCloudRecord() && this.#isCommonRecordStarted() && this.commonRecord.initiatorId === this.userId) {
				this.recordingUiService?.trackCloudRecordStopOnDisconnect(this.currentCall.uuid, call_lib_analytics.Analytics.AnalyticsType.videoconf, this.commonRecord.info, false);
			}
			this.currentCall = null;
			if (this.promotedToAdminTimeout) {
				clearTimeout(this.promotedToAdminTimeout);
			}
			this.floatingWindowService?.hideScreenShareWindow();
			this.layoutService?.closeWebScreenSharePopup();
			this.notificationService?.closeRiseYouHandToTalkPopup();
			this.#stopCommonRecord();
			this.restart();
		}
		onCheckDevicesSave(changedValues) {
			if (changedValues.camera) {
				Call__namespace.Hardware.defaultCamera = changedValues.camera;
			}
			if (changedValues.microphone) {
				Call__namespace.Hardware.defaultMicrophone = changedValues.microphone;
			}
			if (changedValues.audioOutput) {
				Call__namespace.Hardware.defaultSpeaker = changedValues.audioOutput;
			}
			if (changedValues.enableMicAutoParameters) {
				Call__namespace.Hardware.enableMicAutoParameters = changedValues.enableMicAutoParameters;
			}
		}
		setCameraState(state) {
			Call__namespace.Hardware.isCameraOn = state;
		}
		/* endregion 01. Call methods */

		/* region 02. Component methods */
		/* region 01. General actions */
		isChatShowed() {
			return this.getConference().common.showChat;
		}
		toggleChat() {
			const rightPanelMode = this.getConference().common.rightPanelMode;
			switch (rightPanelMode) {
				case call_const.ConferenceRightPanelMode.hidden:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.chat
						});
						this.viewPort.setButtonActive('chat', true);
						break;
					}
				case call_const.ConferenceRightPanelMode.chat:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.hidden
						});
						this.viewPort.setButtonActive('chat', false);
						break;
					}
				case call_const.ConferenceRightPanelMode.users:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.split
						});
						this.viewPort.setButtonActive('chat', true);
						break;
					}
				case call_const.ConferenceRightPanelMode.split:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.users
						});
						this.viewPort.setButtonActive('chat', false);
						break;
					}
				// No default
			}
		}
		toggleUserList() {
			const rightPanelMode = this.getConference().common.rightPanelMode;
			switch (rightPanelMode) {
				case call_const.ConferenceRightPanelMode.hidden:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.users
						});
						this.viewPort.setButtonActive('users', true);
						break;
					}
				case call_const.ConferenceRightPanelMode.users:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.hidden
						});
						this.viewPort.setButtonActive('users', false);
						break;
					}
				case call_const.ConferenceRightPanelMode.chat:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.split
						});
						this.viewPort.setButtonActive('users', true);
						break;
					}
				case call_const.ConferenceRightPanelMode.split:
					{
						this.controller.getStore().dispatch('conference/changeRightPanelMode', {
							mode: call_const.ConferenceRightPanelMode.chat
						});
						this.viewPort.setButtonActive('users', false);
						break;
					}
				// No default
			}
		}
		pinUser(user) {
			if (!this.viewPort) {
				return false;
			}
			this.viewPort.pinUser(user.id);
			this.viewPort.setLayout(call_mapping.ViewLayout.Centered);
		}
		unpinUser() {
			if (!this.viewPort) {
				return false;
			}
			this.viewPort.unpinUser();
		}
		changeBackground() {
			if (!Call__namespace.Hardware) {
				return false;
			}
			Call__namespace.BackgroundDialog.open();
		}
		openChat(user) {
			im_v2_lib_desktopApi.DesktopApi.emitToMainWindow('bxConferenceOpenChat', [user.id]);
		}
		openProfile(user) {
			im_v2_lib_desktopApi.DesktopApi.emitToMainWindow('bxConferenceOpenProfile', [user.id]);
		}
		setDialogInited() {
			this.dialogInited = true;
			const dialogData = this.getDialogData();
			document.title = dialogData.name;
		}
		changeVideoconfUrl(newUrl) {
			window.history.pushState('', '', newUrl);
		}
		sendNewMessageNotify(params) {
			if (!this.checkIfMessageNotifyIsNeeded(params)) {
				return false;
			}
			const text = im_lib_utils.Utils.text.purify(params.message.text, params.message.params, params.files);
			let avatar = '';
			let userName = '';

			// avatar and username only for non-system messages
			if (params.message.senderId > 0 && params.message.system !== 'Y') {
				const messageAuthor = this.controller.getStore().getters['users/get'](params.message.senderId, true);
				userName = messageAuthor.name;
				avatar = messageAuthor.avatar;
			}
			ui_notificationManager.Notifier.notify({
				id: `im-videconf-${params.message.id}`,
				title: userName,
				icon: avatar,
				text
			});
			return true;
		}
		checkIfMessageNotifyIsNeeded(params) {
			if (!Call.Util.isConferenceChatEnabled()) {
				return false;
			}
			const rightPanelMode = this.getConference().common.rightPanelMode;
			return !im_lib_utils.Utils.device.isMobile() && params.chatId === this.getChatId() && (rightPanelMode !== call_const.ConferenceRightPanelMode.chat || rightPanelMode !== call_const.ConferenceRightPanelMode.split) && params.message.senderId !== this.controller.getUserId() && !this.getConference().common.error;
		}
		onInputFocus(e) {
			this.viewPort.setHotKeyTemporaryBlock(true);
		}
		onInputBlur(e) {
			this.viewPort.setHotKeyTemporaryBlock(false);
		}
		setReconnectingCameraId(id) {
			this.reconnectingCameraId = id;
			if (id) {
				this.updateCameraSettingsInCurrentCallAfterReconnecting(id);
			}
		}
		updateCameraSettingsInCurrentCallAfterReconnecting(cameraId) {
			if (this.currentCall.cameraId === cameraId) {
				return;
			}
			const devicesList = Call__namespace.Hardware.getCameraList();
			if (!devicesList.find(device => device.deviceId === cameraId)) {
				return;
			}
			this.currentCall.setCameraId(cameraId);
			this.setReconnectingCameraId(null);
		}
		onUpdateLastUsedCameraId() {
			const cameraId = this.currentCall.cameraId;
			if (cameraId) {
				this.lastUsedCameraId = cameraId;
			}
		}
		onReconnecting(e) {
			// before the provider check below: the connection is lost whatever the provider is
			this.viewPort?.notifyConnectionLost();
			if (!(this.currentCall.provider === Call__namespace.Provider.Bitrix || this.currentCall.provider === Call__namespace.Provider.Plain)) {
				return false;
			}
			this.notificationService?.showReconnectingBalloon();

			// The report goes last: the interface tells the user about every attempt, the report wants one
			// event per series, and a failure of the report must not cost the user the notice.
			this.#reconnectSeriesReporter.reportSeriesStarted(e);
		}
		onReconnected(e) {
			this.setReconnectingCameraId(this.lastUsedCameraId);
			if (!(this.currentCall.provider === Call__namespace.Provider.Bitrix || this.currentCall.provider === Call__namespace.Provider.Plain)) {
				// todo: restore after fixing balloon resurrection issue
				// related to multiple simultaneous calls to the balloon manager
				// now it's enabled for Bitrix24 calls as a temp solution
				return false;
			}

			// noinspection UnreachableCodeJS
			this.notificationService?.closeReconnectingBalloon();

			// The report goes last: a failure of the telemetry must not cost the user the picture back.
			this.#reconnectSeriesReporter.reportSeriesRecovered(e);
		}
		onReconnectingFailed(e) {
			this.#reconnectSeriesReporter.reportSeriesFailed(e?.error);
		}

		// No provider check, unlike the handlers above: those gate the balloon, and this one has no
		// interface of its own. Only a plain engine raises the event, and an outcome of a series the
		// reporter never saw start goes nowhere.
		onReconnectSeriesOutcome(e) {
			this.#reconnectSeriesReporter.reportSeriesOutcome(e);
		}
		_onParticipantReconnecting(e) {}
		_onParticipantReconnected(e) {
			if (e?.participant?.userId && this.viewPort?.wrappedView?.users) {
				const callUser = this.viewPort.wrappedView.users[e.participant.userId];
				if (callUser) {
					callUser.showLastVideoFrame();
				}
			}
		}
		setUserWasRenamed() {
			if (this.viewPort) {
				if (this.viewPort.localUser) {
					this.viewPort.localUser.userModel.wasRenamed = true;
				}
			}
		}
		/* endregion 01. General actions */

		/* region 02. Store actions */
		setError(errorCode) {
			const currentError = this.getConference().common.error;
			// if user kicked from call - dont show him end of call form
			if (currentError && currentError === call_const.ConferenceErrorCode.kickedFromCall) {
				return;
			}
			this.controller.getStore().commit('conference/setError', {
				errorCode
			});
		}
		toggleSmiles() {
			this.controller.getStore().commit('conference/toggleSmiles');
		}
		setJoinType(joinWithVideo) {
			this.controller.getStore().commit('conference/setJoinType', {
				joinWithVideo
			});
		}
		setConferenceStatus(conferenceStarted) {
			this.controller.getStore().commit('conference/setConferenceStatus', {
				conferenceStarted
			});
		}
		setConferenceHasErrorInCall(hasErrorInCall) {
			this.controller.getStore().commit('conference/setConferenceHasErrorInCall', {
				hasErrorInCall
			});
		}
		setConferenceStartDate(conferenceStartDate) {
			this.controller.getStore().commit('conference/setConferenceStartDate', {
				conferenceStartDate
			});
		}
		setUserReadyToJoin() {
			this.controller.getStore().commit('conference/setUserReadyToJoin');
		}
		updateCallUser(userId, fields) {
			this.controller.getStore().dispatch('call/updateUser', {
				id: userId,
				fields
			});
		}
		/* endregion 02. Store actions */

		/* region 03. Rest actions */
		setUserName(name) {
			return new Promise((resolve, reject) => {
				this.restClient.callMethod('call.user.update', {
					name,
					chat_id: this.getChatId()
				}).then(resolve).catch(error => {
					reject(error);
				});
			});
		}
		checkPassword(password) {
			return new Promise((resolve, reject) => {
				this.restClient.callMethod('call.videoconf.password.check', {
					password,
					alias: this.params.alias
				}).then(result => {
					if (result.data() === true) {
						this.restClient.setPassword(password);
						this.controller.getStore().commit('conference/common', {
							passChecked: true
						});
						this.initUserComplete();
						resolve();
					} else {
						reject();
					}
				}).catch(result => {
					console.error('Password check error', result);
				});
			});
		}
		changeLink() {
			return new Promise((resolve, reject) => {
				this.restClient.callMethod('call.videoconf.share.change', {
					dialog_id: this.getDialogId()
				}).then(() => {
					resolve();
				}).catch(error => {
					reject(error);
				});
			});
		}
		/* endregion 03. Rest actions */
		/* endregion 02. Component methods */

		/* endregion 02. Methods */

		/* region 03. Utils */
		ready() {
			if (this.inited) {
				const promise = new BX.Promise();
				promise.resolve(this);
				return promise;
			}
			return this.initPromise;
		}
		getConference() {
			return this.controller.getStore().state.conference;
		}
		isBroadcast() {
			return this.getConference().common.isBroadcast;
		}
		getBroadcastPresenters() {
			return this.getConference().common.presenters;
		}
		isExternalUser() {
			return Boolean(this.getUserHash());
		}
		getCallConfig(videoEnabled, joinExisting, callUuid) {
			const dialogData = this.getDialogData() ?? {};
			const ownerId = Number(dialogData.ownerId ?? dialogData.owner ?? 0) || 0;
			const managerIds = Array.isArray(dialogData.managerList) ? dialogData.managerList.map(Number) : [];
			const callConfig = {
				videoEnabled,
				type: Call__namespace.Type.Permanent,
				entityType: 'chat',
				entityId: this.getDialogId(),
				provider: Call__namespace.Provider.Bitrix,
				enableMicAutoParameters: Call__namespace.Hardware.enableMicAutoParameters,
				joinExisting: Boolean(joinExisting),
				token: this.callToken,
				chatInfo: {
					advanced: {
						chatType: 'videoconf',
						entityData1: '',
						entityData2: '',
						entityData3: '',
						entityId: this.getDialogId(),
						entityType: 'VIDEOCONF'
					},
					avatar: '/bitrix/js/im/images/blank.gif',
					avatarColor: '#ab7761',
					id: this.getDialogId(),
					chatId: this.getChatId(),
					name: this.params.conferenceTitle,
					type: 'chat',
					userCounter: dialogData.userCounter,
					ownerId,
					managerIds
				}
			};
			if (callUuid) {
				callConfig.roomId = callUuid;
			}
			return callConfig;
		}
		getChatId() {
			return parseInt(this.params.chatId);
		}
		getDialogId() {
			return this.params.dialogId;
		}
		getDialogData() {
			if (!this.dialogInited) {
				return false;
			}
			return this.controller.getStore().getters['dialogues/get'](this.getDialogId());
		}
		getHost() {
			return location.origin || '';
		}
		getStartupErrorCode() {
			return this.params.startupErrorCode ? this.params.startupErrorCode : '';
		}
		isHttps() {
			return location.protocol === 'https:';
		}
		getUserHash() {
			return this.getConference().user.hash;
		}
		getUserHashCookie() {
			let userHash = '';
			const cookie = im_lib_cookie.Cookie.get(null, 'BITRIX_CALL_HASH');
			if (typeof cookie === 'string' && /^[\da-f]{32}$/.test(cookie)) {
				userHash = cookie;
			}
			return userHash;
		}
		switchToSessAuth() {
			this.restClient.restClient.queryParams = undefined;
			return true;
		}
		#getDefaultCommonRecord() {
			return {
				state: Call__namespace.CallCommonRecordState.Stopped,
				type: Call__namespace.CallCommonRecordType.None,
				initiatorId: null,
				info: null
			};
		}

		/* endregion 03. Utils */
	}
	ConferenceApplication.FeatureState = {
		Enabled: 'enabled',
		Disabled: 'disabled',
		Limited: 'limited'
	};

	exports.ConferenceApplication = ConferenceApplication;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX, BX.Event, BX.Main, BX, BX.UI, BX.UI.Notification, BX.UI.NotificationManager, BX.UI, BX.UI.Viewer, BX, BX, BX.Messenger.Application, BX.Messenger.Const, BX.Messenger, BX, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Provider.Pull, BX.Messenger.v2.Lib, BX, BX.Messenger.Application, BX.Messenger, BX.Call.Const, BX.Call, BX.Call.Mapping, BX.Call.Lib, BX.Call.Lib, BX.Call.Lib, BX.Call.Model, BX);
//# sourceMappingURL=conference.bundle.js.map
