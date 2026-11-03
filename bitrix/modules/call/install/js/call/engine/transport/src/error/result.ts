import type { TransportError } from './transport-error';

export type Ok<T> = {
	ok: true,
	value: T,
};

export type Err<E> = {
	ok: false,
	error: E,
};

/**
 * Outcome of a one-shot transport operation. Every contract failure travels here, so the caller sees
 * the error type at compile time: a rejected promise carries `unknown` and is left for the failures
 * that are genuinely exceptional rather than part of the contract.
 */
export type Result<T, E = TransportError> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T>
{
	return { ok: true, value };
}

export function err<E>(error: E): Err<E>
{
	return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T>
{
	return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E>
{
	return !result.ok;
}
