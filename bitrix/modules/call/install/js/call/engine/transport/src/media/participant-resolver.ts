import type { MediaEndpointId, ParticipantId, ParticipantResolver } from '../domain/participant';
import type { ContractError } from '../error/transport-error';
import type { LoggerPort } from '../port/logger-port';
import type { MediaTransportListener } from './media-transport';

/**
 * Codes a resolution puts on a refusal of its own. There is one: the mapping of an endpoint whose media
 * was already held is not coming, so the media is let go. A code rather than a message, because the
 * consumer tells this refusal apart by the discriminant and never by prose.
 */
export const RemoteMediaContractCode: {
	readonly EndpointUnresolvable: 'remote_media.endpoint_unresolvable',
} = Object.freeze({
	EndpointUnresolvable: 'remote_media.endpoint_unresolvable',
});

export type RemoteMediaContractCode = typeof RemoteMediaContractCode[keyof typeof RemoteMediaContractCode];

/**
 * What a change of the endpoint mapping is announced as. The announcement exists because the mapping and
 * the media that waits for it arrive on different routes: whoever holds remote media has to be told the
 * moment the mapping does arrive, and told just as plainly that it will not.
 */
export interface MediaEndpointResolutionListener
{
	/** The endpoint names that participant from now on: what waited for it can be delivered. */
	onMediaEndpointResolved(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void;

	/** Whatever waits for that endpoint is not going to be resolved - the mapping is not coming. */
	onMediaEndpointUnresolvable(mediaEndpointId: MediaEndpointId): void;
}

/**
 * The resolver as the side waiting for a mapping sees it: the contract of the domain plus the
 * announcement of a change to it. Kept apart from `ParticipantResolver` on purpose - a router of the
 * incoming channel only ever asks, and gains nothing from being able to subscribe.
 */
export interface MediaEndpointResolutionSource extends ParticipantResolver
{
	/** Returns the way to let the subscription go; announcements stop at once after it. */
	subscribeResolution(listener: MediaEndpointResolutionListener): () => void;
}

/**
 * Canonical ids of the session as the layer above states them, and nothing this class works out on its
 * own. It answers what it was told and `null` for everything else, which is what keeps a native id of a
 * plane from being taken for a participant.
 *
 * Two routes lead in, because the two native vocabularies are told apart by their source rather than by
 * their shape. A sender is the origin of a message on the incoming channel, and in the current Bitrix
 * contract the canonical id and that native id are the same value - the user id; the roster is what makes
 * it a participant at all, so a sender the roster does not name resolves to nothing instead of to itself.
 * A media endpoint is the source of one stream of media, opaque and never derived from: it resolves only
 * through the mapping the layer above hands over, and one participant may own several of them - a second
 * device, another shard of an SFU - which is exactly what a canonical id must not be asked to express.
 *
 * That is also what makes the canonical id survive an escalation by construction rather than by luck:
 * the mesh and the SFU map their own ids onto this one source, so the participant a consumer sees is the
 * same before and after the media moved between the planes.
 */
export class RosterParticipantResolver implements MediaEndpointResolutionSource
{
	#roster: Set<ParticipantId> = new Set();
	#mediaEndpoints: Map<MediaEndpointId, ParticipantId> = new Map();
	#subscribers: Set<MediaEndpointResolutionListener> = new Set();

	resolveSender(senderId: string): ParticipantId | null
	{
		return this.#roster.has(senderId) ? senderId : null;
	}

	resolveMediaEndpoint(mediaEndpointId: MediaEndpointId): ParticipantId | null
	{
		return this.#mediaEndpoints.get(mediaEndpointId) ?? null;
	}

	/**
	 * The participants of the session as the roster above states them. A later call replaces the set
	 * whole: the roster is owned there, and a copy kept here would only be another version of it.
	 */
	setRoster(participants: readonly ParticipantId[]): void
	{
		this.#roster = new Set(participants);
	}

	/** The endpoint belongs to that participant. Announced, so held media of it can go on its way. */
	mapMediaEndpoint(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void
	{
		this.#mediaEndpoints.set(mediaEndpointId, participantId);
		this.#announce((subscriber) => subscriber.onMediaEndpointResolved(mediaEndpointId, participantId));
	}

	/**
	 * The mapping of that endpoint is not coming - the side it belonged to is gone, or the roster above
	 * knows of no owner for it. It is a statement about the media that waits right now, not a verdict
	 * for good: a mapping handed over later is accepted like any other.
	 */
	dropMediaEndpoint(mediaEndpointId: MediaEndpointId): void
	{
		this.#mediaEndpoints.delete(mediaEndpointId);
		this.#announce((subscriber) => subscriber.onMediaEndpointUnresolvable(mediaEndpointId));
	}

	subscribeResolution(listener: MediaEndpointResolutionListener): () => void
	{
		this.#subscribers.add(listener);

		return () => {
			this.#subscribers.delete(listener);
		};
	}

	/** Over a copy: a subscriber letting its subscription go while being told does not skip the next one. */
	#announce(tell: (subscriber: MediaEndpointResolutionListener) => void): void
	{
		[...this.#subscribers].forEach(tell);
	}
}

export type RemoteMediaResolutionOptions = {
	/** The canonical ids of the session; this resolution asks it and never maps anything itself. */
	participants: MediaEndpointResolutionSource,
	/**
	 * The listener of the plane this resolution belongs to - the very one that plane was raised with, so
	 * media released here is heard exactly when media the plane reports directly is.
	 */
	listener: MediaTransportListener,
	logger: LoggerPort,
};

const MEDIA_HELD = 'participant resolution: remote media is held until its endpoint is mapped';
const MEDIA_RELEASED = 'participant resolution: the mapping arrived and the held remote media went on';
const MEDIA_REFUSED = 'participant resolution: the endpoint of held remote media will not be mapped';

function unresolvable(): ContractError
{
	return { kind: 'contract', code: RemoteMediaContractCode.EndpointUnresolvable };
}

/**
 * The way remote media of one media plane reaches a consumer: named by the participant that owns it, or
 * held until it can be. It exists because the two arrive independently - an SFU starts sending the media
 * of an endpoint before the layer above has said whose endpoint it is - and neither guessing an owner nor
 * dropping the media is an answer to that.
 *
 * So media of an endpoint with no mapping is kept, and the consumer is told that it is: it learns that
 * media exists without being told a participant nobody knows. The mapping that arrives afterwards lets
 * everything held for that endpoint out at once, in the order it came in, as the very tracks that were
 * received. A mapping that is not coming refuses them instead - one typed refusal per endpoint, whatever
 * it was holding.
 *
 * One of these belongs to one plane. That is what keeps the media it releases under the same rules as the
 * media the plane reports itself: the listener it is given is the plane's own, so a plane that is not
 * serving the media stays unheard through this route as well as through the direct one.
 *
 * Nothing of the endpoint itself is ever written down. The opaque id travels to the consumer, which is
 * what the contract of the events is for, but a log entry carries only how much media was involved -
 * an entry is the one place a raw id of a shard could outlive the connection it belonged to.
 */
export class RemoteMediaResolution implements MediaEndpointResolutionListener
{
	#participants: MediaEndpointResolutionSource;
	#listener: MediaTransportListener;
	#logger: LoggerPort;
	#held: Map<MediaEndpointId, MediaStreamTrack[]> = new Map();
	#unsubscribe: (() => void) | undefined;
	#closed: boolean = false;

	constructor(options: RemoteMediaResolutionOptions)
	{
		this.#participants = options.participants;
		this.#listener = options.listener;
		this.#logger = options.logger;
		this.#unsubscribe = options.participants.subscribeResolution(this);
	}

	/**
	 * Remote media the plane received, handed over by the endpoint it came from. It reaches the consumer
	 * named by its participant when the mapping is already there, and is held when it is not.
	 */
	takeRemoteTrack(mediaEndpointId: MediaEndpointId, track: MediaStreamTrack): void
	{
		if (this.#closed)
		{
			return;
		}

		const participantId = this.#participants.resolveMediaEndpoint(mediaEndpointId);

		if (participantId === null)
		{
			this.#hold(mediaEndpointId, track);

			return;
		}

		this.#listener.onRemoteTrackAdded(participantId, track);
	}

	onMediaEndpointResolved(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void
	{
		const released = this.#letGo(mediaEndpointId);

		if (released.length === 0)
		{
			return;
		}

		this.#logger.log(MEDIA_RELEASED, { tracks: released.length });
		released.forEach((track) => this.#listener.onRemoteTrackAdded(participantId, track));
	}

	onMediaEndpointUnresolvable(mediaEndpointId: MediaEndpointId): void
	{
		const refused = this.#letGo(mediaEndpointId);

		if (refused.length === 0)
		{
			return;
		}

		this.#logger.error(MEDIA_REFUSED, { tracks: refused.length });
		this.#listener.onUnresolvedRemoteTrackDropped(mediaEndpointId, unresolvable());
	}

	/**
	 * Terminal and idempotent: the subscription is let go and the media that was waiting is dropped
	 * without a word. The tracks are not stopped - a plane never owned them.
	 */
	close(): void
	{
		this.#closed = true;
		this.#unsubscribe?.();
		this.#unsubscribe = undefined;
		this.#held.clear();
	}

	#hold(mediaEndpointId: MediaEndpointId, track: MediaStreamTrack): void
	{
		const held = this.#held.get(mediaEndpointId) ?? [];

		held.push(track);
		this.#held.set(mediaEndpointId, held);

		this.#logger.warn(MEDIA_HELD, { tracks: held.length });
		this.#listener.onUnresolvedRemoteTrack(mediaEndpointId, track);
	}

	/** What was held for that endpoint, in arrival order, and the endpoint holds nothing afterwards. */
	#letGo(mediaEndpointId: MediaEndpointId): MediaStreamTrack[]
	{
		// closed: nothing waits any more, and an announcement reaching this listener anyway reports nothing
		if (this.#closed)
		{
			return [];
		}

		const held = this.#held.get(mediaEndpointId) ?? [];

		this.#held.delete(mediaEndpointId);

		return held;
	}
}
