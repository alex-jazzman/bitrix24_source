import { Loc, Browser, Dom, Type, Text, Tag, Reflection, ZIndexManager, Extension } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { Center as NotificationCenter } from 'ui.notification';

import { LocalStorage } from 'im.lib.localstorage';
import { SoundType, DesktopBroadcastAction } from 'im.v2.const';
import { DesktopBroadcastManager } from 'im.v2.lib.desktop';
import { DesktopApi, DesktopFeature } from 'im.v2.lib.desktop-api';

import { resolveCallWindowName } from 'call.lib.a11y';
import { Analytics, shouldSendToggleMicrophone, toAnalyticsErrorStatus } from 'call.lib.analytics';
import { CallTokenManager } from 'call.lib.call-token-manager';
import { CallLogContextRegistry, CallSettingsManager, type CallLogContext } from 'call.lib.settings-manager';

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
import { BackgroundDialog } from 'call.lib.background-dialog';
import { IncomingCall } from 'call.application.incoming';
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
import { decideSlotAction, SlotDecision } from './services/call-slot-policy';
import { CopilotUiService } from './services/copilot-ui-service';
import { DocumentEditorService } from './services/document-editor-service';
import { FeedbackUiService } from './services/feedback-ui-service';
import { FloatingWindowService } from './services/floating-window-service';
import { HangupOptionsUiService } from './services/hangup-options-ui-service';
import { LayoutService } from './services/layout-service';
import { NotificationService } from './services/notification-service';
import { PictureInPictureService } from './services/picture-in-picture-service';
import { RecordingUiService } from './services/recording-ui-service';
import { TabBlinker } from './services/tab-blinker.js';
import { CallTabNotifier } from './services/call-tab-notifier.js';
import Util, { CALL_ALREADY_FINISHED_EVENT } from './util';
import { CopilotAttemptDirection } from './utils/copilot-attempt-direction';
import { CopilotOwnAttempt } from './utils/copilot-own-attempt';
import { getUnknownErrorType } from './utils/get-unknown-error-type';
import { isBusinessLeaveReason } from './utils/is-business-leave-reason';
import { ReconnectSeriesReporter } from './utils/reconnect-series-reporter';
import { VideoStrategy } from './video_strategy';
import { type CallView } from 'call.lib.view-contract';
import { CopilotNotifyType } from './view/copilot-notify';
import { CopilotPopup } from './view/copilot-popup';
import {
	ViewEvent,
	ViewLayout,
	ViewSize,
	ViewRoomState,
	ControllerEvent,
} from 'call.mapping';
import { MediaRenderer } from './view/media-renderer';
import { ParticipantsPermissionPopup } from './view/participants-permission-popup';
// TODO: [call-vue] revisit lobby orchestration placement during the Vue call card iteration
import { LobbyManager } from 'call.component.lobby';
import { WebScreenSharePopup } from './web_screenshare_popup';

import './css/call-overlay.css';

// onOpenVideoConference/onPromoViewed come from call.mapping's ControllerEvent — they are the
// only two events call.lib.call-manager wires up via #buildEngineContext's ControllerEvent
// listener map. onViewStateChanged/onCallJoined/onCallLeft/onCallDestroyed are call.core-internal
// and stay local string literals; they are not part of that cross-extension contract.
const Events = {
	onViewStateChanged: 'onViewStateChanged',
	onOpenVideoConference: ControllerEvent.onOpenVideoConference,
	onPromoViewed: ControllerEvent.onPromoViewed,
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
	callNotification: ?IncomingCall;
	viewPort: ?CallView;
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

	// True while a plain-JWT createCall is in flight; keeps leaveCurrentCall from aborting v2/join.
	#pendingCreateCallIsPlainJwt = false;

	// The element that held focus when the call gesture happened; the window returns focus to it on close.
	#pendingOpener = null;

	#onCallFailureHandler;
	#onReconnectSeriesOutcomeHandler;
	#onCommonRecordMenuHandler;
	#onPiPViewBodyClickHandler;
	#onPushToTalkShortPressHandler;

	// Calls where the user explicitly picked a microphone; hot-plug must not override that choice.
	#callsWithManualMicrophone = new WeakSet();

	// A recorder status arriving without a mark answers somebody else's command and is not reported
	// as ours.
	#copilotOwnAttempt = new CopilotOwnAttempt();

	// One analytics event per reconnect series on each end of it; the engines limit reconnect events
	// differently, so the decision belongs here.
	#reconnectSeriesReporter = new ReconnectSeriesReporter({
		getCall: () => this.currentCall,
		getCallId: () => Util.getCallIdentifier(this.currentCall),
		getCallType: () => this.getCallType(),
		isVpnActive: () => this.#isVpnConnected(),
	});

	#tabBlinker = new TabBlinker();
	#callTabNotifier = new CallTabNotifier(this.#tabBlinker, {
		blinkTitle: (name) => Loc.getMessage('CALL_MULTI_TAB_BLINK_TITLE', { '#CALL_NAME#': name }),
		notificationTitle: (name) => Loc.getMessage('CALL_MULTI_TAB_NOTIFICATION_TITLE', { '#CALL_NAME#': name }),
		notificationBody: Loc.getMessage('CALL_MULTI_TAB_NOTIFICATION_BODY'),
	});

	#alreadyFinishedShownUuids = new Set();

	#onCallAlreadyFinished = (event) => {
		const { callUuid } = event.getData() || {};
		if (!callUuid || this.#alreadyFinishedShownUuids.has(callUuid))
		{
			return;
		}
		this.#alreadyFinishedShownUuids.add(callUuid);
		// Bound the dedup set so it cannot grow unbounded over a long session.
		if (this.#alreadyFinishedShownUuids.size > 100)
		{
			const oldest = this.#alreadyFinishedShownUuids.values().next().value;
			this.#alreadyFinishedShownUuids.delete(oldest);
		}

		// If the dead call is the one currently ringing, drop it synchronously:
		// mark it answered/declined, close its card, tear down its connection and
		// clear currentCall. Closing the card alone leaves currentCall set, which
		// makes prepareIncomingCall reject the next incoming call until a deferred
		// Pull finish clears it — or forever if the recovery request fails.
		if (this.currentCall?.uuid === callUuid)
		{
			// The room the reconnect went after is gone, and this branch folds the call up on its own,
			// past every other point where an open series would learn its outcome.
			this.#reconnectSeriesReporter.reportCallLost();

			this.answeredOrDeclinedCalls.add(Util.getCallIdentifier(this.currentCall));
			this.closeCallNotification();
			this.#teardownCallConnection();
			this.currentCall = null;
		}

		NotificationCenter.notify({
			content: Text.encode(Loc.getMessage('CALL_ALREADY_FINISHED_NOTIFICATION')),
			position: 'top-right',
			autoHideDelay: 5000,
			closeButton: true,
		});
	};

	#startingCallLogContext: ?CallLogContext = null;

	// Live snapshot for accident log records; must stay cheap and exception-free
	#provideCallLogContext = (): CallLogContext => {
		const call = this.currentCall;
		const startingContext = this.#startingCallLogContext;

		// During a call switch the previous call lingers in currentCall (hangup is async),
		// so a mid-join to a different room must win over the stale live call
		if (Type.isStringFilled(startingContext?.roomId) && call?.uuid !== startingContext.roomId)
		{
			return startingContext;
		}

		if (call)
		{
			return {
				roomId: Type.isStringFilled(call.uuid) ? call.uuid : undefined,
				callId: this.#toCallLogNumber(call.id),
				chatId: this.#toCallLogNumber(call.associatedEntity?.chatId),
			};
		}

		return startingContext ?? {};
	};

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
		this.cameraBlockedForLegacyMobile = false;

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

		CallLogContextRegistry.registerProvider(this.#provideCallLogContext);

		if (needInit)
		{
			this.init();
			this.#subscribeEvents(config);
			EventEmitter.subscribe(CALL_ALREADY_FINISHED_EVENT, this.#onCallAlreadyFinished);
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
		this.#onReconnectSeriesOutcomeHandler = this.#onReconnectSeriesOutcome.bind(this);
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
		this.#onPushToTalkShortPressHandler = this.#onPushToTalkShortPress.bind(this);
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

		this.callMultiBroadcastClient = new BroadcastRequestChannel('call_controller_multi_channel');

		this.callMultiBroadcastClient.executer(({ callUuid, silent }) => {
			const hasActiveCall = this.currentCall?.uuid === callUuid && Boolean(this.viewPort);

			if (hasActiveCall && !silent)
			{
				if (DesktopApi.isDesktop())
				{
					BXDesktopSystem.SetActiveTab();

					return true;
				}

				const isPlainCall = this.currentCall.provider === Provider.Plain;

				if (isPlainCall)
				{
					this.#callTabNotifier.notify(Text.decode(this.currentCall?.associatedEntity.name ?? ''));

					return true;
				}

				return false;
			}

			if (hasActiveCall)
			{
				return true;
			}

			if (silent)
			{
				return this.messengerFacade?.isCallJoinedOnDevice?.(callUuid) ?? false;
			}

			return false;
		});

		CallEngine.multiBroadcastClient.executer(() => Boolean(this.viewPort));

		this.inited = true;
	}

	sendBroadcastRequest(callUuid, { silent = false, timeout = 100 } = {})
	{
		return this.callMultiBroadcastClient.broadcastRequest({ callUuid, silent }, { timeout });
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
		this.currentCall.addEventListener(CallEvent.onReconnectSeriesOutcome, this.#onReconnectSeriesOutcomeHandler);
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

		// what can be recorded is known only once the call and its provider are: until then the button
		// announces the route of a call that does not exist yet
		this.#syncRecordButtonPopupKind();
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
		this.currentCall.removeEventListener(CallEvent.onReconnectSeriesOutcome, this.#onReconnectSeriesOutcomeHandler);
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
		// The destroy event carries no view, so the view is captured here: teardown of an old window
		// must not wipe the window of the call that has already taken the slot.
		const boundViewPort = this.viewPort;

		this.viewPort.setCallback(ViewEvent.onShow, this._onCallViewShowHandler);
		this.viewPort.setCallback(ViewEvent.onClose, this._onCallViewCloseHandler);
		this.viewPort.setCallback(ViewEvent.onDestroy, () => this._onCallViewDestroy(boundViewPort));
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
		this.viewPort.setCallback(ViewEvent.onPushToTalkShortPress, this.#onPushToTalkShortPressHandler);

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
		// Released right away: an opener outliving its gesture would stick to the next window.
		const focusOpener = this.#pendingOpener;
		this.#pendingOpener = null;

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
				focusOpener,
				getCurrentCall: () => this.currentCall,
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

	/**
	 * Starts local stream preparation without blocking the call start chain.
	 * A denied permission rejects here and must not surface as an unhandled rejection.
	 */
	#prepareLocalStreamInBackground(provider)
	{
		this.layoutService?.prepareLocalStream({
			provider,
			Hardware,
			CallStreamManager,
			UnsupportedBrowserFeatures,
			MediaRenderer,
		}).catch((error) => {
			console.error('Can\'t prepare local stream for a prepared call', error);
		});
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
		});

		this.layoutService = new LayoutService({
			viewPort: this.viewPort,
			container: this.container,
			resizeObserver: this.resizeObserver,
		});

		this.notificationService = new NotificationService({
			viewPort: this.viewPort,
			container: this.container,
			onAskSpeakButtonClicked: () => this._onCallViewFloorRequestButtonClick(),
			onUnmuteMicButtonClicked: () => this._onCallViewToggleMuteButtonClick({ muted: false }),
		});

		this.layoutService.subscribe('LayoutService::onFold', () => {
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
			// Forced entry only for an explicit "return to call" gesture, which must reach the window
			// wherever the focus stands. Unforced it yields to a focus outside the window - the chat,
			// a promo - but still takes it from the elements of the window itself.
			this.viewPort?.focusWindow({ force: this.#unfoldIsReturnGesture(data) });
		});

		this.layoutService.subscribe('LayoutService::onUnfoldDetached', ({ data }) => {
			this.floatingWindowService?.hide();
			this.floatingWindowService?.hideScreenShareWindow();
			// A detached window is shown again instead of unfolded, so the entry above never runs for it.
			this.viewPort?.focusWindow({ force: this.#unfoldIsReturnGesture(data) });
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
		});

		this.feedbackUiService = new FeedbackUiService({
			viewPort: this.viewPort,
			container: this.container,
			darkMode: this.messengerFacade.isThemeDark(),
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
		});

		this.documentEditorService.subscribe('DocumentEditorService::onOpen', () => {
			if (this.viewPort)
			{
				this.buttonStateService?.activateDocumentButton(true);
			}
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
		});

		this.recordingUiService = new RecordingUiService({
			viewPort: this.viewPort,
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

		this.recordingUiService.subscribe('RecordingUiService::onLocalRecordStartFailed', () => {
			this.notificationService?.showLocalRecordStartFailed();
			this.#stopCommonRecord();
		});

		this.copilotUiService = new CopilotUiService({
			viewPort: this.viewPort,
			container: this.container,
			CopilotPopupClass: CopilotPopup,
			onTariffGate: () => Util.openArticle(CallAI.helpSlider),
			copilotModelName: Extension.getSettings('call.core').ai?.copilotModelName ?? null,
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
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onMainAreaClick', () => {
				this.layoutService?.unfold({ isReturnGesture: true });
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onButtonClick', ({ data }) => {
				this._onFloatingVideoButtonClick(data);
			});

			this.floatingWindowService.subscribe('FloatingWindowService::onBackToCall', () => {
				DesktopApi.activateWindow();
				DesktopApi.changeTab('im');
				this.layoutService?.unfold({ isReturnGesture: true });
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
			this.layoutService?.updateUsers(
				this.currentCall,
				this.currentCall.userData,
				Object.keys(this.currentCall.userData),
				{ forceFetch: true },
			) ?? this.viewPort.updateUserData(this.currentCall.userData);

			userDataInt = convertAllItemsToInt(Object.keys(this.currentCall.userData));
			notIncludedEl = userListInt.filter((id) => !userDataInt.includes(id));
		}

		if (this.currentCall.userData && notIncludedEl.length === 0)
		{
			this.layoutService?.refreshUsers(this.currentCall, userListInt, { force: true });

			return;
		}

		Util.getUsers(callId, userListInt).then((userData) =>
		{
			this.layoutService?.updateUsers(
				this.currentCall,
				userData,
				userListInt,
				{ forceFetch: true },
			) ?? this.viewPort.updateUserData(userData);
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

			document.body.appendChild(externalContainer);
		}

		// A modal focus trap marks body siblings inert; the call window opts out on every call,
		// not only when this container happens to be created here.
		externalContainer.setAttribute('data-a11y-ignore-inert', 'true');

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
		// The call being left is still in the slot; after the teardown below nothing of it is heard.
		this.#reconnectSeriesReporter.reportCallLost();

		this.#teardownCallConnection();
		this.#bindChildCallEvents(this.childCall);

		const provider = this.childCall.provider;
		const uuid = this.childCall.uuid;

		const isLegacyCall = Util.isLegacyCall(provider, this.childCall.scheme);

		this.initCallPromise = isLegacyCall
			? Promise.resolve()
			: CallTokenManager.getToken(this.childCall.associatedEntity.chatId);
		const thisPromise = this.initCallPromise;

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
				if (this.initCallPromise !== thisPromise)
				{
					return Promise.reject({ code: 'CALL_CANCELLED' });
				}

				this.childCall.answer();
			})
			.catch((error) => {
				if (error?.code === 'CALL_CANCELLED')
				{
					return;
				}

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

		// Above removeCallEvents(): the one-to-one call is hung up below, and by then no event of it
		// reaches the controller on any engine.
		this.#reconnectSeriesReporter.reportCallLost();

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

		this.callNotification = new IncomingCall({
			callType: 'regular',
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
		});

		this.callNotification.show();
		this.scheduleCancelNotification(false);

		this.messengerFacade.repeatSound(this.audioRingtone, 3500, true);
	}

	showIncomingConference()
	{
		this.callNotification = new IncomingCall({
			callType: 'conference',
			zIndex: this.messengerFacade.getDefaultZIndex() + 200,
			callerName: this.currentCall.associatedEntity.name,
			callerAvatar: this.currentCall.associatedEntity.avatar,
			callerColor: this.currentCall.associatedEntity.avatarColor,
			onClose: this._onCallNotificationClose.bind(this),
			onDestroy: this._onCallNotificationDestroy.bind(this),
			onButtonClick: this._onCallNotificationButtonClick.bind(this),
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
		// A guest calls the people of their own chat only, while the selector behind this button reaches the
		// whole portal - so the button is offered blocked rather than live-but-silent. Blocking is how this
		// interface already says "not available here" (@see ButtonStateService.blockForLegacyMobile).
		if (!this.messengerFacade.showUserSelector || needBlockAddButton || this.#isGuestUser())
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

		// The guard goes first: while another call is being initialized this click is ignored and the slot
		// stays untouched. Releasing it here would decline the ringing call without entering anywhere.
		if (this.initCallPromise)
		{
			return;
		}

		const call = CallEngineLegacy.getCallWithDialogId(dialogId) || CallEngine.getCallWithDialogId(dialogId);
		if (call)
		{
			// The addressed dialog already has a call: the decision about the slot belongs to the entry that
			// actually enters it, so joinCall() takes its own snapshot, captures its own opener and releases
			// the slot on its own.
			this.joinCall(call.id, call.uuid, video, { chatInfo: call.associatedEntity, mustCreate: true });

			return;
		}

		// Captured before the slot is released: tearing the previous call down moves the focus away from the
		// element that started this gesture. By the time the window is built the chat header may be redrawn.
		this.#pendingOpener = document.activeElement;

		// A new call is being created. A target without a call key never matches the slot, so the decision is
		// Enter or a release — never Unfold: an explicit call must not turn into "show the ringing call".
		this.#releaseCallSlot(decideSlotAction(this.#getSlotSnapshot(), { callKey: null, dialogId }));

		this.onConnectToCallClick = Date.now();

		this.feedbackUiService?.destroy();

		let provider = Provider.Plain;
		if (dialogId.toString().startsWith('chat'))
		{
			provider = Util.getConferenceProvider();
		}

		const isPlainCall = provider === Provider.Plain;
		const isLegacyCall = Util.isLegacyCall(provider);

		const callTokenPromise = isLegacyCall ? Promise.resolve() : CallTokenManager.getToken(chatInfo.chatId);

		const isCallPrepared = this.preparedCall?.dialogId === dialogId;

		const startingCallLogContext = this.#beginStartingCallLogContext({
			chatId: this.#toCallLogNumber(chatInfo?.chatId),
		});
		let createdCall = null;

		const debug1 = Date.now();
		this.initCallPromise = this.messengerFacade.openMessenger(dialogId);
		const thisPromise = this.initCallPromise;
		this.#pendingCreateCallIsPlainJwt = isPlainCall && !isLegacyCall;

		this.initCallPromise
			.then(() => {
				return Hardware.init();
			})
			.then(async () => {
				if (video && isCallPrepared)
				{
					this.#prepareLocalStreamInBackground(provider);
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

				const createCall = () => callEngine.createCall({
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

				return createCall().then((result) => this.#recoverFromZombieRoom(result, createCall));
			})
			.then((e) => {
				if (this.initCallPromise !== thisPromise)
				{
					// This tab created the room and then abandoned it, so finish it instead of
					// leaving a zombie. Only a fresh 1-1 room (isNew, numeric dialogId): a group
					// room or one we merely joined may already hold other participants.
					const isGroupRoom = dialogId.toString().startsWith('chat');
					if (e?.call && isPlainCall && e.isNew && !isGroupRoom)
					{
						e.call.hangup(true, '', true)?.catch?.(() => {});
					}

					return;
				}

				const debug2 = Date.now();
				this.currentCall = e.call;
				this.currentCallIsNew = e.isNew;
				createdCall = e.call;

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
					this.sendStartCopilotRecordAnalytics({ isFailure: false, isAutostart: true });
				}

				this.#applyDefaultDevicesToCurrentCall();

				this.autoCloseCallView = true;
				this.bindCallEvents();
				this.#fetchAndSetGuestLink();
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
				if (this.initCallPromise !== thisPromise)
				{
					return;
				}

				console.error(error);

				let errorCode = Util.getCallConnectionErrorCode(error);
				const errorMessage = Util.getCallConnectionErrorMessage(error);

				// Business outcome, not a start failure: skip accidentLogger and onStartCallError.
				if (isBusinessLeaveReason(errorCode))
				{
					this.#finishCallOnBusinessLeave(errorCode);
					EventEmitter.emit('CallEvents::callStartFailed', { errorCode });
				}
				else
				{
					if (errorCode === 'CLIENT_UNCLASSIFIED' && error?.message)
					{
						errorCode = getUnknownErrorType(error?.message);
					}

					// addLog captures the call context synchronously, so nothing has to be awaited here:
					// the starting context is released by finally, on this outcome as on every other one.
					const accidentLogger = Reflection.getClass('BX.Call.Lib.accidentLogger');
					void accidentLogger?.addLog(error, errorCode);

					Analytics.getInstance().onStartCallError({
						callType: this.getCallType(provider),
						// The room of this attempt, not this.currentCall: a failure before the room
						// exists sends no identifier rather than the one of a call still running.
						callId: Util.getCallIdentifier(createdCall),
						errorCode,
						errorMessage,
						isVpnActive: this.#isVpnConnected(),
						isOffline: Util.isOfflineJoinFailure(errorCode, navigator.onLine),
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
				if (this.initCallPromise === thisPromise)
				{
					this.initCallPromise = null;
					this.#pendingCreateCallIsPlainJwt = false;
					// Every refusal of this chain lands here; the ownership check keeps a newer gesture intact.
					this.#pendingOpener = null;
				}
				this.preparedCall = null;

				this.#endStartingCallLogContext(startingCallLogContext);
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

		// The guard goes first: while another call is being initialized this click is ignored and the slot
		// stays untouched. Releasing it here would decline the ringing call without entering anywhere.
		if (this.initCallPromise)
		{
			return;
		}

		// Captured before the slot is released: tearing the previous call down moves the focus away from the
		// element that started this gesture. By the time the window is built the chat header may be redrawn.
		this.#pendingOpener = document.activeElement;

		const call = CallEngineLegacy.calls[callId] || CallEngine.calls[callUuid];
		const decision = decideSlotAction(this.#getSlotSnapshot(), {
			callKey: call ? Util.getCallIdentifier(call) : (callUuid || callId),
		});

		if (decision === SlotDecision.Unfold)
		{
			this.unfold({ isReturnGesture: true });
			this.#pendingOpener = null;

			return;
		}

		this.#releaseCallSlot(decision);

		this.onConnectToCallClick = Date.now();

		const isCallPrepared = this.preparedCall?.dialogId === options.chatInfo.id;
		const isGroupCall = options.chatInfo.id.toString().startsWith('chat');
		const defaultProvider = isGroupCall ? Util.getConferenceProvider() : Provider.Plain;
		const provider = call?.provider || defaultProvider;
		const isLegacyCall = Util.isLegacyCall(provider, call?.scheme);
		const joinAttempt = { provider, callId: isLegacyCall ? callId : callUuid };

		this.log(`Joining call ${callUuid}`);

		const startingCallLogContext = this.#beginStartingCallLogContext({
			roomId: Type.isStringFilled(callUuid) ? callUuid : undefined,
			callId: this.#toCallLogNumber(callId),
			chatId: this.#toCallLogNumber(options.chatInfo?.chatId),
		});

		this.initCallPromise = isLegacyCall ? Promise.resolve() : CallTokenManager.getToken(options.chatInfo.chatId);
		const thisPromise = this.initCallPromise;

		let joinConfig = null;
		const getCallForJoin = () => (isLegacyCall
			? CallEngineLegacy.getCallWithId(callId)
			: CallEngine.getCallWithId(callUuid, joinConfig));

		this.initCallPromise
			.then((callToken) => {
				joinConfig = {
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

				// Guests defer the join until the lobby has persisted the new name,
				// so the first /v2/join carries the fresh guest token.
				if (this.#isGuestUser())
				{
					return null;
				}

				return getCallForJoin();
			})
			.then((result) => {
				if (this.initCallPromise !== thisPromise)
				{
					return Promise.reject({ code: 'CALL_CANCELLED' });
				}

				// Guests arrive here with result === null: their join is deferred until after the lobby.
				this.#adoptCurrentCall(result, callUuid);

				this.#clearPromotedAdminTimeout();

				return this.messengerFacade.openMessenger(options.chatInfo.id);
			})
			.then(() => {
				return Hardware.init();
			})
			.then(async () => {
				let withVideo = Boolean(video);

				if (this.#isGuestUser())
				{
					const lobbyResult = await this.#runGuestLobbyAndPersistName(options.chatInfo?.name);
					if (lobbyResult === null)
					{
						// Call not created yet — nothing to decline. Release the lock so the guest can retry the join.
						this.#releaseEntryLock(thisPromise);

						return;
					}

					const guestJoinResult = await getCallForJoin();
					if (this.initCallPromise !== thisPromise)
					{
						return Promise.reject({ code: 'CALL_CANCELLED' });
					}

					this.#adoptCurrentCall(guestJoinResult, callUuid);

					withVideo = Boolean(lobbyResult.video);
					Hardware.isMicrophoneMuted = !lobbyResult.audio;
				}

				if (!this.currentCall)
				{
					this.log('The call was destroyed while being answered');

					return;
				}

				this.createContainer();

				const hiddenButtons = this.#getHiddenCallButtons(this.currentCall.provider === Provider.Plain);

				Hardware.isCameraOn = withVideo;

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
				this.copilotUiService?.showNotify({
					isCopilotActive: this.currentCall.isCopilotActive,
					provider: this.currentCall.provider,
					callId: Util.getCallIdentifier(this.currentCall),
				});
				this.#showCloudRecordPromo();
				this.checkVpnStatus();

				this.#applyDefaultDevicesToCurrentCall();

				this.bindCallEvents();
				this.#fetchAndSetGuestLink();
				this.createVideoStrategy();

				if (withVideo && !Hardware.hasCamera())
				{
					this.notificationService?.showNotification(BX.message('IM_CALL_ERROR_NO_CAMERA'));
					withVideo = false;
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

				this.#releaseEntryLock(thisPromise);
			})
			.catch((error) => {
				if (error?.code === 'CALL_CANCELLED')
				{
					return;
				}

				this.#releaseEntryLock(thisPromise);
				this.#handleJoinCallError(error, joinAttempt);
			})
			.finally(() => this.#endStartingCallLogContext(startingCallLogContext));
	}

	/**
	 * Snapshot of the call slot for the slot policy.
	 *
	 * The slot is taken by `currentCall` — including a ringing incoming call, which has no window yet.
	 * That is why "the slot is taken" and "the call is answered" are two different questions.
	 *
	 * @return {{hasCall: boolean, isAnswered: boolean, callKey: ?(string|number)}}
	 */
	#getSlotSnapshot()
	{
		return {
			hasCall: Boolean(this.currentCall),
			isAnswered: Boolean(this.viewPort),
			callKey: this.currentCall ? Util.getCallIdentifier(this.currentCall) : null,
		};
	}

	/**
	 * The single place where the slot is released. Called by every entry point before it enters
	 * the addressed call, and only after the `initCallPromise` guard: a call that is not going to be
	 * entered must never release the slot, otherwise the user loses both calls.
	 *
	 * The slot is emptied synchronously — `leaveCurrentCall()` alone does not clear it and waits for
	 * an async hangup confirmation, so an entry started meanwhile would grab the same busy slot.
	 *
	 * @param {string} decision — SlotDecision
	 */
	#releaseCallSlot(decision)
	{
		if (!this.currentCall)
		{
			return;
		}

		if (decision === SlotDecision.ReleaseRingingAndEnter)
		{
			const callId = Util.getCallIdentifier(this.currentCall);

			// Mark the call as handled, otherwise a repeated invitation pops the incoming notification up again.
			this.answeredOrDeclinedCalls.add(callId);
			this.ignoreDeclinedCallsTimeout[callId] = setTimeout(
				() => this.answeredOrDeclinedCalls.delete(callId),
				15000,
			);

			clearTimeout(this.hideIncomingCallTimeout);
			this.closeCallNotification();
			this.messengerFacade.stopRepeatSound(this.audioRingtone);

			Analytics.getInstance().onJoinCall({
				callId,
				callType: this.getCallType(),
				mediaParams: {
					video: Hardware.isCameraOn,
					audio: !Hardware.isMicrophoneMuted,
				},
				status: Analytics.AnalyticsStatus.decline,
				associatedEntity: this.currentCall.associatedEntity,
				isVpnActive: this.#isVpnConnected(),
			});

			// Listeners first: removeCallEvents() reads this.currentCall directly and would throw on an empty slot.
			this.#teardownCallConnection();
			// 603 (Decline), not 486 (Busy): at this moment the user is not in another call yet.
			this.currentCall.decline(603);
			this.currentCall = null;

			this.#clearPromotedAdminTimeout();

			return;
		}

		if (decision === SlotDecision.LeaveAnsweredAndEnter)
		{
			// leaveCurrentCall() releases media, stops the recording and closes the window on its own.
			this.leaveCurrentCall();

			if (this.currentCall)
			{
				// Only BitrixCall gets here with the call still in the slot: its hangup() raises no
				// onLeave, so the first point never ran and an open series would end up in the next call.
				this.#reconnectSeriesReporter.reportCallLost();

				this.#teardownCallConnection();
				this.currentCall = null;
			}
		}
	}

	/**
	 * Public entry for consumers that enter a call bypassing the controller (a conference is opened by the
	 * messenger itself). Releases the slot only when it is taken by a ringing incoming call — an answered
	 * call is never dropped silently.
	 */
	releaseRingingCallSlot()
	{
		if (!this.currentCall || this.viewPort)
		{
			return;
		}

		this.#releaseCallSlot(SlotDecision.ReleaseRingingAndEnter);
	}

	// A repeated dial can land into a zombie media room: the balancer keeps the
	// room of an already finished call when nobody had joined it before a fast
	// hangup (an empty room cannot be closed from the portal side). Detect this
	// by asking the portal for the call state and recover by closing the room
	// and re-creating the call. The retry result is returned as is, so at most
	// one recovery attempt happens per dial. The whole chain is bound to the
	// dial it started for: a cancelled or restarted dial stops the recovery.
	async #recoverFromZombieRoom(createResult, createCall)
	{
		const dialPromise = this.initCallPromise;
		const call = createResult?.call;
		if (
			!dialPromise
			|| !call
			|| createResult.isNew !== false
			|| call.provider !== Provider.Plain
			|| Util.isLegacyCall(call.provider, call.scheme)
		)
		{
			return createResult;
		}

		let callState = await this.#getCallStateForRecovery(call.uuid);
		if (!callState || this.initCallPromise !== dialPromise)
		{
			return createResult;
		}

		if (callState.exists && callState.state !== 'finished')
		{
			return createResult;
		}

		if (!callState.exists)
		{
			// A missing record does not prove a zombie: the room may belong to a
			// counter dial whose startCall webhook is still in flight (~2 sec).
			// Give the webhook its delivery window and re-check before killing
			// the room; a live call showing up means a legitimate join.
			await new Promise((resolve) => setTimeout(resolve, 2500));
			if (this.initCallPromise !== dialPromise)
			{
				return createResult;
			}

			callState = await this.#getCallStateForRecovery(call.uuid);
			if (!callState || this.initCallPromise !== dialPromise)
			{
				return createResult;
			}

			if (callState.exists && callState.state !== 'finished')
			{
				return createResult;
			}
		}

		this.log(`Zombie room detected (uuid: ${call.uuid}), closing the room and recreating the call`);
		try
		{
			await call.destroyZombieRoom();
		}
		catch (error)
		{
			this.log('Zombie room close failed, joining the existing room', error);

			return createResult;
		}

		call.destroy();

		// The balancer learns about the closed room asynchronously: an
		// immediate re-join may still return the dying room. Poll a few times
		// until a fresh room is created.
		const retryDelays = [0, 1500, 3000];
		let retried = null;
		let lastError = null;
		for (const delay of retryDelays)
		{
			if (delay > 0)
			{
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
			if (this.initCallPromise !== dialPromise)
			{
				return retried ?? createResult;
			}

			retried?.call?.destroy();
			try
			{
				retried = await createCall();
			}
			catch (error)
			{
				this.log('Zombie room recovery join attempt failed, retrying', error);
				lastError = error;
				retried = null;
				continue;
			}

			if (retried?.isNew !== false)
			{
				return retried;
			}
			this.log('Zombie room recovery got the same room again, retrying');
		}

		// The only room the balancer keeps offering is the one we just closed;
		// joining it would fail with an obscure media error, so fail the dial
		// honestly and let the user retry.
		retried?.call?.destroy();
		if (lastError)
		{
			throw lastError;
		}
		const recoveryError = new Error('Could not recreate the call after closing a zombie room');
		recoveryError.name = 'ZOMBIE_ROOM_RECOVERY_FAILED';
		throw recoveryError;
	}

	async #getCallStateForRecovery(callUuid)
	{
		try
		{
			const response = await BX.ajax.runAction('call.CallManager.getCallState', {
				data: { callUuid },
			});

			return response?.data ?? null;
		}
		catch (error)
		{
			this.log('Zombie room check failed, joining the existing room', error);

			return null;
		}
	}

	leaveCurrentCall(force, finishCall = false) {
		// Let a pending plain-JWT createCall complete: its response carries the room UUID the
		// stale branch needs to finish the abandoned room.
		if (this.currentCall || !this.#pendingCreateCallIsPlainJwt)
		{
			Util.abortGetCallConnectionData();
		}

		this.initCallPromise = null;
		this.#pendingCreateCallIsPlainJwt = false;

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
				storageType: Analytics.AnalyticsStorageType.local,
			});
		}
		else if (this.#canCloudRecord() && this.#isCommonRecordStarted())
		{
			// Cloud recording is shared and server-side: leaving a multi-user call does not stop it.
			// Send record_stop on disconnect only when this exit actually ends the recording:
			// finish-for-all, or a 1-on-1 (Plain) call where only the record initiator reports it.
			const isOneOnOneInitiator = this.currentCall.provider === Provider.Plain
				&& this.commonRecord.initiatorId === this.userId;
			if (finishCall || isOneOnOneInitiator)
			{
				const { callId, callType } = this.#getAnalyticsCallParams();
				this.recordingUiService?.trackCloudRecordStopOnDisconnect(
					callId,
					callType,
					this.commonRecord.info,
					finishCall,
				);
			}
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
		if (!this.currentCall)
		{
			return false;
		}

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
		if (!this.currentCall)
		{
			return false;
		}

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
				{
					// Pick up any plugged-in microphone, but never override an explicit manual choice.
					const microphoneManuallySelected = this.#callsWithManualMicrophone.has(this.currentCall);
					if (isForceUse || !microphoneManuallySelected)
					{
						const newDeviceId = Hardware.getDefaultDeviceIdByGroupId(deviceInfo.groupId, 'audioinput');
						this.currentCall.setMicrophoneId(newDeviceId);
						this.viewPort.setMicrophoneId(newDeviceId);
					}

					break;
				}
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

		BX.onCustomEvent(this, 'CallController::onUnfold', {});
	}

	/**
	 * The unfold event carries no trace of what caused it, so the gesture is declared by the caller
	 * that knows it: controls whose only meaning is "put me into the call window" pass the flag,
	 * unfolds triggered from inside the window do not.
	 */
	#unfoldIsReturnGesture(data): boolean
	{
		return data?.isReturnGesture === true;
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

		// The desktop gate says nothing about the record commands: a client without them refuses
		// the start, and the rollback has to survive that instead of failing on the same absence.
		if (this.#canLocalRecord() && Type.isFunction(window.BXDesktopSystem?.CallRecordStop))
		{
			window.BXDesktopSystem.CallRecordStop();
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
		const { button, mediaParams } = e.data;
		clearTimeout(this.hideIncomingCallTimeout);
		this.callNotification.close();

		if (button === 'answer')
		{
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
					this.onAnswerButtonClick(mediaParams, callParams);

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
						mediaParams,
						callParams,
					},
				});
			}
		}
		else if (button === 'decline')
		{
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
		}
		else if (button === 'answerConference')
		{
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
		}
		else if (button === 'skipConference')
		{
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
		}
	}

	onAnswerButtonClick(mediaParams, callParams)
	{
		// On desktop this method is invoked through a broadcast from the window that shows the incoming
		// notification, so the answered call may be a different one than the call in this window's slot.
		// Everything below must therefore address the call from callParams, not the slot content.
		if (this.initCallPromise)
		{
			return;
		}

		// The incoming popup is already closed here and its focus trap has put the focus back where it
		// stood before the call rang, so the candidate is that element and never the answer button. It
		// serves as a return target at the end of the call; the entry cannot lean on it.
		this.#pendingOpener = document.activeElement;

		const isLegacyCall = callParams.scheme === CallScheme.classic;
		const targetCall = isLegacyCall
			? CallEngineLegacy.calls[callParams.id]
			: CallEngine.calls[callParams.uuid];

		if (!targetCall)
		{
			this.log(`Can not answer an unknown call ${callParams.uuid || callParams.id}`);
			this.#pendingOpener = null;

			return;
		}

		const joinAttempt = { provider: targetCall.provider, callId: Util.getCallIdentifier(targetCall) };

		const decision = decideSlotAction(this.#getSlotSnapshot(), {
			callKey: joinAttempt.callId,
		});

		if (decision === SlotDecision.Unfold)
		{
			this.unfold({ isReturnGesture: true });
			this.#pendingOpener = null;

			return;
		}

		this.#releaseCallSlot(decision);

		if (this.currentCall !== targetCall)
		{
			// This window has never held the answered call in its slot, so it has no listeners bound to it.
			this.currentCall = targetCall;
			this.bindCallEvents();
		}

		const currentCallPromise = isLegacyCall
			? Promise.resolve()
			: CallTokenManager.getToken(this.currentCall.associatedEntity.chatId);

		// Take the shared entry lock only now: leaveCurrentCall() inside #releaseCallSlot() resets it.
		this.initCallPromise = currentCallPromise;

		let answerConfig = null;
		const getCallForAnswer = () => (isLegacyCall
			? CallEngineLegacy.getCallWithId(callParams.id)
			: CallEngine.getCallWithId(callParams.uuid, answerConfig));

		currentCallPromise
			.then((callToken) => {
				answerConfig = {
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

				// Q-F1: for incoming, /v2/join fires here (getCallWithId -> createCall).
				// Guests defer it until the lobby has persisted the new name, so the
				// first /v2/join carries the fresh guest token.
				if (this.#isGuestUser())
				{
					return null;
				}

				return getCallForAnswer();
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
					this.#releaseEntryLock(currentCallPromise);

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
						const isGuest = this.#isGuestUser();
						if (isGuest)
						{
							const lobbyResult = await this.#runGuestLobbyAndPersistName();
							if (lobbyResult === null)
							{
								this.currentCall?.decline();

								return;
							}

							mediaParams = lobbyResult;
						}

						if (!this.currentCall)
						{
							this.log('The call was destroyed while being answered');

							return;
						}

						if (isGuest)
						{
							// Deferred join: /v2/join now carries the fresh guest token (Q-F1).
							await getCallForAnswer();
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
						// Answering is an explicit gesture, so the entry must reach the window wherever the
						// focus stands: opening the chat moves it into the message input, and on desktop the
						// gesture happened in the notification window altogether.
						this.viewPort.focusWindow({ force: true });
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
					.catch((error) => {
						this.#handleJoinCallError(error, joinAttempt);
					})
					.finally(() => {
						this.#releaseEntryLock(currentCallPromise);
					});
			})
			.catch((error) => {
				this.#releaseEntryLock(currentCallPromise);
				this.#handleJoinCallError(error, joinAttempt);
			});
	}

	/**
	 * Releases the shared entry lock taken by an entry point, together with the focus opener that entry
	 * captured. Called in every outcome, including failures: a single failed answer must not block every
	 * entry forever, and an opener no window consumed must not reach the next one.
	 *
	 * @param {Promise} entryPromise — the chain that took the lock
	 */
	#releaseEntryLock(entryPromise)
	{
		if (this.initCallPromise === entryPromise)
		{
			this.initCallPromise = null;
			this.#pendingOpener = null;
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

		this.#applyCallViewAccessibleName();

		// the panel builds its buttons while it renders, so this is the first moment the record button
		// exists: a kind told to the view before it was created was skipped and has to be told again
		this.#syncRecordButtonPopupKind();
	}

	#applyCallViewAccessibleName()
	{
		// On a prepared start the first onShow fires before currentCall is assigned, and it is that
		// show the screen reader announces: the prepared payload names the window until the second
		// show overwrites it with the call itself.
		const windowName = resolveCallWindowName({
			entity: this.currentCall?.associatedEntity,
			preparedCall: this.preparedCall,
		});

		if (!windowName)
		{
			return;
		}

		this.viewPort?.setAccessibleName?.(windowName.name, windowName.type);
	}

	_onCallViewClose()
	{
		this.viewPort.destroy();
		this.callViewState = ViewState.Closed;

		this.floatingWindowService?.hide();
		this.floatingWindowService?.hideScreenShareWindow();

		if (DesktopApi.isDesktop())
		{
			DesktopApi.closeWindow(DesktopApi.findWindow('callBackground'));
		}

		this.notificationService?.closeMediaDevicesResetStateHint();
		this.notificationService?.closeReconnectingBalloon();
		this.notificationService?.closeRemoteVideoMutedBalloon();
		this.notificationService?.closeRiseYouHandToTalkPopup();
	}

	_onCallViewDestroy(destroyedViewPort)
	{
		if (destroyedViewPort && this.viewPort && destroyedViewPort !== this.viewPort)
		{
			return;
		}

		this.buttonStateService?.destroy();
		this.buttonStateService = null;
		this.layoutService?.destroy();
		this.layoutService = null;
		this.notificationService?.destroy();
		this.notificationService = null;
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
			this.unfold({ isReturnGesture: true });
		}
	}

	#onPiPViewBodyClick()
	{
		this.togglePictureInPictureCallWindow({ isForceClose: false });
		if (this.layoutService?.isFolded)
		{
			// No return gesture: PiP is the call window in another shape, not a control that only means
			// "put me into the call window", so the entry stays yielding.
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

	/**
	 * Second trigger of the mute hint: the hold policy reports a short press that led to nothing. The
	 * anchor is resolved exactly as the first trigger resolves it, and whether the hint is due at all
	 * is answered by the notification service.
	 */
	#onPushToTalkShortPress()
	{
		if (!this.isMutedPopupAllowed())
		{
			return;
		}

		this.notificationService?.showPushToTalkHint(
			this.layoutService?.isFolded ? null : this.viewPort?.buttons?.microphone?.elements?.icon,
		);
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
					// Unfolding here is a side effect of the fullscreen toggle, not a return gesture: the
					// unforced entry yields to a focus outside the window, and takes it from the pressed
					// button, which lives inside.
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

		// The selector reaches the whole portal, and a guest calls the people of their own chat only -
		// the server refuses such an invite anyway (@see \Bitrix\Call\Service\GuestCallPolicy).
		if (this.#isGuestUser())
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
		// Skip the device getters while Hardware is not initialized (they throw),
		// so the mute intent is still recorded via setIsMicrophoneMuted below.
		if (!e.muted && Hardware?.initialized && !Hardware.hasMicrophone())
		{
			return;
		}

		const currentRoom = this.currentCall?.currentRoom?.();
		if (currentRoom && currentRoom.speaker != this.userId && !e.muted)
		{
			this.currentCall.requestRoomSpeaker();

			return;
		}

		// same as the camera: a pick made while muted or unauthorised reaches the call on unmute
		if (this.currentCall && !e.muted && Hardware.defaultMicrophone)
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
		// the report goes out after the command, not before it: the handler applies the state
		// synchronously, but leaves silently when there is no microphone and when the user is
		// not the room speaker, and an unapplied command must not reach analytics
		this._onCallViewToggleMuteHandler(e);

		const applied = Hardware.isMicrophoneMuted === e.muted;

		// ahead of the analytics gate: the gate also lets a mute through, and a mute must not count as
		// having used the mode. Only a successful use stops the hint, hence the applied command
		if (applied && !e.muted && e.source === Analytics.AnalyticsElement.pushToTalk)
		{
			this.notificationService?.onPushToTalkUsed();
		}

		if (!shouldSendToggleMicrophone({ source: e.source, muted: e.muted, applied }))
		{
			return;
		}

		Analytics.getInstance().onToggleMicrophone({
			muted: e.muted,
			source: e.source,
			...this.#getAnalyticsCallParams(),
		});
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

		this.recordingUiService?.onRecordButtonClick(this.#getRecordButtonState());
	}

	/**
	 * What the record button opens and what it announces are decided from one set of flags: two sets
	 * would let the announcement and the click disagree.
	 *
	 * @group CommonRecord
	 */
	#getRecordButtonState()
	{
		return {
			isCloudRecordFeaturesEnabled: this.currentCall?.isCloudRecordFeaturesEnabled ?? false,
			callId: this.currentCall?.id,
			isServiceEnabled: CallCloudRecord.serviceEnabled,
			canRecord: this.#canCommonRecord(),
			isRecordLimitReached: this.#isRecordLimitReached(),
		};
	}

	/**
	 * The recording limit is applied by the view before the click ever reaches this controller
	 * (`onClickButtonWithLimit`): the button opens the limit article instead of the menu, so it must
	 * announce no layer either. Read from the portal features, the same source the view reads.
	 *
	 * @group CommonRecord
	 */
	#isRecordLimitReached(): boolean
	{
		return !Util.getCallFeatures()?.call_record?.enable;
	}

	/**
	 * Tells the record button which layer it opens. Called when a reason of the route changes, not on
	 * every update of the recording: the route does not depend on the state of the recording at all.
	 *
	 * @group CommonRecord
	 */
	#syncRecordButtonPopupKind()
	{
		this.recordingUiService?.syncRecordButtonPopupKind(this.#getRecordButtonState());
	}

	/**
	 * Whether the slot still holds the call named by the identifier. An empty identifier names no call
	 * at all and matches nothing: Util.getCallIdentifier answers null on an empty slot, and two empty
	 * slots would otherwise pass for the same call.
	 *
	 * @param {?string|?number} callIdentifier Util.getCallIdentifier taken before the request
	 */
	#isCallStillInSlot(callIdentifier)
	{
		if (callIdentifier === null || callIdentifier === undefined || callIdentifier === '')
		{
			return false;
		}

		return Util.getCallIdentifier(this.currentCall) === callIdentifier;
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

		// The answer is matched against the call it was asked for: over the round trip the slot may hold
		// another call, and that one must get neither the command nor the report.
		const toggledCall = Util.getCallIdentifier(this.currentCall);

		// The failure handler is passed to then(), not chained as catch(): an exception of the success
		// handler must never be reported as a refusal of the portal.
		if (Util.isLegacyCall(this.currentCall.provider, this.currentCall.scheme))
		{
			return BX.ajax
				.runAction(url, {
					data: { callId: this.currentCall.id, callUuid: this.currentCall.uuid },
				})
				.then(
					() => {
						// The call may have left the slot over the round trip: nothing to switch, nothing to report.
						if (!this.#isCallStillInSlot(toggledCall))
						{
							return;
						}

						const newCopilotState = !this.currentCall.isCopilotActive;
						this.#onUpdateCallCopilotState(newCopilotState);

						Analytics.getInstance().copilot.onAIRecordStatusChanged({
							isAIOn: newCopilotState,
							...this.#getAnalyticsCallParams(),
							isFailure: false,
						});

						if (newCopilotState)
						{
							this.sendStartCopilotRecordAnalytics({ isFailure: false, isAutostart: false });
						}
						else
						{
							this.copilotUiService?.showResultNotify();
						}
					},
					(error) => {
						// Unlike the JWT branch below, the direction is read off the call after the answer,
						// so a call that is no longer in the slot leaves it unknown.
						const newCopilotState = this.#isCallStillInSlot(toggledCall)
							? !this.currentCall.isCopilotActive
							: null;

						this.#reportCopilotToggleFailure(error, toggledCall, newCopilotState);
					},
				);
		}

		const newCopilotState = !this.currentCall.isCopilotActive;

		return BX.ajax
			.runAction(url, {
				data: { callId: this.currentCall.id, callUuid: this.currentCall.uuid },
			})
			.then(
				() => {
					// The call may have left the slot over the round trip: nothing to switch, nothing to report.
					if (!this.#isCallStillInSlot(toggledCall))
					{
						return;
					}

					this.#copilotOwnAttempt.mark(state, toggledCall);
					this.currentCall.setRecorderState(state);

					Analytics.getInstance().copilot.onAIRecordStatusChanged({
						isAIOn: newCopilotState,
						...this.#getAnalyticsCallParams(),
						isFailure: false,
					});

					if (newCopilotState)
					{
						this.sendStartCopilotRecordAnalytics({ isFailure: false, isAutostart: false });
					}
					else
					{
						this.copilotUiService?.showResultNotify();
					}
				},
				(error) => this.#reportCopilotToggleFailure(error, toggledCall, newCopilotState),
			);
	}

	/**
	 * A refusal of the portal produces no recorder status at all, so the notify has to come from here:
	 * nothing downstream shows it.
	 *
	 * Everything bound to the call — the notify and both analytics sends — happens only while the slot
	 * still holds the call that asked: over the round trip it may hold another one, and that call
	 * neither asked for the toggle nor owns the refusal.
	 *
	 * @param {*} error rejection of the toggle request
	 * @param {?string|?number} toggledCall Util.getCallIdentifier taken before the request
	 * @param {?boolean} newCopilotState the state the client asked for, or null when the direction can
	 *   no longer be told
	 */
	#reportCopilotToggleFailure(error, toggledCall, newCopilotState)
	{
		// the errors array is optional: a failure without one is still reported, as an unknown code
		const failureCode = error?.errors?.[0]?.code;
		const isSameCall = this.#isCallStillInSlot(toggledCall);

		// The record names no call of its own: the log reads the context off the slot. Raised while a
		// foreign call sits there, it would point the investigation at that call - worse than no record.
		// An empty slot is fine: the record simply carries no room.
		if (isSameCall || !this.currentCall)
		{
			this.#writeCopilotAccident(failureCode);
		}

		// The portal answers about the portal: an availability flag it takes down stays true wherever
		// the user is now. A refusal without a code names no flag, and the handler answers an unknown
		// code with a console error of its own.
		if (Type.isStringFilled(failureCode))
		{
			CallAI.handleCopilotError(failureCode);
		}

		if (!isSameCall)
		{
			return;
		}

		if (this.viewPort)
		{
			this.viewPort.showCopilotErrorNotify(failureCode);
		}

		if (newCopilotState === null)
		{
			return;
		}

		Analytics.getInstance().copilot.onAIRecordStatusChanged({
			isAIOn: newCopilotState,
			...this.#getAnalyticsCallParams(),
			isFailure: true,
			errorCode: failureCode,
		});

		if (newCopilotState)
		{
			this.sendStartCopilotRecordAnalytics({ isFailure: true, errorCode: failureCode, isAutostart: false });
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
		// Read before the early return on the tariff: on a portal with that flag down the mark
		// would otherwise never be taken off.
		const ownAttemptDirection = this.#copilotOwnAttempt.consume(Util.getCallIdentifier(this.currentCall));

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
				this.sendStartCopilotRecordAnalytics({ isFailure: false, isAutostart: true });
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

			// The notify above stays unconditional: every participant sees it. Reporting the failure is the
			// business of the client that asked for the toggle, and only of it.
			if (ownAttemptDirection !== null)
			{
				if (ownAttemptDirection === CopilotAttemptDirection.On)
				{
					this.sendStartCopilotRecordAnalytics({ isFailure: true, errorCode: error, isAutostart: false });
				}

				this.#writeCopilotAccident(error);
			}
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

		this.recordingUiService?.updateView(event.commonRecordState, {
			type: 'cloudRecord',
			userId: event.userId,
			currentUserId: this.userId,
			justJoined: event.justJoined,
			eventRecordState: event.commonRecordState,
		});
	}

	/**
	 * The message repeats the status of the analytics report verbatim, so a code read off the report is
	 * searched for in the log as it stands. Telling these entries apart from the connection records of
	 * the neighbouring log points is the job of the source: it is part of the grouping key.
	 *
	 * @param {*} failure refusal code of the portal, or the error of a recorder status
	 */
	#writeCopilotAccident(failure)
	{
		// The logger is taken from the namespace, not from the loader: a failure worth logging is often
		// a failure of the network, and a round trip in front of the record loses it exactly then.
		const accidentLogger = Reflection.getClass('BX.Call.Lib.accidentLogger');
		void accidentLogger?.addLog(null, toAnalyticsErrorStatus(failure), 'copilot_record');
	}

	/**
	 * @param {Object} params
	 * @param {boolean} params.isFailure Set by the call site: a failure may come without a code, and a
	 *   code on its own is not a sign of one.
	 * @param {?string} [params.errorCode]
	 * @param {boolean} params.isAutostart
	 */
	sendStartCopilotRecordAnalytics({ isFailure, errorCode = null, isAutostart })
	{
		const params = {
			...this.#getAnalyticsCallParams(),
			isFailure,
			errorCode,
			chatUserCount: this.currentCall?.associatedEntity?.userCounter,
			isAutostart,
		};

		// Called from the answer to a toggle request, where the call may already be out of the slot.
		const userCount = this.currentCall ? this.getActiveCallUsers().length : 0;
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

		// a pick made without the right to broadcast waits in Hardware until the camera goes on;
		// the engine ignores an id it already holds, so an unchanged device costs nothing here
		if (e.video && Hardware.defaultCamera)
		{
			this.currentCall.setCameraId(Hardware.defaultCamera);
		}
	}

	_onCallViewToggleVideoButtonClick(e)
	{
		e.video = Boolean(e.video);

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

		// the pick is remembered regardless of the right to broadcast, applying it to the call is not
		Hardware.defaultCamera = e.deviceId;

		if (this.currentCall && Util.havePermissionToBroadcast('cam'))
		{
			this.currentCall.setCameraId(e.deviceId);
		}
	}

	_onCallViewReplaceMicrophone(e)
	{
		// the pick is remembered regardless of the right to broadcast, applying it to the call is not
		Hardware.defaultMicrophone = e.deviceId;

		if (this.currentCall)
		{
			this.#callsWithManualMicrophone.add(this.currentCall);
			// the view only mirrors the pick for the selector, the device is re-captured by the engine
			this.viewPort.setMicrophoneId(e.deviceId);

			if (Util.havePermissionToBroadcast('mic'))
			{
				this.currentCall.setMicrophoneId(e.deviceId);
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
	}

	_onCallUserInvited(e)
	{
		this.layoutService?.handleUserJoinEvent('onUserInvited', e, this.currentCall);
	}

	_onCallUserJoined(e)
	{
		const resolvedUserData = this.layoutService?.handleUserJoinEvent('onUserJoined', e, this.currentCall) ?? e.userData;

		setTimeout(this.updateFloatingWindowContent.bind(this), 100);

		if (this.viewPort)
		{
			this.viewPort.updateUserData(resolvedUserData);
			this.viewPort.addUser(e.userId, UserState.Connected);
		}
	}

	#isGuestUser()
	{
		return this.messengerFacade.getCurrentUser?.()?.externalAuthId === 'im_guest';
	}

	#adoptCurrentCall(result, callUuid)
	{
		if (result && (!this.currentCall || this.currentCall.uuid !== callUuid))
		{
			Util.setUserData(result.call.userData);
			this.currentCall = result.call;
		}
	}

	#createLobbyContainer()
	{
		this.lobbyContainer = Tag.render`<div class="call-lobby-overlay"></div>`;
		Dom.append(this.lobbyContainer, this.getExternalContainer());
	}

	#destroyLobbyContainer()
	{
		if (this.lobbyContainer)
		{
			Dom.remove(this.lobbyContainer);
			this.lobbyContainer = null;
		}
	}

	async #runGuestLobbyAndPersistName(callerName)
	{
		const lobbyResult = await this.#showCallLobby(callerName);
		if (lobbyResult === null)
		{
			return null;
		}

		const currentUser = this.messengerFacade.getCurrentUser?.();
		if (lobbyResult.userName && lobbyResult.userName !== currentUser?.name)
		{
			try
			{
				// Contract API-01: paired with im GuestService#applyUserToken (guest-name-popup) — keep both in sync.
				const response = await BX.ajax.runAction('im.v2.Guest.setName', {
					data: { name: lobbyResult.userName },
				});
				const userToken = response.data?.userToken;
				if (userToken)
				{
					CallTokenManager.setUserToken(userToken);
				}
			}
			catch (error)
			{
				// Soft-fail: keep the previous name/token, do not block joining the call.
				this.log('Guest setName failed, keeping previous name', error);
			}
		}

		return lobbyResult;
	}

	async #showCallLobby(callerName = this.currentCall?.associatedEntity?.name || '')
	{
		this.#createLobbyContainer();

		const currentUser = this.messengerFacade.getCurrentUser?.();
		const userName = currentUser?.name || '';
		const userAvatar = currentUser?.avatar || '';

		this.lobbyManager = new LobbyManager();

		try
		{
			const result = await this.lobbyManager.show({
				container: this.lobbyContainer,
				userName,
				userAvatar,
				callerName,
			});

			this.#destroyLobbyContainer();
			this.lobbyManager?.destroy();
			this.lobbyManager = null;

			// decline resolves with accepted=false; only a real join returns the lobby params
			return result.accepted ? result : null;
		}
		catch
		{
			this.#destroyLobbyContainer();
			this.lobbyManager?.destroy();
			this.lobbyManager = null;

			return null;
		}
	}

	_onCallUserMicrophoneState(e)
	{
		if (e.userId === this.userId)
		{
			Hardware.isMicrophoneMuted = !e.microphoneState;
		}
		else
		{
			this.layoutService?.handleUserEvent('onUserMicrophoneState', e);
		}
	}

	_onCallUserCameraState(e)
	{
		this.layoutService?.handleUserEvent('onUserCameraState', e);
	}

	_onCallUserVideoPaused(e)
	{
		this.layoutService?.handleUserEvent('onUserVideoPaused', e);
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
	}

	_onCallUserVoiceStarted(e)
	{
		// before the local branch: it returns early, and the silence limit must see every signal
		this.viewPort?.notifySpeechSignal({ userId: e.userId, local: e.local }, true);

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

		if (e.userId === this.viewPort?.localUser?.id)
		{
			this.viewPort?.setUserFloorRequestState(e.userId, false);
		}
	}

	_onCallUserVoiceStopped(e)
	{
		this.viewPort?.notifySpeechSignal({ userId: e.userId, local: e.local }, false);

		if (this.talkingUsers[e.userId])
		{
			delete this.talkingUsers[e.userId];
		}

		this.layoutService?.handleUserEvent('onUserVoiceStopped', e);
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
		if (!this.#isEventFromSlotCall(e?.call))
		{
			return;
		}

		this.viewPort?.notifyConnectionLost();

		const errorCode = e.code || e.name || e.error;

		EventEmitter.emit('CallEvents::callStartFailed', {
			callUuid: this.currentCall?.uuid,
			errorCode,
		});

		if (errorCode === DisconnectReason.SignalingReconnectCooldown)
		{
			this.messengerFacade.stopRepeatSound('dialtone');
			this.leaveCurrentCall();
			Hardware.isMicrophoneMuted = false;

			return;
		}

		if (isBusinessLeaveReason(errorCode))
		{
			this.#finishCallOnBusinessLeave(errorCode);

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
			// This branch destroys the call itself, so neither onLeave nor onDestroy reaches the
			// controller: a series that broke together with the call would lose its outcome here.
			this.#reconnectSeriesReporter.reportCallLost();

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

	#finishCallOnBusinessLeave(errorCode)
	{
		// Server business outcome, not a connection failure: finish the call the regular way.
		this.log('Business leave', errorCode);
		this.messengerFacade.stopRepeatSound('dialtone');

		if (this.currentCall)
		{
			// Keep listeners: destroy() must reach the regular teardown.
			// BitrixCall emits onLeave, so _onCallLeave closes the view unconditionally.
			// BitrixCallLegacy.destroy() emits onDestroy only, so the view is closed by
			// _onCallDestroy — and solely because autoCloseCallView is still true.
			// Never reset that flag here: on the classic scheme it is the only way out.
			this.currentCall.destroy();
			this.currentCall = null;
			this.currentCallIsNew = false;
		}
		else
		{
			// The call rejected inside createCall(), so currentCall was never assigned,
			// while the view port already exists. leaveCurrentCall() closes it and frees media.
			this.leaveCurrentCall();
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

	/**
	 * Every call event carries its own call (see AbstractCall.runCallback). A call that has already left
	 * the slot must not tear down the call that took it — so the destructive handlers check the source.
	 *
	 * @param {?object} call — call from the event payload
	 * @return {boolean}
	 */
	#isEventFromSlotCall(call)
	{
		if (!call || !this.currentCall)
		{
			return true;
		}

		return Util.getCallIdentifier(call) === Util.getCallIdentifier(this.currentCall);
	}

	_onCallDestroy(e)
	{
		if (!this.#isEventFromSlotCall(e?.call))
		{
			return;
		}

		// A classic-scheme call reaches the controller by this event alone, without onLeave.
		this.#reconnectSeriesReporter.reportCallLost();

		this.#copilotOwnAttempt.reset();

		// Best-effort record_stop for cloud recording when the call is destroyed externally.
		// Must run before currentCall is cleared, as helpers depend on it.
		if (
			this.#canCloudRecord()
			&& this.#isCommonRecordStarted()
			&& this.commonRecord.initiatorId === this.userId
		)
		{
			const { callId, callType } = this.#getAnalyticsCallParams();
			this.recordingUiService?.trackCloudRecordStopOnDisconnect(
				callId,
				callType,
				this.commonRecord.info,
				false,
			);
		}

		if (this.lobbyManager && this.lobbyManager.isShown())
		{
			this.lobbyManager.destroy();
			this.#destroyLobbyContainer();
			this.lobbyManager = null;
		}

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
		this.cameraBlockedForLegacyMobile = false;

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
				this.cameraBlockedForLegacyMobile = true;
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

			if (!e.isLegacyMobile && isNeedUnblockCameraButton)
			{
				this.cameraBlockedForLegacyMobile = false;
			}

			if (this.currentCall.provider === Provider.Plain && !this.#isGuestUser())
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

	// Publishing holds the button for as long as the track is being sent. It is a state of the
	// transport, not a change of what the user is allowed to do, so the picture-in-picture window
	// is told to stay quiet about it: otherwise every own switch of a device is spoken twice.
	_onCameraPublishing(e)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (e.publishing)
		{
			this.viewPort.blockSwitchCamera({ announce: false });
		}
		// The view keeps one blocked flag per button, so releasing our hold must not lift a block another
		// reason still holds: the right to broadcast video and a legacy mobile participant share this button.
		else if (Util.havePermissionToBroadcast('cam') && !this.cameraBlockedForLegacyMobile)
		{
			this.viewPort.unblockSwitchCamera({ announce: false });
		}

		this.viewPort.updateButtons();
	}

	_onMicrophonePublishingd(e)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (e.publishing)
		{
			this.viewPort.blockSwitchMicrophone({ announce: false });
		}
		else
		{
			this.viewPort.unblockSwitchMicrophone({ announce: false });
		}

		this.viewPort.updateButtons();
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
			// all three ways the right can be revoked - permissions, role, room settings - end up
			// here, and none of them touches the state of the microphone
			this.viewPort?.notifyBroadcastRightLost();
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

		this.notificationService?.showPermissionsChangedNotification(e.data);

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
		this.viewPort?.notifyConnectionLost();
		this.notificationService?.showReconnectingBalloon();

		// The report goes last: the interface tells the user about every attempt, the report wants one
		// event per series, and a failure of the report must not cost the user the notice.
		this.#reconnectSeriesReporter.reportSeriesStarted(e);
	}

	_onReconnected(e)
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

		// The report goes last: a failure of the telemetry must not cost the user the picture back.
		this.#reconnectSeriesReporter.reportSeriesRecovered(e);
	}

	_onReconnectingFailed(e)
	{
		this.#reconnectSeriesReporter.reportSeriesFailed(e?.error);
	}

	#onReconnectSeriesOutcome(e)
	{
		this.#reconnectSeriesReporter.reportSeriesOutcome(e);
	}

	_onParticipantReconnecting(e)
	{
		const userId = e?.participant?.userId;
		if (userId)
		{
			this._onCallUserVoiceStopped({ userId });
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
		if (!this.#isEventFromSlotCall(e?.call))
		{
			return;
		}

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
		if (!this.#isEventFromSlotCall(e?.call))
		{
			return;
		}

		this.#copilotOwnAttempt.reset();

		if (this.lobbyManager && this.lobbyManager.isShown())
		{
			this.lobbyManager.destroy();
			this.#destroyLobbyContainer();
			this.lobbyManager = null;
		}

		console.log('_onCallLeave', e);
		if (!e.local && this.currentCall && this.currentCall.ready)
		{
			this.log(new Error('received remote leave with active call!'));

			return;
		}

		// Below the guards on purpose: a remote leave means the user hung up somewhere else, and the
		// call in this tab goes on. Above #teardownCallConnection(), while the call is still here.
		this.#reconnectSeriesReporter.reportCallLost();

		Hardware.isMicrophoneMuted = false;

		// Best-effort record_stop for cloud recording when this leave actually ends the call:
		// on last-user-left the engine auto-hangups and emits onLeave (onDestroy sees no record state).
		// viewPort limits reporting to the tab hosting the call UI (mirrors the call_finish guard below).
		if (
			this.currentCall
			&& !this.#isLocalRecordStarted()
			&& this.#canCloudRecord()
			&& this.#isCommonRecordStarted()
			&& Boolean(this.viewPort)
			&& this.getActiveCallUsers().length === 0
			&& (
				this.currentCall.provider !== Provider.Plain
				|| this.commonRecord.initiatorId === this.userId
			)
		)
		{
			const { callId, callType } = this.#getAnalyticsCallParams();
			this.recordingUiService?.trackCloudRecordStopOnDisconnect(
				callId,
				callType,
				this.commonRecord.info,
				false,
			);
		}

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

	#fetchAndSetGuestLink()
	{
		const isGroupCall = this.currentCall.provider !== Provider.Plain;

		if (!isGroupCall)
		{
			this.viewPort.setGuestLink(null);

			return;
		}

		const numericChatId = this.currentCall.associatedEntity?.chatId;

		if (!numericChatId)
		{
			this.viewPort.setGuestLink(null);

			return;
		}

		BX.ajax.runAction('call.Call.getGuestLink', { data: { chatId: numericChatId } })
			.then((response) =>
			{
				const guestLink = response.data?.guestLink ?? null;

				if (this.viewPort)
				{
					this.viewPort.setGuestLink(guestLink);
				}
			})
			.catch(() =>
			{
				if (this.viewPort)
				{
					this.viewPort.setGuestLink(null);
				}
			})
		;
	}

	/**
	 * @param {Error|Object|string} error
	 * @param {{provider: ?string, callId: ?(string|number)}} attempt - what the entry was aiming at.
	 *   The call instance does not exist yet when an entry fails, so the type and the identifier of
	 *   the event come from the attempt and not from `currentCall`.
	 */
	#handleJoinCallError(error, attempt = {})
	{
		let errorCode = Util.getCallConnectionErrorCode(error);
		const errorMessage = Util.getCallConnectionErrorMessage(error);

		if (errorCode === 'CLIENT_UNCLASSIFIED' && error?.message)
		{
			errorCode = getUnknownErrorType(error?.message);
		}

		const accidentLogger = Reflection.getClass('BX.Call.Lib.accidentLogger');
		void accidentLogger?.addLog(error, errorCode);

		Analytics.getInstance().onJoinCallError({
			callType: this.getCallType(attempt.provider),
			errorCode,
			callId: attempt.callId,
			errorMessage,
			isVpnActive: this.#isVpnConnected(),
			isRoomClosed: error?.isRoomClosed === true,
			isOffline: Util.isOfflineJoinFailure(errorCode, navigator.onLine),
		});
	}

	#toCallLogNumber(value): ?number
	{
		const numericValue = Number(value);

		return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
	}

	#beginStartingCallLogContext(context: CallLogContext): CallLogContext
	{
		this.#startingCallLogContext = context;

		return context;
	}

	#endStartingCallLogContext(context: CallLogContext)
	{
		if (this.#startingCallLogContext === context)
		{
			this.#startingCallLogContext = null;
		}
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
		CallLogContextRegistry.unregisterProvider(this.#provideCallLogContext);

		this.floatingWindowService?.destroy();
		this.floatingWindowService = null;

		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		this.callMultiBroadcastClient && this.callMultiBroadcastClient.destroy();
		this.#callTabNotifier.stop();

		Hardware.unsubscribe(Hardware.Events.onChangeMirroringVideo, this._onCallLocalCameraFlipHandler);
		Hardware.unsubscribe(Hardware.Events.onChangeMicrophonePermission, this.#onChangeMicrophonePermissionHandler);

		EventEmitter.unsubscribe(CALL_ALREADY_FINISHED_EVENT, this.#onCallAlreadyFinished);
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
				users: {
					userId: event.userId,
					otherUsers: this.currentCall.users,
				},
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

	static FeatureState = FeatureState;
	static Events = Events;
	static ViewState = ViewState;
	static DocumentType = DocumentType;
}
