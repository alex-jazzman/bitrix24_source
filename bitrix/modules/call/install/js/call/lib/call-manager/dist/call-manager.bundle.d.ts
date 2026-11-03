/* eslint-disable */
declare namespace BX.Call.Lib {
	class CallManager {
		static instance: CallManager;
		static viewContainerClass: string;
		static getInstance(): CallManager;
		constructor();
		sendBroadcastRequest(callUuid: string): Promise<boolean>;
		syncActiveCallState(dialogId: string, callUuid: string): Promise<void>;
		syncActiveConferenceState(dialogId: string, callUuid: string, conferenceCode: string): Promise<void>;
		takeOverCall(dialogId: string, callUuid: string): Promise<void>;
		setNextCallOptions(options: Object): void;
		startCall(dialogId: string, withVideo?: boolean, callOptions?: Object | null): void;
		joinCall(callId: string, callUuid: string | undefined, dialogId: string, withVideo?: boolean): void;
		leaveCurrentCall(): void;
		onAnswerButtonClick(mediaParams: BX.JsonObject, callParams: BX.JsonObject): void;
		onJoinFromRecentItem(): void;
		/**
		 * Releases the call slot if it is taken by a ringing incoming call: the invitation is declined and the slot
		 * is freed. Does nothing when the slot is empty or holds an answered call.
		 *
		 * Needed by consumers that enter a call bypassing the controller — a conference is opened by the messenger
		 * itself, so without this call the ringing invitation would stay in the slot and keep ringing on the server.
		 */
		releaseRingingCallSlot(): void;
		deleteRecentCall(dialogId: string): void;
		foldCurrentCall(): void;
		unfoldCurrentCall(): void;
		getCurrentCallDialogId(): string;
		getCurrentCall(): false | import("call.engine.registry").ActiveCallInstance;
		getCurrentUser(): BX.Messenger.v2.Model.ImModelUser;
		hasCurrentCall(): boolean;
		hasCurrentScreenSharing(): boolean;
		hasVisibleCall(): boolean;
		toggleDebugFlag(debug: any): void;
		chatCanBeCalled(dialogId: string): boolean;
		hasActiveCurrentCall(dialogId: string): boolean;
		hasActiveAnotherCall(dialogId: string): boolean;
		hasActiveCallInDialog(dialogId: string): boolean;
		getCallUserLimit(): number;
		isChatUserLimitExceeded(dialogId: string): boolean;
		updateRecentCallsList(activeCalls: any): void;
		isConference(dialogId: string): boolean;
	}
}
