import { Loc, Browser, Dom, Type, Text, Reflection, ZIndexManager, Extension } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

import { LocalStorage } from 'im.lib.localstorage';
import { SoundType, DesktopBroadcastAction } from 'im.v2.const';
import { DesktopBroadcastManager } from 'im.v2.lib.desktop';
import { DesktopApi, DesktopFeature } from 'im.v2.lib.desktop-api';
import { DesktopDownload } from 'intranet.desktop-download';

import { getUnknownErrorType, accidentLogger } from 'call.lib.accident-logger';
import { Analytics } from 'call.lib.analytics';
import { CallTokenManager } from 'call.lib.call-token-manager';
import { CallSettingsManager } from 'call.lib.settings-manager';
import { createPinia, setActivePinia } from 'ui.vue3.pinia';
import { useCallStore } from 'call.store';

import { CallAI } from './call_ai';
import {
	MediaStreamsKinds,
	RecorderStatus,
	CloudRecordKind,
	CloudRecordStatus,
	JoinResponseError,
} from './call_api.js';
import { CallCloudRecord, CallCommonRecordState, CallCommonRecordType } from './call_common_record';
import { Hardware } from './call_hardware';
import { BroadcastRequestChannel } from 'call.infrastructure.broadcast-channel';
import { BackgroundDialog } from './dialogs/background_dialog';
import { ConferenceNotifications } from './dialogs/conference_notification';
import { IncomingNotification } from './dialogs/incoming_notification';
import { BitrixCallLegacy } from './engine/bitrix_call_legacy';
import {
	CallEngine,
	UserState,
	Provider,
	CallState,
	CallEvent,
	DisconnectReason,
	CallScheme,
	StartCallErrorCode,
} from './engine/engine';
import { CallEngineLegacy } from './engine/engine_legacy';
import { PlainCall } from './engine/plain_call';
import { SimpleVAD } from './engine/simple_vad';
import { UnsupportedBrowserFeatures } from './engine/unsupported_features_in_browsers';
import { VoximplantCall } from './engine/voximplant_call';
import { CallStreamManager } from './media-stream-manager';
import { ButtonStateService } from './services/button-state-service';
import { CopilotUiService } from './services/copilot-ui-service';
import { DocumentEditorService } from './services/document-editor-service';
import { FeedbackUiService } from './services/feedback-ui-service';
import { FloatingWindowService } from './services/floating-window-service';
import { HangupOptionsUiService } from './services/hangup-options-ui-service';
import { LayoutService } from './services/layout-service';
import { NotificationService } from './services/notification-service';
import { PictureInPictureService } from './services/picture-in-picture-service';
import { PromoService } from './services/promo-service';
import { RecordingUiService } from './services/recording-ui-service';
import Util from './util';
import { VideoStrategy } from './video_strategy';
import { type CallView } from 'call.lib.view-contract';
import { CopilotNotifyType } from './view/copilot-notify';
import { CopilotPopup } from './view/copilot-popup';
import {
	ViewEvent,
	ViewLayout,
	ViewSize,
	ViewRoomState,
	ViewRecordSource,
} from 'call.mapping';
import { MediaRenderer } from './view/media-renderer';
import { ParticipantsPermissionPopup } from './view/participants-permission-popup';
import { WebScreenSharePopup } from './web_screenshare_popup';

import './css/call-overlay.css';

const Events = {
	onViewStateChanged: 'onViewStateChanged',
	onOpenVideoConference: 'onOpenVideoConference',
	onPromoViewed: 'onPromoViewed',
	onCallJoined: 'onCallJoined',
	onCallLeft: 'onCallLeft',
	onCallDestroyed: 'onCallDestroyed',
};

const ViewState = {
	Opened: 'Opened',
	Closed: 'Closed',
	Folded: 'Folded',
};

const DocumentType = {
	Resume: 'resume',
	Blank: 'blank',
};

const FeatureState = {
	Enabled: 'enabled',
	Disabled: 'disabled',
	Limited: 'limited',
};

const DOC_CREATED_EVENT = 'CallController::documentCreated';

const DEFAULT_GENDER = 'M';

// Suppress per-user state notifications (declined/busy/failed) in large chats
// to avoid spamming the screen on group calls.
const LARGE_CHAT_NOTIFICATION_THRESHOLD = 20;

type UserData = {
	id: number,
	name: string,
	avatar: string,
	avatar_hr: string,
	role: string,
	gender: string,
};

type InviteParams = {
	viewElement: HTMLElement,
	bindElement: HTMLElement,
	zIndex: number,
	darkMode: boolean,
	idleUsers: number[],
	allowNewUsers: boolean,
	onDestroy: () => void,
	onSelect: ({ user: UserData }) => void,
};

type Closer = {
	close: () => void,
};

type MessengerFacade = {
	getDefaultZIndex: () => number,
	isThemeDark: () => boolean,
	getContainer: () => HTMLElement,
	openMessenger: (dialogId: string) => Promise,
	openHistory: (dialogId: string) => Promise,
	openSettings: (params: any) => void,
	openHelpArticle: (string) => void,
	isPromoRequired: (string) => boolean,
	isMessengerOpen: () => boolean,
	isSliderFocused: () => boolean,
	showUserSelector?: (params: InviteParams) => Promise<Closer>,

	getMessageCount: () => number,
	getCurrentDialogId: () => string,

	repeatSound: (string, number, boolean) => void,
	stopRepeatSound: (string) => void,
};

export class CallController extends EventEmitter
{
	currentCall: BitrixCallLegacy | PlainCall | VoximplantCall | null;
	currentCallIsNew: false;
	callNotification: ?IncomingNotification;
	viewPort: ?CallView;
	pinia: null;
	callStore: null;
	language: string;
	incomingVideoStrategyType: string;
	formatRecordDate: string;
	messengerFacade: MessengerFacade;

	#onCallUserCommonRecordStateHandler;
	#onCloudRecordStatusChangedHandler;

	#onSwitchTrackRecordStatusHandler;
	#onRecorderStatusChangedHandler;
	#onFullScreenChangeHandler;
	#onChangeMicrophonePermissionHandler;

	#onCallFailureHandler;
	#onCommonRecordMenuHandler;
	#onPiPViewBodyClickHandler;

	#onHardwareMicrophoneMutedChangeHandler;
	#onHardwareCameraOnChangeHandler;

	constructor(config)
	{
		super();
		this.setEventNamespace('BX.Call.Controller');

		const needInit = BX.prop.getBoolean(config, 'init', true);

		this.language = config.language || 'en';
		this.incomingVideoStrategyType = config.incomingVideoStrategyType || VideoStrategy.Type.AllowAll;
		this.formatRecordDate = config.formatRecordDate || 'd.m.Y';

		this.messengerFacade = config.messengerFacade;

		this.inited = false;
		this.debug = false;

		this.pinia = null;
		this.callStore = null;

		this.container = null;

		this.localStream = null;
		this.audioRingtone = SoundType.ringtoneModern;

		// for setting the camera after reconnect
		this.lastUsedCameraId = null;
		this.reconnectingCameraId = null;

		this.childCall = null;
		this.invitePopup = null;
		/** @var {VideoStrategy} this.currentCall */
		this.videoStrategy = null;

		this.isHttps = window.location.protocol === 'https:';
		this.callWithLegacyMobile = false;

		this.featureScreenSharing = FeatureState.Enabled;

		this.screenShareStartTime = null;

		this.commonRecord = this.#getDefaultCommonRecord();

		this.autoCloseCallView = true;

		this.talkingUsers = {};

		this.promotedToAdminTimeoutValue = 10 * 1000; // 10 sec
		this.promotedToAdminTimeout = null;

		this.clickLinkInterceptor = null;

		this._callViewState = ViewState.Closed;

		this.answeredOrDeclinedCalls = new Set();
		this.answeredElsewhereCalls = new Set();

		this.#initHandlers();

		this.hideIncomingCallTimeout = 0;
		this.ignoreDeclinedCallsTimeout = {};
		this.ignoreIncomingNotificationTimeouts = {};

		this.resizeObserver = new BX.ResizeObserver(this._onResize.bind(this));

		this.loopTimers = {};

		this.lastCalledChangeSettingsUserName = BX.message('CALL_DEFAULT_NAME_OF_MODERATOR');

		this.isCallHangupButtonPressed = false;

		this.callMultiBroadcastClient = null;

		this.savedScreenStream = null;

		if (needInit)
		{
			this.init();
			this.#subscribeEvents(config);
		}
	}

	#initHandlers()
	{
		this.#initCallHandlers();
		this.#initViewHandlers();

		this._onBeforeUnloadHandler = this._onBeforeUnload.bind(this);
		this._onImTabChangeHandler = this._onImTabChange.bind(this);
		this._onUpdateChatCounterHandler = this._onUpdateChatCounter.bind(this);

		this._onChildCallFirstMediaHandler = this.#onChildCallFirstMedia.bind(this);
		this._onChildCallFirstUserJoinedHandler = this.#onChildCallFirstUserJoined.bind(this);

		this._onWindowFocusHandler = this._onWindowFocus.bind(this);
		this._onWindowBlurHandler = this._onWindowBlur.bind(this);
		this._onDocumentBodyClickHandler = this._onDocumentBodyClick.bind(this);

		this.#onFullScreenChangeHandler = this.#onFullScreenChange.bind(this);
		this.#onChangeMicrophonePermissionHandler = this.#onChangeMicrophonePermission.bind(this);
		this.#onHardwareMicrophoneMutedChangeHandler = this.#onHardwareMicrophoneMutedChange.bind(this);
		this.#onHardwareCameraOnChangeHandler = this.#onHardwareCameraOnChange.bind(this);
	}

	#initCallHandlers()
	{
		this._onCallDestroyHandler = this._onCallDestroy.bind(this);
		this._onCallUserStateChangedHandler = this._onCallUserStateChanged.bind(this);
		this._onNeedResetMediaDevicesStateHandler = this._onNeedResetMediaDevicesState.bind(this);
		this._onRemoteMediaAvailableHandler = this._onRemoteMediaAvailable.bind(this);
		this._onRemoteMediaUnavailableHandler = this._onRemoteMediaUnavailable.bind(this);
		this._onCameraPublishingHandler = this._onCameraPublishing.bind(this);
		this._onMicrophonePublishingdHandler = this._onMicrophonePublishingd.bind(this);
		this._onCallLocalMediaReceivedHandler = this._onCallLocalMediaReceived.bind(this);
		this._onCallLocalMediaStoppedHandler = this._onCallLocalMediaStopped.bind(this);
		this._onCallLocalScreenUpdatedHandler = this._onCallLocalScreenUpdated.bind(this);
		this._onCallLocalCameraFlipHandler = this._onCallLocalCameraFlip.bind(this);
		this._onCallLocalCameraFlipInDesktopHandler = this._onCallLocalCameraFlipInDesktop.bind(this);
		this._onCallToggleRemoteParticipantVideoHandler = this._onCallToggleRemoteParticipantVideo.bind(this);
		this._onTurnOnCameraHandler = this._onTurnOnCamera.bind(this);
		this._onYouMuteAllParticipantsHandler = this._onYouMuteAllParticipants.bind(this);
		this._onRoomSettingsChangedHandler = this._onRoomSettingsChanged.bind(this);
		this._onUserPermissionsChangedHandler = this._onUserPermissionsChanged.bind(this);
		this._onUserRoleChangedHandler = this._onUserRoleChanged.bind(this);
		this._onUserStatsReceivedHandler = this._onUserStatsReceived.bind(this);
		this._onNetworkProblemHandler = this._onNetworkProblem.bind(this);
		this._onReconnectingHandler = this._onReconnecting.bind(this);
		this._onReconnectedHandler = this._onReconnected.bind(this);
		this._onReconnectingFailedHandler = this._onReconnectingFailed.bind(this);
		this._onParticipantReconnectingHandler = this._onParticipantReconnecting.bind(this);
		this._onParticipantReconnectedHandler = this._onParticipantReconnected.bind(this);
		this._onCustomMessageHandler = this._onCustomMessage.bind(this);
		this._onCallLeaveHandler = this._onCallLeave.bind(this);
		this._onCallJoinHandler = this._onCallJoin.bind(this);
		this._onGetUserMediaEndedHandler = this.#onGetUserMediaEnded.bind(this);
		this._onGetUserMediaFailedHandler = this.#onGetUserMediaFailed.bind(this);
		this._onUpdateLastUsedCameraIdHandler = this._onUpdateLastUsedCameraId.bind(this);
		this.#onSwitchTrackRecordStatusHandler = this.#onSwitchTrackRecordStatus.bind(this);
		this.#onRecorderStatusChangedHandler = this.#onRecorderStatusChanged.bind(this);
		this._onSpeakerDeviceChangedHandler = this._onSpeakerDeviceChanged.bind(this);
		this.#onCallUserCommonRecordStateHandler = this.#onCallUserCommonRecordState.bind(this);
		this.#onCloudRecordStatusChangedHandler = this.#onCloudRecordStatusChanged.bind(this);

		this._onCallUserInvitedHandler = this._onCallUserInvited.bind(this);
		this._onCallUserJoinedHandler = this._onCallUserJoined.bind(this);
		this._onCallUserMicrophoneStateHandler = this._onCallUserMicrophoneState.bind(this);
		this._onCallUserCameraStateHandler = this._onCallUserCameraState.bind(this);
		this._onCallUserVideoPausedHandler = this._onCallUserVideoPaused.bind(this);
		this._onCallUserScreenStateHandler = this._onCallUserScreenState.bind(this);
		this._onCallUserFloorRequestHandler = this._onCallUserFloorRequest.bind(this);
		this._onCallRemoteMediaReceivedHandler = this._onCallRemoteMediaReceived.bind(this);
		this._onCallRemoteMediaStoppedHandler = this._onCallRemoteMediaStopped.bind(this);
		this._onCallBadNetworkIndicatorHandler = this._onCallBadNetworkIndicator.bind(this);
		this._onCallConnectionQualityChangedHandler = this._onCallConnectionQualityChanged.bind(this);
		this._onCallUserVoiceStartedHandler = this._onCallUserVoiceStarted.bind(this);
		this._onCallUserVoiceStoppedHandler = this._onCallUserVoiceStopped.bind(this);
		this._onAllParticipantsAudioMutedHandler = this._onAllParticipantsAudioMuted.bind(this);
		this._onAllParticipantsVideoMutedHandler = this._onAllParticipantsVideoMuted.bind(this);
		this._onAllParticipantsScreenshareMutedHandler = this._onAllParticipantsScreenshareMuted.bind(this);
		this._onCallTrackSubscriptionFailedHandler = this._onCallTrackSubscriptionFailed.bind(this);
		this.#onCallFailureHandler = this.#onCallFailure.bind(this);
		this._onCallMicrophoneLevelHandler = this._onCallMicrophoneLevel.bind(this);
		this._onCallJoinRoomOfferHandler = this._onCallJoinRoomOffer.bind(this);
		this._onCallJoinRoomHandler = this._onCallJoinRoom.bind(this);
		this._onCallLeaveRoomHandler = this._onCallLeaveRoom.bind(this);
		this._onCallTransferRoomSpeakerHandler = this._onCallTransferRoomSpeaker.bind(this);
	}

	#initViewHandlers()
	{
		this._onCallViewShowHandler = this._onCallViewShow.bind(this);
		this._onCallViewCloseHandler = this._onCallViewClose.bind(this);
		this._onCallViewDestroyHandler = this._onCallViewDestroy.bind(this);
		this._onCallViewButtonClickHandler = this._onCallViewButtonClick.bind(this);
		this._onCallViewBodyClickHandler = this._onCallViewBodyClick.bind(this);
		this._onCallViewReplaceCameraHandler = this._onCallViewReplaceCamera.bind(this);
		this._onCallViewReplaceMicrophoneHandler = this._onCallViewReplaceMicrophone.bind(this);
		this._onCallViewSetCentralUserHandler = this._onCallViewSetCentralUser.bind(this);
		this._onCallViewChangeNoiseSuppressionHandler = this._onCallViewChangeNoiseSuppression.bind(this);
		this._onCallViewChangeMicAutoParamsHandler = this._onCallViewChangeMicAutoParams.bind(this);
		this._onCallViewChangeFaceImproveHandler = this._onCallViewChangeFaceImprove.bind(this);
		this._onCallViewOpenAdvancedSettingsHandler = this._onCallViewOpenAdvancedSettings.bind(this);
		this._onCallViewReplaceSpeakerHandler = this._onCallViewReplaceSpeaker.bind(this);
		this._onCallViewHasMainStreamHandler = this._onCallViewHasMainStream.bind(this);
		this._onCallViewTurnOffParticipantMicHandler = this._onCallViewTurnOffParticipantMic.bind(this);
		this._onCallViewTurnOffParticipantCamHandler = this._onCallViewTurnOffParticipantCam.bind(this);
		this._onCallViewTurnOffParticipantScreenshareHandler = this._onCallViewTurnOffParticipantScreenshare.bind(this);
		this._onCallViewAllowSpeakPermissionHandler = this._onCallViewAllowSpeakPermission.bind(this);
		this._onCallViewDisallowSpeakPermissionHandler = this._onCallViewDisallowSpeakPermission.bind(this);
		this._onCallToggleSubscribeHandler = this._onCallToggleSubscribe.bind(this);
		this._onCallUserClickHandler = this._onCallUserClick.bind(this);
		this._onPipCloseHandler = this._onPipClose.bind(this);
		this.#onCommonRecordMenuHandler = this.#onCommonRecordMenu.bind(this);
		this.#onPiPViewBodyClickHandler = this.#onPiPViewBodyClick.bind(this);
		this._onChangeVideoQualityHandler = this._onChangeVideoQuality.bind(this);
		this._onAudioElementCreatedHandler = this._onAudioElementCreated.bind(this);
	}

	#subscribeEvents(config)
	{
		const eventKeys = Object.keys(Events);
		for (const eventName of eventKeys)
		{
			if (Type.isFunction(config.events[eventName]))
			{
				this.subscribe(Events[eventName], config.events[eventName]);
			}
		}
	}

	get userId()
	{
		return Number(BX.message('USER_ID'));
	}

	get activeSpeakerManager()
	{
		if (this.currentCall?.provider === Provider.Bitrix && this.currentCall.speakerManager)
		{
			return this.currentCall.speakerManager;
		}

		return null;
	}

	get callViewState()
	{
		return this._callViewState;
	}

	set callViewState(newState)
	{
		if (this.callViewState == newState)
		{
			return;
		}
		this._callViewState = newState;
		this.emit(Events.onViewStateChanged, {
			callViewState: newState,
		});
	}

	init()
	{
		BX.addCustomEvent(window, 'CallEvents::incomingCall', this.onIncomingCall.bind(this));
		BX.addCustomEvent('onPullEvent-call', this.#onPullSelfAnswerElsewhere.bind(this));
		Hardware.subscribe(Hardware.Events.deviceChanged, this._onDeviceChange.bind(this));
		Hardware.subscribe(Hardware.Events.onChangeMirroringVideo, this._onCallLocalCameraFlipHandler);
		Hardware.subscribe(Hardware.Events.onChangeMicrophonePermission, this.#onChangeMicrophonePermissionHandler);
		Hardware.subscribe(Hardware.Events.onChangeMicrophoneMuted, this.#onHardwareMicrophoneMutedChangeHandler);
		Hardware.subscribe(Hardware.Events.onChangeCameraOn, this.#onHardwareCameraOnChangeHandler);

		window.addEventListener('blur', this._onWindowBlurHandler);
		window.addEventListener('focus', this._onWindowFocusHandler);
		document.body.addEventListener('click', this._onDocumentBodyClickHandler);

		if (DesktopApi.isDesktop())
		{
			DesktopApi.subscribe('BXForegroundChanged', (focus) => {
				if (focus)
				{
					this._onWindowDesktopFocus();
				}
				else
				{
					this._onWindowDesktopBlur();
				}
			});

			DesktopApi.subscribe('BXScreenMediaSharing', (id, title, x, y, width, height, app) => {
				this.floatingWindowService?.showScreenShareWindow({ title, x, y, width, height, app });
			});

			DesktopApi.subscribe(Hardware.Events.onChangeMirroringVideo, this._onCallLocalCameraFlipInDesktopHandler);

			DesktopApi.subscribe('BXVpnStatusChange', (status) => {
				if (status)
				{
					this.notificationService?.showVpnIsActiveNotification();
				}
			});
		}

		if (window.VoxImplant)
		{
			VoxImplant.getInstance().addEventListener(
				VoxImplant.Events.MicAccessResult,
				this.voxMicAccessResult.bind(this),
			);
		}

		window.addEventListener('beforeunload', this._onBeforeUnloadHandler);
		BX.addCustomEvent('OnDesktopTabChange', this._onImTabChangeHandler);

		BX.addCustomEvent(window, 'onImUpdateCounterMessage', this._onUpdateChatCounter.bind(this));

		BX.garbage(this.destroy, this);

		if (DesktopApi.isDesktop())
		{
			this.callMultiBroadcastClient = new BroadcastRequestChannel('call_controller_multi_channel');

			this.callMultiBroadcastClient.executer((callUuid) => {
				const currentCallUuid = this.currentCall?.uuid;
				const hasView = Boolean(this.viewPort);

				const hasActiveCall = currentCallUuid === callUuid && hasView;

				if (hasActiveCall)
				{
					BXDesktopSystem.SetActiveTab();
				}

				return hasActiveCall;
			});
		}

		CallEngine.multiBroadcastClient.executer(() => Boolean(this.viewPort));

		this.inited = true;
	}

	/**
	 * Workaround to get current microphoneId
	 * @param e
	 */
	voxMicAccessResult(e)
	{
		if (e.stream && e.stream.getAudioTracks().length > 0 && this.viewPort)
		{
			this.viewPort.microphoneId = e.stream.getAudioTracks()[0].getSettings().deviceId;
		}
	}

	getCallType(provider = '')
	{
		const currentProvider = provider || this.currentCall?.provider;

		if (!currentProvider)
		{
			return;
		}

		return currentProvider === Provider.Plain ? Analytics.AnalyticsType.private : Analytics.AnalyticsType.group;
	}

	getCallUsers(includeSelf)
	{
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
				userStates[userId] === UserState.Connected
				|| userStates[userId] === UserState.Connecting
				|| userStates[userId] === UserState.Calling
			))
			{
				activeUsers.push(userId);
			}
		}

		return activeUsers;
	}

	getMaxActiveCallUsers()
	{
		const userStates = this.currentCall.getUsers();
		const activeUsers = [];

		for (const userId in userStates)
		{
			if (userStates.hasOwnProperty(userId)
				&& userStates[userId] !== UserState.Declined
				&& userStates[userId] !== UserState.Busy
				&& userStates[userId] !== UserState.Unavailable
			)
			{
				activeUsers.push(userId);
			}
		}

		return activeUsers;
	}

	updateFloatingWindowContent()
	{
		if (!this.floatingWindowService?.hasFloatingVideo() || !this.currentCall)
		{
			return;
		}

		Util.getUserAvatars(this.currentCall.id, this.getActiveCallUsers()).then((result) => {
			this.floatingWindowService?.show({
				title: this.currentCall?.associatedEntity.name,
				avatars: result,
			});
		});
	}

	updateDeviceIdInChildCall()
	{
		if (!this.childCall || !this.currentCall)
		{
			return;
		}

		if (this.currentCall.microphoneId)
		{
			this.childCall.setMicrophoneId(this.currentCall.microphoneId);
		}

		if (this.currentCall.cameraId)
		{
			this.childCall.setCameraId(this.currentCall.cameraId);
		}
	}

	onIncomingCall(e)
	{
		console.warn('incoming.call', e);
		/** @var {BitrixCall|PlainCall|VoximplantCall} newCall */
		const newCall = e.call;
		const isCurrentCallActive = this.currentCall && (this.viewPort || this.callNotification);

		this.callWithLegacyMobile = e.isLegacyMobile === true;

		const newCallId = Util.getCallIdentifier(newCall);
		const currentCallId = Util.getCallIdentifier(this.currentCall);

		if (isCurrentCallActive)
		{
			if (newCallId === currentCallId)
			{
				// ignoring
			}
			else if (
				newCall.parentUuid === this.currentCall.uuid
				|| (this.currentCall.id && newCall.parentId === this.currentCall.id)
			)
			{
				if (this.currentCall.isScreenSharingStarted())
				{
					if (this.currentCall.transferScreenStream)
					{
						this.savedScreenStream = this.currentCall.transferScreenStream();
					}
					else
					{
						this.currentCall.stopScreenSharing();
					}
				}

				if (!this.childCall)
				{
					this.childCall = newCall;
				}
				this.viewPort.removeScreenUsers();

				if (Util.isLegacyCall(this.childCall.provider, this.childCall.scheme))
				{
					this.childCall.users.forEach((userId) => this.viewPort.addUser(userId, UserState.Calling));
					this.updateCallViewUsers(newCall.id, this.childCall.users);
				}

				this.viewPort.updateCopilotFeatureState(this.childCall?.isCopilotFeaturesEnabled);
				this.updateDeviceIdInChildCall();
				this.answerChildCall();
			}
			else
			{
				// send busy
				newCall.decline(486);
				const isVideoconf = newCall.associatedEntity.type === 'chat'
					&& newCall.associatedEntity.advanced.chatType === 'videoconf';
				const newCallType = newCall.provider === Provider.Plain
					? Analytics.AnalyticsType.private
					: Analytics.AnalyticsType.group;
				Analytics.getInstance().onJoinCall({
					callId: newCallId,
					callType: isVideoconf ? Analytics.AnalyticsType.videoconf : newCallType,
					status: Analytics.AnalyticsStatus.busy,
					associatedEntity: newCall.associatedEntity,
					isVpnActive: this.#isVpnConnected(),
				});

				return false;
			}
		}
		else
		{
			if (newCall.initiatorId == this.userId || CallEngineLegacy.calls[newCall.parentId])
			{
				return;
			}

			if (this.answeredElsewhereCalls.has(newCallId))
			{
				return;
			}

			// `isRepeated: true` marks an auto-retry from the inviter's repeatInviteUsers() timer
			// explicit invites (initial and the user-clicked re-invite from the UI) arrive with `isRepeated:false`
			if (e.isRepeated !== true)
			{
				if (this.ignoreDeclinedCallsTimeout[newCallId])
				{
					clearTimeout(this.ignoreDeclinedCallsTimeout[newCallId]);
					delete this.ignoreDeclinedCallsTimeout[newCallId];
				}
				if (this.ignoreIncomingNotificationTimeouts[newCallId])
				{
					clearTimeout(this.ignoreIncomingNotificationTimeouts[newCallId]);
					delete this.ignoreIncomingNotificationTimeouts[newCallId];
				}
				if (window.BXShowedIncomingCallNotification === newCallId)
				{
					window.BXShowedIncomingCallNotification = null;
				}
				this.answeredOrDeclinedCalls.delete(newCallId);
			}
			else if (this.ignoreDeclinedCallsTimeout[newCallId])
			{
				clearTimeout(this.ignoreDeclinedCallsTimeout[newCallId]);
				this.ignoreDeclinedCallsTimeout[newCallId] = setTimeout(
					() => this.answeredOrDeclinedCalls.delete(newCallId),
					15000,
				);
			}

			if (
				this.viewPort
				|| this.answeredOrDeclinedCalls.has(newCallId)
				|| window.BXShowedIncomingCallNotification === newCallId
			)
			{
				return;
			}

			this.checkDesktop().then(
				(showIncomingCallNotification) => {
					this.prepareIncomingCall(e, showIncomingCallNotification);
				},
				(error) => {
					if (this.currentCall)
					{
						this.#teardownCallConnection();
						this.currentCall = null;
					}

					this.#clearPromotedAdminTimeout();

					console.error(error);
					this.log(error);
					if (this.isHttps)
					{
						this.notificationService?.showNotification(BX.message('IM_CALL_INCOMING_UNSUPPORTED_BROWSER'));
					}
					else
					{
						this.notificationService?.showNotification(BX.message('IM_CALL_INCOMING_ERROR_HTTPS_REQUIRED'));
					}
				},
			);
		}
	}

	prepareIncomingCall(callData, showIncomingCallNotification)
	{
		/** @var {BitrixCall|PlainCall|VoximplantCall} newCall */
		const newCall = callData.call;
		const newCallId = Util.getCallIdentifier(newCall);

		if (this.answeredElsewhereCalls.has(newCallId))
		{
			return;
		}

		// don't wait for init here to speedup process
		Hardware.init();
		if (this.currentCall || newCall.state == CallState.Finished)
		{
			return;
		}

		this.currentCall = newCall;
		if (!(this.currentCall instanceof PlainCall))
		{
			const currentUser = BX.Messenger.v2.Lib.CallManager.getInstance().getCurrentUser();
			Util.setUserData({ [this.userId]: currentUser });
		}

		this.bindCallEvents();
		this.updateFloatingWindowContent();
		window.BXShowedIncomingCallNotification = newCallId;
		this.ignoreIncomingNotificationTimeouts[newCallId] = setTimeout(
			() => (window.BXShowedIncomingCallNotification = null),
			10000,
		);

		if (
			this.currentCall.associatedEntity.type === 'chat'
			&& this.currentCall.associatedEntity.advanced.chatType === 'videoconf'
		)
		{
			if (this.isConferencePageOpened(this.currentCall.associatedEntity.id))
			{
				// conference page is already opened, do nothing
				this.removeCallEvents();
				this.currentCall = null;
			}
			else if (showIncomingCallNotification)
			{
				this.showIncomingConference();
			}
		}
		else
		{
			const video = callData.video === true;
			if (showIncomingCallNotification)
			{
				this.showIncomingCall({ video });
			}

			Hardware.init().then(() => {
				if (!Hardware.hasCamera())
				{
					if (video)
					{
						this.notificationService?.showNotification(BX.message('IM_CALL_ERROR_NO_CAMERA'));
					}

					if (this.callNotification)
					{
						this.callNotification.setHasCamera(false);
					}
				}
			});
		}
	}

	bindCallEvents()
	{
		this.currentCall.addEventListener(CallEvent.onUserInvited, this._onCallUserInvitedHandler);
		this.currentCall.addEventListener(CallEvent.onUserJoined, this._onCallUserJoinedHandler);
		this.currentCall.addEventListener(CallEvent.onDestroy, this._onCallDestroyHandler);
		this.currentCall.addEventListener(CallEvent.onUserStateChanged, this._onCallUserStateChangedHandler);
		this.currentCall.addEventListener(CallEvent.onUserMicrophoneState, this._onCallUserMicrophoneStateHandler);
		this.currentCall.addEventListener(CallEvent.onUserCameraState, this._onCallUserCameraStateHandler);
		this.currentCall.addEventListener(CallEvent.onNeedResetMediaDevicesState, this._onNeedResetMediaDevicesStateHandler);
		this.currentCall.addEventListener(CallEvent.onRemoteMediaAvailable, this._onRemoteMediaAvailableHandler);
		this.currentCall.addEventListener(CallEvent.onRemoteMediaUnavailable, this._onRemoteMediaUnavailableHandler);
		this.currentCall.addEventListener(CallEvent.onCameraPublishing, this._onCameraPublishingHandler);
		this.currentCall.addEventListener(CallEvent.onMicrophonePublishing, this._onMicrophonePublishingdHandler);
		this.currentCall.addEventListener(CallEvent.onUserVideoPaused, this._onCallUserVideoPausedHandler);
		this.currentCall.addEventListener(CallEvent.onUserScreenState, this._onCallUserScreenStateHandler);
		this.currentCall.addEventListener(CallEvent.onUserCommonRecordState, this.#onCallUserCommonRecordStateHandler);
		this.currentCall.addEventListener(CallEvent.onCloudRecordStatusChanged, this.#onCloudRecordStatusChangedHandler);
		this.currentCall.addEventListener(CallEvent.onUserFloorRequest, this._onCallUserFloorRequestHandler);
		this.currentCall.addEventListener(CallEvent.onLocalMediaReceived, this._onCallLocalMediaReceivedHandler);
		this.currentCall.addEventListener(CallEvent.onLocalMediaStopped, this._onCallLocalMediaStoppedHandler);
		this.currentCall.addEventListener(CallEvent.onLocalScreenUpdated, this._onCallLocalScreenUpdatedHandler);
		this.currentCall.addEventListener(CallEvent.onRemoteMediaReceived, this._onCallRemoteMediaReceivedHandler);
		this.currentCall.addEventListener(CallEvent.onRemoteMediaStopped, this._onCallRemoteMediaStoppedHandler);
		this.currentCall.addEventListener(CallEvent.onBadNetworkIndicator, this._onCallBadNetworkIndicatorHandler);
		this.currentCall.addEventListener(CallEvent.onConnectionQualityChanged, this._onCallConnectionQualityChangedHandler);
		this.currentCall.addEventListener(CallEvent.onToggleRemoteParticipantVideo, this._onCallToggleRemoteParticipantVideoHandler);
		this.currentCall.addEventListener(CallEvent.onUserVoiceStarted, this._onCallUserVoiceStartedHandler);
		this.currentCall.addEventListener(CallEvent.onUserVoiceStopped, this._onCallUserVoiceStoppedHandler);
		this.currentCall.addEventListener(CallEvent.onTurnOnCamera, this._onTurnOnCameraHandler);
		this.currentCall.addEventListener(CallEvent.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
		this.currentCall.addEventListener(CallEvent.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
		this.currentCall.addEventListener(CallEvent.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareMutedHandler);
		this.currentCall.addEventListener(CallEvent.onRoomSettingsChanged, this._onRoomSettingsChangedHandler);
		this.currentCall.addEventListener(CallEvent.onUserPermissionsChanged, this._onUserPermissionsChangedHandler);
		this.currentCall.addEventListener(CallEvent.onUserRoleChanged, this._onUserRoleChangedHandler);
		this.currentCall.addEventListener(CallEvent.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
		this.currentCall.addEventListener(CallEvent.onParticipantMuted, this.#onCallParticipantMuted);
		this.currentCall.addEventListener(CallEvent.onUserStatsReceived, this._onUserStatsReceivedHandler);
		this.currentCall.addEventListener(CallEvent.onTrackSubscriptionFailed, this._onCallTrackSubscriptionFailedHandler);
		this.currentCall.addEventListener(CallEvent.onCallFailure, this.#onCallFailureHandler);
		this.currentCall.addEventListener(CallEvent.onNetworkProblem, this._onNetworkProblemHandler);
		this.currentCall.addEventListener(CallEvent.onMicrophoneLevel, this._onCallMicrophoneLevelHandler);
		this.currentCall.addEventListener(CallEvent.onReconnecting, this._onReconnectingHandler);
		this.currentCall.addEventListener(CallEvent.onReconnected, this._onReconnectedHandler);
		this.currentCall.addEventListener(CallEvent.onReconnectingFailed, this._onReconnectingFailedHandler);
		this.currentCall.addEventListener(CallEvent.onParticipantReconnecting, this._onParticipantReconnectingHandler);
		this.currentCall.addEventListener(CallEvent.onParticipantReconnected, this._onParticipantReconnectedHandler);
		this.currentCall.addEventListener(CallEvent.onCustomMessage, this._onCustomMessageHandler);
		this.currentCall.addEventListener(CallEvent.onJoinRoomOffer, this._onCallJoinRoomOfferHandler);
		this.currentCall.addEventListener(CallEvent.onJoinRoom, this._onCallJoinRoomHandler);
		this.currentCall.addEventListener(CallEvent.onLeaveRoom, this._onCallLeaveRoomHandler);
		this.currentCall.addEventListener(CallEvent.onTransferRoomSpeaker, this._onCallTransferRoomSpeakerHandler);
		this.currentCall.addEventListener(CallEvent.onJoin, this._onCallJoinHandler);
		this.currentCall.addEventListener(CallEvent.onLeave, this._onCallLeaveHandler);
		this.currentCall.addEventListener(CallEvent.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
		this.currentCall.addEventListener(CallEvent.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
		this.currentCall.addEventListener(CallEvent.onUpdateLastUsedCameraId, this._onUpdateLastUsedCameraIdHandler);
		this.currentCall.addEventListener(CallEvent.onSwitchTrackRecordStatus, this.#onSwitchTrackRecordStatusHandler);
		this.currentCall.addEventListener(CallEvent.onRecorderStatusChanged, this.#onRecorderStatusChangedHandler);
		this.currentCall.addEventListener(CallEvent.onSpeakerConfirmed, this._onSpeakerDeviceChangedHandler);
		this.currentCall.addEventListener(CallEvent.onSpeakerFallback, this._onSpeakerDeviceChangedHandler);

		if (this.callStore)
		{
			try
			{
				this.callStore.initCall({
					callId: this.currentCall.id,
					callUuid: this.currentCall.uuid,
					callProvider: this.currentCall.provider,
					callScheme: this.currentCall.scheme,
					callType: this.currentCall.type,
					associatedEntityId: this.currentCall.associatedEntity?.id,
					associatedEntityType: this.currentCall.associatedEntity?.type,
					isIncoming: this.currentCall.direction === 'Incoming',
					localUserId: this.userId,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in bindCallEvents:', error);
			}
		}
	}

	removeCallEvents()
	{
		this.currentCall.removeEventListener(CallEvent.onUserInvited, this._onCallUserInvitedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserJoined, this._onCallUserJoinedHandler);
		this.currentCall.removeEventListener(CallEvent.onDestroy, this._onCallDestroyHandler);
		this.currentCall.removeEventListener(CallEvent.onUserStateChanged, this._onCallUserStateChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserMicrophoneState, this._onCallUserMicrophoneStateHandler);
		this.currentCall.removeEventListener(CallEvent.onUserCameraState, this._onCallUserCameraStateHandler);
		this.currentCall.removeEventListener(CallEvent.onNeedResetMediaDevicesState, this._onNeedResetMediaDevicesStateHandler);
		this.currentCall.removeEventListener(CallEvent.onRemoteMediaAvailable, this._onRemoteMediaAvailableHandler);
		this.currentCall.removeEventListener(CallEvent.onRemoteMediaUnavailable, this._onRemoteMediaUnavailableHandler);
		this.currentCall.removeEventListener(CallEvent.onCameraPublishing, this._onCameraPublishingHandler);
		this.currentCall.removeEventListener(CallEvent.onMicrophonePublishing, this._onMicrophonePublishingdHandler);
		this.currentCall.removeEventListener(CallEvent.onUserVideoPaused, this._onCallUserVideoPausedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserScreenState, this._onCallUserScreenStateHandler);
		this.currentCall.removeEventListener(CallEvent.onUserCommonRecordState, this.#onCallUserCommonRecordStateHandler);
		this.currentCall.removeEventListener(CallEvent.onCloudRecordStatusChanged, this.#onCloudRecordStatusChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserFloorRequest, this._onCallUserFloorRequestHandler);
		this.currentCall.removeEventListener(CallEvent.onLocalMediaReceived, this._onCallLocalMediaReceivedHandler);
		this.currentCall.removeEventListener(CallEvent.onLocalMediaStopped, this._onCallLocalMediaStoppedHandler);
		this.currentCall.removeEventListener(CallEvent.onLocalScreenUpdated, this._onCallLocalScreenUpdatedHandler);
		this.currentCall.removeEventListener(CallEvent.onRemoteMediaReceived, this._onCallRemoteMediaReceivedHandler);
		this.currentCall.removeEventListener(CallEvent.onRemoteMediaStopped, this._onCallRemoteMediaStoppedHandler);
		this.currentCall.removeEventListener(CallEvent.onBadNetworkIndicator, this._onCallBadNetworkIndicatorHandler);
		this.currentCall.removeEventListener(CallEvent.onConnectionQualityChanged, this._onCallConnectionQualityChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onToggleRemoteParticipantVideo, this._onCallToggleRemoteParticipantVideoHandler);
		this.currentCall.removeEventListener(CallEvent.onUserVoiceStarted, this._onCallUserVoiceStartedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserVoiceStopped, this._onCallUserVoiceStoppedHandler);
		this.currentCall.removeEventListener(CallEvent.onTurnOnCamera, this._onTurnOnCameraHandler);
		this.currentCall.removeEventListener(CallEvent.onAllParticipantsAudioMuted, this._onAllParticipantsAudioMutedHandler);
		this.currentCall.removeEventListener(CallEvent.onAllParticipantsVideoMuted, this._onAllParticipantsVideoMutedHandler);
		this.currentCall.removeEventListener(CallEvent.onAllParticipantsScreenshareMuted, this._onAllParticipantsScreenshareMutedHandler);
		this.currentCall.removeEventListener(CallEvent.onRoomSettingsChanged, this._onRoomSettingsChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserPermissionsChanged, this._onUserPermissionsChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onUserRoleChanged, this._onUserRoleChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onYouMuteAllParticipants, this._onYouMuteAllParticipantsHandler);
		this.currentCall.removeEventListener(CallEvent.onParticipantMuted, this.#onCallParticipantMuted);
		this.currentCall.removeEventListener(CallEvent.onUserStatsReceived, this._onUserStatsReceivedHandler);
		this.currentCall.removeEventListener(CallEvent.onTrackSubscriptionFailed, this._onCallTrackSubscriptionFailedHandler);
		this.currentCall.removeEventListener(CallEvent.onCallFailure, this.#onCallFailureHandler);
		this.currentCall.removeEventListener(CallEvent.onNetworkProblem, this._onNetworkProblemHandler);
		this.currentCall.removeEventListener(CallEvent.onMicrophoneLevel, this._onCallMicrophoneLevelHandler);
		this.currentCall.removeEventListener(CallEvent.onReconnecting, this._onReconnectingHandler);
		this.currentCall.removeEventListener(CallEvent.onReconnected, this._onReconnectedHandler);
		this.currentCall.removeEventListener(CallEvent.onReconnectingFailed, this._onReconnectingFailedHandler);
		this.currentCall.removeEventListener(CallEvent.onParticipantReconnecting, this._onParticipantReconnectingHandler);
		this.currentCall.removeEventListener(CallEvent.onParticipantReconnected, this._onParticipantReconnectedHandler);
		this.currentCall.removeEventListener(CallEvent.onCustomMessage, this._onCustomMessageHandler);
		this.currentCall.removeEventListener(CallEvent.onJoinRoomOffer, this._onCallJoinRoomOfferHandler);
		this.currentCall.removeEventListener(CallEvent.onJoinRoom, this._onCallJoinRoomHandler);
		this.currentCall.removeEventListener(CallEvent.onLeaveRoom, this._onCallLeaveRoomHandler);
		this.currentCall.removeEventListener(CallEvent.onTransferRoomSpeaker, this._onCallTransferRoomSpeakerHandler);
		this.currentCall.removeEventListener(CallEvent.onJoin, this._onCallJoinHandler);
		this.currentCall.removeEventListener(CallEvent.onLeave, this._onCallLeaveHandler);
		this.currentCall.removeEventListener(CallEvent.onGetUserMediaEnded, this._onGetUserMediaEndedHandler);
		this.currentCall.removeEventListener(CallEvent.onGetUserMediaFailed, this._onGetUserMediaFailedHandler);
		this.currentCall.removeEventListener(CallEvent.onUpdateLastUsedCameraId, this._onUpdateLastUsedCameraIdHandler);
		this.currentCall.removeEventListener(CallEvent.onSwitchTrackRecordStatus, this.#onSwitchTrackRecordStatusHandler);
		this.currentCall.removeEventListener(CallEvent.onRecorderStatusChanged, this.#onRecorderStatusChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onSpeakerConfirmed, this._onSpeakerDeviceChangedHandler);
		this.currentCall.removeEventListener(CallEvent.onSpeakerFallback, this._onSpeakerDeviceChangedHandler);
	}

	#bindChildCallEvents(call, addStateListener: Boolean = false): void
	{
		call.addEventListener(CallEvent.onUserJoined, this._onChildCallFirstUserJoinedHandler);
		call.addEventListener(CallEvent.onRemoteMediaReceived, this._onChildCallFirstMediaHandler);
		call.addEventListener(CallEvent.onLocalMediaReceived, this._onCallLocalMediaReceivedHandler);

		if (addStateListener)
		{
			call.addEventListener(CallEvent.onUserStateChanged, this._onCallUserStateChangedHandler);
		}
	}

	#removeChildCallEvents(call): void
	{
		call.removeEventListener(CallEvent.onUserJoined, this._onChildCallFirstUserJoinedHandler);
		call.removeEventListener(CallEvent.onRemoteMediaReceived, this._onChildCallFirstMediaHandler);
		call.removeEventListener(CallEvent.onLocalMediaReceived, this._onCallLocalMediaReceivedHandler);
		call.removeEventListener(CallEvent.onUserStateChanged, this._onCallUserStateChangedHandler);
	}

	bindCallViewEvents()
	{
		this.viewPort.setCallback(ViewEvent.onShow, this._onCallViewShowHandler);
		this.viewPort.setCallback(ViewEvent.onClose, this._onCallViewCloseHandler);
		this.viewPort.setCallback(ViewEvent.onDestroy, this._onCallViewDestroyHandler);
		this.viewPort.setCallback(ViewEvent.onButtonClick, this._onCallViewButtonClickHandler);
		this.viewPort.setCallback(ViewEvent.onBodyClick, this._onCallViewBodyClickHandler);
		this.viewPort.setCallback(ViewEvent.onReplaceCamera, this._onCallViewReplaceCameraHandler);
		this.viewPort.setCallback(ViewEvent.onReplaceMicrophone, this._onCallViewReplaceMicrophoneHandler);
		this.viewPort.setCallback(ViewEvent.onSetCentralUser, this._onCallViewSetCentralUserHandler);
		this.viewPort.setCallback(ViewEvent.onChangeNoiseSuppression, this._onCallViewChangeNoiseSuppressionHandler);
		this.viewPort.setCallback(ViewEvent.onChangeMicAutoParams, this._onCallViewChangeMicAutoParamsHandler);
		this.viewPort.setCallback(ViewEvent.onChangeFaceImprove, this._onCallViewChangeFaceImproveHandler);
		this.viewPort.setCallback(ViewEvent.onOpenAdvancedSettings, this._onCallViewOpenAdvancedSettingsHandler);
		this.viewPort.setCallback(ViewEvent.onReplaceSpeaker, this._onCallViewReplaceSpeakerHandler);
		this.viewPort.setCallback(ViewEvent.onHasMainStream, this._onCallViewHasMainStreamHandler);
		this.viewPort.setCallback(ViewEvent.onTurnOffParticipantMic, this._onCallViewTurnOffParticipantMicHandler);
		this.viewPort.setCallback(ViewEvent.onTurnOffParticipantCam, this._onCallViewTurnOffParticipantCamHandler);
		this.viewPort.setCallback(ViewEvent.onTurnOffParticipantScreenshare, this._onCallViewTurnOffParticipantScreenshareHandler);
		this.viewPort.setCallback(ViewEvent.onAllowSpeakPermission, this._onCallViewAllowSpeakPermissionHandler);
		this.viewPort.setCallback(ViewEvent.onDisallowSpeakPermission, this._onCallViewDisallowSpeakPermissionHandler);
		this.viewPort.setCallback(ViewEvent.onToggleSubscribe, this._onCallToggleSubscribeHandler);
		this.viewPort.setCallback(ViewEvent.onUserClick, this._onCallUserClickHandler);
		this.viewPort.setCallback(ViewEvent.onPiPClose, this._onPipCloseHandler);
		this.viewPort.setCallback(ViewEvent.onCommonRecordMenu, this.#onCommonRecordMenuHandler);
		this.viewPort.setCallback(ViewEvent.onPiPBodyClick, this.#onPiPViewBodyClickHandler);
		this.viewPort.setCallback(ViewEvent.onChangeVideoQuality, this._onChangeVideoQualityHandler);
		this.viewPort.setCallback(ViewEvent.onFullScreenChange, this.#onFullScreenChangeHandler);
		this.viewPort.setCallback(ViewEvent.onAudioElementCreated, this._onAudioElementCreatedHandler);

		this._initUiServices();
	}

	initSpeakerManager()
	{
		const speakerManager = this.activeSpeakerManager;
		if (!speakerManager)
		{
			return;
		}

		if (speakerManager.requiresUserGesture && !navigator.userActivation?.isActive)
		{
			console.warn('initSpeakerManager skipped (requires user gesture)');

			return;
		}

		const savedSpeaker = Hardware.defaultSpeaker;

		if (savedSpeaker)
		{
			speakerManager.onDeviceAdded(savedSpeaker, false);
		}
	}

	async #buildCallViewPort(extraOptions)
	{
		if (Util.isVueEnabled())
		{
			this.pinia = createPinia();
			setActivePinia(this.pinia);
			this.callStore = useCallStore();
			this.callStore.setMediaState({
				isMicrophoneMuted: Hardware.isMicrophoneMuted,
				isCameraOn: Hardware.isCameraOn,
			});

			const { VueCallViewAdapter } = await BX.Runtime.loadExtension('call.vue');

			return new VueCallViewAdapter({
				container: this.container,
				pinia: this.pinia,
				...extraOptions,
			});
		}

		const { View: LegacyView, LegacyCallViewAdapter } = await BX.Runtime.loadExtension('call.view');

		return new LegacyCallViewAdapter(
			new LegacyView({
				container: this.container,
				baseZIndex: this.messengerFacade.getDefaultZIndex(),
				showChatButtons: true,
				showUsersButton: false,
				showRecordButton: true,
				userLimit: Util.getUserLimit(),
				language: this.language,
				microphoneId: Hardware.defaultMicrophone,
				isWindowFocus: this.layoutService?.isWindowFocus ?? true,
				...extraOptions,
			}),
		);
	}

	#getHiddenCallButtons(isPlainCall)
	{
		const hiddenButtons = [];
		if (isPlainCall)
		{
			hiddenButtons.push('floorRequest', 'hangupOptions', 'callconrol');
		}

		if (!Util.shouldShowDocumentButton())
		{
			hiddenButtons.push('document');
		}

		return hiddenButtons;
	}

	#getAnalyticsCallParams()
	{
		return {
			callId: Util.getCallIdentifier(this.currentCall),
			callType: this.getCallType(),
		};
	}

	_initUiServices()
	{
		this.buttonStateService = new ButtonStateService({
			viewPort: this.viewPort,
			callStore: this.callStore,
		});

		this.layoutService = new LayoutService({
			viewPort: this.viewPort,
			container: this.container,
			resizeObserver: this.resizeObserver,
			callStore: this.callStore,
		});

		this.notificationService = new NotificationService({
			viewPort: this.viewPort,
			container: this.container,
			callStore: this.callStore,
		});

		this.notificationService.subscribe('NotificationService::onAskSpeakButtonClicked', () => {
			this._onCallViewFloorRequestButtonClick();
		});

		this.notificationService.subscribe('NotificationService::onUnmuteMicButtonClicked', () => {
			this._onCallViewToggleMuteButtonClick({ muted: false });
		});

		this.promoService = new PromoService({
			viewPort: this.viewPort,
			container: this.container,
			isPromoRequired: (code) => this.messengerFacade.isPromoRequired(code),
			callStore: this.callStore,
		});

		this.promoService.subscribe('PromoService::onPromoViewed', ({ data }) => {
			this.emit(Events.onPromoViewed, { code: data.code });
		});

		this.promoService.subscribe('PromoService::onDocumentPromoActionClicked', () => {
			this.promoService?.closeAll();

			const articleCode = Util.getResumesArticleCode();
			if (articleCode)
			{
				BX.UI.InfoHelper.show(articleCode);

				return;
			}

			this.showDocumentEditor({
				type: DocumentType.Resume,
			});
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
			this.documentEditorService?.toggleHidden(true);
			this.notificationService?.onFolded();
		});

		this.layoutService.subscribe('LayoutService::onUnfold', ({ data }) => {
			const { fromPiP } = data;
			ZIndexManager.getStack(document.body).bringToFront(this.container);
			this.documentEditorService?.toggleHidden(false);
			if (this.documentEditorService?.hasSidebar())
			{
				this.resizeObserver.observe(this.container);
			}
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

		this.layoutService.subscribe('LayoutService::onShowChat', () => {
			if (DesktopApi.isDesktop() && this.floatingWindowService?.hasFloatingVideo())
			{
				this.layoutService.setDetached(
					this.currentCall.associatedEntity.name,
					this.currentCall.id,
					this.getActiveCallUsers(),
				);
				this.floatingWindowService.show({
					title: this.currentCall.associatedEntity.name,
				});
			}
			else
			{
				this.layoutService.fold(Text.decode(this.currentCall?.associatedEntity.name));
			}
		});

		this.layoutService.subscribe('LayoutService::onShowWebScreenSharePopup', () => {
			this.layoutService?.showWebScreenSharePopup(
				WebScreenSharePopup,
				this.viewPort?.getButtonElement('screen'),
				() => this._onCallViewToggleScreenSharingButtonClick(),
			);
		});

		this.layoutService.subscribe('LayoutService::onHideScreenShare', () => {
			this.floatingWindowService?.hideScreenShareWindow();
			if (this.#isCommonRecordStarted() && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordStopSharing();
			}
		});

		this.layoutService.subscribe('LayoutService::onTogglePiP', () => {
			this.togglePictureInPictureCallWindow();
		});

		this.hangupOptionsUiService = new HangupOptionsUiService({
			viewPort: this.viewPort,
			container: this.container,
			callStore: this.callStore,
		});

		this.feedbackUiService = new FeedbackUiService({
			viewPort: this.viewPort,
			container: this.container,
			darkMode: this.messengerFacade.isThemeDark(),
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
			this.isCallHangupButtonPressed = true;
			this.leaveCurrentCall(false, true);
		});

		this.hangupOptionsUiService.subscribe('HangupOptionsUiService::onLeaveCall', ({ data }) => {
			const { callId, callType } = data;
			Analytics.getInstance().onDisconnectCall({
				callId,
				callType,
				subSection: Analytics.AnalyticsSubSection.contextMenu,
				mediaParams: {
					video: Hardware.isCameraOn,
					audio: !Hardware.isMicrophoneMuted,
				},
			});
			this.leaveCurrentCall();
		});

		this.documentEditorService = new DocumentEditorService({
			viewPort: this.viewPort,
			container: this.container,
			resizeObserver: this.resizeObserver,
			messengerFacade: this.messengerFacade,
			callStore: this.callStore,
		});

		this.documentEditorService.subscribe('DocumentEditorService::onOpen', () => {
			if (this.viewPort)
			{
				this.buttonStateService?.activateDocumentButton(true);
			}
			this.promoService?.closeAll();
		});

		this.documentEditorService.subscribe('DocumentEditorService::onClose', ({ data }) => {
			if (data.needsContainerRemoval)
			{
				this.removeContainer();
			}
		});

		this.documentEditorService.subscribe('DocumentEditorService::onResize', () => {
			// Coordinate resize with LayoutService if needed
			this._onResize();
		});

		this.documentEditorService.subscribe('DocumentEditorService::onDocumentCreated', (event) => {
			const data = event.getData();

			if (this.currentCall)
			{
				this.currentCall.sendCustomMessage(DOC_CREATED_EVENT, true);
			}

			Analytics.getInstance().onDocumentUpload({
				...this.#getAnalyticsCallParams(),
				type: data.documentType,
			});

			BX.onCustomEvent(this, DOC_CREATED_EVENT, data);
		});

		this.documentEditorService.subscribe('DocumentEditorService::onDocumentMenuAction', (event) => {
			Analytics.getInstance().onDocumentCreate({
				...this.#getAnalyticsCallParams(),
				type: event.getData().documentType,
			});
		});

		this.documentEditorService.subscribe('DocumentEditorService::onLastResumeOpen', () => {
			Analytics.getInstance().onLastResumeOpen({
				...this.#getAnalyticsCallParams(),
			});
		});

		this.pipService = new PictureInPictureService({
			viewPort: this.viewPort,
			callStore: this.callStore,
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
				const kind = recordType === CallCommonRecordType.Audio ? CloudRecordKind.AUDIO : CloudRecordKind.VIDEO;
				this.buttonStateService?.blockRecordButton();
				this.currentCall.setCloudRecordState(CloudRecordStatus.STARTED, kind);
			}
			else
			{
				this.commonRecord.state = CallCommonRecordState.Started;
				this.buttonStateService?.activateRecordButton(true);
				this.currentCall.sendLocalRecordState({
					action: CallCommonRecordState.Started,
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
					[CallCommonRecordState.Paused]: CloudRecordStatus.PAUSED,
					[CallCommonRecordState.Resumed]: CloudRecordStatus.STARTED,
					[CallCommonRecordState.Stopped]: CloudRecordStatus.STOPPED,
				};
				this.currentCall.setCloudRecordState(cloudStatusMap[state]);
				this.commonRecord.state = state;

				return;
			}

			if (state === CallCommonRecordState.Paused && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordPause(true);
			}
			else if (state === CallCommonRecordState.Resumed && this.#canLocalRecord())
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
				this.currentCall.setCloudRecordState(CloudRecordStatus.DESTROYED);
				this.commonRecord.state = CallCommonRecordState.Destroyed;

				return;
			}

			this.currentCall.sendLocalRecordState({
				action: CallCommonRecordState.Destroyed,
				type: this.commonRecord.type,
				date: new Date(),
			});

			this.commonRecord.state = CallCommonRecordState.Destroyed;
		});

		this.copilotUiService = new CopilotUiService({
			viewPort: this.viewPort,
			container: this.container,
			CopilotPopupClass: CopilotPopup,
			onTariffGate: () => Util.openArticle(CallAI.helpSlider),
			callStore: this.callStore,
		});

		this.copilotUiService.subscribe('CopilotUiService::onChangeStateCopilot', ({ data }) => {
			const { desiredState } = data;
			const stateMap = {
				enabled: RecorderStatus.ENABLED,
				paused: RecorderStatus.PAUSED,
				destroyed: RecorderStatus.DESTROYED,
			};
			const recorderStatus = stateMap[desiredState];

			if (recorderStatus !== undefined)
			{
				if (desiredState === 'paused')
				{
					Analytics.getInstance().copilot.onSelectAIOff({
						...this.#getAnalyticsCallParams(),
					});
				}

				if (desiredState === 'destroyed')
				{
					Analytics.getInstance().copilot.onSelectAIDelete({
						...this.#getAnalyticsCallParams(),
					});
				}

				this.#onChangeStateCopilotAction(recorderStatus);
			}
		});

		if (DesktopApi.isDesktop())
		{
			this.floatingWindowService = new FloatingWindowService({
				floatingVideo: false,
				floatingScreenShare: true,
				darkMode: this.messengerFacade.isThemeDark(),
				callStore: this.callStore,
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onMainAreaClick', () => {
				this.layoutService?.unfold();
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onButtonClick', ({ data }) => {
				this._onFloatingVideoButtonClick(data);
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onBackToCall', () => {
				DesktopApi.activateWindow();
				DesktopApi.changeTab('im');
				this.layoutService?.unfold();
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onStopSharing', () => {
				DesktopApi.activateWindow();
				DesktopApi.changeTab('im');
				this.floatingWindowService?.hideScreenShareWindow();
				this.currentCall?.stopScreenSharing();

				if (this.#isCommonRecordStarted() && this.#canLocalRecord())
				{
					BXDesktopSystem.CallRecordStopSharing();
				}
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onChangeScreen', () => {
				this._onFloatingScreenShareChangeScreenClick();
			});
		}
	}

	updateCallViewUsers(callId, userList)
	{
		if (!this.viewPort)
		{
			return;
		}

		const convertAllItemsToInt = (arr) => Array.from(arr, (item) => parseFloat(item));
		const userListInt = convertAllItemsToInt(userList);

		let userDataInt = [];
		let notIncludedEl = [];

		if (this.currentCall.userData)
		{
			this.viewPort.updateUserData(this.currentCall.userData);

			userDataInt = convertAllItemsToInt(Object.keys(this.currentCall.userData));
			notIncludedEl = userListInt.filter((id) => !userDataInt.includes(id));
		}

		if (this.currentCall.userData && notIncludedEl.length === 0)
		{
			return;
		}

		Util.getUsers(callId, userListInt).then((userData) =>
		{
			this.viewPort.updateUserData(userData);
		});
	}

	createVideoStrategy()
	{
		if (this.videoStrategy)
		{
			this.videoStrategy.destroy();
		}

		const strategyType = this.incomingVideoStrategyType;

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

	setFeatureScreenSharing(enable)
	{
		this.featureScreenSharing = enable;
	}

	setVideoStrategyType(type)
	{
		if (this.videoStrategy)
		{
			this.videoStrategy.setType(type);
		}
	}

	getExternalContainer()
	{
		let externalContainer = document.querySelector(`.${BX.Messenger.v2.Lib.CallManager.viewContainerClass}`);

		if (!externalContainer)
		{
			externalContainer = BX.create('div', {
				props: { className: BX.Messenger.v2.Lib.CallManager.viewContainerClass },
			});

			externalContainer.setAttribute('data-a11y-ignore-inert', 'true');
			document.body.appendChild(externalContainer);
		}

		return externalContainer;
	}

	createContainer()
	{
		this.container = BX.create('div', {
			props: { className: `bx-messenger-call-overlay ${Util.isChatMountInPage() ? '--fixed' : ''}` },
			events: {
				click: (event) => event.stopPropagation(),
			}
		});

		const externalContainer = this.getExternalContainer();
		externalContainer.insertBefore(this.container, externalContainer.firstChild);

		ZIndexManager.getOrAddStack(document.body).register(this.container);

		externalContainer.classList.add('bx-messenger-call');
	}

	removeContainer()
	{
		if (this.container)
		{
			ZIndexManager.getStack(document.body).unregister(this.container);
			Dom.remove(this.container);
			this.container = null;
			this.getExternalContainer().classList.remove('bx-messenger-call');
		}
	}

	answerChildCall()
	{
		this.#teardownCallConnection();
		this.#bindChildCallEvents(this.childCall);

		const provider = this.childCall.provider;
		const uuid = this.childCall.uuid;

		const isLegacyCall = Util.isLegacyCall(provider, this.childCall.scheme);

		this.initCallPromise = isLegacyCall
			? Promise.resolve()
			: CallTokenManager.getToken(this.childCall.associatedEntity.chatId);

		this.initCallPromise
			.then((token) => {
				const config = {
					provider,
					token,
					entityType: 'chat',
					entityId: this.childCall.associatedEntity.id,
					videoEnabled: Hardware.isCameraOn,
					enableMicAutoParameters: Hardware.enableMicAutoParameters,
					joinExisting: true,
					roomId: uuid,
					debug: this.debug,
					chatInfo: this.childCall.associatedEntity,
				};

				return isLegacyCall
					? CallEngineLegacy.getCallWithId(this.childCall.id)
					: CallEngine.getCallWithId(uuid, config);
			})
			.then(() => {
				this.childCall.answer();
			})
			.catch((error) => {
				// todo: We probably need to add hangup from current call and show a notification with error message
				console.error('Can\'t answer a child call', error);
			});
	}

	setReconnectingCameraId(id)
	{
		this.reconnectingCameraId = id;

		if (id)
		{
			this.updateCameraSettingsInCurrentCallAfterReconnecting(id);
		}
	}

	updateCameraSettingsInCurrentCallAfterReconnecting(cameraId)
	{
		if (this.currentCall.cameraId === cameraId)
		{
			return;
		}

		const devicesList = Hardware.getCameraList();

		if (!devicesList.find((device) => device.deviceId === cameraId))
		{
			return;
		}

		this.currentCall.setCameraId(cameraId);
		this.setReconnectingCameraId(null);
	}

	#onChildCallFirstMedia(e)
	{
		if (!this.childCall)
		{
			return;
		}

		this.#switchToChildCall();
		this.layoutService?.handleMediaEvent(e);
	}

	#onChildCallFirstUserJoined(e)
	{
		if (!this.childCall)
		{
			return;
		}

		this.#switchToChildCall();
		this.layoutService?.handleUserJoinEvent('onUserJoined', e, this.currentCall);
	}

	#clearSavedScreenStream()
	{
		if (this.savedScreenStream)
		{
			Util.stopMediaStream(this.savedScreenStream);
			this.savedScreenStream = null;
		}
	}

	#switchToChildCall()
	{
		if (!this.childCall)
		{
			return;
		}

		this.log('Finishing one-to-one call, switching to group call');

		const newCall = this.childCall;
		this.childCall = null;

		let previousRecordType = CallCommonRecordType.None;

		if (this.#isCommonRecordStarted())
		{
			previousRecordType = this.commonRecord.type;
			this.#stopCommonRecord();
		}

		this.viewPort.showButtons(['floorRequest', 'hangupOptions']);

		this.#removeChildCallEvents(newCall);

		this.removeCallEvents();
		const oldCall = this.currentCall;

		Analytics.getInstance().onFinishCall({
			...this.#getAnalyticsCallParams(),
			status: Analytics.AnalyticsStatus.privateToGroup,
			chatId: this.currentCall.associatedEntity.id,
			callUsersCount: this.getMaxActiveCallUsers().length,
			callLength: Util.getTimeInSeconds(this.currentCall.startDate),
		});

		oldCall.keepStreams = true;

		if (this.savedScreenStream && oldCall.clearScreenStream)
		{
			oldCall.clearScreenStream();
		}

		oldCall.hangup();

		this.currentCall = newCall;

		if (this.currentCall.associatedEntity && this.currentCall.associatedEntity.id && this.layoutService?.isFolded)
		{
			this.messengerFacade.openMessenger(this.currentCall.associatedEntity.id);
		}

		this.bindCallEvents();
		this.initSpeakerManager();
		this.createVideoStrategy();

		if (this.savedScreenStream)
		{
			const stream = this.savedScreenStream;

			if (this.currentCall.startScreenSharingWithStream)
			{
				this.currentCall.startScreenSharingWithStream(stream);
			}
			else
			{
				this.#clearSavedScreenStream();
				console.log('try to start screensharing, there is no startScreenSharingWithStream method in:', this.currentCall);
			}

			this.savedScreenStream = null;
		}

		// restart Follow-Up if it was started in one-to-one call
		if (oldCall.isCopilotActive && oldCall.isCopilotInitiator)
		{
			this.#onChangeStateCopilotAction(RecorderStatus.ENABLED);
		}

		// restart cloud recording if it was started in one-to-one call
		if (previousRecordType !== CallCommonRecordType.None)
		{
			this.#startCommonRecord(previousRecordType);
		}
	}

	checkDesktop()
	{
		if (Reflection.getClass('BX.Messenger.v2.Lib.DesktopManager'))
		{
			return new Promise((resolve) => {
				const desktop = BX.Messenger.v2.Lib.DesktopManager.getInstance();
				desktop.checkStatusInDifferentContext().then((result) => {
					resolve(result === false);
				});
			});
		}

		if (Reflection.getClass('BX.desktopUtils'))
		{
			return new Promise((resolve) => {
				BX.desktopUtils.runningCheck(
					() => resolve(false),
					() => resolve(true),
				);
			});
		}

		return Promise.resolve(true);
	}

	isMutedPopupAllowed()
	{
		if (!this.notificationService?.allowMutePopup || !this.currentCall)
		{
			return false;
		}

		const currentRoom = this.currentCall.currentRoom && this.currentCall.currentRoom();

		return !currentRoom || currentRoom.speaker == this.userId;
	}

	isConferencePageOpened(dialogId)
	{
		const tagPresent = LocalStorage.get(
			CallEngine.getSiteId(),
			CallEngine.getCurrentUserId(),
			CallEngine.getConferencePageTag(dialogId),
			'N',
		);

		return tagPresent === 'Y';
	}

	/**
	 * @param {Object} params
	 * @param {bool} [params.video = false]
	 */
	showIncomingCall(params)
	{
		if (!Type.isPlainObject(params))
		{
			params = {};
		}
		params.video = params.video === true;

		this.feedbackUiService?.destroy();

		const allowVideo = this.callWithLegacyMobile ? params.video === true : true;

		this.callNotification = new IncomingNotification({
			callerName: this.currentCall.associatedEntity.name,
			callerAvatar: this.currentCall.associatedEntity.avatar,
			callerType: this.currentCall.associatedEntity.advanced.chatType,
			callerColor: this.currentCall.associatedEntity.avatarColor,
			video: params.video,
			hasCamera: allowVideo,
			cameraState: allowVideo,
			microphoneState: !(this.currentCall.associatedEntity.userCounter > this.getMaxActiveMicrophonesCount()),
			zIndex: this.messengerFacade.getDefaultZIndex() + 200,
			onClose: this._onCallNotificationClose.bind(this),
			onDestroy: this._onCallNotificationDestroy.bind(this),
			onButtonClick: this._onCallNotificationButtonClick.bind(this),
			isMessengerOpen: this.messengerFacade.isMessengerOpen(),
		});

		this.callNotification.show();
		this.scheduleCancelNotification(false);

		this.messengerFacade.repeatSound(this.audioRingtone, 3500, true);
	}

	showIncomingConference()
	{
		this.callNotification = new ConferenceNotifications({
			zIndex: this.messengerFacade.getDefaultZIndex() + 200,
			callerName: this.currentCall.associatedEntity.name,
			callerAvatar: this.currentCall.associatedEntity.avatar,
			callerColor: this.currentCall.associatedEntity.avatarColor,
			onClose: this._onCallNotificationClose.bind(this),
			onDestroy: this._onCallNotificationDestroy.bind(this),
			onButtonClick: this._onCallConferenceNotificationButtonClick.bind(this),
		});

		this.callNotification.show();
		this.scheduleCancelNotification(true);

		this.messengerFacade.repeatSound(this.audioRingtone, 3500, true);
	}

	scheduleCancelNotification(isIncomingConference = false)
	{
		clearTimeout(this.hideIncomingCallTimeout);
		this.hideIncomingCallTimeout = setTimeout(() => {
			Analytics.getInstance().onJoinCall({
				callId: Util.getCallIdentifier(this.currentCall),
				callType: isIncomingConference ? Analytics.AnalyticsType.videoconf : this.getCallType(),
				status: Analytics.AnalyticsStatus.noAnswer,
				associatedEntity: this.currentCall.associatedEntity,
				isVpnActive: this.#isVpnConnected(),
			});

			if (this.callNotification)
			{
				this.callNotification.close();
			}

			if (this.currentCall)
			{
				this.#teardownCallConnection();
				this.currentCall = null;
			}
			this.#clearPromotedAdminTimeout();
		}, 30 * 1000);
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

	isUserAgentSupported()
	{
		if (DesktopApi.isDesktop())
		{
			return DesktopApi.getApiVersion() > 48;
		}

		if ('VoxImplant' in window)
		{
			return VoxImplant.getInstance().isRTCsupported();
		}

		return Util.isWebRTCSupported();
	}

	getBlockedButtons(needBlockAddButton = false): string[]
	{
		const result = ['camera', 'record', 'copilot'];
		if (!this.messengerFacade.showUserSelector || needBlockAddButton)
		{
			result.push('add');
		}

		return result;
	}

	prepareCall(callData)
	{
		this.preparedCall = callData;
	}

	startCall(dialogId, video, chatInfo, options = {})
	{
		if (!this.isUserAgentSupported())
		{
			this.notificationService?.showUnsupportedNotification();

			return;
		}

		if (this.viewPort || this.currentCall)
		{
			this.unfold();

			return;
		}

		if (this.initCallPromise)
		{
			return;
		}

		this.onConnectToCallClick = Date.now();

		this.feedbackUiService?.destroy();

		const call = CallEngineLegacy.getCallWithDialogId(dialogId) || CallEngine.getCallWithDialogId(dialogId);
		if (call)
		{
			this.joinCall(call.id, call.uuid, video, { chatInfo: call.associatedEntity, mustCreate: true });

			return;
		}

		let provider = Provider.Plain;
		if (dialogId.toString().startsWith('chat'))
		{
			provider = Util.getConferenceProvider();
		}

		const isPlainCall = provider === Provider.Plain;
		const isLegacyCall = Util.isLegacyCall(provider);

		const callTokenPromise = isLegacyCall ? Promise.resolve() : CallTokenManager.getToken(chatInfo.chatId);

		const isCallPrepared = this.preparedCall?.dialogId === dialogId;

		const debug1 = Date.now();
		this.initCallPromise = this.messengerFacade
			.openMessenger(dialogId)
			.then(() => {
				return Hardware.init();
			})
			.then(async () => {
				if (video && isCallPrepared)
				{
					this.layoutService?.prepareLocalStream({
						provider,
						Hardware,
						CallStreamManager,
						UnsupportedBrowserFeatures,
						MediaRenderer,
					});
				}

				this.createContainer();
				const hiddenButtons = this.#getHiddenCallButtons(isPlainCall);

				Hardware.isCameraOn = video;

				const isCopilotFeaturesEnabled = (!isLegacyCall && isPlainCall && CallSettingsManager.plainCallFollowUpEnabled) || !isPlainCall;
				const isCloudRecordFeaturesEnabled = DesktopApi.isDesktop()
					|| (isPlainCall && CallSettingsManager.plainCallCloudRecordingEnabled)
					|| !isPlainCall;

				const isBitrixProvider = provider === Provider.Bitrix;
				this.viewPort = await this.#buildCallViewPort({
					hiddenButtons,
					isCopilotFeaturesEnabled,
					isCloudRecordFeaturesEnabled,
					layout: dialogId.toString().startsWith('chat') ? ViewLayout.Grid : ViewLayout.Centered,
					showShareButton: this.featureScreenSharing !== FeatureState.Disabled,
					blockedButtons: this.getBlockedButtons(isPlainCall),
					showAddUserButtonInList: isPlainCall,
					isCopilotActive: false,
					externalSpeakerManagement: isBitrixProvider,
				});

				this.bindCallViewEvents();

				if (isCallPrepared)
				{
					this.viewPort.isPreparing = true;
					if (this.preparedCall.user)
					{
						this.viewPort.appendUsers({
							[this.preparedCall.user]: UserState.Calling,
						});
					}
					this.viewPort.updateUserData(this.preparedCall.userData);
					Util.setUserData(this.preparedCall.userData);
					if (this.localStream)
					{
						this.layoutService?.setLocalStream(provider, MediaRenderer, Hardware);
					}

					const style = 'background-color: #AA00AA; color: white;';
					console.log(
						`%c[debug] Time from click 'Start call' to show call card: ${Date.now() - this.onConnectToCallClick} ms`,
						style,
					);
					this.onCallViewRenderToMediaReceived = Date.now();

					this.viewPort.show();
				}

				if (video && !Hardware.hasCamera())
				{
					this.notificationService?.showNotification(BX.message('IM_CALL_ERROR_NO_CAMERA'));
					video = false;
				}

				return callTokenPromise;
			})
			.then((callToken) =>
			{
				if (!isPlainCall)
				{
					return callToken;
				}

				return Hardware.checkMicrophonePermission().then(() => callToken);
			})
			.then((callToken) => {
				if (!Util.isLegacyCall(provider) && !callToken)
				{
					throw new Error('Empty callToken');
				}

				const callEngine = isLegacyCall ? CallEngineLegacy : CallEngine;

				return callEngine.createCall({
					entityType: 'chat',
					entityId: dialogId,
					provider,
					videoEnabled: Boolean(video),
					enableMicAutoParameters: Hardware.enableMicAutoParameters,
					joinExisting: false,
					debug: this.debug,
					token: callToken,
					chatInfo,
					invitePeriod: options.invitePeriod,
				});
			})
			.then((e) => {
				if (!this.initCallPromise)
				{
					return;
				}

				const debug2 = Date.now();
				this.currentCall = e.call;
				this.currentCallIsNew = e.isNew;

				this.#clearPromotedAdminTimeout();

				if (!this.viewPort)
				{
					this.leaveCurrentCall(true);

					return;
				}

				if (isLegacyCall)
				{
					this.#onUpdateCallCopilotState(this.currentCall.isCopilotActive);
				}

				this.log(`Call creation time: ${(debug2 - debug1) / 1000} seconds`);

				if (this.currentCall.isCopilotActive && isLegacyCall)
				{
					this.sendStartCopilotRecordAnalytics({ isAutostart: true });
				}

				this.#applyDefaultDevicesToCurrentCall();

				this.autoCloseCallView = true;
				this.bindCallEvents();
				this.initSpeakerManager();
				this.createVideoStrategy();

				if (isCallPrepared)
				{
					this.viewPort.isPreparing = false;
				}

				if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
				{
					this.viewPort.appendUsers(this.currentCall.getUsers());
					this.updateCallViewUsers(this.currentCall.id, this.getCallUsers(true));
				}

				if (!isCallPrepared)
				{
					const style = 'background-color: #AA00AA; color: white;';
					console.log(
						`%c[debug] Time from click 'Start call' to show call card: ${Date.now() - this.onConnectToCallClick} ms`,
						style,
					);
					this.onCallViewRenderToMediaReceived = Date.now();
				}

				this.viewPort.show();

				this.copilotUiService?.showNotify({
					isCopilotActive: this.currentCall.isCopilotActive,
					provider: this.currentCall.provider,
					callId: Util.getCallIdentifier(this.currentCall),
					force: true,
				});

				this.promoService?.showDocumentPromo(
					this.viewPort?.buttons?.document?.elements?.root?.querySelector(
						'.bx-messenger-videocall-panel-icon',
					),
					{ isFolded: this.layoutService?.isFolded },
				);
				this.promoService?.showMaskPromo();
				this.#showCloudRecordPromo();

				if (this.currentCallIsNew)
				{
					this.log('Inviting users');
					Analytics.getInstance().onStartCall({
						...this.#getAnalyticsCallParams(),
						mediaParams: {
							video: Hardware.isCameraOn,
							audio: !Hardware.isMicrophoneMuted,
						},
						status: Analytics.AnalyticsStatus.success,
						associatedEntity: this.currentCall.associatedEntity,
						isCopilotActive: false,
						isVpnActive: this.#isVpnConnected(),
					});

					this.currentCall.inviteUsers({ users: isLegacyCall ? this.getCallUsers() : [] });

					this.messengerFacade.repeatSound('dialtone', 5000, true);
				}
				else
				{
					this.log('Joining existing call');
					Analytics.getInstance().onJoinCall({
						...this.#getAnalyticsCallParams(),
						mediaParams: {
							video: Hardware.isCameraOn,
							audio: !Hardware.isMicrophoneMuted,
						},
						section: Analytics.AnalyticsSection.chatWindow,
						element: Analytics.AnalyticsElement.videocall,
						status: Analytics.AnalyticsStatus.success,
						associatedEntity: this.currentCall.associatedEntity,
						isVpnActive: this.#isVpnConnected(),
					});

					if (this.currentCall.associatedEntity.userCounter > this.getMaxActiveMicrophonesCount())
					{
						Hardware.isMicrophoneMuted = true;
						this.notificationService?.showAutoMicMuteNotification(
							this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon,
						);
					}
					this.currentCall.answer();
				}

				this.checkVpnStatus();
				this._onUpdateLastUsedCameraId();
			})
			.catch(async (error) => {
				if (!this.initCallPromise)
				{
					return;
				}

				console.error(error);

				let errorCode = Util.getCallConnectionErrorCode(error);
				const errorMessage = Util.getCallConnectionErrorMessage(error);

				if (errorCode === 'user_is_busy')
				{
					this.leaveCurrentCall();
				}
				else
				{
					if (errorCode === 'UNKNOWN_ERROR' && error?.message)
					{
						errorCode = getUnknownErrorType(error?.message);
					}

					await accidentLogger.addLog(error, errorCode);

					Analytics.getInstance().onStartCallError({
						callType: this.getCallType(provider),
						errorCode,
						errorMessage,
						isVpnActive: this.#isVpnConnected(),
					});

					this.#onCallFailure({
						code: errorCode,
						message: error.message || '',
					});

					this.layoutService?.stopLocalStream();
				}
			})
			.finally(() =>
			{
				this.initCallPromise = null;
				this.preparedCall = null;
			});
	}

	closeCallNotification()
	{
		if (this.callNotification)
		{
			this.callNotification.close();
		}
	}

	joinCall(
		callId: number,
		callUuid: string,
		video: boolean,
		options: { joinAsViewer?: boolean, chatInfo: {}, mustCreate?: Boolean },
	)
	{
		const joinAsViewer = BX.prop.getBoolean(options, 'joinAsViewer', false);

		if (!this.isUserAgentSupported())
		{
			this.notificationService?.showUnsupportedNotification();

			return;
		}

		const hasActiveCall = this.viewPort && this.currentCall;

		if (hasActiveCall && this.currentCall.uuid === callUuid)
		{
			this.unfold();

			return;
		}

		if (hasActiveCall && this.currentCall.uuid !== callUuid)
		{
			this.leaveCurrentCall();
		}

		if (this.initCallPromise)
		{
			return;
		}

		this.onConnectToCallClick = Date.now();

		const isCallPrepared = this.preparedCall?.dialogId === options.chatInfo.id;
		const isGroupCall = options.chatInfo.id.toString().startsWith('chat');
		const call = CallEngineLegacy.calls[callId] || CallEngine.calls[callUuid];
		const defaultProvider = isGroupCall ? Util.getConferenceProvider() : Provider.Plain;
		const provider = call?.provider || defaultProvider;
		const isLegacyCall = Util.isLegacyCall(provider, call?.scheme);

		this.log(`Joining call ${callUuid}`);

		this.initCallPromise = isLegacyCall ? Promise.resolve() : CallTokenManager.getToken(options.chatInfo.chatId);

		this.initCallPromise
			.then((callToken) => {
				const config = {
					provider,
					entityType: 'chat',
					entityId: options.chatInfo.id,
					videoEnabled: Boolean(video),
					enableMicAutoParameters: Hardware.enableMicAutoParameters,
					joinExisting: true,
					roomId: callUuid,
					debug: this.debug,
					token: callToken,
					chatInfo: options.chatInfo,
				};

				return isLegacyCall
					? CallEngineLegacy.getCallWithId(callId)
					: CallEngine.getCallWithId(callUuid, config);
			})
			.then((result) => {
				if (!this.currentCall || this.currentCall.uuid !== callUuid)
				{
					Util.setUserData(result.call.userData);
					this.currentCall = result.call;
				}

				this.#clearPromotedAdminTimeout();

				return this.messengerFacade.openMessenger(options.chatInfo.id);
			})
			.then(() => {
				return Hardware.init();
			})
			.then(async () => {
				this.createContainer();

				const hiddenButtons = this.#getHiddenCallButtons(this.currentCall.provider === Provider.Plain);

				Hardware.isCameraOn = Boolean(video);

				const isBitrixCall = this.currentCall.provider === Provider.Bitrix;
				this.viewPort = await this.#buildCallViewPort({
					layout: isGroupCall ? ViewLayout.Grid : ViewLayout.Centered,
					hiddenButtons,
					blockedButtons: this.getBlockedButtons(this.currentCall.provider === Provider.Plain),
					showAddUserButtonInList: this.currentCall.provider === Provider.Plain,
					isCloudRecordFeaturesEnabled: this.currentCall.isCloudRecordFeaturesEnabled,
					isCopilotFeaturesEnabled: this.currentCall.isCopilotFeaturesEnabled,
					isCopilotActive: this.currentCall.isCopilotActive,
					externalSpeakerManagement: isBitrixCall,
				});

				this.autoCloseCallView = true;
				this.bindCallViewEvents();
				this.initSpeakerManager();

				if (isCallPrepared)
				{
					this.viewPort.isPreparing = true;
					if (this.preparedCall.user)
					{
						this.viewPort.appendUsers({
							[this.preparedCall.user]: UserState.Calling,
						});
					}
					this.viewPort.updateUserData(this.preparedCall.userData);
					Util.setUserData(this.preparedCall.userData);
				}

				if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
				{
					this.viewPort.appendUsers(this.currentCall.getUsers());
					this.updateCallViewUsers(this.currentCall.id, this.getCallUsers(true));
				}

				const style = 'background-color: #AA00AA; color: white;';
				console.log(
					`%c[debug] Time from click 'Join call' to show call card: ${Date.now() - this.onConnectToCallClick} ms`,
					style,
				);
				this.onCallViewRenderToMediaReceived = Date.now();

				this.viewPort.show();
				this.promoService?.showDocumentPromo(
					this.viewPort?.buttons?.document?.elements?.root?.querySelector(
						'.bx-messenger-videocall-panel-icon',
					),
					{ isFolded: this.layoutService?.isFolded },
				);
				this.copilotUiService?.showNotify({
					isCopilotActive: this.currentCall.isCopilotActive,
					provider: this.currentCall.provider,
					callId: Util.getCallIdentifier(this.currentCall),
				});
				this.#showCloudRecordPromo();
				this.checkVpnStatus();

				this.#applyDefaultDevicesToCurrentCall();

				this.bindCallEvents();
				this.createVideoStrategy();

				if (video && !Hardware.hasCamera())
				{
					this.notificationService?.showNotification(BX.message('IM_CALL_ERROR_NO_CAMERA'));
					video = false;
				}

				if (this.currentCall.associatedEntity.userCounter > this.getMaxActiveMicrophonesCount())
				{
					Hardware.isMicrophoneMuted = true;
					this.notificationService?.showAutoMicMuteNotification(
						this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon,
					);
				}

				this.currentCall.answer({
					joinAsViewer,
				});

				this._onUpdateLastUsedCameraId();

				Analytics.getInstance().onJoinCall({
					...this.#getAnalyticsCallParams(),
					mediaParams: {
						video: Hardware.isCameraOn,
						audio: !Hardware.isMicrophoneMuted,
					},
					section: Analytics.AnalyticsSection.chatList,
					element: Analytics.AnalyticsElement.joinButton,
					status: Analytics.AnalyticsStatus.success,
					associatedEntity: this.currentCall.associatedEntity,
					isVpnActive: this.#isVpnConnected(),
				});

				if (isCallPrepared && this.viewPort)
				{
					this.viewPort.isPreparing = false;
				}

				this.initCallPromise = null;
			})
			.catch(async (error) => {
				this.initCallPromise = null;
				await this.#handleJoinCallError(error);
			});
	}

	leaveCurrentCall(force, finishCall = false) {
		this.initCallPromise = null;
		Util.abortGetCallConnectionData();

		if (this.#isLocalRecordStarted())
		{
			Analytics.getInstance().onRecordStop({
				...this.#getAnalyticsCallParams(),
				subSection: finishCall
					? Analytics.AnalyticsSubSection.contextMenu
					: Analytics.AnalyticsSubSection.window,
				element: finishCall
					? Analytics.AnalyticsElement.finishForAllButton
					: Analytics.AnalyticsElement.disconnectButton,
				recordTime: Util.getRecordTimeText(this.commonRecord.info, true),
			});
		}

		this.#stopCommonRecord();

		if (this.viewPort)
		{
			this.viewPort.releaseLocalMedia();
		}

		if (this.currentCall)
		{
			this.answeredOrDeclinedCalls.delete(Util.getCallIdentifier(this.currentCall));
			this.currentCall.hangup(force, '', finishCall);
			if (force)
			{
				this.currentCall = null;
			}

			this.#clearPromotedAdminTimeout();
		}

		if (this.childCall)
		{
			this.#removeChildCallEvents(this.childCall);
			this.childCall.hangup(force, '', finishCall);
			this.childCall = null;
		}

		this.#clearSavedScreenStream();

		if (this.viewPort)
		{
			this.viewPort.close();
		}

		this.#stopAllMediaStreams();
	}

	hasActiveCall()
	{
		return Boolean((this.currentCall && this.currentCall.isAnyoneParticipating()) || this.viewPort);
	}

	hasVisibleCall()
	{
		return Boolean(this.viewPort && this.viewPort.visible && this.viewPort.size == ViewSize.Full);
	}

	/**
	 * @group CommonRecord
	 */
	#canLocalRecord(): boolean
	{
		const isDesktop = DesktopApi.isDesktop();
		const isValidApi = DesktopApi.getApiVersion() >= 54;

		// It's a desktop with the right API version.
		if (!isDesktop || !isValidApi)
		{
			return false;
		}

		// If cloud recording is disabled, can record local
		if (!CallCloudRecord.serviceEnabled)
		{
			return true;
		}

		// If the cloud recording tariff is not available, can record local
		if (!CallCloudRecord.tariffAvailable)
		{
			return true;
		}

		// If the cloud recording is active, and it is a paid plan, then we turn it on only in plain
		return this.currentCall.provider === Provider.Plain;
	}

	/**
	 * @group CommonRecord
	 */
	#canCloudRecord(): boolean
	{
		const isPlainCall = this.currentCall.provider === Provider.Plain;
		const cloudRecordingEnabled =			(isPlainCall && CallSettingsManager.plainCallCloudRecordingEnabled) || !isPlainCall;

		return CallCloudRecord.serviceEnabled && CallCloudRecord.tariffAvailable && cloudRecordingEnabled;
	}

	/**
	 * @group CommonRecord
	 */
	#canCommonRecord(): boolean {
		return this.#canLocalRecord() || this.#canCloudRecord();
	}

	/**
	 * @group CommonRecord
	 */
	#isLocalRecordStarted(): boolean
	{
		return (
			this.#canLocalRecord()
			&& this.commonRecord.state != CallCommonRecordState.Stopped
			&& this.commonRecord.state != CallCommonRecordState.Destroyed
		);
	}

	/**
	 * @group CommonRecord
	 */
	#isCommonRecordStarted(): boolean
	{
		return (
			this.#canCommonRecord()
			&& this.commonRecord.state != CallCommonRecordState.Stopped
			&& this.commonRecord.state != CallCommonRecordState.Destroyed
		);
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
						const newDeviceId = Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audioinput');
						this.currentCall.setMicrophoneId(newDeviceId);
						this.viewPort.setMicrophoneId(newDeviceId);
					}

					break;
				case 'videoinput':
					if (deviceInfo.deviceId === 'default' || isForceUse)
					{
						this.currentCall.setCameraId(deviceInfo.deviceId);
					}

					if (this.reconnectingCameraId === deviceInfo.deviceId && !Hardware.isCameraOn)
					{
						this.updateCameraSettingsInCurrentCallAfterReconnecting(deviceInfo.deviceId);
					}

					break;
				case 'audiooutput':
					if (!this.viewPort)
					{
						break;
					}
					if (this.activeSpeakerManager)
					{
						const newDeviceId = (deviceInfo.deviceId === 'default' || isForceUse)
							? Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audiooutput')
							: deviceInfo.deviceId;

						if (newDeviceId)
						{
							const audioOutputCount = deviceList.filter((device) => device.kind === 'audiooutput').length;

							this.activeSpeakerManager.onDeviceAdded(newDeviceId, audioOutputCount === 1);
						}

						break;
					}

					if (deviceInfo.deviceId === 'default' || isForceUse)
					{
						const newDeviceId = Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audiooutput');
						this.viewPort.setSpeakerId(newDeviceId);
					}
					else if (!this.viewPort.speakerId)
					{
						this.viewPort.setSpeakerId(deviceInfo.deviceId);
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
						const microphoneIds = Object.keys(Hardware.microphoneList);
						let deviceId;

						if (microphoneIds.includes('default'))
						{
							const deviceGroup = Hardware.getDeviceGroupIdByDeviceId('default', 'audioinput');
							deviceId = Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audioinput');
						}

						if (!deviceId)
						{
							deviceId = microphoneIds.length > 0 ? microphoneIds[0] : '';
						}

						this.currentCall.setMicrophoneId(deviceId);

						if (this.currentCall.provider === Provider.Bitrix)
						{
							this.viewPort.setMicrophoneId(deviceId);
						}
					}

					break;
				case 'videoinput':
					if (this.currentCall.cameraId == deviceInfo.deviceId)
					{
						const cameraIds = Object.keys(Hardware.cameraList);
						this.currentCall.setCameraId(cameraIds.length > 0 ? cameraIds[0] : '');
					}

					break;
				case 'audiooutput':
					if (this.activeSpeakerManager)
					{
						this.activeSpeakerManager.onDeviceLost(deviceInfo.deviceId);
					}
					else if (this.viewPort && this.viewPort.speakerId == deviceInfo.deviceId)
					{
						const speakerIds = Object.keys(Hardware.audioOutputList);
						let deviceId;

						if (speakerIds.includes('default'))
						{
							const deviceGroup = Hardware.getDeviceGroupIdByDeviceId('default', 'audiooutput');
							deviceId = Hardware.getDefaultDeviceIdByGroupId(deviceGroup, 'audiooutput');
						}

						if (!deviceId)
						{
							deviceId = speakerIds.length > 0 ? speakerIds[0] : '';
						}

						this.viewPort.setSpeakerId(deviceId);
					}

					break;
			}
		}
	}

	showChat()
	{
		this.layoutService.showChat();
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

	fold(foldedCallTitle)
	{
		if (this.layoutService.isFolded || (DesktopApi.isDesktop() && this.floatingWindowService?.hasFloatingVideo()))
		{
			return;
		}

		if (!foldedCallTitle && this.currentCall)
		{
			foldedCallTitle = Text.decode(this.currentCall.associatedEntity.name);
		}
		this.callViewState = ViewState.Folded;
		this.layoutService.fold(foldedCallTitle);

		if (this.callStore)
		{
			try
			{
				this.callStore.setViewState('Folded');
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in fold:', error);
			}
		}

		BX.onCustomEvent(this, 'CallController::onFold', {});
	}

	setCallEditorMaxWidth(maxWidth) {
		this.documentEditorService?.setMaxWidth(maxWidth);
	}

	showDocumentsMenu()
	{
		Analytics.getInstance().onDocumentBtnClick({
			...this.#getAnalyticsCallParams(),
		});

		const bindElement = this.viewPort?.buttons?.document?.elements?.root;
		const callContext = {
			callId: this.currentCall?.id,
			callUuid: this.currentCall?.uuid,
			associatedEntityId: this.currentCall?.associatedEntity?.id,
		};

		this.documentEditorService?.showDocumentsMenu(bindElement, callContext);
	}

	maybeShowDocumentEditor(params, articleCode)
	{
		this.documentEditorService?.maybeShowDocumentEditor(
			{
				callId: this.currentCall?.id,
				callUuid: this.currentCall?.uuid,
				associatedEntityId: this.currentCall?.associatedEntity?.id,
				...params,
			},
			articleCode,
		);
	}

	showDocumentEditor(params)
	{
		this.documentEditorService?.showDocumentEditor({
			callId: this.currentCall?.id,
			callUuid: this.currentCall?.uuid,
			associatedEntityId: this.currentCall?.associatedEntity?.id,
			...params,
		});
	}

	closeDocumentEditor()
	{
		Analytics.getInstance().onDocumentClose({
			...this.#getAnalyticsCallParams(),
			type: this.documentEditorService?.getDocumentType() ?? '',
		});

		if (this.viewPort)
		{
			this.buttonStateService?.activateDocumentButton(false);
		}

		return this.documentEditorService?.closeDocumentEditor();
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

	updateWindowFocusState(isActive)
	{
		this.layoutService?.updateWindowFocusState(isActive);
	}

	_ensureDocumentEditorClosed()
	{
		return new Promise((resolve, reject) => {
			if (!this.documentEditorService?.hasSidebar())
			{
				return resolve();
			}

			const messageBox = new MessageBox({
				message: BX.message('IM_CALL_CLOSE_DOCUMENT_EDITOR_TO_ANSWER'),
				buttons: MessageBoxButtons.OK_CANCEL,
				okCaption: BX.message('IM_CALL_CLOSE_DOCUMENT_EDITOR_YES'),
				cancelCaption: BX.message('IM_CALL_CLOSE_DOCUMENT_EDITOR_NO'),
				onOk: () => {
					this.closeDocumentEditor().then(() => resolve());

					return true;
				},
				onCancel: () => {
					reject();

					return true;
				},
			});
			messageBox.show();
		});
	}

	unfold(options = {})
	{
		this.layoutService.unfold(options);
		this.callViewState = ViewState.Opened;

		if (this.callStore)
		{
			try
			{
				this.callStore.setViewState('Opened');
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in unfold:', error);
			}
		}

		BX.onCustomEvent(this, 'CallController::onUnfold', {});
	}

	isFullScreen()
	{
		return this.layoutService.isFullScreen();
	}

	toggleFullScreen()
	{
		this.layoutService.toggleFullScreen();
	}

	#onFullScreenChange(event)
	{
		const isPlainCall = this.currentCall?.provider === Provider.Plain;
		const isBitrixCall = this.currentCall?.provider === Provider.Bitrix;
		const isLegacyCall = Util.isLegacyCall(this.currentCall?.provider, this.currentCall?.scheme);
		const isCopilotFeaturesEnabled = (!isLegacyCall && isPlainCall && this.currentCall?.isCopilotFeaturesEnabled) || isBitrixCall;
		const shouldBlockCopilot = isCopilotFeaturesEnabled && CallAI.settingsEnabled && !CallAI.tariffAvailable;

		this.buttonStateService?.updateForFullScreenChange(event.isFullScreen, {
			provider: this.currentCall?.provider,
			isCopilotFeaturesEnabled: shouldBlockCopilot,
			isCloudRecordFeaturesEnabled: !CallCloudRecord.tariffAvailable,
			hasDocumentButton: Boolean(Util.getResumesArticleCode() && Util.getDocumentsArticleCode()),
		});

		if (this.callStore)
		{
			try
			{
				this.callStore.setFullScreen(event.isFullScreen);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in #onFullScreenChange:', error);
			}
		}
	}

	enterFullScreen()
	{
		this.layoutService.enterFullScreen();
	}

	exitFullScreen()
	{
		this.layoutService.exitFullScreen();
	}

	/**
	 * @group CommonRecord
	 */
	#showCloudRecordPromo()
	{
		const isPlainCall = this.currentCall?.provider === Provider.Plain;
		const isBitrixCall = this.currentCall?.provider === Provider.Bitrix;
		const cloudRecordingEnabled = (isPlainCall && this.currentCall?.isCloudRecordFeaturesEnabled) || isBitrixCall;

		if (this.hasActiveCall() && CallCloudRecord.serviceEnabled && cloudRecordingEnabled)
		{
			this.recordingUiService?.showCloudRecordPromo(
				this.currentCall.isCloudRecordFeaturesEnabled,
				this.currentCall.id,
			);
		}
	}

	/**
	 * @group CommonRecord
	 */
	#getDefaultCommonRecord()
	{
		return {
			state: CallCommonRecordState.Stopped,
			type: CallCommonRecordType.None,
			initiatorId: null,
			info: null,
		};
	}

	/**
	 * @group CommonRecord
	 */
	#startCommonRecord(type)
	{
		const isPlainCall = this.currentCall.provider === Provider.Plain;
		const isBitrixCall = this.currentCall.provider === Provider.Bitrix;
		const cloudRecordingEnabled = (isPlainCall && this.currentCall.isCloudRecordFeaturesEnabled) || isBitrixCall;

		this.commonRecord.type = type;

		if (CallCloudRecord.serviceEnabled && cloudRecordingEnabled)
		{
			const kind = type === 'audio' ? CloudRecordKind.AUDIO : CloudRecordKind.VIDEO;
			this.buttonStateService?.blockRecordButton();
			this.currentCall.setCloudRecordState(CloudRecordStatus.STARTED, kind);

			return;
		}

		this.buttonStateService?.activateRecordButton(true);

		this.currentCall.sendLocalRecordState({
			action: CallCommonRecordState.Started,
			type: this.commonRecord.type,
			date: new Date(),
		});

		this.commonRecord.state = CallCommonRecordState.Started;
	}

	/**
	 * @group CommonRecord
	 */
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
			state !== CallCommonRecordState.Stopped
			&& initiatorId === this.userId
			&& this.currentCall
			&& this.currentCall.isAnyoneParticipating()
		)
		{
			this.currentCall.sendLocalRecordState({
				action: CallCommonRecordState.Stopped,
				userId: this.userId,
			});
		}
	}

	// event handlers

	_onCallNotificationClose()
	{
		clearTimeout(this.hideIncomingCallTimeout);
		this.messengerFacade.stopRepeatSound(this.audioRingtone);
		if (this.callNotification)
		{
			this.callNotification.destroy();
		}
	}

	_onCallNotificationDestroy()
	{
		this.messengerFacade.stopRepeatSound(this.audioRingtone);
		this.callNotification = null;
	}

	async _onCallNotificationButtonClick(e)
	{
		const data = e.data;
		clearTimeout(this.hideIncomingCallTimeout);
		this.callNotification.close();
		switch (data.button)
		{
			case 'answer':
				if (this.currentCall && !this.answeredOrDeclinedCalls.has(Util.getCallIdentifier(this.currentCall)))
				{
					this.answeredOrDeclinedCalls.add(Util.getCallIdentifier(this.currentCall));
					const callParams = {
						id: this.currentCall?.id,
						uuid: this.currentCall?.uuid,
						scheme: this.currentCall?.scheme || CallScheme.classic,
					};

					if (!DesktopApi.isDesktop())
					{
						this.onAnswerButtonClick(data.mediaParams, callParams);

						return;
					}

					await DesktopApi.showBrowserWindow();

					if (DesktopApi.isFeatureSupported(DesktopFeature.portalTabActivation.id))
					{
						await DesktopApi.handlePortalTabActivation();
					}

					if (DesktopApi.shouldActivateTabWithChatPage())
					{
						await DesktopApi.setTabWithChatPageActive();
					}

					DesktopBroadcastManager.getInstance().sendActionMessage({
						action: DesktopBroadcastAction.answerButtonClick,
						params: {
							mediaParams: data.mediaParams,
							callParams,
						},
					});
				}
				break;
			case 'decline':
				if (this.currentCall)
				{
					const callId = Util.getCallIdentifier(this.currentCall);
					this.answeredOrDeclinedCalls.add(callId);
					this.ignoreDeclinedCallsTimeout[callId] = setTimeout(
						() => this.answeredOrDeclinedCalls.delete(callId),
						15000,
					);
					this.#teardownCallConnection();

					Analytics.getInstance().onJoinCall({
						callId,
						callType: this.getCallType(),
						mediaParams: {
							video: Hardware.isCameraOn,
							audio: !Hardware.isMicrophoneMuted,
						},
						section: Analytics.AnalyticsSection.callPopup,
						element: Analytics.AnalyticsElement.answerButton,
						status: Analytics.AnalyticsStatus.decline,
						associatedEntity: this.currentCall.associatedEntity,
						isVpnActive: this.#isVpnConnected(),
					});

					this.currentCall.decline(603);
					this.currentCall = null;

					this.#clearPromotedAdminTimeout();
				}
				break;
		}
	}

	onAnswerButtonClick(mediaParams, callParams)
	{
		if (!this.currentCall)
		{
			return;
		}

		const isLegacyCall = callParams.scheme === CallScheme.classic;
		const currentCallPromise = isLegacyCall
			? Promise.resolve()
			: CallTokenManager.getToken(this.currentCall.associatedEntity.chatId);

		currentCallPromise
			.then((callToken) => {
				const config = {
					provider: this.currentCall.provider,
					entityType: 'chat',
					entityId: this.currentCall.associatedEntity.id,
					videoEnabled: Boolean(mediaParams.video),
					enableMicAutoParameters: Hardware.enableMicAutoParameters,
					joinExisting: true,
					roomId: callParams.uuid,
					debug: this.debug,
					token: callToken,
					chatInfo: this.currentCall.associatedEntity,
				};

				return isLegacyCall
					? CallEngineLegacy.getCallWithId(callParams.id)
					: CallEngine.getCallWithId(callParams.uuid, config);
			})
			.then((result) => {
				if (DesktopApi.isDesktop())
				{
					DesktopApi.activateWindow();
				}

				if (!this.isUserAgentSupported())
				{
					this.log('Error: unsupported user agent');
					this.#teardownCallConnection();
					this.currentCall.decline();
					this.currentCall = null;

					this.#clearPromotedAdminTimeout();

					this.notificationService?.showUnsupportedNotification();

					return;
				}

				Analytics.getInstance().onJoinCall({
					...this.#getAnalyticsCallParams(),
					mediaParams,
					section: Analytics.AnalyticsSection.callPopup,
					element: Analytics.AnalyticsElement.answerButton,
					status: Analytics.AnalyticsStatus.success,
					associatedEntity: this.currentCall.associatedEntity,
					isVpnActive: this.#isVpnConnected(),
				});

				if (this.viewPort)
				{
					this.viewPort.destroy();
				}

				const dialogId = this.currentCall.associatedEntity && this.currentCall.associatedEntity.id
					? this.currentCall.associatedEntity.id
					: false;
				const isGroupCall = dialogId.toString().startsWith('chat');
				this._ensureDocumentEditorClosed()
					.then(() => {
						return this.messengerFacade.openMessenger(dialogId, true);
					})
					.then(() => {
						return Hardware.init();
					})
					.then(async () => {
						if (!this.currentCall)
						{
							this.log('The call was destroyed while being answered');

							return;
						}

						this.createContainer();
						const hiddenButtons = this.#getHiddenCallButtons(this.currentCall.provider === Provider.Plain);
						Hardware.isCameraOn = mediaParams.video && Hardware.hasCamera();

						const isBitrixCall = this.currentCall.provider === Provider.Bitrix;

						this.viewPort = await this.#buildCallViewPort({
							users: this.currentCall.users,
							userStates: this.currentCall.getUsers(),
							layout: isGroupCall ? ViewLayout.Grid : ViewLayout.Centered,
							hiddenButtons,
							blockedButtons: this.getBlockedButtons(this.currentCall.provider === Provider.Plain),
							showAddUserButtonInList: this.currentCall.provider === Provider.Plain,
							isCloudRecordFeaturesEnabled: this.currentCall.isCloudRecordFeaturesEnabled,
							isCopilotFeaturesEnabled: this.currentCall.isCopilotFeaturesEnabled,
							isCopilotActive: this.currentCall.isCopilotActive,
							externalSpeakerManagement: isBitrixCall,
						});

						this.autoCloseCallView = true;
						if (this.callWithLegacyMobile)
						{
							this.viewPort.blockAddUser();
						}

						if (this.callStore)
						{
							try
							{
								this.callStore.initCall({
									callId: this.currentCall.id,
									callUuid: this.currentCall.uuid,
									callProvider: this.currentCall.provider,
									callScheme: this.currentCall.scheme,
									callType: this.currentCall.type,
									associatedEntityId: this.currentCall.associatedEntity?.id,
									associatedEntityType: this.currentCall.associatedEntity?.type,
									isIncoming: this.currentCall.direction === 'Incoming',
									localUserId: this.userId,
								});
								this.callStore.setUiState('Connected');
							}
							catch (error)
							{
								console.error('[call.store] Pinia write failed in onAnswerButtonClick:', error);
							}
						}

						this.bindCallViewEvents();
						this.initSpeakerManager();

						if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
						{
							this.updateCallViewUsers(this.currentCall.id, this.getCallUsers(true));
						}
						else
						{
							if (Reflection.getClass('BX.Messenger.v2.Lib.CallManager'))
							{
								const currentUser = BX.Messenger.v2.Lib.CallManager.getInstance().getCurrentUser();
								this.viewPort.updateUserData({ [this.userId]: currentUser });
							}

							if (!isGroupCall)
							{
								const { id, name, avatar } = this.currentCall.associatedEntity;
								const user = { name, avatar_hr: avatar };
								this.viewPort.updateUserData({ [id]: user });
								this.viewPort.addUser(id, UserState.Connected);
							}
						}

						this.viewPort.show();
						this.promoService?.showDocumentPromo(
							this.viewPort?.buttons?.document?.elements?.root?.querySelector(
								'.bx-messenger-videocall-panel-icon',
							),
							{ isFolded: this.layoutService?.isFolded },
						);
						this.promoService?.showMaskPromo();
						this.copilotUiService?.showNotify({
							isCopilotActive: this.currentCall.isCopilotActive,
							provider: this.currentCall.provider,
							callId: Util.getCallIdentifier(this.currentCall),
						});
						this.#showCloudRecordPromo();
						this.checkVpnStatus();

						this.#applyDefaultDevicesToCurrentCall();

						Hardware.isMicrophoneMuted = !mediaParams.audio;

						this.currentCall.answer({
							enableMicAutoParameters: Hardware.enableMicAutoParameters,
						});

						this.createVideoStrategy();

						this._onUpdateLastUsedCameraId();
					})
					.catch(async (error) => {
						await this.#handleJoinCallError(error);
					});
			})
			.catch(async (error) => {
				await this.#handleJoinCallError(error);
			});
	}

	_onCallConferenceNotificationButtonClick(e) {
		clearTimeout(this.hideIncomingCallTimeout);
		this.callNotification.close();
		switch (e.button)
		{
			case 'answerConference':
				if (this.currentCall && 'id' in this.currentCall.associatedEntity)
				{
					Analytics.getInstance().onAnswerConference({
						callId: Util.getCallIdentifier(this.currentCall),
					});

					this.answeredOrDeclinedCalls.add(Util.getCallIdentifier(this.currentCall));
					let dialogId = this.currentCall.associatedEntity.id.toString();
					if (dialogId.startsWith('chat'))
					{
						dialogId = dialogId.slice(4);
					}
					this.emit(Events.onOpenVideoConference, { dialogId });
				}
				break;
			case 'skipConference':
				if (this.currentCall)
				{
					Analytics.getInstance().onDeclineConference({
						callId: Util.getCallIdentifier(this.currentCall),
					});

					this.answeredOrDeclinedCalls.add(Util.getCallIdentifier(this.currentCall));
					this.#teardownCallConnection();
					this.currentCall.decline();
					this.currentCall = null;
					this.#clearPromotedAdminTimeout();
				}
				break;
		}
	}

	_onCallViewShow()
	{
		ZIndexManager.getStack(document.body).bringToFront(this.container);

		if (Number.isNaN(parseInt(this.messengerFacade.getMessageCount(), 10)))
		{
			Util.sendLog(
				`[call] setButtonCounter chat: this.messengerFacade.getMessageCount() = ${this.messengerFacade.getMessageCount()} (NaN)`,
			);
		}
		this.buttonStateService?.setChatCounter(this.messengerFacade.getMessageCount());
		this.callViewState = ViewState.Opened;

		if (this.callStore)
		{
			try
			{
				this.callStore.setViewState('Opened');
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewShow:', error);
			}
		}
	}

	_onCallViewClose()
	{
		this.viewPort.destroy();
		this.callViewState = ViewState.Closed;

		if (this.callStore)
		{
			try
			{
				this.callStore.setViewState('Closed');
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewClose:', error);
			}
		}

		this.floatingWindowService?.hide();
		this.floatingWindowService?.hideScreenShareWindow();

		if (DesktopApi.isDesktop())
		{
			DesktopApi.closeWindow(DesktopApi.findWindow('callBackground'));
		}
		this.promoService?.closeAll();

		this.notificationService?.closeMediaDevicesResetStateHint();
		this.notificationService?.closeReconnectingBalloon();
		this.notificationService?.closeRemoteVideoMutedBalloon();
		this.notificationService?.closeRiseYouHandToTalkPopup();
	}

	_onCallViewDestroy()
	{
		this.buttonStateService?.destroy();
		this.buttonStateService = null;
		this.layoutService?.destroy();
		this.layoutService = null;
		this.notificationService?.destroy();
		this.notificationService = null;
		this.promoService?.destroy();
		this.promoService = null;
		this.hangupOptionsUiService?.destroy();
		this.hangupOptionsUiService = null;

		this.feedbackUiService?.destroy();
		this.feedbackUiService = null;

		const hasSidebar = this.documentEditorService?.hasSidebar();
		this.documentEditorService?.destroy();
		this.documentEditorService = null;

		this.pipService?.destroy();
		this.pipService = null;

		this.recordingUiService?.destroy();
		this.recordingUiService = null;

		this.copilotUiService?.destroy();
		this.copilotUiService = null;

		this.floatingWindowService?.destroy();
		this.floatingWindowService = null;

		this.viewPort = null;
		this.callStore = null;
		this.pinia = null;
		this.autoCloseCallView = true;

		if (hasSidebar)
		{
			BX.adjust(this.container, {
				style: {
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(5px)',
				},
			});
		}
		else
		{
			this.removeContainer();
		}
	}

	_onCallViewBodyClick()
	{
		if (this.layoutService?.isFolded)
		{
			this.unfold();
		}
	}

	#onPiPViewBodyClick()
	{
		this.togglePictureInPictureCallWindow({ isForceClose: false });
		if (this.layoutService?.isFolded)
		{
			this.unfold();
		}
	}

	_onPipClose()
	{
		const isViewHidden = this.viewPort.isHidden();
		if (this.layoutService?.isFolded && isViewHidden)
		{
			this.unfold({ fromPiP: true });
		}
	}

	_onCallViewButtonClick(e)
	{
		const buttonName = e.buttonName;

		const handlers = {
			hangup: this._onCallViewHangupButtonClick.bind(this),
			hangupOptions: this._onCallViewHangupOptionsButtonClick.bind(this),
			close: () => this.viewPort?.close(),
			inviteUser: this._onCallViewInviteUserButtonClick.bind(this),
			toggleMute: this._onCallViewToggleMuteButtonClick.bind(this),
			toggleScreenSharing: this._onCallViewToggleScreenSharingButtonClick.bind(this),
			record: this.#onCallViewRecordButtonClick.bind(this),
			toggleVideo: this._onCallViewToggleVideoButtonClick.bind(this),
			toggleSpeaker: this._onCallViewToggleSpeakerButtonClick.bind(this),
			showChat: () => {
				if (!this.currentCall)
				{
					return;
				}
				Analytics.getInstance().onShowChat({
					callId: Util.getCallIdentifier(this.currentCall),
					callType: this.getCallType(),
				});
				this.messengerFacade.openMessenger(this.currentCall.associatedEntity.id);
				this.showChat();
			},
			floorRequest: this._onCallViewFloorRequestButtonClick.bind(this),
			showHistory: () => this.messengerFacade.openHistory(this.currentCall?.associatedEntity?.id),
			fullscreen: () => {
				if (this.layoutService?.isFolded)
				{
					this.unfold();
				}
				this.toggleFullScreen();
			},
			document: () => {
				if (this.documentEditorService?.hasSidebar())
				{
					this.closeDocumentEditor();
				}
				else
				{
					this.showDocumentsMenu();
				}
			},
			microphoneSideIcon: this._onCallViewMicrophoneSideIconClick.bind(this),
			feedback: this._onCallViewFeedbackButtonClick.bind(this),
			callcontrol: this._onCallcontrolButtonClick.bind(this),
			copilot: this._onCallViewCopilotButtonClick.bind(this),
		};

		if (Type.isFunction(handlers[buttonName]))
		{
			handlers[buttonName].call(this, e);
		}
	}

	_onCallViewHangupButtonClick()
	{
		Analytics.getInstance().onDisconnectCall({
			...this.#getAnalyticsCallParams(),
			subSection: Analytics.AnalyticsSubSection.finishButton,
			mediaParams: {
				video: Hardware.isCameraOn,
				audio: !Hardware.isMicrophoneMuted,
			},
		});

		this.leaveCurrentCall();
	}

	_onCallViewHangupOptionsButtonClick()
	{
		this.hangupOptionsUiService.show(this.viewPort.getButtonElement('hangupOptions'), {
			...this.#getAnalyticsCallParams(),
			chatId: this.currentCall.associatedEntity.id,
			callUsersCount: this.getMaxActiveCallUsers().length,
			callLength: Util.getTimeInSeconds(this.currentCall.startDate),
		});
	}

	_onCallViewFloorRequestButtonClick()
	{
		Analytics.getInstance().onFloorRequest({
			...this.#getAnalyticsCallParams(),
		});

		const floorState = this.viewPort.getUserFloorRequestState(CallEngine.getCurrentUserId());
		const talkingState = this.viewPort.getUserTalking(CallEngine.getCurrentUserId());
		this.viewPort.setUserFloorRequestState(CallEngine.getCurrentUserId(), !floorState);

		if (this.currentCall)
		{
			this.currentCall.requestFloor(!floorState);
		}

		clearTimeout(this.callViewFloorRequestTimeout);
		if (talkingState && !floorState)
		{
			this.callViewFloorRequestTimeout = setTimeout(() => {
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

	_onCallViewTurnOffAllParticipansStreamButtonClick(options)
	{
		if (this.currentCall)
		{
			this.currentCall.turnOffAllParticipansStream(options);
		}
	}

	/**
	 * Returns list of users, that are not currently connected
	 * @return {Array}
	 * @private
	 */
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
			targetContainer: this.container,
			turnOffAllParticipansStream: (options) => {
				this._onCallViewTurnOffAllParticipansStreamButtonClick(options);

				Analytics.getInstance().onTurnOffAllParticipansStream({
					...this.#getAnalyticsCallParams(),
					typeOfStream: options.data?.typeOfStream,
				});
			},
			onPermissionChanged: (options) => {
				this.currentCall.changeSettings(options);

				if (!options.settingEnabled)
				{
					// send only when it turned off
					Analytics.getInstance().onCallSettingsChanged({
						...this.#getAnalyticsCallParams(),
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
					...this.#getAnalyticsCallParams(),
				});
			},
		});

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.toggle();
		}
	}

	_onCallViewInviteUserButtonClick(e)
	{
		if (!this.messengerFacade.showUserSelector)
		{
			return;
		}

		const userStates = this.currentCall ? this.currentCall.getUsers() : {};
		const idleUsers = Util.getDisconnectedUsers(this.currentCall);

		this.messengerFacade.showUserSelector({
			idleUsers,
			targetContainer: this.container,
			viewElement: this.viewPort?.container,
			bindElement: e.node,
			zIndex: this.messengerFacade.getDefaultZIndex() + 200,
			darkMode: this.messengerFacade.isThemeDark(),
			allowNewUsers: Object.keys(userStates).length < Util.getUserLimit() - 1,
			dialogId: this.currentCall.associatedEntity.id,
			onDestroy: this._onInvitePopupDestroy.bind(this),
			onSelect: this._onInvitePopupSelect.bind(this),
		}).then((inviteCloser) => {
			this.invitePopup = inviteCloser;
			this.viewPort?.setHotKeyTemporaryBlock(true);
		});
	}

	_onCallViewToggleMuteHandler(e)
	{
		if (!e.muted && !Hardware?.hasMicrophone())
		{
			return;
		}

		const currentRoom = this.currentCall?.currentRoom?.();
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
					bindElement: this.layoutService?.isFolded
						? null
						: this.viewPort?.buttons?.microphone?.elements?.icon,
				});
			}
		}

		if (this.currentCall && this.#isCommonRecordStarted() && this.#canLocalRecord())
		{
			BXDesktopSystem.CallRecordMute(e.muted);
		}
	}

	_onCallViewToggleMuteButtonClick(e)
	{
		Analytics.getInstance().onToggleMicrophone({
			muted: e.muted,
			...this.#getAnalyticsCallParams(),
		});

		this._onCallViewToggleMuteHandler(e);
	}

	/**
	 * @group CommonRecord
	 * @param { Object } menuAction
	 * @param { string } menuAction.state
	 * @param { string } menuAction.kind
	 * @param { boolean } menuAction.hotkey
	 */
	#onCommonRecordMenu(menuAction)
	{
		const isPlainCall = this.currentCall?.provider === Provider.Plain;
		const isBitrixCall = this.currentCall?.provider === Provider.Bitrix;

		this.recordingUiService?.onCommonRecordMenu(menuAction, {
			commonRecordState: this.commonRecord,
			cloudRecordEnabled: (isPlainCall && this.currentCall?.isCloudRecordFeaturesEnabled) || isBitrixCall,
			isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
			callId: this.currentCall?.id,
			isCopilotActive: this.currentCall?.isCopilotActive ?? false,
		});
	}

	/**
	 * @group CommonRecord
	 */
	#onCallViewRecordButtonClick()
	{
		if (Util.isCommonRecordStateInactive(this.commonRecord.state))
		{
			Analytics.getInstance().onRecordBtnClick({
				...this.#getAnalyticsCallParams(),
			});
		}

		const isPlainCall = this.currentCall?.provider === Provider.Plain;
		const isBitrixCall = this.currentCall?.provider === Provider.Bitrix;

		this.recordingUiService?.onRecordButtonClick({
			commonRecordState: this.commonRecord,
			cloudRecordEnabled: (isPlainCall && this.currentCall?.isCloudRecordFeaturesEnabled) || isBitrixCall,
			isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
			callId: this.currentCall?.id,
			isServiceEnabled: CallCloudRecord.serviceEnabled,
			canRecord: this.#canCommonRecord(),
		});
	}

	#onChangeStateCopilotAction(state)
	{
		let url = '';
		switch (state)
		{
			case RecorderStatus.ENABLED:
				url = 'call.Track.start';
				break;

			case RecorderStatus.PAUSED:
				url = 'call.Track.stop';
				break;

			case RecorderStatus.DESTROYED:
				url = 'call.Track.destroy';
				break;

			default:
		}

		if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
		{
			BX.ajax
				.runAction(url, {
					data: { callId: this.currentCall.id, callUuid: this.currentCall.uuid },
				})
				.then(() => {
					const newCopilotState = !this.currentCall.isCopilotActive;
					this.#onUpdateCallCopilotState(newCopilotState);

					Analytics.getInstance().copilot.onAIRecordStatusChanged({
						isAIOn: newCopilotState,
						...this.#getAnalyticsCallParams(),
					});

					if (newCopilotState)
					{
						this.sendStartCopilotRecordAnalytics({ isAutostart: false });
					}
					else
					{
						this.copilotUiService?.showResultNotify();
					}
				})
				.catch((error) => {
					const errorCode = error.errors[0].code;
					CallAI.handleCopilotError(errorCode);

					if (this.viewPort)
					{
						this.viewPort.showCopilotErrorNotify(errorCode);
					}

					const newCopilotState = !this.currentCall.isCopilotActive;

					Analytics.getInstance().copilot.onAIRecordStatusChanged({
						isAIOn: newCopilotState,
						...this.#getAnalyticsCallParams(),
						error: errorCode,
					});
					this.sendStartCopilotRecordAnalytics({ errorCode, isAutostart: false });
				});
		}
		else
		{
			const newCopilotState = !this.currentCall.isCopilotActive;
			this.#onUpdateCallCopilotState(newCopilotState);
			this.currentCall.setRecorderState(state);

			BX.ajax.runAction(url, {
				data: { callId: this.currentCall.id, callUuid: this.currentCall.uuid },
			});

			if (newCopilotState)
			{
				this.sendStartCopilotRecordAnalytics({ isAutostart: false });
			}
			else
			{
				this.copilotUiService?.showResultNotify();
			}
		}
	}

	_onCallViewCopilotButtonClick()
	{
		const isPlainCall = this.currentCall?.provider === Provider.Plain;
		const isBitrixCall = this.currentCall?.provider === Provider.Bitrix;
		const isLegacyCall = Util.isLegacyCall(this.currentCall?.provider, this.currentCall?.scheme);

		if (this.currentCall?.isCopilotActive)
		{
			Analytics.getInstance().copilot.onClickAIOff({
				...this.#getAnalyticsCallParams(),
			});
		}

		this.copilotUiService?.onButtonClick({
			isCopilotActive: this.currentCall?.isCopilotActive ?? false,
			isCopilotFeaturesEnabled:
				(!isLegacyCall && isPlainCall && (this.currentCall?.isCopilotFeaturesEnabled ?? false)) || isBitrixCall,
			callId: this.currentCall?.id,
		});
	}

	#onUpdateCallCopilotState(state)
	{
		if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
		{
			this.currentCall.isCopilotActive = state;
		}

		if (this.viewPort)
		{
			this.viewPort.updateCopilotState(state);
		}
	}

	#onSwitchTrackRecordStatus({ isTrackRecordOn, errorCode })
	{
		this.#onUpdateCallCopilotState(isTrackRecordOn);

		if (errorCode)
		{
			this.copilotUiService?.showNotify({
				isCopilotActive: this.currentCall.isCopilotActive,
				provider: this.currentCall.provider,
				callId: Util.getCallIdentifier(this.currentCall),
				force: true,
				errorCode,
			});

			return;
		}

		if (isTrackRecordOn)
		{
			this.copilotUiService?.showNotify({
				isCopilotActive: this.currentCall.isCopilotActive,
				provider: this.currentCall.provider,
				callId: Util.getCallIdentifier(this.currentCall),
			});
		}
		else
		{
			this.copilotUiService?.closeNotify();
			this.copilotUiService?.showResultNotify();
		}
	}

	/**
	 * @param {Object} status
	 * @param {RecorderStatus} status.code
	 * @param {string} status.error
	 * @param {boolean} status.isCopilotActive
	 */
	#onRecorderStatusChanged({ code, error, isCopilotActive })
	{
		this.#onUpdateCallCopilotState(isCopilotActive);

		if (!CallAI.tariffAvailable)
		{
			this.copilotUiService?.unblockCopilotButton();

			return;
		}

		if (this.currentCall.isCopilotInitialized)
		{
			if (!this.currentCall.initiatorId && isCopilotActive)
			{
				this.sendStartCopilotRecordAnalytics({ isAutostart: true });
			}
			this.copilotUiService?.unblockCopilotButton();
		}

		if (error)
		{
			CallAI.handleCopilotError(error);

			if (this.viewPort)
			{
				const errorType = isCopilotActive
					? CopilotNotifyType.DISABLE_AI_INTERNAL_ERROR
					: CopilotNotifyType.ENABLE_AI_INTERNAL_ERROR;
				this.viewPort.showCopilotErrorNotify(errorType);
			}
			this.sendStartCopilotRecordAnalytics({ error, isAutostart: false });
		}

		if (code === RecorderStatus.DISABLED)
		{
			this.copilotUiService?.showResultNotify();

			return;
		}

		if (![RecorderStatus.PAUSED, RecorderStatus.DESTROYED].includes(code))
		{
			this.copilotUiService?.showNotify({
				isCopilotActive: this.currentCall.isCopilotActive,
				provider: this.currentCall.provider,
				callId: Util.getCallIdentifier(this.currentCall),
			});
		}
	}

	/**
	 * @group CommonRecord
	 * @param { Object } event
	 * @param { number } event.code
	 * @param { number } event.initiatorId
	 * @param { number } event.userId
	 * @param { boolean } event.justJoined
	 * @param { Object } event.commonRecordState
	 * @private
	 */
	#onCloudRecordStatusChanged(event)
	{
		this.recordingUiService?.trackCloudRecordStateChange({
			currentUserId: this.userId,
			eventUserId: event.userId,
			newState: event.commonRecordState.state,
			recordType: event.commonRecordState.type,
			previousState: this.commonRecord.state,
			commonRecordInfo: this.commonRecord.info,
			...this.#getAnalyticsCallParams(),
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

		if (this.callStore)
		{
			try
			{
				this.callStore.setRecordState({
					state: this.commonRecord.state,
					type: this.commonRecord.type ?? null,
					initiatorId: this.commonRecord.initiatorId ?? null,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in recording handler:', error);
			}
		}

		this.recordingUiService?.updateView(event.commonRecordState, {
			type: 'cloudRecord',
			userId: event.userId,
			currentUserId: this.userId,
			justJoined: event.justJoined,
			eventRecordState: event.commonRecordState,
		});
	}

	sendStartCopilotRecordAnalytics({ errorCode = null, isAutostart })
	{
		const params = {
			...this.#getAnalyticsCallParams(),
			errorCode,
			chatUserCount: this.currentCall?.associatedEntity.userCounter,
			isAutostart,
		};

		const userCount = this.getActiveCallUsers().length;
		if (userCount)
		{
			params.userCount = userCount + 1;
		}
		Analytics.getInstance().copilot.onAIRecordStart(params);
	}

	_onCallViewToggleScreenSharingButtonClick()
	{
		Analytics.getInstance().onScreenShareBtnClick({
			...this.#getAnalyticsCallParams(),
		});

		if (this.featureScreenSharing === FeatureState.Limited)
		{
			this.messengerFacade.openHelpArticle('call_screen_sharing');

			return;
		}

		if (this.featureScreenSharing === FeatureState.Disabled)
		{
			return;
		}

		if (this.currentCall.isScreenSharingStarted())
		{
			this.floatingWindowService?.hideScreenShareWindow();
			this.layoutService?.closeWebScreenSharePopup();
			this.promoService?.closeAll();
			this.currentCall.stopScreenSharing();

			if (this.#isCommonRecordStarted() && this.#canLocalRecord())
			{
				BXDesktopSystem.CallRecordStopSharing();
			}
		}
		else
		{
			this.currentCall.startScreenSharing();
			this.togglePictureInPictureCallWindow({ isForceOpen: true });
			BX.ajax.runAction('call.Call.onShareScreen', {
				data: { callId: this.currentCall.id, callUuid: this.currentCall.uuid },
			});
		}
	}

	_onCallViewToggleVideoButtonClickHandler(e)
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

		if (!e.video && !this.currentCall.isScreenSharingStarted())
		{
			this.viewPort.releaseLocalMedia();
		}

		if (!this.currentCall.cameraId && e.video)
		{
			this.currentCall.setCameraId(Hardware.defaultCamera);
		}
	}

	_onCallViewToggleVideoButtonClick(e)
	{
		Analytics.getInstance().onToggleCamera({
			video: e.video,
			...this.#getAnalyticsCallParams(),
		});

		this._onCallViewToggleVideoButtonClickHandler(e);
	}

	_onCallViewToggleSpeakerButtonClick(e)
	{
		const currentRoom = this.currentCall?.currentRoom?.();
		if (currentRoom && currentRoom.speaker != this.userId)
		{
			alert('only room speaker can turn on sound');

			return;
		}

		this.viewPort.muteSpeaker(!e.speakerMuted);

		if (e.fromHotKey)
		{
			BX.UI.Notification.Center.notify({
				content: BX.message(
					this.viewPort.speakerMuted ? 'IM_M_CALL_MUTE_SPEAKERS_OFF' : 'IM_M_CALL_MUTE_SPEAKERS_ON',
				),
				position: 'top-right',
				autoHideDelay: 3000,
				closeButton: true,
			});
		}
	}

	_onCallViewMicrophoneSideIconClick()
	{
		const currentRoom = this.currentCall?.currentRoom?.();
		if (currentRoom)
		{
			this.layoutService?.toggleRoomMenu(this.viewPort.getButtonElement('microphone', 'icon'), this.currentCall);
		}
		else
		{
			this.layoutService?.toggleRoomListMenu(this.viewPort.getButtonElement('microphone', 'icon'), this.currentCall);
		}
	}

	_onCallViewFeedbackButtonClick()
	{
		this.feedbackUiService?.onButtonClick({
			callId: Util.getCallIdentifier(this.currentCall),
			instanceId: this.currentCall?.instanceId,
			provider: this.currentCall?.provider,
			userCount: this.getMaxActiveCallUsers().length,
			userId: this.params?.userId,
		});
	}

	_onCallViewReplaceCamera(e)
	{
		if (this.reconnectingCameraId)
		{
			this.setReconnectingCameraId(null);
		}

		if (this.currentCall)
		{
			this.currentCall.setCameraId(e.deviceId);
		}

		// update default camera
		Hardware.defaultCamera = e.deviceId;

		if (this.callStore)
		{
			try
			{
				this.callStore.setDeviceIds({
					cameraId: Hardware.defaultCamera,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewReplaceCamera:', error);
			}
		}
	}

	_onCallViewReplaceMicrophone(e)
	{
		if (this.currentCall)
		{
			this.currentCall.setMicrophoneId(e.deviceId);
			this.viewPort.setMicrophoneId(e.deviceId);
		}

		// update default microphone
		Hardware.defaultMicrophone = e.deviceId;

		if (this.callStore)
		{
			try
			{
				this.callStore.setDeviceIds({
					microphoneId: Hardware.defaultMicrophone,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewReplaceMicrophone:', error);
			}
		}
	}

	_onCallViewReplaceSpeaker(e)
	{
		if (this.activeSpeakerManager)
		{
			this.activeSpeakerManager.setSpeakerId(e.deviceId);

			return;
		}

		Hardware.defaultSpeaker = e.deviceId;

		if (this.callStore)
		{
			try
			{
				this.callStore.setDeviceIds({
					speakerId: this.viewPort?.speakerId ?? null,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewReplaceSpeaker:', error);
			}
		}
	}

	_onAudioElementCreated(e)
	{
		if (this.activeSpeakerManager)
		{
			this.activeSpeakerManager.registerAudioElement(e.userId, e.audioElement);
		}
	}

	_onSpeakerDeviceChanged(e)
	{
		if (this.viewPort)
		{
			this.viewPort.confirmSpeakerSelection(e.deviceId);
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setDeviceIds({
					speakerId: e.deviceId ?? null,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onSpeakerDeviceChanged:', error);
			}
		}
	}

	_onCallViewHasMainStream(event): void
	{
		if (!this.currentCall)
		{
			return;
		}

		const provider = this.currentCall.provider;
		const isBitrixCall = provider === Provider.Bitrix;
		const isPlainCall = provider === Provider.Plain;
		const isJwtInPlainCallsEnabled = isPlainCall && !Util.isLegacyCall(provider, this.currentCall.scheme);

		if (isBitrixCall || isJwtInPlainCallsEnabled)
		{
			this.currentCall.setMainStream(event);
		}
	}

	#turnOffParticipantStream(userId, typeOfStream)
	{
		this.currentCall.turnOffParticipantStream({ typeOfStream, userId, fromUserId: CallEngine.getCurrentUserId() });

		Analytics.getInstance().onTurnOffParticipantStream({
			...this.#getAnalyticsCallParams(),
			typeOfSetting: typeOfStream,
		});
	}

	_onCallViewTurnOffParticipantMic(e)
	{
		this.#turnOffParticipantStream(e.userId, 'mic');
	}

	_onCallViewTurnOffParticipantCam(e)
	{
		this.#turnOffParticipantStream(e.userId, 'cam');
	}

	_onCallViewTurnOffParticipantScreenshare(e)
	{
		this.#turnOffParticipantStream(e.userId, 'screenshare');
	}

	_onCallViewAllowSpeakPermission(e)
	{
		this.currentCall.allowSpeakPermission({ allow: true, userId: e.userId });

		Analytics.getInstance().onAllowPermissionToSpeakResponse({
			...this.#getAnalyticsCallParams(),
		});
	}

	_onCallViewDisallowSpeakPermission(e)
	{
		this.currentCall.allowSpeakPermission({ allow: false, userId: e.userId });

		Analytics.getInstance().onDisallowPermissionToSpeakResponse({
			...this.#getAnalyticsCallParams(),
		});
	}

	_onCallViewChangeNoiseSuppression(e)
	{
		Hardware.enableNoiseSuppression = e.allowNoiseSuppression;
		Hardware.turnNoiseSuppression();
	}

	_onCallViewChangeMicAutoParams(e)
	{
		Hardware.enableMicAutoParameters = e.allowMicAutoParams;
	}

	_onCallViewChangeFaceImprove(e)
	{
		if (!DesktopApi.isDesktop())
		{
			return;
		}

		DesktopApi.setCameraSmoothingStatus(e.faceImproveEnabled);
	}

	_onCallViewOpenAdvancedSettings()
	{
		this.messengerFacade.openSettings({ onlyPanel: 'hardware' });
	}

	_onCallViewSetCentralUser(e)
	{
		if (e.stream && this.floatingWindowService?.hasFloatingVideo())
		{
			this.floatingWindowService.updateContent({ userId: e.userId, stream: e.stream });
		}

		if (this.callStore)
		{
			try
			{
				if (e.userId !== null && e.userId !== undefined)
				{
					this.callStore.pinUser(e.userId);
				}
				else
				{
					this.callStore.unpinUser();
				}
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallViewSetCentralUser:', error);
			}
		}
	}

	_onCallUserInvited(e)
	{
		this.layoutService?.handleUserJoinEvent('onUserInvited', e, this.currentCall);
	}

	_onCallUserJoined(e)
	{
		this.layoutService?.handleUserJoinEvent('onUserJoined', e, this.currentCall);
		if (this.callStore)
		{
			try
			{
				const userFields = { state: 'Connecting' };

				if (e.userData && e.userData[e.userId])
				{
					const userData = e.userData[e.userId];

					if (userData.name !== undefined)
					{
						userFields.name = userData.name;
					}

					if (userData.avatar_hr !== undefined)
					{
						userFields.avatar = userData.avatar_hr;
					}
					else if (userData.avatar !== undefined)
					{
						userFields.avatar = userData.avatar;
					}
				}

				this.callStore.updateUser(e.userId, userFields);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserJoined:', error);
			}
		}

		setTimeout(this.updateFloatingWindowContent.bind(this), 100);

		if (this.viewPort)
		{
			this.viewPort.updateUserData(e.userData);
			this.viewPort.addUser(e.userId, UserState.Connected);
		}
	}

	_onCallUserMicrophoneState(e)
	{
		if (e.userId === this.userId)
		{
			Hardware.isMicrophoneMuted = !e.microphoneState;
			if (this.callStore)
			{
				try
				{
					this.callStore.setMediaState({ isMicrophoneMuted: !e.microphoneState });
					this.callStore.setUserMicrophoneState(e.userId, e.microphoneState);
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in _onCallUserMicrophoneState (local):', error);
				}
			}
		}
		else
		{
			this.layoutService?.handleUserEvent('onUserMicrophoneState', e);
			if (this.callStore)
			{
				try
				{
					this.callStore.setUserMicrophoneState(e.userId, e.microphoneState);
				}
				catch (error)
				{
					console.error('[call.store] Pinia write failed in _onCallUserMicrophoneState (remote):', error);
				}
			}
		}
	}

	_onCallUserCameraState(e)
	{
		this.layoutService?.handleUserEvent('onUserCameraState', e);
		if (this.callStore)
		{
			try
			{
				this.callStore.setUserCameraState(e.userId, e.cameraState);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserCameraState:', error);
			}
		}
	}

	_onCallUserVideoPaused(e)
	{
		this.layoutService?.handleUserEvent('onUserVideoPaused', e);
		if (this.callStore)
		{
			try
			{
				this.callStore.setUserVideoPaused(e.userId, e.videoPaused);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserVideoPaused:', error);
			}
		}
	}

	_onCallUserScreenState(e)
	{
		this.layoutService?.handleScreenStateEvent(e, this.currentCall);
	}

	_onCallUserFloorRequest(e)
	{
		this.layoutService?.handleUserEvent('onUserFloorRequest', e);
	}

	_onCallRemoteMediaReceived(e)
	{
		this.layoutService?.handleMediaEvent(e);
	}

	_onCallRemoteMediaStopped(e)
	{
		this.layoutService?.handleMediaEvent({ ...e, kind: e.kind, local: false, stopped: true });
	}

	_onCallBadNetworkIndicator(e)
	{
		this.layoutService?.handleUserEvent('onBadNetworkIndicator', e);
	}

	_onCallConnectionQualityChanged(e)
	{
		this.layoutService?.handleUserEvent('onConnectionQualityChanged', e);
		if (this.callStore)
		{
			try
			{
				this.callStore.setUserConnectionQuality(e.userId, e.quality);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallConnectionQualityChanged:', error);
			}
		}
	}

	_onCallUserVoiceStarted(e)
	{
		if (e.local)
		{
			if (this.currentCall.muted && this.isMutedPopupAllowed())
			{
				this.notificationService?.showMicMutedNotification(
					this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon,
				);
			}

			if (this.currentCall.muted)
			{
				return;
			}
		}

		this.talkingUsers[e.userId] = true;
		this.layoutService?.handleUserEvent('onUserVoiceStarted', e);
		if (this.callStore)
		{
			try
			{
				this.callStore.setUserTalking(e.userId, true);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserVoiceStarted:', error);
			}
		}

		if (e.userId === this.viewPort?.localUser?.id)
		{
			this.viewPort?.setUserFloorRequestState(e.userId, false);
		}
	}

	_onCallUserVoiceStopped(e)
	{
		if (this.talkingUsers[e.userId])
		{
			delete this.talkingUsers[e.userId];
		}

		this.layoutService?.handleUserEvent('onUserVoiceStopped', e);
		if (this.callStore)
		{
			try
			{
				this.callStore.setUserTalking(e.userId, false);
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserVoiceStopped:', error);
			}
		}
	}

	_onAllParticipantsAudioMuted(e)
	{
		this.notificationService?.showAllParticipantsMutedNotification(e, 'audio');

		if (Util.isRegularUser(Util.getCurrentUserRole()))
		{
			this._onCallViewToggleMuteHandler({ muted: true, calledProgrammatically: true });
		}
	}

	_onAllParticipantsVideoMuted(e)
	{
		this.notificationService?.showAllParticipantsMutedNotification(e, 'video');

		if (Util.isRegularUser(Util.getCurrentUserRole()))
		{
			this._onCallViewToggleVideoButtonClickHandler({ video: false, calledProgrammatically: true });
		}
	}

	_onAllParticipantsScreenshareMuted(e)
	{
		this.notificationService?.showAllParticipantsMutedNotification(e, 'screenshare');

		if (this.currentCall?.isScreenSharingStarted() && Util.isRegularUser(Util.getCurrentUserRole()))
		{
			this._onCallViewToggleScreenSharingButtonClick();
		}
	}

	#onCallParticipantMuted = (e) => {
		const currentUserId = CallEngine.getCurrentUserId();
		this.notificationService?.showParticipantMutedNotification(e.data, currentUserId);

		if (e.data?.toUserId == currentUserId && e.data?.track?.muted === true)
		{
			if (e.data.track?.type === 0)
			{
				this._onCallViewToggleMuteHandler({ muted: true, calledProgrammatically: true });
			}
			else if (e.data.track?.type === 1)
			{
				this._onCallViewToggleVideoButtonClickHandler({ video: false, calledProgrammatically: true });
			}
			else if (e.data.track?.type === 2 && this.currentCall?.isScreenSharingStarted())
			{
				this.floatingWindowService?.hideScreenShareWindow();
				this.layoutService?.closeWebScreenSharePopup();
				this.promoService?.closeAll();
				this.currentCall.stopScreenSharing();

				if (this.#isCommonRecordStarted() && this.#canLocalRecord())
				{
					BXDesktopSystem.CallRecordStopSharing();
				}
			}
		}
	};

	_onCallTrackSubscriptionFailed(e)
	{
		this.layoutService?.handleUserEvent('onTrackSubscriptionFailed', e);
	}

	#onCallFailure(e)
	{
		const errorCode = e.code || e.name || e.error;

		if (errorCode === DisconnectReason.SignalingReconnectCooldown)
		{
			this.messengerFacade.stopRepeatSound('dialtone');
			this.leaveCurrentCall();
			Hardware.isMicrophoneMuted = false;

			return;
		}

		if (e.name === 'VoxConnectionError' || e.name === 'AuthResult')
		{
			Util.reportConnectionResult(e.call.id, false);
		}

		this.notificationService?.handleCallFailure({ errorCode, isHttps: this.isHttps, viewPort: this.viewPort });
		this.messengerFacade.stopRepeatSound('dialtone');
		this.autoCloseCallView = false;

		if (this.currentCall)
		{
			this.#teardownCallConnection();

			if (this.currentCallIsNew && Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
			{
				BX.ajax.runAction('call.CallManager.interrupt', { data: { callId: this.currentCall.id } });
			}

			this.currentCall.destroy();
			this.currentCall = null;
			this.currentCallIsNew = false;
		}

		this.#clearPromotedAdminTimeout();
		Hardware.isMicrophoneMuted = false;
	}

	_onCallMicrophoneLevel(e)
	{
		this.layoutService?.handleUserEvent('onMicrophoneLevel', e);
	}

	_onCallJoinRoomOffer(e)
	{
		if (!e.initiator && !this.currentCall.currentRoom())
		{
			this.currentCall.joinRoom(e.roomId);
			this.notificationService?.showRoomJoinedPopup({
				isAuto: true,
				isSpeaker: e.speaker === this.userId,
				userIdList: e.users,
				localUserId: this.userId,
				isFolded: this.layoutService?.isFolded,
				bindElement: this.viewPort?.buttons?.microphone?.elements?.icon,
				externalContainer: this.getExternalContainer(),
				onLeaveRoom: () => this.currentCall.leaveCurrentRoom(),
			});
		}
	}

	_onCallJoinRoom(e)
	{
		if (e.speaker === this.userId)
		{
			this.viewPort?.setRoomState(ViewRoomState.Speaker);
		}
		else
		{
			Hardware.isMicrophoneMuted = true;
			this.viewPort?.muteSpeaker(true);
			this.viewPort?.setRoomState(ViewRoomState.NonSpeaker);
		}
	}

	_onCallLeaveRoom()
	{
		this.viewPort?.setRoomState(ViewRoomState.Speaker);
		this.viewPort?.muteSpeaker(false);
	}

	_onCallTransferRoomSpeaker(e)
	{
		const isSpeaker = e.speaker === this.userId;

		this.notificationService?.handleTransferRoomSpeaker({
			event: e,
			userId: this.userId,
			isFolded: this.layoutService?.isFolded,
			bindElement: this.viewPort?.buttons?.microphone?.elements?.icon,
			externalContainer: this.getExternalContainer(),
		});

		if (isSpeaker)
		{
			Hardware.isMicrophoneMuted = false;
			this.viewPort?.setRoomState(ViewRoomState.Speaker);

			if (e.initiator === this.userId)
			{
				this.viewPort?.muteSpeaker(false);
			}
		}
		else
		{
			Hardware.isMicrophoneMuted = true;
			this.viewPort?.muteSpeaker(true);
			this.viewPort?.setRoomState(ViewRoomState.NonSpeaker);
		}
	}

	_onCallDestroy()
	{
		let callDetails;
		if (this.currentCall)
		{
			this.#teardownCallConnection();
			callDetails = this.#getCallDetail(this.currentCall);
			this.currentCall = null;
		}

		this.#clearPromotedAdminTimeout();

		if (this.childCall)
		{
			this.#removeChildCallEvents(this.childCall);
			this.childCall.hangup(false, '', true);
			this.childCall = null;
		}

		this.#clearSavedScreenStream();

		this.callWithLegacyMobile = false;

		this.#closeCallPopups();

		this.#stopCommonRecord();

		if (this.viewPort && this.autoCloseCallView)
		{
			this.viewPort.close();
		}

		this.#stopAllMediaStreams();

		this.notificationService?.closeRiseYouHandToTalkPopup();
		this.documentEditorService?.resetDocumentCreated();

		this.#teardownCallUi();

		if (this.callStore)
		{
			try
			{
				this.callStore.resetCall();
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallDestroy:', error);
			}
		}

		this.emit(Events.onCallDestroyed, {
			callDetails,
		});
	}

	loopConnectionQuality(userId, quality, timeout = 200)
	{
		this.loopTimers[userId] = setTimeout(() => {
			if (this.viewPort)
			{
				this.viewPort.setUserConnectionQuality(userId, quality);
				const newQuality = quality >= 4 ? 1 : quality + 1;
				this.loopConnectionQuality(userId, newQuality, timeout);
			}
		}, timeout);
	}

	clearConnectionQualityTimer(userId)
	{
		if (this.loopTimers[userId] !== undefined)
		{
			clearTimeout(this.loopTimers[userId]);
			delete this.loopTimers[userId];
		}
	}

	_onCallUserStateChanged(e)
	{
		setTimeout(this.updateFloatingWindowContent.bind(this), 100);
		if (this.viewPort)
		{
			this.viewPort.setUserState(e.userId, e.state);
			if (e.isLegacyMobile)
			{
				this.buttonStateService?.blockForLegacyMobile();
			}
		}

		this.#syncUserStateToPinia(e.userId, e.state);

		if (this.callStore && e.direction !== undefined)
		{
			try
			{
				this.callStore.updateUser(e.userId, { direction: e.direction });
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallUserStateChanged (M1 direction):', error);
			}
		}

		if (e.state !== UserState.Connected && this.loopTimers[e.userId] === undefined)
		{
			this.loopConnectionQuality(e.userId, 1);
		}

		if (e.state == UserState.Connecting || e.state == UserState.Connected)
		{
			this.messengerFacade.stopRepeatSound('dialtone');
		}

		if (e.state == UserState.Connected)
		{
			this.clearConnectionQualityTimer(e.userId);
			this.viewPort.setUserConnectionQuality(e.userId, 5);
			this.viewPort?.notifyUserJoined(e.userId);

			const isNeedUnblockCameraButton = Hardware.hasCamera()
				&& (
					(this.currentCall.provider === Provider.Bitrix && !Hardware.isCameraOn)
					|| this.currentCall.provider === Provider.Plain
				);
			const isCopilotFeaturesEnabled = Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme)
				&& CallAI.serviceEnabled;

			this.buttonStateService?.unblockOnUserConnected({
				isLegacyMobile: e.isLegacyMobile,
				isNeedUnblockCameraButton,
				isCopilotFeaturesEnabled,
				isCommonRecordStateInactive: Util.isCommonRecordStateInactive(this.commonRecord.state),
			});

			if (this.currentCall.provider === Provider.Plain)
			{
				this.viewPort.unblockAddUser();
			}
		}
		else if (e.state == UserState.Idle && e.previousState == UserState.Connected)
		{
			if (!this.#canCloudRecord() && e.userId === this.commonRecord.initiatorId)
			{
				this.#stopCommonRecord();
			}

			this.viewPort?.notifyUserLeft(e.userId);
			this.layoutService?.handleUserEvent('onUserLeft', e);
			this.activeSpeakerManager?.unregisterAudioElement(e.userId);
		}
		else if (e.state == UserState.Failed && this.currentCall instanceof PlainCall)
		{
			this.notificationService?.showUserCallStateNotification(
				'IM_M_CALL_USER_FAILED',
				this.currentCall.id,
				e.userId,
				DEFAULT_GENDER,
			);
		}
		else if (e.state == UserState.Declined && this.viewPort)
		{
			const chatUserCount = this.currentCall?.associatedEntity?.userCounter ?? 0;
			if (chatUserCount <= LARGE_CHAT_NOTIFICATION_THRESHOLD)
			{
				const isLegacyCall = Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme);
				const isBitrixCall = this.currentCall.provider === Provider.Bitrix;
				const callId = isLegacyCall || !isBitrixCall ? this.currentCall.id : e.callId;
				this.notificationService?.showUserCallStateNotification(
					'IM_M_CALL_USER_DECLINED',
					callId,
					e.userId,
					DEFAULT_GENDER,
				);
			}
		}
		else if (
			e.state === UserState.Busy
			&& Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme)
		)
		{
			this.notificationService?.showUserCallStateNotification(
				'IM_M_CALL_USER_BUSY',
				this.currentCall.id,
				e.userId,
				DEFAULT_GENDER,
			);
		}

		// If a peer leaves Declined/Busy/Failed (e.g. after a re-invite the
		// user has just accepted), dismiss the matching "user declined|busy|
		// failed" balloon so it does not linger on screen for the remaining
		// autoHide window of the previously shown notification.
		if (
			e.previousState === UserState.Declined
			|| e.previousState === UserState.Busy
			|| e.previousState === UserState.Failed
		)
		{
			if (e.state !== e.previousState)
			{
				this.notificationService?.closeUserCallStateNotification(e.userId);
			}
		}
	}

	#syncUserStateToPinia(userId, state)
	{
		if (!this.callStore)
		{
			return;
		}

		try
		{
			this.callStore.setUserState(userId, state);

			if (state === UserState.Connected)
			{
				this.callStore.setUserConnectionQuality(userId, 5);
			}
		}
		catch (error)
		{
			console.error('[call.store] Pinia write failed in _onCallUserStateChanged:', error);
		}
	}

	_onNeedResetMediaDevicesState(e)
	{
		console.log('_onNeedResetMediaDevicesState');
		Util.sendLog({
			description: 'Set microphone muted true in _onNeedResetMediaDevicesState',
		});
		Hardware.isMicrophoneMuted = true;
		Hardware.isCameraOn = false;

		this.notificationService?.showMediaDevicesResetStateHint();
	}

	_onRemoteMediaAvailable(e)
	{
		this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
	}

	_onRemoteMediaUnavailable(e)
	{
		this.viewPort?.trackAvailabilityChanged(e.userId, e.kind, e.available);
	}

	_onCameraPublishing(e)
	{
		if (e.publishing)
		{
			this.buttonStateService?.blockCameraButton();
		}
		else
		{
			this.buttonStateService?.unblockCameraButton();
		}

		if (this.viewPort)
		{
			this.viewPort.updateButtons();
		}
	}

	_onMicrophonePublishingd(e)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (e.publishing)
		{
			this.buttonStateService?.blockMicrophoneButton();
		}
		else
		{
			this.buttonStateService?.unblockMicrophoneButton();
		}

		if (this.viewPort)
		{
			this.viewPort.updateButtons();
		}
	}

	_onCallLocalScreenUpdated(e)
	{
		const { track } = e;
		if (this.viewPort)
		{
			this.viewPort.setLocalStreamVideoTrack(track);
		}
	}

	_onCallLocalMediaReceived(e)
	{
		this.log(`Received local media stream ${e.tag}`);

		this.hasStreamFromCall = true;

		if (this.viewPort)
		{
			const flipVideo = e.tag === 'main' || e.mediaRenderer ? Hardware.enableMirroring : false;

			this.viewPort.setLocalStream(e);
			this.viewPort.flipLocalVideo(flipVideo);

			this.viewPort.setButtonActive('screen', this.currentCall.isScreenSharingStarted());
			if (this.currentCall.isScreenSharingStarted())
			{
				this.screenShareStartTime = new Date();
				Analytics.getInstance().onScreenShareStarted({
					...this.#getAnalyticsCallParams(),
				});

				this.togglePictureInPictureCallWindow({ mediaReceived: true });

				if (!DesktopApi.isDesktop())
				{
					this.layoutService?.showWebScreenSharePopup(WebScreenSharePopup, this.viewPort.getButtonElement('screen'), () => this._onCallViewToggleScreenSharingButtonClick());
				}

				this.viewPort.updateButtons();
			}
			else
			{
				Analytics.getInstance().onScreenShareStopped({
					...this.#getAnalyticsCallParams(),
					status: Analytics.AnalyticsStatus.success,
					screenShareLength: Util.getTimeInSeconds(this.screenShareStartTime),
				});
				this.screenShareStartTime = null;

				this.togglePictureInPictureCallWindow({ mediaReceived: true });

				this.floatingWindowService?.hideScreenShareWindow();
				this.layoutService?.closeWebScreenSharePopup();
				if (this.#isCommonRecordStarted() && this.#canLocalRecord())
				{
					BXDesktopSystem.CallRecordStopSharing();
				}
			}

			if (!this.currentCall.callFromMobile)
			{
				this.viewPort.unblockSwitchCamera();
				this.viewPort.updateButtons();
			}
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setMediaState({
					isScreenSharingActive: Boolean(this.currentCall?.isScreenSharingStarted()),
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallLocalMediaReceived:', error);
			}
		}

		const hasNoVideoTrack = !e.stream || e.stream?.getVideoTracks().length === 0;

		if (this.currentCall && Hardware.isCameraOn && e.tag === 'main' && hasNoVideoTrack)
		{
			Hardware.isCameraOn = false;
		}
	}

	_onCallLocalCameraFlip(e)
	{
		this._onCallLocalCameraFlipInDesktop(e.data.enableMirroring);
	}

	_onCallLocalCameraFlipInDesktop(e)
	{
		console.error('FLIPPING LOCAL VIDEO');
		if (this.viewPort)
		{
			this.viewPort.flipLocalVideo(e);
		}
	}

	_onCallLocalMediaStopped(e)
	{
		if (this.viewPort && e.kind === 'audio')
		{
			Hardware.isMicrophoneMuted = true;
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setMediaState({
					isScreenSharingActive: Boolean(this.currentCall?.isScreenSharingStarted()),
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in _onCallLocalMediaStopped:', error);
			}
		}
	}

	_onCallToggleRemoteParticipantVideo(e)
	{
		this.notificationService?.handleRemoteParticipantVideoToggle(e.isVideoShown);
	}

	_onBlockUnblockCamMicButtons()
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

	_onTurnOnCamera(e)
	{
		this._onCallViewToggleVideoButtonClickHandler({ video: true, calledProgrammatically: true });
	}

	_onYouMuteAllParticipants(e)
	{
		this.notificationService?.showYouMuteAllNotification(e);
	}

	_onUserPermissionsChanged(e)
	{
		if (!e.data.allow)
		{
			const floorState = this.viewPort.getUserFloorRequestState(CallEngine.getCurrentUserId());

			if (floorState)
			{
				this._onCallViewFloorRequestButtonClick();
			}
		}

		this.notificationService?.showPermissionsChangedNotification(e.data, CallEngine.getCurrentUserId());

		if (this.viewPort)
		{
			this.viewPort.setUserPermissionToSpeakState(e.data.toUserId, e.data.allow);
		}

		this.viewPort.updateButtons();
		this._onBlockUnblockCamMicButtons();
	}

	_onUserRoleChanged(e)
	{
		const currentUserId = CallEngine.getCurrentUserId();
		const content = this.notificationService?.getRoleChangedNotificationContent(e.data, currentUserId);

		if (content !== null && content !== undefined)
		{
			const newRole = e.data.role.toUpperCase();

			if (newRole === Util.UsersRoles.ADMIN || newRole === Util.UsersRoles.MANAGER)
			{
				this.promotedToAdminTimeout = setTimeout(
					() => this.notificationService?.createCallControlNotify(
						{ content, isAllow: true }
					),
					this.promotedToAdminTimeoutValue,
				);
				this.notificationService?.closeRiseYouHandToTalkPopup();
			}
			else
			{
				this.notificationService?.createCallControlNotify(
					{ content }
				);
			}

			if (this.viewPort)
			{
				this.viewPort.updateButtons();
				this.viewPort.updateFloorRequestNotification();
			}

			this._onBlockUnblockCamMicButtons();
		}
	}

	_onRoomSettingsChanged(e)
	{
		const result = this.notificationService?.showRoomSettingsChangedNotification(e.data, this.currentCall.userId);

		if (this.viewPort && !result?.isAllow)
		{
			this.viewPort.setAllUserPermissionToSpeakState(false);
		}

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.updateStatePermissions();
		}

		if (e.data.eft === true && e.data.act === 'audio' && !Util.havePermissionToBroadcast('mic'))
		{
			this.lastCalledChangeSettingsUserName = result?.initiatorName ?? '';
			this.notificationService?.showRiseYouHandToTalkNotification({
				initiatorName: this.lastCalledChangeSettingsUserName,
				bindElement: this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon,
			});
		}

		this.viewPort.updateButtons();
		this._onBlockUnblockCamMicButtons();
	}

	_onUserStatsReceived(e)
	{
		if (this.viewPort)
		{
			this.viewPort.setUserStats(e.userId, e.report, e.mediaServerId);
		}
	}

	/**
	 * @group CommonRecord
	 * @param { Object } event
	 * @param { BitrixCall | PlainCall } event.call
	 * @param { Object } event.commonRecordState
	 * @param { number } event.commonRecordState.userId
	 * @param { CallCommonRecordType } event.commonRecordState.type
	 * @param { CallCommonRecordState } event.commonRecordState.state
	 * @param { Object } event.commonRecordState.date
	 * @param { string } event.commonRecordState.date.start
	 * @param { Array } event.commonRecordState.date.pause
	 * @param { number } event.userId
	 */

	#onCallUserCommonRecordState(event)
	{
		if (this.#canCloudRecord())
		{
			return;
		}

		const { commonRecordState, userId } = event;
		const { state, userId: initiatorId } = commonRecordState;

		this.commonRecord.state = state;
		this.commonRecord.initiatorId = initiatorId;

		if (Util.isCommonRecordStateInactive(state))
		{
			this.commonRecord.info = null;
			this.commonRecord.initiatorId = null;
		}
		else
		{
			this.commonRecord.info = commonRecordState;
		}

		if (this.callStore)
		{
			try
			{
				this.callStore.setRecordState({
					state: this.commonRecord.state,
					type: this.commonRecord.type ?? null,
					initiatorId: this.commonRecord.initiatorId ?? null,
				});
			}
			catch (error)
			{
				console.error('[call.store] Pinia write failed in recording handler:', error);
			}
		}

		this.recordingUiService?.updateView(commonRecordState, {
			type: 'localRecord',
			initiatorId,
			currentUserId: this.userId,
			state,
		});

		if (!this.#canLocalRecord() || userId !== this.userId)
		{
			return;
		}

		const isStartedByMe = state === CallCommonRecordState.Started && initiatorId === this.userId;

		if (isStartedByMe)
		{
			this.recordingUiService?.handleLocalRecordStart({
				...this.#getAnalyticsCallParams(),
				callApiId: this.currentCall.id,
				callUuid: this.currentCall.uuid,
				dialogId: this.currentCall.associatedEntity.id,
				dialogName: this.currentCall.associatedEntity.name,
				formatRecordDate: this.formatRecordDate,
				recordType: this.commonRecord.type,
				isMicrophoneMuted: Hardware.isMicrophoneMuted,
				windowId: ViewRecordSource.Chat,
			});

			return;
		}

		if (state === CallCommonRecordState.Stopped)
		{
			this.recordingUiService?.trackLocalRecordStop(
				Util.getCallIdentifier(this.currentCall),
				this.getCallType(),
				this.commonRecord.info,
			);

			this.#stopCommonRecord();
		}
	}

	_onNetworkProblem() {}

	_onReconnecting(e)
	{
		Analytics.getInstance().onReconnect({
			...this.#getAnalyticsCallParams(),
			reconnectionReason: e.reconnectionReason,
			reconnectionReasonInfo: e.reconnectionReasonInfo,
			reconnectionEventCount: e.reconnectionEventCount,
			isVpnActive: this.#isVpnConnected(),
		});

		this.notificationService?.showReconnectingBalloon();
	}

	_onReconnected()
	{
		this.setReconnectingCameraId(this.lastUsedCameraId);
		// todo: restore after fixing balloon resurrection issue
		// related to multiple simultaneous calls to the balloon manager
		// now it's enabled for calls as a temp solution

		// noinspection UnreachableCodeJS
		this.notificationService?.closeReconnectingBalloon();

		if (this.viewPort)
		{
			this.viewPort.resetTalkingUsers();
			this.talkingUsers = {};
		}
	}

	_onReconnectingFailed(e)
	{
		Analytics.getInstance().onReconnectError({
			callId: Util.getCallIdentifier(this.currentCall),
			callType: this.getCallType(),
			errorCode: e?.error?.code,
			errorMessage: e?.error?.message,
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

	_onCustomMessage(event)
	{
		// there will be no more template selector in this call
		if (event.message === DOC_CREATED_EVENT)
		{
			this.documentEditorService?.setDocumentCreated();
		}
	}

	// Closes the incoming-call popup when the same user answered on another device.
	// Reacts at controller level (not inside the call object) so the close fires even if
	// Call::answer / Call::usersAnswered arrives in the race window between
	// engine creating `this.calls[uuid]` and controller binding `onJoin` via prepareIncomingCall.
	// Also handles the earlier race window: Pull can arrive before controller sets
	// `this.currentCall` (engine awaits broadcastRequest + controller awaits checkDesktop).
	// In that case we just record the answered-elsewhere mark — onIncomingCall will skip the modal.
	#onPullSelfAnswerElsewhere(command, params)
	{
		if (command !== 'Call::answer' && command !== 'Call::usersAnswered')
		{
			return;
		}

		if (this.currentCall?.ready)
		{
			return;
		}

		const eventCallId = params?.call?.ID || params?.call?.id || params?.callId;
		const eventCallUuid = params?.call?.UUID || params?.call?.uuid || params?.callUuid;

		if (!eventCallId && !eventCallUuid)
		{
			return;
		}

		// If currentCall is already set, react only to events for that very call.
		// If it's not set yet, fall through — we'll mark the elsewhere answer by event ids.
		if (this.currentCall)
		{
			const currentCallId = this.currentCall.id;
			const currentCallUuid = this.currentCall.uuid;
			const matchesCurrentCall = (currentCallUuid && eventCallUuid && currentCallUuid === eventCallUuid)
				|| (currentCallId && eventCallId && String(currentCallId) === String(eventCallId));
			if (!matchesCurrentCall)
			{
				return;
			}
		}

		const myInstanceId = this.currentCall?.instanceId;
		const candidates = command === 'Call::usersAnswered'
			? (Array.isArray(params?.senders) ? params.senders : [])
			: [params];

		// Without a local instanceId yet (currentCall not created here), any self-answer
		// with a non-empty callInstanceId is by definition elsewhere — we just haven't
		// created our local call object on this device.
		const elsewhere = candidates.some((entry) =>
			Number(entry?.senderId) === this.userId
			&& entry?.callInstanceId
			&& (!myInstanceId || entry.callInstanceId !== myInstanceId),
		);
		if (!elsewhere)
		{
			return;
		}

		// Record by both forms — onIncomingCall uses Util.getCallIdentifier which returns
		// id (Number) for legacy/classic and uuid (String) for jwt. Without currentCall we
		// don't know the scheme.
		// TTL ~5s separates race (initial invite right after self-answer, comes in <1s)
		// from manual re-invite into the same callUuid (user-driven, much later).
		const markKeys = [];
		if (eventCallUuid)
		{
			this.answeredOrDeclinedCalls.add(eventCallUuid);
			this.answeredElsewhereCalls.add(eventCallUuid);
			markKeys.push(eventCallUuid);
		}
		if (eventCallId)
		{
			const normalizedId = Number.isNaN(Number(eventCallId)) ? eventCallId : Number(eventCallId);
			this.answeredOrDeclinedCalls.add(normalizedId);
			this.answeredElsewhereCalls.add(normalizedId);
			markKeys.push(normalizedId);
		}
		setTimeout(() => {
			markKeys.forEach((key) => {
				this.answeredElsewhereCalls.delete(key);
				this.answeredOrDeclinedCalls.delete(key);
			});
		}, 7000);

		if (!this.currentCall)
		{
			// No UI to tear down on this device — mark is enough to block upcoming onIncomingCall.
			return;
		}

		clearTimeout(this.hideIncomingCallTimeout);
		this.messengerFacade.stopRepeatSound(this.audioRingtone);
		this.#closeCallPopups();

		this.#teardownCallConnection();
		this.currentCall = null;

		this.#clearPromotedAdminTimeout();
	}

	_onCallJoin(e)
	{
		if (this.viewPort && !this.clickLinkInterceptor)
		{
			this.clickLinkInterceptor = Util.getClickLinkInterceptor();
			this.clickLinkInterceptor.startIntercepting();
		}

		if (e.local)
		{
			// self answer
			if (this.currentCall && this.currentCall instanceof VoximplantCall)
			{
				Util.reportConnectionResult(this.currentCall.id, true);
			}

			return;
		}

		// remote answer, stop ringing and hide incoming cal notification
		if (this.currentCall)
		{
			this.#teardownCallConnection();
			this.currentCall = null;
		}

		this.#clearPromotedAdminTimeout();

		if (this.viewPort)
		{
			this.viewPort.close();
		}

		this.#closeCallPopups();

		this.floatingWindowService?.hide();

		this.notificationService?.closeMutePopup();

		this.messengerFacade.stopRepeatSound('dialtone');
		this.messengerFacade.stopRepeatSound(this.audioRingtone);
	}

	_onCallLeave(e)
	{
		console.log('_onCallLeave', e);
		if (!e.local && this.currentCall && this.currentCall.ready)
		{
			this.log(new Error('received remote leave with active call!'));

			return;
		}

		Hardware.isMicrophoneMuted = false;

		this.#stopCommonRecord();

		this.documentEditorService?.resetDocumentCreated();
		let callDetails;

		if (this.getActiveCallUsers().length === 0 && Boolean(this.viewPort) && !this.isCallHangupButtonPressed)
		{
			Analytics.getInstance().onFinishCall({
				...this.#getAnalyticsCallParams(),
				status: Analytics.AnalyticsStatus.lastUserLeft,
				chatId: this.currentCall.associatedEntity.id,
				callUsersCount: this.getMaxActiveCallUsers().length,
				callLength: Util.getTimeInSeconds(this.currentCall.startDate),
			});

			this.isCallHangupButtonPressed = false;
		}

		if (this.currentCall && this.currentCall.associatedEntity)
		{
			this.#teardownCallConnection();

			callDetails = this.#getCallDetail(this.currentCall);
			this.currentCall = null;
		}

		this.#clearPromotedAdminTimeout();

		if (this.childCall)
		{
			this.#removeChildCallEvents(this.childCall);
			this.childCall.hangup(false, '', true);
			this.childCall = null;
		}

		this.#clearSavedScreenStream();

		if (this.viewPort)
		{
			this.viewPort.close();
		}

		this.#stopAllMediaStreams();

		this.#closeCallPopups();

		this.togglePictureInPictureCallWindow({ isForceClose: true });

		this.#teardownCallUi();

		this.hangupOptionsUiService?.destroy();
		this.hangupOptionsUiService = null;

		if (this.clickLinkInterceptor)
		{
			this.clickLinkInterceptor.stopIntercepting();
			this.clickLinkInterceptor = null;
		}

		this.emit(Events.onCallLeft, {
			callDetails,
		});
	}

	#onGetUserMediaEnded()
	{
		Hardware.getCurrentDeviceList();
	}

	#onGetUserMediaFailed(data)
	{
		this.notificationService?.showGetUserMediaFailedNotification(data);
	}

	_onUpdateLastUsedCameraId()
	{
		const cameraId = this.currentCall.cameraId;

		if (cameraId)
		{
			this.lastUsedCameraId = cameraId;
		}
	}

	#getCallDetail(call)
	{
		return {
			id: Util.getCallIdentifier(call),
			provider: call.provider,
			chatId: call.associatedEntity.id,
			userCount: call.users.length,
			browser: Util.getBrowserForStatistics(),
			isMobile: Browser.isMobile(),
			isConference: false,
			wasConnected: call.wasConnected,
		};
	}

	_onInvitePopupDestroy()
	{
		this.invitePopup = null;
		this.viewPort?.setHotKeyTemporaryBlock(false);
	}

	_onInvitePopupSelect(e: { users: UserData })
	{
		this.invitePopup?.close();

		if (!this.currentCall || !e.users.length)
		{
			return;
		}

		Analytics.getInstance().onInviteUser({
			...this.#getAnalyticsCallParams(),
			chatId: this.currentCall.associatedEntity.id,
		});

		const currentUsers = this.currentCall.getUsers();
		const usersToInvite = [];
		const userData = {};
		let totalUsers = Object.keys(currentUsers).length;

		const newProvider = Util.getConferenceProvider();
		const isLegacyCall = Util.isLegacyCall(newProvider);

		e.users.forEach((user) =>
		{
			const userId = user.id;
			userData[userId] = user;

			if (totalUsers < Util.getUserLimit() - 1 || currentUsers.hasOwnProperty(userId))
			{
				totalUsers++;
				usersToInvite.push(userId);
				this.viewPort?.addUser(userId, UserState.Calling);
				// Drop any stale "user declined|busy|failed" balloon for the
				// invitee — a manual re-invite means the previous post-decline
				// notification is no longer relevant.
				this.notificationService?.closeUserCallStateNotification(userId);
			}
		});

		Util.setUserData(userData);
		this.viewPort?.updateUserData(userData);

		if (Util.isCallServerAllowed() && this.currentCall.provider === Provider.Plain)
		{
			this.#teardownCallConnection();
			if (this.currentCall.isScreenSharingStarted())
			{
				if (this.currentCall.transferScreenStream)
				{
					this.savedScreenStream = this.currentCall.transferScreenStream();
				}
				else
				{
					this.currentCall.stopScreenSharing();
				}
			}

			const onInviteSuccess = (call) => {
				this.childCall = call;
				this.#bindChildCallEvents(this.childCall, true);

				this.updateDeviceIdInChildCall();

				const options = {
					users: isLegacyCall ? this.childCall.users : usersToInvite,
					show: isLegacyCall,
				};

				this.childCall.inviteUsers(options);

				this.viewPort?.updateCopilotFeatureState(this.childCall?.isCopilotFeaturesEnabled);
			};

			const onInviteFailure = (error) => {
				this.log('Can\'t invite users', error);
				this.bindCallEvents();

				usersToInvite.forEach((userId) => {
					this.viewPort?.setUserState(userId, UserState.Idle);
				});
			};

			const createChildCallPromise = isLegacyCall
				? CallEngineLegacy.createChildCall(
					this.currentCall.id,
					newProvider,
					usersToInvite,
					{ debug: this.debug },
				)
				: CallEngine.createChildCall(
					this.currentCall,
					newProvider,
					usersToInvite,
					{ debug: this.debug, videoEnabled: Hardware.isCameraOn },
				);

			createChildCallPromise
				.then((callData) => onInviteSuccess(callData.call))
				.catch((error) => onInviteFailure(error));

			this.viewPort?.removeScreenUsers();
		}
		else if (usersToInvite.length > 0)
		{
			this.currentCall.inviteUsers({
				userData,
				users: usersToInvite,
				show: true,
			});
		}
	}

	_onDocumentBodyClick(event)
	{
		const { target } = event;

		if (target.matches('input[type="file"]'))
		{
			this.onInputFileOpenedStateUpdate(true);
		}
	}

	_onWindowFocus()
	{
		if (DesktopApi.isDesktop())
		{
			this._onWindowDesktopFocus();
		}

		if (DesktopApi.isDesktop() && this.pipService?.isFileChooserActive)
		{
			this.onInputFileOpenedStateUpdate(false);
		}

		this.updateWindowFocusState(true);
	}

	_onWindowBlur()
	{
		if (DesktopApi.isDesktop())
		{
			this._onWindowDesktopBlur();
		}

		this.updateWindowFocusState(false);
	}

	_onWindowDesktopFocus()
	{
		if (!this.layoutService?.isDetached)
		{
			this.floatingWindowService?.hide();
			this.floatingWindowService?.hideScreenShareWindow();
		}
	}

	_onWindowDesktopBlur()
	{
		if (this.currentCall && this.viewPort)
		{
			this.floatingWindowService?.show({
				title: this.currentCall.associatedEntity.name,
			});
		}

		if (this.currentCall && this.viewPort && this.currentCall.isScreenSharingStarted())
		{
			this.floatingWindowService?.showScreenShareWindow(null);
		}
	}

	_onBeforeUnload(e)
	{
		this.floatingWindowService?.destroy();

		this.#closeCallPopups();

		if (this.hasActiveCall())
		{
			e.preventDefault();
			e.returnValue = '';
		}
	}

	_onImTabChange(currentTab)
	{
		if (currentTab === 'notify' && this.currentCall && this.viewPort)
		{
			this.fold(Text.decode(this.currentCall.associatedEntity.name));
		}
	}

	_onUpdateChatCounter(counter)
	{
		if (
			!this.currentCall
			|| !this.currentCall.associatedEntity
			|| !this.currentCall.associatedEntity.id
			|| !this.viewPort
		)
		{
			return;
		}

		if (Number.isNaN(parseInt(counter, 10)))
		{
			Util.sendLog(`[call] setButtonCounter chat: counter = ${counter} (NaN)`);
		}
		this.buttonStateService?.setChatCounter(counter);
	}

	_onDeviceChange(e)
	{
		if (!this.currentCall || !this.currentCall.ready)
		{
			return;
		}

		const allAddedDevice = e.data.added;
		const allRemovedDevice = e.data.removed;
		const removed = Hardware.getRemovedUsedDevices(e.data.removed, {
			microphoneId: this.currentCall.microphoneId,
			cameraId: this.currentCall.cameraId,
			speakerId: this.viewPort.speakerId,
		});

		this.log('New devices: ', allAddedDevice);
		if (allAddedDevice)
		{
			setTimeout(() => this.useDevicesInCurrentCall(allAddedDevice), 500);
		}

		this.log('Removed devices: ', allRemovedDevice);

		const removedWithLabels = removed.filter((d) => d.label && d.label.trim() !== '');
		this.log('Removed devices: ', removedWithLabels);
		this.notificationService?.showDevicesDetachedNotification(removedWithLabels);

		if (allRemovedDevice)
		{
			setTimeout(() => this.removeDevicesFromCurrentCall(allRemovedDevice), 500);
		}
	}

	_onFloatingVideoButtonClick(e)
	{
		switch (e.buttonName)
		{
			case 'toggleMute':
				this._onCallViewToggleMuteButtonClick(e);
				break;
			case 'hangup':
				this._onCallViewHangupButtonClick();
				break;
		}
	}

	_onFloatingScreenShareChangeScreenClick()
	{
		if (this.currentCall)
		{
			this.currentCall.startScreenSharing(true);
		}
	}

	_onResize()
	{
		this.documentEditorService?._onResize();
	}

	#teardownCallConnection()
	{
		this.removeVideoStrategy();
		this.removeCallEvents();
	}

	#stopAllMediaStreams()
	{
		for (const mediaStreamKind of Object.values(MediaStreamsKinds))
		{
			CallStreamManager.stopStream(mediaStreamKind);
		}
		this.hasStreamFromCall = false;
		this.layoutService?.stopLocalStream();
	}

	#applyDefaultDevicesToCurrentCall()
	{
		if (Hardware.defaultMicrophone)
		{
			this.currentCall.setMicrophoneId(Hardware.defaultMicrophone);
		}

		if (Hardware.defaultCamera)
		{
			this.currentCall.setCameraId(Hardware.defaultCamera);
		}
	}

	async #handleJoinCallError(error)
	{
		let errorCode = Util.getCallConnectionErrorCode(error);
		const errorMessage = Util.getCallConnectionErrorMessage(error);

		if (errorCode === 'UNKNOWN_ERROR' && error?.message)
		{
			errorCode = getUnknownErrorType(error?.message);
		}

		await accidentLogger.addLog(error, errorCode);

		Analytics.getInstance().onJoinCallError({
			callType: this.getCallType(),
			errorCode,
			callId: Util.getCallIdentifier(this.currentCall),
			errorMessage,
			isVpnActive: this.#isVpnConnected(),
		});
	}

	#clearPromotedAdminTimeout()
	{
		if (this.promotedToAdminTimeout)
		{
			clearTimeout(this.promotedToAdminTimeout);
		}
	}

	#teardownCallUi()
	{
		this.floatingWindowService?.hide();
		this.floatingWindowService?.hideScreenShareWindow();
		this.layoutService?.closeWebScreenSharePopup();
		this.notificationService?.closeMutePopup();

		if (DesktopApi.isDesktop())
		{
			DesktopApi.closeWindow(DesktopApi.findWindow('callBackground'));
		}

		this.promoService?.closeAll();

		if (this.notificationService)
		{
			this.notificationService.allowMutePopup = true;
		}

		this.notificationService?.closeReconnectingBalloon();
		this.notificationService?.closeRemoteVideoMutedBalloon();

		this.messengerFacade.stopRepeatSound('dialtone');
		this.messengerFacade.stopRepeatSound(this.audioRingtone);
	}

	#closeCallPopups()
	{
		if (this.callNotification)
		{
			this.callNotification.close();
		}

		if (this.participantsPermissionPopup)
		{
			this.participantsPermissionPopup.close();
		}

		if (this.invitePopup)
		{
			this.invitePopup.close();
		}
	}

	destroy()
	{
		this.floatingWindowService?.destroy();
		this.floatingWindowService = null;

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		this.callMultiBroadcastClient && this.callMultiBroadcastClient.destroy();

		Hardware.unsubscribe(Hardware.Events.onChangeMirroringVideo, this._onCallLocalCameraFlipHandler);
		Hardware.unsubscribe(Hardware.Events.onChangeMicrophonePermission, this.#onChangeMicrophonePermissionHandler);
		Hardware.unsubscribe(Hardware.Events.onChangeMicrophoneMuted, this.#onHardwareMicrophoneMutedChangeHandler);
		Hardware.unsubscribe(Hardware.Events.onChangeCameraOn, this.#onHardwareCameraOnChangeHandler);
	}

	log()
	{
		if (this.currentCall)
		{
			const arr = [Util.getCallIdentifier(this.currentCall)];

			CallEngine.log.apply(CallEngine, arr.concat(Array.prototype.slice.call(arguments)));
		}
		else
		{
			CallEngine.log.apply(CallEngine, arguments);
		}
	}

	getMaxActiveMicrophonesCount()
	{
		return 4;
	}

	_onCallToggleSubscribe(e) {
		if (this.currentCall && this.currentCall.provider === Provider.Bitrix)
		{
			this.currentCall.toggleRemoteParticipantVideo(e.participants, e.showVideo, true);
		}
	}

	_onChangeVideoQuality(event)
	{
		if (this.currentCall && this.currentCall.provider === Provider.Bitrix)
		{
			const params = {
				isCameraWasEnabledBeforeQualityChanged: event.isCameraWasEnabledBeforeQualityChanged,
				videoQuality: event.videoQuality,
				otherUsers: this.currentCall.users,
			};
			this.currentCall.setVideoQualityForStreams(params);
		}
	}

	_onCallUserClick(e)
	{
		Analytics.getInstance().onClickUser({
			...this.#getAnalyticsCallParams(),
			layout: Object.keys(ViewLayout).find((key) => ViewLayout[key] === e.layout),
		});
	}

	#onChangeMicrophonePermission(event)
	{
		const { state } = event.data;

		if (!this.currentCall)
		{
			return;
		}

		const isPlainCall = this.currentCall.provider === Provider.Plain;

		// Firefox returns 'prompt' instead of 'denied' when permission is revoked
		const isPermissionBlocked =			state === Hardware.CALL_HARDWARE_PERMISSIONS_STATE.DENIED
			|| (BX.browser.IsFirefox() && state === Hardware.CALL_HARDWARE_PERMISSIONS_STATE.PROMPT);

		if (isPlainCall && !Hardware.isMicrophoneMuted && isPermissionBlocked)
		{
			Hardware.isMicrophoneMuted = true;
			this.notificationService?.showNotification(Loc.getMessage('CALL_ERROR_MICROPHONE_STREAM_STOPPED'));
		}
	}

	#onHardwareMicrophoneMutedChange(event)
	{
		if (this.callStore)
		{
			this.callStore.setMediaState({ isMicrophoneMuted: event.data.isMicrophoneMuted });
		}
	}

	#onHardwareCameraOnChange(event)
	{
		if (this.callStore)
		{
			this.callStore.setMediaState({ isCameraOn: event.data.isCameraOn });
		}
	}

	static FeatureState = FeatureState;
	static Events = Events;
	static ViewState = ViewState;
	static DocumentType = DocumentType;
}
