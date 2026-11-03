/* eslint-disable */
type ControllerFactory = (config: Object) => any;

declare namespace BX.Call.EngineProviders.Legacy {
	class LegacyCallEngine implements BX.Call.EngineProviders.Registry.CallEngine {
		constructor(context: BX.Call.EngineProviders.Registry.EngineContext, controllerFactory: ControllerFactory);
		prepareCall(data: BX.Call.EngineProviders.Registry.PrepareCallData): void;
		startCall(dialogId: string, options: BX.Call.EngineProviders.Registry.StartCallOptions): void;
		joinCall(callId: string, callUuid: string | undefined, options: BX.Call.EngineProviders.Registry.JoinCallOptions): void;
		leaveCurrentCall(): void;
		onAnswerButtonClick(mediaParams: Object, callParams: Object): void;
		closeCallNotification(): void;
		releaseRingingCallSlot(): void;
		hasActiveCall(): boolean;
		hasVisibleCall(): boolean;
		fold(): void;
		unfold(options?: BX.Call.EngineProviders.Registry.UnfoldOptions): void;
		getActiveCall(): BX.Call.EngineProviders.Registry.CallHandle | null;
		sendBroadcastRequest(callUuid: string, options?: BX.Call.EngineProviders.Registry.BroadcastRequestOptions): Promise<boolean[]>;
		setDebug(debug: boolean): void;
		get events(): any;
	}
}
