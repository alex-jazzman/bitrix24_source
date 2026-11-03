/**
 * Authorization schema of a call. The transport does not choose it - the layer above does, and hands
 * it down in the request - but the schema decides which acquisition answered, so it is the
 * discriminant of the descriptor union below.
 */
export const CallScheme: {
	readonly Classic: 1,
	readonly Jwt: 2,
} = Object.freeze({
	Classic: 1,
	Jwt: 2,
});

export type CallScheme = typeof CallScheme[keyof typeof CallScheme];

/**
 * Kind of room a connection is made to. A pass-through variator: the transport carries it and never
 * branches on it - what a conference or a large room means belongs to the layers above. The
 * vocabulary is here only so the value on the wire is validated instead of copied blindly.
 */
export const RoomType: {
	readonly Small: 1,
	readonly Conference: 2,
	readonly Large: 3,
	readonly Personal: 4,
} = Object.freeze({
	Small: 1,
	Conference: 2,
	Large: 3,
	Personal: 4,
});

export type RoomType = typeof RoomType[keyof typeof RoomType];

/**
 * Monitoring endpoints the balancer hands out with a connection. Pass-through: the transport neither
 * reads nor sends anything to them. Every field is optional because the answer carries the block as a
 * whole and names inside it only when the server has them.
 */
export type ConnectionMonitoring = {
	metricsServerUrl?: string,
	logsServerUrl?: string,
	token?: string,
	env?: string,
	region?: string,
};

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
export type JwtConnectionDescriptor = {
	scheme: typeof CallScheme.Jwt,
	mediaServerUrl: string,
	/** Opaque: the transport forwards it into the media plane and never parses it. */
	roomData: string,
	roomId: string,
	roomType: RoomType,
	/** Unix seconds, as the balancer sends them; a consumer that needs milliseconds scales it itself. */
	startDate: number,
	/** Whether the balancer created the room rather than letting the caller into an existing one. */
	isNew: boolean,
	monitoring?: ConnectionMonitoring,
};

/**
 * Connection of the classic schema, as `call.CallManager.create` answered - the path that carries its
 * connection data inline and reaches no balancer. Deliberately not aligned with the jwt variant: the
 * two schemas answer with genuinely different data, and a common shape would only be reached by
 * inventing fields neither server sends.
 */
export type ClassicConnectionDescriptor = {
	scheme: typeof CallScheme.Classic,
	/**
	 * Numeric server-side id of the call, the one the classic `call.CallManager.*` actions are
	 * addressed by, and the same id the server names every incoming envelope of the channel by - so
	 * a classic connection filters its incoming signaling on this value. Classic-only: the jwt
	 * schema addresses a room and has no counterpart, and gets that id from elsewhere.
	 */
	serverCallId: number,
	/**
	 * Uuid of the call. Optional by fact of the server: it is generated for a one-to-one call and
	 * stays empty for a call created without one, so a classic connection is identified by
	 * `serverCallId` and this is the identity the upper layers share with the jwt path when it exists.
	 */
	roomId?: string,
	/**
	 * Kind of room the connection was asked for, carried over from the request: the classic answer
	 * names no room type of its own - its `TYPE` is the type of the call - so nothing is read off the
	 * wire here.
	 */
	roomType: RoomType,
	/** As the server sends it: a timestamp or a formatted date, kept in the form it came in. */
	startDate: number | string,
	/** Whether the server created the call rather than answering with one that was already running. */
	isNew: boolean,
	/** Opaque inline connection data of the classic path - the counterpart of jwt `roomData`. */
	connectionData: unknown,
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
	publicChannels?: unknown,
};

/**
 * Normalized outcome of acquiring a connection - v1, discriminated by `scheme`. Plane-independent by
 * contract: no SDP, no ICE and no endpoint of a media plane reaches it. A consumer tells the variants
 * apart by the discriminant; nothing but the discriminant is shared between them.
 */
export type ConnectionDescriptor = JwtConnectionDescriptor | ClassicConnectionDescriptor;
