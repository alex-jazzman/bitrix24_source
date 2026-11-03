/**
 * Pure storage for MediaStream and MediaRenderer objects.
 * Keyed by userId (integer) for remote renderers or stored directly for the local stream.
 * Holds no business logic and has no Vue/Pinia dependency.
 */
class MediaStreamRegistry
{
	#localStream: MediaStream | null;
	#renderers: Map<number, unknown>;
	#audioElements: Map<number, HTMLAudioElement>;

	constructor()
	{
		this.#localStream = null;
		this.#renderers = new Map();
		this.#audioElements = new Map();
	}

	/**
	 * Replaces the stored local stream reference.
	 * Does NOT call .stop() on the old stream — caller's responsibility.
	 */
	setLocalStream(stream: MediaStream | null): void
	{
		this.#localStream = stream ?? null;
	}

	/**
	 * Returns the current local stream or null.
	 */
	getLocalStream(): MediaStream | null
	{
		return this.#localStream;
	}

	/**
	 * Sets localStream to null. Does NOT call .stop().
	 */
	removeLocalStream(): void
	{
		this.#localStream = null;
	}

	/**
	 * Stores renderer in the renderers Map under key userId.
	 * If renderer is null or undefined, removes the entry.
	 */
	setRenderer(userId: number, renderer: unknown): void
	{
		if (renderer === null || renderer === undefined)
		{
			this.#renderers.delete(userId);

			return;
		}

		this.#renderers.set(userId, renderer);
	}

	/**
	 * Returns the renderer for userId or null if not found.
	 */
	getRenderer(userId: number): unknown | null
	{
		return this.#renderers.get(userId) ?? null;
	}

	/**
	 * Deletes the entry for userId from the Map.
	 */
	removeRenderer(userId: number): void
	{
		this.#renderers.delete(userId);
	}

	/**
	 * Attaches an audio track to a hidden <audio> element for the given userId.
	 * Creates the element on first call; replaces the stream on subsequent calls.
	 * If track is null, removes the audio element.
	 */
	setAudioTrack(userId: number, track: MediaStreamTrack | null): void
	{
		if (!track)
		{
			this.removeAudioTrack(userId);

			return;
		}

		let audio = this.#audioElements.get(userId);

		if (!audio)
		{
			audio = document.createElement('audio');
			audio.autoplay = true;
			// Dom.style is not used intentionally: this extension must remain zero-dependency.
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-style
			audio.style.display = 'none';
			document.body.append(audio);
			this.#audioElements.set(userId, audio);
		}

		audio.srcObject = new MediaStream([track]);
	}

	/**
	 * Removes and cleans up the audio element for userId.
	 */
	removeAudioTrack(userId: number): void
	{
		const audio = this.#audioElements.get(userId);

		if (audio)
		{
			audio.srcObject = null;
			audio.remove();
			this.#audioElements.delete(userId);
		}
	}

	/**
	 * Resets local stream to null and clears all renderer entries.
	 * Does NOT call .stop() on any tracks.
	 */
	clear(): void
	{
		this.#localStream = null;
		this.#renderers.clear();
		this.#audioElements.forEach((audioElement) => {
			const el = audioElement;
			el.srcObject = null;
			el.remove();
		});
		this.#audioElements.clear();
	}
}

const mediaStreamRegistry = new MediaStreamRegistry();

export { mediaStreamRegistry as MediaStreamRegistry };
