import { err, isErr, ok } from '../error/result';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import { isWireRecord } from '../port/envelope-readers';
import type { RestActionName, RestActionPayload, RestPort } from '../port/rest-port';

/** Finishing a call is the one action both schemas are served by, so it is spelled once. */
export const FINISH_ACTION: RestActionName = 'call.CallManager.finish';

/** Boolean flags travel as this pair of letters across the whole presence contract. */
export function toWireFlag(value: boolean): string
{
	return value ? 'Y' : 'N';
}

/**
 * Outcome of an intent the schema has no wire for: nothing was sent and nothing failed, so the
 * lifecycle above carries on instead of seeing a refusal that no server ever stated.
 */
export function nothingToSend(): Promise<Result<void, TransportError>>
{
	return Promise.resolve(ok(undefined));
}

/** Stands in for a refusal that named no code, so a refusal is never reported as anything else. */
const UNNAMED_REFUSAL_CODE = 'unknown';

/** The code the action answered with, kept as it came; a number stays a number. */
function readRefusalCode(code: unknown): string | number
{
	if (typeof code === 'number')
	{
		return code;
	}

	return typeof code === 'string' && code.length > 0 ? code : UNNAMED_REFUSAL_CODE;
}

function readRefusalMessage(message: unknown): string | undefined
{
	return typeof message === 'string' && message.length > 0 ? message : undefined;
}

/**
 * The refusal a presence action states inside the data of an answer the envelope calls successful:
 * `result: false` beside the code and the message of the refusal, and no error on the envelope. Only
 * that shape is a verdict - data without the field states nothing and is left alone - and an action
 * that refuses with no marker at all stays indistinguishable from a served one until it names one.
 */
function readRefusalInData(data: unknown): TransportError | undefined
{
	if (!isWireRecord(data) || data.result !== false)
	{
		return undefined;
	}

	return {
		kind: 'contract',
		code: readRefusalCode(data.errorCode),
		message: readRefusalMessage(data.errorMessage),
	};
}

export type SignalingRestChannelOptions = {
	rest: RestPort,
	/** Fields that name the call, as the actions of this schema address it. */
	callFields: RestActionPayload,
	/** Instance sending on behalf of the user; a second device of the same user is told apart by it. */
	callInstanceId: string,
	/** Id of a single send, generated per call: the presence actions expect one on every request. */
	requestIdFactory: () => string,
};

/**
 * The action half of a signaling gateway: one call with the envelope of its schema around it. Shared
 * by both gateways because the envelope is the same everywhere - what the call is, who is sending and
 * a fresh id per send - and only the fields naming the call differ between the schemas.
 *
 * The envelope is applied over the payload, not under it, so no intent can talk the gateway out of
 * the identity of its own connection. The answer is read for one thing: part of the refusals of these
 * actions travel inside the data of an answer the envelope calls successful, so an intent judged by
 * the envelope alone would be reported as sent while the server changed nothing. Everything else in
 * the answer is dropped - a presence intent has no data of its own to carry back.
 */
export class SignalingRestChannel
{
	#rest: RestPort;
	#callFields: RestActionPayload;
	#callInstanceId: string;
	#createRequestId: () => string;

	constructor(options: SignalingRestChannelOptions)
	{
		this.#rest = options.rest;
		this.#callFields = options.callFields;
		this.#callInstanceId = options.callInstanceId;
		this.#createRequestId = options.requestIdFactory;
	}

	async send(action: RestActionName, payload: RestActionPayload = {}): Promise<Result<void, TransportError>>
	{
		const answer = await this.#rest.callAction(action, {
			...payload,
			...this.#callFields,
			callInstanceId: this.#callInstanceId,
			requestId: this.#createRequestId(),
		});

		if (isErr(answer))
		{
			return answer;
		}

		const refusal = readRefusalInData(answer.value);

		return refusal === undefined ? ok(undefined) : err(refusal);
	}
}
