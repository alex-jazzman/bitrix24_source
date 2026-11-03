import type { ConnectionAcquisition } from '../acquisition/connection-acquisition';
import { CallScheme } from '../domain/connection-descriptor';
import type { ConnectionDescriptor } from '../domain/connection-descriptor';
import type { ConnectionRequest } from '../domain/connection-request';
import type { MediaEndpointId, ParticipantId } from '../domain/participant';
import type { Quality } from '../domain/quality';
import { err, isErr, ok } from '../error/result';
import type { Err, Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { LogDetails, LoggerPort } from '../port/logger-port';
import type { RemoteMuteKind } from '../signaling/pull-dispatcher';
import { LocalMediaKind } from './local-media-source';
import type { LocalMediaSource } from './local-media-source';
import type { MediaTrackKind, MediaTransport, MediaTransportListener } from './media-transport';

/**
 * Refusals of the decorator itself rather than of a connection or of a plane: no swap was attempted for
 * any of them, and the plane that serves the media is left exactly as it was.
 */
export const EscalationContractCode: {
	readonly AlreadyRunning: 'escalation.already_running',
	readonly AlreadyEscalated: 'escalation.already_escalated',
	readonly Closed: 'escalation.closed',
} = Object.freeze({
	AlreadyRunning: 'escalation.already_running',
	AlreadyEscalated: 'escalation.already_escalated',
	Closed: 'escalation.closed',
});

export type EscalationContractCode = typeof EscalationContractCode[keyof typeof EscalationContractCode];

const SWAP_STARTED = 'escalation: a swap of the media plane to the sfu started';
const SWAP_COMMITTED = 'escalation: the sfu reached commit and serves the media from now on';
const SWAP_LOST = 'escalation: the sfu did not reach commit, the mesh keeps serving';
const SWAP_HELD_DELIVERED = 'escalation: what the sfu reported before the commit went on once it took over';
const SURFACE_UNSETTLED = 'escalation: a surface stated while the swap ran did not settle on the sfu';
const SWAP_ABANDONED = 'escalation: the swap committed, but the call was left or closed before it answered';

/**
 * Where a lost swap stopped. Safe metadata of the log and nothing a caller reads: the outcome of an
 * escalation travels in its result, carrying the error of the step that lost it.
 */
const SwapStage: {
	readonly Acquisition: 'acquisition',
	readonly Connect: 'connect',
	readonly Publish: 'publish',
	readonly Closed: 'closed',
	readonly Disconnected: 'disconnected',
} = Object.freeze({
	Acquisition: 'acquisition',
	Connect: 'connect',
	Publish: 'publish',
	Closed: 'closed',
	Disconnected: 'disconnected',
});

type SwapStage = typeof SwapStage[keyof typeof SwapStage];

/** Generation of the plane the decorator starts with; every escalation allocates the next one. */
const MESH_EPOCH = 0;

/**
 * How a plane of one generation is heard. Generations only grow, so the comparison with the one that
 * serves says which of the three a plane is in: the plane that carries the media right now, a plane a
 * swap is still raising, or a plane the media has left. A closed decorator leaves only the last one.
 */
const PlaneVoice: {
	readonly Heard: 'heard',
	readonly Held: 'held',
	readonly Dropped: 'dropped',
} = Object.freeze({
	Heard: 'heard',
	Held: 'held',
	Dropped: 'dropped',
});

type PlaneVoice = typeof PlaneVoice[keyof typeof PlaneVoice];

/** Raises the plane the decorator starts with, on the guarded listener it is handed. */
export type MeshTransportFactory = (listener: MediaTransportListener) => MediaTransport;

/**
 * Raises the plane a swap moves the media to, for the connection that was just acquired. Injected
 * because the sfu implementation itself lives outside this contract - which is also what lets the swap
 * be exercised on a plane whose every outcome is decided by whoever builds it.
 */
export type SfuTransportFactory = (
	descriptor: ConnectionDescriptor,
	listener: MediaTransportListener,
) => MediaTransport;

/**
 * What the swap reads local media through. Narrowed to the one reader on purpose: the tracks are owned
 * by `LocalMediaSource`, and a decorator that cannot reach a `disable` or a `close` cannot stop one.
 */
export type LocalTrackReader = Pick<LocalMediaSource, 'getTrack'>;

export type EscalatableMediaTransportOptions = {
	createMeshTransport: MeshTransportFactory,
	createSfuTransport: SfuTransportFactory,
	/**
	 * Acquisition of the jwt schema, settled by the composition root before anything is acquired: an
	 * implementation never switches schema by itself, so the swap asks the jwt one and hands it a request
	 * of that schema.
	 */
	acquisition: ConnectionAcquisition,
	/** Where the tracks of the swap come from; they are republished, never obtained again. */
	localMedia: LocalTrackReader,
	/** The consumer of the media events - the same one across a swap, reached per generation. */
	listener: MediaTransportListener,
	logger: LoggerPort,
};

/** The plane that carries the media, together with the generation its callbacks are recognized by. */
type Plane = {
	transport: MediaTransport,
	epoch: number,
};

/** A surface the caller published, and the track the source holds for it - the pair a swap republishes. */
type HeldSurface = {
	kind: LocalMediaKind,
	track: MediaStreamTrack,
};

/** A surface carries nothing: what an unpublish states, and what an empty surface is compared against. */
const UNPUBLISHED = null;

/**
 * What a surface must carry, as the caller last stated it: the track of a publish, or nothing at all after
 * an unpublish. A surface no intent has ever named has no entry of its own, and a swap carries nothing over
 * for it: the source may well hold a track of that surface, but local media nobody asked to send is not
 * media a new plane is handed.
 */
type IntendedTrack = MediaStreamTrack | null;

/** Both directions of one local surface, as the intents of the contract spell them. */
type SurfaceIntents = {
	publish: (transport: MediaTransport, track: MediaStreamTrack) => Promise<Result<void, TransportError>>,
	unpublish: (transport: MediaTransport) => Promise<Result<void, TransportError>>,
};

/**
 * How a local surface is put on a connection and taken off it: the vocabulary of the devices on the left,
 * the intents that carry it on the right. Keyed by the surfaces of the source, so one added there fails to
 * compile here until the swap knows how to move it, and stated once so that the intent a caller reaches and
 * the intent a swap reaches for the same surface can never drift apart.
 */
const SURFACE_INTENTS: Record<LocalMediaKind, SurfaceIntents> = {
	[LocalMediaKind.Microphone]: {
		publish: (transport, track) => transport.publishAudio(track),
		unpublish: (transport) => transport.unpublishAudio(),
	},
	[LocalMediaKind.Camera]: {
		publish: (transport, track) => transport.publishVideo(track),
		unpublish: (transport) => transport.unpublishVideo(),
	},
	[LocalMediaKind.Screen]: {
		publish: (transport, track) => transport.publishScreen(track),
		unpublish: (transport) => transport.unpublishScreen(),
	},
	[LocalMediaKind.ScreenAudio]: {
		publish: (transport, track) => transport.publishScreenAudio(track),
		unpublish: (transport) => transport.unpublishScreenAudio(),
	},
};

/** Audio first: the surface a call cannot do without is the first one the new plane carries. */
const SURFACES: readonly LocalMediaKind[] = Object.keys(SURFACE_INTENTS) as LocalMediaKind[];

/** Whether a surface already carries what the caller asked for; nothing on both sides counts as equal. */
function alreadyCarried(intended: IntendedTrack, carried: MediaStreamTrack | undefined): boolean
{
	return intended === (carried ?? UNPUBLISHED);
}

function refusal(code: EscalationContractCode): TransportError
{
	return { kind: 'contract', code };
}

/** The swap was given up because the decorator closed while it was running, not by its own outcome. */
function cancelled(): TransportError
{
	return { kind: 'cancelled' };
}

/**
 * The request of the swap, in the schema it is acquired under. The schema is the only field touched:
 * what kind of connection is needed comes from the initiator above, and nothing else is read into it.
 * The injected acquisition is the jwt one, so the two never disagree silently - a request of another
 * schema is refused by the acquisition as a broken contract.
 */
function asJwt(request: ConnectionRequest): ConnectionRequest
{
	return { ...request, scheme: CallScheme.Jwt };
}

/**
 * The listener of one plane, tied to the generation that plane was raised in. What it does with a
 * callback is decided by the generation alone: the plane that serves the media is forwarded, a plane the
 * media has left is dropped - a late remote track of the mesh after a swap, a quality report, a cycle of
 * recovery its own controller was still running reaches nobody - and a plane a swap is still raising is
 * held.
 *
 * Held rather than dropped, because an sfu starts taking remote media in the moment it joins the room,
 * long before the commit that makes it the plane of the call: dropping it would lose media no plane ever
 * reports again. What was held goes out in the order it arrived the moment that generation takes over,
 * and goes with the plane when the swap is lost instead.
 *
 * The voice of the generation is asked for rather than remembered, because a swap installs the new plane
 * and silences the previous one in one assignment: no guard has to be told about it afterwards. Letting
 * what was held out is the one thing a guard is told, since only the swap knows when its plane is the one
 * serving.
 */
class EpochGuardedListener implements MediaTransportListener
{
	#epoch: number;
	#voiceOf: (epoch: number) => PlaneVoice;
	#consumer: MediaTransportListener;
	#held: Array<(consumer: MediaTransportListener) => void> = [];

	constructor(epoch: number, voiceOf: (epoch: number) => PlaneVoice, consumer: MediaTransportListener)
	{
		this.#epoch = epoch;
		this.#voiceOf = voiceOf;
		this.#consumer = consumer;
	}

	onRemoteTrackAdded(participantId: ParticipantId, track: MediaStreamTrack): void
	{
		this.#tell((consumer) => consumer.onRemoteTrackAdded(participantId, track));
	}

	onRemoteTrackRemoved(participantId: ParticipantId, kind: MediaTrackKind): void
	{
		this.#tell((consumer) => consumer.onRemoteTrackRemoved(participantId, kind));
	}

	onRemoteTrackMuted(participantId: ParticipantId, kind: RemoteMuteKind, isMuted: boolean): void
	{
		this.#tell((consumer) => consumer.onRemoteTrackMuted(participantId, kind, isMuted));
	}

	onConnectionQualityChanged(participantId: ParticipantId, quality: Quality): void
	{
		this.#tell((consumer) => consumer.onConnectionQualityChanged(participantId, quality));
	}

	onReconnecting(): void
	{
		this.#tell((consumer) => consumer.onReconnecting());
	}

	onReconnected(): void
	{
		this.#tell((consumer) => consumer.onReconnected());
	}

	onFailure(error: TransportError): void
	{
		this.#tell((consumer) => consumer.onFailure(error));
	}

	onUnresolvedRemoteTrack(endpointId: MediaEndpointId, track: MediaStreamTrack): void
	{
		this.#tell((consumer) => consumer.onUnresolvedRemoteTrack(endpointId, track));
	}

	onUnresolvedRemoteTrackDropped(endpointId: MediaEndpointId, error: TransportError): void
	{
		this.#tell((consumer) => consumer.onUnresolvedRemoteTrackDropped(endpointId, error));
	}

	/**
	 * Lets out what was held while the plane was being raised, in the order it arrived, and answers how
	 * much of it reached the consumer. Every one of them takes the same route as a callback arriving now,
	 * so a consumer that closes the transport in the middle of it is told nothing after that - and the
	 * answer counts what was delivered rather than what waited, because the two part exactly there.
	 */
	release(): number
	{
		const held = this.#held;

		this.#held = [];

		return held.reduce((delivered, tell) => delivered + (this.#tell(tell) ? 1 : 0), 0);
	}

	/** The plane is let go: what it said while it was being raised is let go with it. */
	discard(): void
	{
		this.#held = [];
	}

	/** Whether the callback reached the consumer: a held one has not, and a dropped one never will. */
	#tell(deliver: (consumer: MediaTransportListener) => void): boolean
	{
		const voice = this.#voiceOf(this.#epoch);

		if (voice === PlaneVoice.Held)
		{
			this.#held.push(deliver);

			return false;
		}

		if (voice !== PlaneVoice.Heard)
		{
			return false;
		}

		deliver(this.#consumer);

		return true;
	}
}

/**
 * `MediaTransport` that can move the media from the mesh of a peer-to-peer call to an sfu without the
 * call noticing. It is a decorator and nothing more: every intent of the contract goes to the plane that
 * currently serves, so a consumer holds one transport for the whole session and never learns which plane
 * answered it.
 *
 * The swap is atomic. The mesh keeps carrying the media until the sfu has reached commit - connected, the
 * local tracks it was handed published, ready to take remote media in - and the assignment that installs
 * the sfu is the one that takes the mesh down, so there is never a moment with neither plane serving. A
 * commit that is not reached changes nothing: the mesh is still connected and still publishing, the plane
 * that failed is let go, and the failure comes back in the result of the escalation. There is no event
 * for it - an escalation has an initiator waiting for its answer, and the answer is not repeated.
 *
 * Intents are never held for a swap. A publish or an unpublish reaches the plane that serves the moment it
 * is stated, so muting a microphone in the middle of an escalation takes effect at once, and the decorator
 * writes down what each of them asked for. The commit carries over a snapshot of what those intents asked
 * for and the source still holds, which an intent stated after it was taken cannot be part of, so the plane
 * that took over is brought to what the caller last asked for right after it takes over: the intents are
 * compared with the surfaces the commit actually carried, and what is missing is published while what the
 * caller switched off is taken off. Only that reconciliation is serialized with the intents - one operation
 * of a plane rather than a whole escalation - and a surface it cannot settle is written down instead of
 * undoing a swap whose mesh is already gone.
 *
 * Leaving the call gives a swap up. `disconnect` is the intent of a side that is done with the call, so a
 * plane still being raised for it is let go where it stands and the escalation answers `Cancelled`: nothing
 * raised for a call nobody is in ever becomes the plane of it. A call left while the surfaces of a plane
 * that has already taken over are being settled answers the same, and there the media did move: the mesh is
 * gone by then, so what the answer states is that nobody is on the plane any more, not that it never came up.
 *
 * Late callbacks are cut off by generation. Each plane is raised with a listener of its own that forwards
 * only while its generation serves the media, so a mesh that answers after the swap - remote media, a
 * quality report, the failure of the recovery cycle it was running - reaches nobody. Stopping that cycle
 * is the business of the plane itself: the swap closes the mesh, and a plane closes what it owns.
 *
 * Early ones are held instead. The plane a swap is raising already takes remote media in before it has
 * committed, and that media is nothing any plane reports a second time, so it waits on its own listener
 * and goes out in arrival order the moment its generation takes over. A swap that is lost drops what it
 * held together with the plane, and the mesh, which never stopped serving, is heard throughout.
 *
 * A close is terminal and idempotent, and it is the same rule that carries it: no generation serves the
 * media any more, so a callback arriving after it - from the plane that was serving or from one a swap was
 * still raising - is cut off by the decorator itself rather than by the politeness of an implementation,
 * and nothing held for a plane that never took over goes out either. A swap that was in flight is given up
 * where it stands and answers `Cancelled` to whoever started it, whether its plane had taken over or not.
 * The intents are terminal with it: one stated after a close, and one that was waiting for a reconciliation
 * the close cut short, is refused rather than carried to a plane that is down - a success from a torn-down
 * transport would tell a caller its media is being sent when no plane is sending anything.
 *
 * One direction and one shot: mesh to sfu, and back is no part of it. The trigger of an escalation and
 * the agreement about it between the participants live above the transport - this performs the local swap
 * and decides nothing else. The tracks are not obtained again either; they are republished from the
 * source that owns them, which is what lets the same track survive the swap.
 */
export class EscalatableMediaTransport implements MediaTransport
{
	#createSfuTransport: SfuTransportFactory;
	#acquisition: ConnectionAcquisition;
	#localMedia: LocalTrackReader;
	#listener: MediaTransportListener;
	#logger: LoggerPort;
	#plane: Plane;
	/** What every surface must carry, as the intents of the caller stated it; see `IntendedTrack`. */
	#intended: Map<LocalMediaKind, IntendedTrack> = new Map();
	/** The reconciliation of the plane that just took over, while it is running; the intents wait on it. */
	#reconciliation: Promise<void> | undefined = undefined;
	#epoch: number = MESH_EPOCH;
	#isSwapping: boolean = false;
	#isSwapCancelled: boolean = false;
	#hasEscalated: boolean = false;
	#closed: boolean = false;

	constructor(options: EscalatableMediaTransportOptions)
	{
		this.#createSfuTransport = options.createSfuTransport;
		this.#acquisition = options.acquisition;
		this.#localMedia = options.localMedia;
		this.#listener = options.listener;
		this.#logger = options.logger;
		this.#plane = {
			transport: options.createMeshTransport(this.#guard(MESH_EPOCH)),
			epoch: MESH_EPOCH,
		};
	}

	connect(descriptor: ConnectionDescriptor): Promise<Result<void, TransportError>>
	{
		return this.#apply((plane) => plane.connect(descriptor));
	}

	/**
	 * Leaves the call on the plane that serves, and gives up a swap that is still raising one. The intent
	 * itself is the signal, taken where it is stated rather than once a plane has answered it, so a plane
	 * being raised for a call that is being left cannot commit into it in the meantime.
	 */
	disconnect(): Promise<Result<void, TransportError>>
	{
		if (this.#isSwapping)
		{
			this.#isSwapCancelled = true;
		}

		return this.#apply((plane) => plane.disconnect());
	}

	publishAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Microphone, track);
	}

	unpublishAudio(): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Microphone, UNPUBLISHED);
	}

	publishVideo(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Camera, track);
	}

	unpublishVideo(): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Camera, UNPUBLISHED);
	}

	publishScreen(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Screen, track);
	}

	unpublishScreen(): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.Screen, UNPUBLISHED);
	}

	publishScreenAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.ScreenAudio, track);
	}

	unpublishScreenAudio(): Promise<Result<void, TransportError>>
	{
		return this.#stateSurface(LocalMediaKind.ScreenAudio, UNPUBLISHED);
	}

	setRemoteQuality(participantId: ParticipantId, quality: Quality): Promise<Result<void, TransportError>>
	{
		return this.#apply((plane) => plane.setRemoteQuality(participantId, quality));
	}

	/**
	 * Moves the media to an sfu: the connection is acquired again, as jwt, and the plane raised on it takes
	 * over only once it has committed. Everything the swap can lose - the connection it could not obtain,
	 * the plane that would not connect or would not carry a track - answers here, and the mesh goes on
	 * serving in every one of those cases; a repeat is possible and is decided above. A `disconnect` stated
	 * while this runs gives it up the same way, and answers `Cancelled` - including when the step it was
	 * running failed meanwhile, since a call that is over is not one to recover.
	 *
	 * Refused without touching anything when there is nothing to swap: after a swap has already happened
	 * (the way back is out of scope), while one is running, and after the decorator was closed.
	 */
	async escalate(request: ConnectionRequest): Promise<Result<void, TransportError>>
	{
		if (this.#closed)
		{
			return err(refusal(EscalationContractCode.Closed));
		}

		if (this.#hasEscalated)
		{
			return err(refusal(EscalationContractCode.AlreadyEscalated));
		}

		if (this.#isSwapping)
		{
			return err(refusal(EscalationContractCode.AlreadyRunning));
		}

		this.#isSwapping = true;
		this.#isSwapCancelled = false;

		try
		{
			return await this.#swapToSfu(request);
		}
		finally
		{
			this.#isSwapping = false;
		}
	}

	/**
	 * Takes the plane that serves the media down and silences every generation with it: a callback that
	 * arrives afterwards reaches nobody, and a swap still in flight is given up with `Cancelled`. A second
	 * call does nothing. The local tracks stay alive - their owner is the source above, and no plane ever
	 * owned them.
	 */
	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#plane.transport.close();
	}

	async #swapToSfu(request: ConnectionRequest): Promise<Result<void, TransportError>>
	{
		this.#epoch += 1;

		const epoch = this.#epoch;

		this.#logger.log(SWAP_STARTED, { epoch });

		const acquired = await this.#acquisition.acquire(asJwt(request));

		if (isErr(acquired))
		{
			return this.#givenUpOr(SwapStage.Acquisition, epoch, acquired.error);
		}

		// ready to take remote media by construction: the plane is raised with its listener, which holds
		// whatever arrives until this generation serves, so nothing of it is lost before the commit
		const guard = this.#guard(epoch);
		const sfu = this.#createSfuTransport(acquired.value, guard);
		const commit = await this.#reachCommit(sfu, acquired.value, epoch);

		if (isErr(commit))
		{
			// the mesh was never touched; the plane that did not commit is the one that goes
			sfu.close();
			guard.discard();

			return commit;
		}

		if (this.#isSwapGivenUp())
		{
			sfu.close();
			guard.discard();

			return this.#abandoned(epoch);
		}

		const previous = this.#plane;

		// one assignment installs the sfu and silences the generation of the mesh
		this.#plane = { transport: sfu, epoch };
		this.#hasEscalated = true;

		// the mesh goes down only now, and it is its own close that ends the recovery cycle it ran
		previous.transport.close();

		this.#logger.log(SWAP_COMMITTED, { epoch, surfaces: commit.value.map((surface) => surface.kind) });

		// under way from here, so what the delivery below asks of the plane - and what a caller asks of it
		// meanwhile - waits for the surfaces of the caller to be settled on it first
		const reconciled = this.#reconcile(sfu, commit.value, epoch);

		this.#deliverHeld(guard, epoch);

		await reconciled;

		// the call may have ended while the surfaces were being settled: the media did move, and there is
		// nobody left on it, so the initiator hears the cancellation rather than a success
		if (this.#isSwapGivenUp())
		{
			return this.#abandonedAfterCommit(epoch);
		}

		return ok(undefined);
	}

	/**
	 * Raises the sfu to commit: the connection first, then every surface the caller has published and the
	 * source still holds, republished from the source instead of obtained again. The first step that fails
	 * ends it - a plane carrying half of the media is not one the media can be moved to. What it carried over
	 * is answered, because that is what the intents of the caller are reconciled against once the plane takes
	 * over.
	 *
	 * A call given up while a step was in flight ends it as well, before the next one is taken - a decorator
	 * that closed, or a side that left the call: nothing is connected and no local media is published for a
	 * call that is already over. A step that failed while the call was being given up answers the
	 * cancellation and not its own failure: the two happened at once, and a caller told the failure of the
	 * step would repeat or recover a call that has already ended.
	 */
	async #reachCommit(
		sfu: MediaTransport,
		descriptor: ConnectionDescriptor,
		epoch: number,
	): Promise<Result<HeldSurface[], TransportError>>
	{
		if (this.#isSwapGivenUp())
		{
			return this.#abandoned(epoch);
		}

		const connected = await sfu.connect(descriptor);

		if (isErr(connected))
		{
			return this.#givenUpOr(SwapStage.Connect, epoch, connected.error);
		}

		const held = this.#heldSurfaces();

		for (const surface of held)
		{
			if (this.#isSwapGivenUp())
			{
				return this.#abandoned(epoch);
			}

			const published = await SURFACE_INTENTS[surface.kind].publish(sfu, surface.track);

			if (isErr(published))
			{
				return this.#givenUpOr(SwapStage.Publish, epoch, published.error, { surface: surface.kind });
			}
		}

		return ok(held);
	}

	/**
	 * States what a surface must carry from now on, and puts that on the plane that serves. What the caller
	 * asked for is written down where it was asked rather than once a plane has answered: it is the intent a
	 * swap has to reproduce, and a plane that refused it does not make the caller mean something else.
	 */
	#stateSurface(kind: LocalMediaKind, track: IntendedTrack): Promise<Result<void, TransportError>>
	{
		this.#intended.set(kind, track);

		const intents = SURFACE_INTENTS[kind];

		return this.#apply((plane) => {
			return track === UNPUBLISHED ? intents.unpublish(plane) : intents.publish(plane, track);
		});
	}

	/**
	 * Puts an intent on the plane that serves. A reconciliation in flight is the one thing it ever waits
	 * for, and that is a single operation of a plane rather than a whole escalation: everything a swap does
	 * before its plane takes over - acquiring the connection, connecting the plane, carrying the local media
	 * over - leaves the intents of the caller going straight to the plane that is still serving.
	 */
	#apply(
		intent: (plane: MediaTransport) => Promise<Result<void, TransportError>>,
	): Promise<Result<void, TransportError>>
	{
		const reconciliation = this.#reconciliation;

		if (reconciliation === undefined)
		{
			return this.#takeToPlane(intent);
		}

		return reconciliation.then(() => this.#takeToPlane(intent));
	}

	/**
	 * Takes an intent to the plane that serves unless the decorator is closed by the time it gets there. A
	 * close is terminal for the intents as well: the plane it names is gone, so an intent stated after it -
	 * or one that waited for a reconciliation the close cut short - is refused instead of being carried to a
	 * plane that is down, where its outcome would say nothing about the media.
	 */
	#takeToPlane(
		intent: (plane: MediaTransport) => Promise<Result<void, TransportError>>,
	): Promise<Result<void, TransportError>>
	{
		if (this.#closed)
		{
			return Promise.resolve(err(refusal(EscalationContractCode.Closed)));
		}

		return intent(this.#plane.transport);
	}

	/**
	 * Brings the plane that just took over to what the caller last asked for, and holds the intents back
	 * while it does. The surfaces it starts from are the ones the commit carried over: a snapshot of the
	 * source taken before the plane took over, which an intent stated after it cannot be part of.
	 */
	#reconcile(sfu: MediaTransport, carried: HeldSurface[], epoch: number): Promise<void>
	{
		const settled = this.#settleSurfaces(sfu, carried, epoch);

		this.#reconciliation = settled;

		return settled.finally(() => {
			this.#reconciliation = undefined;
		});
	}

	/**
	 * The difference between what the caller asked for and what the commit carried over, surface by surface:
	 * what is missing is published, what the caller switched off is taken off, and a surface no intent ever
	 * named is left exactly as the commit left it - the caller stated nothing about it to reproduce.
	 *
	 * Every intent stated before this started is part of it, since the intents are read once here and the
	 * ones arriving meanwhile wait for it. A surface that will not settle is written down and the rest are
	 * settled anyway: the mesh is gone by now, so there is nothing a swap could be rolled back to.
	 */
	async #settleSurfaces(sfu: MediaTransport, carried: HeldSurface[], epoch: number): Promise<void>
	{
		const intended = new Map(this.#intended);
		const published = new Map(carried.map((surface) => [surface.kind, surface.track] as const));

		for (const kind of SURFACES)
		{
			if (this.#closed)
			{
				return;
			}

			const intent = intended.get(kind);

			if (intent === undefined || alreadyCarried(intent, published.get(kind)))
			{
				continue;
			}

			const intents = SURFACE_INTENTS[kind];
			const settled = intent === UNPUBLISHED
				? await intents.unpublish(sfu)
				: await intents.publish(sfu, intent);

			if (isErr(settled))
			{
				this.#logger.error(SURFACE_UNSETTLED, { epoch, surface: kind, kind: settled.error.kind });
			}
		}
	}

	/**
	 * The surfaces the caller has published and the source still holds, in the order the swap republishes
	 * them. Both halves are asked for: the source keeps a track of its own for a local preview and after an
	 * unpublish just as well, and one of those carried over would send local media nobody asked to send.
	 * The presence of the track is asked for first, since a surface the source holds nothing for must not
	 * come out equal to a surface no intent has ever named.
	 *
	 * The state of the track is read as well and not only its presence: one that ended without the event
	 * reaching the source is held like any other, and republishing it would carry silence to the new plane.
	 */
	#heldSurfaces(): HeldSurface[]
	{
		return SURFACES
			.map((kind) => ({ kind, track: this.#localMedia.getTrack(kind) }))
			.filter((surface): surface is HeldSurface => {
				return surface.track !== undefined
					&& this.#intended.get(surface.kind) === surface.track
					&& surface.track.readyState !== 'ended';
			});
	}

	/** The listener of a plane of that generation; it holds or drops while another generation serves. */
	#guard(epoch: number): EpochGuardedListener
	{
		return new EpochGuardedListener(epoch, (planeEpoch) => this.#voiceOf(planeEpoch), this.#listener);
	}

	/**
	 * How a plane of that generation is heard right now. Generations only grow, so one above the plane
	 * that serves is a plane a swap is still raising and one below it is a plane the media has left. A
	 * closed decorator leaves no generation to serve, which is what drops every plane at once.
	 */
	#voiceOf(epoch: number): PlaneVoice
	{
		if (this.#closed)
		{
			return PlaneVoice.Dropped;
		}

		if (epoch === this.#plane.epoch)
		{
			return PlaneVoice.Heard;
		}

		return epoch > this.#plane.epoch ? PlaneVoice.Held : PlaneVoice.Dropped;
	}

	/** Lets out what the plane reported before it took over, and writes down how much of it was heard. */
	#deliverHeld(guard: EpochGuardedListener, epoch: number): void
	{
		const delivered = guard.release();

		if (delivered > 0)
		{
			this.#logger.log(SWAP_HELD_DELIVERED, { epoch, events: delivered });
		}
	}

	/**
	 * Whether the swap has nothing left to move the media to: the decorator was closed, or the call was left
	 * through a `disconnect` while the plane was still being raised. Asked between the steps of a swap, so
	 * nothing is raised, published or installed for a call that is already over.
	 */
	#isSwapGivenUp(): boolean
	{
		return this.#closed || this.#isSwapCancelled;
	}

	/** Writes down a swap that was given up rather than lost, and answers the cancellation of it. */
	#abandoned(epoch: number): Err<TransportError>
	{
		return this.#lost(this.#givenUpStage(), epoch, cancelled());
	}

	/**
	 * The answer to a step that failed, with a swap given up meanwhile taking precedence over it: a call
	 * that was left or closed while the step was in flight is over whichever way the step went, and a
	 * caller reading the failure of the step instead would repeat or recover a call that has ended.
	 */
	#givenUpOr(
		stage: SwapStage,
		epoch: number,
		error: TransportError,
		details?: LogDetails,
	): Err<TransportError>
	{
		return this.#isSwapGivenUp() ? this.#abandoned(epoch) : this.#lost(stage, epoch, error, details);
	}

	/**
	 * The same cancellation for a swap whose plane had already taken over when the call was left or closed.
	 * Written down as what it is rather than as a swap that was lost: the media did move to the sfu, the mesh
	 * is gone, and only the answer to the initiator is a cancellation.
	 */
	#abandonedAfterCommit(epoch: number): Err<TransportError>
	{
		const error = cancelled();

		this.#logger.error(SWAP_ABANDONED, { epoch, stage: this.#givenUpStage(), kind: error.kind });

		return err(error);
	}

	/** Which of the two ways a swap was given up, as the metadata of its entry names it. */
	#givenUpStage(): SwapStage
	{
		return this.#closed ? SwapStage.Closed : SwapStage.Disconnected;
	}

	/** Writes down a swap that was lost and answers with the failure of the step that lost it. */
	#lost(
		stage: SwapStage,
		epoch: number,
		error: TransportError,
		details?: LogDetails,
	): Err<TransportError>
	{
		this.#logger.error(SWAP_LOST, { epoch, stage, kind: error.kind, ...details });

		return err(error);
	}
}
