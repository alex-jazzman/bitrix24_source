/**
 * Bitrix Im
 * Conference application
 *
 * @package bitrix
 * @subpackage mobile
 * @copyright 2001-2021 Bitrix
 */

// call
import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'main.date';
import 'promise';
import 'ui.buttons';
import 'ui.notification';
import { Notifier } from 'ui.notification-manager';
import 'ui.progressround';
import 'ui.viewer';
import { VueVendorV2 } from 'ui.vue';
import { VuexBuilder } from 'ui.vue.vuex';
import { createPinia, setActivePinia } from 'ui.vue3.pinia';

import 'im.application.launch';
import { EventType } from 'im.const';
import { Controller } from 'im.controller';
import 'im.debug';
import { Clipboard } from 'im.lib.clipboard';
import { Cookie } from 'im.lib.cookie';
import { LocalStorage } from 'im.lib.localstorage';
import { Logger } from 'im.lib.logger';
import { Utils } from 'im.lib.utils';
import { ImCallPullHandler } from 'im.provider.pull';
import { DesktopApi } from 'im.v2.lib.desktop-api';
import { PullClient } from 'pull.client';

import { ConferenceChannel } from 'call.application.conference-channel';
import 'call.component.conference.conference-public';
import { ConferenceErrorCode, ConferenceRightPanelMode as RightPanelMode, ParticipantTrackType } from 'call.const';
import * as Call from 'call.core';
import { ViewEvent, ViewLayout, ViewUiState } from 'call.mapping';
import {
	Util,
	Hardware,
	ParticipantsPermissionPopup,
	LayoutService,
	NotificationService,
	PromoService,
	HangupOptionsUiService,
	ButtonStateService,
	PictureInPictureService,
	RecordingUiService,
	CopilotUiService,
	CopilotPopup,
	CallAI,
	FeedbackUiService,
	FloatingWindowService,
} from 'call.core';
import { accidentLogger, getUnknownErrorType } from 'call.lib.accident-logger';
import { Analytics } from 'call.lib.analytics';
import { CallTokenManager } from 'call.lib.call-token-manager';
import { CallSettingsManager } from 'call.lib.settings-manager';
import { ConferenceModel, CallModel } from 'call.model';
import { useCallStore } from 'call.store';

import { CallRestClient } from './utils/restclient';

import './css/view.css';

class ConferenceApplication
{
	/* region 01. Initialize */
	constructor(params = {})
	{
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

		this.event = new VueVendorV2();
		this.callContainer = null;
		this.viewPort = null;
		this.pinia = null;
		this.callStore = null;
		this.preCall = null;
		this.currentCall = null;
		this.callToken = this.params.callToken ?? null;
		this.videoStrategy = null;
		this.callDetails = {};
		this.showFeedback = true;
		this.callScheme = null;

		this.promotedToAdminTimeoutValue = 10 * 1000; // 10 sec
		this.promotedToAdminTimeout = null;

		this.featureConfig = {};
		(params.featureConfig || []).forEach((limit) => {
			this.featureConfig[limit.id] = limit;
		});

		this.localVideoStream = null;

		// save reconnect camera
		this.lastUsedCameraId = null;
		this.reconnectingCameraId = null;

		this.conferencePageTagInterval = null;

		this.#initHandlers();

		this.waitingForCallStatus = false;
		this.waitingForCallStatusTimeout = null;
		this.callEventReceived = false;

		this.commonRecord = this.#getDefaultCommonRecord();

		this.screenShareStartTime = null;

		this.loopTimers = {};

		this.resizeObserver = new BX.ResizeObserver(() => {});

		if (DesktopApi.isDesktop())
		{
			ConferenceChannel.getInstance().setExecuter((callUuid) => {
				const currentCallUuid = this.params.alias;
				const hasView = Boolean(this.viewPort);

				const hasActiveCall = currentCallUuid === callUuid && hasView;
				if (hasActiveCall)
				{
					BXDesktopSystem.SetActiveTab();
				}

				return hasActiveCall;
			});
		}

		this.initDesktopEvents()
			.then(() => this.initAdditionalEvents())
			.then(() => this.initRestClient())
			.then(() => this.subscribePreCallChanges())
			.then(() => this.subscribeNotifierEvents())
			.then(() => this.initPullClient())
			.then(() => this.initCore())
			.then(() => this.setModelData())
			.then(() => this.initComponent())
			.then(() => this.initCallInterface())
			.then(() => this.initHardware())
			.then(() => this.initUserComplete())
			.catch((error) => {
				console.error('Init error', error);
			});
	}

	#initHandlers()
	{
		this.#initCallHandlers();
		this.#initAuxHandlers();
	}

	#initCallHandlers()
	{
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

	#initAuxHandlers()
	{
		this._onCallJoinHandler = this.onCallJoin.bind(this);
		this.onCallLeaveHandler = this.onCallLeave.bind(this);
		this.onReconnectingHandler = this.onReconnecting.bind(this);
		this.onReconnectedHandler = this.onReconnected.bind(this);
		this.onReconnectingFailedHandler = this.onReconnectingFailed.bind(this);
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

	#onCallLocalMediaReceived(e)
	{
		if (this.viewPort)
		{
			const flipVideo = e.tag === 'main' || e.mediaRenderer ? Call.Hardware.enableMirroring : false;

			this.viewPort.setLocalStream(e);
			this.viewPort.flipLocalVideo(flipVideo);
			this.viewPort.setButtonActive('screen', this.currentCall.isScreenSharingStarted());

			if (this.currentCall.isScreenSharingStarted())
			{
				this.screenShareStartTime = new Date();
				Analytics.getInstance().onScreenShareStarted({
					callId: this.currentCall.uuid,
					callType: Analytics.AnalyticsType.videoconf,
				});
				this.togglePictureInPictureCallWindow({ mediaReceived: true });

				if (!DesktopApi.isDesktop())
				{
					this.layoutService?.showWebScreenSharePopup(
						Call.WebScreenSharePopup,
						this.viewPort.getButtonElement('screen'),
						() => this.onCallViewToggleScreenSharingButtonClick(),
						this.viewPort.container,
					);
				}

				this.viewPort.updateButtons();
			}
			else
			{
				Analytics.getInstance().onScreenShareStopped({
					callId: this.currentCall.uuid,
					callType: Analytics.AnalyticsType.videoconf,
					status: Analytics.AnalyticsStatus.success,
					screenShareLength: Util.getTimeText(this.screenShareStartTime),
				});
				this.screenShareStartTime = null;
				this.togglePictureInPictureCallWindow({ mediaReceived: true });
				this.floatingWindowService?.hideScreenShareWindow();
				this.layoutService?.closeWebScreenSharePopup();
			}

			if (!this.currentCall.callFromMobile && !this.isViewerMode())
			{
				this.checkAvailableCamera();
				this.checkAvailableMicrophone();
			}
		}

		if (this.currentCall && Call.Hardware.isCameraOn && e.tag === 'main' && e.stream.getVideoTracks().length === 0)
		{
			Call.Hardware.isCameraOn = false;
		}
	}

	#onCallUserCommonRecordState(e)
	{
		if (this.#canCloudRecord())
		{
			return;
		}

		this.commonRecord.state = e.commonRecordState.state;
		this.commonRecord.initiatorId = e.commonRecordState.userId;

		if (Util.isCommonRecordStateInactive(e.commonRecordState.state))
		{
			this.commonRecord.info = null;
			this.commonRecord.initiatorId = null;
		}
		else
		{
			this.commonRecord.info = e.commonRecordState;
		}

		this.recordingUiService?.handleCommonRecordState({
			state: e.commonRecordState.state,
			initiatorId: e.commonRecordState.userId,
			currentUserId: this.userId,
			commonRecordState: e.commonRecordState,
			callId: this.currentCall.uuid,
			callType: Analytics.AnalyticsType.videoconf,
		});

		if (this.#canLocalRecord() && e.userId === this.userId)
		{
			if (
				e.commonRecordState.state === Call.CallCommonRecordState.Started
				&& e.commonRecordState.userId === this.userId
			)
			{
				this.recordingUiService?.handleLocalRecordStart({
					callId: this.currentCall.uuid,
					callType: Analytics.AnalyticsType.videoconf,
					callApiId: this.currentCall.id,
					callUuid: this.currentCall.uuid,
					dialogId: this.params.chatId,
					dialogName: this.params.name,
					formatRecordDate: 'd.m.Y',
					recordType: this.commonRecord.type,
					isMicrophoneMuted: Call.Hardware.isMicrophoneMuted,
					windowId: 'chat',
				});
			}
			else if (e.commonRecordState.state === Call.CallCommonRecordState.Stopped)
			{
				this.#stopCommonRecord();
			}
		}
	}

	#onCallFailure(e)
	{
		const errorCode = e.code || e.name || e.error;

		this.notificationService?.handleCallFailure({ errorCode, isHttps: true, viewPort: this.viewPort });
		this.autoCloseCallView = false;

		if (this.currentCall)
		{
			this.removeCallEvents();
			this.removeVideoStrategy();
			this.currentCall.destroy();
			this.currentCall = null;
		}

		Call.Hardware.isMicrophoneMuted = false;
	}

	/* region 01. Initialize methods */
	initDesktopEvents()
	{
		if (!DesktopApi.isDesktop())
		{
			return Promise.resolve();
		}

		DesktopApi.subscribe('BXScreenMediaSharing', (id, title, x, y, width, height, app) => this.floatingWindowService?.showScreenShareWindow({ title, x, y, width, height, app }));
		DesktopApi.subscribe('bxImUpdateCounterMessage', (counter) => {
			if (!this.controller)
			{
				return false;
			}
			this.controller.getStore().commit('conference/common', { messageCount: counter });

			if (this.callStore)
			{
				try
				{
					this.callStore.setConferenceCommon({ messageCount: counter });
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in updatePreCallCounter:', error);
				}
			}
		});
		DesktopApi.subscribe('BXVpnStatusChange', (status) => {
			if (status)
			{
				this.notificationService?.showVpnIsActiveNotification();
			}
		});

		EventEmitter.subscribe(EventType.textarea.focus, this.onInputFocusHandler);
		EventEmitter.subscribe(EventType.textarea.blur, this.onInputBlurHandler);
		EventEmitter.subscribe(EventType.conference.userRenameFocus, this.onInputFocusHandler);
		EventEmitter.subscribe(EventType.conference.userRenameBlur, this.onInputBlurHandler);

		return Promise.resolve();
	}

	initAdditionalEvents()
	{
		// todo: fix it during refactoring
		window.addEventListener('focus', () => this.onWindowFocus());
		window.addEventListener('blur', () => this.onWindowBlur());
		document.body.addEventListener('click', (evt) => this.onDocumentBodyClick(evt));

		return Promise.resolve();
	}

	initRestClient()
	{
		this.restClient = new CallRestClient({ endpoint: `${this.getHost()}/rest` });
		this.restClient.setConfId(this.params.conferenceId);

		return Promise.resolve();
	}

	subscribePreCallChanges()
	{
		BX.addCustomEvent(window, 'CallEvents::callCreated', this.onCallCreated.bind(this));
	}

	subscribeNotifierEvents()
	{
		Notifier.subscribe('click', (event) => {
			const { id } = event.getData();
			if (id.startsWith('im-videconf'))
			{
				this.toggleChat();
			}
		});
	}

	initPullClient()
	{
		if (!this.params.isIntranetOrExtranet)
		{
			this.pullClient = new PullClient({
				serverEnabled: true,
				userId: this.params.userId,
				siteId: this.params.siteId,
				restClient: this.restClient,
				skipStorageInit: true,
				configTimestamp: 0,
				skipCheckRevision: true,
				getPublicListMethod: 'call.channel.public.list',
			});

			return Promise.resolve();
		}
		this.pullClient = BX.PULL;

		return this.pullClient.start().then(() => {
			return Promise.resolve();
		});
	}

	initCore()
	{
		this.controller = new Controller({
			host: this.getHost(),
			siteId: this.params.siteId,
			userId: this.params.userId,
			languageId: this.params.language,
			pull: { client: this.pullClient },
			rest: { client: this.restClient },
			vuexBuilder: {
				database: !Utils.browser.isIe(),
				databaseName: 'imol/call',
				databaseType: VuexBuilder.DatabaseType.localStorage,
				models: [ConferenceModel.create(), CallModel.create()],
			},
		});

		window.BX.Messenger.Application.Core = {
			controller: this.controller,
		};

		return new Promise((resolve, reject) => {
			this.controller.ready().then(() => {
				if (Util.isVueEnabled())
				{
					this.pinia = createPinia();
					setActivePinia(this.pinia);
					this.callStore = useCallStore();
					this.callStore.callMode = 'conference';
				}

				resolve();
			});
		});
	}

	setModelData()
	{
		this.controller.getStore().commit('application/set', {
			dialog: {
				chatId: this.getChatId(),
				dialogId: this.getDialogId(),
			},
			options: {
				darkBackground: true,
			},
		});

		// set presenters ID list
		const presentersIds = this.params.presenters.map((presenter) => presenter.id);
		this.controller.getStore().dispatch('conference/setBroadcastMode', { broadcastMode: this.params.isBroadcast });
		this.controller.getStore().dispatch('conference/setPresenters', { presenters: presentersIds });

		// set presenters info in users model
		this.params.presenters.forEach((presenter) => {
			this.controller.getStore().dispatch('users/set', presenter);
		});

		if (this.params.passwordRequired)
		{
			this.controller.getStore().commit('conference/common', {
				passChecked: false,
			});
		}

		if (this.params.conferenceTitle)
		{
			this.controller.getStore().dispatch('conference/setConferenceTitle', {
				conferenceTitle: this.params.conferenceTitle,
			});
		}

		if (this.params.alias)
		{
			this.controller.getStore().commit('conference/setAlias', {
				alias: this.params.alias,
			});
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceBroadcastMode(this.params.isBroadcast);
				this.callStore.setConferencePresenters(
					this.params.presenters.map((presenter) => presenter.id),
					true,
				);

				if (this.params.passwordRequired)
				{
					this.callStore.setConferenceCommon({ passChecked: false });
				}

				if (this.params.conferenceTitle)
				{
					this.callStore.setCallTitle(this.params.conferenceTitle);
					this.callStore.setConferenceTitle(this.params.conferenceTitle);
				}

				if (this.params.alias)
				{
					this.callStore.setConferenceAlias(this.params.alias);
				}
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setModelData:', error);
			}
		}

		return Promise.resolve();
	}

	initComponent()
	{
		if (this.getStartupErrorCode())
		{
			this.setError(this.getStartupErrorCode());
		}

		return new Promise((resolve, reject) => {
			this.controller
				.createVue(this, {
					el: this.rootNode,
					data: () => {
						return {
							dialogId: this.getDialogId(),
						};
					},
					template: '<bx-im-component-conference-public :dialogId="dialogId"/>',
				})
				.then((vue) => {
					this.template = vue;
					resolve();
				})
				.catch((error) => reject(error));
		});
	}

	async initCallInterface()
	{
		try
		{
			this.callContainer = document.getElementById('bx-im-component-call-container');

			let hiddenButtons = ['camera', 'microphone', 'document'];
			if (this.isViewerMode())
			{
				hiddenButtons = ['screen', 'record', 'floorRequest', 'document'];
			}

			if (!this.params.isIntranetOrExtranet)
			{
				hiddenButtons.push('record');
			}

			if (!Util.isConferenceChatEnabled())
			{
				hiddenButtons.push('chat');
			}

			if (Util.isVueEnabled())
			{
				const { VueCallViewAdapter } = await BX.Runtime.loadExtension('call.vue');

				let initialLayout = 'Grid';
				if (Utils.device.isMobile())
				{
					initialLayout = 'Mobile';
				}
				else if (this.isBroadcast())
				{
					initialLayout = 'Centered';
				}

				this.callStore.setLayout(initialLayout);
				this.callStore.setUiState('Preparing');
				this.callStore.setCopilotFeaturesEnabled(false);
				this.callStore.setCopilotState(false);
				this.callStore.setWindowFocus(this.layoutService?.isWindowFocus ?? true);
				this.callStore.blockButtons(['camera', 'microphone', 'floorRequest', 'screen', 'copilot']);
				if (this.isExternalUser())
				{
					this.callStore.setAllowRename(true);
				}

				this.viewPort = new VueCallViewAdapter({
					container: this.callContainer,
					pinia: this.pinia,
					hiddenButtons,
				});
			}
			else
			{
				const { View: LegacyView, LegacyCallViewAdapter } = await BX.Runtime.loadExtension('call.view');
				this.viewPort = new LegacyCallViewAdapter(
					new LegacyView({
						container: this.callContainer,
						showChatButtons: true,
						showUsersButton: true,
						showShareButton:
							this.getFeatureState('screenSharing') !== ConferenceApplication.FeatureState.Disabled,
						showRecordButton:
							this.getFeatureState('record') !== ConferenceApplication.FeatureState.Disabled,
						userLimit: Util.getUserLimit(),
						isIntranetOrExtranet: Boolean(this.params.isIntranetOrExtranet),
						language: this.params.language,
						layout: Utils.device.isMobile() ? ViewLayout.Mobile : ViewLayout.Centered,
						uiState: ViewUiState.Preparing,
						blockedButtons: ['camera', 'microphone', 'floorRequest', 'screen', 'copilot'],
						localUserState: Call.UserState.Idle,
						hiddenTopButtons:
							!this.isBroadcast() || this.getBroadcastPresenters().length > 1 ? [] : ['grid'],
						hiddenButtons,
						broadcastingMode: this.isBroadcast(),
						broadcastingPresenters: this.getBroadcastPresenters(),
						isCopilotFeaturesEnabled: false,
						isCopilotActive: false,
						isWindowFocus: this.layoutService?.isWindowFocus ?? true,
						isVideoconf: true,
					}),
				);
			}

			this.viewPort.subscribe(ViewEvent.onButtonClick, this.onCallButtonClick.bind(this));
			this.viewPort.subscribe(ViewEvent.onReplaceCamera, (event) => {
				const cameraId = event.data.deviceId;
				if (this.reconnectingCameraId)
				{
					this.setReconnectingCameraId(null);
				}
				Call.Hardware.defaultCamera = cameraId;
				if (this.currentCall)
				{
					this.currentCall.setCameraId(cameraId);
				}
				else
				{
					this.template.$emit('cameraSelected', cameraId);
				}
			});
			this.viewPort.subscribe(ViewEvent.onReplaceMicrophone, (event) => {
				const microphoneId = event.data.deviceId;
				Call.Hardware.defaultMicrophone = microphoneId;
				if (this.viewPort)
				{
					this.viewPort.setMicrophoneId(microphoneId);
				}

				if (this.currentCall)
				{
					this.currentCall.setMicrophoneId(microphoneId);
				}
				else
				{
					this.template.$emit('micSelected', event.data.deviceId);
				}
			});
			this.viewPort.subscribe(ViewEvent.onReplaceSpeaker, (event) => {
				Call.Hardware.defaultSpeaker = event.data.deviceId;
			});
			this.viewPort.subscribe(ViewEvent.onHasMainStream, (event) => {
				if (this.currentCall && this.currentCall.provider === Call.Provider.Bitrix)
				{
					this.currentCall.setMainStream(event.data);
				}
			});
			this.viewPort.subscribe(ViewEvent.onChangeNoiseSuppression, (event) => {
				Call.Hardware.enableNoiseSuppression = event.data.allowNoiseSuppression;
				Call.Hardware.turnNoiseSuppression();
			});
			this.viewPort.subscribe(ViewEvent.onChangeMicAutoParams, (event) => {
				Call.Hardware.enableMicAutoParameters = event.data.allowMicAutoParams;
			});
			this.viewPort.subscribe(ViewEvent.onChangeFaceImprove, (event) => {
				if (DesktopApi.isDesktop())
				{
					DesktopApi.setCameraSmoothingStatus(event.data.faceImproveEnabled);
				}
			});
			this.viewPort.subscribe(ViewEvent.onUserRename, (event) => {
				if (!this.isExternalUser())
				{
					return;
				}
				Utils.device.isMobile()
					? this.renameGuestMobile(event.data.newName)
					: this.renameGuest(event.data.newName);
			});
			this.viewPort.subscribe(ViewEvent.onUserPinned, (event) => {
				if (event.data.userId)
				{
					this.updateCallUser(event.data.userId, { pinned: true });

					return;
				}
				this.controller.getStore().dispatch('call/unpinUser');
			});
			this.viewPort.subscribe(ViewEvent.onToggleSubscribe, (e) => {
				if (this.currentCall && this.currentCall.provider === Call.Provider.Bitrix && e.data)
				{
					this.currentCall.toggleRemoteParticipantVideo(e.data.participants, e.data.showVideo, true);
				}
			});
			this.viewPort.subscribe(ViewEvent.onCommonRecordMenu, (event) => {
				const isPlainCall = this.currentCall?.provider === Call.Provider.Plain;
				const isBitrixCall = this.currentCall?.provider === Call.Provider.Bitrix;
				this.recordingUiService?.onCommonRecordMenu(event.data, {
					commonRecordState: this.commonRecord,
					cloudRecordEnabled:
						(isPlainCall && this.currentCall?.isCloudRecordFeaturesEnabled) || isBitrixCall,
					isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
					callId: this.currentCall?.id,
				});
			});

			this.viewPort.setCallback(ViewEvent.onChangeVideoQuality, (event) => {
				if (this.currentCall && this.currentCall.provider === Call.Provider.Bitrix)
				{
					this.currentCall.setVideoQualityForStreams({
						isCameraWasEnabledBeforeQualityChanged: event.isCameraWasEnabledBeforeQualityChanged,
						videoQuality: event.videoQuality,
						otherUsers: this.currentCall.users,
					});
				}
			});
			this.viewPort.setCallback(ViewEvent.onTurnOffParticipantMic, (e) => this._onCallViewTurnOffParticipantStream(e, 'mic'));
			this.viewPort.setCallback(ViewEvent.onTurnOffParticipantCam, (e) => this._onCallViewTurnOffParticipantStream(e, 'cam'));
			this.viewPort.setCallback(ViewEvent.onTurnOffParticipantScreenshare, (e) => this._onCallViewTurnOffParticipantStream(e, 'screenshare'));
			this.viewPort.setCallback(ViewEvent.onAllowSpeakPermission, (e) => this._onCallViewChangeSpeakPermission(e, true));
			this.viewPort.setCallback(ViewEvent.onDisallowSpeakPermission, (e) => this._onCallViewChangeSpeakPermission(e, false));

			this.viewPort.blockAddUser();
			this.viewPort.blockHistoryButton();

			if (!Utils.device.isMobile())
			{
				this.viewPort.show();
			}

			this._initUiServices();
		}
		catch (error)
		{
			Logger.error('creating call interface conference', error);

			let errorCode = 'UNKNOWN_ERROR';
			if (Type.isString(error))
			{
				errorCode = error;
			}
			else if (Type.isPlainObject(error) && error.code)
			{
				errorCode = error.code == 'access_denied' ? 'ACCESS_DENIED' : error.code;
			}

			this.onCallFailure({
				code: errorCode,
				message: error.message || '',
			});

			throw new Error('call interface error');
		}
	}

	_initUiServices()
	{
		this.buttonStateService = new ButtonStateService({
			viewPort: this.viewPort,
			callStore: this.callStore,
		});

		this.layoutService = new LayoutService({
			viewPort: this.viewPort,
			container: this.callContainer,
			resizeObserver: this.resizeObserver,
			callStore: this.callStore,
		});

		this.notificationService = new NotificationService({
			viewPort: this.viewPort,
			container: this.callContainer,
			callStore: this.callStore,
		});

		this.notificationService.subscribe('NotificationService::onAskSpeakButtonClicked', () => this.onCallViewFloorRequestButtonClick());
		this.notificationService.subscribe('NotificationService::onUnmuteMicButtonClicked', () => this.onCallViewToggleMuteButtonClick({ data: { muted: false } }));

		this.promoService = new PromoService({
			viewPort: this.viewPort,
			container: this.callContainer,
			isPromoRequired: (code) => BX.MessengerPromo?.needToShow(code) ?? false,
			callStore: this.callStore,
		});

		this.promoService.subscribe('PromoService::onPromoViewed', ({ data }) => {
			BX.MessengerPromo?.read(data.code);
			BX.MessengerPromo?.save(data.code);
		});

		this.pipService = new PictureInPictureService({
			viewPort: this.viewPort,
			callStore: this.callStore,
		});

		this.layoutService.subscribe('LayoutService::onFold', () => {
			this.promoService?.closeAll();
			this.copilotUiService?.closeNotify();
			this.pipService?.toggle({
				hasActiveCall: Boolean(this.currentCall),
				isFolded: this.layoutService.isFolded,
				isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
				enableAutoPip: this.viewPort?.enableAutoPip,
			});
			this.notificationService?.onFolded();
		});
		this.layoutService.subscribe('LayoutService::onUnfold', ({ data }) => {
			const { fromPiP } = data;
			this.pipService?.toggle({
				isForceClose: fromPiP,
				hasActiveCall: Boolean(this.currentCall),
				isFolded: false,
				isScreenSharing: false,
			});
		});

		this.layoutService.subscribe('LayoutService::onUnfoldDetached', () => {
			this.floatingWindowService?.hide();
			this.floatingWindowService?.hideScreenShareWindow();
		});

		this.layoutService.subscribe('LayoutService::onShowChat', () => this.layoutService.fold(this.params.name ?? ''));

		this.layoutService.subscribe('LayoutService::onShowWebScreenSharePopup', () => {
			this.layoutService?.showWebScreenSharePopup(
				Call.WebScreenSharePopup,
				this.viewPort?.getButtonElement('screen'),
				() => this.onCallViewToggleScreenSharingButtonClick(),
				this.viewPort?.container,
			);
		});

		this.layoutService.subscribe('LayoutService::onHideScreenShare', () => {
			this.floatingWindowService?.hideScreenShareWindow();
		});

		this.layoutService.subscribe('LayoutService::onTogglePiP', () => {
			this.togglePictureInPictureCallWindow();
		});

		this.hangupOptionsUiService = new HangupOptionsUiService({
			viewPort: this.viewPort,
			container: this.callContainer,
			callStore: this.callStore,
		});

		this.feedbackUiService = new FeedbackUiService({
			viewPort: this.viewPort,
			container: this.callContainer,
			callStore: this.callStore,
		});

		this.hangupOptionsUiService.subscribe('HangupOptionsUiService::onFinishForAll', ({ data }) => {
			const { callId, callType, chatId, callUsersCount, callLength } = data;
			Analytics.getInstance().onFinishCall({
				callId,
				callType,
				status: Analytics.AnalyticsStatus.finishedForAll,
				chatId,
				callUsersCount,
				callLength,
			});
			this.stopLocalVideoStream();
			this.endCall(true);
		});
		this.hangupOptionsUiService.subscribe('HangupOptionsUiService::onLeaveCall', ({ data }) => {
			const { callId, callType } = data;
			Analytics.getInstance().onDisconnectCall({
				callId,
				callType,
				subSection: Analytics.AnalyticsSubSection.contextMenu,
				mediaParams: {
					video: Call.Hardware.isCameraOn,
					audio: !Call.Hardware.isMicrophoneMuted,
				},
			});
			this.stopLocalVideoStream();
			this.endCall();
		});

		this.recordingUiService = new RecordingUiService({
			viewPort: this.viewPort,
			callStore: this.callStore,
		});

		this.recordingUiService.subscribe('RecordingUiService::onStartRecord', ({ data }) => {
			const { recordType, isCloud } = data;

			this.commonRecord.type = recordType;

			if (isCloud)
			{
				const kind =					recordType === Call.CallCommonRecordType.Audio
					? Call.CloudRecordKind.AUDIO
					: Call.CloudRecordKind.VIDEO;
				this.buttonStateService?.blockRecordButton();
				this.currentCall.setCloudRecordState(Call.CloudRecordStatus.STARTED, kind);
			}
			else
			{
				this.commonRecord.state = Call.CallCommonRecordState.Started;
				this.buttonStateService?.activateRecordButton(true);
				this.currentCall.sendLocalRecordState({
					action: Call.CallCommonRecordState.Started,
					type: this.commonRecord.type,
					date: new Date(),
				});
			}
		});

		this.recordingUiService.subscribe('RecordingUiService::onStopRecord', ({ data }) => {
			const { state, isCloud } = data;

			if (isCloud)
			{
				const cloudStatusMap = {
					[Call.CallCommonRecordState.Paused]: Call.CloudRecordStatus.PAUSED,
					[Call.CallCommonRecordState.Resumed]: Call.CloudRecordStatus.STARTED,
					[Call.CallCommonRecordState.Stopped]: Call.CloudRecordStatus.STOPPED,
				};
				this.currentCall.setCloudRecordState(cloudStatusMap[state]);
				this.commonRecord.state = state;

				return;
			}

			if (state === Call.CallCommonRecordState.Paused && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordPause(true);
			}
			else if (state === Call.CallCommonRecordState.Resumed && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordPause(false);
			}

			this.currentCall.sendLocalRecordState({
				action: state,
				type: this.commonRecord.type,
				date: new Date(),
			});

			this.commonRecord.state = state;
		});

		this.recordingUiService.subscribe('RecordingUiService::onDestroyRecord', ({ data }) => {
			const { isCloud } = data;

			if (isCloud)
			{
				this.currentCall.setCloudRecordState(Call.CloudRecordStatus.DESTROYED);
				this.commonRecord.state = Call.CallCommonRecordState.Destroyed;

				return;
			}

			this.currentCall.sendLocalRecordState({
				action: Call.CallCommonRecordState.Destroyed,
				type: this.commonRecord.type,
				date: new Date(),
			});

			this.commonRecord.state = Call.CallCommonRecordState.Destroyed;
		});

		this.copilotUiService = new CopilotUiService({
			viewPort: this.viewPort,
			container: this.callContainer,
			CopilotPopupClass: CopilotPopup,
			onTariffGate: () => Util.openArticle(CallAI.helpSlider),
			callStore: this.callStore,
		});

		this.copilotUiService.subscribe('CopilotUiService::onChangeStateCopilot', ({ data }) => {
			const { desiredState } = data;
			const actionMap = {
				enabled: 'call.Track.start',
				paused: 'call.Track.stop',
				destroyed: 'call.Track.destroy',
			};
			const action = actionMap[desiredState];

			if (!action)
			{
				return;
			}

			BX.ajax
				.runAction(action, {
					data: { callId: this.currentCall?.id },
				})
				.then(() => {
					const isCopilotActive = desiredState === 'enabled';

					this.onUpdateCallCopilotState({ isTrackRecordOn: isCopilotActive });
					this.copilotUiService?.updateState({
						isCopilotActive,
						callId: this.currentCall?.id,
					});
				});
		});

		if (DesktopApi.isDesktop())
		{
			this.floatingWindowService = new FloatingWindowService({
				floatingVideo: false,
				floatingScreenShare: true,
				darkMode: false,
				callStore: this.callStore,
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onBackToCall', () => {
				DesktopApi.activateWindow();
				DesktopApi.changeTab('im');
				this.layoutService?.unfold();
			});
			this.floatingWindowService.subscribe('FloatingWindowService::onStopSharing', () => {
				DesktopApi.activateWindow();
				DesktopApi.changeTab('im');
				this.onCallViewToggleScreenSharingButtonClick();
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onChangeScreen', () => {
				if (this.currentCall)
				{
					this.currentCall.startScreenSharing(true);
				}
			});
		}
	}

	initUserComplete()
	{
		return new Promise((resolve, reject) => {
			this.initUser()
				.then(() => this.tryJoinExistingCall())
				.then(() => this.initCall())
				.then(() => this.startPageTagInterval())
				.then(() => this.initPullHandlers())
				.then(() => this.subscribeToStoreChanges())
				.then(() => this.initComplete())
				.then(() => resolve)
				.catch((error) => reject(error));
		});
	}
	/* endregion 01. Initialize methods */

	/* region 02. initUserComplete methods */
	initUser()
	{
		return new Promise((resolve, reject) => {
			if (this.getStartupErrorCode() || !this.getConference().common.passChecked)
			{
				return reject();
			}

			if (this.params.userId > 0)
			{
				this.controller.setUserId(this.params.userId);

				if (this.params.isIntranetOrExtranet)
				{
					this.switchToSessAuth();

					this.controller.getStore().commit('conference/user', {
						id: this.params.userId,
					});

					if (this.callStore)
					{
						try
						{
							this.callStore.localUserId = this.params.userId;
						}
						catch (error)
						{
							console.error('[call.store] Pinia write failed in initUser (setCurrentUser):', error);
						}
					}
				}
				else
				{
					const hashFromCookie = this.getUserHashCookie();
					if (hashFromCookie)
					{
						CallTokenManager.setQueryParams({
							call_auth_id: hashFromCookie,
							videoconf_id: this.params.conferenceId,
						});
						this.restClient.setAuthId(hashFromCookie);
						this.restClient.setChatId(this.getChatId());
						this.controller.getStore().commit('conference/user', {
							id: this.params.userId,
							hash: hashFromCookie,
						});

						if (this.callStore)
						{
							try
							{
								this.callStore.localUserId = this.params.userId;
								this.callStore.setCurrentUserHash(hashFromCookie);
							}
							catch (error)
							{
								console.error('[call.store] Pinia write failed in initUser (setCurrentUser):', error);
							}
						}

						this.pullClient.start();
					}
				}

				return resolve();
			}

			return this.registerGuestUser(resolve);
		});
	}

	registerGuestUser(resolve)
	{
		this.restClient.setAuthId('guest');
		this.restClient.setChatId(this.getChatId());

		if (typeof BX.SidePanel !== 'undefined')
		{
			BX.SidePanel.Instance.disableAnchorBinding();
		}

		return this.restClient
			.callMethod('call.user.register', {
				alias: this.params.alias,
				user_hash: this.getUserHashCookie() || '',
			})
			.then((result) => {
				BX.message.USER_ID = result.data().id;
				this.controller.getStore().commit('conference/user', {
					id: result.data().id,
					hash: result.data().hash,
				});

				this.controller.setUserId(result.data().id);
				this.viewPort.setLocalUserId(result.data().id);

				Call.Engine.setCurrentUserId(this.controller.getUserId());
				Call.EngineLegacy.setCurrentUserId(this.controller.getUserId());

				CallTokenManager.setUserToken(result.data().userToken);

				if (this.callStore)
				{
					try
					{
						this.callStore.localUserId = result.data().id;
						this.callStore.setCurrentUserHash(result.data().hash);
					}
					catch (error)
					{
						console.error('[call.store] Pinia write failed in initUser (setCurrentUser):', error);
					}
				}

				if (result.data().created)
				{
					this.params.userCount++;
				}

				CallTokenManager.setQueryParams({
					call_auth_id: result.data().hash,
					videoconf_id: this.params.conferenceId,
				});

				this.restClient.setAuthId(result.data().hash);
				this.pullClient.start();

				return resolve();
			});
	}

	startPageTagInterval()
	{
		return new Promise((resolve) => {
			clearInterval(this.conferencePageTagInterval);
			this.conferencePageTagInterval = setInterval(() => {
				LocalStorage.set(
					this.params.siteId,
					this.params.userId,
					this.callEngine.getConferencePageTag(this.params.dialogId),
					'Y',
					2,
				);
			}, 1000);
			resolve();
		});
	}

	tryJoinExistingCall()
	{
		return new Promise((resolve, reject) => {
			const url = CallSettingsManager.jwtCallsEnabled ? 'call.Call.tryJoinCall' : 'call.CallManager.tryJoinCall';

			const callTypeKey = CallSettingsManager.jwtCallsEnabled ? 'callType' : 'type';

			BX.ajax
				.runAction(url, {
					data: {
						entityType: 'chat',
						entityId: this.params.dialogId,
						provider: Call.Provider.Bitrix,
						[callTypeKey]: Call.Type.Permanent,
					},
				})
				.then((result) => {
					const data = result.data;
					Logger.warn('tryJoinCall', data);

					if (data.success)
					{
						this.waitingForCallStatus = true;
						this.callScheme = data.call.SCHEME;

						if (this.callScheme === Call.CallScheme.jwt)
						{
							this.callToken = data.callToken;
							Call.Engine.instantiateCall(data.call, data.callToken, data.logToken, data.userData);
						}
						else
						{
							Call.EngineLegacy.instantiateCall(
								data.call,
								data.users,
								data.logToken,
								data.connectionData,
								data.userData,
							);
						}
						this.waitingForCallStatusTimeout = setTimeout(() => {
							this.waitingForCallStatus = false;
							if (!this.callEventReceived)
							{
								this.setConferenceStatus(false);
							}
							this.callEventReceived = false;
						}, 5000);
					}
					else
					{
						this.setConferenceStatus(false);
					}

					resolve();
				})
				.catch(() => {
					this.setConferenceStatus(false);
					resolve();
				});
		});
	}

	initCall()
	{
		return new Promise((resolve) => {
			if (this.callScheme)
			{
				this.callEngine = this.callScheme === Call.CallScheme.jwt ? Call.Engine : Call.EngineLegacy;
			}
			else
			{
				this.callEngine = CallSettingsManager.jwtCallsEnabled ? Call.Engine : Call.EngineLegacy;
			}

			Call.Engine.setRestClient(this.restClient);
			Call.Engine.setPullClient(this.pullClient);

			// this is a workaround to use actual parameters for conference guests in Util
			// since we don't know if a call is legacy or not when we make a REST request
			Call.EngineLegacy.setRestClient(this.restClient);
			Call.EngineLegacy.setPullClient(this.pullClient);
			this.viewPort.unblockButtons(['chat']);

			this.controller.getStore().commit('conference/common', { inited: true });

			if (this.callStore)
			{
				try
				{
					this.callStore.setConferenceCommon({ inited: true });
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in initCall (inited):', error);
				}
			}

			resolve();
		});
	}

	initPullHandlers()
	{
		this.pullClient.subscribe(
			new ImCallPullHandler({
				store: this.controller.getStore(),
				application: this,
				controller: this.controller,
			}),
		);

		return Promise.resolve();
	}

	subscribeToStoreChanges()
	{
		this.controller.getStore().subscribe((mutation, state) => {
			const { payload, type } = mutation;
			if (type === 'users/update' && payload.fields.name)
			{
				if (!this.viewPort)
				{
					return false;
				}

				this.viewPort.updateUserData({ [payload.id]: { name: payload.fields.name } });
			}
			else if (type === 'dialogues/set')
			{
				if (payload[0].dialogId !== this.getDialogId())
				{
					return false;
				}

				if (!Utils.platform.isBitrixDesktop())
				{
					if (Number.isNaN(parseInt(payload[0].counter, 10)))
					{
						Util.sendLog(`[conf] setButtonCounter chat: payload[0].counter = ${payload[0].counter} (NaN)`);
					}
					this.buttonStateService?.setChatCounter(payload[0].counter);
				}
			}
			else if (type === 'dialogues/update')
			{
				if (payload.dialogId !== this.getDialogId())
				{
					return false;
				}

				if (typeof payload.fields.counter === 'number' && this.viewPort)
				{
					if (Utils.platform.isBitrixDesktop())
					{
						if (
							payload.actionName === 'decreaseCounter'
							&& !payload.dialogMuted
							&& typeof payload.fields.previousCounter === 'number'
						)
						{
							let counter = payload.fields.counter;
							if (this.getConference().common.messageCount)
							{
								counter =									this.getConference().common.messageCount
									- (payload.fields.previousCounter - counter);
								if (counter < 0)
								{
									counter = 0;
								}
							}

							if (Number.isNaN(parseInt(counter, 10)))
							{
								Util.sendLog(`[conf] setButtonCounter chat: counter = ${counter} (NaN)`);
							}
							this.buttonStateService?.setChatCounter(counter);
						}
					}
					else
					{
						if (Number.isNaN(parseInt(payload.fields.counter, 10)))
						{
							Util.sendLog(
								`[conf] setButtonCounter chat:  payload.fields.counter = ${payload.fields.counter} (NaN)`,
							);
						}
						this.buttonStateService?.setChatCounter(payload.fields.counter);
					}
				}

				if (typeof payload.fields.name !== 'undefined')
				{
					document.title = payload.fields.name.toString();
				}
			}
			else if (type === 'conference/common' && typeof payload.messageCount === 'number' && this.viewPort)
			{
				if (Number.isNaN(parseInt(payload.messageCount, 10)))
				{
					Util.sendLog(
							`[conf] setButtonCounter chat: payload.messageCount = ${payload.messageCount} (NaN)`,
					);
				}
				this.buttonStateService?.setChatCounter(payload.messageCount);
			}
		});
	}

	initComplete()
	{
		if (this.isExternalUser())
		{
			if (this.viewPort.localUser)
			{
				this.viewPort.localUser.userModel.allowRename = true;
			}
			else if (this.callStore)
			{
				this.callStore.setAllowRename(true);
			}
		}

		if (this.getConference().common.inited)
		{
			this.inited = true;
			this.initPromise.resolve(this);
		}

		if (DesktopApi.isDesktop())
		{
			DesktopApi.emitToMainWindow('bxConferenceLoadComplete', []);
		}

		return Promise.resolve();
	}
	/* endregion 02. initUserComplete methods */
	/* endregion 01. Initialize */

	/* region 02. Methods */

	/* region 01. Call methods */
	initHardware()
	{
		return new Promise((resolve, reject) => {
			Call.Hardware.init()
				.then(() => {
					if (this.hardwareInited)
					{
						resolve();

						return true;
					}

					if (Object.values(Call.Hardware.microphoneList).length === 0)
					{
						this.setError(ConferenceErrorCode.missingMicrophone);
					}

					if (!this.isViewerMode())
					{
						this.checkAvailableCamera();
						this.checkAvailableMicrophone();
						this.viewPort.enableMediaSelection();
					}

					Call.Hardware.subscribe(Call.Hardware.Events.deviceChanged, this._onDeviceChange.bind(this));

					this.hardwareInited = true;
					resolve();
				})
				.catch((error) => {
					if (error === 'NO_WEBRTC' && this.isHttps())
					{
						this.setError(ConferenceErrorCode.unsupportedBrowser);
					}
					else if (error === 'NO_WEBRTC' && !this.isHttps())
					{
						this.setError(ConferenceErrorCode.unsafeConnection);
					}
					Logger.error('Init hardware error', error);
					reject(error);
				});
		});
	}

	_onDeviceChange(e)
	{
		if (!this.currentCall || !this.currentCall.ready)
		{
			this.checkAvailableCamera();
			this.checkAvailableMicrophone();

			return;
		}

		const allAddedDevice = e.data.added;
		const allRemovedDevice = e.data.removed;
		const removed = Call.Hardware.getRemovedUsedDevices(e.data.removed, {
			microphoneId: this.currentCall.microphoneId,
			cameraId: this.currentCall.cameraId,
			speakerId: this.viewPort.speakerId,
		});

		if (allAddedDevice)
		{
			setTimeout(() => this.useDevicesInCurrentCall(allAddedDevice), 500);
		}

		this.notificationService?.showDevicesDetachedNotification(removed);

		if (allRemovedDevice)
		{
			setTimeout(() => this.removeDevicesFromCurrentCall(allRemovedDevice), 500);
		}
	}

	#setDefaultDeviceIfNeeded(type)
	{
		const hasDevice = type === 'camera' ? Call.Hardware.hasCamera() : Call.Hardware.hasMicrophone();
		const defaultKey = type === 'camera' ? 'defaultCamera' : 'defaultMicrophone';
		const listKey = type === 'camera' ? 'cameraList' : 'microphoneList';

		const defaultDevice = Call.Hardware[defaultKey];
		const deviceList = Call.Hardware[listKey];

		if (
			!hasDevice
			|| (defaultDevice && defaultDevice in deviceList)
		)
		{
			return;
		}

		if (!defaultDevice && Object.keys(deviceList).length > 0)
		{
			Call.Hardware[defaultKey] = Object.keys(deviceList)[0];

			return;
		}

		Call.Hardware[defaultKey] = '';
	}

	checkAvailableCamera()
	{
		const isCameraButtonHasBlocked = this.viewPort.isButtonBlocked('camera');

		if (!this.currentCall && !Call.Hardware.hasCamera())
		{
			this.buttonStateService?.blockCameraButton();
		}
		else
		{
			this.buttonStateService?.unblockCameraButton();
		}

		this.#setDefaultDeviceIfNeeded('camera');

		const isActiveState = Call.Hardware.hasCamera() && Call.Hardware.defaultCamera;

		if (!this.currentCall && isCameraButtonHasBlocked)
		{
			this.template.$emit('setCameraState', isActiveState);
			this.template.$emit('cameraSelected', Call.Hardware.defaultCamera);
		}

		this.viewPort.updateButtons();
	}

	checkAvailableMicrophone()
	{
		if (!this.currentCall && !Call.Hardware.hasMicrophone())
		{
			this.buttonStateService?.blockMicrophoneButton();
		}
		else
		{
			this.buttonStateService?.unblockMicrophoneButton();
		}

		this.#setDefaultDeviceIfNeeded('microphone');

		const isActiveState = Call.Hardware.hasMicrophone();

		if (!this.currentCall)
		{
			this.template.$emit('setMicState', isActiveState);
			this.template.$emit('micSelected', Call.Hardware.defaultCamera);
		}

		this.viewPort.updateButtons();
	}

	useDevicesInCurrentCall(deviceList, isForceUse = false)
	{
		if (!this.currentCall || !this.currentCall.ready)
		{
			return;
		}

		for (const deviceInfo of deviceList)
		{
			switch (deviceInfo.kind)
			{
				case 'audioinput':
					if (deviceInfo.deviceId === 'default' || isForceUse)
					{
						const newDeviceId = Call.Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audioinput');
						this.currentCall.setMicrophoneId(newDeviceId);
						this.viewPort.setMicrophoneId(newDeviceId);
					}

					this.checkAvailableMicrophone();

					break;
				case 'videoinput':
					if (deviceInfo.deviceId === 'default' || isForceUse)
					{
						this.currentCall.setCameraId(deviceInfo.deviceId);
					}

					if (this.reconnectingCameraId === deviceInfo.deviceId && !Call.Hardware.isCameraOn)
					{
						this.updateCameraSettingsInCurrentCallAfterReconnecting(deviceInfo.deviceId);
					}

					this.checkAvailableCamera();

					break;
				case 'audiooutput':
					if ((this.viewPort && deviceInfo.deviceId === 'default') || isForceUse)
					{
						const newDeviceId = Call.Hardware.getDefaultDeviceIdByGroupId(
							deviceInfo.groupId,
							'audiooutput',
						);
						this.viewPort.setSpeakerId(newDeviceId);
					}

					break;
			}
		}
	}

	removeDevicesFromCurrentCall(deviceList)
	{
		if (!this.currentCall || !this.currentCall.ready)
		{
			return;
		}

		for (const deviceInfo of deviceList)
		{
			switch (deviceInfo.kind)
			{
				case 'audioinput':
					if (this.currentCall.microphoneId == deviceInfo.deviceId)
					{
						const microphoneIds = Object.keys(Call.Hardware.microphoneList);
						let deviceId;

						if (microphoneIds.includes('default'))
						{
							const deviceGroup = Call.Hardware.getDeviceGroupIdByDeviceId('default', 'audioinput');
							deviceId = Call.Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audioinput');
						}

						if (!deviceId)
						{
							deviceId = microphoneIds.length > 0 ? microphoneIds[0] : '';
						}

						this.currentCall.setMicrophoneId(deviceId);

						if (this.currentCall.provider === Call.Provider.Bitrix)
						{
							this.viewPort.setMicrophoneId(deviceId);
						}
					}

					this.checkAvailableMicrophone();

					break;
				case 'videoinput':
					if (this.currentCall.cameraId == deviceInfo.deviceId)
					{
						const cameraIds = Object.keys(Call.Hardware.cameraList);
						this.currentCall.setCameraId(cameraIds.length > 0 ? cameraIds[0] : '');
					}

					this.checkAvailableCamera();

					break;
				case 'audiooutput':
					if (this.viewPort && this.viewPort.speakerId == deviceInfo.deviceId)
					{
						const speakerIds = Object.keys(Call.Hardware.audioOutputList);
						let deviceId;

						if (speakerIds.includes('default'))
						{
							const deviceGroup = Call.Hardware.getDeviceGroupIdByDeviceId('default', 'audiooutput');
							deviceId = Call.Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audiooutput');
						}

						if (!deviceId)
						{
							this.viewPort.setSpeakerId(speakerIds.length > 0 ? speakerIds[0] : '');
						}
					}

					break;
			}
		}
	}

	startCall(videoEnabled, viewerMode = false, withCopilot)
	{
		if (this.initCallPromise)
		{
			return;
		}

		if (Utils.device.isMobile())
		{
			this.viewPort.show();
			if (Number.isNaN(parseInt(this.getDialogData().counter, 10)))
			{
				Util.sendLog(
					`[conf] setButtonCounter chat: this.getDialogData().counter = ${this.getDialogData().counter} (NaN)`,
				);
			}
			this.buttonStateService?.setChatCounter(this.getDialogData().counter);
		}
		else
		{
			this.viewPort.setLayout(ViewLayout.Grid);
		}

		this.viewPort.setUiState(ViewUiState.Calling);

		if (videoEnabled && !Call.Hardware.hasCamera())
		{
			this.notificationService?.showNotification(BX.message('IM_CALL_NO_CAMERA_ERROR'));
			videoEnabled = false;
		}

		if (this.localVideoStream && !videoEnabled)
		{
			this.stopLocalVideoStream();
		}
		this.controller.getStore().commit('conference/startCall');

		let callTokenPromise = Promise.resolve(this.callToken);
		if (CallSettingsManager.jwtCallsEnabled && !this.callToken)
		{
			callTokenPromise = CallTokenManager.getToken(this.params.chatId);
		}

		callTokenPromise
			.then((callToken) => {
				this.callToken = callToken;
				CallTokenManager.setToken(this.params.chatId, this.callToken);

				return this.callEngine.createCall(this.getCallConfig(videoEnabled)).then((e) => {
					Logger.warn('call created', e);

					this.currentCall = e.call;

					if (this.promotedToAdminTimeout)
					{
						clearTimeout(this.promotedToAdminTimeout);
					}

					if (!CallSettingsManager.jwtCallsEnabled)
					{
						this.onUpdateCallCopilotState({
							isTrackRecordOn: this.currentCall.isCopilotActive,
						});
					}

					if (Call.Hardware.defaultMicrophone)
					{
						this.currentCall.setMicrophoneId(Call.Hardware.defaultMicrophone);
					}

					if (Call.Hardware.defaultCamera)
					{
						this.currentCall.setCameraId(Call.Hardware.defaultCamera);
					}

					this.checkAvailableMicrophone();
					this.checkAvailableCamera();

					if (!Utils.device.isMobile())
					{
						this.viewPort.setLayout(ViewLayout.Grid);
					}

					if (CallSettingsManager.jwtCallsEnabled)
					{
						const userData = this.controller
							.getStore()
							.getters['users/get'](this.controller.getUserId(), true);
						this.viewPort.appendUsers([userData.id]);
						this.viewPort.updateUserData({ [userData.id]: userData });
					}
					else
					{
						this.viewPort.appendUsers(this.currentCall.getUsers());
						Util.getUsers(this.currentCall.id, this.getCallUsers(true)).then((userData) => {
							this.controller.getStore().dispatch('users/set', Object.values(userData));
							this.controller
								.getStore()
								.dispatch('conference/setUsers', { users: Object.keys(userData) });

							if (this.callStore)
							{
								try
								{
									this.callStore.addConferenceUsers(Object.keys(userData).map(Number));
								}
								catch (error)
								{
									console.error('[call.store] Pinia write failed in setUsers:', error);
								}
							}

							this.viewPort.updateUserData(userData);
						});
					}

					this.releasePreCall();
					this.bindCallEvents();
					this.updateCallUser(this.currentCall.userId, { microphoneState: !Call.Hardware.isMicrophoneMuted });
					if (e.isNew)
					{
						Analytics.getInstance().onStartVideoconf({
							callId: this.currentCall?.uuid,
							withVideo: videoEnabled,
							mediaParams: {
								video: Call.Hardware.isCameraOn,
								audio: !Call.Hardware.isMicrophoneMuted,
							},
							status: Analytics.AnalyticsStatus.success,
							isCopilotActive: this.currentCall.isCopilotActive,
							isVpnActive: this.#isVpnConnected(),
							userCounter: this.currentCall.associatedEntity?.userCounter,
						});

						this.currentCall.inviteUsers();
					}
					else
					{
						this.currentCall.answer({
							joinAsViewer: viewerMode,
						});
						Analytics.getInstance().onJoinVideoconf({
							callId: this.currentCall?.uuid,
							withVideo: videoEnabled,
							mediaParams: {
								video: Call.Hardware.isCameraOn,
								audio: !Call.Hardware.isMicrophoneMuted,
							},
							status: Analytics.AnalyticsStatus.success,
							isVpnActive: this.#isVpnConnected(),
						});
					}

					this.checkVpnStatus();

					this.onUpdateLastUsedCameraId();
				});
			})
			.catch(async (error) => {
				Logger.error('creating call error', error);
				let errorCode = Call.Util.getCallConnectionErrorCode(error);
				const errorMessage = Call.Util.getCallConnectionErrorMessage(error);

				if (errorCode === 'UNKNOWN_ERROR' && error?.message)
				{
					errorCode = getUnknownErrorType(error?.message);
				}

				await accidentLogger.addLog(error, errorCode);

				Analytics.getInstance().onStartCallError({
					callType: Analytics.AnalyticsType.videoconf,
					errorCode,
					errorMessage,
				});

				this.initCallPromise = null;
			});
	}

	/**
	 * @param {int} callUuid
	 * @param {object} options
	 */
	joinCall(callId, callUuid, options)
	{
		if (this.initCallPromise)
		{
			return;
		}

		const video = BX.prop.getBoolean(options, 'video', false);
		const joinAsViewer = BX.prop.getBoolean(options, 'joinAsViewer', false);
		Call.Hardware.isCameraOn = Boolean(video);

		if (Utils.device.isMobile())
		{
			this.viewPort.show();
		}
		else
		{
			this.viewPort.setLayout(ViewLayout.Grid);
		}

		if (joinAsViewer)
		{
			this.viewPort.setLocalUserDirection(Call.EndpointDirection.RecvOnly);
		}
		else
		{
			this.viewPort.setLocalUserDirection(Call.EndpointDirection.SendRecv);
		}

		this.viewPort.setUiState(ViewUiState.Calling);

		const isLegacyCall =			Boolean(callId)
			|| this.callScheme === Call.CallScheme.classic
			|| (!this.callScheme && !CallSettingsManager.jwtCallsEnabled);

		this.initCallPromise = Promise.resolve(this.callToken);
		if (!isLegacyCall && !this.callToken)
		{
			this.initCallPromise = CallTokenManager.getToken(this.params.chatId);
		}

		this.initCallPromise
			.then((callToken) => {
				if (isLegacyCall)
				{
					return Call.EngineLegacy.getCallWithId(callId, this.getCallConfig(video, true));
				}

				this.callToken = callToken;
				CallTokenManager.setToken(this.params.chatId, this.callToken);

				return Call.Engine.getCallWithId(callUuid, this.getCallConfig(video, true, callUuid));
			})
			.then((result) => {
				this.currentCall = result.call;
				this.releasePreCall();
				this.bindCallEvents();

				if (this.promotedToAdminTimeout)
				{
					clearTimeout(this.promotedToAdminTimeout);
				}

				if (this.currentCall?.scheme === Call.CallScheme.classic || !CallSettingsManager.jwtCallsEnabled)
				{
					this.onUpdateCallCopilotState({
						isTrackRecordOn: this.currentCall.isCopilotActive,
					});
				}

				this.controller.getStore().commit('conference/startCall');

				this.#writePiniaCallStarted();

				if (this.currentCall?.scheme === Call.CallScheme.jwt)
				{
					const userData = this.controller.getStore().getters['users/get'](this.controller.getUserId(), true);
					this.viewPort.appendUsers([userData.id]);
					this.viewPort.updateUserData({ [userData.id]: userData });
				}
				else
				{
					this.viewPort.appendUsers(this.currentCall.getUsers());
					Util.getUsers(this.currentCall.id, this.getCallUsers(true)).then((userData) => {
						this.controller.getStore().dispatch('users/set', Object.values(userData));
						this.controller.getStore().dispatch('conference/setUsers', { users: Object.keys(userData) });

						if (this.callStore)
						{
							try
							{
								this.callStore.addConferenceUsers(Object.keys(userData).map(Number));
							}
							catch (error)
							{
								console.error('[call.store] Pinia write failed in setUsers:', error);
							}
						}

						this.viewPort.updateUserData(userData);
					});
				}

				if (!joinAsViewer)
				{
					if (Call.Hardware.defaultMicrophone)
					{
						this.currentCall.setMicrophoneId(Call.Hardware.defaultMicrophone);
					}

					if (Call.Hardware.defaultCamera)
					{
						this.currentCall.setCameraId(Call.Hardware.defaultCamera);
					}

					this.checkAvailableMicrophone();
					this.checkAvailableCamera();

					this.updateCallUser(this.currentCall.userId, { microphoneState: !Call.Hardware.isMicrophoneMuted });
				}

				this.currentCall.answer({
					joinAsViewer,
				});

				Analytics.getInstance().onJoinVideoconf({
					callId: this.currentCall?.uuid,
					withVideo: Call.Hardware.isCameraOn,
					mediaParams: {
						video: Call.Hardware.isCameraOn,
						audio: !Call.Hardware.isMicrophoneMuted,
					},
					status: Analytics.AnalyticsStatus.success,
					isVpnActive: this.#isVpnConnected(),
				});

				this.checkVpnStatus();

				this.onUpdateLastUsedCameraId();
			})
			.catch(async (error) => {
				let errorCode = Call.Util.getCallConnectionErrorCode(error);
				const errorMessage = Call.Util.getCallConnectionErrorMessage(error);

				if (errorCode === 'UNKNOWN_ERROR' && error?.message)
				{
					errorCode = getUnknownErrorType(error?.message);
				}

				await accidentLogger.addLog(error, errorCode);

				Analytics.getInstance().onJoinCallError({
					callType: Analytics.AnalyticsType.videoconf,
					errorCode,
					callId: callUuid,
					errorMessage,
					isVpnActive: this.#isVpnConnected(),
				});

				this.initCallPromise = null;
			});
	}

	endCall(finishCall = false)
	{
		if (this.#isLocalRecordStarted())
		{
			Analytics.getInstance().onRecordStop({
				callId: this.currentCall.uuid,
				callType: Analytics.AnalyticsType.videoconf,
				subSection: finishCall
					? Analytics.AnalyticsSubSection.contextMenu
					: Analytics.AnalyticsSubSection.window,
				element: finishCall
					? Analytics.AnalyticsElement.finishForAllButton
					: Analytics.AnalyticsElement.disconnectButton,
				recordTime: Util.getRecordTimeText(this.commonRecord.info),
			});
		}

		this.#stopCommonRecord();

		this.setConferenceHasErrorInCall(false);
		this.showFeedback = Boolean(this.currentCall?.wasConnected);
		if (this.currentCall)
		{
			this.callDetails = {
				id: this.currentCall.uuid,
				provider: this.currentCall.provider,
				userCount: this.currentCall.users.length,
				browser: Util.getBrowserForStatistics(),
				isMobile: BX.browser.IsMobile(),
				isConference: true,
			};

			this.removeCallEvents();
			this.removeAdditionalEvents();

			if (this.currentCall.isScreenSharingStarted())
			{
				this.currentCall.stopScreenSharing();
			}

			this.currentCall.hangup(false, '', finishCall);
		}

		if (Utils.platform.isBitrixDesktop())
		{
			this.floatingWindowService?.destroy();
			this.floatingWindowService = null;

			window.close();
			// if the conference was opened incorrectly, then "window.close();" may not work in some cases
			// as a workaround, we can redirect the user back to the portal's front page.
			location.href = '/';
		}
		else
		{
			this.viewPort.releaseLocalMedia();
			this.viewPort.close();
			this.notificationService?.closeReconnectingBalloon();
			this.#destroyUiServices();
			this.setError(ConferenceErrorCode.userLeftCall);
			this.controller.getStore().commit('conference/endCall');

			if (this.callStore)
			{
				try
				{
					this.callStore.endConferenceCall();
					this.callStore.resetCall();
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in onCallEnd:', error);
				}
			}
		}

		this.notificationService?.closeRiseYouHandToTalkPopup();
		this.layoutService?.closeWebScreenSharePopup();

		EventEmitter.unsubscribe(EventType.textarea.focus, this.onInputFocusHandler);
		EventEmitter.unsubscribe(EventType.textarea.blur, this.onInputBlurHandler);
		EventEmitter.unsubscribe(EventType.conference.userRenameFocus, this.onInputFocusHandler);
		EventEmitter.unsubscribe(EventType.conference.userRenameBlur, this.onInputBlurHandler);
	}

	restart() {
		if (this.currentCall)
		{
			this.removeCallEvents();
			this.currentCall = null;
		}

		if (this.promotedToAdminTimeout)
		{
			clearTimeout(this.promotedToAdminTimeout);
		}

		if (this.viewPort)
		{
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

		if (this.callStore)
		{
			try
			{
				this.callStore.returnToPreparation();
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in returnToPreparation:', error);
			}
		}
	}

	#destroyUiServices()
	{
		const services = [
			'buttonStateService',
			'layoutService',
			'notificationService',
			'promoService',
			'hangupOptionsUiService',
			'feedbackUiService',
			'pipService',
			'recordingUiService',
			'copilotUiService',
			'floatingWindowService',
		];

		for (const name of services)
		{
			this[name]?.destroy();
			this[name] = null;
		}
	}

	kickFromCall()
	{
		this.setError(ConferenceErrorCode.kickedFromCall);
		this.pullClient.disconnect();
		this.endCall();
	}

	getCallUsers(includeSelf) {
		if (!this.currentCall)
		{
			return [];
		}

		const result = Object.keys(this.currentCall.getUsers());
		if (includeSelf)
		{
			result.push(this.currentCall.userId);
		}

		return result;
	}

	getActiveCallUsers()
	{
		const userStates = this.currentCall.getUsers();
		const activeUsers = [];

		for (const userId in userStates)
		{
			if (userStates.hasOwnProperty(userId) && (
				userStates[userId] === Call.UserState.Connected
					|| userStates[userId] === Call.UserState.Connecting
					|| userStates[userId] === Call.UserState.Calling
			))
			{
				activeUsers.push(userId);
			}
		}

		return activeUsers;
	}

	setLocalVideoStream(stream)
	{
		this.localVideoStream = stream;
	}

	updateMediaDevices()
	{
		Call.Hardware.getCurrentDeviceList();
	}

	stopLocalVideoStream()
	{
		if (this.localVideoStream)
		{
			this.localVideoStream.getTracks().forEach((tr) => tr.stop());
		}
		this.localVideoStream = null;
	}

	setSelectedCamera(cameraId)
	{
		if (this.viewPort)
		{
			this.viewPort.setCameraId(cameraId);
		}
	}

	setSelectedMic(micId)
	{
		if (this.viewPort)
		{
			this.viewPort.setMicrophoneId(micId);
		}
	}

	getFeature(id)
	{
		if (typeof this.featureConfig[id] === 'undefined')
		{
			return {
				id,
				state: ConferenceApplication.FeatureState.Enabled,
				articleCode: '',
			};
		}

		return this.featureConfig[id];
	}

	getFeatureState(id)
	{
		return this.getFeature(id).state;
	}

	#canLocalRecord()
	{
		const isDesktop = Utils.platform.isBitrixDesktop();
		const isValidApi = Utils.platform.getDesktopVersion() >= 54;

		// It's a desktop with the right API version.
		if (!isDesktop || !isValidApi)
		{
			return false;
		}

		// If cloud recording is disabled, can record local
		if (!Call.CallCloudRecord.serviceEnabled)
		{
			return true;
		}

		// If the cloud recording tariff is not available, can record local
		if (!Call.CallCloudRecord.tariffAvailable)
		{
			return true;
		}

		// If the cloud recording is active, and it is a paid plan, then we turn it on only in plain
		return this.currentCall.provider === Call.Provider.Plain;
	}

	#canCloudRecord()
	{
		return Call.CallCloudRecord.serviceEnabled && Call.CallCloudRecord.tariffAvailable;
	}

	#canCommonRecord()
	{
		return this.#canLocalRecord() || this.#canCloudRecord();
	}

	#isLocalRecordStarted()
	{
		return (
			this.#canLocalRecord()
			&& this.commonRecord.state != Call.CallCommonRecordState.Stopped
			&& this.commonRecord.state != Call.CallCommonRecordState.Destroyed
		);
	}

	#isCommonRecordStarted()
	{
		return (
			this.#canCommonRecord()
			&& this.commonRecord.state != Call.CallCommonRecordState.Stopped
			&& this.commonRecord.state != Call.CallCommonRecordState.Destroyed
		);
	}

	showFeatureLimitSlider(id)
	{
		const articleCode = this.getFeature(id).articleCode;
		if (!articleCode || !window.BX.UI.InfoHelper)
		{
			console.warn('Limit article not found', id);

			return false;
		}

		window.BX.UI.InfoHelper.show(articleCode);

		return true;
	}

	#isVpnConnected()
	{
		if (
			DesktopApi.isDesktop()
			&& typeof BXDesktopSystem?.IsVpnConnected === 'function'
			&& BXDesktopSystem.IsVpnConnected()
		)
		{
			return true;
		}

		return false;
	}

	checkVpnStatus()
	{
		if (this.#isVpnConnected())
		{
			this.notificationService?.showVpnIsActiveNotification();
		}
	}

	isViewerMode()
	{
		let viewerMode = false;
		const isBroadcast = this.isBroadcast();
		if (isBroadcast)
		{
			const presenters = this.getBroadcastPresenters();
			const currentUserId = this.controller.getStore().state.application.common.userId;
			const isCurrentUserPresenter = presenters.includes(currentUserId);
			viewerMode = isBroadcast && !isCurrentUserPresenter;
		}

		return viewerMode;
	}

	onCallCreated(e)
	{
		Logger.warn('we got event onCallCreated', e);
		if (this.preCall || this.currentCall)
		{
			return;
		}
		const call = e.call;
		if (call.associatedEntity.type === 'chat' && call.associatedEntity.id === this.params.dialogId)
		{
			this.preCall = e.call;
			this.updatePreCallCounter();
			this.preCall.addEventListener(Call.Event.onUserStateChanged, this.onPreCallUserStateChangedHandler);
			this.preCall.addEventListener(Call.Event.onDestroy, this.onPreCallDestroyHandler);

			if (this.waitingForCallStatus)
			{
				this.callEventReceived = true;
			}
			this.setConferenceStatus(true);
			this.setConferenceStartDate(e.call.startDate);
		}

		const userReadyToJoin = this.getConference().common.userReadyToJoin;
		if (userReadyToJoin)
		{
			const viewerMode = this.isViewerMode();

			const videoEnabled = this.getConference().common.joinWithVideo;
			Logger.warn('ready to join call after waiting', videoEnabled, viewerMode);
			setTimeout(() => {
				Call.Hardware.init().then(() => {
					if (viewerMode && this.preCall)
					{
						this.joinCall(this.preCall.id, this.preCall.uuid, {
							joinAsViewer: true,
						});
					}
					else
					{
						this.joinCall(this.preCall.id, this.preCall.uuid, {
							video: videoEnabled,
						});
					}
				});
			}, 1000);
		}
	}

	releasePreCall()
	{
		if (this.preCall)
		{
			this.preCall.removeEventListener(Call.Event.onUserStateChanged, this.onPreCallUserStateChangedHandler);
			this.preCall.removeEventListener(Call.Event.onDestroy, this.onPreCallDestroyHandler);
			this.preCall = null;
		}
	}

	onPreCallDestroy(e)
	{
		if (this.waitingForCallStatusTimeout)
		{
			clearTimeout(this.waitingForCallStatusTimeout);
		}
		this.setConferenceStatus(false);

		this.releasePreCall();
	}

	updatePreCallCounter()
	{
		if (this.preCall)
		{
			const count = this.preCall.getParticipatingUsers().length;
			this.controller.getStore().commit('conference/common', {
				userInCallCount: count,
			});

			if (this.callStore)
			{
				try
				{
					this.callStore.setConferenceCommon({ userInCallCount: count });
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in updatePreCallCounter:', error);
				}
			}
		}
		else
		{
			this.controller.getStore().commit('conference/common', {
				userInCallCount: 0,
			});

			if (this.callStore)
			{
				try
				{
					this.callStore.setConferenceCommon({ userInCallCount: 0 });
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in updatePreCallCounter:', error);
				}
			}
		}
	}

	createVideoStrategy()
	{
		if (this.videoStrategy)
		{
			this.videoStrategy.destroy();
		}

		const strategyType = Utils.device.isMobile() ? VideoStrategy.Type.OnlySpeaker : VideoStrategy.Type.AllowAll;

		this.videoStrategy = new VideoStrategy({
			call: this.currentCall,
			callView: this.viewPort,
			strategyType,
		});
	}

	removeVideoStrategy()
	{
		if (this.videoStrategy)
		{
			this.videoStrategy.destroy();
		}
		this.videoStrategy = null;
	}

	_onCallViewTurnOffParticipantStream(e, typeOfStream)
	{
		this.currentCall.turnOffParticipantStream({
			typeOfStream,
			userId: e.userId,
			fromUserId: this.callEngine.getCurrentUserId(),
		});

		Analytics.getInstance().onTurnOffParticipantStream({
			callId: this._getCallIdentifier(this.currentCall),
			callType: this.getCallType(),
			typeOfSetting: typeOfStream,
		});
	}

	_onCallViewChangeSpeakPermission(e, allow)
	{
		this.currentCall.allowSpeakPermission({ allow, userId: e.userId });

		if (allow)
		{
			Analytics.getInstance().onAllowPermissionToSpeakResponse({
				callId: this._getCallIdentifier(this.currentCall),
				callType: this.getCallType(),
			});
		}
		else
		{
			Analytics.getInstance().onDisallowPermissionToSpeakResponse({
				callId: this._getCallIdentifier(this.currentCall),
				callType: this.getCallType(),
			});
		}
	}

	async renameGuest(newName)
	{
		if (this.viewPort.localUser)
		{
			this.viewPort.localUser.userModel.renameRequested = true;
		}
		else if (this.callStore)
		{
			this.callStore.setRenameRequested(true);
		}

		try
		{
			const response = await this.setUserName(newName);
			const result = response?.answer?.result;
			if (Type.isString(result?.userToken) && result.userToken.length > 0)
			{
				CallTokenManager.setUserToken(result.userToken);
			}
			this.currentCall?.updateUserData({ name: newName });

			if (this.viewPort.localUser)
			{
				this.viewPort.localUser.userModel.wasRenamed = true;
			}
			else if (this.callStore)
			{
				this.callStore.setWasRenamed(true);
			}
			Logger.log('setting name to', newName);
		}
		catch (error)
		{
			Logger.error('error setting name', error);
		}
	}

	renameGuestMobile(newName)
	{
		this.setUserName(newName)
			.then(() => {
				Logger.log('setting mobile name to', newName);
				if (this.viewPort.renameSlider)
				{
					this.viewPort.renameSlider.close();
				}
			})
			.catch((error) => {
				Logger.error('error setting name', error);
			});
	}

	onCallButtonClick(event)
	{
		const buttonName = event.data.buttonName;
		Logger.warn('Button clicked!', buttonName);

		const handlers = {
			hangup: () => {
				Analytics.getInstance().onDisconnectCall({
					callId: this.currentCall?.uuid,
					callType: Analytics.AnalyticsType.videoconf,
					subSection: Analytics.AnalyticsSubSection.finishButton,
					mediaParams: { video: Call.Hardware.isCameraOn, audio: !Call.Hardware.isMicrophoneMuted },
				});
				this.stopLocalVideoStream();
				this.endCall();
			},
			hangupOptions: () => this.hangupOptionsUiService.show(this.viewPort.getButtonElement('hangupOptions'), {
				callId: this.currentCall?.uuid,
				callType: Analytics.AnalyticsType.videoconf,
				chatId: this.currentCall?.associatedEntity.id,
				callUsersCount: this.getCallUsers(true).length,
				callLength: Util.getTimeInSeconds(this.currentCall?.startDate),
			}),
			close: () => {
				this.stopLocalVideoStream();
				this.endCall();
			},
			toggleMute: this.onCallViewToggleMuteButtonClick.bind(this),
			toggleScreenSharing: this.onCallViewToggleScreenSharingButtonClick.bind(this),
			record: () => {
				Analytics.getInstance().onRecordBtnClick({
					callId: this.currentCall?.uuid,
					callType: Analytics.AnalyticsType.videoconf,
				});

				const isPlain = this.currentCall?.provider === Call.Provider.Plain;
				const isBitrix = this.currentCall?.provider === Call.Provider.Bitrix;
				this.recordingUiService?.onRecordButtonClick({
					commonRecordState: this.commonRecord,
					cloudRecordEnabled: (isPlain && this.currentCall?.isCloudRecordFeaturesEnabled) || isBitrix,
					isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
					callId: this.currentCall?.id,
					isServiceEnabled: Call.CallCloudRecord.serviceEnabled,
				});
			},
			toggleVideo: (event) => {
				Analytics.getInstance().onToggleCamera({
					video: event.data.video,
					callId: this.currentCall ? this.currentCall.uuid : 0,
					callType: Analytics.AnalyticsType.videoconf,
				});
				this.#onCallViewToggleVideoButtonClickHandler(event.data);
			},
			toggleSpeaker: (event) => {
				this.viewPort.muteSpeaker(!event.data.speakerMuted);
				if (event.data.fromHotKey)
				{
					this.notificationService?.showSpeakerToggleNotification(this.viewPort.speakerMuted);
				}
			},
			showChat: () => {
				Analytics.getInstance().onShowChat({
					callId: this.currentCall?.uuid,
					callType: Analytics.AnalyticsType.videoconf,
				});
				this.toggleChat();
			},
			toggleUsers: () => this.toggleUserList(),
			share: () => {
				const w =					Utils.device.isMobile() && document.body.clientWidth < 400 ? document.body.clientWidth - 40 : 400;
				this.notificationService?.showLinkCopiedNotification(
					Loc.getMessage('BX_IM_VIDEOCONF_LINK_COPY_DONE'),
					w,
				);
				Clipboard.copy(this.getDialogData().public.link);
			},
			fullscreen: () => this.toggleFullScreen(),
			floorRequest: this.onCallViewFloorRequestButtonClick.bind(this),
			feedback: () => this.feedbackUiService?.onButtonClick({
				callId: this.currentCall?.uuid,
				instanceId: this.currentCall?.instanceId,
				provider: this.currentCall?.provider,
				userCount: (this.currentCall?.users.length ?? 0) + 1,
				userId: this.params?.userId,
			}),
			callcontrol: this._onCallcontrolButtonClick.bind(this),
			onUserClick: (e) => Analytics.getInstance().onClickUser({
				callId: this.currentCall.uuid,
				callType: Analytics.AnalyticsType.videoconf,
				layout: Object.keys(ViewLayout).find((key) => ViewLayout[key] === e.layout),
			}),
			copilot: () => this.copilotUiService?.onButtonClick({
				isCopilotActive: this.currentCall?.isCopilotActive ?? false,
				isCopilotFeaturesEnabled: this.currentCall?.isCopilotFeaturesEnabled ?? false,
				callId: this.currentCall?.id,
			}),
		};

		if (handlers[buttonName])
		{
			handlers[buttonName](event);
		}
		else
		{
			Logger.error('Button handler not found!', buttonName);
		}
	}

	onCallViewToggleMuteButtonClick(event)
	{
		Analytics.getInstance().onToggleMicrophone({
			muted: event.data.muted,
			callId: this.currentCall ? this.currentCall.uuid : 0,
			callType: Analytics.AnalyticsType.videoconf,
		});

		this.#onCallViewToggleMuteHandler(event.data);
	}

	#onCallViewToggleMuteHandler(e)
	{
		if (!e.muted && !Hardware?.hasMicrophone())
		{
			return;
		}

		const currentRoom = this.currentCall && this.currentCall.currentRoom && this.currentCall.currentRoom();
		if (currentRoom && currentRoom.speaker != this.userId && !e.muted)
		{
			this.currentCall.requestRoomSpeaker();

			return;
		}

		if (this.currentCall && !this.currentCall.microphoneId && !e.muted)
		{
			this.currentCall.setMicrophoneId(Hardware.defaultMicrophone);
		}

		Hardware.setIsMicrophoneMuted({
			isMicrophoneMuted: e.muted,
			calledProgrammatically: Boolean(e.calledProgrammatically),
		});

		this.notificationService?.closeMutePopup();

		if (!e.muted)
		{
			if (Util.havePermissionToBroadcast('mic'))
			{
				if (this.notificationService)
				{
					this.notificationService.allowMutePopup = true;
				}
			}
			else
			{
				this.notificationService?.showRiseYouHandToTalkNotification({
					initiatorName: this.lastCalledChangeSettingsUserName,
					bindElement: this.viewPort?.buttons?.microphone?.elements?.icon ?? null,
				});
			}
		}

		if (this.#isCommonRecordStarted() && this.#canLocalRecord())
		{
			BXDesktopSystem.CallRecordMute(e.muted);
		}

		if (this.currentCall?.userId)
		{
			this.updateCallUser(this.currentCall.userId, { microphoneState: !e.muted });
		}

		if (!this.currentCall)
		{
			this.template.$emit('setMicState', !e.muted);
		}
	}

	onCallViewToggleScreenSharingButtonClick()
	{
		Analytics.getInstance().onScreenShareBtnClick({
			callId: this.currentCall.uuid,
			callType: Analytics.AnalyticsType.videoconf,
		});

		if (this.getFeatureState('screenSharing') === ConferenceApplication.FeatureState.Limited)
		{
			this.showFeatureLimitSlider('screenSharing');

			return;
		}

		if (this.getFeatureState('screenSharing') === ConferenceApplication.FeatureState.Disabled)
		{
			return;
		}

		if (this.currentCall.isScreenSharingStarted())
		{
			this.currentCall.stopScreenSharing();

			if (this.#isCommonRecordStarted() && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordStopSharing();
			}

			this.floatingWindowService?.hideScreenShareWindow();
			this.layoutService?.closeWebScreenSharePopup();
		}
		else
		{
			BX.ajax.runAction('call.Call.onShareScreen', { data: { callUuid: this.currentCall.uuid } });
			this.currentCall.startScreenSharing();
			this.togglePictureInPictureCallWindow({ isForceOpen: true });
		}
	}

	togglePictureInPictureCallWindow(config = {})
	{
		this.pipService?.toggle({
			...config,
			hasActiveCall: Boolean(this.currentCall),
			isFolded: this.layoutService.isFolded,
			isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
			enableAutoPip: this.viewPort?.enableAutoPip,
		});
	}

	#startCommonRecord(type)
	{
		const isPlainCall = this.currentCall.provider === Call.Provider.Plain;

		this.commonRecord.type = type;

		if (Call.CallCloudRecord.serviceEnabled && !isPlainCall)
		{
			const kind = type === 'audio' ? Call.CloudRecordKind.AUDIO : Call.CloudRecordKind.VIDEO;
			this.buttonStateService?.blockRecordButton();
			this.currentCall.setCloudRecordState(Call.CloudRecordStatus.STARTED, kind);

			return;
		}

		this.buttonStateService?.activateRecordButton(true);

		this.currentCall.sendLocalRecordState({
			action: Call.CallCommonRecordState.Started,
			type: this.commonRecord.type,
			date: new Date(),
		});

		this.commonRecord.state = Call.CallCommonRecordState.Started;
	}

	#stopCommonRecord()
	{
		const initiatorId = this.commonRecord.initiatorId;
		const state = this.commonRecord.state;

		this.commonRecord = this.#getDefaultCommonRecord();

		if (this.#canLocalRecord())
		{
			BXDesktopSystem.CallRecordStop();
		}

		if (this.viewPort)
		{
			this.viewPort.setCommonRecordState(this.viewPort.getDefaultCommonRecordState());
			this.buttonStateService?.activateRecordButton(false);
		}

		if (
			state !== Call.CallCommonRecordState.Stopped
			&& this.currentCall
			&& this.currentCall.isAnyoneParticipating()
			&& initiatorId === this.currentCall.userId
		)
		{
			this.currentCall.sendLocalRecordState({
				action: Call.CallCommonRecordState.Stopped,
				userId: this.currentCall.userId,
			});
		}
	}

	/**
	 * @param { Object } event
	 * @param { string } event.data.state
	 * @param { string } event.data.kind
	 * @param { boolean } event.data.hotkey
	 */
	#onCallViewToggleVideoButtonClickHandler(e)
	{
		if (!Hardware.initialized)
		{
			return;
		}

		if (e.video && Object.values(Hardware.cameraList).length === 0)
		{
			return;
		}

		Hardware.setIsCameraOn({ isCameraOn: e.video, calledProgrammatically: Boolean(e.calledProgrammatically) });

		if (this.currentCall && !e.video && !this.currentCall.isScreenSharingStarted())
		{
			this.viewPort.releaseLocalMedia();
		}

		if (this.currentCall && !this.currentCall.cameraId && e.video)
		{
			this.currentCall.setCameraId(Hardware.defaultCamera);
		}

		if (!this.currentCall)
		{
			this.template.$emit('setCameraState', e.video);
		}
	}

	clearPictureInPictureDebounceForOpen()
	{
		this.pipService?.clearDebounceForOpen();
	}

	onInputFileOpenedStateUpdate(isActive)
	{
		this.pipService?.onInputFileOpenedStateUpdate(isActive, {
			hasActiveCall: Boolean(this.currentCall),
			isFolded: this.layoutService.isFolded,
			isScreenSharing: this.currentCall?.isScreenSharingStarted() ?? false,
			enableAutoPip: this.viewPort?.enableAutoPip,
		});
	}

	onDocumentBodyClick(event)
	{
		const { target } = event;

		if (target.matches('input[type="file"]'))
		{
			this.onInputFileOpenedStateUpdate(true);
		}
	}

	onWindowFocus()
	{
		if (DesktopApi.isDesktop())
		{
			this.floatingWindowService?.hideScreenShareWindow();
		}

		if (DesktopApi.isDesktop() && this.pipService?.isFileChooserActive)
		{
			this.onInputFileOpenedStateUpdate(false);
		}

		this.layoutService?.updateWindowFocusState(true);
	}

	onWindowBlur()
	{
		if (DesktopApi.isDesktop() && this.currentCall && this.currentCall.isScreenSharingStarted())
		{
			this.floatingWindowService?.showScreenShareWindow(null);
		}

		this.layoutService?.updateWindowFocusState(false);
	}

	fold(foldedCallTitle)
	{
		if (this.layoutService.isFolded)
		{
			return;
		}

		this.layoutService.fold(foldedCallTitle ?? this.params.name ?? '');
		BX.onCustomEvent(this, 'ConferenceApplication::onFold', {});
	}

	unfold(options = {})
	{
		this.layoutService.unfold(options);
		BX.onCustomEvent(this, 'ConferenceApplication::onUnfold', {});
	}

	showChat()
	{
		this.layoutService.showChat();
	}

	isFullScreen()
	{
		return this.layoutService.isFullScreen();
	}

	toggleFullScreen()
	{
		this.layoutService.toggleFullScreen();
	}

	enterFullScreen()
	{
		this.layoutService.enterFullScreen();
	}

	exitFullScreen()
	{
		this.layoutService.exitFullScreen();
	}

	_onCallcontrolButtonClick(e)
	{
		if (!Util.canControlChangeSettings())
		{
			return;
		}

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.close();

			return;
		}

		this.participantsPermissionPopup = new ParticipantsPermissionPopup({
			targetContainer: this.viewPort.container,
			turnOffAllParticipansStream: (options) => {
				if (this.currentCall)
				{
					this.currentCall.turnOffAllParticipansStream(options);
				}

				Analytics.getInstance().onTurnOffAllParticipansStream({
					callId: this._getCallIdentifier(this.currentCall),
					callType: this.getCallType(),
					typeOfStream: options.data?.typeOfStream,
				});
			},
			onPermissionChanged: (options) => {
				this.currentCall.changeSettings(options);

				if (!options.settingEnabled)
				{
					// send only when it turned off
					Analytics.getInstance().onCallSettingsChanged({
						callId: this._getCallIdentifier(this.currentCall),
						callType: this.getCallType(),
						typeOfSetting: options.typeOfSetting,
						settingEnabled: options.settingEnabled,
					});
				}
			},
			onClose: () => {
				this.participantsPermissionPopup = null;
				this.notificationService?.setCallControlPanelOpen(false);
			},
			onOpen: () => {
				this.notificationService?.setCallControlPanelOpen(true);

				Analytics.getInstance().onOpenCallSettings({
					callId: this._getCallIdentifier(this.currentCall),
					callType: this.getCallType(),
				});
			},
		});

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.toggle();
		}
	}

	onUpdateCallCopilotState({ isTrackRecordOn })
	{
		const updateCopilotActive = this.currentCall.scheme
			? this.currentCall.scheme === Call.CallScheme.classic
			: !CallSettingsManager.jwtCallsEnabled;

		if (updateCopilotActive)
		{
			this.currentCall.isCopilotActive = isTrackRecordOn;
		}
		this.viewPort.updateCopilotState(this.currentCall.isCopilotActive);
	}

	onCallViewFloorRequestButtonClick()
	{
		Analytics.getInstance().onFloorRequest({
			callId: this.currentCall.uuid,
			callType: Analytics.AnalyticsType.videoconf,
		});

		const floorState = this.viewPort.getUserFloorRequestState(this.callEngine.getCurrentUserId());
		const talkingState = this.viewPort.getUserTalking(this.callEngine.getCurrentUserId());

		this.viewPort.setUserFloorRequestState(this.callEngine.getCurrentUserId(), !floorState);

		if (this.currentCall)
		{
			this.currentCall.requestFloor(!floorState);
		}

		clearTimeout(this.viewPortFloorRequestTimeout);
		if (talkingState && !floorState)
		{
			this.viewPortFloorRequestTimeout = setTimeout(() => {
				if (this.currentCall)
				{
					this.currentCall.requestFloor(false);
				}
			}, 1500);
		}

		if (!floorState)
		{
			this.notificationService?.closeRiseYouHandToTalkPopup();
		}
	}

	bindCallEvents()
	{
		this.currentCall.addEventListener(Call.Event.onUserInvited, this.onCallUserInvitedHandler);
		this.currentCall.addEventListener(Call.Event.onUserJoined, this.onCallUserJoinedHandler);
		this.currentCall.addEventListener(Call.Event.onDestroy, this.onCallDestroyHandler);
		this.currentCall.addEventListener(Call.Event.onUserStateChanged, this.onCallUserStateChangedHandler);
		this.currentCall.addEventListener(Call.Event.onUserMicrophoneState, this.onCallUserMicrophoneStateHandler);
		this.currentCall.addEventListener(Call.Event.onUserCameraState, this.onCallUserCameraStateHandler);
		this.currentCall.addEventListener(Call.Event.onNeedResetMediaDevicesState, this.onNeedResetMediaDevicesStateHandler);
		this.currentCall.addEventListener(Call.Event.onUserVideoPaused, this.onCallUserVideoPausedHandler);
		this.currentCall.addEventListener(Call.Event.onLocalMediaReceived, this.onCallLocalMediaReceivedHandler);
		this.currentCall.addEventListener(Call.Event.onLocalMediaStopped, this.onCallLocalMediaStoppedHandler);
		this.currentCall.addEventListener(Call.Event.onRemoteMediaReceived, this.onCallRemoteMediaReceivedHandler);
		this.currentCall.addEventListener(Call.Event.onRemoteMediaStopped, this.onCallRemoteMediaStoppedHandler);
		this.currentCall.addEventListener(Call.Event.onRemoteMediaAvailable, this.onCallRemoteMediaAvailableHandler);
		this.currentCall.addEventListener(Call.Event.onRemoteMediaUnavailable, this.onCallRemoteMediaUnavailableHandler);
		this.currentCall.addEventListener(Call.Event.onUserVoiceStarted, this.onCallUserVoiceStartedHandler);
		this.currentCall.addEventListener(Call.Event.onUserVoiceStopped, this.onCallUserVoiceStoppedHandler);
		this.currentCall.addEventListener(Call.Event.onUserStatsReceived, this.onUserStatsReceivedHandler);
		this.currentCall.addEventListener(Call.Event.onUserScreenState, this.onCallUserScreenStateHandler);
		this.currentCall.addEventListener(Call.Event.onUserCommonRecordState, this.onCallUserCommonRecordStateHandler);
		this.currentCall.addEventListener(Call.Event.onCloudRecordStatusChanged, this.onCloudRecordStatusChangedHandler);
		this.currentCall.addEventListener(Call.Event.onUserFloorRequest, this.onCallUserFloorRequestHandler);
		this.currentCall.addEventListener(Call.Event.onMicrophoneLevel, this.onMicrophoneLevelHandler);
		this.currentCall.addEventListener(Call.Event.onCallFailure, this.onCallFailureHandler);
		this.currentCall.addEventListener(Call.Event.onJoin, this._onCallJoinHandler);
		this.currentCall.addEventListener(Call.Event.onLeave, this.onCallLeaveHandler);
		this.currentCall.addEventListener(Call.Event.onReconnecting, this.onReconnectingHandler);
		this.currentCall.addEventListener(Call.Event.onReconnected, this.onReconnectedHandler);
		this.currentCall.addEventListener(Call.Event.onReconnectingFailed, this.onReconnectingFailedHandler);
		this.currentCall.addEventListener(Call.Event.onParticipantReconnecting, this._onParticipantReconnectingHandler);
		this.currentCall.addEventListener(Call.Event.onParticipantReconnected, this._onParticipantReconnectedHandler);
		this.currentCall.addEventListener(Call.Event.onUpdateLastUsedCameraId, this.onUpdateLastUsedCameraIdHandler);
		this.currentCall.addEventListener(Call.Event.onConnectionQualityChanged, this.onCallConnectionQualityChangedHandler);
		this.currentCall.addEventListener(Call.Event.onToggleRemoteParticipantVideo, this.onCallToggleRemoteParticipantVideoHandler);
		this.currentCall.addEventListener(Call.Event.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
		this.currentCall.addEventListener(Call.Event.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
		this.currentCall.addEventListener(Call.Event.onSwitchTrackRecordStatus, this._onSwitchTrackRecordStatusHandler);
		this.currentCall.addEventListener(Call.Event.onCameraPublishing, this.onCameraPublishingHandler);
		this.currentCall.addEventListener(Call.Event.onMicrophonePublishing, this.onMicrophonePublishingdHandler);
		this.currentCall.addEventListener(Call.Event.onTurnOnCamera, this._onTurnOnCameraHandler);
		this.currentCall.addEventListener(Call.Event.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
		this.currentCall.addEventListener(Call.Event.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
		this.currentCall.addEventListener(Call.Event.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareHandler);
		this.currentCall.addEventListener(Call.Event.onRoomSettingsChanged, this.onRoomSettingsChangedHandler);
		this.currentCall.addEventListener(Call.Event.onUserPermissionsChanged, this.onUserPermissionsChangedHandler);
		this.currentCall.addEventListener(Call.Event.onUserRoleChanged, this.onUserRoleChangedHandler);
		this.currentCall.addEventListener(Call.Event.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
		this.currentCall.addEventListener(Call.Event.onParticipantMuted, this.#onParticipantMuted);
	}

	removeCallEvents()
	{
		this.currentCall.removeEventListener(Call.Event.onUserInvited, this.onCallUserInvitedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserJoined, this.onCallUserJoinedHandler);
		this.currentCall.removeEventListener(Call.Event.onDestroy, this.onCallDestroyHandler);
		this.currentCall.removeEventListener(Call.Event.onUserStateChanged, this.onCallUserStateChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserMicrophoneState, this.onCallUserMicrophoneStateHandler);
		this.currentCall.removeEventListener(Call.Event.onUserCameraState, this.onCallUserCameraStateHandler);
		this.currentCall.removeEventListener(Call.Event.onNeedResetMediaDevicesState, this.onNeedResetMediaDevicesStateHandler);
		this.currentCall.removeEventListener(Call.Event.onUserVideoPaused, this.onCallUserVideoPausedHandler);
		this.currentCall.removeEventListener(Call.Event.onLocalMediaReceived, this.onCallLocalMediaReceivedHandler);
		this.currentCall.removeEventListener(Call.Event.onLocalMediaStopped, this.onCallLocalMediaStoppedHandler);
		this.currentCall.removeEventListener(Call.Event.onRemoteMediaReceived, this.onCallRemoteMediaReceivedHandler);
		this.currentCall.removeEventListener(Call.Event.onRemoteMediaStopped, this.onCallRemoteMediaStoppedHandler);
		this.currentCall.removeEventListener(Call.Event.onRemoteMediaAvailable, this.onCallRemoteMediaAvailableHandler);
		this.currentCall.removeEventListener(Call.Event.onRemoteMediaUnavailable, this.onCallRemoteMediaUnavailableHandler);
		this.currentCall.removeEventListener(Call.Event.onUserVoiceStarted, this.onCallUserVoiceStartedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserVoiceStopped, this.onCallUserVoiceStoppedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserStatsReceived, this.onUserStatsReceivedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserScreenState, this.onCallUserScreenStateHandler);
		this.currentCall.removeEventListener(Call.Event.onUserCommonRecordState, this.onCallUserCommonRecordStateHandler);
		this.currentCall.removeEventListener(Call.Event.onCloudRecordStatusChanged, this.onCloudRecordStatusChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserFloorRequest, this.onCallUserFloorRequestHandler);
		this.currentCall.removeEventListener(Call.Event.onMicrophoneLevel, this.onMicrophoneLevelHandler);
		this.currentCall.removeEventListener(Call.Event.onCallFailure, this.onCallFailureHandler);
		this.currentCall.removeEventListener(Call.Event.onJoin, this._onCallJoinHandler);
		this.currentCall.removeEventListener(Call.Event.onLeave, this.onCallLeaveHandler);
		this.currentCall.removeEventListener(Call.Event.onReconnecting, this.onReconnectingHandler);
		this.currentCall.removeEventListener(Call.Event.onReconnected, this.onReconnectedHandler);
		this.currentCall.removeEventListener(Call.Event.onReconnectingFailed, this.onReconnectingFailedHandler);
		this.currentCall.removeEventListener(Call.Event.onParticipantReconnecting, this._onParticipantReconnectingHandler);
		this.currentCall.removeEventListener(Call.Event.onParticipantReconnected, this._onParticipantReconnectedHandler);
		this.currentCall.removeEventListener(Call.Event.onUpdateLastUsedCameraId, this.onUpdateLastUsedCameraIdHandler);
		this.currentCall.removeEventListener(Call.Event.onConnectionQualityChanged, this.onCallConnectionQualityChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onToggleRemoteParticipantVideo, this.onCallToggleRemoteParticipantVideoHandler);
		this.currentCall.removeEventListener(Call.Event.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
		this.currentCall.removeEventListener(Call.Event.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
		this.currentCall.removeEventListener(Call.Event.onSwitchTrackRecordStatus, this._onSwitchTrackRecordStatusHandler);
		this.currentCall.removeEventListener(Call.Event.onCameraPublishing, this.onCameraPublishingHandler);
		this.currentCall.removeEventListener(Call.Event.onMicrophonePublishing, this.onMicrophonePublishingdHandler);
		this.currentCall.removeEventListener(Call.Event.onTurnOnCamera, this._onTurnOnCameraHandler);
		this.currentCall.removeEventListener(Call.Event.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
		this.currentCall.removeEventListener(Call.Event.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
		this.currentCall.removeEventListener(Call.Event.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareHandler);
		this.currentCall.removeEventListener(Call.Event.onRoomSettingsChanged, this.onRoomSettingsChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserPermissionsChanged, this.onUserPermissionsChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onUserRoleChanged, this.onUserRoleChangedHandler);
		this.currentCall.removeEventListener(Call.Event.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
		this.currentCall.removeEventListener(Call.Event.onParticipantMuted, this.#onParticipantMuted);
	}

	onCallUserInvited(e)
	{
		this.layoutService?.handleUserJoinEvent('onUserInvited', e, this.currentCall);
	}

	onCallUserJoined(e)
	{
		this.layoutService?.handleUserJoinEvent('onUserJoined', e, this.currentCall);
	}

	onCallUserStateChanged(e)
	{
		if (e.state !== Call.UserState.Connected && this.loopTimers[e.userId] === undefined)
		{
			this.loopConnectionQuality(e.userId, 1);
		}

		if (e.state === Call.UserState.Connected)
		{
			this.clearConnectionQualityTimer(e.userId);
			this.viewPort?.setUserConnectionQuality(e.userId, 5);

			if (this.callStore)
			{
				try
				{
					this.callStore.setUserConnectionQuality(e.userId, 5);
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in onCallUserStateChanged (quality):', error);
				}
			}
		}

		if (
			e.state === Call.UserState.Idle
			&& e.previousState === Call.UserState.Connected
			&& !this.#canCloudRecord()
			&& e.userId === this.commonRecord.initiatorId
		)
		{
			this.#stopCommonRecord();
		}

		this.viewPort?.setUserState(e.userId, e.state);
		this.updateCallUser(e.userId, { state: e.state });

		if (e.state === Call.UserState.Idle && e.previousState === Call.UserState.Connected)
		{
			this.layoutService?.handleUserEvent('onUserLeft', e);
		}

		if (!this.#isCommonRecordStarted())
		{
			this.buttonStateService?.unblockRecordButton();
		}
	}

	onCallUserMicrophoneState(e)
	{
		this.layoutService?.handleUserEvent('onUserMicrophoneState', e);
	}

	onCallUserCameraState(e)
	{
		this.layoutService?.handleUserEvent('onUserCameraState', e);
	}

	onNeedResetMediaDevicesState()
	{
		Call.Hardware.isMicrophoneMuted = true;
		Call.Hardware.isCameraOn = false;
		this.notificationService?.showMediaDevicesResetStateHint();
	}

	onCallUserVideoPaused(e)
	{
		this.layoutService?.handleUserEvent('onUserVideoPaused', e);
	}

	onCallLocalMediaStopped(e)
	{
		if (this.viewPort && e.kind === 'audio')
		{
			Call.Hardware.isMicrophoneMuted = true;
		}
	}

	onCallRemoteMediaReceived(e)
	{
		this.layoutService?.handleMediaEvent(e);
	}

	onCallRemoteMediaStopped(e)
	{
		this.layoutService?.handleMediaEvent({ ...e, stopped: true });
	}

	onCallUserVoiceStarted(e)
	{
		if (e.local)
		{
			if (this.currentCall.muted && this.notificationService?.allowMutePopup)
			{
				this.notificationService?.showMicMutedNotification(
					this.layoutService?.isFolded
						? null
						: this.viewPort?.buttons?.microphone?.elements?.icon,
				);
			}

			return;
		}

		this.layoutService?.handleUserEvent('onUserVoiceStarted', e);

		if (e.userId === this.viewPort?.localUser?.id)
		{
			this.viewPort?.setUserFloorRequestState(e.userId, false);
		}

		this.updateCallUser(e.userId, { talking: true, floorRequestState: false });
	}

	onCallUserVoiceStopped(e)
	{
		if (!e.local)
		{
			this.updateCallUser(e.userId, { talking: false });
		}

		this.layoutService?.handleUserEvent('onUserVoiceStopped', e);
	}

	onUserStatsReceived(e)
	{
		this.viewPort?.setUserStats(e.userId, e.report, e.mediaServerId);
	}

	onCallUserScreenState(e)
	{
		this.layoutService?.handleScreenStateEvent(e, this.currentCall);
		this.updateCallUser(e.userId, { screenState: e.screenState });
	}

	onCloudRecordStatusChanged(event)
	{
		this.recordingUiService?.trackCloudRecordStateChange({
			currentUserId: this.controller.getUserId(),
			eventUserId: event.userId,
			newState: event.commonRecordState.state,
			recordType: event.commonRecordState.type,
			previousState: this.commonRecord.state,
			commonRecordInfo: this.commonRecord.info,
			callId: this.currentCall.uuid,
			callType: Analytics.AnalyticsType.videoconf,
		});

		this.commonRecord.state = event.commonRecordState.state;
		this.commonRecord.initiatorId = event.initiatorId;

		if (Util.isCommonRecordStateInactive(event.commonRecordState.state))
		{
			this.commonRecord.info = null;
			this.commonRecord.initiatorId = null;
		}
		else
		{
			this.commonRecord.info = structuredClone(event.commonRecordState);
		}

		this.recordingUiService?.updateView(event.commonRecordState, {
			type: 'cloudRecord',
			userId: event.userId,
			currentUserId: this.controller.getUserId(),
			justJoined: event.justJoined,
			eventRecordState: event.commonRecordState,
		});
	}

	onCallUserFloorRequest(e)
	{
		this.layoutService?.handleUserEvent('onUserFloorRequest', e);
	}

	onMicrophoneLevel(e)
	{
		this.layoutService?.handleUserEvent('onMicrophoneLevel', e);
	}

	onCallConnectionQualityChanged(e)
	{
		this.layoutService?.handleUserEvent('onConnectionQualityChanged', e);
	}

	onCallToggleRemoteParticipantVideo(e)
	{
		this.notificationService?.handleRemoteParticipantVideoToggle(e.isVideoShown);
	}

	onGetUserMediaFailed(data)
	{
		this.notificationService?.showGetUserMediaFailedNotification(data);
	}

	onCameraPublishing(e)
	{
		if (e.publishing)
		{
			this.buttonStateService?.blockCameraButton();
		}
		else
		{
			this.buttonStateService?.unblockCameraButton();
		}

		this.viewPort?.updateButtons();
	}

	onMicrophonePublishingd(e)
	{
		if (e.publishing)
		{
			this.buttonStateService?.blockMicrophoneButton();
		}
		else
		{
			this.buttonStateService?.unblockMicrophoneButton();
		}

		this.viewPort?.updateButtons();
	}

	onTurnOnCamera()
	{
		this.#onCallViewToggleVideoButtonClickHandler({ video: true, calledProgrammatically: true });
	}

	onAllParticipantsAudioMuted(e)
	{
		this._onAllParticipantsMuted(e, 'audio');
	}

	onAllParticipantsVideoMuted(e)
	{
		this._onAllParticipantsMuted(e, 'video');
	}

	onAllParticipantsScreenshareMuted(e)
	{
		this._onAllParticipantsMuted(e, 'screenshare');
	}

	onRoomSettingsChanged(e)
	{
		const result = this.notificationService?.showRoomSettingsChangedNotification(e.data, this.userId);

		if (this.viewPort && !result?.isAllow)
		{
			this.viewPort.setAllUserPermissionToSpeakState(false);
		}

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.updateStatePermissions();
		}

		if (e.data?.eft === true && e.data?.act === 'audio' && !Util.havePermissionToBroadcast('mic'))
		{
			this.lastCalledChangeSettingsUserName = result?.initiatorName ?? '';
			this.notificationService?.showRiseYouHandToTalkNotification({
				initiatorName: this.lastCalledChangeSettingsUserName,
				bindElement: this.viewPort?.buttons?.microphone?.elements?.icon,
			});
		}

		this.viewPort?.updateButtons();
		this.#updateCamMicButtonsPermissions();
	}

	onUserPermissionsChanged(e)
	{
		if (!e.data?.allow)
		{
			const floorState = this.viewPort?.getUserFloorRequestState(this.callEngine?.getCurrentUserId());

			if (floorState)
			{
				this.onCallViewFloorRequestButtonClick();
			}
		}

		this.notificationService?.showPermissionsChangedNotification(e.data, this.userId);

		if (this.viewPort)
		{
			this.viewPort.setUserPermissionToSpeakState(e.data?.toUserId, e.data?.allow);
		}

		this.viewPort?.updateButtons();
		this.#updateCamMicButtonsPermissions();
	}

	onUserRoleChanged(e)
	{
		const content = this.notificationService?.getRoleChangedNotificationContent(e.data, this.userId);

		if (content)
		{
			this.notificationService?.showNotification(content);
		}

		if (this.viewPort)
		{
			this.viewPort.updateButtons();
			this.viewPort.updateFloorRequestNotification();
		}

		this.#updateCamMicButtonsPermissions();
	}

	#updateCamMicButtonsPermissions()
	{
		if (Util.havePermissionToBroadcast('cam'))
		{
			this.buttonStateService?.unblockCameraButton();
		}
		else
		{
			this.buttonStateService?.blockCameraButton();
		}

		if (Util.havePermissionToBroadcast('mic'))
		{
			this.buttonStateService?.unblockMicrophoneButton();
		}
		else
		{
			this.buttonStateService?.blockMicrophoneButton();
		}
	}

	onYouMuteAllParticipants(e)
	{
		this.notificationService?.showYouMuteAllNotification(e);
	}

	#onParticipantMuted = (e) => {
		const { data } = e;
		const { toUserId, track } = data || {};

		this.notificationService?.showParticipantMutedNotification(data, this.params.userId);

		const isMutedForMe = Number(toUserId) === this.params.userId && track?.muted === true;
		const isRegularUser = Util.isRegularUser(Util.getCurrentUserRole());
		if (!isMutedForMe || !isRegularUser)
		{
			return;
		}

		switch (track?.type)
		{
			case ParticipantTrackType.AUDIO:
				this.#onCallViewToggleMuteHandler({ muted: true, calledProgrammatically: true });
				break;
			case ParticipantTrackType.VIDEO:
				this.#onCallViewToggleVideoButtonClickHandler({ video: false, calledProgrammatically: true });
				break;
			case ParticipantTrackType.SCREENSHARE:
				if (this.currentCall?.isScreenSharingStarted())
				{
					this.onCallViewToggleScreenSharingButtonClick();
				}
				break;
			default:
				break;
		}
	};

	removeAdditionalEvents()
	{
		window.removeEventListener('focus', () => this.onWindowFocus());
		window.removeEventListener('blur', () => this.onWindowBlur());
		document.body.removeEventListener('click', (evt) => this.onDocumentBodyClick(evt));
	}

	onCallRemoteMediaAvailable(e)
	{
		this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
	}

	onCallRemoteMediaUnavailable(e)
	{
		this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
	}

	isLegacyCall(provider, scheme = null): boolean
	{
		if (scheme)
		{
			return scheme === Call.CallScheme.classic;
		}

		const isLegacyPlainCall = provider === Call.Provider.Plain && !CallSettingsManager.isJwtInPlainCallsEnabled();
		const isLegacyBitrixCall = provider === Call.Provider.Bitrix && !CallSettingsManager.jwtCallsEnabled;

		return isLegacyPlainCall || isLegacyBitrixCall;
	}

	_getCallIdentifier(call)
	{
		if (!call)
		{
			return null;
		}

		return this.isLegacyCall(call.provider, call.scheme) ? call.id : call.uuid;
	}

	getCallType()
	{
		return Analytics.AnalyticsType.videoconf;
	}

	loopConnectionQuality(userId, quality, timeout = 200)
	{
		if (this.viewPort)
		{
			this.loopTimers[userId] = setTimeout(() => {
				this.viewPort.setUserConnectionQuality(userId, quality);
				const newQuality = quality >= 4 ? 1 : quality + 1;
				this.loopConnectionQuality(userId, newQuality, timeout);
			}, timeout);
		}
	}

	clearConnectionQualityTimer(userId)
	{
		if (this.loopTimers[userId] !== undefined)
		{
			clearTimeout(this.loopTimers[userId]);
			delete this.loopTimers[userId];
		}
	}

	_onAllParticipantsMuted(e, type)
	{
		this.notificationService?.showAllParticipantsMutedNotification(e, type);

		if (!Util.isRegularUser(Util.getCurrentUserRole()))
		{
			return;
		}

		if (type === 'audio')
		{
			this.#onCallViewToggleMuteHandler({ muted: true, calledProgrammatically: true });
		}
		else if (type === 'video')
		{
			this.#onCallViewToggleVideoButtonClickHandler({ video: false, calledProgrammatically: true });
		}
		else if (type === 'screenshare' && this.currentCall.isScreenSharingStarted())
		{
			this.onCallViewToggleScreenSharingButtonClick();
		}
	}

	onCallJoin(e)
	{
		if (!e.local)
		{
			return;
		}

		if (!this.isViewerMode())
		{
			this.buttonStateService?.unblockFloorRequestAndScreenButtons();
			this.checkAvailableCamera();
			this.checkAvailableMicrophone();
		}

		if (this.viewPort.getConnectedUserCount(false))
		{
			this.buttonStateService?.unblockRecordButton();
		}

		this.viewPort.setUiState(ViewUiState.Connected);
	}

	onCallLeave(e)
	{
		if (!e.local)
		{
			return;
		}

		this.layoutService?.closeWebScreenSharePopup();
		this.#stopCommonRecord();

		this.commonRecord.state = Call.CallCommonRecordState.Stopped;
		this.commonRecord.type = Call.CallCommonRecordType.None;

		this.togglePictureInPictureCallWindow({ isForceClose: true });

		if (this.getActiveCallUsers().length === 0)
		{
			Analytics.getInstance().onFinishCall({
				callId: this.currentCall?.uuid,
				callType: Analytics.AnalyticsType.videoconf,
				status: Analytics.AnalyticsStatus.lastUserLeft,
				chatId: this.currentCall?.associatedEntity.id,
				callUsersCount: this.getCallUsers(true).length,
				callLength: Util.getTimeText(this.currentCall.startDate),
			});
		}

		this.endCall();
	}

	onCallDestroy(e)
	{
		this.currentCall = null;

		if (this.promotedToAdminTimeout)
		{
			clearTimeout(this.promotedToAdminTimeout);
		}

		this.floatingWindowService?.hideScreenShareWindow();
		this.layoutService?.closeWebScreenSharePopup();
		this.notificationService?.closeRiseYouHandToTalkPopup();

		this.#stopCommonRecord();

		this.restart();
	}

	onCheckDevicesSave(changedValues)
	{
		if (changedValues.camera)
		{
			Call.Hardware.defaultCamera = changedValues.camera;
		}

		if (changedValues.microphone)
		{
			Call.Hardware.defaultMicrophone = changedValues.microphone;
		}

		if (changedValues.audioOutput)
		{
			Call.Hardware.defaultSpeaker = changedValues.audioOutput;
		}

		if (changedValues.enableMicAutoParameters)
		{
			Call.Hardware.enableMicAutoParameters = changedValues.enableMicAutoParameters;
		}
	}

	setCameraState(state)
	{
		Call.Hardware.isCameraOn = state;
	}
	/* endregion 01. Call methods */

	/* region 02. Component methods */
	/* region 01. General actions */
	isChatShowed()
	{
		return this.getConference().common.showChat;
	}

	toggleChat()
	{
		const rightPanelMode = this.getConference().common.rightPanelMode;
		let chatActive = false;

		switch (rightPanelMode)
		{
			case RightPanelMode.hidden: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.chat });
				this.viewPort.setButtonActive('chat', true);
				chatActive = true;

				break;
			}

			case RightPanelMode.chat: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.hidden });
				this.viewPort.setButtonActive('chat', false);
				chatActive = false;

				break;
			}

			case RightPanelMode.users: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.split });
				this.viewPort.setButtonActive('chat', true);
				chatActive = true;

				break;
			}

			case RightPanelMode.split: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.users });
				this.viewPort.setButtonActive('chat', false);
				chatActive = false;

				break;
			}
		// No default
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setButtonState('chat', { active: chatActive });
				this.callStore.setConferenceRightPanelMode(this.getConference().common.rightPanelMode);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in changeRightPanelMode:', error);
			}
		}
	}

	toggleUserList()
	{
		const rightPanelMode = this.getConference().common.rightPanelMode;
		let usersActive = false;

		switch (rightPanelMode)
		{
			case RightPanelMode.hidden: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.users });
				this.viewPort.setButtonActive('users', true);
				usersActive = true;

				break;
			}

			case RightPanelMode.users: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.hidden });
				this.viewPort.setButtonActive('users', false);
				usersActive = false;

				break;
			}

			case RightPanelMode.chat: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.split });
				this.viewPort.setButtonActive('users', true);
				usersActive = true;

				break;
			}

			case RightPanelMode.split: {
				this.controller.getStore().dispatch('conference/changeRightPanelMode', { mode: RightPanelMode.chat });
				this.viewPort.setButtonActive('users', false);
				usersActive = false;

				break;
			}
		// No default
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setButtonState('users', { active: usersActive });
				this.callStore.setConferenceRightPanelMode(this.getConference().common.rightPanelMode);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in changeRightPanelMode:', error);
			}
		}
	}

	pinUser(user)
	{
		if (!this.viewPort)
		{
			return false;
		}
		this.viewPort.pinUser(user.id);
		this.viewPort.setLayout(ViewLayout.Centered);
	}

	unpinUser()
	{
		if (!this.viewPort)
		{
			return false;
		}
		this.viewPort.unpinUser();
	}

	changeBackground()
	{
		if (!Call.Hardware)
		{
			return false;
		}
		Call.BackgroundDialog.open();
	}

	openChat(user)
	{
		DesktopApi.emitToMainWindow('bxConferenceOpenChat', [user.id]);
	}

	openProfile(user)
	{
		DesktopApi.emitToMainWindow('bxConferenceOpenProfile', [user.id]);
	}

	setDialogInited()
	{
		this.dialogInited = true;
		const dialogData = this.getDialogData();
		document.title = dialogData.name;
	}

	changeVideoconfUrl(newUrl)
	{
		window.history.pushState('', '', newUrl);
	}

	sendNewMessageNotify(params)
	{
		const MAX_LENGTH = 40;
		const AUTO_HIDE_TIME = 4000;

		if (!this.checkIfMessageNotifyIsNeeded(params))
		{
			return false;
		}
		const text = Utils.text.purify(params.message.text, params.message.params, params.files);
		let avatar = '';
		let userName = '';

		// avatar and username only for non-system messages
		if (params.message.senderId > 0 && params.message.system !== 'Y')
		{
			const messageAuthor = this.controller.getStore().getters['users/get'](params.message.senderId, true);
			userName = messageAuthor.name;
			avatar = messageAuthor.avatar;
		}

		Notifier.notify({
			id: `im-videconf-${params.message.id}`,
			title: userName,
			icon: avatar,
			text,
		});

		return true;
	}

	checkIfMessageNotifyIsNeeded(params)
	{
		if (!Util.isConferenceChatEnabled())
		{
			return false;
		}

		const rightPanelMode = this.getConference().common.rightPanelMode;

		return (
			!Utils.device.isMobile()
			&& params.chatId === this.getChatId()
			&& (rightPanelMode !== RightPanelMode.chat || rightPanelMode !== RightPanelMode.split)
			&& params.message.senderId !== this.controller.getUserId()
			&& !this.getConference().common.error
		);
	}

	onInputFocus(e)
	{
		this.viewPort.setHotKeyTemporaryBlock(true);
	}

	onInputBlur(e)
	{
		this.viewPort.setHotKeyTemporaryBlock(false);
	}

	setReconnectingCameraId(id)
	{
		this.reconnectingCameraId = id;

		if (id)
		{
			this.updateCameraSettingsInCurrentCallAfterReconnecting(id);
		}
	}

	updateCameraSettingsInCurrentCallAfterReconnecting(cameraId) {
		if (this.currentCall.cameraId === cameraId)
		{
			return;
		}

		const devicesList = Call.Hardware.getCameraList();

		if (!devicesList.find((device) => device.deviceId === cameraId))
		{
			return;
		}

		this.currentCall.setCameraId(cameraId);
		this.setReconnectingCameraId(null);
	}

	onUpdateLastUsedCameraId()
	{
		const cameraId = this.currentCall.cameraId;
		if (cameraId)
		{
			this.lastUsedCameraId = cameraId;
		}
	}

	onReconnecting(e)
	{
		if (
			!(this.currentCall.provider === Call.Provider.Bitrix || this.currentCall.provider === Call.Provider.Plain)
		)
		{
			return false;
		}

		Analytics.getInstance().onReconnect({
			callId: this.currentCall.uuid,
			callType: Analytics.AnalyticsType.videoconf,
			reconnectionReason: e.reconnectionReason,
			reconnectionReasonInfo: e.reconnectionReasonInfo,
			reconnectionEventCount: e.reconnectionEventCount,
			isVpnActive: this.#isVpnConnected(),
		});

		this.notificationService?.showReconnectingBalloon();
	}

	onReconnected()
	{
		this.setReconnectingCameraId(this.lastUsedCameraId);
		if (
			!(this.currentCall.provider === Call.Provider.Bitrix || this.currentCall.provider === Call.Provider.Plain)
		)
		{
			// todo: restore after fixing balloon resurrection issue
			// related to multiple simultaneous calls to the balloon manager
			// now it's enabled for Bitrix24 calls as a temp solution
			return false;
		}

		// noinspection UnreachableCodeJS
		this.notificationService?.closeReconnectingBalloon();
	}

	onReconnectingFailed(e)
	{
		Analytics.getInstance().onReconnectError({
			callId: this.currentCall?.id,
			callType: Analytics.AnalyticsType.videoconf,
			errorCode: e?.code,
			isVpnActive: this.#isVpnConnected(),
		});
	}

	_onParticipantReconnecting(e)
	{
		if (e?.participant?.userId && this.viewPort?.wrappedView?.users)
		{
			const callUser = this.viewPort.wrappedView.users[e.participant.userId];
			if (callUser)
			{
				callUser.showLastVideoFrame();
			}
		}
	}

	_onParticipantReconnected(e)
	{
		if (e?.participant?.userId && this.viewPort?.wrappedView?.users)
		{
			const callUser = this.viewPort.wrappedView.users[e.participant.userId];
			if (callUser)
			{
				callUser.showLastVideoFrame();
			}
		}
	}

	setUserWasRenamed()
	{
		if (this.viewPort)
		{
			if (this.viewPort.localUser)
			{
				this.viewPort.localUser.userModel.wasRenamed = true;
			}
			else if (this.callStore)
			{
				this.callStore.setWasRenamed(true);
			}
		}
	}
	/* endregion 01. General actions */

	/* region 02. Store actions */
	setError(errorCode)
	{
		const currentError = this.getConference().common.error;
		// if user kicked from call - dont show him end of call form
		if (currentError && currentError === ConferenceErrorCode.kickedFromCall)
		{
			return;
		}

		this.controller.getStore().commit('conference/setError', { errorCode });

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceError(errorCode);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setError:', error);
			}
		}
	}

	toggleSmiles()
	{
		this.controller.getStore().commit('conference/toggleSmiles');

		if (this.callStore)
		{
			try
			{
				this.callStore.toggleConferenceSmiles();
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in toggleSmiles:', error);
			}
		}
	}

	setJoinType(joinWithVideo)
	{
		this.controller.getStore().commit('conference/setJoinType', { joinWithVideo });

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceJoinWithVideo(joinWithVideo);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setJoinType:', error);
			}
		}
	}

	setConferenceStatus(conferenceStarted)
	{
		this.controller.getStore().commit('conference/setConferenceStatus', { conferenceStarted });

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceStatus(conferenceStarted);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setConferenceStatus:', error);
			}
		}
	}

	setConferenceHasErrorInCall(hasErrorInCall)
	{
		this.controller.getStore().commit('conference/setConferenceHasErrorInCall', { hasErrorInCall });

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceHasErrorInCall(hasErrorInCall);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setHasErrorInCall:', error);
			}
		}
	}

	setConferenceStartDate(conferenceStartDate)
	{
		this.controller.getStore().commit('conference/setConferenceStartDate', { conferenceStartDate });

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceStartDate(conferenceStartDate);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setConferenceStartDate:', error);
			}
		}
	}

	setUserReadyToJoin()
	{
		this.controller.getStore().commit('conference/setUserReadyToJoin');

		if (this.callStore)
		{
			try
			{
				this.callStore.setConferenceUserReadyToJoin();
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in setUserReadyToJoin:', error);
			}
		}
	}

	/**
	 * Writes call start state to Pinia stores when joining a call.
	 */
	#writePiniaCallStarted()
	{
		if (!this.callStore)
		{
			return;
		}

		try
		{
			this.callStore.startConferenceCall();
			this.callStore.initCall({
				callId: this.currentCall?.id ?? null,
				callUuid: this.currentCall?.uuid ?? null,
				callProvider: this.currentCall?.provider ?? null,
				callScheme: this.currentCall?.scheme ?? null,
				callType: this.currentCall?.type ?? null,
				associatedEntityId: null,
				associatedEntityType: null,
				isIncoming: false,
				localUserId: this.params.userId,
			});
		}
		catch (error)
		{
			console.error('[call.store] Pinia write failed in joinCall:', error);
		}
	}

	updateCallUser(userId, fields)
	{
		this.controller.getStore().dispatch('call/updateUser', { id: userId, fields });

		if (this.callStore)
		{
			try
			{
				this.callStore.updateUser(userId, fields);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in updateCallUser:', error);
			}
		}
	}
	/* endregion 02. Store actions */

	/* region 03. Rest actions */
	setUserName(name)
	{
		return new Promise((resolve, reject) => {
			this.restClient
				.callMethod('call.user.update', {
					name,
					chat_id: this.getChatId(),
				})
				.then(resolve)
				.catch((error) => {
					reject(error);
				});
		});
	}

	checkPassword(password)
	{
		return new Promise((resolve, reject) => {
			this.restClient
				.callMethod('call.videoconf.password.check', { password, alias: this.params.alias })
				.then((result) => {
					if (result.data() === true)
					{
						this.restClient.setPassword(password);
						this.controller.getStore().commit('conference/common', {
							passChecked: true,
						});

						if (this.callStore)
						{
							try
							{
								this.callStore.setConferenceCommon({ passChecked: true });
							}
							catch (error)
							{
								console.error('[call.store] Pinia write failed in checkPassword:', error);
							}
						}

						this.initUserComplete();
						resolve();
					}
					else
					{
						reject();
					}
				})
				.catch((result) => {
					console.error('Password check error', result);
				});
		});
	}

	changeLink()
	{
		return new Promise((resolve, reject) => {
			this.restClient
				.callMethod('call.videoconf.share.change', {
					dialog_id: this.getDialogId(),
				})
				.then(() => {
					resolve();
				})
				.catch((error) => {
					reject(error);
				});
		});
	}
	/* endregion 03. Rest actions */
	/* endregion 02. Component methods */

	/* endregion 02. Methods */

	/* region 03. Utils */
	ready()
	{
		if (this.inited)
		{
			const promise = new BX.Promise();
			promise.resolve(this);

			return promise;
		}

		return this.initPromise;
	}

	getConference()
	{
		return this.controller.getStore().state.conference;
	}

	isBroadcast()
	{
		return this.getConference().common.isBroadcast;
	}

	getBroadcastPresenters()
	{
		return this.getConference().common.presenters;
	}

	isExternalUser()
	{
		return Boolean(this.getUserHash());
	}

	getCallConfig(videoEnabled: Boolean, joinExisting: Boolean, callUuid: String): Object
	{
		const dialogData = this.getDialogData() ?? {};
		const ownerId = Number(dialogData.ownerId ?? dialogData.owner ?? 0) || 0;
		const managerIds = Array.isArray(dialogData.managerList) ? dialogData.managerList.map(Number) : [];

		const callConfig = {
			videoEnabled,
			type: Call.Type.Permanent,
			entityType: 'chat',
			entityId: this.getDialogId(),
			provider: Call.Provider.Bitrix,
			enableMicAutoParameters: Call.Hardware.enableMicAutoParameters,
			joinExisting: Boolean(joinExisting),
			token: this.callToken,
			chatInfo: {
				advanced: {
					chatType: 'videoconf',
					entityData1: '',
					entityData2: '',
					entityData3: '',
					entityId: this.getDialogId(),
					entityType: 'VIDEOCONF',
				},
				avatar: '/bitrix/js/im/images/blank.gif',
				avatarColor: '#ab7761',
				id: this.getDialogId(),
				chatId: this.getChatId(),
				name: this.params.conferenceTitle,
				type: 'chat',
				userCounter: dialogData.userCounter,
				ownerId,
				managerIds,
			},
		};

		if (callUuid)
		{
			callConfig.roomId = callUuid;
		}

		return callConfig;
	}

	getChatId()
	{
		return parseInt(this.params.chatId);
	}

	getDialogId()
	{
		return this.params.dialogId;
	}

	getDialogData()
	{
		if (!this.dialogInited)
		{
			return false;
		}

		return this.controller.getStore().getters['dialogues/get'](this.getDialogId());
	}

	getHost()
	{
		return location.origin || '';
	}

	getStartupErrorCode()
	{
		return this.params.startupErrorCode ? this.params.startupErrorCode : '';
	}

	isHttps()
	{
		return location.protocol === 'https:';
	}

	getUserHash()
	{
		return this.getConference().user.hash;
	}

	getUserHashCookie()
	{
		let userHash = '';

		const cookie = Cookie.get(null, 'BITRIX_CALL_HASH');
		if (typeof cookie === 'string' && /^[\da-f]{32}$/.test(cookie))
		{
			userHash = cookie;
		}

		return userHash;
	}

	switchToSessAuth()
	{
		this.restClient.restClient.queryParams = undefined;

		return true;
	}

	#getDefaultCommonRecord()
	{
		return {
			state: Call.CallCommonRecordState.Stopped,
			type: Call.CallCommonRecordType.None,
			initiatorId: null,
			info: null,
		};
	}

	/* endregion 03. Utils */
}

ConferenceApplication.FeatureState = {
	Enabled: 'enabled',
	Disabled: 'disabled',
	Limited: 'limited',
};

export { ConferenceApplication };
