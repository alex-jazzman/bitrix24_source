import { EventEmitter } from 'main.core.events';
import type {
	CallEngine,
	CallHandle,
	StartCallOptions,
	JoinCallOptions,
	PrepareCallData,
	BroadcastRequestOptions,
	UnfoldOptions,
} from 'call.engine.registry';

const notImplemented = (method: string): Error =>
{
	return new Error(`CoreCallEngine.${method}: new call core not implemented yet`);
};

export class CoreCallEngine implements CallEngine
{
	#events: EventEmitter = new EventEmitter();

	constructor()
	{
		this.#events.setEventNamespace('BX.Call.CoreCallEngine');
	}

	// Two intentional behaviours below: query methods (hasActiveCall, hasVisibleCall,
	// getActiveCall, sendBroadcastRequest, setDebug) are SAFE NO-OPs returning empty/false/null
	// so CallManager's guards keep working while the flag is ON; mutators (prepareCall,
	// startCall, joinCall, leaveCurrentCall, onAnswerButtonClick, closeCallNotification,
	// releaseRingingCallSlot, fold, unfold) THROW because they are not implemented until
	// the new call core lands.
	prepareCall(_data: PrepareCallData): void
	{
		throw notImplemented('prepareCall');
	}

	startCall(_dialogId: string, _options: StartCallOptions): void
	{
		throw notImplemented('startCall');
	}

	joinCall(_callId: string, _callUuid: string | undefined, _options: JoinCallOptions): void
	{
		throw notImplemented('joinCall');
	}

	leaveCurrentCall(): void
	{
		throw notImplemented('leaveCurrentCall');
	}

	onAnswerButtonClick(_mediaParams: Object, _callParams: Object): void
	{
		throw notImplemented('onAnswerButtonClick');
	}

	closeCallNotification(): void
	{
		throw notImplemented('closeCallNotification');
	}

	releaseRingingCallSlot(): void
	{
		throw notImplemented('releaseRingingCallSlot');
	}

	hasActiveCall(): boolean
	{
		return false;
	}

	hasVisibleCall(): boolean
	{
		return false;
	}

	fold(): void
	{
		throw notImplemented('fold');
	}

	unfold(_options?: UnfoldOptions): void
	{
		throw notImplemented('unfold');
	}

	getActiveCall(): CallHandle | null
	{
		return null;
	}

	sendBroadcastRequest(_callUuid: string, _options?: BroadcastRequestOptions): Promise<boolean[]>
	{
		return Promise.resolve([]);
	}

	setDebug(_debug: boolean): void
	{
		// no-op until the new call core lands
	}

	get events(): EventEmitter
	{
		return this.#events;
	}
}
