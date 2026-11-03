import { CallScheme } from '../domain/connection-descriptor';
import type {
	ConnectionDescriptor,
	ConnectionMonitoring,
	JwtConnectionDescriptor,
} from '../domain/connection-descriptor';
import type { ConnectionRequest } from '../domain/connection-request';
import { err, isErr, ok } from '../error/result';
import type { Err, Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import { isWireRecord } from '../port/envelope-readers';
import type { HttpPort, HttpRequest, HttpResponse } from '../port/http-port';
import type { LoggerPort } from '../port/logger-port';
import { readNonEmptyText, readNumber, readRoomType } from './answer-readers';
import type { AnswerFields } from './answer-readers';
import { AcquisitionContractCode } from './connection-acquisition';
import type { CancellationSignalProvider, ConnectionAcquisition } from './connection-acquisition';
import { JoinFailureCode, readJoinFailure, toTransportError } from './join-error-mapping';

/** Action of the balancer a jwt connection is obtained through, appended to the address it lives at. */
const JOIN_PATH = '/v2/join';

/**
 * Who is asking, as `/v2/join` expects to be told. Constants of the module rather than fields of the
 * request: they describe the client the code runs in, which a caller neither chooses nor varies per
 * connection.
 */
const CLIENT_VERSION = '1.0.0';
const CLIENT_PLATFORM = 'web';

/** The provider of a one-to-one connection - the single thing acquisition reads a provider for. */
const ONE_TO_ONE_PROVIDER = 'Plain';

const SCHEME_MISMATCH_MESSAGE = 'connection acquisition: the schema of the answer is not the one acquired';
const REQUEST_SCHEME_MISMATCH_MESSAGE = 'connection acquisition: the connection is requested under another schema';

/**
 * What the balancer is addressed with and identifies the caller by. Not part of `ConnectionRequest`:
 * the request says what kind of connection is needed, while the address of the balancer and the
 * tokens are knowledge of the session above - the same split the classic path makes with its entity.
 *
 * The tokens live as long as the acquisition does, which is the lifecycle of the connection it serves
 * - one instance answers the repeated acquire of an escalation. They are never logged and never reach
 * a descriptor.
 */
export type JwtCallContext = {
	/** Address of the balancer, without the path of the action. */
	callBalancerUrl: string,
	/** Identifies the user to the balancer. */
	userToken: string,
	/** Token of the call; the server encodes the limits and the roles of the chat into it. */
	callToken: string,
	/** Id of the client instance of the connection - the one an outgoing pull envelope carries. */
	instanceId: string,
};

export type JwtConnectionAcquisitionOptions = {
	http: HttpPort,
	context: JwtCallContext,
	/** Absent when the caller never cancels: an acquisition nobody aborts needs no controller. */
	signalProvider?: CancellationSignalProvider,
	/** Absent while no composition root has a logger yet; a broken contract then goes unreported. */
	logger?: LoggerPort,
};

const SILENT_LOGGER: LoggerPort = {
	log: () => {},
	warn: () => {},
	error: () => {},
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

/** A refusal the acquisition states itself, spelled in the vocabulary of the balancer it speaks for. */
function joinFailure(code: JoinFailureCode, message: string): Err<TransportError>
{
	return err(toTransportError({ code, message }));
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

/** The schema the answer claims, when it claims one at all. */
function readAnsweredScheme(result: unknown): number | undefined
{
	return isWireRecord(result) ? readNumber(result.scheme) : undefined;
}

/**
 * Endpoints of the monitoring, as far as the answer names them. A block with nothing readable in it
 * is no block: an empty object would tell a consumer there is monitoring to talk to.
 */
function readMonitoring(value: unknown): ConnectionMonitoring | undefined
{
	if (!isWireRecord(value))
	{
		return undefined;
	}

	const monitoring: ConnectionMonitoring = {
		metricsServerUrl: readNonEmptyText(value.metricsServerUrl),
		logsServerUrl: readNonEmptyText(value.logsServerUrl),
		token: readNonEmptyText(value.token),
		env: readNonEmptyText(value.env),
		region: readNonEmptyText(value.region),
	};

	return Object.values(monitoring).some((field) => field !== undefined) ? monitoring : undefined;
}

/**
 * Body of the join request. Every field is named rather than spread from the request: `usersLimit`
 * and `userRoles` are encoded by the server into the call token, and a spread would carry them to the
 * balancer as a second, contradictable source of the same truth.
 *
 * `isOneToOne` is computed here because only the wire needs it - the request says which provider
 * serves the connection, and what that means for the balancer is knowledge of this contract.
 */
function toJoinBody(request: ConnectionRequest, context: JwtCallContext): AnswerFields
{
	return {
		userToken: context.userToken,
		isOneToOne: request.provider === ONE_TO_ONE_PROVIDER,
		clientVersion: CLIENT_VERSION,
		clientPlatform: CLIENT_PLATFORM,
		callType: request.callType,
		roomType: request.roomType,
		instanceId: context.instanceId,
		callToken: context.callToken,
		provider: request.provider,
		isVideo: request.isVideo,
		callUuid: request.callUuid,
		parentUuid: request.parentUuid,
	};
}

/** Create-vs-join is a parameter of the address, not of the body - that is where the balancer reads it. */
function toJoinUrl(request: ConnectionRequest, context: JwtCallContext): string
{
	return `${context.callBalancerUrl}${JOIN_PATH}?mustCreate=${request.mustCreate}`;
}

function readJson(body: string): { value: unknown } | undefined
{
	try
	{
		return { value: JSON.parse(body) as unknown };
	}
	catch
	{
		return undefined;
	}
}

/**
 * Reads the connection out of the answered result, and says so when it cannot be read as one. Kept
 * apart from the request itself: obtaining an answer and trusting its shape are two different jobs.
 *
 * `mediaServerUrl` and `roomData` are what the media plane connects with, so an answer missing either
 * is not a connection. `isNew` is a claim the balancer makes only when it did create the room, so its
 * absence is the value `false`. Nothing of the media plane travels along: `iceServers` and the rest
 * of what the sfu answers over its own channel have no place in a descriptor of the http contract.
 */
function toDescriptor(result: unknown): Result<JwtConnectionDescriptor, TransportError>
{
	if (!isWireRecord(result))
	{
		return malformed('result of the answer');
	}

	const mediaServerUrl = readNonEmptyText(result.mediaServerUrl);

	if (mediaServerUrl === undefined)
	{
		return malformed('result.mediaServerUrl');
	}

	const roomData = readNonEmptyText(result.roomData);

	if (roomData === undefined)
	{
		return malformed('result.roomData');
	}

	const roomId = readNonEmptyText(result.roomId);

	if (roomId === undefined)
	{
		return malformed('result.roomId');
	}

	const roomType = readRoomType(result.roomType);

	if (roomType === undefined)
	{
		return malformed('result.roomType');
	}

	const startDate = readNumber(result.startDate);

	if (startDate === undefined)
	{
		return malformed('result.startDate');
	}

	return ok({
		scheme: CallScheme.Jwt,
		mediaServerUrl,
		roomData,
		roomId,
		roomType,
		startDate,
		isNew: result.isNew === true,
		monitoring: readMonitoring(result.monitoring),
	});
}

/**
 * `ConnectionAcquisition` of the jwt schema: one `/v2/join` of the balancer, normalized into a
 * descriptor. The schema of the descriptor is what this implementation is - a request or an answer
 * naming another schema comes back as a broken contract instead of silently switching the strategy,
 * and the mismatch is logged with the two schemas and nothing else.
 *
 * A refusal of the balancer keeps its own code, so `RoomNotFound` and `CanNotCreateRoom` stay
 * tellable apart above; recovery of a call the server no longer has is decided there, and nothing
 * here finishes or re-acquires anything on its own.
 *
 * Cancellation reaches both the request and the acquisition around it: the injected signal is handed
 * to the port and read again once it answers, so a connection nobody waits for is dropped rather than
 * returned.
 */
export class JwtConnectionAcquisition implements ConnectionAcquisition
{
	#http: HttpPort;
	#context: JwtCallContext;
	#signalProvider: CancellationSignalProvider;
	#logger: LoggerPort;

	constructor(options: JwtConnectionAcquisitionOptions)
	{
		this.#http = options.http;
		this.#context = options.context;
		this.#signalProvider = options.signalProvider ?? (() => undefined);
		this.#logger = options.logger ?? SILENT_LOGGER;
	}

	async acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>
	{
		// read once: a provider may hand out the controller of the next attempt after this one started
		const signal = this.#signalProvider();

		if (isAborted(signal))
		{
			return cancelled();
		}

		if (request.scheme !== CallScheme.Jwt)
		{
			this.#logger.error(REQUEST_SCHEME_MISMATCH_MESSAGE, {
				requestedScheme: request.scheme,
				acquiredScheme: CallScheme.Jwt,
			});

			return contractError(
				AcquisitionContractCode.SchemeMismatch,
				`the connection is requested as scheme ${request.scheme} while this acquisition is jwt`,
			);
		}

		const response = await this.#http.request(this.#toHttpRequest(request, signal));

		if (isAborted(signal))
		{
			return cancelled();
		}

		if (isErr(response))
		{
			return response;
		}

		return this.#readAnswer(response.value);
	}

	/**
	 * No header of its own: the balancer reads the body as json regardless, and naming a content type
	 * outside the safelist would turn every join into a preflighted request.
	 */
	#toHttpRequest(request: ConnectionRequest, signal: AbortSignal | undefined): HttpRequest
	{
		return {
			url: toJoinUrl(request, this.#context),
			method: 'POST',
			body: JSON.stringify(toJoinBody(request, this.#context)),
			signal,
		};
	}

	/**
	 * Tells the three things an answer can be apart: a refusal the balancer states, a body that is not
	 * an answer at all, and the connection. A refusal is trusted over the status - it is the balancer
	 * naming the outcome, while a status only says the request was not served.
	 */
	#readAnswer(response: HttpResponse): Result<ConnectionDescriptor, TransportError>
	{
		const json = readJson(response.body);

		if (json === undefined)
		{
			if (response.ok)
			{
				return joinFailure(JoinFailureCode.JsonParsingError, 'the answer of the balancer is not json');
			}

			return joinFailure(
				JoinFailureCode.UnexpectedResponse,
				`the balancer answered the status ${response.status} with a body that is not json`,
			);
		}

		const answer = isWireRecord(json.value) ? json.value : {};
		const failure = readJoinFailure(answer.error);

		if (failure !== undefined)
		{
			return err(toTransportError(failure));
		}

		if (!response.ok)
		{
			return joinFailure(
				JoinFailureCode.UnexpectedResponse,
				`the balancer answered the status ${response.status} and named no error`,
			);
		}

		const answeredScheme = readAnsweredScheme(answer.result);

		if (answeredScheme !== undefined && answeredScheme !== CallScheme.Jwt)
		{
			this.#logger.error(SCHEME_MISMATCH_MESSAGE, {
				answeredScheme,
				acquiredScheme: CallScheme.Jwt,
			});

			return contractError(
				AcquisitionContractCode.SchemeMismatch,
				`the answer is of scheme ${answeredScheme} while the connection was acquired as jwt`,
			);
		}

		return toDescriptor(answer.result);
	}
}
