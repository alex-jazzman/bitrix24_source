/* eslint-disable */
type Err<E> = {
	ok: false;
	error: E;
};

/**
 * Outcome of a one-shot transport operation. Every contract failure travels here, so the caller sees
 * the error type at compile time: a rejected promise carries `unknown` and is left for the failures
 * that are genuinely exceptional rather than part of the contract.
 */
type Result<T, E = TransportError> = Ok<T> | Err<E>;

/**
 * Contract failure of a transport operation, discriminated by `kind`: a consumer switches on it
 * without losing typing. Nothing leaves the transport as a bare error string.
 */
type TransportError = NetworkError | TimeoutError | DeniedError | Cancelled | ContractError;

type NetworkError = {
	kind: 'network';
	cause?: unknown;
};

type TimeoutError = {
	kind: 'timeout';
};

/**
 * A refusal: access to a device or a right on the server. `reason` tells the outcomes of one refusal
 * apart without adding a kind; its vocabulary belongs to the component that produces the refusal.
 */
type DeniedError = {
	kind: 'denied';
	reason: string;
};

/** Cancellation through the injected signal. */
type Cancelled = {
	kind: 'cancelled';
};

/** Failure of a server contract; `code` is the code the server answered with, kept as it came. */
type ContractError = {
	kind: 'contract';
	code: string | number;
	message?: string;
};

type Ok<T> = {
	ok: true;
	value: T;
};

type Quality = typeof BX.Call.Engine.Transport.Quality[keyof typeof BX.Call.Engine.Transport.Quality];

/**
 * Opaque id of a media source, for a side that has several of them (one ParticipantId to many
 * MediaEndpointId): it covers both a device and an SFU shard. Never parsed and never derived from -
 * the transport only forwards it, so no media server id is encoded here.
 */
type MediaEndpointId = string;

/**
 * Canonical id of the remote side, independent of the media plane. Its source is the roster context
 * of the layer above the transport (in the current Bitrix contract - the user id): the planes only
 * map their native ids onto it, the transport never invents one. Carries neither roles nor rights.
 */
type ParticipantId = string;

/**
 * Maps a native id of one plane onto the canonical participant id. Injected into the transport from
 * above, so signaling and media resolve against the same source and the canonical id survives an
 * escalation between planes.
 */
interface ParticipantResolver {
	/** `null` while the sender is unknown: the caller holds or drops the event instead of guessing. */
	resolveSender(senderId: string): ParticipantId | null;
	/** `null` while the endpoint mapping has not arrived yet. */
	resolveMediaEndpoint(mediaEndpointId: MediaEndpointId): ParticipantId | null;
}

/**
 * Pass-through parameters of a connection: the transport forwards them to acquisition and to the
 * balancer as payload and never branches on them. The meaning of a room type, a call type, a limit
 * or a role belongs to the layers above - that is what keeps the transport unaware of the kind of
 * call it serves. Typed as primitives on purpose: a closed enum here would be exactly the knowledge
 * the transport must not hold.
 */
type TransportVariators = {
	scheme: number;
	provider: string;
	roomType: number;
	callType: number;
	callUuid?: string;
	usersLimit?: number;
	userRoles?: unknown;
};

type CallScheme = typeof BX.Call.Engine.Transport.CallScheme[keyof typeof BX.Call.Engine.Transport.CallScheme];

type RoomType = typeof BX.Call.Engine.Transport.RoomType[keyof typeof BX.Call.Engine.Transport.RoomType];

/**
 * Connection of the classic schema, as `call.CallManager.create` answered - the path that carries its
 * connection data inline and reaches no balancer. Deliberately not aligned with the jwt variant: the
 * two schemas answer with genuinely different data, and a common shape would only be reached by
 * inventing fields neither server sends.
 */
type ClassicConnectionDescriptor = {
	scheme: typeof BX.Call.Engine.Transport.CallScheme.Classic;
	/**
	 * Numeric server-side id of the call, the one the classic `call.CallManager.*` actions are
	 * addressed by, and the same id the server names every incoming envelope of the channel by - so
	 * a classic connection filters its incoming signaling on this value. Classic-only: the jwt
	 * schema addresses a room and has no counterpart, and gets that id from elsewhere.
	 */
	serverCallId: number;
	/**
	 * Uuid of the call. Optional by fact of the server: it is generated for a one-to-one call and
	 * stays empty for a call created without one, so a classic connection is identified by
	 * `serverCallId` and this is the identity the upper layers share with the jwt path when it exists.
	 */
	roomId?: string;
	/**
	 * Kind of room the connection was asked for, carried over from the request: the classic answer
	 * names no room type of its own - its `TYPE` is the type of the call - so nothing is read off the
	 * wire here.
	 */
	roomType: BX.Call.Engine.Transport.RoomType;
	/** As the server sends it: a timestamp or a formatted date, kept in the form it came in. */
	startDate: number | string;
	/** Whether the server created the call rather than answering with one that was already running. */
	isNew: boolean;
	/** Opaque inline connection data of the classic path - the counterpart of jwt `roomData`. */
	connectionData: unknown;
	/**
	 * Initial pull addressing of the call, as the server answers it beside the connection: the channel
	 * of every participant of the call. Opaque for the same reason `connectionData` is - what a channel
	 * descriptor is made of belongs to `PullPort`, and the domain owes the port no dependency. Optional
	 * as a guard rather than by fact of the server: the classic answer always names the key - an empty
	 * block without the pull module, `false` while the pull queue is off - so an absent one means an
	 * answer shaped otherwise than this reader expects. Whatever came travels as it came, and judging it
	 * belongs to the port. The jwt path answers no addressing at all, which is why the field is
	 * classic-only.
	 */
	publicChannels?: unknown;
};

/**
 * Normalized outcome of acquiring a connection - v1, discriminated by `scheme`. Plane-independent by
 * contract: no SDP, no ICE and no endpoint of a media plane reaches it. A consumer tells the variants
 * apart by the discriminant; nothing but the discriminant is shared between them.
 */
type ConnectionDescriptor = JwtConnectionDescriptor | ClassicConnectionDescriptor;

/**
 * Connection of the jwt schema, as the balancer answered `/v2/join`. `mediaServerUrl` and `roomData`
 * are what the media plane connects with, and an answer without them is not a connection - so both
 * are required here rather than checked again downstream.
 *
 * The balancer names no numeric id of the call, so neither does this descriptor: here a room is what
 * is addressed, and the actions of the schema are addressed by `roomId`. The numeric id - the one
 * every incoming envelope of the channel is named by, and filtered on - is answered by
 * `call.Call.startCall`, which lives above the transport, so the pull port and the incoming
 * dispatcher of a jwt connection are created once that answer names the call and not before.
 */
type JwtConnectionDescriptor = {
	scheme: typeof BX.Call.Engine.Transport.CallScheme.Jwt;
	mediaServerUrl: string;
	/** Opaque: the transport forwards it into the media plane and never parses it. */
	roomData: string;
	roomId: string;
	roomType: BX.Call.Engine.Transport.RoomType;
	/** Unix seconds, as the balancer sends them; a consumer that needs milliseconds scales it itself. */
	startDate: number;
	/** Whether the balancer created the room rather than letting the caller into an existing one. */
	isNew: boolean;
	monitoring?: ConnectionMonitoring;
};

/**
 * Monitoring endpoints the balancer hands out with a connection. Pass-through: the transport neither
 * reads nor sends anything to them. Every field is optional because the answer carries the block as a
 * whole and names inside it only when the server has them.
 */
type ConnectionMonitoring = {
	metricsServerUrl?: string;
	logsServerUrl?: string;
	token?: string;
	env?: string;
	region?: string;
};

/**
 * Input of connection acquisition: what kind of connection is needed. It is the pass-through
 * variators plus the few fields acquisition itself acts on - `mustCreate` decides create-vs-join on
 * the wire, `parentUuid` names the call an escalation comes from, `isVideo` travels to the server as
 * the intent of the caller.
 *
 * `scheme` and `roomType` are narrowed to the vocabularies the descriptor is discriminated by; that
 * is a type of the value, not knowledge about the call: the transport still branches on none of these
 * fields and forwards them as payload.
 *
 * The variators the wire has no place for stay out of the request body rather than being reshaped:
 * `usersLimit` and `userRoles` are encoded by the server into the call token, so acquisition never
 * sends them.
 */
type ConnectionRequest = TransportVariators & {
	scheme: BX.Call.Engine.Transport.CallScheme;
	roomType: BX.Call.Engine.Transport.RoomType;
	/** Call an escalation comes from, when this connection continues an existing one. */
	parentUuid?: string;
	isVideo: boolean;
	/** Whether a room must be created; the transport passes it on and reads nothing into it. */
	mustCreate: boolean;
};

type AcquisitionContractCode = typeof BX.Call.Engine.Transport.AcquisitionContractCode[keyof typeof BX.Call.Engine.Transport.AcquisitionContractCode];

/**
 * Hands over the signal the caller cancels an acquisition through. A provider rather than a signal:
 * one acquisition serves consecutive attempts - a retry, a re-acquire on escalation - and each of
 * them is cancelled through the controller that started it. An implementation reads the provider once
 * per `acquire` and stays with that signal for the whole operation.
 *
 * `AbortSignal` is the primitive `HttpPort` already takes, so a caller holds one controller for the
 * request and for the acquisition around it.
 */
type CancellationSignalProvider = () => AbortSignal | undefined;

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
interface ConnectionAcquisition {
	acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>;
}

type ClassicConnectionAcquisitionOptions = {
	rest: RestPort;
	context: ClassicCallContext;
	/** Absent when the caller never cancels: an acquisition nobody aborts needs no controller. */
	signalProvider?: CancellationSignalProvider;
};

/**
 * Raw REST channel: one call of one server action. A single method on purpose - which primitive
 * carries the call is a detail of the adapter, and normalizing the answer into a `Result` is the
 * whole job of the port. It decides nothing: whether an intent goes over REST at all is settled by
 * the caller.
 */
interface RestPort {
	/**
	 * Resolves with the data the action answered with; a refusal on the server and a broken answer
	 * both arrive as `Err`, so a caller sees the failure in the type instead of in a `catch`. The
	 * result type is left to the caller - the port carries the answer without knowing its shape.
	 */
	callAction<TResult = unknown>(action: RestActionName, payload?: RestActionPayload): Promise<Result<TResult>>;
}

/**
 * Name of a server action of a Bitrix module (`module.Controller.method`). An absolute URL is not one
 * and has no place here - that is `HttpPort`.
 */
type RestActionName = string;

/** Data of an action call. The port forwards it as it came and never inspects it. */
type RestActionPayload = {
	[field: string]: unknown;
};

/**
 * What the classic call is attached to on the server. It comes from the layer that started the call
 * and not from `ConnectionRequest`: the request describes the connection, while the entity behind it
 * is knowledge of the session above - the same way the jwt path takes its tokens as input.
 */
type ClassicCallContext = {
	entityType: string;
	entityId: string;
};

type JwtConnectionAcquisitionOptions = {
	http: HttpPort;
	context: JwtCallContext;
	/** Absent when the caller never cancels: an acquisition nobody aborts needs no controller. */
	signalProvider?: CancellationSignalProvider;
	/** Absent while no composition root has a logger yet; a broken contract then goes unreported. */
	logger?: LoggerPort;
};

interface HttpPort {
	/**
	 * An answer that arrived is `Ok` whatever its status - a 4xx or a 5xx is an answer, not a
	 * transport failure. `Err` covers having no answer at all: the request never reached the
	 * endpoint, ran out of time, or was aborted through the signal.
	 */
	request(request: HttpRequest): Promise<Result<HttpResponse>>;
}

/**
 * Request by an absolute URL - the case `RestPort` deliberately does not cover. `signal` is injected
 * rather than created inside: the port owns no cancellation of its own, so whoever started the
 * operation aborts it, and an abort comes back as the `Cancelled` variant.
 */
type HttpRequest = {
	url: string;
	method: HttpMethod;
	headers?: {
		[name: string]: string;
	};
	body?: string;
	signal?: AbortSignal;
};

/** Methods a request by absolute URL needs here; widen it when a consumer needs more. */
type HttpMethod = 'GET' | 'POST';

/**
 * Raw answer, mirroring the primitive one to one. The body stays a string: deciding that it holds
 * JSON, and what a status outside 2xx means, belongs to the caller and not to the port.
 */
type HttpResponse = {
	status: number;
	ok: boolean;
	body: string;
};

/**
 * What the balancer is addressed with and identifies the caller by. Not part of `ConnectionRequest`:
 * the request says what kind of connection is needed, while the address of the balancer and the
 * tokens are knowledge of the session above - the same split the classic path makes with its entity.
 *
 * The tokens live as long as the acquisition does, which is the lifecycle of the connection it serves
 * - one instance answers the repeated acquire of an escalation. They are never logged and never reach
 * a descriptor.
 */
type JwtCallContext = {
	/** Address of the balancer, without the path of the action. */
	callBalancerUrl: string;
	/** Identifies the user to the balancer. */
	userToken: string;
	/** Token of the call; the server encodes the limits and the roles of the chat into it. */
	callToken: string;
	/** Id of the client instance of the connection - the one an outgoing pull envelope carries. */
	instanceId: string;
};

/**
 * Logging behind one seam, narrow on purpose: three severities and nothing else - no formatters, no
 * sinks, no level of its own to configure, because the transport needs none of it. Redaction is not
 * part of the contract; the adapter adds it, and splitting `message` from `details` is what makes it
 * possible at all.
 */
interface LoggerPort {
	/**
	 * A key event of the transport: a reconnect started, an escalation committed. `message` stays a
	 * fixed text with no value interpolated into it - everything variable belongs in `details`, or
	 * redaction has nothing to work with.
	 */
	log(message: string, details?: LogDetails): void;
	/** Something went wrong and the operation carries on: a fallback taken, an attempt repeated. */
	warn(message: string, details?: LogDetails): void;
	/** The operation failed: access refused, reconnect budget exhausted, escalation lost. */
	error(message: string, details?: LogDetails): void;
}

/**
 * Structured data of a log entry. It travels beside the message instead of inside it so that a
 * sensitive field can be found by its name: that is what gives an adapter redacting tokens and keys
 * something to look at, while a value already interpolated into a string could only be guessed at.
 */
type LogDetails = {
	[field: string]: unknown;
};

type JoinFailureCode = typeof BX.Call.Engine.Transport.JoinFailureCode[keyof typeof BX.Call.Engine.Transport.JoinFailureCode];

/**
 * Refusal of `/v2/join`, in the shape the answer carries it. `code` stays as it arrived - the server
 * owns its vocabulary, and a code nobody here knows is still the code of that refusal.
 */
type JoinFailure = {
	code: string | number;
	message?: string;
};

type DeclineArgs = {
	/**
	 * Reason of the refusal, in the vocabulary of the server. Absent means the schema decides, and the
	 * two decide differently: the classic action has a default of its own on the server and keeps it,
	 * while the jwt one broadcasts the code of the request as it stands, so a code left out there
	 * travels as a zero the other sides cannot tell from an ordinary hangup. That is why the jwt
	 * gateway names the reason itself and the classic one does not - one path would lose the refusal.
	 */
	code?: number;
};

/** What an invite offers, in the vocabulary of presence; how it is spelled on the wire is elsewhere. */
type InviteArgs = {
	recipients: ParticipantId[];
	isVideo: boolean;
	/** A repeat of an invite already sent, so the receiving side does not take it for a new call. */
	isRepeated?: boolean;
	/** Whether the invited side is shown the incoming call; a silent invite reaches the session only. */
	isVisible?: boolean;
};

/**
 * What an incoming invite carries beside its sender. Opaque here on purpose: presence tells the layer
 * above that a call is offered, and what the offer says - video, the entity behind it, the roster -
 * is read there, by the layer that owns those meanings.
 */
type InvitePayload = {
	[field: string]: unknown;
};

/**
 * Incoming presence events, transport -> consumer. Injected into the constructor of the protocol, so
 * neither an event string nor a global bus takes part: a consumer implements this interface and gets
 * typed calls.
 *
 * Every method names the side the event came from, already resolved into the canonical participant
 * id. A batch command of the channel is unfolded before it reaches here - one batch arrives as a
 * series of single calls - so a consumer sees one shape whatever the wire sent.
 */
interface SignalingListener {
	onInvite(from: ParticipantId, payload: InvitePayload): void;
	onAnswer(from: ParticipantId): void;
	/**
	 * Terminal: the side refused the call. The code is the one the wire carried, and is absent when it
	 * carried none - the transport invents no reason of its own.
	 */
	onDecline(from: ParticipantId, code?: number): void;
	/** Terminal and told apart from a decline: the side is already busy in another call. */
	onBusy(from: ParticipantId): void;
	onHangup(from: ParticipantId): void;
	/** Keepalive of a peer; the echo of this instance is suppressed before it reaches here. */
	onPing(from: ParticipantId): void;
	/** The side asks for the answer again; who resends it is decided above the channel, not here. */
	onRepeatAnswer(from: ParticipantId): void;
	/**
	 * The invite of that side timed out - a signal and nothing more: the transport starts no timer,
	 * changes no participant state and takes no lifecycle decision on it.
	 */
	onInviteTimeout(from: ParticipantId): void;
	onFinish(): void;
}

/**
 * Presence lifecycle of a call - the intents one side states about itself, and nothing of the media
 * plane. Schema-agnostic by contract: it owns the lifecycle and the choice of channel, while every
 * name on the wire belongs to the `SignalingGateway` injected into it.
 *
 * A one-shot intent answers with a `Result`, so a caller reads a refusal in the type. `ping` is the
 * one exception: a periodic keepalive is best-effort, answers `void` and stays outside the result
 * model - a single failed ping is swallowed and logged, and what a series of them means for the
 * connection is an internal threshold rather than the outcome of a call.
 */
interface SignalingProtocol {
	invite(invite: InviteArgs): Promise<Result<void, TransportError>>;
	/** The recipients are who is told; the channel that carries it is addressed, the server one is not. */
	answer(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;
	decline(decline?: DeclineArgs): Promise<Result<void, TransportError>>;
	hangup(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;
	ping(recipients: ParticipantId[]): void;
	finish(): Promise<Result<void, TransportError>>;
}

type SignalingContractCode = typeof BX.Call.Engine.Transport.SignalingContractCode[keyof typeof BX.Call.Engine.Transport.SignalingContractCode];

type SignalingProtocolImplOptions = {
	pull: PullPort;
	clock: ClockPort;
	gateway: SignalingGateway;
	/** Incoming presence, transport -> consumer: what this class relays and never produces itself. */
	listener: SignalingListener;
	logger: LoggerPort;
};

/**
 * Raw pull channel: addressed publishing and one typed subscription to incoming signals. Decides
 * nothing - whether a signal travels over pull at all is the policy of the caller, taken on the
 * publishing capability below.
 */
interface PullPort {
	/**
	 * Publishes a signal to the given recipients. Addressing goes by the canonical participant id
	 * (in the current Bitrix contract that is the user id); mapping it onto the recipient list of
	 * the primitive, and filling the envelope ids of the connection, is the work of the adapter.
	 *
	 * Best-effort, hence `void`: the primitive reports no delivery and no caller branches on the
	 * outcome of a publish, because the channel is chosen beforehand by capability. Omitting
	 * `expirySeconds` leaves the channel default of the adapter in place.
	 */
	publish(recipients: ParticipantId[], signal: PullSignal, payload: PullPayload, expirySeconds?: number): void;
	/** Returns the unsubscribe function; a consumer never names a global event to get here. */
	subscribeIncoming(listener: (message: PullMessage) => void): () => void;
	/** Whether the channel supports publishing at all. */
	isPublishingSupported(): boolean;
	/** Whether publishing works right now: supported and the channel is up. */
	isPublishingEnabled(): boolean;
}

/**
 * Name of a signal on the pull channel, already stripped of the channel-level prefix. That prefix
 * and the name of the pull module stay inside the port and reach no consumer. The vocabulary of the
 * names themselves belongs to the component that owns the wire format: a closed union here would
 * move that format into the port.
 */
type PullSignal = string;

/** Everything a signal carries beside the envelope. Opaque to the port: it forwards, never parses. */
type PullPayload = {
	[field: string]: unknown;
};

/**
 * Incoming message with the envelope already taken apart, so a consumer reads fields instead of
 * digging through raw params. Pull addressing (`publicIds`) is absent on purpose - keeping it is the
 * business of the adapter, and that is what leaves the incoming dispatcher a thin router.
 *
 * The envelope ids are optional because the wire does not guarantee them - a signal originating on
 * the server carries no sending instance. The port forwards what arrived and invents nothing, so
 * what an absent id means is decided by the consumer.
 */
type PullMessage = {
	signal: PullSignal;
	/** Instance that sent the signal: a consumer tells its own echo apart by it. */
	callInstanceId?: string;
	/** Native id of the origin; it is resolved into a `ParticipantId` above the port. */
	senderId?: string;
	/** Call the signal belongs to: a consumer drops a message that names another one, or none. */
	callId?: string;
	/** Id of a single send, generated per message by the sending side. */
	requestId?: string;
	/**
	 * Channel the message arrived over, stated by the port. Absent when the channel did not state one:
	 * a consumer that trusts a signal only from the server reads an unstated origin as one it may not
	 * trust, never as the server.
	 */
	origin?: PullMessageOrigin;
	/**
	 * Participant whose channel published the message, when the addressing the port holds names them.
	 * Unlike `senderId`, which the sending side writes into the envelope itself, this is the origin the
	 * channel is authenticated by - so the two disagreeing is what a signal naming someone else looks
	 * like. Absent whenever the addressing cannot place the channel, which is the ordinary state of a
	 * connection that has not seen the whole roster yet.
	 */
	channelSenderId?: string;
	payload: PullPayload;
};

/**
 * Where a signal came from: the channel the server broadcasts on, or the channel another client
 * publishes on. It is not read off the message - a sending side writes the envelope itself - but off the
 * channel the message arrived over, which is why it is the port that states it.
 */
type PullMessageOrigin = 'server' | 'client';

/**
 * Time and timers behind one seam. It exists for determinism: a fake gives fully virtual time advanced
 * by hand, so a ping, a reconnect budget or a debounce is tested without a real `setTimeout` and
 * without waiting for one. The port measures and schedules, nothing else - how long to wait, how many
 * times and whether the delay grows is the policy of the caller, so no backoff lives here.
 */
interface ClockPort {
	/**
	 * Milliseconds for measuring how much time has passed. Non-decreasing and comparable only with
	 * other readings of the same port: it is neither a wall clock nor a date, which is what lets a fake
	 * start at zero and move only when a test says so.
	 */
	now(): number;
	/**
	 * Runs the callback once after the delay and returns the cancel function - the shape a subscription
	 * of the other ports already has, so the caller keeps one function instead of a handle it would
	 * have to store and hand back. Cancelling twice changes nothing, and cancelling after the callback
	 * has run does nothing.
	 */
	scheduleOnce(callback: () => void, delayMs: number): () => void;
	/**
	 * Runs the callback on every interval until cancelled; cancelling behaves as in `scheduleOnce` and
	 * no callback follows it.
	 */
	scheduleRepeating(callback: () => void, intervalMs: number): () => void;
}

/**
 * Encoding and sending of one presence intent under one call schema. The single owner of the wire
 * format: action names, signal names, the shape of a payload and the lifetime of a published message
 * live in an implementation of this interface and reach no caller.
 *
 * The methods are split by channel where a schema has two of them, so which channels an intent takes
 * stays with the protocol - which reads the publishing capability and knows nothing about the schema
 * - while which channels an intent has at all stays here. An intent a schema has no wire for is a
 * documented no-op that sends nothing and answers success: an absent wire is not a failure of the
 * lifecycle.
 *
 * Publishing answers `void` like the channel it goes through: it is best-effort by contract and the
 * caller has already gated it by capability, so there is no outcome to branch on. An action answers a
 * `Result`, including the keepalive - making the keepalive best-effort is the business of its caller,
 * not of the sending.
 */
interface SignalingGateway {
	/**
	 * One channel in both schemas: the server sends the invite out to the invited side as a side
	 * effect of the action, so there is no addressed signal to publish.
	 */
	sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>;
	sendAnswerViaPull(recipients: ParticipantId[]): void;
	sendAnswerViaRest(): Promise<Result<void, TransportError>>;
	/** Outgoing only: a refusal comes back as a code inside a hangup, never as a decline of its own. */
	sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>;
	sendHangupViaPull(recipients: ParticipantId[]): void;
	sendHangupViaRest(hangup: RetransmitArgs): Promise<Result<void, TransportError>>;
	sendPingToPeersViaPull(recipients: ParticipantId[]): void;
	sendPingToBackendViaRest(ping: RetransmitArgs): Promise<Result<void, TransportError>>;
	sendFinish(): Promise<Result<void, TransportError>>;
}

/**
 * The wire parameter that says whether the server has to carry the message to the peers itself. It is
 * a value of the channel policy, not of presence: the caller sets it from what the pull channel can
 * do right now, which is why it enters the gateway from outside instead of being decided here.
 */
type RetransmitArgs = {
	retransmit: boolean;
};

type ClassicSignalingGatewayOptions = {
	rest: RestPort;
	pull: PullPort;
	context: ClassicSignalingContext;
	requestIdFactory: () => string;
};

type ClassicSignalingContext = {
	/** Numeric id of the call on the server - what every action of this schema is addressed by. */
	serverCallId: number;
	/** Instance sending on behalf of the user; the receiving side tells its own echo apart by it. */
	callInstanceId: string;
};

type JwtSignalingGatewayOptions = {
	rest: RestPort;
	context: JwtSignalingContext;
	requestIdFactory: () => string;
};

type JwtSignalingContext = {
	/** Uuid of the call - what the actions of this schema address instead of a numeric id. */
	callUuid: string;
	/** Instance sending on behalf of the user; a second device of the same user is told apart by it. */
	callInstanceId: string;
};

type PullDispatcherOptions = {
	pull: PullPort;
	presence: SignalingListener;
	negotiation: NegotiationListener;
	mute: RemoteMuteListener;
	/** Maps the native origin of a message onto the canonical id every listener is called with. */
	participants: ParticipantResolver;
	context: PullDispatcherContext;
	logger: LoggerPort;
};

/**
 * Incoming mesh negotiation as the router sees it: the side it came from, and the message it carried
 * untouched. Declared here rather than taken from the channel that implements it, so routing does not
 * depend on the media plane; the payload stays opaque because sdp, candidates and track descriptions
 * are the vocabulary of that channel, which owns their format.
 */
interface NegotiationListener {
	/** The side asks for a round of negotiation; whether it restarts the connection is in the message. */
	onNegotiationNeeded(from: ParticipantId, payload: PullPayload): void;
	onConnectionOffer(from: ParticipantId, payload: PullPayload): void;
	onConnectionAnswer(from: ParticipantId, payload: PullPayload): void;
	onIceCandidate(from: ParticipantId, payload: PullPayload): void;
}

/**
 * Mute of a remote track - the one media state the transport routes, the rest of that family being
 * read above it. Declared at the level of the router for the same reason as the negotiation listener:
 * the media plane implements it, and the router knows nothing of that implementation.
 */
interface RemoteMuteListener {
	onRemoteTrackMuted(from: ParticipantId, kind: RemoteMuteKind, isMuted: boolean): void;
}

/**
 * Which remote media a mute state is about. The three are kept apart instead of being folded into one
 * track: a camera that is off and a video that is paused are different states of the same stream, and
 * which of them matters to a consumer is decided above, not by a router.
 */
type RemoteMuteKind = 'microphone' | 'camera' | 'videoPaused';

/**
 * Which call this client speaks for and which instance it publishes as. Neither is read from a
 * message: they are what an incoming message is compared against.
 */
type PullDispatcherContext = {
	/**
	 * Call this dispatcher serves; a message naming another one is no business of this transport.
	 * The numeric id the server names every envelope by, carried as the string of the wire contract:
	 * the classic schema takes it from `serverCallId` of the descriptor, the jwt schema from the
	 * answer of `call.Call.startCall`, so a jwt dispatcher is constructed after that answer.
	 */
	callId: string;
	/** Instance publishing on behalf of this client: a message carrying it is this client's own echo. */
	instanceId: string;
};

/**
 * The media plane in the terms of intents - one contract for both planes, the mesh of a peer-to-peer
 * call and the SFU of a group one. What differs between them is how they carry media, and that stays
 * inside the implementations: sdp, ice candidates and the mid mapping of a transceiver are named
 * nowhere here, so an offer of the mesh cannot leak into the contract and an SFU is left with no empty
 * method to implement.
 *
 * Track currency: a ready `MediaStreamTrack` comes in. A transport obtains no media of its own and
 * stops nothing it was given - the tracks are owned by `LocalMediaSource` above it, which is what lets
 * the same track survive a reconnect and a swap of the plane.
 *
 * Every intent is one-shot and answers a `Result`, so a caller reads a contract failure in the type
 * rather than in a `catch`. Conditions that continue - remote media, quality, recovery, a terminal
 * failure - are reported through the injected listener instead, and neither channel repeats the other.
 */
interface MediaTransport {
	/**
	 * Raises the plane for the connection that was acquired. The descriptor is the normalized outcome of
	 * acquisition: which schema answered is its discriminant, and reading it is the business of the
	 * implementation that connects.
	 */
	connect(descriptor: ConnectionDescriptor): Promise<Result<void, TransportError>>;
	/** Takes the plane down. The tracks it was publishing stay alive - it does not own them. */
	disconnect(): Promise<Result<void, TransportError>>;
	publishAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
	unpublishAudio(): Promise<Result<void, TransportError>>;
	publishVideo(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
	unpublishVideo(): Promise<Result<void, TransportError>>;
	publishScreen(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
	unpublishScreen(): Promise<Result<void, TransportError>>;
	/**
	 * The audio a screen capture came with. An intent of its own rather than a second `publishAudio`,
	 * because a connection carries it beside the microphone: the two travel different mids and the far
	 * side is told which is which.
	 */
	publishScreenAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
	unpublishScreenAudio(): Promise<Result<void, TransportError>>;
	/**
	 * Asks the plane for a quality level of one remote side. A plane with no wire for it answers a
	 * successful no-op the way a signaling schema without a wire for an intent does: the shape of an
	 * intent stays the same across implementations instead of gaining an exception.
	 */
	setRemoteQuality(participantId: ParticipantId, quality: BX.Call.Engine.Transport.Quality): Promise<Result<void, TransportError>>;
	/**
	 * Terminal teardown: the plane is taken down for good and lets go of what it holds. It answers no
	 * result because there is no outcome to read - a plane that is gone cannot fail to go - and the tracks
	 * it was publishing stay alive, their owner being `LocalMediaSource` above.
	 *
	 * Strictly idempotent: a second call does nothing at all and throws nothing. Nothing reaches the
	 * listener after it either - a callback of the platform that arrives late is cut off by the plane, so a
	 * consumer that has torn a call down never hears of it again.
	 *
	 * Terminal for the intents as well: one stated after this is refused as a contract failure and carried
	 * nowhere. A plane that is gone sends no media, so a success would tell a caller the opposite of what is
	 * happening; which code names the refusal is the business of the implementation, the refusal itself is
	 * not.
	 */
	close(): void;
}

type EscalatableMediaTransportOptions = {
	createMeshTransport: MeshTransportFactory;
	createSfuTransport: SfuTransportFactory;
	/**
	 * Acquisition of the jwt schema, settled by the composition root before anything is acquired: an
	 * implementation never switches schema by itself, so the swap asks the jwt one and hands it a request
	 * of that schema.
	 */
	acquisition: ConnectionAcquisition;
	/** Where the tracks of the swap come from; they are republished, never obtained again. */
	localMedia: LocalTrackReader;
	/** The consumer of the media events - the same one across a swap, reached per generation. */
	listener: MediaTransportListener;
	logger: LoggerPort;
};

/** Raises the plane the decorator starts with, on the guarded listener it is handed. */
type MeshTransportFactory = (listener: MediaTransportListener) => MediaTransport;

/**
 * Streaming events of the media plane, transport -> consumer. Injected into the constructor of an
 * implementation, so neither an event string nor a global bus takes part. Only what nobody asked for
 * arrives here: the outcome of an intent travels back in its own `Result`, and is never doubled as an
 * event.
 *
 * Every event names the canonical participant, resolved before it leaves the transport - a native id of
 * a plane does not reach a consumer. The one exception is the remote media that arrived before its
 * mapping did, and it says so in its own event instead of guessing a participant; a mapping that turns
 * out not to be coming refuses that media through the event beside it.
 *
 * Mute of a remote track is inherited rather than restated: the router of the incoming pull events
 * already declares that listener and feeds it, and one vocabulary for those three states is what keeps
 * the two ends of the route the same interface. Floor, voice activity and mute-all are meanings of the
 * layers above and are no part of this contract.
 */
interface MediaTransportListener extends RemoteMuteListener {
	/** A remote track of that side is now flowing; its kind is read off the track itself. */
	onRemoteTrackAdded(participantId: ParticipantId, track: MediaStreamTrack): void;
	/** Named by kind, because the track it is about is already gone and cannot be asked. */
	onRemoteTrackRemoved(participantId: ParticipantId, kind: BX.Call.Engine.Transport.MediaTrackKind): void;
	/** The level the plane observes for that side; what to do about a drop is decided above. */
	onConnectionQualityChanged(participantId: ParticipantId, quality: BX.Call.Engine.Transport.Quality): void;
	/** The transport started a cycle of recovery on its own; the budget of it came from above. */
	onReconnecting(): void;
	/** The connection is back. What to resynchronize afterwards belongs to the layers above. */
	onReconnected(): void;
	/**
	 * Terminal: the injected budget of recovery is spent, or the failure was fatal to begin with. The
	 * transport takes no further attempt after it.
	 */
	onFailure(error: TransportError): void;
	/**
	 * Remote media whose media endpoint has no participant yet - the mapping of the layer above has not
	 * arrived. The transport neither guesses an owner nor drops the track: it is held and reported as
	 * this, and the resolution of it lives outside this contract.
	 */
	onUnresolvedRemoteTrack(endpointId: MediaEndpointId, track: MediaStreamTrack): void;
	/**
	 * The media held for that endpoint is let go: its mapping is not coming, so nobody it could be named
	 * after will ever be known. The reason arrives typed like every other contract failure, and carries
	 * nothing of the wire behind the endpoint - neither the shard nor the media server is encoded in it.
	 */
	onUnresolvedRemoteTrackDropped(endpointId: MediaEndpointId, error: TransportError): void;
}

type MediaTrackKind = typeof BX.Call.Engine.Transport.MediaTrackKind[keyof typeof BX.Call.Engine.Transport.MediaTrackKind];

/**
 * Raises the plane a swap moves the media to, for the connection that was just acquired. Injected
 * because the sfu implementation itself lives outside this contract - which is also what lets the swap
 * be exercised on a plane whose every outcome is decided by whoever builds it.
 */
type SfuTransportFactory = (descriptor: ConnectionDescriptor, listener: MediaTransportListener) => MediaTransport;

/**
 * What the swap reads local media through. Narrowed to the one reader on purpose: the tracks are owned
 * by `LocalMediaSource`, and a decorator that cannot reach a `disable` or a `close` cannot stop one.
 */
type LocalTrackReader = Pick<BX.Call.Engine.Transport.LocalMediaSource, 'getTrack'>;

type LocalMediaSourceOptions = {
	mediaDevices: MediaDevicesPort;
	listener: LocalMediaSourceListener;
};

/**
 * Local media. The only normalizing port: it hides the quirks of the media-devices primitive
 * (constraint relaxation, virtual devices, a chatty device-change notification) and turns every
 * refusal into a typed outcome instead of an exception. It still takes no decision about the call -
 * who owns the tracks and how long they live is settled above, in `LocalMediaSource`.
 */
interface MediaDevicesPort {
	/** Camera and microphone. A refused permission is `Err`, never a thrown exception. */
	getUserMedia(constraints: MediaStreamConstraints): Promise<Result<MediaStream>>;
	/**
	 * Screen. A dismissed screen picker is a refusal of its own kind, distinct from a refused
	 * camera, so the caller tells the two apart without reading a message.
	 */
	getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<Result<MediaStream>>;
	/** Devices the port counts as real. An unavailable media API is `Err`, not an empty list. */
	enumerateDevices(): Promise<Result<MediaDeviceInfo[]>>;
	/**
	 * Reports that the set of devices changed, and nothing else: the fresh list is read back through
	 * `enumerateDevices`, which keeps a failed read in the result channel instead of forcing an
	 * event to carry an error. Returns the unsubscribe function.
	 */
	subscribeDeviceChange(listener: () => void): () => void;
	/** Releases what the port holds. Idempotent, and no listener is called after it. */
	dispose(): void;
}

/**
 * What the source reports rather than answers. Enabling a surface answers with its track, and
 * disabling one is done by the caller, so neither needs an event: what is left is what happens without
 * anyone asking.
 */
interface LocalMediaSourceListener {
	/**
	 * A stored track ended on its own - the device went away, or the screen share was stopped from the
	 * bar of the browser. The track is already gone from the source when this arrives.
	 */
	onLocalTrackEnded(kind: BX.Call.Engine.Transport.LocalMediaKind): void;
	/** The set of devices changed; the fresh list is read back through `listDevices`. */
	onDeviceListChanged(): void;
}

type LocalMediaKind = typeof BX.Call.Engine.Transport.LocalMediaKind[keyof typeof BX.Call.Engine.Transport.LocalMediaKind];

type EscalationContractCode = typeof BX.Call.Engine.Transport.EscalationContractCode[keyof typeof BX.Call.Engine.Transport.EscalationContractCode];

type LocalMediaContractCode = typeof BX.Call.Engine.Transport.LocalMediaContractCode[keyof typeof BX.Call.Engine.Transport.LocalMediaContractCode];

type LocalMediaDenialReason = typeof BX.Call.Engine.Transport.LocalMediaDenialReason[keyof typeof BX.Call.Engine.Transport.LocalMediaDenialReason];

/**
 * Names of the intents, derived from the contract rather than listed again: a table keyed by this type
 * covers every intent by construction, and the compiler names the one it is missing. Teardown is left
 * out - `close` answers no result and carries no outcome, so it is no intent.
 */
type MediaTransportIntent = keyof Omit<MediaTransport, 'close'>;

type RemoteMediaContractCode = typeof BX.Call.Engine.Transport.RemoteMediaContractCode[keyof typeof BX.Call.Engine.Transport.RemoteMediaContractCode];

/**
 * What a change of the endpoint mapping is announced as. The announcement exists because the mapping and
 * the media that waits for it arrive on different routes: whoever holds remote media has to be told the
 * moment the mapping does arrive, and told just as plainly that it will not.
 */
interface MediaEndpointResolutionListener {
	/** The endpoint names that participant from now on: what waited for it can be delivered. */
	onMediaEndpointResolved(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void;
	/** Whatever waits for that endpoint is not going to be resolved - the mapping is not coming. */
	onMediaEndpointUnresolvable(mediaEndpointId: MediaEndpointId): void;
}

type RemoteMediaResolutionOptions = {
	/** The canonical ids of the session; this resolution asks it and never maps anything itself. */
	participants: MediaEndpointResolutionSource;
	/**
	 * The listener of the plane this resolution belongs to - the very one that plane was raised with, so
	 * media released here is heard exactly when media the plane reports directly is.
	 */
	listener: MediaTransportListener;
	logger: LoggerPort;
};

/**
 * The resolver as the side waiting for a mapping sees it: the contract of the domain plus the
 * announcement of a change to it. Kept apart from `ParticipantResolver` on purpose - a router of the
 * incoming channel only ever asks, and gains nothing from being able to subscribe.
 */
interface MediaEndpointResolutionSource extends ParticipantResolver {
	/** Returns the way to let the subscription go; announcements stop at once after it. */
	subscribeResolution(listener: MediaEndpointResolutionListener): () => void;
}

type NegotiationChannelOptions = {
	pull: PullPort;
	clock: ClockPort;
	/** Incoming negotiation, transport -> consumer: what this class relays and never produces itself. */
	listener: NegotiationChannelListener;
	logger: LoggerPort;
	/**
	 * User agent of this client, as the peer reads it to adapt to the browser on the other side. An
	 * injected value rather than a global read here: the channel touches no platform of its own.
	 */
	userAgent: string;
};

/**
 * Incoming mesh negotiation, in the form a media transport acts on: the ids resolved, the payload
 * parsed and the stale messages already gone. What reaches it is what a connection can be built from.
 */
interface NegotiationChannelListener {
	onNegotiationNeeded(from: ParticipantId, isRestart: boolean): void;
	onConnectionOffer(from: ParticipantId, offer: IncomingOffer): void;
	onConnectionAnswer(from: ParticipantId, answer: NegotiationDescription): void;
	/** Plural where the signal of the wire is singular: a message carries the whole batch. */
	onIceCandidates(from: ParticipantId, batch: NegotiationIceBatch): void;
}

/**
 * An offer that arrived, with the outcome of comparing its connection against the one in flight
 * already decided. That comparison is the asymmetric half of renegotiation: an offer wins over the
 * connection it finds, while an answer or a candidate naming another connection loses and is dropped.
 */
type IncomingOffer = {
	connectionId: ConnectionId;
	sdp: string;
	tracks: NegotiationTracks;
	/**
	 * The connection this offer displaces, to be destroyed and built anew for `connectionId`. `null`
	 * when the offer starts the first connection of that side or repeats the one already in flight,
	 * and then nothing is destroyed.
	 */
	supersededConnectionId: ConnectionId | null;
};

/**
 * Client-side id of one mesh connection, minted by the side that offers it. Opaque: the channel
 * compares it and never parses it, so what it is made of stays the business of whoever mints it.
 */
type ConnectionId = string;

/**
 * Transceiver mids of the surfaces one side sends, which is how the peer tells the incoming tracks
 * apart. `null` where the surface is not being sent. This is the vocabulary of the wire and not of
 * the local media source: a mid exists only inside a connection, and the source knows no connection.
 *
 * `sharingAudio` is the audio of the shared screen - `MediaTrackKind.ScreenAudio` in the currency of
 * the plane - and is what keeps it apart from the microphone on `audio`.
 */
type NegotiationTracks = {
	audio: string | null;
	video: string | null;
	screen: string | null;
	sharingAudio: string | null;
};

/** A session description of one connection and the tracks it carries - an offer and an answer alike. */
type NegotiationDescription = {
	connectionId: ConnectionId;
	sdp: string;
	tracks: NegotiationTracks;
};

/** Candidates of one connection, in either direction: the wire carries them in batches. */
type NegotiationIceBatch = {
	connectionId: ConnectionId;
	candidates: RTCIceCandidateInit[];
};

/** A round of negotiation asked for; `isRestart` says the connection is to be rebuilt, not adjusted. */
type NegotiationNeededArgs = {
	isRestart?: boolean;
};

type ReconnectContractCode = typeof BX.Call.Engine.Transport.ReconnectContractCode[keyof typeof BX.Call.Engine.Transport.ReconnectContractCode];

type ReconnectControllerOptions = {
	clock: ClockPort;
	/** Signals of the environment; a network that came back is one of the triggers of the cycle. */
	environment: EnvironmentPort;
	budget: ReconnectBudget;
	attempt: ReconnectAttempt;
	listener: ReconnectListener;
	logger: LoggerPort;
};

/**
 * Signals of the environment a connection lives in, each with a synchronous read of the state it
 * reports. The read is not a convenience: a strategy asks "is there a network right now?" before it
 * decides, and a consumer that only subscribed would have to assume an initial value - which is the
 * bug of a tab that was already hidden, or already offline, by the time it subscribed.
 *
 * Decides nothing: whether a regained network starts a reconnect, and whether a hidden tab stops the
 * ping, is the policy of the caller.
 */
interface EnvironmentPort {
	/** Whether the network is up right now. */
	isOnline(): boolean;
	/**
	 * Reports the new state, so the consumer keeps no copy of it - one subscription rather than an
	 * online/offline pair. Returns the unsubscribe function.
	 */
	subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void;
	/** Whether the page is visible right now. */
	isVisible(): boolean;
	/** Reports the new visibility. Returns the unsubscribe function. */
	subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void;
	/**
	 * The page is going away - the last moment to close a connection. Carries no state: there is
	 * nothing left to read back afterwards. Returns the unsubscribe function.
	 */
	subscribeUnload(listener: () => void): () => void;
	/**
	 * Whether the code runs inside the desktop application. Synchronous, because it answers about an
	 * environment that is already what it is; how that is found out belongs to the adapter.
	 */
	isDesktop(): boolean;
}

/**
 * How many attempts the cycle may take and how long it waits between them. Both come from above as
 * configuration - the product values of recovery are settled by the layers that know the call, and this
 * is only the shape they arrive in.
 */
type ReconnectBudget = {
	/** Attempts in total, the first one included; the cycle always takes at least one. */
	maxAttempts: number;
	/**
	 * The pause before the next attempt, asked for by the number of attempts already spent (`1` after
	 * the first failure). Absent, zero or non-positive means no pause at all: a mesh recovers by a fixed
	 * limit of attempts with nothing to wait for, while an SFU spreads them out. Growth of the delay is
	 * whatever this function does - the controller neither multiplies nor caps it.
	 */
	backoffMs?: (attempt: number) => number;
};

/**
 * One attempt of recovery, injected by the transport that owns the cycle: an ICE restart of a mesh
 * connection, a rejoin of an SFU one. It answers a `Result` rather than throwing, so an attempt that
 * failed is part of the loop instead of an exception in it.
 */
type ReconnectAttempt = () => Promise<Result<void, TransportError>>;

/**
 * The three events of recovery, taken from the media contract instead of restated: the vocabulary of a
 * reconnect exists once, and a transport hands its own listener over as it is.
 */
type ReconnectListener = Pick<MediaTransportListener, 'onReconnecting' | 'onReconnected' | 'onFailure'>;

type BxPullPortOptions = {
	pull: PullClientPrimitive;
	events: CustomEventBusPrimitive;
	context: PullConnectionContext;
	/** Where a publish that broke is written down; it is the only outcome of a send anybody ever reads. */
	logger: LoggerPort;
	/** Seam for a deterministic request id in tests; production keeps the built-in generator. */
	requestIdFactory?: () => string;
};

/**
 * The slice of the pull client this adapter drives. Declared here rather than taken from the pull
 * module: the transport keeps its own contracts, and the primitive is injected instead of read off a
 * global, which is what makes the logic below testable without a live channel.
 *
 * A send reports no delivery - publishing is best-effort by contract - but the pull client does answer
 * a promise that refuses when the send itself broke, so the result is declared instead of dropped: an
 * unread refusal of it would be an unhandled rejection. A primitive answering nothing fits the same
 * declaration.
 */
type PullClientPrimitive = {
	sendMessage(users: ParticipantId[], moduleId: string, command: string, params: PullPayload, expiry: number): void | Promise<unknown>;
	/** Pull addressing of the call: the channel holds the descriptors it is given until the next set. */
	setPublicIds(publicIds: PullChannelDescriptor[]): void;
	isPublishingSupported(): boolean;
	isPublishingEnabled(): boolean;
};

/**
 * One pull channel as the channel manager of the pull module reads it: the participant it belongs to,
 * the public id it is addressed by, the signature that lets a client publish into it, and the interval
 * it is valid for. The field names are the ones of the wire, because they are what the primitive reads.
 */
type PullChannelDescriptor = {
	user_id: string;
	public_id: string;
	signature: string;
	start: string;
	end: string;
};

/**
 * Global custom-event bus incoming pull messages travel over. Injected for the same reason as the
 * client, and its event names never leave this file.
 */
type CustomEventBusPrimitive = {
	addCustomEvent(eventName: string, handler: IncomingPullHandler): void;
	removeCustomEvent(eventName: string, handler: IncomingPullHandler): void;
};

/**
 * What the bus hands over: the raw pull command, the envelope exactly as it arrived, and the meta the
 * pull module states beside a message - the sender among it, which is the only authenticated word on
 * where a message came from.
 */
type IncomingPullHandler = (command: string, params: unknown, extra?: unknown) => void;

/**
 * Ids of the connection this port speaks for. Fixed at construction: one port serves one connection,
 * so an outgoing envelope cannot end up carrying the ids of another call. A port is created once the
 * call it speaks for is named, instead of being re-pointed at runtime - which in the jwt schema is
 * after the media connection is up, because there the name comes from `call.Call.startCall` and not
 * from the acquired connection.
 */
type PullConnectionContext = {
	/**
	 * Numeric id of the call the server names every envelope by, carried as the string of the wire
	 * contract: `serverCallId` of a classic descriptor, and the answer of `call.Call.startCall` in
	 * the jwt schema, which the balancer does not name.
	 */
	callId: string;
	/** Instance publishing through this port; the receiving side tells its own echo apart by it. */
	callInstanceId: string;
	senderId: ParticipantId;
};

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
type AjaxActionRunner = {
	runAction(action: string, config: {
		data?: RestActionPayload;
	}): Promise<unknown>;
};

/**
 * The request primitive itself. Injected rather than taken from the global scope - both so the port
 * is constructible with a stand-in and so the reference cannot lose its receiver: a composition root
 * passes `(url, init) => fetch(url, init)` or an equally bound function.
 */
type FetchPrimitive = (url: string, init: FetchRequestInit) => Promise<FetchResponsePrimitive>;

/** What the primitive is given: the part of its init a request of this port actually carries. */
type FetchRequestInit = {
	method: string;
	headers?: {
		[name: string]: string;
	};
	body?: string;
	signal?: AbortSignal;
};

/** What the primitive answers, as this adapter reads it: the status and the body as text. */
type FetchResponsePrimitive = {
	status: number;
	ok: boolean;
	text(): Promise<string>;
};

type NavigatorMediaDevicesPortOptions = {
	/** `navigator.mediaDevices` in production; absent in a host that carries no media API at all. */
	mediaDevices?: MediaDevicesPrimitive;
	clock: ClockPort;
};

/**
 * The slice of `navigator.mediaDevices` this adapter drives, injected instead of read off a global:
 * that is what makes the normalization below testable without a browser and without a permission.
 *
 * Every member is optional on purpose - a host without the media API is a case the port answers, so
 * the type has to admit the absence instead of promising a method that is not there.
 */
type MediaDevicesPrimitive = {
	getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
	getDisplayMedia?: (constraints?: DisplayMediaStreamOptions) => Promise<MediaStream>;
	enumerateDevices?: () => Promise<MediaDeviceInfo[]>;
	addEventListener?: (type: string, listener: () => void) => void;
	removeEventListener?: (type: string, listener: () => void) => void;
};

type TimerClockPortOptions = {
	timers: TimerPrimitive;
	clock: MonotonicClockPrimitive;
};

/**
 * The timers of the host, declared here and injected for the same reason as every other primitive of
 * this directory: nothing global is captured, so the port is constructible with a stand-in. A handle
 * is whatever the primitive gave out - the adapter keeps it and hands it back, never reads it.
 *
 * Both pairs are called as methods of the injected object, so a primitive whose timers need their
 * receiver - `window` is one - works when passed as it is.
 */
type TimerPrimitive = {
	setTimeout(callback: () => void, delayMs: number): number;
	clearTimeout(handle: number): void;
	setInterval(callback: () => void, intervalMs: number): number;
	clearInterval(handle: number): void;
};

/**
 * Source of what `now()` reports. Separate from the timers because the port promises a non-decreasing
 * reading for measuring elapsed time: that is `performance`, not a wall clock that may be corrected
 * backwards under a running measurement.
 */
type MonotonicClockPrimitive = {
	now(): number;
};

type BrowserEnvironmentPortOptions = {
	/** The window: the online pair and the unload events are fired at it. */
	pageEvents: EnvironmentEventTarget;
	/** The document: `visibilitychange` is fired at it, not at the window. */
	page: VisibilityPrimitive;
	network: NetworkStatePrimitive;
	isDesktop: DesktopPredicate;
};

/**
 * Event target of the host, declared here and injected like every other primitive of this directory.
 * A listener takes nothing: the adapter never hands a platform event object to a consumer.
 */
type EnvironmentEventTarget = {
	addEventListener(type: string, listener: () => void): void;
	removeEventListener(type: string, listener: () => void): void;
};

/** The document: the visibility reading and the event it changes with come from the same object. */
type VisibilityPrimitive = EnvironmentEventTarget & {
	visibilityState: string;
};

/** The navigator: the network reading. */
type NetworkStatePrimitive = {
	onLine: boolean;
};

/**
 * Whether the code runs inside the desktop application. Injected as a predicate rather than read from
 * the desktop adapter of the module: that extension carries the messenger desktop library behind it,
 * and the transport subtree owes nothing to the messenger. Which primitive answers the question is
 * settled by the composition root, and the port stays constructible without any of it.
 */
type DesktopPredicate = () => boolean;

/**
 * The logging primitive this adapter writes through, shaped like the console-style loggers of the
 * platform. Injected rather than imported: resolving it to the real logger is the business of the
 * composition root, and the transport keeps its subtree free of the messenger extensions that logger
 * sits on.
 */
type LoggingPrimitive = {
	log: (...params: unknown[]) => void;
	warn: (...params: unknown[]) => void;
	error: (...params: unknown[]) => void;
};

declare namespace BX.Call.Engine.Transport {
	function err<E>(error: E): Err<E>;

	function isErr<T, E>(result: Result<T, E>): result is Err<E>;

	function isOk<T, E>(result: Result<T, E>): result is Ok<T>;

	function ok<T>(value: T): Ok<T>;

	function isCancelled(error: TransportError): error is Cancelled;

	/**
	 * Quality level of remote media. The transport reports the level a media plane observes and takes
	 * no decision on it - what to do about a drop belongs to the layers above.
	 */
	const Quality: {
		readonly VeryHigh: 'very_high';
		readonly High: 'high';
		readonly Medium: 'medium';
		readonly Low: 'low';
		readonly VeryLow: 'very_low';
	};

	/**
	 * Authorization schema of a call. The transport does not choose it - the layer above does, and hands
	 * it down in the request - but the schema decides which acquisition answered, so it is the
	 * discriminant of the descriptor union below.
	 */
	const CallScheme: {
		readonly Classic: 1;
		readonly Jwt: 2;
	};

	/**
	 * Kind of room a connection is made to. A pass-through variator: the transport carries it and never
	 * branches on it - what a conference or a large room means belongs to the layers above. The
	 * vocabulary is here only so the value on the wire is validated instead of copied blindly.
	 */
	const RoomType: {
		readonly Small: 1;
		readonly Conference: 2;
		readonly Large: 3;
		readonly Personal: 4;
	};

	/**
	 * Codes acquisition puts on a failure of an external contract - the case where an answer arrived but
	 * cannot be read as a connection. Server codes are never rewritten into these: a refusal of the
	 * server keeps the code it came with.
	 */
	const AcquisitionContractCode: {
		readonly MalformedResponse: 'acquisition.malformed_response';
		readonly SchemeMismatch: 'acquisition.scheme_mismatch';
	};

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
	class ClassicConnectionAcquisition implements ConnectionAcquisition {
		constructor(options: ClassicConnectionAcquisitionOptions);
		acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>;
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
	class JwtConnectionAcquisition implements ConnectionAcquisition {
		constructor(options: JwtConnectionAcquisitionOptions);
		acquire(request: ConnectionRequest): Promise<Result<ConnectionDescriptor, TransportError>>;
	}

	/**
	 * Vocabulary of codes `/v2/join` refuses with. Part of the external contract of the balancer, so it
	 * is declared here rather than imported: the transport reaches nothing of the legacy stack, and a
	 * copy of a vocabulary is the price of that isolation.
	 *
	 * The numbers 4 and 6 are absent from the vocabulary of the server itself, so nothing is invented for
	 * them - a code outside the list keeps the value it came with.
	 */
	const JoinFailureCode: {
		readonly CanNotCreateRoom: 1;
		readonly InputError: 2;
		readonly AccessDenied: 3;
		readonly RoomNotFound: 5;
		readonly MalfunctioningSignaling: 7;
		readonly JsonParsingError: 'JsonParsingError';
		readonly UnexpectedResponse: 'UnexpectedResponse';
		readonly FailedRequest: 'FailedRequest';
		readonly AbortedRequest: 'AbortedRequest';
		readonly BodyReadError: 'BodyReadError';
		readonly UnknownError: 'UnknownError';
	};

	/**
	 * Codes the protocol itself puts on a failure, as opposed to the codes a server answers with: an
	 * intent stated after the release is refused because the call it would speak for is over, and nothing
	 * of it reached the wire.
	 */
	const SignalingContractCode: {
		readonly Disposed: 'signaling.disposed';
	};

	/**
	 * `SignalingProtocol` over the two channels of presence and the single owner of which of them an
	 * intent takes. That is settled before a send and never after it - a publish reports no delivery, so
	 * there is nothing to fall back from - and the encoding belongs to the injected `SignalingGateway`,
	 * which is why no name of a schema appears here.
	 *
	 * An intent the schema serves by an action alone goes to the server and nowhere else. The two intents
	 * that carry the presence of this side - answering and hanging up - take both channels at once: the
	 * peers hear them directly wherever this client may publish, and the server hears them in any case,
	 * because it is the server that moves the participant and keeps the roster - a channel that breaks
	 * mid-publish is written down and swallowed rather than allowed to take the action down with it.
	 * Publishing is gated by whether the server allows this client to publish at all; `retransmit` is read
	 * from the second capability, whether publishing works right now, so the server is asked to carry the
	 * message exactly where the channel did not. The keepalive takes two arms on two timers, because the
	 * peers and the server ask about presence at very different rates.
	 *
	 * The keepalive is the one thing this class owns beyond a send: `ping` arms it, the terminal intents
	 * and an incoming finish stop it, and `dispose` releases it whatever ended the call.
	 */
	class SignalingProtocolImpl implements SignalingProtocol, SignalingListener {
		constructor(options: SignalingProtocolImplOptions);
		/** One channel in both schemas: the server carries the invite out, so nothing is published. */
		invite(invite: InviteArgs): Promise<Result<void, TransportError>>;
		/**
		 * Both channels, and not one or the other: the peers learn of the answer at once, while the server
		 * hears of it in any case, because only the action makes this side ready in the call. The outcome
		 * of the intent is the outcome of the action - a publish reports no delivery and would name a
		 * refusal nobody made.
		 *
		 * A channel primitive that breaks mid-publish is written down and stops there: the publish is
		 * best-effort by the contract of the port, and letting the break out would cost the action that
		 * alone makes this side ready. `async` still, so that a break of the action itself reaches the
		 * caller as a rejection of the declared promise rather than past it.
		 */
		answer(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;
		/**
		 * One channel in both schemas: a refusal is an action, and no peer is told it directly. Terminal
		 * like a hangup, so the keepalive of this side stops with it.
		 */
		decline(decline?: DeclineArgs): Promise<Result<void, TransportError>>;
		/**
		 * Both channels, and not one or the other: the peers learn of the departure at once, while the
		 * server hears of it in any case because it keeps the roster. `retransmit` is read from whether
		 * publishing works right now rather than from the gate of the publish, so a channel that is
		 * allowed but down leaves the server carrying the message instead of nobody carrying it.
		 *
		 * A broken publish is swallowed on the same terms as the answer, and `async` on the same terms too:
		 * a break of the action reaches the caller as a rejection of the declared promise instead of past
		 * it.
		 */
		hangup(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;
		/**
		 * Keeps this side present until the call ends. Arming is idempotent: calling it again re-targets a
		 * running keepalive instead of arming a second pair of timers, so a changing roster does not change
		 * the rate. Nothing is sent by the call itself - the first round of each arm lands one period later,
		 * as it does in the engine this behaviour comes from.
		 */
		ping(recipients: ParticipantId[]): void;
		finish(): Promise<Result<void, TransportError>>;
		/**
		 * Idempotent, and it takes no intent to the wire: what is released here is only what was armed. It is
		 * terminal in both directions - incoming presence that arrives afterwards reaches no consumer, so a
		 * late callback of the channel cannot report presence of a call that is already gone, and an intent
		 * stated afterwards reaches neither channel: it is refused where it stands, as a contract failure of
		 * the transport, instead of stating the presence of a side that has left.
		 */
		dispose(): void;
		onInvite(from: ParticipantId, payload: InvitePayload): void;
		onAnswer(from: ParticipantId): void;
		onDecline(from: ParticipantId, code?: number): void;
		onBusy(from: ParticipantId): void;
		onHangup(from: ParticipantId): void;
		onPing(from: ParticipantId): void;
		onRepeatAnswer(from: ParticipantId): void;
		onInviteTimeout(from: ParticipantId): void;
		/** The one incoming event this class acts on: the call is over, so its keepalive stops with it. */
		onFinish(): void;
	}

	/**
	 * `SignalingGateway` of the classic schema - the path with a genuinely two-way pull channel, so every
	 * intent that has a signal of its own can travel either way and the caller picks by capability.
	 *
	 * A published message carries no recipient list of its own: the port is addressed and already knows
	 * who it goes to, so repeating them in the payload would build half an envelope here.
	 */
	class ClassicSignalingGateway implements SignalingGateway {
		constructor(options: ClassicSignalingGatewayOptions);
		sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>;
		/** No lifetime named: an answer nobody is waiting for any more is of no use, so the default stands. */
		sendAnswerViaPull(recipients: ParticipantId[]): void;
		sendAnswerViaRest(): Promise<Result<void, TransportError>>;
		/** The code travels only when the caller named one - its default belongs to the server. */
		sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>;
		sendHangupViaPull(recipients: ParticipantId[]): void;
		sendHangupViaRest(hangup: RetransmitArgs): Promise<Result<void, TransportError>>;
		sendPingToPeersViaPull(recipients: ParticipantId[]): void;
		sendPingToBackendViaRest(ping: RetransmitArgs): Promise<Result<void, TransportError>>;
		sendFinish(): Promise<Result<void, TransportError>>;
	}

	/**
	 * `SignalingGateway` of the jwt schema. Pull-less by construction, and not by a flag it could be
	 * asked about: here the channel is a server-to-client broadcast only, the client publishes nothing on
	 * it, and a port it never uses would be a dependency held to be ignored.
	 *
	 * Three intents have a wire - inviting, refusing and finishing - and each of the rest is a no-op with
	 * a reason: joining the media server is the answer, leaving it is the hangup, and the keepalive of
	 * presence is the connection to it. They send nothing and answer success, so the same schema-agnostic
	 * lifecycle runs over both gateways without asking which one it holds.
	 */
	class JwtSignalingGateway implements SignalingGateway {
		constructor(options: JwtSignalingGatewayOptions);
		sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>;
		/** No-op: this schema publishes nothing on the channel at all. */
		sendAnswerViaPull(): void;
		/** No-op: joining the media server is what answering means here, and it is not a presence action. */
		sendAnswerViaRest(): Promise<Result<void, TransportError>>;
		/**
		 * The reason always travels, unlike on the classic path: the action of this schema broadcasts the
		 * code of the request as it stands, and a request that carried none is broadcast as a zero the other
		 * sides cannot tell from an ordinary hangup. So a caller who names no reason has one named here,
		 * where a refusal would otherwise stop being a refusal on the way to the participants.
		 */
		sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>;
		/** No-op: this schema publishes nothing on the channel at all. */
		sendHangupViaPull(): void;
		/** No-op: leaving the media server is what hanging up means here - it lives in the media plane. */
		sendHangupViaRest(): Promise<Result<void, TransportError>>;
		/** No-op: this schema publishes nothing on the channel at all. */
		sendPingToPeersViaPull(): void;
		/** No-op: presence is kept alive by the connection to the media server, not by an action. */
		sendPingToBackendViaRest(): Promise<Result<void, TransportError>>;
		sendFinish(): Promise<Result<void, TransportError>>;
	}

	/**
	 * The single point where the incoming channel is taken apart: one subscription, and every signal goes
	 * from here to a listener typed for it. It is a router and nothing more - it holds no state of a call,
	 * takes no lifecycle decision and answers nothing, so a channel never has to parse a stream of another.
	 *
	 * Six things happen on the way. A message that names another call - or names no call at all - stops
	 * before anything is routed: the channel carries the signaling of every call this client is in, so the
	 * call a message names is what makes it this dispatcher's business. The origin of a message is resolved
	 * into the canonical participant id before any listener sees it, and an origin that cannot be resolved
	 * is never guessed at. The echo of this very instance is dropped, which leaves a message from this side
	 * sent elsewhere - the same user on a second device - reaching the listener as this participant, told
	 * apart from a remote one by that id alone. A batch is unfolded into the single calls it stands
	 * for, each with the code and the sending instance of its own entry, so a consumer sees one shape
	 * whatever the wire sent. And the channel a message arrived over decides whether a signal of the server
	 * is heard at all: the envelope is written by whoever sent it, so a side publishing one for itself is
	 * refused here instead of being taken for the server. For the same reason a name the channel does not vouch
	 * for is refused whole rather than routed under it: a sender the addressing contradicts, whatever channel
	 * carried the message, and a sender named over any channel but the stated server one the addressing places
	 * nobody on - between two publishing sides the envelope alone is no ground to act on a name.
	 *
	 * Presence whose origin the roster does not name yet is held instead of dropped, for the same reason
	 * remote media of an unmapped endpoint is: the roster and the signaling arrive on independent routes,
	 * so a side can answer before the layer above has been told it is a participant, and that answer has no
	 * repeat. Whoever owns the roster releases what is held once it names the origin, and states just as
	 * plainly when an origin is not going to be named - a wait ends by a statement from above and never by
	 * a deadline of a clock here. Only the one-shot events of presence are held - an answer, a hangup with
	 * whatever code it carries, a repeated answer, an expired invite. The keepalive is not one of them: a
	 * round of it arrives every few seconds, so one whose origin the roster does not name is dropped like
	 * any other signal, where holding it would grow a queue no release ever empties. A description of a
	 * connection or a media state of a side nobody knows is stale by the time it could be delivered.
	 *
	 * The wait has no deadline, but what waits has a bound - two different questions. A deadline would end from
	 * here a wait the layer above owns; a bound only states how much of that wait fits in memory, and it has to
	 * be stated, because a side that knows the id of a call names a sender the roster will never name, and names
	 * a new one with every message it sends. So one origin holds a fixed number of events and a fixed number of
	 * origins hold anything at all; past either bound the oldest is let go and written down as the loss it is.
	 * And since what holds anything is exactly what the roster does not name, nothing above can list those
	 * origins on its own: `heldPresenceOrigins` is what makes them namable at `dropHeldPresence`.
	 */
	class PullDispatcher {
		constructor(options: PullDispatcherOptions);
		/**
		 * The roster above names participants it did not name before: everything held for an origin it now
		 * resolves goes on to the listener, per origin in the order it arrived. An origin still unknown keeps
		 * waiting - this releases what can be released and states nothing about the rest.
		 */
		releaseHeldPresence(): void;
		/**
		 * The origin of what is held is not going to be named - the side left before the roster caught up, or
		 * the roster above knows of no such participant. Whatever waited for it is let go unrouted, because a
		 * presence event cannot be attributed to a side nobody can name. It is a statement about what waits
		 * right now, not a verdict for good: an event of that origin arriving later is held like any other.
		 */
		/**
		 * The origins holding presence right now, in the order they started waiting. Whoever owns the roster has
		 * no other way to reach them: what is held is by definition held for a side the roster does not name, so
		 * there is no list above this one to name it back at `dropHeldPresence`. Answering about its own waiting
		 * is not a decision the router takes - which of these origins is never going to be named is decided by
		 * the owner of the roster, and stated back here.
		 *
		 * A statement about this moment: an origin released, refused or let go for room is no longer among them.
		 */
		heldPresenceOrigins(): string[];
		dropHeldPresence(senderId: string): void;
		/**
		 * Idempotent: the subscription is let go once, and after it the channel reaches no listener of this
		 * dispatcher - a message the port delivers late is dropped here rather than routed to a consumer that
		 * has torn the call down. Presence still waiting for its origin is dropped without a word: the call
		 * it belonged to is over.
		 */
		dispose(): void;
	}

	/**
	 * `MediaTransport` that can move the media from the mesh of a peer-to-peer call to an sfu without the
	 * call noticing. It is a decorator and nothing more: every intent of the contract goes to the plane that
	 * currently serves, so a consumer holds one transport for the whole session and never learns which plane
	 * answered it.
	 *
	 * The swap is atomic. The mesh keeps carrying the media until the sfu has reached commit - connected, the
	 * local tracks it was handed published, ready to take remote media in - and the assignment that installs
	 * the sfu is the one that takes the mesh down, so there is never a moment with neither plane serving. A
	 * commit that is not reached changes nothing: the mesh is still connected and still publishing, the plane
	 * that failed is let go, and the failure comes back in the result of the escalation. There is no event
	 * for it - an escalation has an initiator waiting for its answer, and the answer is not repeated.
	 *
	 * Intents are never held for a swap. A publish or an unpublish reaches the plane that serves the moment it
	 * is stated, so muting a microphone in the middle of an escalation takes effect at once, and the decorator
	 * writes down what each of them asked for. The commit carries over a snapshot of what those intents asked
	 * for and the source still holds, which an intent stated after it was taken cannot be part of, so the plane
	 * that took over is brought to what the caller last asked for right after it takes over: the intents are
	 * compared with the surfaces the commit actually carried, and what is missing is published while what the
	 * caller switched off is taken off. Only that reconciliation is serialized with the intents - one operation
	 * of a plane rather than a whole escalation - and a surface it cannot settle is written down instead of
	 * undoing a swap whose mesh is already gone.
	 *
	 * Leaving the call gives a swap up. `disconnect` is the intent of a side that is done with the call, so a
	 * plane still being raised for it is let go where it stands and the escalation answers `Cancelled`: nothing
	 * raised for a call nobody is in ever becomes the plane of it. A call left while the surfaces of a plane
	 * that has already taken over are being settled answers the same, and there the media did move: the mesh is
	 * gone by then, so what the answer states is that nobody is on the plane any more, not that it never came up.
	 *
	 * Late callbacks are cut off by generation. Each plane is raised with a listener of its own that forwards
	 * only while its generation serves the media, so a mesh that answers after the swap - remote media, a
	 * quality report, the failure of the recovery cycle it was running - reaches nobody. Stopping that cycle
	 * is the business of the plane itself: the swap closes the mesh, and a plane closes what it owns.
	 *
	 * Early ones are held instead. The plane a swap is raising already takes remote media in before it has
	 * committed, and that media is nothing any plane reports a second time, so it waits on its own listener
	 * and goes out in arrival order the moment its generation takes over. A swap that is lost drops what it
	 * held together with the plane, and the mesh, which never stopped serving, is heard throughout.
	 *
	 * A close is terminal and idempotent, and it is the same rule that carries it: no generation serves the
	 * media any more, so a callback arriving after it - from the plane that was serving or from one a swap was
	 * still raising - is cut off by the decorator itself rather than by the politeness of an implementation,
	 * and nothing held for a plane that never took over goes out either. A swap that was in flight is given up
	 * where it stands and answers `Cancelled` to whoever started it, whether its plane had taken over or not.
	 * The intents are terminal with it: one stated after a close, and one that was waiting for a reconciliation
	 * the close cut short, is refused rather than carried to a plane that is down - a success from a torn-down
	 * transport would tell a caller its media is being sent when no plane is sending anything.
	 *
	 * One direction and one shot: mesh to sfu, and back is no part of it. The trigger of an escalation and
	 * the agreement about it between the participants live above the transport - this performs the local swap
	 * and decides nothing else. The tracks are not obtained again either; they are republished from the
	 * source that owns them, which is what lets the same track survive the swap.
	 */
	class EscalatableMediaTransport implements MediaTransport {
		constructor(options: EscalatableMediaTransportOptions);
		connect(descriptor: ConnectionDescriptor): Promise<Result<void, TransportError>>;
		/**
		 * Leaves the call on the plane that serves, and gives up a swap that is still raising one. The intent
		 * itself is the signal, taken where it is stated rather than once a plane has answered it, so a plane
		 * being raised for a call that is being left cannot commit into it in the meantime.
		 */
		disconnect(): Promise<Result<void, TransportError>>;
		publishAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
		unpublishAudio(): Promise<Result<void, TransportError>>;
		publishVideo(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
		unpublishVideo(): Promise<Result<void, TransportError>>;
		publishScreen(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
		unpublishScreen(): Promise<Result<void, TransportError>>;
		publishScreenAudio(track: MediaStreamTrack): Promise<Result<void, TransportError>>;
		unpublishScreenAudio(): Promise<Result<void, TransportError>>;
		setRemoteQuality(participantId: ParticipantId, quality: Quality): Promise<Result<void, TransportError>>;
		/**
		 * Moves the media to an sfu: the connection is acquired again, as jwt, and the plane raised on it takes
		 * over only once it has committed. Everything the swap can lose - the connection it could not obtain,
		 * the plane that would not connect or would not carry a track - answers here, and the mesh goes on
		 * serving in every one of those cases; a repeat is possible and is decided above. A `disconnect` stated
		 * while this runs gives it up the same way, and answers `Cancelled` - including when the step it was
		 * running failed meanwhile, since a call that is over is not one to recover.
		 *
		 * Refused without touching anything when there is nothing to swap: after a swap has already happened
		 * (the way back is out of scope), while one is running, and after the decorator was closed.
		 */
		escalate(request: ConnectionRequest): Promise<Result<void, TransportError>>;
		/**
		 * Takes the plane that serves the media down and silences every generation with it: a callback that
		 * arrives afterwards reaches nobody, and a swap still in flight is given up with `Cancelled`. A second
		 * call does nothing. The local tracks stay alive - their owner is the source above, and no plane ever
		 * owned them.
		 */
		close(): void;
	}

	/**
	 * Track currency of the media plane: the surfaces a transport carries, in either direction. It is
	 * deliberately not the vocabulary of the devices (`LocalMediaKind`): a camera and a screen are two
	 * devices but one `video` inside a connection, and a remote track is named by what it carries rather
	 * than by the device it was captured from - the far side never tells us that.
	 *
	 * The audio of a shared screen is a currency of its own rather than plain `audio`, because a connection
	 * carries it beside the microphone and the far side has to tell the two apart: it is the surface the mid
	 * `sharingAudio` of a mesh negotiation is filled from.
	 */
	const MediaTrackKind: {
		readonly Audio: 'audio';
		readonly Video: 'video';
		readonly Screen: 'screen';
		readonly ScreenAudio: 'screen-audio';
	};

	/**
	 * The one place local media is obtained and kept. A surface is enabled once and its track is held here
	 * for as long as the session lives: an escalation mesh -> SFU and a reconnect re-publish the very same
	 * track instead of asking the user for the device again, which is the invariant this class exists for.
	 *
	 * It owns the `MediaDevicesPort` and the tracks: it is the source that stops them, on `close` and on a
	 * switch of device, and no transport does it. Where the tracks are published it does not know - that is
	 * settled by whoever holds both this source and a `MediaTransport`.
	 *
	 * Every refusal travels in the result: a refused camera or microphone is a `denied` naming the surface,
	 * a dismissed screen picker keeps the reason of the port and stays distinguishable from it, and nothing
	 * is thrown for either. A track that ends on its own is the only thing reported through the listener.
	 *
	 * A command given while the platform is still answering an earlier one asks the system for nothing twice:
	 * a command for the surface and the device already being obtained joins that capture, and a command for
	 * another device supersedes it. What a superseded capture obtains is stopped rather than stored, and its
	 * caller is told it was cancelled, so the order of the commands decides the outcome and not the order the
	 * system answered them in. Disabling a surface does the same to a capture of it in flight: a device
	 * commanded off does not come back on because permission was granted a moment later.
	 */
	class LocalMediaSource {
		constructor(options: LocalMediaSourceOptions);
		/**
		 * Camera. Hands the stored track back when it is still live and the device asked for is the one it
		 * came from; another device is a switch - the new track is obtained first, and the previous one is
		 * stopped only once it arrived, so a refused switch leaves a working camera in place.
		 */
		enableCamera(deviceId?: string): Promise<Result<MediaStreamTrack, TransportError>>;
		/** Microphone, on the same terms as the camera. */
		enableMicrophone(deviceId?: string): Promise<Result<MediaStreamTrack, TransportError>>;
		/**
		 * Screen. The surface is chosen in the picker of the system rather than by a device id, so there is
		 * nothing to switch: a stored screen track is handed back as it is, and a dismissed picker is a
		 * refusal of its own kind.
		 *
		 * Audio of the shared screen is asked for together with the video, because that is the only moment it
		 * can be asked for at all, and it is stored as the surface of its own the mid `sharingAudio` is filled
		 * from. What comes back is the video track either way: a capture the browser gave no audio - the usual
		 * outcome outside of Chromium, and the outcome of a picker where nobody ticked the box - simply leaves
		 * that surface off, and is no failure of the screen.
		 */
		enableScreen(): Promise<Result<MediaStreamTrack, TransportError>>;
		disableCamera(): void;
		disableMicrophone(): void;
		/** One capture gave the screen and its audio, and one call lets both of them go. */
		disableScreen(): void;
		/**
		 * The track a surface currently holds - what a local preview renders, and what a transport is handed
		 * to publish. Absent while the surface is off: reading it obtains nothing and asks for no permission.
		 */
		getTrack(kind: LocalMediaKind): MediaStreamTrack | undefined;
		/** The devices the port counts as real; the source neither caches the list nor filters it further. */
		listDevices(): Promise<Result<MediaDeviceInfo[], TransportError>>;
		/**
		 * Idempotent. Stops every track it owns - the source is their owner, so no transport has to - and
		 * lets the port go. Nothing is reported to the listener after it, and no surface is enabled again.
		 */
		close(): void;
	}

	/**
	 * The local surfaces a call is built from. One track is stored per surface, and no more than one.
	 *
	 * `ScreenAudio` is the audio of the shared screen, and the only surface nobody asks for on its own: a
	 * capture is handed its audio at the moment it is obtained and can be given none afterwards, so the
	 * picker of the screen is what decides whether this surface has a track at all.
	 */
	const LocalMediaKind: {
		readonly Camera: 'camera';
		readonly Microphone: 'microphone';
		readonly Screen: 'screen';
		readonly ScreenAudio: 'screen-audio';
	};

	/**
	 * Refusals of the decorator itself rather than of a connection or of a plane: no swap was attempted for
	 * any of them, and the plane that serves the media is left exactly as it was.
	 */
	const EscalationContractCode: {
		readonly AlreadyRunning: 'escalation.already_running';
		readonly AlreadyEscalated: 'escalation.already_escalated';
		readonly Closed: 'escalation.closed';
	};

	/**
	 * Codes this source puts on a failure that is neither a refusal nor a network one: the media API
	 * answered, but not with something a call can be built from.
	 */
	const LocalMediaContractCode: {
		readonly MissingTrack: 'local_media.missing_track';
		readonly Closed: 'local_media.closed';
	};

	/**
	 * Reasons of a refusal this source hands out. The camera and the microphone are named by the source,
	 * because the port answers one refusal for both and only the caller of a surface knows which one it
	 * asked for; a dismissed screen picker keeps the reason the port gave it, which is what tells the two
	 * refusals apart without reading a message.
	 */
	const LocalMediaDenialReason: {
		readonly Camera: 'camera';
		readonly Microphone: 'microphone';
		readonly ScreenPicker: 'screen-picker';
	};

	/**
	 * Codes a resolution puts on a refusal of its own. There is one: the mapping of an endpoint whose media
	 * was already held is not coming, so the media is let go. A code rather than a message, because the
	 * consumer tells this refusal apart by the discriminant and never by prose.
	 */
	const RemoteMediaContractCode: {
		readonly EndpointUnresolvable: 'remote_media.endpoint_unresolvable';
	};

	/**
	 * The way remote media of one media plane reaches a consumer: named by the participant that owns it, or
	 * held until it can be. It exists because the two arrive independently - an SFU starts sending the media
	 * of an endpoint before the layer above has said whose endpoint it is - and neither guessing an owner nor
	 * dropping the media is an answer to that.
	 *
	 * So media of an endpoint with no mapping is kept, and the consumer is told that it is: it learns that
	 * media exists without being told a participant nobody knows. The mapping that arrives afterwards lets
	 * everything held for that endpoint out at once, in the order it came in, as the very tracks that were
	 * received. A mapping that is not coming refuses them instead - one typed refusal per endpoint, whatever
	 * it was holding.
	 *
	 * One of these belongs to one plane. That is what keeps the media it releases under the same rules as the
	 * media the plane reports itself: the listener it is given is the plane's own, so a plane that is not
	 * serving the media stays unheard through this route as well as through the direct one.
	 *
	 * Nothing of the endpoint itself is ever written down. The opaque id travels to the consumer, which is
	 * what the contract of the events is for, but a log entry carries only how much media was involved -
	 * an entry is the one place a raw id of a shard could outlive the connection it belonged to.
	 */
	class RemoteMediaResolution implements MediaEndpointResolutionListener {
		constructor(options: RemoteMediaResolutionOptions);
		/**
		 * Remote media the plane received, handed over by the endpoint it came from. It reaches the consumer
		 * named by its participant when the mapping is already there, and is held when it is not.
		 */
		takeRemoteTrack(mediaEndpointId: MediaEndpointId, track: MediaStreamTrack): void;
		onMediaEndpointResolved(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void;
		onMediaEndpointUnresolvable(mediaEndpointId: MediaEndpointId): void;
		/**
		 * Terminal and idempotent: the subscription is let go and the media that was waiting is dropped
		 * without a word. The tracks are not stopped - a plane never owned them.
		 */
		close(): void;
	}

	/**
	 * Canonical ids of the session as the layer above states them, and nothing this class works out on its
	 * own. It answers what it was told and `null` for everything else, which is what keeps a native id of a
	 * plane from being taken for a participant.
	 *
	 * Two routes lead in, because the two native vocabularies are told apart by their source rather than by
	 * their shape. A sender is the origin of a message on the incoming channel, and in the current Bitrix
	 * contract the canonical id and that native id are the same value - the user id; the roster is what makes
	 * it a participant at all, so a sender the roster does not name resolves to nothing instead of to itself.
	 * A media endpoint is the source of one stream of media, opaque and never derived from: it resolves only
	 * through the mapping the layer above hands over, and one participant may own several of them - a second
	 * device, another shard of an SFU - which is exactly what a canonical id must not be asked to express.
	 *
	 * That is also what makes the canonical id survive an escalation by construction rather than by luck:
	 * the mesh and the SFU map their own ids onto this one source, so the participant a consumer sees is the
	 * same before and after the media moved between the planes.
	 */
	class RosterParticipantResolver implements MediaEndpointResolutionSource {
		resolveSender(senderId: string): ParticipantId | null;
		resolveMediaEndpoint(mediaEndpointId: MediaEndpointId): ParticipantId | null;
		/**
		 * The participants of the session as the roster above states them. A later call replaces the set
		 * whole: the roster is owned there, and a copy kept here would only be another version of it.
		 */
		setRoster(participants: readonly ParticipantId[]): void;
		/** The endpoint belongs to that participant. Announced, so held media of it can go on its way. */
		mapMediaEndpoint(mediaEndpointId: MediaEndpointId, participantId: ParticipantId): void;
		/**
		 * The mapping of that endpoint is not coming - the side it belonged to is gone, or the roster above
		 * knows of no owner for it. It is a statement about the media that waits right now, not a verdict
		 * for good: a mapping handed over later is accepted like any other.
		 */
		dropMediaEndpoint(mediaEndpointId: MediaEndpointId): void;
		subscribeResolution(listener: MediaEndpointResolutionListener): () => void;
	}

	/**
	 * The mesh negotiation channel: offer, answer and ICE of a peer-to-peer connection over `PullPort`,
	 * apart from the presence signaling that travels the same channel. Sdp and candidates are the
	 * vocabulary of this file and of nowhere else - a media transport states an intent and reads a
	 * decided event, and no layer above the transport ever sees either.
	 *
	 * Beyond encoding the wire it owns one fact: which connection of each side is in flight. An offer
	 * sets it, in both directions, and everything else is compared against it - which is where the
	 * asymmetry of renegotiation lives. An offer naming another connection displaces the one it finds,
	 * because the side that offers has already built it and no answer of ours would reach the connection
	 * it replaced; an answer or a candidate naming another connection is late instead, so it is dropped
	 * rather than applied to a connection it was not meant for.
	 *
	 * Candidates are batched: a send collects them and one command goes out once they stop arriving, so
	 * a burst of gathering becomes a message instead of a dozen. `close` cancels that batch and drops
	 * what it held, which is what keeps a candidate of a finished call off the wire.
	 *
	 * The channel exists on the classic path, where negotiation genuinely travels pull; a schema whose
	 * media plane relays it over its own connection has no channel of this kind, and neither has an SFU.
	 *
	 * Every intent goes to pull and asks no permission of it first, unlike the presence intents beside it:
	 * a mesh is raised only where this client may publish, and that is settled above the transport, before
	 * a channel of this kind is built at all. The negotiation of a mesh travels pull alone - there is no
	 * second carrier for an sdp here - so a mesh chosen for a client that cannot publish is an error of
	 * whoever assembled the planes, not a case for this channel to fall back from.
	 */
	class NegotiationChannel implements NegotiationListener {
		constructor(options: NegotiationChannelOptions);
		/**
		 * Asks the other side for a round of negotiation. It carries no connection: the side that offers
		 * mints the id, and this intent is sent by the side that does not offer.
		 */
		sendNegotiationNeeded(to: ParticipantId, negotiation?: NegotiationNeededArgs): void;
		/**
		 * Offer of this side, and the point at which its connection becomes the one in flight: the offerer
		 * mints the id, so from here on an answer or a candidate naming another connection is stale.
		 */
		sendOffer(to: ParticipantId, offer: NegotiationDescription): void;
		/** Answer of this side. The connection in flight was settled by the offer it answers. */
		sendAnswer(to: ParticipantId, answer: NegotiationDescription): void;
		/**
		 * Adds candidates to the batch of that side and starts the window over: the batch goes out once
		 * they stop arriving, so gathering that trickles in over a few hundred milliseconds becomes one
		 * command. Candidates of a connection that is no longer the one being gathered for replace the
		 * batch instead of joining it - the peer would drop a mixed one as stale anyway.
		 */
		sendIceCandidates(to: ParticipantId, batch: NegotiationIceBatch): void;
		/**
		 * Idempotent. Cancels every ICE batch still waiting and drops what it gathered, so no candidate
		 * of a finished call reaches the wire after it. Nothing is sent and nothing is delivered to the
		 * listener afterwards: the connections this channel spoke for are gone with the call.
		 */
		close(): void;
		onNegotiationNeeded(from: ParticipantId, payload: PullPayload): void;
		/**
		 * An offer decides the connection of that side rather than being checked against it, so a
		 * renegotiation is carried through instead of being dropped: the consumer is told which connection
		 * the offer displaces and the new one is in flight from here on.
		 */
		onConnectionOffer(from: ParticipantId, payload: PullPayload): void;
		/** Late answers are dropped: applying one to the connection that replaced its own would break it. */
		onConnectionAnswer(from: ParticipantId, payload: PullPayload): void;
		/** Dropped on the same terms as a late answer: a candidate belongs to one connection only. */
		onIceCandidate(from: ParticipantId, payload: PullPayload): void;
	}

	/**
	 * Refusals of the controller itself rather than of a connection: they answer about the state the cycle
	 * is in, and no attempt was taken for either of them.
	 */
	const ReconnectContractCode: {
		readonly AlreadyRunning: 'reconnect.already_running';
		readonly Closed: 'reconnect.closed';
	};

	/**
	 * The cycle of recovery, one for a mesh connection and an SFU one alike: it runs the attempts, spends
	 * the injected budget and decides when there is nothing left to try. It is an internal component of a
	 * transport - semantically the cycle belongs to the `MediaTransport` that composes it - and not an
	 * abstraction any layer above the transport addresses.
	 *
	 * What an attempt actually is stays outside: an ICE restart, a rejoin of a session, a fresh offer with
	 * `iceRestart` - all of it arrives as the injected `attempt`. That is what makes the cycle the same code
	 * for both planes, and what lets a plane state through the error it answers with whether repeating is
	 * worth anything at all.
	 *
	 * One cycle runs at a time: a `run` that finds one in flight refuses instead of starting a second, so no
	 * two attempts of recovery overlap. A cycle that ended - reconnected or failed - leaves the controller
	 * ready to run again, because a connection that broke twice is two cycles and not one.
	 *
	 * Triggers are plural on purpose. A network that came back is one of them and lives here: the controller
	 * subscribes to it and starts the cycle when the environment reports online after having been offline. A
	 * connection lost on a live network is the other one, and it belongs to the transport - it observes its
	 * own ICE state and calls `run()` itself.
	 *
	 * `close` is idempotent and terminal: the environment subscription is let go, a pause in flight is
	 * cancelled and the loop it held is woken so that it stops at once. No event reaches the listener after
	 * it, and no attempt is taken.
	 */
	class ReconnectController {
		constructor(options: ReconnectControllerOptions);
		/**
		 * Runs the cycle: `reconnecting` at the start, then attempt after attempt until one succeeds
		 * (`reconnected`) or the budget is spent, or an error the plane cannot recover from arrives - both of
		 * which end in the terminal `failure`. The answer repeats the outcome for whoever started the cycle
		 * and waits for it; a trigger that does not wait reads the events instead.
		 *
		 * A cycle already in flight and a closed controller both refuse without touching the listener.
		 *
		 * Everything the cycle does stands under the `finally` that clears the mark of a running cycle,
		 * announcement included: a consumer that breaks out of `reconnecting` ends this cycle rather than
		 * leaving the controller unable to start another one ever again.
		 */
		run(): Promise<Result<void, TransportError>>;
		/**
		 * Idempotent. Stops the cycle where it stands: the pause it was waiting out is cancelled, the loop
		 * wakes to find the controller closed and answers `Cancelled` without an event, and the environment
		 * is no longer listened to - so nothing starts a cycle afterwards either.
		 */
		close(): void;
	}

	/**
	 * `PullPort` over the pull client. The name of the pull module and the `Call::` prefix live here and
	 * nowhere else: a caller publishes a bare signal and reads a typed message, in both directions.
	 *
	 * Beyond bridging, the adapter owns the envelope - the connection ids and a fresh request id on
	 * every publish - and the pull addressing of the call: `publicIds` of a server message naming this call
	 * are taken out of an incoming envelope and handed to the channel, which is why `PullMessage` has none.
	 * A publication of a client carries no addressing this port will take: a side able to place its own
	 * channel in the map would have every publication addressed to another participant delivered to it.
	 * The same addressing is what lets the adapter name the participant a message was published from, so a
	 * message states both the channel it arrived over and, when the addressing places it, whose channel
	 * that was. The addressing a connection was acquired with reaches none of this on its own - it comes
	 * with the answer of the server, above the port - so `applyAddressing` is the entry that seeds it.
	 * Nothing else is decided here: choosing a channel, retrying and falling back are the policy of the
	 * caller, and so is what a message naming another call - or one whose stated sender is not the owner
	 * of its channel - means to a consumer.
	 */
	class BxPullPort implements PullPort {
		constructor(options: BxPullPortOptions);
		/**
		 * A refusal the channel answers after the fact stops here: the send reports no delivery, so `void` is
		 * all a caller gets and there is nobody left to hand a late refusal to - unread, it would be an
		 * unhandled rejection. A primitive that breaks on the spot is left alone instead: that break reaches
		 * the caller, and the intent that stated the publish is what swallows it.
		 */
		publish(recipients: ParticipantId[], signal: PullSignal, payload: PullPayload, expirySeconds?: number): void;
		subscribeIncoming(listener: (message: PullMessage) => void): () => void;
		isPublishingSupported(): boolean;
		isPublishingEnabled(): boolean;
		/**
		 * Seeds the addressing the connection was acquired with, so the channel is addressed and the
		 * participant behind a channel is namable before any server message of the call arrives. Read by the
		 * same rule an incoming one is: a value holding no usable descriptor leaves what the channel already
		 * holds in place, and a later server message replaces the set as a whole.
		 *
		 * Owed by the composition root before `subscribeIncoming`, and not merely before the first server
		 * message: until it is called every message this port hands over states a channel the addressing
		 * places nobody on, and a consumer refusing what it cannot place loses exactly the signals a classic
		 * call opens with - `answer`, `hangup` and the mesh handshake, none of which is sent a second time.
		 */
		applyAddressing(publicChannels: unknown): void;
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
	class BxRestPort implements RestPort {
		constructor(ajax: AjaxActionRunner);
		callAction<TResult = unknown>(action: RestActionName, payload?: RestActionPayload): Promise<Result<TResult>>;
	}

	/**
	 * `HttpPort` over the request primitive: one request by absolute URL, the answer handed over raw.
	 *
	 * The line it draws is between an answer and no answer, not between a good and a bad one - a 4xx or
	 * a 5xx is an answer and comes back as `Ok` with `ok: false`, and what a status means is left to the
	 * caller. `Err` is for having nothing to hand over: the request never reached the endpoint, the
	 * signal aborted it, or the deadline of that signal ran out. Reading the body is part of the answer
	 * arriving - a body that cannot be read is not a partial answer, it is none.
	 *
	 * Nothing else happens here: the port sets no deadline of its own, retries nothing, and cancels
	 * nothing on its own initiative - the signal it aborts on is the one it was given.
	 */
	class FetchHttpPort implements HttpPort {
		constructor(fetchPrimitive: FetchPrimitive);
		request(request: HttpRequest): Promise<Result<HttpResponse>>;
	}

	/**
	 * `MediaDevicesPort` over the media-devices primitive, and the only normalizing adapter of the
	 * transport. It hides the quirks of the primitive and nothing else: one relaxed retry of constraints
	 * the device could not meet, a device list without the software entries that are not hardware, a
	 * device-change notification calmed down to one call per burst, and a refusal turned into a typed
	 * `Result` instead of an exception a caller would have to catch.
	 *
	 * It takes no decision about the call: who owns the tracks and how long they live is settled above,
	 * in `LocalMediaSource`. The debounce window runs on the injected `ClockPort`, so a test advances it
	 * by hand instead of waiting half a second.
	 */
	class NavigatorMediaDevicesPort implements MediaDevicesPort {
		constructor(options: NavigatorMediaDevicesPortOptions);
		getUserMedia(constraints: MediaStreamConstraints): Promise<Result<MediaStream>>;
		getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<Result<MediaStream>>;
		enumerateDevices(): Promise<Result<MediaDeviceInfo[]>>;
		/** The primitive is listened to from the first subscriber on, and let go of in `dispose()`. */
		subscribeDeviceChange(listener: () => void): () => void;
		dispose(): void;
	}

	/**
	 * `ClockPort` over the timers of the host. It measures and schedules, and that is all: no default
	 * delay, no growing interval, no budget - how long to wait and how many times is the policy of the
	 * caller.
	 *
	 * Cancelling is safe to do unconditionally, as the port promises. The handle is forgotten both when
	 * the cancel function runs and when a one-shot callback fires, so a second cancel - or a cancel after
	 * the callback - reaches no timer at all, not even one that has since been given the same handle.
	 */
	class TimerClockPort implements ClockPort {
		constructor(options: TimerClockPortOptions);
		now(): number;
		scheduleOnce(callback: () => void, delayMs: number): () => void;
		scheduleRepeating(callback: () => void, intervalMs: number): () => void;
	}

	/**
	 * `EnvironmentPort` over the signals of the browser. Each subscription turns the event names of the
	 * host into the state the port promises - a listener is told the new value and never sees an event
	 * object - and every unsubscribe function detaches what it attached, both listeners of a pair
	 * included.
	 *
	 * A departure is forwarded as it comes, without remembering the first one: closing a connection is
	 * idempotent, so a repeat costs nothing, while a page restored from the back/forward cache and left
	 * again would otherwise have its second departure swallowed.
	 *
	 * Nothing is decided here: whether a regained network starts a reconnect and whether a hidden page
	 * stops a ping is the policy of the caller.
	 */
	class BrowserEnvironmentPort implements EnvironmentPort {
		constructor(options: BrowserEnvironmentPortOptions);
		isOnline(): boolean;
		subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void;
		isVisible(): boolean;
		subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void;
		subscribeUnload(listener: () => void): () => void;
		isDesktop(): boolean;
	}

	/**
	 * `LoggerPort` over a logging primitive, with the second level of secret protection: known sensitive
	 * fields of `details` are redacted before anything is written, at every depth - `monitoring.token`
	 * inside a connection descriptor goes the same way a top-level token does.
	 *
	 * This does not replace the first level, which is that components do not hand tokens or a whole
	 * descriptor to the log in the first place; a general logger cannot recognise a secret in an arbitrary
	 * object, so the two levels are needed together. `message` is written as it came: by contract it is a
	 * fixed text and everything variable travels in `details`, which is what leaves redaction something to
	 * work on.
	 *
	 * The adapter keeps no state - a redacted copy is built per call and nothing is held after the write,
	 * so no secret outlives the connection through the logger.
	 */
	class LoggerPortAdapter implements LoggerPort {
		constructor(primitive: LoggingPrimitive);
		log(message: string, details?: LogDetails): void;
		warn(message: string, details?: LogDetails): void;
		error(message: string, details?: LogDetails): void;
	}
}
