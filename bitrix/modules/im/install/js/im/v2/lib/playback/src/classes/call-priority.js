import { EventEmitter, type BaseEvent } from 'main.core.events';

import { PlaybackPauseReason } from '../const/pause-reason';

const CallEventName = {
	incomingCall: 'CallEvents::incomingCall',
	callCreated: 'CallEvents::callCreated',
	callLeft: 'BX.Call.Controller:onCallLeft',
	callDestroyed: 'BX.Call.Controller:onCallDestroyed',
};

const OUTGOING_CALL_DIRECTION = 'Outgoing';

type CallCreatedData = Array<{ call: { direction: string } }>;
type CallFinishedData = { callDetails: { wasConnected?: boolean } };

type PlaybackController = {
	pause: (reason: $Values<typeof PlaybackPauseReason>) => void,
	handleCallFinished: (wasConnected: boolean) => void,
};

export class CallPriority
{
	static #instance: ?CallPriority = null;

	#service: PlaybackController;
	#outgoingPhoneCallStarted: boolean = false;
	#phoneCallConnected: boolean = false;

	static create(service: PlaybackController): void
	{
		this.#instance = new CallPriority(service);
	}

	static getInstanceIfCreated(): ?CallPriority
	{
		return this.#instance;
	}

	constructor(service: PlaybackController)
	{
		this.#service = service;
		this.#subscribeToCallEvents();
	}

	handleOutgoingPhoneCall(): void
	{
		this.#outgoingPhoneCallStarted = true;
	}

	handlePhoneCallCreated(): void
	{
		this.#service.pause(this.#outgoingPhoneCallStarted
			? PlaybackPauseReason.outgoingCall
			: PlaybackPauseReason.incomingCallMissed);
	}

	handlePhoneCallConnected(isIncoming: boolean): void
	{
		this.#phoneCallConnected = true;
		this.#service.pause(isIncoming
			? PlaybackPauseReason.incomingCallAnswered
			: PlaybackPauseReason.outgoingCall);
	}

	handlePhoneCallDestroyed(): void
	{
		const wasConnected = this.#phoneCallConnected;

		this.#outgoingPhoneCallStarted = false;
		this.#phoneCallConnected = false;

		this.#service.handleCallFinished(wasConnected);
	}

	#subscribeToCallEvents(): void
	{
		EventEmitter.subscribe(CallEventName.incomingCall, this.#onIncomingCall);
		EventEmitter.subscribe(CallEventName.callCreated, this.#onCallCreated);
		EventEmitter.subscribe(CallEventName.callLeft, this.#onCallFinished);
		EventEmitter.subscribe(CallEventName.callDestroyed, this.#onCallFinished);
	}

	#onIncomingCall = (): void => {
		this.#service.pause(PlaybackPauseReason.incomingCallMissed);
	};

	#onCallCreated = (event: BaseEvent<CallCreatedData>): void => {
		if (event.getData()?.[0]?.call?.direction !== OUTGOING_CALL_DIRECTION)
		{
			return;
		}

		this.#service.pause(PlaybackPauseReason.outgoingCall);
	};

	#onCallFinished = (event: BaseEvent<CallFinishedData>): void => {
		this.#service.handleCallFinished(event.getData()?.callDetails?.wasConnected === true);
	};
}
