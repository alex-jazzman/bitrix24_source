import type { TransportError } from '../error/transport-error';
import { isWireRecord } from '../port/envelope-readers';

/**
 * Vocabulary of codes `/v2/join` refuses with. Part of the external contract of the balancer, so it
 * is declared here rather than imported: the transport reaches nothing of the legacy stack, and a
 * copy of a vocabulary is the price of that isolation.
 *
 * The numbers 4 and 6 are absent from the vocabulary of the server itself, so nothing is invented for
 * them - a code outside the list keeps the value it came with.
 */
export const JoinFailureCode: {
	readonly CanNotCreateRoom: 1,
	readonly InputError: 2,
	readonly AccessDenied: 3,
	readonly RoomNotFound: 5,
	readonly MalfunctioningSignaling: 7,
	readonly JsonParsingError: 'JsonParsingError',
	readonly UnexpectedResponse: 'UnexpectedResponse',
	readonly FailedRequest: 'FailedRequest',
	readonly AbortedRequest: 'AbortedRequest',
	readonly BodyReadError: 'BodyReadError',
	readonly UnknownError: 'UnknownError',
} = Object.freeze({
	CanNotCreateRoom: 1,
	InputError: 2,
	AccessDenied: 3,
	RoomNotFound: 5,
	MalfunctioningSignaling: 7,
	JsonParsingError: 'JsonParsingError',
	UnexpectedResponse: 'UnexpectedResponse',
	FailedRequest: 'FailedRequest',
	AbortedRequest: 'AbortedRequest',
	BodyReadError: 'BodyReadError',
	UnknownError: 'UnknownError',
});

export type JoinFailureCode = typeof JoinFailureCode[keyof typeof JoinFailureCode];

/**
 * Refusal of `/v2/join`, in the shape the answer carries it. `code` stays as it arrived - the server
 * owns its vocabulary, and a code nobody here knows is still the code of that refusal.
 */
export type JoinFailure = {
	code: string | number,
	message?: string,
};

/** How a refused access is reported; the vocabulary of `reason` belongs to whoever produces it. */
const DENIED_REASON = 'access';

/**
 * Reads the refusal block of an answer, and says there is none when the block cannot be read as one.
 * A code is taken exactly as typed on the wire: `3` is the refused access of the vocabulary while
 * `'3'` is a code nobody here knows, and coercing one into the other would invent a meaning.
 */
export function readJoinFailure(value: unknown): JoinFailure | undefined
{
	if (!isWireRecord(value))
	{
		return undefined;
	}

	const { code, message } = value;

	if (typeof code !== 'string' && typeof code !== 'number')
	{
		return undefined;
	}

	return typeof message === 'string' ? { code, message } : { code };
}

/**
 * Refusal of `/v2/join` as a transport failure. Three codes name an outcome the error model already
 * has a kind for; everything else stays a failure of the server contract under the code it came with,
 * which is what keeps `RoomNotFound` and `CanNotCreateRoom` tellable apart by whoever handles them.
 *
 * Deciding what to do about a code is not part of the mapping: recovery of a call the server no
 * longer has lives above the transport, and nothing here finishes, retries or re-acquires anything.
 */
export function toTransportError(failure: JoinFailure): TransportError
{
	switch (failure.code)
	{
		case JoinFailureCode.AccessDenied:
			return { kind: 'denied', reason: DENIED_REASON };

		case JoinFailureCode.FailedRequest:
			return { kind: 'network' };

		case JoinFailureCode.AbortedRequest:
			return { kind: 'cancelled' };

		default:
			return failure.message === undefined
				? { kind: 'contract', code: failure.code }
				: { kind: 'contract', code: failure.code, message: failure.message };
	}
}
