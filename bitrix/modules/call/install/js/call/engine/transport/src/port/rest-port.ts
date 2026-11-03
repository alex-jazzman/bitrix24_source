import type { Result } from '../error/result';

/**
 * Name of a server action of a Bitrix module (`module.Controller.method`). An absolute URL is not one
 * and has no place here - that is `HttpPort`.
 */
export type RestActionName = string;

/** Data of an action call. The port forwards it as it came and never inspects it. */
export type RestActionPayload = {
	[field: string]: unknown,
};

/**
 * Raw REST channel: one call of one server action. A single method on purpose - which primitive
 * carries the call is a detail of the adapter, and normalizing the answer into a `Result` is the
 * whole job of the port. It decides nothing: whether an intent goes over REST at all is settled by
 * the caller.
 */
export interface RestPort
{
	/**
	 * Resolves with the data the action answered with; a refusal on the server and a broken answer
	 * both arrive as `Err`, so a caller sees the failure in the type instead of in a `catch`. The
	 * result type is left to the caller - the port carries the answer without knowing its shape.
	 */
	callAction<TResult = unknown>(action: RestActionName, payload?: RestActionPayload): Promise<Result<TResult>>;
}
