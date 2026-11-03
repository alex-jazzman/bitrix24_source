import type { Result } from '../error/result';

/**
 * Local media. The only normalizing port: it hides the quirks of the media-devices primitive
 * (constraint relaxation, virtual devices, a chatty device-change notification) and turns every
 * refusal into a typed outcome instead of an exception. It still takes no decision about the call -
 * who owns the tracks and how long they live is settled above, in `LocalMediaSource`.
 */
export interface MediaDevicesPort
{
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
