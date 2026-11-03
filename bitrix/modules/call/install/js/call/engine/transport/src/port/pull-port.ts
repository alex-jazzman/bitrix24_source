import type { ParticipantId } from '../domain/participant';

/**
 * Name of a signal on the pull channel, already stripped of the channel-level prefix. That prefix
 * and the name of the pull module stay inside the port and reach no consumer. The vocabulary of the
 * names themselves belongs to the component that owns the wire format: a closed union here would
 * move that format into the port.
 */
export type PullSignal = string;

/** Everything a signal carries beside the envelope. Opaque to the port: it forwards, never parses. */
export type PullPayload = {
	[field: string]: unknown,
};

/**
 * Where a signal came from: the channel the server broadcasts on, or the channel another client
 * publishes on. It is not read off the message - a sending side writes the envelope itself - but off the
 * channel the message arrived over, which is why it is the port that states it.
 */
export type PullMessageOrigin = 'server' | 'client';

/**
 * Incoming message with the envelope already taken apart, so a consumer reads fields instead of
 * digging through raw params. Pull addressing (`publicIds`) is absent on purpose - keeping it is the
 * business of the adapter, and that is what leaves the incoming dispatcher a thin router.
 *
 * The envelope ids are optional because the wire does not guarantee them - a signal originating on
 * the server carries no sending instance. The port forwards what arrived and invents nothing, so
 * what an absent id means is decided by the consumer.
 */
export type PullMessage = {
	signal: PullSignal,
	/** Instance that sent the signal: a consumer tells its own echo apart by it. */
	callInstanceId?: string,
	/** Native id of the origin; it is resolved into a `ParticipantId` above the port. */
	senderId?: string,
	/** Call the signal belongs to: a consumer drops a message that names another one, or none. */
	callId?: string,
	/** Id of a single send, generated per message by the sending side. */
	requestId?: string,
	/**
	 * Channel the message arrived over, stated by the port. Absent when the channel did not state one:
	 * a consumer that trusts a signal only from the server reads an unstated origin as one it may not
	 * trust, never as the server.
	 */
	origin?: PullMessageOrigin,
	/**
	 * Participant whose channel published the message, when the addressing the port holds names them.
	 * Unlike `senderId`, which the sending side writes into the envelope itself, this is the origin the
	 * channel is authenticated by - so the two disagreeing is what a signal naming someone else looks
	 * like. Absent whenever the addressing cannot place the channel, which is the ordinary state of a
	 * connection that has not seen the whole roster yet.
	 */
	channelSenderId?: string,
	payload: PullPayload,
};

/**
 * Raw pull channel: addressed publishing and one typed subscription to incoming signals. Decides
 * nothing - whether a signal travels over pull at all is the policy of the caller, taken on the
 * publishing capability below.
 */
export interface PullPort
{
	/**
	 * Publishes a signal to the given recipients. Addressing goes by the canonical participant id
	 * (in the current Bitrix contract that is the user id); mapping it onto the recipient list of
	 * the primitive, and filling the envelope ids of the connection, is the work of the adapter.
	 *
	 * Best-effort, hence `void`: the primitive reports no delivery and no caller branches on the
	 * outcome of a publish, because the channel is chosen beforehand by capability. Omitting
	 * `expirySeconds` leaves the channel default of the adapter in place.
	 */
	publish(
		recipients: ParticipantId[],
		signal: PullSignal,
		payload: PullPayload,
		expirySeconds?: number,
	): void;

	/** Returns the unsubscribe function; a consumer never names a global event to get here. */
	subscribeIncoming(listener: (message: PullMessage) => void): () => void;

	/** Whether the channel supports publishing at all. */
	isPublishingSupported(): boolean;

	/** Whether publishing works right now: supported and the channel is up. */
	isPublishingEnabled(): boolean;
}
