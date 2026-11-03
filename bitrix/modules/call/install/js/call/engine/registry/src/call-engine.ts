import type { EventEmitter } from 'main.core.events';
import type { CallEventHandler } from './recent-calls-source';

export type StartCallOptions = {
	withVideo: boolean,
	chatInfo: Object,
	callOptions: Object,
};

export type JoinCallOptions = {
	withVideo: boolean,
	chatInfo: Object,
};

export type PrepareCallData = {
	dialogId: string,
	userData: Object,
	user?: number | string,
};

export type InviteUsersConfig = {
	users?: number[],
	userData?: { [key: string]: unknown },
	// Union of the fields the legacy implementations accept: `show` in BitrixCallLegacy,
	// `localStream` in PlainCall.
	show?: boolean,
	localStream?: MediaStream,
};

export type AnswerCallConfig = {
	joinAsViewer?: boolean,
	useVideo?: boolean,
};

// The engine contract for the active call: the members CallManager and the call UI are allowed to
// rely on. Everything here survives the switch to the core engine.
export type ActiveCallContract = {
	id: number | string,
	uuid: string,
	type: number,
	provider: string,
	state: string,
	direction: string,
	initiatorId: number | string,
	users: number[],
	associatedEntity: { id: string, name?: string },
	addDialogInfo: (dialogInfo: { id: string, name?: string }) => void,
	isScreenSharingStarted: () => boolean,
	isAnyoneParticipating: () => boolean,
	inviteUsers: (config?: InviteUsersConfig) => void,
	answer: (config?: AnswerCallConfig) => void,
	decline: (code?: number, reason?: string) => void,
	// Arity differs across the legacy implementations: (code, reason, finishCall) in
	// BitrixCallLegacy and VoximplantCall vs (force) in PlainCall.
	hangup: (...args: Array<unknown>) => void,
	destroy: () => void,
	// `changeSource` is honored by PlainCall only; the other implementations ignore it.
	startScreenSharing: (changeSource?: boolean) => void,
	stopScreenSharing: () => void,
	// userId => calculated user state.
	getUsers: () => { [userId: string]: string },
	getParticipatingUsers: () => string[],
	setCameraId: (cameraId: string) => void,
	setMicrophoneId: (microphoneId: string) => void,
	// Either a UserMnemonic value or an explicit user list.
	allowVideoFrom: (userList: string | number[]) => void,
	sendCustomMessage: (message: unknown, repeatOnConnect?: boolean) => void,
	getLocalStream: (tag?: string) => MediaStream | null,
	setLocalStream: (mediaStream: MediaStream | null, tag?: string) => void,
	addEventListener: (eventName: string, listener: CallEventHandler) => void,
	removeEventListener: (eventName: string, listener: CallEventHandler) => void,
};

// Everything else the legacy instance happens to expose: internal machinery of BitrixCallLegacy /
// PlainCall / VoximplantCall (peer setup, ping loops, invite retries) and their mutable fields.
// Not part of the contract — kept reachable only so TypeScript code written against the
// pre-refactor union of concrete call classes keeps compiling. Dies with the legacy engine, and
// the core engine is not obliged to provide any of it.
export type LegacyCallInstanceTail = {
	[member: string]: any,
};

// Raw active call instance exposed via CallHandle.raw and CallManager.getCurrentCall():
// the engine contract plus the transitional legacy tail.
export type ActiveCallInstance = ActiveCallContract & LegacyCallInstanceTail;

// Opaque handle to the active call. Stage 1 forwards the legacy call instance;
// Stage 3 returns the core engine's public projection.
// Stage 1: only dialogId, raw, and isScreenSharingStarted are consumed by CallManager.
// uuid is forward-carry for Stage 3 (core engine) consumers.
export type CallHandle = {
	uuid: string,
	dialogId: string,
	isScreenSharingStarted: () => boolean,
	raw: ActiveCallInstance, // transitional: legacy call instance; removed when the legacy engine is deleted
};

export type BroadcastRequestOptions = {
	silent?: boolean,
};

export type UnfoldOptions = {
	// True when the user explicitly returns to the call (the "return to call" button):
	// the window may take the focus outright instead of yielding it.
	isReturnGesture?: boolean,
};

// Everything the engine needs from the host module (im) at construction time.
export type EngineContext = {
	language: string,
	messengerFacade: Object,
	events: Object,
};

export interface CallEngine
{
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
	// UNUSED in Stage 1: lifecycle wiring (onIncoming/onJoin/onLeave/onDestroy) stays on the
	// global EventEmitter + `call.addEventListener` inside CallManager. This member is consumed
	// by the core engine in Stage 3.
	readonly events: EventEmitter;
}
