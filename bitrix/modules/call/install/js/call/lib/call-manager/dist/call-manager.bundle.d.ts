/* eslint-disable */
type CallLegacy = unknown;

declare namespace BX.Call.Lib {
	class CallManager {
		static instance: CallManager;
		static viewContainerClass: string;
		static getInstance(): CallManager;
		constructor();
		sendBroadcastRequest(callId: string): Promise<boolean[]>;
		setNextCallOptions(options: Object): void;
		startCall(dialogId: string, withVideo?: boolean): void;
		joinCall(callId: string, callUuid: string, dialogId: string, withVideo?: boolean): void;
		leaveCurrentCall(): void;
		onAnswerButtonClick(mediaParams: BX.JsonObject, callParams: BX.JsonObject): void;
		onJoinFromRecentItem(): void;
		deleteRecentCall(dialogId: string): void;
		foldCurrentCall(): void;
		unfoldCurrentCall(): void;
		getCurrentCallDialogId(): string;
		getCurrentCall(): false | BX.Call.Lib.BitrixCallLegacy | import("../../../core/src/engine/plain_call").PlainCall | BX.Call.Lib.VoximplantCall | null;
		getCurrentUser(): BX.Messenger.v2.Model.ImModelUser;
		hasCurrentCall(): boolean;
		hasCurrentScreenSharing(): boolean;
		hasVisibleCall(): boolean;
		toggleDebugFlag(debug: any): void;
		chatCanBeCalled(dialogId: string): boolean;
		hasActiveCurrentCall(dialogId: string): boolean;
		hasActiveAnotherCall(dialogId: string): boolean;
		hasActiveCallInDialog(dialogId: string): boolean;
		getCallUserLimit(): any;
		isChatUserLimitExceeded(dialogId: string): boolean;
		updateRecentCallsList(activeCalls: any): void;
		isConference(dialogId: string): boolean;
	}

	class BitrixCallLegacy extends AbstractCall {
		static Event: {
			onCallConference: string;
		};
		peers: {
			[key: number]: Peer;
		};
		localVAD: SimpleVAD | null;
		invitePeriod: any;
		videoQuality: string;
		CallApi: CallLegacy | null;
		signaling: Signaling;
		peersWithBadConnection: Set<any>;
		joinedElsewhere: boolean;
		joinedAsViewer: boolean;
		localVideoShown: boolean;
		_localUserState: string;
		clientEventsBound: boolean;
		_screenShared: boolean;
		videoAllowedFrom: string;
		direction: string;
		floorRequestActive: boolean;
		vads: {};
		getUserMediaFulfilled: {
			video: boolean;
			audio: boolean;
		};
		microphoneLevelInterval: number | null;
		pingUsersInterval: number;
		pingBackendInterval: number;
		lastPingReceivedTimeout: number | null;
		lastSelfPingReceivedTimeout: number | null;
		reinviteTimeout: number | null;
		_reconnectionEventCount: number;
		pullEventHandlers: {
			'Call::answer': (params: any) => void;
			'Call::hangup': (params: any) => void;
			'Call::usersJoined': (params: any) => void;
			'Call::usersInvited': (params: any) => void;
			'Call::userInviteTimeout': (params: any) => void;
			'Call::ping': (params: any) => void;
			'Call::finish': () => void;
			'Call::repeatAnswer': () => void;
			'Call::switchTrackRecordStatus': (e: any) => void;
		};
		_isCopilotActive: any;
		_isCopilotFeaturesEnabled: boolean;
		_isRecordWhenCopilotActivePopupAlreadyShow: boolean;
		_isBoostExpired: boolean;
		get provider(): string;
		set screenShared(screenShared: boolean);
		get screenShared(): boolean;
		set isCopilotActive(isCopilotActive: any);
		get isCopilotActive(): any;
		set isBoostExpired(isBoostExpired: boolean);
		get isBoostExpired(): boolean;
		set isCopilotFeaturesEnabled(isCopilotFeaturesEnabled: boolean);
		get isCopilotFeaturesEnabled(): boolean;
		set isRecordWhenCopilotActivePopupAlreadyShow(isRecordWhenCopilotActivePopupAlreadyShow: boolean);
		get isRecordWhenCopilotActivePopupAlreadyShow(): boolean;
		set localUserState(state: string);
		get localUserState(): string;
		set reconnectionEventCount(newValue: number);
		get reconnectionEventCount(): number;
		initPeers(): void;
		reinitPeers(): void;
		pingUsers(): void;
		pingBackend(): void;
		createPeer(userId: any): Peer;
		getUsers(): {};
		getUserCount(): number;
		canChangeMediaDevices(): boolean;
		setMuted: (event: any) => void;
		setVideoEnabled: (event: any) => void;
		setCameraId(cameraId: any): void;
		setMicrophoneId(microphoneId: any): void;
		setMainStream(users: any): void;
		requestFloor(requestActive: any): void;
		turnOffAllParticipansStream(options: any): void;
		turnOffParticipantStream(options: any): void;
		allowSpeakPermission(options: any): void;
		changeSettings(options: any): void;
		sendLocalRecordState(commonRecordState: any, force?: boolean): void;
		sendCustomMessage(message: any, repeatOnConnect: any): void;
		/**
		 * Updates list of users,
		 */
		allowVideoFrom(userList: $Keys<typeof UserMnemonic> | number[]): void;
		startScreenSharing(): void;
		waitingLocalScreenShare: boolean | undefined;
		stopScreenSharing(): void;
		isScreenSharingStarted(): boolean | undefined;
		isGetUserMediaFulfilled(kind: string): Boolean;
		/**
		 * Invites users to participate in the call.
		 */
		inviteUsers(config?: {
			users: number[];
			show?: boolean;
		}): void;
		scheduleRepeatInvite(): void;
		repeatInviteUsers(): void;
		/**
		 * @param {Object} config
		 * @param {bool?} [config.useVideo]
		 * @param {bool?} [config.joinAsViewer]
		 */
		answer(config?: {
			useVideo?: bool | null;
			joinAsViewer?: bool | null;
		}): void;
		_outgoingAnswer: any;
		decline(code: any): void;
		hangup(code: any, reason: any, finishCall?: boolean): void;
		attachToConference(options?: {
			joinAsViewer: boolean | null;
		}): Promise<any>;
		bindCallEvents(): void;
		removeCallEvents(): void;
		subscribeHardwareChanges(): void;
		unsubscribeHardwareChanges(): void;
		/**
		 * Adds new users to call
		 * @param {Number[]} users
		 */
		addJoinedUsers(users: number[]): void;
		/**
		 * Adds users, invited by you or someone else
		 * @param {Number[]} users
		 */
		addInvitedUsers(users: number[], show: any): void;
		toggleRemoteParticipantVideo(participants: any, showVideo: any, isPaginateToggle?: boolean): void;
		isAnyoneParticipating(): boolean;
		getParticipatingUsers(): string[];
		__onPullEvent(command: any, params: any, extra: any): void;
		__onPullEventAnswerSelf(params: any): void;
		sendTelemetryEvent(eventName: any): void;
		testReconnect(): void;
	}

	/**
	 * Abstract call class
	 * Public methods:
	 * - inviteUsers
	 * - cancel
	 * - answer
	 * - decline
	 * - hangup
	 *
	 * Events:
	 * - onJoin
	 * - onLeave
	 * - onUserStateChanged
	 * - onStreamReceived
	 * - onStreamRemoved
	 * - onCallFailure
	 * - onDestroy
	 */
	class AbstractCall {
		constructor(params: any);
		logger: Logger | null;
		localStreams: {
			[key: string]: MediaStream | null;
		};
		id: any;
		uuid: any;
		instanceId: any;
		parentId: any;
		parentUuid: any;
		direction: any;
		scheme: any;
		type: any;
		roomType: any;
		state: any;
		isReconnecting: boolean;
		reconnectHistory: BX.Call.Lib.ReconnectHistory;
		ready: boolean;
		userId: any;
		userData: any;
		initiatorId: any;
		users: any;
		associatedEntity: any;
		startDate: Date;
		videoEnabled: boolean;
		cameraId: any;
		microphoneId: any;
		muted: boolean;
		wasConnected: boolean;
		logToken: any;
		eventListeners: {};
		connectionData: any;
		_microphoneLevel: number;
		commonRecordState: {
			state: string;
			type: string;
			userId: number;
			date: {
				start: null;
				pause: never[];
			};
		};
		get provider(): void;
		set microphoneLevel(level: number);
		get microphoneLevel(): number;
		addDialogInfo(dialogInfo: any): void;
		addLogToken(logToken: string): void;
		initEventListeners(eventListeners: any): void;
		addEventListener(eventName: any, listener: any): void;
		removeEventListener(eventName: any, listener: any): void;
		runCallback(eventName: any, eventFields: any): void;
		getLocalStream(tag: any): MediaStream | null;
		setLocalStream(mediaStream: any, tag: any): void;
		get reconnectionInfo(): readonly import("call.lib.reconnect-history").ReconnectHistoryEntry[];
		isAnyoneParticipating(): void;
		__onPullEvent(command: any, params: any): void;
		inviteUsers(): void;
		cancel(): void;
		answer(): void;
		decline(code: any, reason: any): void;
		hangup(): void;
		log(...args: any[]): void;
		destroy(): void;
		updateCommonRecordState({ action, type, senderId, date }: {
			action: any;
			type: any;
			senderId: any;
			date: any;
		}): boolean;
	}

	class Logger {
		constructor(serviceUrl: any, token: any);
		serviceUrl: any;
		token: any;
		socket: WebSocket | null;
		attempt: number;
		reconnectTimeout: number | null;
		unsentMessages: any[];
		onSocketOpenHandler: () => void;
		onSocketCloseHandler: () => void;
		onSocketErrorHandler: () => void;
		get isConnected(): boolean | null;
		log(message: any): void;
		sendStat(statRecord: any): void;
		connect(): void;
		scheduleReconnect(): void;
		getConnectionDelay(attempt: any): 15 | 60 | 30;
		disconnect(): void;
		bindSocketEvents(): void;
		removeSocketEvents(): void;
		onSocketOpen(): void;
		onSocketClose(): void;
		onSocketError(): void;
		destroy(): void;
	}

	class Peer {
		constructor(params: any);
		calculatedState: string;
		userId: any;
		call: any;
		ready: boolean;
		calling: boolean;
		backgroundCalling: boolean;
		declined: boolean;
		busy: boolean;
		inviteTimeout: boolean;
		direction: any;
		stream: any;
		mediaRenderers: any[];
		isIncomingVideoAllowed: boolean;
		callingTimeout: number;
		callbacks: {
			onStateChanged: any;
			onInviteTimeout: any;
			onMediaReceived: any;
			onMediaRemoved: any;
		};
		setReady(ready: any): void;
		setDirection(direction: any): void;
		setDeclined(declined: any): void;
		setBusy(busy: any): void;
		allowIncomingVideo(isIncomingVideoAllowed: any): void;
		addMediaRenderer(mediaRenderer: any): void;
		removeMediaRenderer(mediaRenderer: any): void;
		calculateState(): string;
		updateCalculatedState(): void;
		isParticipating(): any;
		onInvited(showUser?: boolean): void;
		onInviteTimeout(internal: any): void;
		log(...args: any[]): void;
		destroy(): void;
	}

	/**
	 * Naive voice activity detection
	 * @param {object} config
	 * @param {MediaStream} config.mediaStream
	 * @param {function} config.onVoiceStarted
	 * @param {function} config.onVoiceStopped
	 * @constructor
	 */
	class SimpleVAD {
		static isSupported(): boolean;
		constructor(config: any);
		mediaStream: MediaStream;
		audioContext: AudioContext | null;
		mediaStreamNode: MediaStreamAudioSourceNode | null;
		analyserNode: AnalyserNode | null;
		audioTimeDomainData: Float32Array<ArrayBuffer> | null;
		voiceState: boolean;
		measureInterval: number;
		inactivityTimeout: number;
		currentVolume: number;
		callbacks: {
			voiceStarted: any;
			voiceStopped: any;
		};
		init(): void;
		analyzeAudioStream(): void;
		setVoiceState(voiceState: any): void;
		onInactivityTimeout(): void;
		updateCurrentVolume(audioTimeDomainData: any): void;
		pause(): void;
		resume(): void;
		destroy(): void;
	}

	class Signaling {
		constructor(params: any);
		call: any;
		inviteUsers(data: any): any;
		sendAnswer(data: any, repeated: any): any;
		sendHangup(data: any): void;
		sendFinish(data: any): void;
		sendCameraState(cameraState: any): void;
		sendVideoPaused(videoPaused: any): void;
		sendMicrophoneState(microphoneState: any): void;
		sendScreenState(screenState: any): void;
		sendLocalRecordState(userId: any, commonRecordState: any): void;
		sendCustomMessage(message: any, repeatOnConnect: any): void;
		sendShowUsers(users: any): void;
		sendShowAll(): void;
		sendHideAll(): void;
		sendPingToUsers(data: any): void;
		sendPingToBackend(): void;
		sendUserInviteTimeout(data: any): void;
	}

	class VoximplantCall extends AbstractCall {
		static Event: {
			onCallConference: string;
		};
		peers: {
			[key: number]: Peer;
		};
		localVAD: SimpleVAD | null;
		debug: any;
		videoQuality: string;
		voximplantCall: any;
		signaling: Signaling;
		joinedElsewhere: boolean;
		joinedAsViewer: boolean;
		localVideoShown: boolean;
		_localUserState: string;
		clientEventsBound: boolean;
		_screenShared: boolean;
		videoAllowedFrom: string;
		direction: string;
		microphoneLevelInterval: number | null;
		rooms: {};
		pingUsersInterval: number;
		pingBackendInterval: number;
		lastPingReceivedTimeout: number | null;
		lastSelfPingReceivedTimeout: number | null;
		reinviteTimeout: number | null;
		_reconnectionEventCount: number;
		pullEventHandlers: {
			'Call::answer': (params: any) => void;
			'Call::hangup': (params: any) => void;
			'Call::usersJoined': (params: any) => void;
			'Call::usersInvited': (params: any) => void;
			'Call::userInviteTimeout': (params: any) => void;
			'Call::ping': (params: any) => void;
			'Call::finish': () => void;
			'Call::repeatAnswer': () => void;
		};
		get provider(): any;
		set screenShared(screenShared: boolean);
		get screenShared(): boolean;
		set localUserState(state: string);
		get localUserState(): string;
		set reconnectionEventCount(newValue: number);
		get reconnectionEventCount(): number;
		initPeers(): void;
		reinitPeers(): void;
		pingUsers(): void;
		pingBackend(): void;
		createPeer(userId: any): Peer;
		getUsers(): {};
		getUserCount(): number;
		getClient(): Promise<any>;
		bindClientEvents(): void;
		removeClientEvents(): void;
		setMuted: (event: any) => void;
		setVideoEnabled: (event: any) => void;
		setCameraId(cameraId: any): void;
		setMicrophoneId(microphoneId: any): void;
		getCurrentMicrophoneId(): any;
		constructCameraParams(): {
			cameraId: any;
			videoQuality: any;
			facingMode: boolean;
		};
		useHdVideo(flag: any): void;
		videoHd: boolean | undefined;
		requestFloor(requestActive: any): void;
		sendLocalRecordState(recordState: any): void;
		sendEmotion(toUserId: any, emotion: any): void;
		sendCustomMessage(message: any, repeatOnConnect: any): void;
		/**
		 * Updates list of users,
		 */
		allowVideoFrom(userList: $Keys<typeof UserMnemonic> | number[]): void;
		startScreenSharing(): void;
		stopScreenSharing(): void;
		isScreenSharingStarted(): boolean;
		/**
		 * Invites users to participate in the call.
		 */
		inviteUsers(config?: {
			users: number[];
		}): void;
		scheduleRepeatInvite(): void;
		repeatInviteUsers(): void;
		/**
		 * @param {Object} config
		 * @param {bool?} [config.useVideo]
		 * @param {bool?} [config.joinAsViewer]
		 */
		answer(config?: {
			useVideo?: bool | null;
			joinAsViewer?: bool | null;
		}): void;
		decline(code: any): void;
		hangup(code: any, reason: any): void;
		attachToConference(options?: {
			joinAsViewer: boolean | null;
		}): Promise<any>;
		bindCallEvents(): void;
		removeCallEvents(): void;
		subscribeHardwareChanges(): void;
		unsubscribeHardwareChanges(): void;
		/**
		 * Adds new users to call
		 * @param {Number[]} users
		 */
		addJoinedUsers(users: number[]): void;
		/**
		 * Adds users, invited by you or someone else
		 * @param {Number[]} users
		 */
		addInvitedUsers(users: number[]): void;
		isAnyoneParticipating(): boolean;
		getParticipatingUsers(): string[];
		updateRoom(roomData: any): void;
		currentRoom(): any;
		isRoomSpeaker(): boolean;
		joinRoom(roomId: any): void;
		requestRoomSpeaker(): void;
		leaveCurrentRoom(): void;
		listRooms(): Promise<any>;
		__resolveListRooms: ((value: any) => void) | undefined;
		__onPullEvent(command: any, params: any, extra: any): void;
		__onPullEventAnswerSelf(params: any): void;
		_currentRoomId: any;
		sendTelemetryEvent(eventName: any): void;
	}

	class Peer {
		constructor(params: any);
		calculatedState: string;
		userId: any;
		call: any;
		ready: boolean;
		calling: boolean;
		declined: boolean;
		busy: boolean;
		inviteTimeout: boolean;
		endpoint: any;
		direction: any;
		stream: any;
		mediaRenderers: any[];
		isIncomingVideoAllowed: boolean;
		callingTimeout: number;
		connectionRestoreTimeout: number;
		callbacks: {
			onStateChanged: any;
			onInviteTimeout: any;
			onMediaReceived: any;
			onMediaRemoved: any;
			onVoiceStarted: any;
			onVoiceEnded: any;
			onMediaRenderEnabled: any;
			onMediaRenderDisabled: any;
		};
		setReady(ready: any): void;
		readyStack: string | undefined;
		setDirection(direction: any): void;
		setDeclined(declined: any): void;
		setBusy(busy: any): void;
		setEndpoint(endpoint: any): void;
		allowIncomingVideo(isIncomingVideoAllowed: any): void;
		addMediaRenderer(mediaRenderer: any): void;
		removeMediaRenderer(mediaRenderer: any): void;
		bindEndpointEventHandlers(): void;
		removeEndpointEventHandlers(): void;
		calculateState(): string;
		updateCalculatedState(): void;
		isParticipating(): any;
		waitForConnectionRestore(): void;
		onInvited(): void;
		onInviteTimeout(internal: any): void;
		onConnectionRestoreTimeout(): void;
		log(...args: any[]): void;
		destroy(): void;
	}

	class Signaling {
		constructor(params: any);
		call: any;
		inviteUsers(data: any): any;
		sendAnswer(data: any, repeated: any): any;
		sendCancel(data: any): any;
		sendHangup(data: any): void;
		sendVoiceStarted(data: any): void;
		sendVoiceStopped(data: any): void;
		sendMicrophoneState(microphoneState: any): void;
		sendCameraState(cameraState: any): void;
		sendScreenState(screenState: any): void;
		sendLocalRecordState(recordState: any): void;
		sendFloorRequest(requestActive: any): void;
		sendEmotion(toUserId: any, emotion: any): void;
		sendCustomMessage(message: any, repeatOnConnect: any): void;
		sendShowUsers(users: any): void;
		sendShowAll(): void;
		sendHideAll(): void;
		sendPingToUsers(data: any): void;
		sendPingToBackend(): void;
		sendUserInviteTimeout(data: any): void;
		sendJoinRoom(roomId: any): void;
		sendLeaveRoom(roomId: any): void;
		sendListRooms(): void;
		sendRequestRoomSpeaker(roomId: any): void;
	}
}
