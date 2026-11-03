import { CallScheme } from '../domain/connection-descriptor';
import type { ClassicConnectionDescriptor, ConnectionDescriptor, RoomType } from '../domain/connection-descriptor';
import type { ConnectionRequest } from '../domain/connection-request';
import { err, isErr, ok } from '../error/result';
import type { Err, Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import { isWireRecord } from '../port/envelope-readers';
import type { RestActionPayload, RestPort } from '../port/rest-port';
import { readNonEmptyText, readNumber } from './answer-readers';
import { AcquisitionContractCode } from './connection-acquisition';
import type { CancellationSignalProvider, ConnectionAcquisition } from './connection-acquisition';

/**
 * Server action of the classic path: it answers with the call and its inline connection data, so no
 * balancer takes part in obtaining a classic connection.
 */
const CREATE_ACTION = 'call.CallManager.create';

/**
 * What the classic call is attached to on the server. It comes from the layer that started the call
 * and not from `ConnectionRequest`: the request describes the connection, while the entity behind it
 * is knowledge of the session above - the same way the jwt path takes its tokens as input.
 */
export type ClassicCallContext = {
	entityType: string,
	entityId: string,
};

export type ClassicConnectionAcquisitionOptions = {
	rest: RestPort,
	context: ClassicCallContext,
	/** Absent when the caller never cancels: an acquisition nobody aborts needs no controller. */
	signalProvider?: CancellationSignalProvider,
};

function contractError(code: AcquisitionContractCode, message: string): Err<TransportError>
{
	const error: TransportError = { kind: 'contract', code, message };

	return err(error);
}

function malformed(field: string): Err<TransportError>
{
	return contractError(AcquisitionContractCode.MalformedResponse, `${field} is missing or unreadable`);
}

function cancelled(): Err<TransportError>
{
	const error: TransportError = { kind: 'cancelled' };

	return err(error);
}

function isAborted(signal: AbortSignal | undefined): boolean
{
	return signal?.aborted === true;
}

/** Ids of the server start at one, so a zero, a fraction and an empty string are all "no id". */
function readServerCallId(value: unknown): number | undefined
{
	const id = readNumber(value);

	return id !== undefined && Number.isInteger(id) && id > 0 ? id : undefined;
}

/** The server sends a formatted date; a timestamp is accepted just as well and neither is parsed. */
function readStartDate(value: unknown): number | string | undefined
{
	if (typeof value === 'string')
	{
		return value.length > 0 ? value : undefined;
	}

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Only what the wire action declares travels in the body: the variators it does not accept are left
 * out rather than reshaped into parameters the server does not have. `mustCreate` is the create-vs-join
 * intent of the caller, which this action spells as its opposite.
 */
function toCreatePayload(request: ConnectionRequest, context: ClassicCallContext): RestActionPayload
{
	return {
		type: request.callType,
		provider: request.provider,
		entityType: context.entityType,
		entityId: context.entityId,
		joinExisting: !request.mustCreate,
	};
}

/**
 * Reads the answer of the action as a descriptor, and says so when it cannot be read as one. Kept
 * apart from the call itself: obtaining an answer and trusting its shape are two different jobs, and
 * only this one knows the fields of the classic answer.
 *
 * `isNew` is absent from the answer unless the server did create the call, so its absence is the
 * value `false` and not a broken answer. `connectionData` and `publicChannels` are opaque - both are
 * carried over as they came, absence included, because nothing here is entitled to judge them: the
 * addressing is read by the pull port, which owns what a channel descriptor is.
 *
 * The room type is not among the fields read here: `call.TYPE` of the answer is the type of the call
 * (instant, permanent, large) and not a kind of room, so the room type comes from the request, which
 * is where the kind of room asked for is stated.
 */
function toDescriptor(answer: unknown, roomType: RoomType): Result<ClassicConnectionDescriptor, TransportError>
{
	if (!isWireRecord(answer))
	{
		return malformed('the answer of the action');
	}

	const fields = answer.call;

	if (!isWireRecord(fields))
	{
		return malformed('call of the answer');
	}

	const answeredScheme = readNumber(fields.SCHEME);

	if (answeredScheme !== undefined && answeredScheme !== CallScheme.Classic)
	{
		return contractError(
			AcquisitionContractCode.SchemeMismatch,
			`the answer is of scheme ${answeredScheme} while the connection was acquired as classic`,
		);
	}

	const serverCallId = readServerCallId(fields.ID);

	if (serverCallId === undefined)
	{
		return malformed('call.ID');
	}

	const startDate = readStartDate(fields.START_DATE);

	if (startDate === undefined)
	{
		return malformed('call.START_DATE');
	}

	return ok({
		scheme: CallScheme.Classic,
		serverCallId,
		roomId: readNonEmptyText(fields.UUID),
		roomType,
		startDate,
		isNew: answer.isNew === true,
		connectionData: answer.connectionData,
		publicChannels: answer.publicChannels,
	});
}

/**
 * `ConnectionAcquisition` of the classic schema. It asks one server action for a call and normalizes
 * the answer into a descriptor; the schema of the descriptor is what this implementation is, not what
 * the answer says, and a request or an answer claiming another schema comes back as a broken contract
 * instead of silently switching the strategy.
 *
 * Cancellation is watched around the call rather than inside it: `RestPort` carries none, so an
 * abort that arrives while the action is in flight is honoured as soon as it answers - the descriptor
 * is dropped and the caller reads `Cancelled` instead of a connection it no longer wants.
 */
export class ClassicConnectionAcquisition implements ConnectionAcquisition
{
	#rest: RestPort;
	#context: ClassicCallContext;
	#signalProvider: CancellationSignalProvider;

	constructor(options: ClassicConnectionAcquisitionOptions)
	{
		this.#rest = options.rest;
		this.#context = options.context;
		this.#signalProvider = options.signalProvider ?? (() => undefined);
	}

	async acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>
	{
		// read once: a provider may hand out the controller of the next attempt after this one started
		const signal = this.#signalProvider();

		if (isAborted(signal))
		{
			return cancelled();
		}

		if (request.scheme !== CallScheme.Classic)
		{
			return contractError(
				AcquisitionContractCode.SchemeMismatch,
				`the connection is requested as scheme ${request.scheme} while this acquisition is classic`,
			);
		}

		const answer = await this.#rest.callAction(CREATE_ACTION, toCreatePayload(request, this.#context));

		if (isAborted(signal))
		{
			return cancelled();
		}

		if (isErr(answer))
		{
			return answer;
		}

		return toDescriptor(answer.value, request.roomType);
	}
}
