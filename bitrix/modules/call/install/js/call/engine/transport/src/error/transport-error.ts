export type NetworkError = {
	kind: 'network',
	cause?: unknown,
};

export type TimeoutError = {
	kind: 'timeout',
};

/**
 * A refusal: access to a device or a right on the server. `reason` tells the outcomes of one refusal
 * apart without adding a kind; its vocabulary belongs to the component that produces the refusal.
 */
export type DeniedError = {
	kind: 'denied',
	reason: string,
};

/** Cancellation through the injected signal. */
export type Cancelled = {
	kind: 'cancelled',
};

/** Failure of a server contract; `code` is the code the server answered with, kept as it came. */
export type ContractError = {
	kind: 'contract',
	code: string | number,
	message?: string,
};

/**
 * Contract failure of a transport operation, discriminated by `kind`: a consumer switches on it
 * without losing typing. Nothing leaves the transport as a bare error string.
 */
export type TransportError =
	| NetworkError
	| TimeoutError
	| DeniedError
	| Cancelled
	| ContractError;

export function isCancelled(error: TransportError): error is Cancelled
{
	return error.kind === 'cancelled';
}
