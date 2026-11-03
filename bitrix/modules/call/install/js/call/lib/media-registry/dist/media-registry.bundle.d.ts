/* eslint-disable */
declare namespace BX.Call.Lib.MediaRegistry {
	const MediaStreamRegistry: MediaStreamRegistry;

	/**
	 * Pure storage for MediaStream and MediaRenderer objects.
	 * Keyed by userId (integer) for remote renderers or stored directly for the local stream.
	 * Holds no business logic and has no Vue/Pinia dependency.
	 */
	class MediaStreamRegistry {
		constructor();
		/**
		 * Replaces the stored local stream reference.
		 * Does NOT call .stop() on the old stream — caller's responsibility.
		 */
		setLocalStream(stream: MediaStream | null): void;
		/**
		 * Returns the current local stream or null.
		 */
		getLocalStream(): MediaStream | null;
		/**
		 * Sets localStream to null. Does NOT call .stop().
		 */
		removeLocalStream(): void;
		/**
		 * Stores renderer in the renderers Map under key userId.
		 * If renderer is null or undefined, removes the entry.
		 */
		setRenderer(userId: number, renderer: unknown): void;
		/**
		 * Returns the renderer for userId or null if not found.
		 */
		getRenderer(userId: number): unknown | null;
		/**
		 * Deletes the entry for userId from the Map.
		 */
		removeRenderer(userId: number): void;
		/**
		 * Attaches an audio track to a hidden <audio> element for the given userId.
		 * Creates the element on first call; replaces the stream on subsequent calls.
		 * If track is null, removes the audio element.
		 */
		setAudioTrack(userId: number, track: MediaStreamTrack | null): void;
		/**
		 * Removes and cleans up the audio element for userId.
		 */
		removeAudioTrack(userId: number): void;
		/**
		 * Resets local stream to null and clears all renderer entries.
		 * Does NOT call .stop() on any tracks.
		 */
		clear(): void;
	}
}
