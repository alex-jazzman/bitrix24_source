import { isErr } from 'call.engine.transport';
import type {
	ParticipantId,
	PullPayload,
	PullSignal,
	RestActionName,
	RestActionPayload,
	Result,
	SignalingGateway,
	TransportError,
} from 'call.engine.transport';
import type { ConformanceRunner } from './acquisition-conformance';

/**
 * What every `SignalingGateway` owes its caller, whatever schema it speaks. The checks below are about
 * what the two schemas share and nothing else: the same set of intents, the same shape of an answer,
 * the same envelope around an action, and an intent with no wire that sends nothing and still succeeds.
 *
 * What legitimately differs is left alone on purpose - the name of an action, the field a call is named
 * by, the signal a message is published under and which intents have a wire at all belong to the test
 * of that implementation, not here. A subject supplies a factory and the two wires its implementation
 * reaches, and declares which of its intents lead nowhere; the suite never learns which schema it holds.
 */

type SendOutcome = Result<void, TransportError>;

/** One action the implementation reached, with the payload it was called with. */
export type SentAction = {
	action: RestActionName,
	payload?: RestActionPayload,
};

/** One message the implementation published, kept whole - addressing and lifetime as they were given. */
export type PublishedMessage = {
	recipients: ParticipantId[],
	signal: PullSignal,
	payload: PullPayload,
	expirySeconds?: number,
};

/**
 * The two wires a gateway can reach, as far as the suite reads and steers them. Whichever ports are
 * behind them, and which of the two a schema uses at all, is knowledge of the subject alone.
 */
export type SignalingWire = {
	getActions: () => SentAction[],
	getPublished: () => PublishedMessage[],
	/** Every action of this implementation answers that failure from now on. */
	failEverySendWith: (error: TransportError) => void,
};

/** One implementation together with the wires it was built around; a case gets a fresh pair. */
export type SignalingGatewayUnderTest = {
	gateway: SignalingGateway,
	wire: SignalingWire,
};

/** Everything the suite needs to drive one implementation without knowing which one it is. */
export type SignalingGatewayConformanceSubject = {
	/** Name the cases are reported under. */
	name: string,
	/** Instance id the subject builds its implementation with; every envelope has to carry it. */
	callInstanceId: string,
	/**
	 * Intents this schema has no wire for. Each name is checked against the intents of the contract, so
	 * a misspelled one fails the suite instead of quietly excusing an intent from every case.
	 */
	intentsWithoutWire: readonly string[],
	/**
	 * A fresh implementation and its wires: two cases never share one. It is built with a request id
	 * factory that answers a different id every time, which is what the check of a fresh id per send
	 * reads.
	 */
	create: () => SignalingGatewayUnderTest,
};

type ActionIntent = {
	/** Method of the contract the case exercises; the coverage guard below reads it too. */
	method: string,
	name: string,
	send: (gateway: SignalingGateway) => Promise<SendOutcome>,
};

type PublishIntent = {
	method: string,
	name: string,
	publish: (gateway: SignalingGateway) => void,
};

/** The side an addressed message goes to; who they are means nothing to the contract. */
const RECIPIENTS: ParticipantId[] = ['7', '9'];

/** Intents that reach the server and answer a `Result` the caller reads a refusal out of. */
const ACTION_INTENTS: readonly ActionIntent[] = [
	{
		method: 'sendInvite',
		name: 'an invite',
		send: (gateway) => gateway.sendInvite({ recipients: RECIPIENTS, isVideo: true }),
	},
	{
		method: 'sendAnswerViaRest',
		name: 'an answer',
		send: (gateway) => gateway.sendAnswerViaRest(),
	},
	{
		method: 'sendDecline',
		name: 'a decline',
		send: (gateway) => gateway.sendDecline({ code: 603 }),
	},
	{
		method: 'sendHangupViaRest',
		name: 'a hangup',
		send: (gateway) => gateway.sendHangupViaRest({ retransmit: true }),
	},
	{
		method: 'sendPingToBackendViaRest',
		name: 'a keepalive of the server',
		send: (gateway) => gateway.sendPingToBackendViaRest({ retransmit: false }),
	},
	{
		method: 'sendFinish',
		name: 'finishing the call',
		send: (gateway) => gateway.sendFinish(),
	},
];

/** Intents that go to the peers over the channel and answer nothing, the channel reporting no delivery. */
const PUBLISH_INTENTS: readonly PublishIntent[] = [
	{
		method: 'sendAnswerViaPull',
		name: 'an answer',
		publish: (gateway) => gateway.sendAnswerViaPull(RECIPIENTS),
	},
	{
		method: 'sendHangupViaPull',
		name: 'a hangup',
		publish: (gateway) => gateway.sendHangupViaPull(RECIPIENTS),
	},
	{
		method: 'sendPingToPeersViaPull',
		name: 'a keepalive of the peers',
		publish: (gateway) => gateway.sendPingToPeersViaPull(RECIPIENTS),
	},
];

const INTENT_METHODS: readonly string[] = [
	...ACTION_INTENTS.map((intent) => intent.method),
	...PUBLISH_INTENTS.map((intent) => intent.method),
];

function fail(message: string): never
{
	throw new Error(`signaling gateway conformance: ${message}`);
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

/** The outcome of a send, once it is known that it answered instead of breaking. */
async function settle(intent: ActionIntent, tested: SignalingGatewayUnderTest): Promise<SendOutcome>
{
	let outcome: unknown;

	try
	{
		outcome = await intent.send(tested.gateway);
	}
	catch (thrown)
	{
		return fail(`"${intent.method}" failed with "${String(thrown)}" instead of answering with a Result`);
	}

	check(
		isResultShape(outcome),
		`"${intent.method}" must answer with a Result, so the caller reads the outcome in the type`,
	);

	return outcome as SendOutcome;
}

function failureOf(outcome: SendOutcome): TransportError | undefined
{
	return isErr(outcome) ? outcome.error : undefined;
}

function methodsOf(gateway: SignalingGateway): string[]
{
	return Object.getOwnPropertyNames(Object.getPrototypeOf(gateway) as object).filter(
		(name) => name !== 'constructor',
	);
}

function hasWire(subject: SignalingGatewayConformanceSubject, method: string): boolean
{
	return !subject.intentsWithoutWire.includes(method);
}

function wiredActions(subject: SignalingGatewayConformanceSubject): ActionIntent[]
{
	return ACTION_INTENTS.filter((intent) => hasWire(subject, intent.method));
}

function wiredPublishes(subject: SignalingGatewayConformanceSubject): PublishIntent[]
{
	return PUBLISH_INTENTS.filter((intent) => hasWire(subject, intent.method));
}

/** How many times the implementation reached a wire of any kind. */
function wireCallCount(tested: SignalingGatewayUnderTest): number
{
	return tested.wire.getActions().length + tested.wire.getPublished().length;
}

/** The single action of a send, asserted to have happened before anything is read off it. */
function onlyAction(intent: ActionIntent, tested: SignalingGatewayUnderTest): SentAction
{
	const actions = tested.wire.getActions();

	check(actions.length === 1, `"${intent.method}" reached the server ${actions.length} times instead of once`);

	return actions[0];
}

/**
 * Runs the contract of `SignalingGateway` against one implementation. The subject hides which schema it
 * is; the runner is the bdd interface the cases are declared through.
 */
export function runSignalingGatewayConformance(
	subject: SignalingGatewayConformanceSubject,
	runner: ConformanceRunner,
): void
{
	const { describe, it } = runner;

	describe(`${subject.name} as a SignalingGateway`, () => {
		describe('the contract it answers', () => {
			it('carries every intent of presence, whether or not its schema has a wire for one', async () => {
				const { gateway } = subject.create();

				INTENT_METHODS.forEach((method) => {
					check(
						typeof (gateway as unknown as { [name: string]: unknown })[method] === 'function',
						`the intent "${method}" is missing from this implementation`,
					);
				});
			});

			it('declares no intent of its own beyond the shared contract', async () => {
				const { gateway } = subject.create();
				const declared = methodsOf(gateway);

				check(declared.length > 0, 'an implementation must declare the intents it serves');
				declared.forEach((method) => {
					check(
						INTENT_METHODS.includes(method),
						`"${method}" is not an intent of the contract, so no schema may answer it alone`,
					);
				});
			});

			it('names only intents of the contract among those it has no wire for', async () => {
				subject.intentsWithoutWire.forEach((method) => {
					check(
						INTENT_METHODS.includes(method),
						`"${method}" is named as wireless and is no intent of the contract - a typo excuses nothing`,
					);
				});
			});
		});

		describe('an intent that reaches the server', () => {
			wiredActions(subject).forEach((intent) => {
				it(`answers ${intent.name} with a Result and publishes nothing`, async () => {
					const tested = subject.create();

					const outcome = await settle(intent, tested);

					onlyAction(intent, tested);
					check(
						tested.wire.getPublished().length === 0,
						`"${intent.method}" published a message while sending an action`,
					);
					check(
						failureOf(outcome) === undefined,
						`the server answered, so "${intent.method}" states no failure of its own`,
					);
				});
			});

			it('carries the instance of its connection and an id of the send in every action', async () => {
				const tested = subject.create();
				const intents = wiredActions(subject);

				await Promise.all(intents.map((intent) => intent.send(tested.gateway)));

				const actions = tested.wire.getActions();

				check(actions.length === intents.length, 'every intent with a wire must have reached the server');
				actions.forEach((action) => {
					const payload = action.payload ?? {};

					check(
						payload.callInstanceId === subject.callInstanceId,
						`"${action.action}" states the instance "${String(payload.callInstanceId)}" of another client`,
					);
					check(
						typeof payload.requestId === 'string' && payload.requestId.length > 0,
						`"${action.action}" carries no id of the send the server expects on every request`,
					);
				});
			});

			it('names a fresh id on every send', async () => {
				const tested = subject.create();
				const [intent] = wiredActions(subject);

				await intent.send(tested.gateway);
				await intent.send(tested.gateway);

				const actions = tested.wire.getActions();

				check(actions.length === 2, 'a repeated intent reaches the server again');
				check(
					(actions[0].payload ?? {}).requestId !== (actions[1].payload ?? {}).requestId,
					'two sends of one intent were given the same id, so a repeat is indistinguishable from a retry',
				);
			});

			wiredActions(subject).forEach((intent) => {
				it(`carries a failure of the port to the caller of ${intent.name}`, async () => {
					const tested = subject.create();
					const refusal: TransportError = { kind: 'network' };

					tested.wire.failEverySendWith(refusal);

					const outcome = await settle(intent, tested);

					onlyAction(intent, tested);
					check(
						failureOf(outcome)?.kind === refusal.kind,
						`the port said "${refusal.kind}" and "${intent.method}" said `
						+ `"${String(failureOf(outcome)?.kind)}"`,
					);
				});
			});
		});

		describe('an intent that goes to the peers', () => {
			wiredPublishes(subject).forEach((intent) => {
				it(`publishes ${intent.name} to the given side and reaches no action`, async () => {
					const tested = subject.create();

					intent.publish(tested.gateway);

					const published = tested.wire.getPublished();

					check(published.length === 1, `"${intent.method}" published ${published.length} messages`);
					check(
						published[0].recipients.join() === RECIPIENTS.join(),
						`"${intent.method}" addressed the message to "${published[0].recipients.join()}"`,
					);
					check(
						tested.wire.getActions().length === 0,
						`"${intent.method}" reached an action while publishing`,
					);
				});
			});

			it('answers nothing when it publishes, the channel reporting no delivery', async () => {
				const tested = subject.create();

				wiredPublishes(subject).forEach((intent) => {
					// a publish is typed `void`; the check is that no outcome is smuggled out of it anyway
					const answer = intent.publish(tested.gateway) as unknown;

					check(answer === undefined, `"${intent.method}" answered something a caller could branch on`);
				});
			});
		});

		describe('an intent its schema has no wire for', () => {
			ACTION_INTENTS.filter((intent) => !hasWire(subject, intent.method)).forEach((intent) => {
				it(`states ${intent.name} as sent while reaching nothing`, async () => {
					const tested = subject.create();

					const outcome = await settle(intent, tested);

					check(
						wireCallCount(tested) === 0,
						`"${intent.method}" has no wire in this schema and reached one anyway`,
					);
					check(
						failureOf(outcome) === undefined,
						'an absent wire is no failure of the lifecycle, so the intent answers success',
					);
				});
			});

			PUBLISH_INTENTS.filter((intent) => !hasWire(subject, intent.method)).forEach((intent) => {
				it(`publishes ${intent.name} nowhere and breaks nothing`, async () => {
					const tested = subject.create();

					intent.publish(tested.gateway);

					check(
						wireCallCount(tested) === 0,
						`"${intent.method}" has no wire in this schema and reached one anyway`,
					);
				});
			});
		});
	});
}
