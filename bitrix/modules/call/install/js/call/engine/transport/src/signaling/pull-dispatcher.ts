import type { ParticipantId, ParticipantResolver } from '../domain/participant';
import { isWireRecord, readWireId } from '../port/envelope-readers';
import type { LoggerPort } from '../port/logger-port';
import type { PullMessage, PullPayload, PullPort, PullSignal } from '../port/pull-port';
import type { SignalingListener } from './signaling-protocol';
import { BUSY_CODE, DECLINE_CODE } from './wire-codes';

/**
 * Incoming mesh negotiation as the router sees it: the side it came from, and the message it carried
 * untouched. Declared here rather than taken from the channel that implements it, so routing does not
 * depend on the media plane; the payload stays opaque because sdp, candidates and track descriptions
 * are the vocabulary of that channel, which owns their format.
 */
export interface NegotiationListener
{
	/** The side asks for a round of negotiation; whether it restarts the connection is in the message. */
	onNegotiationNeeded(from: ParticipantId, payload: PullPayload): void;

	onConnectionOffer(from: ParticipantId, payload: PullPayload): void;

	onConnectionAnswer(from: ParticipantId, payload: PullPayload): void;

	onIceCandidate(from: ParticipantId, payload: PullPayload): void;
}

/**
 * Which remote media a mute state is about. The three are kept apart instead of being folded into one
 * track: a camera that is off and a video that is paused are different states of the same stream, and
 * which of them matters to a consumer is decided above, not by a router.
 */
export type RemoteMuteKind = 'microphone' | 'camera' | 'videoPaused';

/**
 * Mute of a remote track - the one media state the transport routes, the rest of that family being
 * read above it. Declared at the level of the router for the same reason as the negotiation listener:
 * the media plane implements it, and the router knows nothing of that implementation.
 */
export interface RemoteMuteListener
{
	onRemoteTrackMuted(from: ParticipantId, kind: RemoteMuteKind, isMuted: boolean): void;
}

/**
 * Which call this client speaks for and which instance it publishes as. Neither is read from a
 * message: they are what an incoming message is compared against.
 */
export type PullDispatcherContext = {
	/**
	 * Call this dispatcher serves; a message naming another one is no business of this transport.
	 * The numeric id the server names every envelope by, carried as the string of the wire contract:
	 * the classic schema takes it from `serverCallId` of the descriptor, the jwt schema from the
	 * answer of `call.Call.startCall`, so a jwt dispatcher is constructed after that answer.
	 */
	callId: string,
	/** Instance publishing on behalf of this client: a message carrying it is this client's own echo. */
	instanceId: string,
};

export type PullDispatcherOptions = {
	pull: PullPort,
	presence: SignalingListener,
	negotiation: NegotiationListener,
	mute: RemoteMuteListener,
	/** Maps the native origin of a message onto the canonical id every listener is called with. */
	participants: ParticipantResolver,
	context: PullDispatcherContext,
	logger: LoggerPort,
};

/**
 * Signals that arrive on the channel and stop here by decision rather than by omission: voice activity,
 * the recording state, a message of the application, the roster and the invite that creates a call are
 * meanings the layers above own. Naming them keeps a drop a stated policy, and tells it apart in the
 * log from a signal nothing here knows about.
 */
const READ_ABOVE_THE_TRANSPORT: readonly PullSignal[] = [
	'voiceStarted',
	'voiceStopped',
	'commonRecordState',
	'customMessage',
	'usersJoined',
	'usersInvited',
	'incoming',
];

/**
 * Signals the server alone sends: the two batches it aggregates out of what every side reported, and the
 * end of the call it declares. No client publishes any of them - neither this transport nor the legacy
 * engines nor the mobile ones - so one arriving over a client channel is a side speaking for the server,
 * and it is refused rather than routed. The rest of the vocabulary is published by clients as well, and
 * the roster signals that stop at the transport need no gate of their own: they reach no listener
 * whatever channel carried them.
 */
export const SERVER_ONLY_SIGNALS: readonly PullSignal[] = ['usersAnswered', 'usersHangup', 'finish'];

/**
 * How much presence one origin may hold, and how many origins may hold any. Two bounds on memory and not
 * on the wait: whoever knows the id of a call publishes events naming any sender it likes, and every one
 * the roster does not name opens a queue of closures that only a statement from above ever empties - so an
 * unbounded hold is a tab a remote side can exhaust. Both are sized well past what the wait they exist for
 * takes: a side answers, hangs up, answers again and has its invite expire - four one-shot events - within
 * the round trip the roster needs, and a call has no such number of sides waiting to be named at once.
 * A flood is what meets them, an ordinary call never does.
 *
 * Exported so a test drives the bound off the value in force rather than off a copy of it: a bound restated
 * in a test file is a bound that goes on being asserted after the production one has moved.
 */
export const PRESENCE_PER_ORIGIN_LIMIT = 16;
export const HELD_ORIGINS_LIMIT = 64;

const SIGNAL_STOPS_HERE = 'pull dispatcher: an incoming signal stops at the transport';
const NO_RESOLVED_ORIGIN = 'pull dispatcher: an incoming signal has no resolved origin';
const ANOTHER_CALL = 'pull dispatcher: an incoming signal names another call';
const NO_STATE = 'pull dispatcher: a media state signal carries no state';
const PRESENCE_HELD = 'pull dispatcher: presence is held until the roster names its origin';
const PRESENCE_RELEASED = 'pull dispatcher: the roster named the origin and the held presence went on';
const PRESENCE_REFUSED = 'pull dispatcher: the origin of held presence will not be named';
const PRESENCE_OVER_THE_LIMIT = 'pull dispatcher: an origin holds all the presence it may and its oldest is let go';
const ORIGINS_OVER_THE_LIMIT = 'pull dispatcher: as many origins hold presence as may, and the oldest is let go';
const SERVER_ONLY_FROM_A_CLIENT = 'pull dispatcher: a signal only the server sends arrived from a client';
const SENDER_NOT_BACKED_BY_THE_CHANNEL = 'pull dispatcher: the channel does not vouch for the sender a signal names';

/** Why a signal stopped, so a stated policy is told apart from a gap in the routing. */
const ABOVE_THE_TRANSPORT = 'above the transport';
const NO_ROUTE = 'no route';

/**
 * Why the channel did not vouch for the name: a disagreement the addressing proves, or a channel the
 * addressing places nobody on. The two are told apart in the log because they read differently - the
 * first is a side speaking for another, the second is most often a call assembled without its addressing.
 */
const CHANNEL_NAMES_ANOTHER = 'the channel names another sender';
const CHANNEL_PLACES_NOBODY = 'the addressing places nobody on the channel';

/** A presence event waiting for its origin, as the call it will make once the origin is named. */
type HeldPresence = (from: ParticipantId) => void;

function readCode(value: unknown): number | undefined
{
	return typeof value === 'number' ? value : undefined;
}

/** A state the wire did not state as a flag is no state at all - it is not read as a `false` either. */
function readFlag(payload: PullPayload, field: string): boolean | undefined
{
	const value = payload[field];

	return typeof value === 'boolean' ? value : undefined;
}

/** The entries of a batch; anything that is not a list of records carries no entry to unfold. */
function readEntries(value: unknown): PullPayload[]
{
	if (!Array.isArray(value))
	{
		return [];
	}

	return value.filter((entry): entry is PullPayload => isWireRecord(entry));
}

/**
 * The single point where the incoming channel is taken apart: one subscription, and every signal goes
 * from here to a listener typed for it. It is a router and nothing more - it holds no state of a call,
 * takes no lifecycle decision and answers nothing, so a channel never has to parse a stream of another.
 *
 * Six things happen on the way. A message that names another call - or names no call at all - stops
 * before anything is routed: the channel carries the signaling of every call this client is in, so the
 * call a message names is what makes it this dispatcher's business. The origin of a message is resolved
 * into the canonical participant id before any listener sees it, and an origin that cannot be resolved
 * is never guessed at. The echo of this very instance is dropped, which leaves a message from this side
 * sent elsewhere - the same user on a second device - reaching the listener as this participant, told
 * apart from a remote one by that id alone. A batch is unfolded into the single calls it stands
 * for, each with the code and the sending instance of its own entry, so a consumer sees one shape
 * whatever the wire sent. And the channel a message arrived over decides whether a signal of the server
 * is heard at all: the envelope is written by whoever sent it, so a side publishing one for itself is
 * refused here instead of being taken for the server. For the same reason a name the channel does not vouch
 * for is refused whole rather than routed under it: a sender the addressing contradicts, whatever channel
 * carried the message, and a sender named over any channel but the stated server one the addressing places
 * nobody on - between two publishing sides the envelope alone is no ground to act on a name.
 *
 * Presence whose origin the roster does not name yet is held instead of dropped, for the same reason
 * remote media of an unmapped endpoint is: the roster and the signaling arrive on independent routes,
 * so a side can answer before the layer above has been told it is a participant, and that answer has no
 * repeat. Whoever owns the roster releases what is held once it names the origin, and states just as
 * plainly when an origin is not going to be named - a wait ends by a statement from above and never by
 * a deadline of a clock here. Only the one-shot events of presence are held - an answer, a hangup with
 * whatever code it carries, a repeated answer, an expired invite. The keepalive is not one of them: a
 * round of it arrives every few seconds, so one whose origin the roster does not name is dropped like
 * any other signal, where holding it would grow a queue no release ever empties. A description of a
 * connection or a media state of a side nobody knows is stale by the time it could be delivered.
 *
 * The wait has no deadline, but what waits has a bound - two different questions. A deadline would end from
 * here a wait the layer above owns; a bound only states how much of that wait fits in memory, and it has to
 * be stated, because a side that knows the id of a call names a sender the roster will never name, and names
 * a new one with every message it sends. So one origin holds a fixed number of events and a fixed number of
 * origins hold anything at all; past either bound the oldest is let go and written down as the loss it is.
 * And since what holds anything is exactly what the roster does not name, nothing above can list those
 * origins on its own: `heldPresenceOrigins` is what makes them namable at `dropHeldPresence`.
 */
export class PullDispatcher
{
	#presence: SignalingListener;
	#negotiation: NegotiationListener;
	#mute: RemoteMuteListener;
	#participants: ParticipantResolver;
	#context: PullDispatcherContext;
	#logger: LoggerPort;
	#unsubscribe: () => void;
	#heldPresence: Map<string, HeldPresence[]> = new Map();
	#disposed: boolean = false;

	constructor(options: PullDispatcherOptions)
	{
		this.#presence = options.presence;
		this.#negotiation = options.negotiation;
		this.#mute = options.mute;
		this.#participants = options.participants;
		this.#context = options.context;
		this.#logger = options.logger;
		this.#unsubscribe = options.pull.subscribeIncoming((message) => this.#onIncoming(message));
	}

	/**
	 * The roster above names participants it did not name before: everything held for an origin it now
	 * resolves goes on to the listener, per origin in the order it arrived. An origin still unknown keeps
	 * waiting - this releases what can be released and states nothing about the rest.
	 */
	releaseHeldPresence(): void
	{
		if (this.#disposed)
		{
			return;
		}

		[...this.#heldPresence.keys()].forEach((senderId) => {
			const from = this.#participants.resolveSender(senderId);

			if (from === null)
			{
				return;
			}

			const released = this.#letGo(senderId);

			this.#logger.log(PRESENCE_RELEASED, { senderId, events: released.length });
			released.forEach((deliver) => deliver(from));
		});
	}

	/**
	 * The origin of what is held is not going to be named - the side left before the roster caught up, or
	 * the roster above knows of no such participant. Whatever waited for it is let go unrouted, because a
	 * presence event cannot be attributed to a side nobody can name. It is a statement about what waits
	 * right now, not a verdict for good: an event of that origin arriving later is held like any other.
	 */
	/**
	 * The origins holding presence right now, in the order they started waiting. Whoever owns the roster has
	 * no other way to reach them: what is held is by definition held for a side the roster does not name, so
	 * there is no list above this one to name it back at `dropHeldPresence`. Answering about its own waiting
	 * is not a decision the router takes - which of these origins is never going to be named is decided by
	 * the owner of the roster, and stated back here.
	 *
	 * A statement about this moment: an origin released, refused or let go for room is no longer among them.
	 */
	heldPresenceOrigins(): string[]
	{
		return [...this.#heldPresence.keys()];
	}

	dropHeldPresence(senderId: string): void
	{
		const refused = this.#letGo(senderId);

		if (refused.length === 0)
		{
			return;
		}

		this.#logger.error(PRESENCE_REFUSED, { senderId, events: refused.length });
	}

	/**
	 * Idempotent: the subscription is let go once, and after it the channel reaches no listener of this
	 * dispatcher - a message the port delivers late is dropped here rather than routed to a consumer that
	 * has torn the call down. Presence still waiting for its origin is dropped without a word: the call
	 * it belonged to is over.
	 */
	dispose(): void
	{
		if (this.#disposed)
		{
			return;
		}

		this.#disposed = true;
		this.#heldPresence.clear();
		this.#unsubscribe();
	}

	#onIncoming(message: PullMessage): void
	{
		if (this.#disposed)
		{
			return;
		}

		// written down rather than warned about: with two calls in one tab each of them sees the
		// signaling of the other, so a drop here is the ordinary case and not a failure
		if (!this.#isThisCall(message.callId))
		{
			this.#logger.log(ANOTHER_CALL, { signal: message.signal, callId: message.callId });

			return;
		}

		if (this.#isOwnEcho(message.callInstanceId))
		{
			return;
		}

		if (this.#isServerOnlySignalFromAClient(message))
		{
			this.#logger.error(SERVER_ONLY_FROM_A_CLIENT, { signal: message.signal, origin: message.origin });

			return;
		}

		const senderRefusal = this.#refusalOfTheNamedSender(message);

		if (senderRefusal !== undefined)
		{
			this.#logger.error(SENDER_NOT_BACKED_BY_THE_CHANNEL, {
				signal: message.signal,
				senderId: message.senderId,
				channelSenderId: message.channelSenderId,
				origin: message.origin,
				reason: senderRefusal,
			});

			return;
		}

		switch (message.signal)
		{
			case 'answer':
				this.#withPresenceSender(message, (from) => this.#presence.onAnswer(from));
				break;
			case 'usersAnswered':
				this.#onUsersAnswered(message);
				break;
			case 'hangup':
				this.#deliverHangup(message.signal, message.senderId, readCode(message.payload.code));
				break;
			case 'usersHangup':
				this.#onUsersHangup(message);
				break;
			case 'ping':
				// dropped rather than held at an origin nobody names: the next round replaces this one
				this.#withSender(message, (from) => this.#presence.onPing(from));
				break;
			case 'repeatAnswer':
				this.#withPresenceSender(message, (from) => this.#presence.onRepeatAnswer(from));
				break;
			case 'userInviteTimeout':
				this.#onInviteTimeout(message);
				break;
			case 'finish':
				this.#presence.onFinish();
				break;
			case 'negotiationNeeded':
				this.#withSender(message, (from) => this.#negotiation.onNegotiationNeeded(from, message.payload));
				break;
			case 'connectionOffer':
				this.#withSender(message, (from) => this.#negotiation.onConnectionOffer(from, message.payload));
				break;
			case 'connectionAnswer':
				this.#withSender(message, (from) => this.#negotiation.onConnectionAnswer(from, message.payload));
				break;
			case 'iceCandidate':
				this.#withSender(message, (from) => this.#negotiation.onIceCandidate(from, message.payload));
				break;
			case 'microphoneState':
				this.#onDeviceState(message, 'microphone', 'microphoneState');
				break;
			case 'cameraState':
				this.#onDeviceState(message, 'camera', 'cameraState');
				break;
			case 'videoPaused':
				this.#onVideoPaused(message);
				break;
			default:
				this.#stopHere(message.signal);
		}
	}

	/** The subject is the side whose invite expired; the server states it, so it is not the sender. */
	#onInviteTimeout(message: PullMessage): void
	{
		this.#withPresenceOrigin(message.signal, readWireId(message.payload.failedUserId), (from) => {
			this.#presence.onInviteTimeout(from);
		});
	}

	/**
	 * The batch of an answer: one entry per side that answered, each naming the instance it answered
	 * from - so the echo of this instance is dropped entry by entry, the envelope of a batch carrying
	 * none of its own. `isLegacyMobile` travels beside it as an attribute of the roster, which is read
	 * above the transport and has no place in a presence event.
	 */
	#onUsersAnswered(message: PullMessage): void
	{
		readEntries(message.payload.senders).forEach((entry) => {
			if (this.#isOwnEcho(readWireId(entry.callInstanceId)))
			{
				return;
			}

			this.#withPresenceOrigin(message.signal, readWireId(entry.senderId), (from) => {
				this.#presence.onAnswer(from);
			});
		});
	}

	/** Every entry keeps a code of its own; the code of the batch stands for an entry that names none. */
	#onUsersHangup(message: PullMessage): void
	{
		const sharedCode = readCode(message.payload.code);

		readEntries(message.payload.users).forEach((entry) => {
			if (this.#isOwnEcho(readWireId(entry.callInstanceId)))
			{
				return;
			}

			this.#deliverHangup(
				message.signal,
				readWireId(entry.senderId) ?? readWireId(entry.userId),
				readCode(entry.code) ?? sharedCode,
			);
		});
	}

	/** A refusal and a busy side arrive as a code inside a hangup: the code is what tells the three apart. */
	#deliverHangup(signal: PullSignal, senderId: string | undefined, code: number | undefined): void
	{
		this.#withPresenceOrigin(signal, senderId, (from) => {
			if (code === DECLINE_CODE)
			{
				this.#presence.onDecline(from, code);

				return;
			}

			if (code === BUSY_CODE)
			{
				this.#presence.onBusy(from);

				return;
			}

			this.#presence.onHangup(from);
		});
	}

	/** A device flag states that the media is on, so the mute state of the track is its negation. */
	#onDeviceState(message: PullMessage, kind: RemoteMuteKind, field: string): void
	{
		const isOn = readFlag(message.payload, field);

		if (isOn === undefined)
		{
			this.#logger.log(NO_STATE, { signal: message.signal });

			return;
		}

		this.#withSender(message, (from) => this.#mute.onRemoteTrackMuted(from, kind, !isOn));
	}

	/** The pause flag states the mute itself: paused video is video the other side stopped sending. */
	#onVideoPaused(message: PullMessage): void
	{
		const isPaused = readFlag(message.payload, 'videoPaused');

		if (isPaused === undefined)
		{
			this.#logger.log(NO_STATE, { signal: message.signal });

			return;
		}

		this.#withSender(message, (from) => this.#mute.onRemoteTrackMuted(from, 'videoPaused', isPaused));
	}

	#withSender(message: PullMessage, deliver: (from: ParticipantId) => void): void
	{
		this.#withOrigin(message.signal, message.senderId, deliver);
	}

	#withPresenceSender(message: PullMessage, deliver: (from: ParticipantId) => void): void
	{
		this.#withPresenceOrigin(message.signal, message.senderId, deliver);
	}

	/**
	 * Resolves the side an event came from and hands the event over. An origin that is absent or not
	 * resolved yet stops the event here: a router that guessed one would attribute the event to the
	 * wrong side, and the mapping belongs to the source of the roster above.
	 */
	#withOrigin(signal: PullSignal, senderId: string | undefined, deliver: (from: ParticipantId) => void): void
	{
		const from = senderId === undefined ? null : this.#participants.resolveSender(senderId);

		if (from === null)
		{
			this.#logger.warn(NO_RESOLVED_ORIGIN, { signal, senderId });

			return;
		}

		deliver(from);
	}

	/**
	 * The same for a presence event, except that an origin the roster does not name yet holds the event
	 * instead of ending it. An event naming no origin at all is still stopped: there is no id to hold it
	 * under and none to release it by.
	 */
	#withPresenceOrigin(
		signal: PullSignal,
		senderId: string | undefined,
		deliver: (from: ParticipantId) => void,
	): void
	{
		if (senderId === undefined)
		{
			this.#logger.warn(NO_RESOLVED_ORIGIN, { signal, senderId });

			return;
		}

		const from = this.#participants.resolveSender(senderId);

		if (from === null)
		{
			this.#hold(signal, senderId, deliver);

			return;
		}

		deliver(from);
	}

	#hold(signal: PullSignal, senderId: string, deliver: HeldPresence): void
	{
		const held = this.#heldPresence.get(senderId);

		if (held === undefined)
		{
			this.#makeRoomForAnOrigin();
			this.#heldPresence.set(senderId, [deliver]);
			this.#logger.warn(PRESENCE_HELD, { signal, senderId, events: 1 });

			return;
		}

		held.push(deliver);

		// the newest event of a side supersedes the oldest of it rather than the other way round: an answer
		// followed by a hangup ends with the hangup, and it is the hangup a consumer must not lose
		if (held.length > PRESENCE_PER_ORIGIN_LIMIT)
		{
			held.shift();
			this.#logger.error(PRESENCE_OVER_THE_LIMIT, { signal, senderId, limit: PRESENCE_PER_ORIGIN_LIMIT });
		}

		this.#logger.warn(PRESENCE_HELD, { signal, senderId, events: held.length });
	}

	/**
	 * Room for one origin more, made by letting go of everything the origin waiting longest holds. Whole
	 * rather than event by event: a queue handed over in part would report a side answering and never hanging
	 * up, and half a story of a participant is worse than none of it.
	 *
	 * The origin that has waited longest goes first, not the one holding most and not the one heard from
	 * least recently. What a flood leaves behind never drains on its own - only a statement from above empties
	 * it - so the oldest of the held is where the ids of a flood already past accumulate, while the origins
	 * of a call being answered right now are the newest and stay. It costs the origin that fell silent just
	 * before a flood; that is the one loss the bound is paid with.
	 */
	#makeRoomForAnOrigin(): void
	{
		const overTheLimit = this.#heldPresence.size - HELD_ORIGINS_LIMIT + 1;

		if (overTheLimit <= 0)
		{
			return;
		}

		[...this.#heldPresence.keys()].slice(0, overTheLimit).forEach((senderId) => {
			const letGo = this.#letGo(senderId);

			this.#logger.error(ORIGINS_OVER_THE_LIMIT, {
				senderId,
				events: letGo.length,
				limit: HELD_ORIGINS_LIMIT,
			});
		});
	}

	/** What was held for that origin, in arrival order, and the origin holds nothing afterwards. */
	#letGo(senderId: string): HeldPresence[]
	{
		const held = this.#heldPresence.get(senderId) ?? [];

		this.#heldPresence.delete(senderId);

		return held;
	}

	/**
	 * Whether the message is about the call this dispatcher serves. A message naming no call is none of
	 * its business either: an unnamed call cannot be told from another one, and every signal of the wire
	 * carries the call it belongs to.
	 */
	#isThisCall(callId: string | undefined): boolean
	{
		return callId === this.#context.callId;
	}

	#isOwnEcho(callInstanceId: string | undefined): boolean
	{
		return callInstanceId === this.#context.instanceId;
	}

	/**
	 * Whether a signal of the server arrived from somewhere else. The channel it came over is the only
	 * word on that a sending side cannot write itself, so a signal of this vocabulary is routed on the
	 * stated server channel alone: an unstated origin is refused too, because a signal that ends a call
	 * or reports who answered may not rest on a channel nobody named.
	 */
	#isServerOnlySignalFromAClient(message: PullMessage): boolean
	{
		return SERVER_ONLY_SIGNALS.includes(message.signal) && message.origin !== 'server';
	}

	/**
	 * The sender a message names against the participant whose channel carried it, answering with the reason
	 * the channel does not vouch for that name, or with nothing when it does. The channel is the one word a
	 * sending side cannot write itself, so a name it does not vouch for is refused whole - before the
	 * routing, so no branch of it acts on the name.
	 *
	 * A disagreement the addressing proves is refused whatever carried the message. Where it proves nothing
	 * - the addressing places nobody on the channel - the origin decides, and the line runs between the
	 * stated server channel and everything else, exactly as it does for a signal only the server sends. The
	 * server channel is not refused: the server is not one publishing side among many, and the signals only
	 * it sends are gated by their own vocabulary above. Everything else is: one publishing side is told from
	 * another by the addressing alone, so a name resting on nothing else is a name anyone who knows the id of
	 * the call may write, and presence, mute and negotiation would act on it. A channel that stated no origin
	 * at all is refused with the rest, though nothing can deliver one today - the adapter this transport
	 * ships states an origin on every message. The refusal does not rest on that: a check that trusts what
	 * nobody stated holds only while the single adapter behind it keeps its discipline, and this one is meant
	 * to hold on its own. A message naming no sender of its own is refused on no channel at all - it claims
	 * nothing the channel could contradict.
	 *
	 * What the refusal costs is a signal outside the server channel the addressing places nobody for yet. The
	 * addressing the connection was received with closes that window at the start of a call - it travels as
	 * `publicChannels` of the answer and is seeded into the port through `applyAddressing`, which the
	 * composition root owes before it subscribes to anything - and every server message of the call widens
	 * it afterwards. A side the addressing has not reached is refused until it does, knowingly: holding such
	 * a message instead would need a queue nothing here can ever time out, there being no clock at this
	 * level to end a wait with.
	 */
	#refusalOfTheNamedSender(message: PullMessage): string | undefined
	{
		if (message.senderId === undefined)
		{
			return undefined;
		}

		if (message.channelSenderId === undefined)
		{
			return message.origin === 'server' ? undefined : CHANNEL_PLACES_NOBODY;
		}

		return message.channelSenderId === message.senderId ? undefined : CHANNEL_NAMES_ANOTHER;
	}

	/** Nothing falls through in silence: a signal that stops here is written down with the reason it did. */
	#stopHere(signal: PullSignal): void
	{
		const reason = READ_ABOVE_THE_TRANSPORT.includes(signal) ? ABOVE_THE_TRANSPORT : NO_ROUTE;

		this.#logger.log(SIGNAL_STOPS_HERE, { signal, reason });
	}
}
