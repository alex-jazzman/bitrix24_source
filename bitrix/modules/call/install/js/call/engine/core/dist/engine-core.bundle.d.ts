/* eslint-disable */
declare namespace BX.Call.EngineProviders.Core {
	class CoreCallEngine implements BX.Call.EngineProviders.Registry.CallEngine {
		constructor();
		prepareCall(_data: BX.Call.EngineProviders.Registry.PrepareCallData): void;
		startCall(_dialogId: string, _options: BX.Call.EngineProviders.Registry.StartCallOptions): void;
		joinCall(_callId: string, _callUuid: string | undefined, _options: BX.Call.EngineProviders.Registry.JoinCallOptions): void;
		leaveCurrentCall(): void;
		onAnswerButtonClick(_mediaParams: Object, _callParams: Object): void;
		closeCallNotification(): void;
		releaseRingingCallSlot(): void;
		hasActiveCall(): boolean;
		hasVisibleCall(): boolean;
		fold(): void;
		unfold(_options?: BX.Call.EngineProviders.Registry.UnfoldOptions): void;
		getActiveCall(): BX.Call.EngineProviders.Registry.CallHandle | null;
		sendBroadcastRequest(_callUuid: string, _options?: BX.Call.EngineProviders.Registry.BroadcastRequestOptions): Promise<boolean[]>;
		setDebug(_debug: boolean): void;
		get events(): BX.Event.EventEmitter;
	}
}
