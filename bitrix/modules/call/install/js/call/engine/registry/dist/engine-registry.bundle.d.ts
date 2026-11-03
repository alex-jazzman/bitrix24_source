/* eslint-disable */
type EngineProviders = {
	engine: (context: EngineContext) => CallEngine;
	capabilities: () => CallCapabilities;
	recentSource: () => RecentCallsSource;
};

type EngineContext = {
	language: string;
	messengerFacade: Object;
	events: Object;
};

interface CallEngine {
	prepareCall(data: PrepareCallData): void;
	startCall(dialogId: string, options: StartCallOptions): void;
	joinCall(callId: string, callUuid: string | undefined, options: JoinCallOptions): void;
	leaveCurrentCall(): void;
	onAnswerButtonClick(mediaParams: Object, callParams: Object): void;
	closeCallNotification(): void;
	/**
	 * Releases the call slot if it is taken by a ringing incoming call: the invitation is declined
	 * and the slot is freed. Does nothing when the slot is empty or holds an answered call.
	 */
	releaseRingingCallSlot(): void;
	hasActiveCall(): boolean;
	hasVisibleCall(): boolean;
	fold(): void;
	unfold(options?: UnfoldOptions): void;
	getActiveCall(): CallHandle | null;
	sendBroadcastRequest(callUuid: string, options?: BroadcastRequestOptions): Promise<boolean[]>;
	setDebug(debug: boolean): void;
	readonly events: BX.Event.EventEmitter;
}

type PrepareCallData = {
	dialogId: string;
	userData: Object;
	user?: number | string;
};

type StartCallOptions = {
	withVideo: boolean;
	chatInfo: Object;
	callOptions: Object;
};

type JoinCallOptions = {
	withVideo: boolean;
	chatInfo: Object;
};

type UnfoldOptions = {
	isReturnGesture?: boolean;
};

type CallHandle = {
	uuid: string;
	dialogId: string;
	isScreenSharingStarted: () => boolean;
	raw: ActiveCallInstance;
};

type ActiveCallInstance = ActiveCallContract & LegacyCallInstanceTail;

type ActiveCallContract = {
	id: number | string;
	uuid: string;
	type: number;
	provider: string;
	state: string;
	direction: string;
	initiatorId: number | string;
	users: number[];
	associatedEntity: {
		id: string;
		name?: string;
	};
	addDialogInfo: (dialogInfo: {
		id: string;
		name?: string;
	}) => void;
	isScreenSharingStarted: () => boolean;
	isAnyoneParticipating: () => boolean;
	inviteUsers: (config?: InviteUsersConfig) => void;
	answer: (config?: AnswerCallConfig) => void;
	decline: (code?: number, reason?: string) => void;
	hangup: (...args: Array<unknown>) => void;
	destroy: () => void;
	startScreenSharing: (changeSource?: boolean) => void;
	stopScreenSharing: () => void;
	getUsers: () => {
		[userId: string]: string;
	};
	getParticipatingUsers: () => string[];
	setCameraId: (cameraId: string) => void;
	setMicrophoneId: (microphoneId: string) => void;
	allowVideoFrom: (userList: string | number[]) => void;
	sendCustomMessage: (message: unknown, repeatOnConnect?: boolean) => void;
	getLocalStream: (tag?: string) => MediaStream | null;
	setLocalStream: (mediaStream: MediaStream | null, tag?: string) => void;
	addEventListener: (eventName: string, listener: CallEventHandler) => void;
	removeEventListener: (eventName: string, listener: CallEventHandler) => void;
};

type InviteUsersConfig = {
	users?: number[];
	userData?: {
		[key: string]: unknown;
	};
	show?: boolean;
	localStream?: MediaStream;
};

type AnswerCallConfig = {
	joinAsViewer?: boolean;
	useVideo?: boolean;
};

type CallEventHandler = (event: unknown) => void;

type LegacyCallInstanceTail = {
	[member: string]: any;
};

type BroadcastRequestOptions = {
	silent?: boolean;
};

interface CallCapabilities {
	getUserLimit(): number;
	isWebRTCSupported(): boolean;
}

interface RecentCallsSource {
	callEvent: CallLifecycleEventNames;
	instantiator: CallInstantiator;
	addCallListener(call: LegacyCallInstance, event: string, handler: CallEventHandler): void;
	removeCallListener(call: LegacyCallInstance, event: string, handler: CallEventHandler): void;
}

type CallLifecycleEventNames = {
	onJoin: string;
	onLeave: string;
	onDestroy: string;
};

interface CallInstantiator {
	isLegacyCall(provider: string | undefined, scheme: unknown): boolean;
	isFinished(call: RawCallIdentity): boolean;
	instantiate(call: LegacyCallInstance | undefined, callToken: unknown, logToken: unknown, userData: Object | undefined): LegacyCallInstance;
	instantiateLegacy(call: LegacyCallInstance | undefined, users: unknown, logToken: unknown, connectionData: unknown, userData: unknown): LegacyCallInstance;
}

type RawCallIdentity = {
	ID?: string | number;
	UUID?: string;
	PROVIDER?: string;
	SCHEME?: unknown;
};

type LegacyCallInstance = Object;

declare namespace BX.Call.EngineProviders.Registry {
	const engineRegistry: {
		register(engineProviders: EngineProviders): void;
		create(context: EngineContext): CallEngine;
		getCapabilities(): CallCapabilities;
		getRecentCallsSource(): RecentCallsSource;
		reset(): void;
	};
}
