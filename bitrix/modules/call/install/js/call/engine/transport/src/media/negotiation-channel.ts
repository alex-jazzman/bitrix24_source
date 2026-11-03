import type { ParticipantId } from '../domain/participant';
import type { ClockPort } from '../port/clock-port';
import { isWireRecord } from '../port/envelope-readers';
import type { LoggerPort } from '../port/logger-port';
import type { PullPayload, PullPort, PullSignal } from '../port/pull-port';
import type { NegotiationListener } from '../signaling/pull-dispatcher';

/** Signals of mesh negotiation, bare: the pull module and the prefix of the channel live in the port. */
const SIGNALS: { [intent: string]: PullSignal } = {
	negotiationNeeded: 'negotiationNeeded',
	offer: 'connectionOffer',
	answer: 'connectionAnswer',
	iceCandidates: 'iceCandidate',
};

/** How long candidates are collected before one batch goes out; the window of the legacy engine. */
const ICE_BATCH_DEBOUNCE_MS = 500;

const NOTHING_TO_APPLY = 'negotiation channel: an incoming message carries nothing to apply';
const ANOTHER_CONNECTION = 'negotiation channel: an incoming message names another connection';
const CANDIDATES_DISCARDED = 'negotiation channel: candidates of a replaced connection are discarded';

/**
 * Client-side id of one mesh connection, minted by the side that offers it. Opaque: the channel
 * compares it and never parses it, so what it is made of stays the business of whoever mints it.
 */
export type ConnectionId = string;

/**
 * Transceiver mids of the surfaces one side sends, which is how the peer tells the incoming tracks
 * apart. `null` where the surface is not being sent. This is the vocabulary of the wire and not of
 * the local media source: a mid exists only inside a connection, and the source knows no connection.
 *
 * `sharingAudio` is the audio of the shared screen - `MediaTrackKind.ScreenAudio` in the currency of
 * the plane - and is what keeps it apart from the microphone on `audio`.
 */
export type NegotiationTracks = {
	audio: string | null,
	video: string | null,
	screen: string | null,
	sharingAudio: string | null,
};

/** A session description of one connection and the tracks it carries - an offer and an answer alike. */
export type NegotiationDescription = {
	connectionId: ConnectionId,
	sdp: string,
	tracks: NegotiationTracks,
};

/**
 * An offer that arrived, with the outcome of comparing its connection against the one in flight
 * already decided. That comparison is the asymmetric half of renegotiation: an offer wins over the
 * connection it finds, while an answer or a candidate naming another connection loses and is dropped.
 */
export type IncomingOffer = {
	connectionId: ConnectionId,
	sdp: string,
	tracks: NegotiationTracks,
	/**
	 * The connection this offer displaces, to be destroyed and built anew for `connectionId`. `null`
	 * when the offer starts the first connection of that side or repeats the one already in flight,
	 * and then nothing is destroyed.
	 */
	supersededConnectionId: ConnectionId | null,
};

/** Candidates of one connection, in either direction: the wire carries them in batches. */
export type NegotiationIceBatch = {
	connectionId: ConnectionId,
	candidates: RTCIceCandidateInit[],
};

/** A round of negotiation asked for; `isRestart` says the connection is to be rebuilt, not adjusted. */
export type NegotiationNeededArgs = {
	isRestart?: boolean,
};

/**
 * Incoming mesh negotiation, in the form a media transport acts on: the ids resolved, the payload
 * parsed and the stale messages already gone. What reaches it is what a connection can be built from.
 */
export interface NegotiationChannelListener
{
	onNegotiationNeeded(from: ParticipantId, isRestart: boolean): void;

	onConnectionOffer(from: ParticipantId, offer: IncomingOffer): void;

	onConnectionAnswer(from: ParticipantId, answer: NegotiationDescription): void;

	/** Plural where the signal of the wire is singular: a message carries the whole batch. */
	onIceCandidates(from: ParticipantId, batch: NegotiationIceBatch): void;
}

export type NegotiationChannelOptions = {
	pull: PullPort,
	clock: ClockPort,
	/** Incoming negotiation, transport -> consumer: what this class relays and never produces itself. */
	listener: NegotiationChannelListener,
	logger: LoggerPort,
	/**
	 * User agent of this client, as the peer reads it to adapt to the browser on the other side. An
	 * injected value rather than a global read here: the channel touches no platform of its own.
	 */
	userAgent: string,
};

/** Candidates waiting for their batch, and the connection they were gathered for. */
type PendingIceBatch = {
	connectionId: ConnectionId,
	candidates: RTCIceCandidateInit[],
	cancelDebounce: (() => void) | undefined,
};

/**
 * Ids and descriptions are strings on this wire; anything else counts as absent. Named apart from the
 * text reader of acquisition on purpose: an empty string is a value here and absence there, and one
 * name over two rules is how the two get confused.
 */
function readWireText(value: unknown): string | undefined
{
	return typeof value === 'string' ? value : undefined;
}

/** A mid is a string; anything else states that the surface is not being sent. */
function readMid(value: unknown): string | null
{
	return typeof value === 'string' ? value : null;
}

function readTracks(value: unknown): NegotiationTracks
{
	const tracks: PullPayload = isWireRecord(value) ? value : {};

	return {
		audio: readMid(tracks.audio),
		video: readMid(tracks.video),
		screen: readMid(tracks.screen),
		sharingAudio: readMid(tracks.sharingAudio),
	};
}

/** A description without a connection or without an sdp is nothing a connection can be built from. */
function readDescription(payload: PullPayload): NegotiationDescription | undefined
{
	const connectionId = readWireText(payload.connectionId);
	const sdp = readWireText(payload.sdp);

	if (connectionId === undefined || sdp === undefined)
	{
		return undefined;
	}

	return { connectionId, sdp, tracks: readTracks(payload.tracks) };
}

/** The entries of a batch; anything that is not a list of records carries no candidate to apply. */
function readCandidates(value: unknown): RTCIceCandidateInit[]
{
	if (!Array.isArray(value))
	{
		return [];
	}

	return value.filter((entry): entry is RTCIceCandidateInit => isWireRecord(entry));
}

/**
 * The mesh negotiation channel: offer, answer and ICE of a peer-to-peer connection over `PullPort`,
 * apart from the presence signaling that travels the same channel. Sdp and candidates are the
 * vocabulary of this file and of nowhere else - a media transport states an intent and reads a
 * decided event, and no layer above the transport ever sees either.
 *
 * Beyond encoding the wire it owns one fact: which connection of each side is in flight. An offer
 * sets it, in both directions, and everything else is compared against it - which is where the
 * asymmetry of renegotiation lives. An offer naming another connection displaces the one it finds,
 * because the side that offers has already built it and no answer of ours would reach the connection
 * it replaced; an answer or a candidate naming another connection is late instead, so it is dropped
 * rather than applied to a connection it was not meant for.
 *
 * Candidates are batched: a send collects them and one command goes out once they stop arriving, so
 * a burst of gathering becomes a message instead of a dozen. `close` cancels that batch and drops
 * what it held, which is what keeps a candidate of a finished call off the wire.
 *
 * The channel exists on the classic path, where negotiation genuinely travels pull; a schema whose
 * media plane relays it over its own connection has no channel of this kind, and neither has an SFU.
 *
 * Every intent goes to pull and asks no permission of it first, unlike the presence intents beside it:
 * a mesh is raised only where this client may publish, and that is settled above the transport, before
 * a channel of this kind is built at all. The negotiation of a mesh travels pull alone - there is no
 * second carrier for an sdp here - so a mesh chosen for a client that cannot publish is an error of
 * whoever assembled the planes, not a case for this channel to fall back from.
 */
export class NegotiationChannel implements NegotiationListener
{
	#pull: PullPort;
	#clock: ClockPort;
	#listener: NegotiationChannelListener;
	#logger: LoggerPort;
	#userAgent: string;
	#connections: Map<ParticipantId, ConnectionId> = new Map();
	#iceBatches: Map<ParticipantId, PendingIceBatch> = new Map();
	#closed: boolean = false;

	constructor(options: NegotiationChannelOptions)
	{
		this.#pull = options.pull;
		this.#clock = options.clock;
		this.#listener = options.listener;
		this.#logger = options.logger;
		this.#userAgent = options.userAgent;
	}

	/**
	 * Asks the other side for a round of negotiation. It carries no connection: the side that offers
	 * mints the id, and this intent is sent by the side that does not offer.
	 */
	sendNegotiationNeeded(to: ParticipantId, negotiation: NegotiationNeededArgs = {}): void
	{
		if (this.#closed)
		{
			return;
		}

		// the flag travels only when it is set - its absence is what the contract states as "no restart"
		this.#publish(to, SIGNALS.negotiationNeeded, negotiation.isRestart === true ? { restart: true } : {});
	}

	/**
	 * Offer of this side, and the point at which its connection becomes the one in flight: the offerer
	 * mints the id, so from here on an answer or a candidate naming another connection is stale.
	 */
	sendOffer(to: ParticipantId, offer: NegotiationDescription): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#connections.set(to, offer.connectionId);
		this.#publish(to, SIGNALS.offer, this.#describe(offer));
	}

	/** Answer of this side. The connection in flight was settled by the offer it answers. */
	sendAnswer(to: ParticipantId, answer: NegotiationDescription): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#publish(to, SIGNALS.answer, this.#describe(answer));
	}

	/**
	 * Adds candidates to the batch of that side and starts the window over: the batch goes out once
	 * they stop arriving, so gathering that trickles in over a few hundred milliseconds becomes one
	 * command. Candidates of a connection that is no longer the one being gathered for replace the
	 * batch instead of joining it - the peer would drop a mixed one as stale anyway.
	 */
	sendIceCandidates(to: ParticipantId, batch: NegotiationIceBatch): void
	{
		if (this.#closed || batch.candidates.length === 0)
		{
			return;
		}

		const pending = this.#batchFor(to, batch.connectionId);

		pending.candidates.push(...batch.candidates);
		pending.cancelDebounce?.();
		pending.cancelDebounce = this.#clock.scheduleOnce(() => this.#flush(to), ICE_BATCH_DEBOUNCE_MS);
	}

	/**
	 * Idempotent. Cancels every ICE batch still waiting and drops what it gathered, so no candidate
	 * of a finished call reaches the wire after it. Nothing is sent and nothing is delivered to the
	 * listener afterwards: the connections this channel spoke for are gone with the call.
	 */
	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#iceBatches.forEach((pending) => pending.cancelDebounce?.());
		this.#iceBatches.clear();
		this.#connections.clear();
	}

	onNegotiationNeeded(from: ParticipantId, payload: PullPayload): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#listener.onNegotiationNeeded(from, payload.restart === true);
	}

	/**
	 * An offer decides the connection of that side rather than being checked against it, so a
	 * renegotiation is carried through instead of being dropped: the consumer is told which connection
	 * the offer displaces and the new one is in flight from here on.
	 */
	onConnectionOffer(from: ParticipantId, payload: PullPayload): void
	{
		if (this.#closed)
		{
			return;
		}

		const offer = this.#read(SIGNALS.offer, payload);

		if (offer === undefined)
		{
			return;
		}

		const inFlight = this.#connections.get(from);
		const superseded = inFlight === undefined || inFlight === offer.connectionId ? null : inFlight;

		this.#connections.set(from, offer.connectionId);

		if (superseded !== null)
		{
			// the candidates gathered for a connection about to be destroyed have nowhere to arrive
			this.#discardBatch(from, superseded);
		}

		this.#listener.onConnectionOffer(from, { ...offer, supersededConnectionId: superseded });
	}

	/** Late answers are dropped: applying one to the connection that replaced its own would break it. */
	onConnectionAnswer(from: ParticipantId, payload: PullPayload): void
	{
		if (this.#closed)
		{
			return;
		}

		const answer = this.#read(SIGNALS.answer, payload);

		if (answer === undefined || !this.#isInFlight(SIGNALS.answer, from, answer.connectionId))
		{
			return;
		}

		this.#listener.onConnectionAnswer(from, answer);
	}

	/** Dropped on the same terms as a late answer: a candidate belongs to one connection only. */
	onIceCandidate(from: ParticipantId, payload: PullPayload): void
	{
		if (this.#closed)
		{
			return;
		}

		const connectionId = readWireText(payload.connectionId);
		const candidates = readCandidates(payload.candidates);

		if (connectionId === undefined || candidates.length === 0)
		{
			this.#logger.warn(NOTHING_TO_APPLY, { signal: SIGNALS.iceCandidates });

			return;
		}

		if (!this.#isInFlight(SIGNALS.iceCandidates, from, connectionId))
		{
			return;
		}

		this.#listener.onIceCandidates(from, { connectionId, candidates });
	}

	/** Shared by the two descriptions: the wire form of both is the same down to the user agent. */
	#describe(description: NegotiationDescription): PullPayload
	{
		return {
			connectionId: description.connectionId,
			sdp: description.sdp,
			tracks: description.tracks,
			userAgent: this.#userAgent,
		};
	}

	/**
	 * One publish, addressed twice: the recipient is the address of the port and the `userId` of the
	 * payload alike, which is the wire form this contract has. The address is applied over the payload,
	 * not under it, so no intent can talk the channel out of the recipient it is publishing to. The rest
	 * of the envelope - the call, the sending instance, the origin and a fresh id per send - belongs to
	 * the port, so no intent here builds half of one.
	 */
	#publish(to: ParticipantId, signal: PullSignal, payload: PullPayload): void
	{
		this.#pull.publish([to], signal, { ...payload, userId: to });
	}

	/** The parsed description of an incoming message, or nothing when there is nothing to apply. */
	#read(signal: PullSignal, payload: PullPayload): NegotiationDescription | undefined
	{
		const description = readDescription(payload);

		if (description === undefined)
		{
			this.#logger.warn(NOTHING_TO_APPLY, { signal });
		}

		return description;
	}

	/** Whether the message is about the connection of that side, and the drop written down when not. */
	#isInFlight(signal: PullSignal, from: ParticipantId, connectionId: ConnectionId): boolean
	{
		const inFlight = this.#connections.get(from);

		if (inFlight === connectionId)
		{
			return true;
		}

		this.#logger.log(ANOTHER_CONNECTION, { signal, from, connectionId, inFlight });

		return false;
	}

	/** The batch of that side for that connection, fresh when the previous one was for another. */
	#batchFor(to: ParticipantId, connectionId: ConnectionId): PendingIceBatch
	{
		const pending = this.#iceBatches.get(to);

		if (pending !== undefined && pending.connectionId === connectionId)
		{
			return pending;
		}

		if (pending !== undefined)
		{
			this.#discardBatch(to, pending.connectionId);
		}

		const fresh: PendingIceBatch = { connectionId, candidates: [], cancelDebounce: undefined };

		this.#iceBatches.set(to, fresh);

		return fresh;
	}

	/** Cancels the batch of a connection that is gone and writes down what it took with it. */
	#discardBatch(to: ParticipantId, connectionId: ConnectionId): void
	{
		const pending = this.#iceBatches.get(to);

		if (pending === undefined || pending.connectionId !== connectionId)
		{
			return;
		}

		pending.cancelDebounce?.();
		this.#iceBatches.delete(to);
		this.#logger.log(CANDIDATES_DISCARDED, { to, connectionId, count: pending.candidates.length });
	}

	/** One command per side with everything gathered since the last one. */
	#flush(to: ParticipantId): void
	{
		const pending = this.#iceBatches.get(to);

		if (pending === undefined)
		{
			return;
		}

		this.#iceBatches.delete(to);
		this.#publish(to, SIGNALS.iceCandidates, {
			connectionId: pending.connectionId,
			candidates: pending.candidates,
		});
	}
}
