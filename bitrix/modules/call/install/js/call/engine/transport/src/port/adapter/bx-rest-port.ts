import { err, ok } from '../../error/result';
import type { Result } from '../../error/result';
import type { TransportError } from '../../error/transport-error';
import { isWireRecord } from '../envelope-readers';
import type { RestActionName, RestActionPayload, RestPort } from '../rest-port';

/**
 * The slice of the ajax client this adapter drives: one call of one server action. Declared here and
 * injected rather than read off a global, so the port is constructible with a stand-in primitive.
 *
 * Which primitive carries the call is the choice of the adapter and does not reach a consumer: the
 * action-based client is the one both call schemas already speak (`call.CallManager.*` and
 * `call.Call.*` alike), while the rest-client of the legacy engine answers in a different shape and
 * would need a second normalizer. Picking between two primitives at runtime would be a fallback -
 * policy, which no port owns.
 */
export type AjaxActionRunner = {
	runAction(action: string, config: { data?: RestActionPayload }): Promise<unknown>,
};

/** Status of an answer that carries data; anything else is a refusal. */
const SUCCESS_STATUS = 'success';

/**
 * Code the ajax client puts on an answer it synthesized because none arrived - a transport failure
 * wearing the shape of a server refusal. It is the only way to tell the two apart at this boundary,
 * and it never leaves this file: outward it is the `network` variant.
 */
const NO_ANSWER_CODE = 'NETWORK_ERROR';

/** Stands in for a refusal that named no code, so a contract failure is never reported as anything else. */
const UNNAMED_ERROR_CODE = 'unknown';

type ActionAnswer = { [field: string]: unknown };

type AnswerError = {
	code: unknown,
	message: unknown,
};

/** An answer of the server is recognizable by its status; without one nothing arrived to read. */
function isActionAnswer(value: unknown): value is ActionAnswer
{
	return isWireRecord(value) && 'status' in value;
}

function readFirstError(answer: ActionAnswer): AnswerError | undefined
{
	const errors: unknown[] = Array.isArray(answer.errors) ? answer.errors : [];
	const first = errors.find((entry) => isWireRecord(entry));

	return isWireRecord(first) ? { code: first.code, message: first.message } : undefined;
}

/** The code the server answered with, kept as it came; a number stays a number. */
function readErrorCode(code: unknown): string | number
{
	if (typeof code === 'number')
	{
		return code;
	}

	return typeof code === 'string' && code.length > 0 ? code : UNNAMED_ERROR_CODE;
}

function readErrorMessage(message: unknown): string | undefined
{
	return typeof message === 'string' && message.length > 0 ? message : undefined;
}

/**
 * A refusal of the server becomes a `contract` error carrying its code; having no answer becomes
 * `network` - whether the client said so itself, rejected with something that is not an answer, or
 * answered something that cannot be read as one. A timeout is not told apart here on purpose: the
 * adapter sets none, so the one the client may have of its own arrives as an answer that never came.
 */
function toTransportError(rejection: unknown): TransportError
{
	if (!isActionAnswer(rejection))
	{
		return { kind: 'network', cause: rejection };
	}

	const first = readFirstError(rejection);

	if (first === undefined)
	{
		return { kind: 'contract', code: UNNAMED_ERROR_CODE };
	}

	if (first.code === NO_ANSWER_CODE)
	{
		return { kind: 'network', cause: rejection };
	}

	return { kind: 'contract', code: readErrorCode(first.code), message: readErrorMessage(first.message) };
}

/**
 * `RestPort` over the ajax action client. The whole job is normalizing one answer into a `Result`:
 * the data of a successful answer comes back as `Ok`, a refusal of the server and an answer that
 * never arrived as the matching `TransportError` - so a caller reads the failure in the type instead
 * of a `catch`, and neither the shape of the Bitrix answer nor the codes the client invents for
 * itself leak outward.
 *
 * The port has no cancellation: the primitive supports none, and whoever started the operation
 * watches its own signal.
 */
export class BxRestPort implements RestPort
{
	#ajax: AjaxActionRunner;

	constructor(ajax: AjaxActionRunner)
	{
		this.#ajax = ajax;
	}

	async callAction<TResult = unknown>(
		action: RestActionName,
		payload?: RestActionPayload,
	): Promise<Result<TResult>>
	{
		try
		{
			const answer = await this.#ajax.runAction(action, { data: payload });

			if (!isActionAnswer(answer) || answer.status !== SUCCESS_STATUS)
			{
				return err(toTransportError(answer));
			}

			// the caller owns the shape it asked for; the port carries the data without knowing it
			return ok(answer.data as TResult);
		}
		catch (rejection)
		{
			return err(toTransportError(rejection));
		}
	}
}
