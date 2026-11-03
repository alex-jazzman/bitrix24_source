import type { ParticipantId, PullMessage, PullPayload, PullPort, PullSignal } from 'call.engine.transport';

/**
 * One recorded `publish`, kept whole: a test asserts on the addressing and on the expiry exactly as
 * the caller gave them. `expirySeconds` stays in the record as `undefined` when it was omitted, so the
 * shape of an entry never depends on the arguments.
 */
export type PublishedSignal = {
	recipients: ParticipantId[],
	signal: PullSignal,
	payload: PullPayload,
	expirySeconds?: number,
};

/**
 * Programmable pull channel. Records every publish and delivers an incoming message when the test says
 * so, which is what lets a consumer of the channel be tested without a live connection.
 *
 * The publishing flags are inputs of the caller's own policy, so a publish is recorded whatever they
 * say: a test that expects a strategy to stay silent while publishing is disabled has to see an empty
 * record, not a record filtered by the fake.
 */
export class FakePullPort implements PullPort
{
	#published: PublishedSignal[] = [];
	#listeners: Set<(message: PullMessage) => void> = new Set();
	#publishingSupported: boolean = true;
	#publishingEnabled: boolean = true;

	publish(
		recipients: ParticipantId[],
		signal: PullSignal,
		payload: PullPayload,
		expirySeconds?: number,
	): void
	{
		this.#published.push({ recipients, signal, payload, expirySeconds });
	}

	subscribeIncoming(listener: (message: PullMessage) => void): () => void
	{
		this.#listeners.add(listener);

		return () => {
			this.#listeners.delete(listener);
		};
	}

	isPublishingSupported(): boolean
	{
		return this.#publishingSupported;
	}

	isPublishingEnabled(): boolean
	{
		return this.#publishingEnabled;
	}

	/** Independent of `setPublishingEnabled`: the pair of flags is programmed in any combination. */
	setPublishingSupported(isSupported: boolean): void
	{
		this.#publishingSupported = isSupported;
	}

	setPublishingEnabled(isEnabled: boolean): void
	{
		this.#publishingEnabled = isEnabled;
	}

	/**
	 * Delivers the message to the current subscribers; a snapshot, so a listener may unsubscribe here.
	 *
	 * A message that names no origin is delivered as one of the server channel - the ordinary case, and
	 * the one every consumer trusts - so a test about a client publication names the origin itself.
	 */
	emitIncoming(message: PullMessage): void
	{
		const delivered: PullMessage = { ...message, origin: message.origin ?? 'server' };

		[...this.#listeners].forEach((listener) => listener(delivered));
	}

	getPublishedSignals(): PublishedSignal[]
	{
		return [...this.#published];
	}

	/** Zero after every unsubscribe function has been called: the proof that a consumer released the channel. */
	getIncomingSubscriberCount(): number
	{
		return this.#listeners.size;
	}
}
