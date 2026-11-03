import type {
	CallEngine,
	CallHandle,
	EngineContext,
	StartCallOptions,
	JoinCallOptions,
	PrepareCallData,
	BroadcastRequestOptions,
	UnfoldOptions,
} from 'call.engine.registry';

type ControllerFactory = (config: Object) => any;

export class LegacyCallEngine implements CallEngine
{
	#controller: any;

	constructor(context: EngineContext, controllerFactory: ControllerFactory)
	{
		this.#controller = controllerFactory({
			init: true,
			language: context.language,
			messengerFacade: context.messengerFacade,
			events: context.events,
		});
	}

	prepareCall(data: PrepareCallData): void
	{
		this.#controller.prepareCall(data);
	}

	startCall(dialogId: string, options: StartCallOptions): void
	{
		this.#controller.startCall(dialogId, options.withVideo, options.chatInfo, options.callOptions);
	}

	joinCall(callId: string, callUuid: string | undefined, options: JoinCallOptions): void
	{
		this.#controller.joinCall(callId, callUuid, options.withVideo, { chatInfo: options.chatInfo });
	}

	leaveCurrentCall(): void
	{
		this.#controller.leaveCurrentCall();
	}

	onAnswerButtonClick(mediaParams: Object, callParams: Object): void
	{
		this.#controller.onAnswerButtonClick(mediaParams, callParams);
	}

	closeCallNotification(): void
	{
		this.#controller.closeCallNotification();
	}

	releaseRingingCallSlot(): void
	{
		this.#controller.releaseRingingCallSlot();
	}

	hasActiveCall(): boolean
	{
		return this.#controller.hasActiveCall();
	}

	hasVisibleCall(): boolean
	{
		return this.#controller.hasVisibleCall();
	}

	fold(): void
	{
		this.#controller.fold();
	}

	unfold(options: UnfoldOptions = {}): void
	{
		this.#controller.unfold(options);
	}

	getActiveCall(): CallHandle | null
	{
		if (!this.#controller.hasActiveCall())
		{
			return null;
		}

		// hasActiveCall() can be true via the controller's viewPort while currentCall
		// is not assigned yet (call-start transient), so guard the dereference too.
		const call = this.#controller.currentCall;
		if (!call)
		{
			return null;
		}

		return {
			uuid: call.uuid,
			dialogId: call.associatedEntity.id,
			isScreenSharingStarted: () => call.isScreenSharingStarted(),
			raw: call,
		};
	}

	sendBroadcastRequest(callUuid: string, options: BroadcastRequestOptions = {}): Promise<boolean[]>
	{
		return this.#controller.sendBroadcastRequest(callUuid, { silent: options.silent ?? false, timeout: 100 });
	}

	setDebug(debug: boolean): void
	{
		this.#controller.debug = debug;
	}

	get events(): any
	{
		return this.#controller;
	}
}
