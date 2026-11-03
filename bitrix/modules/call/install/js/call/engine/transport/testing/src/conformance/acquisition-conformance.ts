import { AcquisitionContractCode, isErr, RoomType } from 'call.engine.transport';
import type {
	CallScheme,
	CancellationSignalProvider,
	ConnectionAcquisition,
	ConnectionDescriptor,
	ConnectionRequest,
	ContractError,
	Result,
	TransportError,
} from 'call.engine.transport';

/**
 * What every `ConnectionAcquisition` owes its caller, whatever wire it speaks. The checks below are
 * about the wiring of the contract and nothing else: which outcome an acquisition answers with, that
 * it answers rather than throws, and that a descriptor it hands back is one of the union. What travels
 * on the wire and how the server phrases it is the business of the test of that implementation, and a
 * live server is integration.
 *
 * Nothing here knows how the implementation is built or what it talks to: a subject supplies a factory
 * and a channel whose outcomes it programs into its own fake, so the two ports of the two schemas -
 * and the two shapes of a descriptor - stay behind that seam.
 */

type AcquireResult = Result<ConnectionDescriptor, TransportError>;

/**
 * The channel an implementation reaches its server through, as far as the suite steers it: one method
 * per outcome the contract has to face. Whether a rest action or an http request is behind them is
 * knowledge of the subject alone.
 */
export type AcquisitionChannel = {
	/** An answer a connection is read out of; it must carry the media-plane field the subject names. */
	answerWithConnection: () => void,
	/** An answer that arrived whole and still cannot be read as a connection. */
	answerWithUnreadableConnection: () => void,
	/** An answer claiming a schema other than the one this implementation acquires. */
	answerWithForeignScheme: () => void,
	/** The failure the port itself hands back - exactly the one given, so the suite owns the expectation. */
	failWith: (error: TransportError) => void,
	/** How many times the implementation reached the channel. */
	countCalls: () => number,
};

/** One implementation together with the channel it was built around; a case gets a fresh pair. */
export type AcquisitionUnderTest = {
	acquisition: ConnectionAcquisition,
	channel: AcquisitionChannel,
};

/** Everything the suite needs to drive one implementation without knowing which one it is. */
export type AcquisitionConformanceSubject = {
	/** Name the cases are reported under. */
	name: string,
	/** Schema every descriptor of this implementation carries. */
	scheme: CallScheme,
	/** A request this implementation accepts; it is of the schema above. */
	request: ConnectionRequest,
	/**
	 * Field of the media plane the connection answer carries and the descriptor must not. Named by the
	 * subject because only it knows the shape of its own answer.
	 */
	mediaPlaneField: string,
	/** A fresh implementation and its channel: two cases never share one. */
	create: (signalProvider?: CancellationSignalProvider) => AcquisitionUnderTest,
};

/**
 * The two declarations of a bdd runner the suite states itself through. Injected rather than imported:
 * this extension is built as a runtime one, so a test framework has no place among its dependencies.
 */
export type ConformanceRunner = {
	describe: (name: string, body: () => void) => void,
	it: (name: string, body: () => Promise<void>) => void,
};

const ROOM_TYPES: readonly number[] = Object.values(RoomType);

/** A caller that never cancels; the case about having no provider at all builds none instead. */
const NEVER_CANCELLED: CancellationSignalProvider = () => undefined;

function fail(message: string): never
{
	throw new Error(`acquisition conformance: ${message}`);
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

/** Starts one acquire, so that even a throw before the promise exists is reported as the broken promise it is. */
function startAcquire(
	subject: AcquisitionConformanceSubject,
	tested: AcquisitionUnderTest,
): Promise<AcquireResult>
{
	try
	{
		return tested.acquisition.acquire(subject.request);
	}
	catch (thrown)
	{
		return fail(`acquire threw "${String(thrown)}" instead of answering with a Result`);
	}
}

/** The outcome of an acquire, once the two guarantees that precede any outcome are known to hold. */
async function settle(pending: Promise<AcquireResult>): Promise<AcquireResult>
{
	let outcome: unknown;

	try
	{
		outcome = await pending;
	}
	catch (thrown)
	{
		return fail(`acquire failed with "${String(thrown)}" instead of answering with a Result`);
	}

	check(isResultShape(outcome), 'acquire must answer with a Result, so the caller reads the outcome in the type');

	return outcome as AcquireResult;
}

async function acquire(
	subject: AcquisitionConformanceSubject,
	tested: AcquisitionUnderTest,
): Promise<AcquireResult>
{
	return settle(startAcquire(subject, tested));
}

function descriptorOf(result: AcquireResult): ConnectionDescriptor
{
	if (isErr(result))
	{
		return fail(`expected a descriptor, got the failure "${result.error.kind}"`);
	}

	return result.value;
}

function failureOf(result: AcquireResult): TransportError
{
	if (!isErr(result))
	{
		return fail(`expected a failure, got a descriptor of the schema ${result.value.scheme}`);
	}

	return result.error;
}

function contractFailureOf(result: AcquireResult): ContractError
{
	const error = failureOf(result);

	if (error.kind !== 'contract')
	{
		return fail(`expected a broken contract, got the failure "${error.kind}"`);
	}

	return error;
}

/** Failures a port answers with, each of which must reach the caller under the kind the port chose. */
const PORT_FAILURES: readonly TransportError[] = [
	{ kind: 'network' },
	{ kind: 'timeout' },
	{ kind: 'denied', reason: 'access' },
];

/** Every outcome an acquisition can face, so the guarantees around a `Result` are checked on all of them. */
const PROGRAMMED_OUTCOMES: readonly { name: string, program: (channel: AcquisitionChannel) => void }[] = [
	{ name: 'a connection', program: (channel) => channel.answerWithConnection() },
	{ name: 'an unreadable answer', program: (channel) => channel.answerWithUnreadableConnection() },
	{ name: 'an answer of another schema', program: (channel) => channel.answerWithForeignScheme() },
	{ name: 'a failure of the port', program: (channel) => channel.failWith({ kind: 'network' }) },
];

/**
 * Runs the contract of `ConnectionAcquisition` against one implementation. The subject hides which
 * implementation it is; the runner is the bdd interface the cases are declared through.
 */
export function runAcquisitionConformance(
	subject: AcquisitionConformanceSubject,
	runner: ConformanceRunner,
): void
{
	const { describe, it } = runner;

	describe(`${subject.name} as a ConnectionAcquisition`, () => {
		describe('a connection it obtains', () => {
			it('answers a descriptor of the schema it acquires', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithConnection();

				const descriptor = descriptorOf(await acquire(subject, tested));

				check(
					descriptor.scheme === subject.scheme,
					`the descriptor states the schema ${descriptor.scheme} while the acquisition is ${subject.scheme}`,
				);
			});

			it('reaches its channel exactly once', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithConnection();
				descriptorOf(await acquire(subject, tested));

				check(
					tested.channel.countCalls() === 1,
					`one acquire reached the channel ${tested.channel.countCalls()} times`,
				);
			});

			it('answers a room type of the vocabulary, a start date and a creation flag', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithConnection();

				const descriptor = descriptorOf(await acquire(subject, tested));

				check(
					ROOM_TYPES.includes(descriptor.roomType),
					`the room type ${descriptor.roomType} is outside the vocabulary of the transport`,
				);
				check(
					typeof descriptor.startDate === 'number' || typeof descriptor.startDate === 'string',
					'a descriptor carries the start date the server named',
				);
				check(
					typeof descriptor.isNew === 'boolean',
					'a descriptor tells a connection that was created from one that was joined',
				);
			});

			it('carries nothing of the media plane', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithConnection();

				const descriptor = descriptorOf(await acquire(subject, tested));

				check(
					!Object.hasOwn(descriptor, subject.mediaPlaneField),
					`the descriptor carries "${subject.mediaPlaneField}", which belongs to the media plane`,
				);
			});

			it('answers the next acquire of the same instance as well', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithConnection();
				descriptorOf(await acquire(subject, tested));

				const second = descriptorOf(await acquire(subject, tested));

				check(second.scheme === subject.scheme, 'a repeated acquire answers a descriptor of the same schema');
				check(tested.channel.countCalls() === 2, 'a repeated acquire asks the server again');
			});

			it('acquires with no cancellation provider given at all', async () => {
				const tested = subject.create();

				tested.channel.answerWithConnection();

				const descriptor = descriptorOf(await acquire(subject, tested));

				check(
					descriptor.scheme === subject.scheme,
					'an acquisition nobody can cancel obtains its connection like any other',
				);
			});
		});

		describe('an answer it cannot accept', () => {
			it('answers an unreadable connection as a broken contract of the shared vocabulary', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithUnreadableConnection();

				const failure = contractFailureOf(await acquire(subject, tested));

				check(
					failure.code === AcquisitionContractCode.MalformedResponse,
					`the failure states the code "${String(failure.code)}" instead of a malformed answer`,
				);
			});

			it('answers a schema that is not its own as a broken contract instead of switching to it', async () => {
				const tested = subject.create(NEVER_CANCELLED);

				tested.channel.answerWithForeignScheme();

				const failure = contractFailureOf(await acquire(subject, tested));

				check(
					failure.code === AcquisitionContractCode.SchemeMismatch,
					`the failure states the code "${String(failure.code)}" instead of a schema mismatch`,
				);
			});
		});

		describe('a failure of the port', () => {
			PORT_FAILURES.forEach((error) => {
				it(`carries the failure "${error.kind}" under the kind the port gave it`, async () => {
					const tested = subject.create(NEVER_CANCELLED);

					tested.channel.failWith(error);

					const failure = failureOf(await acquire(subject, tested));

					check(
						failure.kind === error.kind,
						`the port said "${error.kind}" and the acquisition said "${failure.kind}"`,
					);
				});
			});

			it('carries the code of a contract failure of the port as it came', async () => {
				const tested = subject.create(NEVER_CANCELLED);
				const refusal: ContractError = {
					kind: 'contract',
					code: 'the_server_named_this',
					message: 'as the server put it',
				};

				tested.channel.failWith(refusal);

				const failure = contractFailureOf(await acquire(subject, tested));

				check(
					failure.code === refusal.code,
					`the code of the server arrived as "${String(failure.code)}"`,
				);
				check(failure.message === refusal.message, 'the message of the server travels with its code');
			});
		});

		describe('cancellation', () => {
			it('answers cancelled without reaching its channel when the signal is already aborted', async () => {
				const controller = new AbortController();

				controller.abort();

				const tested = subject.create(() => controller.signal);

				// a connection is programmed on purpose: an implementation ignoring the abort answers it
				tested.channel.answerWithConnection();

				const failure = failureOf(await acquire(subject, tested));

				check(failure.kind === 'cancelled', `an aborted acquisition answered "${failure.kind}"`);
				check(tested.channel.countCalls() === 0, 'a cancelled acquisition must not reach the server');
			});

			it('answers cancelled when the abort arrives while the channel is answering', async () => {
				const controller = new AbortController();
				const tested = subject.create(() => controller.signal);

				tested.channel.answerWithConnection();

				const pending = startAcquire(subject, tested);

				controller.abort();

				const failure = failureOf(await settle(pending));

				check(tested.channel.countCalls() === 1, 'the channel must have been reached before the abort');
				check(failure.kind === 'cancelled', 'a connection nobody waits for must not be answered');
			});

			it('answers the connection while the signal of the attempt is not aborted', async () => {
				const controller = new AbortController();
				const tested = subject.create(() => controller.signal);

				tested.channel.answerWithConnection();

				const descriptor = descriptorOf(await acquire(subject, tested));

				check(
					descriptor.scheme === subject.scheme,
					'an acquisition nobody cancelled answers the connection it obtained',
				);
			});

			it('stays with the signal the attempt started under', async () => {
				const started = new AbortController();
				const next = new AbortController();
				let current = started;
				const tested = subject.create(() => current.signal);

				tested.channel.answerWithConnection();

				const pending = startAcquire(subject, tested);

				current = next;
				started.abort();

				const failure = failureOf(await settle(pending));

				check(failure.kind === 'cancelled', 'the controller that started the attempt must cancel it');
			});
		});

		describe('the shape of every outcome', () => {
			PROGRAMMED_OUTCOMES.forEach(({ name, program }) => {
				it(`answers ${name} with a Result and throws nothing`, async () => {
					const tested = subject.create(NEVER_CANCELLED);

					program(tested.channel);

					const result = await acquire(subject, tested);

					check(
						tested.channel.countCalls() === 1,
						'the channel must have been reached before the outcome is read off it',
					);
					check(
						typeof result.ok === 'boolean',
						'the outcome of an acquire is read from the Result it answers with',
					);
				});
			});
		});
	});
}
