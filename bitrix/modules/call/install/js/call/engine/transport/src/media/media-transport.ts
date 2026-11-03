import type { ConnectionDescriptor } from '../domain/connection-descriptor';
import type { MediaEndpointId, ParticipantId } from '../domain/participant';
import type { Quality } from '../domain/quality';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { RemoteMuteListener } from '../signaling/pull-dispatcher';

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
export const MediaTrackKind: {
	readonly Audio: 'audio',
	readonly Video: 'video',
	readonly Screen: 'screen',
	readonly ScreenAudio: 'screen-audio',
} = Object.freeze({
	Audio: 'audio',
	Video: 'video',
	Screen: 'screen',
	ScreenAudio: 'screen-audio',
});

export type MediaTrackKind = typeof MediaTrackKind[keyof typeof MediaTrackKind];

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
export interface MediaTransportListener extends RemoteMuteListener
{
	/** A remote track of that side is now flowing; its kind is read off the track itself. */
	onRemoteTrackAdded(participantId: ParticipantId, track: MediaStreamTrack): void;

	/** Named by kind, because the track it is about is already gone and cannot be asked. */
	onRemoteTrackRemoved(participantId: ParticipantId, kind: MediaTrackKind): void;

	/** The level the plane observes for that side; what to do about a drop is decided above. */
	onConnectionQualityChanged(participantId: ParticipantId, quality: Quality): void;

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
export interface MediaTransport
{
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
	setRemoteQuality(participantId: ParticipantId, quality: Quality): Promise<Result<void, TransportError>>;

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

/**
 * Names of the intents, derived from the contract rather than listed again: a table keyed by this type
 * covers every intent by construction, and the compiler names the one it is missing. Teardown is left
 * out - `close` answers no result and carries no outcome, so it is no intent.
 */
export type MediaTransportIntent = keyof Omit<MediaTransport, 'close'>;
