/**
 * Canonical id of the remote side, independent of the media plane. Its source is the roster context
 * of the layer above the transport (in the current Bitrix contract - the user id): the planes only
 * map their native ids onto it, the transport never invents one. Carries neither roles nor rights.
 */
export type ParticipantId = string;

/**
 * Opaque id of a media source, for a side that has several of them (one ParticipantId to many
 * MediaEndpointId): it covers both a device and an SFU shard. Never parsed and never derived from -
 * the transport only forwards it, so no media server id is encoded here.
 */
export type MediaEndpointId = string;

/**
 * Maps a native id of one plane onto the canonical participant id. Injected into the transport from
 * above, so signaling and media resolve against the same source and the canonical id survives an
 * escalation between planes.
 */
export interface ParticipantResolver
{
	/** `null` while the sender is unknown: the caller holds or drops the event instead of guessing. */
	resolveSender(senderId: string): ParticipantId | null;

	/** `null` while the endpoint mapping has not arrived yet. */
	resolveMediaEndpoint(mediaEndpointId: MediaEndpointId): ParticipantId | null;
}
