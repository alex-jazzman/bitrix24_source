import { isErr, MediaTrackKind, Quality } from 'call.engine.transport';
import type {
	ConnectionDescriptor,
	MediaEndpointId,
	MediaTransport,
	MediaTransportIntent,
	MediaTransportListener,
	ParticipantId,
	RemoteMuteKind,
	Result,
	TransportError,
} from 'call.engine.transport';
import type { ConformanceRunner } from './acquisition-conformance';

/**
 * What every `MediaTransport` owes the layer above it, whether the media travels over a mesh of peer
 * connections or over an sfu. The checks below are about the wiring of the contract and nothing else:
 * that an intent answers a `Result` instead of throwing, that a failure keeps the kind it was given,
 * that every event of the plane reaches the consumer with the payload it carried, that a plane reaches
 * commit without waiting for remote media, and that a plane taken down goes silent for good and refuses
 * every intent stated after that.
 *
 * Every intent is asked of a plane that is up, `connect` being the step that raises one: what an intent
 * answers before the connection exists is nothing the contract states, and a plane entitled to refuse a
 * publish into a connection it has not made must not fail an exam of the contract for it.
 *
 * Nothing here knows how the plane is built. Sdp, ice candidates, a room of a media server and the
 * budget of recovery are named nowhere: a subject hands over a factory (`create`) and the steering
 * seam of its own plane (`plane`), and the suite drives the contract through those two alone. Real
 * media, a real peer connection and a real media server are integration and stay outside.
 */

type IntentOutcome = Result<void, TransportError>;

/** Events of the contract, derived from the listener rather than listed again. */
type PlaneEvent = keyof MediaTransportListener;

/**
 * How the suite makes a plane report one event of the contract. Shaped as the listener itself, so an
 * event added to `MediaTransportListener` fails to compile here until a subject can produce it. A fake
 * calls a command of its own; an implementation over a fakeable wire drives that wire until the plane
 * reports the event by itself.
 */
export type MediaPlaneReporter = MediaTransportListener;

/**
 * What the suite needs beyond the contract to drive a plane. None of it is a method of `MediaTransport`
 * - a real implementation is not asked to grow one: a subject produces each of these by whatever its
 * plane is built on, and the suite never learns which.
 */
export type MediaPlaneControl = {
	/** Makes the plane report an event of the contract, as the plane itself would. */
	report: MediaPlaneReporter,
	/** That intent of the plane answers this very failure from now on. */
	failIntent: (intent: MediaTransportIntent, error: TransportError) => void,
	/**
	 * Spends the whole injected budget of recovery, ending with that failure: the plane runs its cycle
	 * and finds nothing left to try, which is the one path to the terminal failure the contract declares.
	 */
	spendRecoveryBudget: (error: TransportError) => void,
};

/** One plane together with the seam it is steered through; a case gets a fresh pair. */
export type MediaTransportUnderTest = {
	transport: MediaTransport,
	plane: MediaPlaneControl,
};

/** Everything the suite needs to drive one implementation without knowing which one it is. */
export type MediaTransportConformanceSubject = {
	/** Name the cases are reported under. */
	name: string,
	/** A connection this plane can be raised for; which schema answered it is knowledge of the subject. */
	descriptor: ConnectionDescriptor,
	/** The canonical side of the call the intents and the events of the suite are about. */
	participantId: ParticipantId,
	/** A local track of that surface, obtained however the subject obtains one. */
	createTrack: (kind: MediaTrackKind) => MediaStreamTrack,
	/** A fresh plane reporting to that consumer: two cases never share one. */
	create: (listener: MediaTransportListener) => MediaTransportUnderTest,
};

/** The opaque source of one stream of remote media; never derived from a participant. */
const ENDPOINT: MediaEndpointId = 'media-endpoint-of-a-plane-under-conformance';

const MUTED_SURFACE: RemoteMuteKind = 'microphone';

/** The failure a plane answers an intent with once the suite has programmed one. */
const INTENT_REFUSED: TransportError = { kind: 'contract', code: 'plane.intent_refused' };

/** What ends a cycle of recovery, and what a terminal failure of the plane carries. */
const RECOVERY_LOST: TransportError = { kind: 'network' };

/** The reason media held for an endpoint is let go; a code, as the contract of the events has it. */
const ENDPOINT_UNRESOLVABLE: TransportError = { kind: 'contract', code: 'plane.endpoint_unresolvable' };

type RecordedEvent = {
	event: PlaneEvent,
	args: readonly unknown[],
};

/** The consumer above the plane: it writes down what it was told and answers nothing. */
class RecordingConsumer implements MediaTransportListener
{
	#events: RecordedEvent[] = [];

	onRemoteTrackAdded(participantId: ParticipantId, track: MediaStreamTrack): void
	{
		this.#note('onRemoteTrackAdded', [participantId, track]);
	}

	onRemoteTrackRemoved(participantId: ParticipantId, kind: MediaTrackKind): void
	{
		this.#note('onRemoteTrackRemoved', [participantId, kind]);
	}

	onRemoteTrackMuted(participantId: ParticipantId, kind: RemoteMuteKind, isMuted: boolean): void
	{
		this.#note('onRemoteTrackMuted', [participantId, kind, isMuted]);
	}

	onConnectionQualityChanged(participantId: ParticipantId, quality: Quality): void
	{
		this.#note('onConnectionQualityChanged', [participantId, quality]);
	}

	onReconnecting(): void
	{
		this.#note('onReconnecting', []);
	}

	onReconnected(): void
	{
		this.#note('onReconnected', []);
	}

	onFailure(error: TransportError): void
	{
		this.#note('onFailure', [error]);
	}

	onUnresolvedRemoteTrack(endpointId: MediaEndpointId, track: MediaStreamTrack): void
	{
		this.#note('onUnresolvedRemoteTrack', [endpointId, track]);
	}

	onUnresolvedRemoteTrackDropped(endpointId: MediaEndpointId, error: TransportError): void
	{
		this.#note('onUnresolvedRemoteTrackDropped', [endpointId, error]);
	}

	getEvents(): RecordedEvent[]
	{
		return [...this.#events];
	}

	getNames(): PlaneEvent[]
	{
		return this.#events.map((entry) => entry.event);
	}

	#note(event: PlaneEvent, args: readonly unknown[]): void
	{
		this.#events.push({ event, args });
	}
}

function fail(message: string): never
{
	throw new Error(`media transport conformance: ${message}`);
}

function check(condition: boolean, message: string): void
{
	if (!condition)
	{
		fail(message);
	}
}

function isResultShape(outcome: unknown): boolean
{
	if (typeof outcome !== 'object' || outcome === null)
	{
		return false;
	}

	return typeof (outcome as { ok?: unknown }).ok === 'boolean';
}

/**
 * The outcome of one intent, once the two guarantees that come before any outcome are known to hold: an
 * intent answers rather than throws, and what it answers is a `Result`.
 */
async function settle(
	intent: MediaTransportIntent,
	call: () => Promise<IntentOutcome>,
): Promise<IntentOutcome>
{
	let pending: Promise<IntentOutcome>;

	try
	{
		pending = call();
	}
	catch (thrown)
	{
		return fail(`${intent} threw "${String(thrown)}" instead of answering with a Result`);
	}

	let outcome: unknown;

	try
	{
		outcome = await pending;
	}
	catch (thrown)
	{
		return fail(`${intent} failed with "${String(thrown)}" instead of answering with a Result`);
	}

	check(
		isResultShape(outcome),
		`${intent} must answer with a Result, so a caller reads the outcome in the type`,
	);

	return outcome as IntentOutcome;
}

function failureOf(intent: MediaTransportIntent, outcome: IntentOutcome): TransportError
{
	if (!isErr(outcome))
	{
		return fail(`${intent} answered success while the plane was refusing it`);
	}

	return outcome.error;
}

function expectOk(intent: MediaTransportIntent, outcome: IntentOutcome): void
{
	if (isErr(outcome))
	{
		fail(`${intent} answered the failure "${outcome.error.kind}" while the plane was accepting it`);
	}
}

/** The events the consumer heard beyond the ones a case had already accounted for. */
function eventsAfter(consumer: RecordingConsumer, known: number): RecordedEvent[]
{
	return consumer.getEvents().slice(known);
}

function sameArgs(recorded: readonly unknown[], expected: readonly unknown[]): boolean
{
	if (recorded.length !== expected.length)
	{
		return false;
	}

	return expected.every((value, at) => recorded[at] === value);
}

/**
 * The media one case works with, obtained per case: the same instance a publish is handed is the one the
 * plane has to keep, and no two cases share a track.
 */
type CaseMedia = {
	audio: MediaStreamTrack,
	video: MediaStreamTrack,
	screen: MediaStreamTrack,
	screenAudio: MediaStreamTrack,
};

function createMedia(subject: MediaTransportConformanceSubject): CaseMedia
{
	return {
		audio: subject.createTrack(MediaTrackKind.Audio),
		video: subject.createTrack(MediaTrackKind.Video),
		screen: subject.createTrack(MediaTrackKind.Screen),
		screenAudio: subject.createTrack(MediaTrackKind.ScreenAudio),
	};
}

/**
 * Every intent of the contract, keyed by the derived name of it: an intent added to `MediaTransport`
 * fails to compile here until the suite knows how to call it. The media of the case is passed in rather
 * than captured, so nothing is obtained while the cases are being declared.
 */
const INTENT_CALLS: Record<
	MediaTransportIntent,
	(
		transport: MediaTransport,
		subject: MediaTransportConformanceSubject,
		media: CaseMedia,
	) => Promise<IntentOutcome>
> = {
	connect: (transport, subject) => transport.connect(subject.descriptor),
	disconnect: (transport) => transport.disconnect(),
	publishAudio: (transport, subject, media) => transport.publishAudio(media.audio),
	unpublishAudio: (transport) => transport.unpublishAudio(),
	publishVideo: (transport, subject, media) => transport.publishVideo(media.video),
	unpublishVideo: (transport) => transport.unpublishVideo(),
	publishScreen: (transport, subject, media) => transport.publishScreen(media.screen),
	unpublishScreen: (transport) => transport.unpublishScreen(),
	publishScreenAudio: (transport, subject, media) => transport.publishScreenAudio(media.screenAudio),
	unpublishScreenAudio: (transport) => transport.unpublishScreenAudio(),
	setRemoteQuality: (transport, subject) => transport.setRemoteQuality(subject.participantId, Quality.High),
};

const INTENTS: readonly MediaTransportIntent[] = Object.keys(INTENT_CALLS) as MediaTransportIntent[];

/**
 * Every event of the contract, keyed by the derived name of it: an event added to
 * `MediaTransportListener` fails to compile here until the suite states how a plane reports it. One
 * function both reports the event and answers the payload the consumer must read off it, so the two can
 * never drift apart.
 */
const EVENT_REPORTS: Record<
	PlaneEvent,
	(
		reporter: MediaPlaneReporter,
		subject: MediaTransportConformanceSubject,
		media: CaseMedia,
	) => readonly unknown[]
> = {
	onRemoteTrackAdded: (reporter, subject, media) => {
		reporter.onRemoteTrackAdded(subject.participantId, media.video);

		return [subject.participantId, media.video];
	},
	onRemoteTrackRemoved: (reporter, subject) => {
		reporter.onRemoteTrackRemoved(subject.participantId, MediaTrackKind.Video);

		return [subject.participantId, MediaTrackKind.Video];
	},
	onRemoteTrackMuted: (reporter, subject) => {
		reporter.onRemoteTrackMuted(subject.participantId, MUTED_SURFACE, true);

		return [subject.participantId, MUTED_SURFACE, true];
	},
	onConnectionQualityChanged: (reporter, subject) => {
		reporter.onConnectionQualityChanged(subject.participantId, Quality.Low);

		return [subject.participantId, Quality.Low];
	},
	onReconnecting: (reporter) => {
		reporter.onReconnecting();

		return [];
	},
	onReconnected: (reporter) => {
		reporter.onReconnected();

		return [];
	},
	onFailure: (reporter) => {
		reporter.onFailure(RECOVERY_LOST);

		return [RECOVERY_LOST];
	},
	onUnresolvedRemoteTrack: (reporter, subject, media) => {
		reporter.onUnresolvedRemoteTrack(ENDPOINT, media.audio);

		return [ENDPOINT, media.audio];
	},
	onUnresolvedRemoteTrackDropped: (reporter) => {
		reporter.onUnresolvedRemoteTrackDropped(ENDPOINT, ENDPOINT_UNRESOLVABLE);

		return [ENDPOINT, ENDPOINT_UNRESOLVABLE];
	},
};

const PLANE_EVENTS: readonly PlaneEvent[] = Object.keys(EVENT_REPORTS) as PlaneEvent[];

/** One plane, the consumer it reports to and the media of the case - what every case starts from. */
type Started = {
	tested: MediaTransportUnderTest,
	consumer: RecordingConsumer,
	media: CaseMedia,
};

function start(subject: MediaTransportConformanceSubject): Started
{
	const consumer = new RecordingConsumer();

	return { tested: subject.create(consumer), consumer, media: createMedia(subject) };
}

/**
 * Brings a plane to commit the way the contract defines it: connected, and carrying the local surfaces it
 * was handed. No remote media takes part - which is the point of the case that reads this.
 */
async function reachCommit(subject: MediaTransportConformanceSubject, started: Started): Promise<void>
{
	const { transport } = started.tested;

	for (const intent of ['connect', 'publishAudio', 'publishVideo'] as MediaTransportIntent[])
	{
		expectOk(
			intent,
			await settle(intent, () => INTENT_CALLS[intent](transport, subject, started.media)),
		);
	}
}

/**
 * Raises the plane the intent under test is called on. Nothing in the contract says what an intent
 * answers on a plane that was never connected - publishing into a connection that does not exist is a
 * refusal a real implementation is entitled to - so the suite asks for nothing before the connection is
 * up. `connect` is the one intent that is the step itself and gets no preamble.
 */
async function raiseFor(
	intent: MediaTransportIntent,
	subject: MediaTransportConformanceSubject,
	started: Started,
): Promise<void>
{
	if (intent === 'connect')
	{
		return;
	}

	expectOk(
		'connect',
		await settle('connect', () => INTENT_CALLS.connect(started.tested.transport, subject, started.media)),
	);
}

/**
 * Runs the contract of `MediaTransport` against one implementation. The subject hides which plane it is;
 * the runner is the bdd interface the cases are declared through - injected rather than imported, because
 * this extension is built as a runtime one and a test framework has no place among its dependencies.
 */
export function runMediaTransportConformance(
	subject: MediaTransportConformanceSubject,
	runner: ConformanceRunner,
): void
{
	const { describe, it } = runner;

	describe(`${subject.name} as a MediaTransport`, () => {
		describe('the intents', () => {
			INTENTS.forEach((intent) => {
				it(`answers ${intent} with a Result and throws nothing`, async () => {
					const started = start(subject);
					const { tested, media } = started;

					await raiseFor(intent, subject, started);

					expectOk(
						intent,
						await settle(intent, () => INTENT_CALLS[intent](tested.transport, subject, media)),
					);
				});
			});

			INTENTS.forEach((intent) => {
				it(`carries the failure of ${intent} in the Result it answers`, async () => {
					const started = start(subject);
					const { tested, media } = started;

					await raiseFor(intent, subject, started);
					tested.plane.failIntent(intent, INTENT_REFUSED);

					const outcome = await settle(
						intent,
						() => INTENT_CALLS[intent](tested.transport, subject, media),
					);
					const error = failureOf(intent, outcome);

					check(
						error.kind === INTENT_REFUSED.kind,
						`the plane refused with "${INTENT_REFUSED.kind}" and the intent answered "${error.kind}"`,
					);
				});
			});

			it('reports no event of its own while the intents are called', async () => {
				const { tested, consumer, media } = start(subject);

				for (const intent of INTENTS)
				{
					await settle(intent, () => INTENT_CALLS[intent](tested.transport, subject, media));
				}

				check(
					consumer.getEvents().length === 0,
					`the outcome of an intent travels in its Result, and these arrived as events: ${
						consumer.getNames().join(', ')
					}`,
				);
			});
		});

		describe('the events of the plane', () => {
			PLANE_EVENTS.forEach((event) => {
				it(`delivers ${event} with the payload the plane reported`, async () => {
					const { tested, consumer, media } = start(subject);
					const expected = EVENT_REPORTS[event](tested.plane.report, subject, media);
					const delivered = consumer.getEvents();

					check(delivered.length === 1, `${event} must reach the consumer exactly once`);
					check(
						delivered[0].event === event,
						`the plane reported ${event} and the consumer heard ${delivered[0].event}`,
					);
					check(
						sameArgs(delivered[0].args, expected),
						`the payload of ${event} did not arrive as it was reported`,
					);
				});
			});
		});

		describe('commit of the plane', () => {
			it('reaches commit on the connection and the local media alone', async () => {
				const started = start(subject);

				await reachCommit(subject, started);

				check(
					started.consumer.getEvents().length === 0,
					'commit is the connection plus published local media: no remote media is awaited for it',
				);
			});

			it('takes remote media in once it committed', async () => {
				const started = start(subject);

				await reachCommit(subject, started);

				const expected = EVENT_REPORTS.onRemoteTrackAdded(
					started.tested.plane.report,
					subject,
					started.media,
				);
				const delivered = started.consumer.getEvents();

				check(delivered.length === 1, 'a committed plane carries remote media to the consumer');
				check(
					sameArgs(delivered[0].args, expected),
					'remote media of a committed plane is named by its participant and arrives as it came',
				);
			});
		});

		describe('recovery', () => {
			it('ends a spent budget of recovery in the terminal failure', async () => {
				const started = start(subject);

				await reachCommit(subject, started);

				started.tested.plane.spendRecoveryBudget(RECOVERY_LOST);

				const names = started.consumer.getNames();
				const failureAt = names.indexOf('onFailure');
				const startedAt = names.indexOf('onReconnecting');

				check(
					failureAt >= 0,
					`a spent budget must end in a failure, and these arrived: ${names.join(', ')}`,
				);
				check(
					startedAt >= 0 && startedAt < failureAt,
					'a cycle of recovery is announced before it is given up',
				);
				check(
					!names.includes('onReconnected'),
					'a cycle that spent its budget did not reconnect, so it must not say it did',
				);
			});

			it('carries the typed error of the condition that ended the cycle', async () => {
				const { tested, consumer } = start(subject);

				tested.plane.spendRecoveryBudget(RECOVERY_LOST);

				const failure = consumer.getEvents().find((entry) => entry.event === 'onFailure');

				check(failure !== undefined, 'a spent budget must reach the consumer as a failure');
				check(
					sameArgs(failure?.args ?? [], [RECOVERY_LOST]),
					'the terminal failure carries the error the plane was given, and not one of its own',
				);
			});
		});

		describe('teardown', () => {
			it('answers nothing and changes nothing on a second close', async () => {
				const started = start(subject);

				await reachCommit(subject, started);

				const known = started.consumer.getEvents().length;
				const outcome: unknown = started.tested.transport.close();

				check(outcome === undefined, 'teardown answers no result: a plane that is gone cannot fail to go');

				started.tested.transport.close();

				check(
					eventsAfter(started.consumer, known).length === 0,
					'a repeated close is a no-op, and neither close reports anything to the consumer',
				);
			});

			INTENTS.forEach((intent) => {
				it(`refuses ${intent} after the close`, async () => {
					const started = start(subject);
					const { tested, media } = started;

					await raiseFor(intent, subject, started);

					expectOk(
						intent,
						await settle(intent, () => INTENT_CALLS[intent](tested.transport, subject, media)),
					);

					tested.transport.close();

					const refused = await settle(
						intent,
						() => INTENT_CALLS[intent](tested.transport, subject, media),
					);
					const error = failureOf(intent, refused);

					check(
						error.kind === 'contract',
						`${intent} of a plane that was torn down must be refused as a contract failure, `
							+ `and this one answered "${error.kind}"`,
					);
				});
			});

			PLANE_EVENTS.forEach((event) => {
				it(`cuts ${event} off after the close`, async () => {
					const { tested, consumer, media } = start(subject);

					EVENT_REPORTS[event](tested.plane.report, subject, media);

					check(
						consumer.getNames().includes(event),
						`${event} must reach the consumer while the plane serves, or this case proves nothing`,
					);

					const known = consumer.getEvents().length;

					tested.transport.close();
					EVENT_REPORTS[event](tested.plane.report, subject, media);

					check(
						eventsAfter(consumer, known).length === 0,
						`${event} reached the consumer after the plane was torn down`,
					);
				});
			});
		});
	});
}
