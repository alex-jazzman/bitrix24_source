import { err, MediaTrackKind, ok } from 'call.engine.transport';
import type {
	ConnectionDescriptor,
	MediaEndpointId,
	MediaTransport,
	MediaTransportIntent,
	MediaTransportListener,
	ParticipantId,
	Quality,
	RemoteMuteKind,
	Result,
	TransportError,
} from 'call.engine.transport';

/**
 * One recorded intent, in the vocabulary of the contract: the name as it was called, and the arguments
 * it carried. A field an intent has no argument for stays `undefined`, so the shape of an entry never
 * depends on which intent produced it, and the order of the list is the order the calls came in.
 */
export type MediaTransportIntentCall = {
	intent: MediaTransportIntent,
	/** The surface a publish or an unpublish was about; absent for the intents that name none. */
	kind?: MediaTrackKind,
	track?: MediaStreamTrack,
	descriptor?: ConnectionDescriptor,
	participantId?: ParticipantId,
	quality?: Quality,
};

/** What a plane that was torn down answers an intent with: the refusal the contract states, in its own code. */
const CLOSED: TransportError = { kind: 'contract', code: 'plane.closed' };

export type FakeMediaTransportOptions = {
	/** Streaming events of this plane; the fake produces none by itself, every one is asked for. */
	listener: MediaTransportListener,
};

/**
 * A media plane that is driven instead of connected. It implements the whole contract without raising
 * anything: no `RTCPeerConnection`, no media server, no negotiation - so the logic above a transport
 * (escalation, recovery, the lifecycle of a session) is exercised on a plane whose every outcome and
 * every event the test decides.
 *
 * Two halves make it controllable. Each intent answers `ok` until a test programs another outcome for
 * that intent, which is how a plane that refuses to connect or to publish is set up; and each event of
 * the contract has a command that emits it, which is how remote media, a change of quality, a cycle of
 * recovery and a terminal failure appear on demand. What was asked of the plane is read back from the
 * record of the intents, from the tracks it currently publishes and from whether it counts as connected.
 *
 * It emulates the plane, not the wire: the conditions a real implementation would derive from sdp,
 * candidates and mids are stated here directly, and none of that vocabulary exists in the fake any more
 * than it does in the contract. The tracks are not owned either - nothing here stops one, exactly as no
 * real transport does.
 */
export class FakeMediaTransport implements MediaTransport
{
	#listener: MediaTransportListener;
	#intentCalls: MediaTransportIntentCall[] = [];
	#outcomes: Map<MediaTransportIntent, Result<void, TransportError>> = new Map();
	#publishedTracks: Map<MediaTrackKind, MediaStreamTrack> = new Map();
	#connected: boolean = false;
	#closed: boolean = false;

	constructor(options: FakeMediaTransportOptions)
	{
		this.#listener = options.listener;
	}

	async connect(descriptor: ConnectionDescriptor): Promise<Result<void, TransportError>>
	{
		const outcome = this.#record({ intent: 'connect', descriptor });

		this.#connected = outcome.ok;

		return outcome;
	}

	async disconnect(): Promise<Result<void, TransportError>>
	{
		const outcome = this.#record({ intent: 'disconnect' });

		if (outcome.ok)
		{
			this.#connected = false;
		}

		return outcome;
	}

	async publishAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#publish('publishAudio', MediaTrackKind.Audio, track);
	}

	async unpublishAudio(): Promise<Result<void, TransportError>>
	{
		return this.#unpublish('unpublishAudio', MediaTrackKind.Audio);
	}

	async publishVideo(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#publish('publishVideo', MediaTrackKind.Video, track);
	}

	async unpublishVideo(): Promise<Result<void, TransportError>>
	{
		return this.#unpublish('unpublishVideo', MediaTrackKind.Video);
	}

	async publishScreen(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#publish('publishScreen', MediaTrackKind.Screen, track);
	}

	async unpublishScreen(): Promise<Result<void, TransportError>>
	{
		return this.#unpublish('unpublishScreen', MediaTrackKind.Screen);
	}

	async publishScreenAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#publish('publishScreenAudio', MediaTrackKind.ScreenAudio, track);
	}

	async unpublishScreenAudio(): Promise<Result<void, TransportError>>
	{
		return this.#unpublish('unpublishScreenAudio', MediaTrackKind.ScreenAudio);
	}

	async setRemoteQuality(
		participantId: ParticipantId,
		quality: Quality,
	): Promise<Result<void, TransportError>>
	{
		return this.#record({ intent: 'setRemoteQuality', participantId, quality });
	}

	/**
	 * Takes the plane down the way a real one goes on a swap of the media plane or at the end of a call:
	 * it stops counting as connected, stops emitting and refuses every intent from then on. Nothing is
	 * recorded among the intents - teardown answers no result - and a second call changes nothing.
	 */
	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#connected = false;
	}

	/**
	 * What this intent answers from now on. Programmed per intent, so a plane that connects and then
	 * refuses to publish - the shape a failed escalation has - is one line of setup.
	 */
	setIntentOutcome(intent: MediaTransportIntent, outcome: Result<void, TransportError>): void
	{
		this.#outcomes.set(intent, outcome);
	}

	emitRemoteTrackAdded(participantId: ParticipantId, track: MediaStreamTrack): void
	{
		this.#emit((listener) => listener.onRemoteTrackAdded(participantId, track));
	}

	emitRemoteTrackRemoved(participantId: ParticipantId, kind: MediaTrackKind): void
	{
		this.#emit((listener) => listener.onRemoteTrackRemoved(participantId, kind));
	}

	emitRemoteTrackMuted(participantId: ParticipantId, kind: RemoteMuteKind, isMuted: boolean): void
	{
		this.#emit((listener) => listener.onRemoteTrackMuted(participantId, kind, isMuted));
	}

	emitConnectionQualityChanged(participantId: ParticipantId, quality: Quality): void
	{
		this.#emit((listener) => listener.onConnectionQualityChanged(participantId, quality));
	}

	emitReconnecting(): void
	{
		this.#emit((listener) => listener.onReconnecting());
	}

	emitReconnected(): void
	{
		this.#emit((listener) => listener.onReconnected());
	}

	emitFailure(error: TransportError): void
	{
		this.#emit((listener) => listener.onFailure(error));
	}

	/** Remote media of an endpoint nobody has mapped yet; the fake needs no resolver to state it. */
	emitUnresolvedRemoteTrack(endpointId: MediaEndpointId, track: MediaStreamTrack): void
	{
		this.#emit((listener) => listener.onUnresolvedRemoteTrack(endpointId, track));
	}

	/** The mapping of a held endpoint turned out not to be coming: the refusal, with the reason given. */
	emitUnresolvedRemoteTrackDropped(endpointId: MediaEndpointId, error: TransportError): void
	{
		this.#emit((listener) => listener.onUnresolvedRemoteTrackDropped(endpointId, error));
	}

	/** Every intent in the order it was called: the record an ordering between intents is read from. */
	getIntentCalls(): MediaTransportIntentCall[]
	{
		return [...this.#intentCalls];
	}

	/**
	 * The track this plane currently sends for that surface - the same instance it was given. Absent
	 * until a publish succeeded, and gone again after an unpublish did.
	 */
	getPublishedTrack(kind: MediaTrackKind): MediaStreamTrack | undefined
	{
		return this.#publishedTracks.get(kind);
	}

	/** Whether the plane counts as raised: a successful `connect` sets it, a `disconnect` clears it. */
	isConnected(): boolean
	{
		return this.#connected;
	}

	/** Whether the plane was torn down - what tells a plane that lost a swap from one that keeps serving. */
	isClosed(): boolean
	{
		return this.#closed;
	}

	#publish(
		intent: MediaTransportIntent,
		kind: MediaTrackKind,
		track: MediaStreamTrack,
	): Result<void, TransportError>
	{
		const outcome = this.#record({ intent, kind, track });

		if (outcome.ok)
		{
			this.#publishedTracks.set(kind, track);
		}

		return outcome;
	}

	#unpublish(intent: MediaTransportIntent, kind: MediaTrackKind): Result<void, TransportError>
	{
		const outcome = this.#record({ intent, kind });

		if (outcome.ok)
		{
			this.#publishedTracks.delete(kind);
		}

		return outcome;
	}

	/**
	 * The one way an event of this plane leaves it, and the one place a plane that was torn down stops
	 * emitting: a command given after `close` reaches no consumer, exactly as a real plane reports nothing
	 * once it is gone.
	 */
	#emit(deliver: (listener: MediaTransportListener) => void): void
	{
		if (this.#closed)
		{
			return;
		}

		deliver(this.#listener);
	}

	/**
	 * Records the call and answers what was programmed for that intent; success by default. A plane that was
	 * torn down records nothing and refuses instead: teardown is terminal for the intents too, so an outcome
	 * programmed for one of them does not outlive the plane it was programmed on.
	 */
	#record(call: MediaTransportIntentCall): Result<void, TransportError>
	{
		if (this.#closed)
		{
			return err(CLOSED);
		}

		this.#intentCalls.push(call);

		return this.#outcomes.get(call.intent) ?? ok(undefined);
	}
}
