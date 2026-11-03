import type { ConnectionDescriptor } from '../domain/connection-descriptor';
import type { ConnectionRequest } from '../domain/connection-request';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';

/**
 * Hands over the signal the caller cancels an acquisition through. A provider rather than a signal:
 * one acquisition serves consecutive attempts - a retry, a re-acquire on escalation - and each of
 * them is cancelled through the controller that started it. An implementation reads the provider once
 * per `acquire` and stays with that signal for the whole operation.
 *
 * `AbortSignal` is the primitive `HttpPort` already takes, so a caller holds one controller for the
 * request and for the acquisition around it.
 */
export type CancellationSignalProvider = () => AbortSignal | undefined;

/**
 * Codes acquisition puts on a failure of an external contract - the case where an answer arrived but
 * cannot be read as a connection. Server codes are never rewritten into these: a refusal of the
 * server keeps the code it came with.
 */
export const AcquisitionContractCode: {
	readonly MalformedResponse: 'acquisition.malformed_response',
	readonly SchemeMismatch: 'acquisition.scheme_mismatch',
} = Object.freeze({
	MalformedResponse: 'acquisition.malformed_response',
	SchemeMismatch: 'acquisition.scheme_mismatch',
});

export type AcquisitionContractCode = typeof AcquisitionContractCode[keyof typeof AcquisitionContractCode];

/**
 * The one place the classic and the jwt schemas differ while a connection is being obtained: an
 * implementation knows how to ask its own server and answers with the normalized descriptor. Which
 * implementation runs is settled above the transport by `ConnectionRequest.scheme` - an
 * implementation never switches to the other schema by itself, and a schema in the answer that
 * contradicts the request is a broken external contract, not an instruction to switch.
 *
 * Everything the operation can fail with is part of the result: a refusal of the server, an answer
 * that cannot be read, and cancellation through the injected signal alike. Nothing is thrown for a
 * contract failure, so a caller reads the outcome in the type.
 */
export interface ConnectionAcquisition
{
	acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>;
}
