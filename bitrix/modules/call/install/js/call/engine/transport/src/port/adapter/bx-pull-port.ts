import type { ParticipantId } from '../../domain/participant';
import { isWireRecord, readWireId } from '../envelope-readers';
import type { LoggerPort } from '../logger-port';
import type { PullMessage, PullMessageOrigin, PullPayload, PullPort, PullSignal } from '../pull-port';

/**
 * One pull channel as the channel manager of the pull module reads it: the participant it belongs to,
 * the public id it is addressed by, the signature that lets a client publish into it, and the interval
 * it is valid for. The field names are the ones of the wire, because they are what the primitive reads.
 */
export type PullChannelDescriptor = {
	user_id: string,
	public_id: string,
	signature: string,
	start: string,
	end: string,
};

/**
 * The slice of the pull client this adapter drives. Declared here rather than taken from the pull
 * module: the transport keeps its own contracts, and the primitive is injected instead of read off a
 * global, which is what makes the logic below testable without a live channel.
 *
 * A send reports no delivery - publishing is best-effort by contract - but the pull client does answer
 * a promise that refuses when the send itself broke, so the result is declared instead of dropped: an
 * unread refusal of it would be an unhandled rejection. A primitive answering nothing fits the same
 * declaration.
 */
export type PullClientPrimitive = {
	sendMessage(
		users: ParticipantId[],
		moduleId: string,
		command: string,
		params: PullPayload,
		expiry: number,
	): void | Promise<unknown>,
	/** Pull addressing of the call: the channel holds the descriptors it is given until the next set. */
	setPublicIds(publicIds: PullChannelDescriptor[]): void,
	isPublishingSupported(): boolean,
	isPublishingEnabled(): boolean,
};

/**
 * What the bus hands over: the raw pull command, the envelope exactly as it arrived, and the meta the
 * pull module states beside a message - the sender among it, which is the only authenticated word on
 * where a message came from.
 */
export type IncomingPullHandler = (command: string, params: unknown, extra?: unknown) => void;

/**
 * Global custom-event bus incoming pull messages travel over. Injected for the same reason as the
 * client, and its event names never leave this file.
 */
export type CustomEventBusPrimitive = {
	addCustomEvent(eventName: string, handler: IncomingPullHandler): void,
	removeCustomEvent(eventName: string, handler: IncomingPullHandler): void,
};

/**
 * Ids of the connection this port speaks for. Fixed at construction: one port serves one connection,
 * so an outgoing envelope cannot end up carrying the ids of another call. A port is created once the
 * call it speaks for is named, instead of being re-pointed at runtime - which in the jwt schema is
 * after the media connection is up, because there the name comes from `call.Call.startCall` and not
 * from the acquired connection.
 */
export type PullConnectionContext = {
	/**
	 * Numeric id of the call the server names every envelope by, carried as the string of the wire
	 * contract: `serverCallId` of a classic descriptor, and the answer of `call.Call.startCall` in
	 * the jwt schema, which the balancer does not name.
	 */
	callId: string,
	/** Instance publishing through this port; the receiving side tells its own echo apart by it. */
	callInstanceId: string,
	senderId: ParticipantId,
};

export type BxPullPortOptions = {
	pull: PullClientPrimitive,
	events: CustomEventBusPrimitive,
	context: PullConnectionContext,
	/** Where a publish that broke is written down; it is the only outcome of a send anybody ever reads. */
	logger: LoggerPort,
	/** Seam for a deterministic request id in tests; production keeps the built-in generator. */
	requestIdFactory?: () => string,
};

/** Pull module the call signaling travels under, and the prefix marking its commands as ours. */
const PULL_MODULE_ID = 'im';
const SIGNAL_PREFIX = 'Call::';

/**
 * Channels incoming signaling arrives over, each with the origin a message of it carries. A message the
 * server sends reaches the module channel of its own module, while a message published by a client -
 * which is how this port publishes - reaches the client channel of the pull module and nothing else, so
 * all three are listened to and the channel a message arrived over is what names its origin.
 */
const INCOMING_CHANNELS: readonly { eventName: string, origin: PullMessageOrigin }[] = [
	{ eventName: 'onPullEvent-call', origin: 'server' },
	{ eventName: 'onPullEvent-im', origin: 'server' },
	{ eventName: 'onPullClientEvent-im', origin: 'client' },
];

/**
 * Sender type of a client publication, as the pull module states it in the meta of a message. The
 * channel already tells the two apart, so this is read on top of it: a message stating a client sender
 * is a client publication whatever channel carried it.
 */
const CLIENT_SENDER_TYPE = 1;

/** Channel default of the adapter, applied when the caller names no expiry. */
const DEFAULT_EXPIRY_SECONDS = 5;

/** A send the channel refused after the caller was already gone; it reaches the log and goes no further. */
const PUBLISH_FAILED = 'pull: publishing a signal failed';

/** Fields the adapter owns in the envelope: none of them reaches a consumer as payload. */
const ENVELOPE_FIELDS = ['callInstanceId', 'senderId', 'callId', 'requestId', 'publicIds'];

type Envelope = { [field: string]: unknown };

function createUuidV4(): string
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (placeholder) => {
		const random = Math.floor(Math.random() * 16);
		const value = placeholder === 'x' ? random : ((random & 0x3) | 0x8);

		return value.toString(16);
	});
}

/** Whether the primitive answered a promise of the send; one that answers nothing leaves nothing to read. */
function isThenable(value: unknown): value is Promise<unknown>
{
	return typeof value === 'object'
		&& value !== null
		&& typeof (value as { then?: unknown }).then === 'function';
}

/** A field the channel is addressed by is a string of the wire; anything else counts as absent. */
function readWireText(value: unknown): string | undefined
{
	return typeof value === 'string' ? value : undefined;
}

/**
 * Sent as a map keyed by participant, so the values are the channel descriptors the addressing is made
 * of - not the public ids alone.
 */
function readPublicIds(value: unknown): PullChannelDescriptor[]
{
	if (!isWireRecord(value))
	{
		return [];
	}

	return Object.values(value)
		.map((descriptor) => readChannelDescriptor(descriptor))
		.filter((descriptor): descriptor is PullChannelDescriptor => descriptor !== undefined);
}

/**
 * A descriptor missing any field the channel addresses by is no address at all - a participant with no
 * channel of their own arrives exactly like that - so it is dropped instead of reaching the primitive
 * half filled.
 */
function readChannelDescriptor(value: unknown): PullChannelDescriptor | undefined
{
	if (!isWireRecord(value))
	{
		return undefined;
	}

	const userId = readWireId(value.user_id);
	const publicId = readWireId(value.public_id);
	const signature = readWireText(value.signature);
	const start = readWireText(value.start);
	const end = readWireText(value.end);

	if (
		userId === undefined
		|| publicId === undefined
		|| signature === undefined
		|| start === undefined
		|| end === undefined
	)
	{
		return undefined;
	}

	return { user_id: userId, public_id: publicId, signature, start, end };
}

/**
 * The sender of a message as the pull module states it: the kind of the sending side, and the public id
 * of the channel it published from. Both are absent on a message that states no sender at all.
 */
function readSenderType(extra: unknown): number | undefined
{
	const sender = isWireRecord(extra) ? extra.sender : undefined;
	const type = isWireRecord(sender) ? sender.type : undefined;

	return typeof type === 'number' ? type : undefined;
}

function readSenderChannelId(extra: unknown): string | undefined
{
	const sender = isWireRecord(extra) ? extra.sender : undefined;

	return isWireRecord(sender) ? readWireId(sender.id) : undefined;
}

function readPayload(envelope: Envelope): PullPayload
{
	return Object.fromEntries(
		Object.entries(envelope).filter(([field]) => !ENVELOPE_FIELDS.includes(field)),
	);
}

/**
 * `PullPort` over the pull client. The name of the pull module and the `Call::` prefix live here and
 * nowhere else: a caller publishes a bare signal and reads a typed message, in both directions.
 *
 * Beyond bridging, the adapter owns the envelope - the connection ids and a fresh request id on
 * every publish - and the pull addressing of the call: `publicIds` of a server message naming this call
 * are taken out of an incoming envelope and handed to the channel, which is why `PullMessage` has none.
 * A publication of a client carries no addressing this port will take: a side able to place its own
 * channel in the map would have every publication addressed to another participant delivered to it.
 * The same addressing is what lets the adapter name the participant a message was published from, so a
 * message states both the channel it arrived over and, when the addressing places it, whose channel
 * that was. The addressing a connection was acquired with reaches none of this on its own - it comes
 * with the answer of the server, above the port - so `applyAddressing` is the entry that seeds it.
 * Nothing else is decided here: choosing a channel, retrying and falling back are the policy of the
 * caller, and so is what a message naming another call - or one whose stated sender is not the owner
 * of its channel - means to a consumer.
 */
export class BxPullPort implements PullPort
{
	#pull: PullClientPrimitive;
	#events: CustomEventBusPrimitive;
	#context: PullConnectionContext;
	#logger: LoggerPort;
	#createRequestId: () => string;
	/**
	 * Public id of a channel to the participant it belongs to. Both addressings of the call fill it: the
	 * one the connection was acquired with, seeded through `applyAddressing`, and the one a server
	 * message of the call carries.
	 */
	#channelOwners: Map<string, string> = new Map();

	constructor(options: BxPullPortOptions)
	{
		this.#pull = options.pull;
		this.#events = options.events;
		this.#context = options.context;
		this.#logger = options.logger;
		this.#createRequestId = options.requestIdFactory ?? createUuidV4;
	}

	/**
	 * A refusal the channel answers after the fact stops here: the send reports no delivery, so `void` is
	 * all a caller gets and there is nobody left to hand a late refusal to - unread, it would be an
	 * unhandled rejection. A primitive that breaks on the spot is left alone instead: that break reaches
	 * the caller, and the intent that stated the publish is what swallows it.
	 */
	publish(
		recipients: ParticipantId[],
		signal: PullSignal,
		payload: PullPayload,
		expirySeconds?: number,
	): void
	{
		const sent = this.#pull.sendMessage(
			recipients,
			PULL_MODULE_ID,
			`${SIGNAL_PREFIX}${signal}`,
			{
				...payload,
				callInstanceId: this.#context.callInstanceId,
				senderId: this.#context.senderId,
				callId: this.#context.callId,
				requestId: this.#createRequestId(),
			},
			expirySeconds ?? DEFAULT_EXPIRY_SECONDS,
		);

		if (isThenable(sent))
		{
			sent.catch(() => this.#logger.warn(PUBLISH_FAILED, { signal }));
		}
	}

	subscribeIncoming(listener: (message: PullMessage) => void): () => void
	{
		// a handler of its own per channel: the channel a message arrived over is not in the message,
		// so the subscription is what remembers it
		const handlers = INCOMING_CHANNELS.map((channel) => {
			const handler: IncomingPullHandler = (command, params, extra) => {
				this.#onIncoming(command, params, extra, channel.origin, listener);
			};

			this.#events.addCustomEvent(channel.eventName, handler);

			return { eventName: channel.eventName, handler };
		});

		return () => {
			handlers.forEach(({ eventName, handler }) => this.#events.removeCustomEvent(eventName, handler));
		};
	}

	isPublishingSupported(): boolean
	{
		return this.#pull.isPublishingSupported();
	}

	isPublishingEnabled(): boolean
	{
		return this.#pull.isPublishingEnabled();
	}

	/**
	 * Seeds the addressing the connection was acquired with, so the channel is addressed and the
	 * participant behind a channel is namable before any server message of the call arrives. Read by the
	 * same rule an incoming one is: a value holding no usable descriptor leaves what the channel already
	 * holds in place, and a later server message replaces the set as a whole.
	 *
	 * Owed by the composition root before `subscribeIncoming`, and not merely before the first server
	 * message: until it is called every message this port hands over states a channel the addressing
	 * places nobody on, and a consumer refusing what it cannot place loses exactly the signals a classic
	 * call opens with - `answer`, `hangup` and the mesh handshake, none of which is sent a second time.
	 */
	applyAddressing(publicChannels: unknown): void
	{
		this.#holdPublicIds(publicChannels);
	}

	/** The channel is shared with the whole pull module, so anything but call signaling is dropped. */
	#onIncoming(
		command: string,
		params: unknown,
		extra: unknown,
		channelOrigin: PullMessageOrigin,
		listener: (message: PullMessage) => void,
	): void
	{
		if (!command.startsWith(SIGNAL_PREFIX))
		{
			return;
		}

		const envelope: Envelope = isWireRecord(params) ? params : {};
		const callId = readWireId(envelope.callId);
		const origin = this.#readOrigin(extra, channelOrigin);

		// addressing is taken from a server message of this call only: neither a message of another
		// call nor a publication of a client may re-point the channel this connection publishes over
		if (callId === this.#context.callId && origin === 'server')
		{
			this.#holdPublicIds(envelope.publicIds);
		}

		listener({
			signal: command.slice(SIGNAL_PREFIX.length),
			callInstanceId: readWireId(envelope.callInstanceId),
			senderId: readWireId(envelope.senderId),
			callId,
			requestId: readWireId(envelope.requestId),
			origin,
			channelSenderId: this.#readChannelSender(extra),
			payload: readPayload(envelope),
		});
	}

	/** A message that carries no addressing leaves the set the channel already holds in place. */
	#holdPublicIds(value: unknown): void
	{
		const publicIds = readPublicIds(value);

		if (publicIds.length === 0)
		{
			return;
		}

		publicIds.forEach((descriptor) => this.#channelOwners.set(descriptor.public_id, descriptor.user_id));
		this.#pull.setPublicIds(publicIds);
	}

	/** A stated client sender wins over the channel: a client publication is one whichever channel it took. */
	#readOrigin(extra: unknown, channelOrigin: PullMessageOrigin): PullMessageOrigin
	{
		return readSenderType(extra) === CLIENT_SENDER_TYPE ? 'client' : channelOrigin;
	}

	/**
	 * The sender the pull module names is the public id of a channel, so it is worth nothing to a
	 * consumer until the addressing places it. A channel the addressing has not named stays unplaced:
	 * the map holds the participants the seeded addressing of the connection named, plus those a server
	 * message of this call has carried since.
	 */
	#readChannelSender(extra: unknown): string | undefined
	{
		const channelId = readSenderChannelId(extra);

		return channelId === undefined ? undefined : this.#channelOwners.get(channelId);
	}
}
