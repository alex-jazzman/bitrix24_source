import { err, isErr, ok } from '../error/result';
import type { Result } from '../error/result';
import type { Cancelled, ContractError, DeniedError, TransportError } from '../error/transport-error';
import type { MediaDevicesPort } from '../port/media-devices-port';

/**
 * The local surfaces a call is built from. One track is stored per surface, and no more than one.
 *
 * `ScreenAudio` is the audio of the shared screen, and the only surface nobody asks for on its own: a
 * capture is handed its audio at the moment it is obtained and can be given none afterwards, so the
 * picker of the screen is what decides whether this surface has a track at all.
 */
export const LocalMediaKind: {
	readonly Camera: 'camera',
	readonly Microphone: 'microphone',
	readonly Screen: 'screen',
	readonly ScreenAudio: 'screen-audio',
} = Object.freeze({
	Camera: 'camera',
	Microphone: 'microphone',
	Screen: 'screen',
	ScreenAudio: 'screen-audio',
});

export type LocalMediaKind = typeof LocalMediaKind[keyof typeof LocalMediaKind];

/** The two surfaces that come from one call of the devices port and are told apart only here. */
type UserMediaKind = typeof LocalMediaKind.Camera | typeof LocalMediaKind.Microphone;

/**
 * Reasons of a refusal this source hands out. The camera and the microphone are named by the source,
 * because the port answers one refusal for both and only the caller of a surface knows which one it
 * asked for; a dismissed screen picker keeps the reason the port gave it, which is what tells the two
 * refusals apart without reading a message.
 */
export const LocalMediaDenialReason: {
	readonly Camera: 'camera',
	readonly Microphone: 'microphone',
	readonly ScreenPicker: 'screen-picker',
} = Object.freeze({
	Camera: 'camera',
	Microphone: 'microphone',
	ScreenPicker: 'screen-picker',
});

export type LocalMediaDenialReason = typeof LocalMediaDenialReason[keyof typeof LocalMediaDenialReason];

/**
 * Codes this source puts on a failure that is neither a refusal nor a network one: the media API
 * answered, but not with something a call can be built from.
 */
export const LocalMediaContractCode: {
	readonly MissingTrack: 'local_media.missing_track',
	readonly Closed: 'local_media.closed',
} = Object.freeze({
	MissingTrack: 'local_media.missing_track',
	Closed: 'local_media.closed',
});

export type LocalMediaContractCode = typeof LocalMediaContractCode[keyof typeof LocalMediaContractCode];

/**
 * What the source reports rather than answers. Enabling a surface answers with its track, and
 * disabling one is done by the caller, so neither needs an event: what is left is what happens without
 * anyone asking.
 */
export interface LocalMediaSourceListener
{
	/**
	 * A stored track ended on its own - the device went away, or the screen share was stopped from the
	 * bar of the browser. The track is already gone from the source when this arrives.
	 */
	onLocalTrackEnded(kind: LocalMediaKind): void;

	/** The set of devices changed; the fresh list is read back through `listDevices`. */
	onDeviceListChanged(): void;
}

export type LocalMediaSourceOptions = {
	mediaDevices: MediaDevicesPort,
	listener: LocalMediaSourceListener,
};

/**
 * The refusal `MediaDevicesPort` answers for a camera and a microphone alike: it cannot tell which of
 * them was asked for, and this source can.
 */
const PORT_USER_MEDIA_DENIAL = 'user-media';

/** The platform tells a track ended only when it ended by itself: `stop()` of ours fires nothing. */
const TRACK_ENDED_EVENT = 'ended';

/** A track that is held, together with the device it was asked for and the way to stop watching it. */
type StoredTrack = {
	track: MediaStreamTrack,
	deviceId: string | undefined,
	unwatch: () => void,
};

/**
 * A capture the platform has not answered yet: what it was asked for, and the outcome every caller of it
 * is answered with. `id` is what tells one attempt at a surface from the next one.
 */
type PendingCapture = {
	id: number,
	deviceId: string | undefined,
	result: Promise<Result<MediaStreamTrack, TransportError>>,
};

function contract(code: LocalMediaContractCode): ContractError
{
	return { kind: 'contract', code };
}

function denied(reason: LocalMediaDenialReason): DeniedError
{
	return { kind: 'denied', reason };
}

function cancelled(): Cancelled
{
	return { kind: 'cancelled' };
}

/** Whether media of one device answers a request for another: a request without a device takes any. */
function servesDevice(held: string | undefined, wanted: string | undefined): boolean
{
	return wanted === undefined || wanted === held;
}

/**
 * Names the surface a refusal was about. Only the generic refusal of the port is refined - a dismissed
 * picker and a missing media API already say something this source cannot improve on.
 */
function nameRefusedSurface(error: TransportError, kind: UserMediaKind): TransportError
{
	if (error.kind !== 'denied' || error.reason !== PORT_USER_MEDIA_DENIAL)
	{
		return error;
	}

	return denied(kind);
}

/** `exact` on purpose: the port relaxes it to `ideal` itself when the device cannot meet it. */
function userMediaConstraints(kind: UserMediaKind, deviceId: string | undefined): MediaStreamConstraints
{
	const wanted = deviceId === undefined ? true : { deviceId: { exact: deviceId } };

	return kind === LocalMediaKind.Microphone
		? { audio: wanted, video: false }
		: { audio: false, video: wanted };
}

/** The one place a surface is mapped to the kind of track it is carried by inside a stream. */
function pickTrack(kind: LocalMediaKind, stream: MediaStream): MediaStreamTrack | undefined
{
	const carriesAudio = kind === LocalMediaKind.Microphone || kind === LocalMediaKind.ScreenAudio;
	const tracks = carriesAudio ? stream.getAudioTracks() : stream.getVideoTracks();

	return tracks[0];
}

function stopAll(tracks: MediaStreamTrack[]): void
{
	tracks.forEach((track) => track.stop());
}

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
export class LocalMediaSource
{
	#mediaDevices: MediaDevicesPort;
	#listener: LocalMediaSourceListener;
	#tracks: Map<LocalMediaKind, StoredTrack> = new Map();
	#pending: Map<LocalMediaKind, PendingCapture> = new Map();
	#captureCount: number = 0;
	#unsubscribeDeviceChange: () => void;
	#closed: boolean = false;

	constructor(options: LocalMediaSourceOptions)
	{
		this.#mediaDevices = options.mediaDevices;
		this.#listener = options.listener;
		this.#unsubscribeDeviceChange = this.#mediaDevices.subscribeDeviceChange(() => this.#onDeviceChange());
	}

	/**
	 * Camera. Hands the stored track back when it is still live and the device asked for is the one it
	 * came from; another device is a switch - the new track is obtained first, and the previous one is
	 * stopped only once it arrived, so a refused switch leaves a working camera in place.
	 */
	enableCamera(deviceId?: string): Promise<Result<MediaStreamTrack, TransportError>>
	{
		return this.#enableUserMedia(LocalMediaKind.Camera, deviceId);
	}

	/** Microphone, on the same terms as the camera. */
	enableMicrophone(deviceId?: string): Promise<Result<MediaStreamTrack, TransportError>>
	{
		return this.#enableUserMedia(LocalMediaKind.Microphone, deviceId);
	}

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
	async enableScreen(): Promise<Result<MediaStreamTrack, TransportError>>
	{
		if (this.#closed)
		{
			return err(contract(LocalMediaContractCode.Closed));
		}

		const stored = this.#reusableTrack(LocalMediaKind.Screen, undefined);

		if (stored !== undefined)
		{
			return ok(stored);
		}

		if (this.#closed)
		{
			// a capture that died silently is reported from here, and a consumer may close the source on it
			return err(contract(LocalMediaContractCode.Closed));
		}

		const pending = this.#pending.get(LocalMediaKind.Screen);

		if (pending !== undefined)
		{
			// the screen is chosen in the picker, so a second call has nothing of its own to ask for
			return pending.result;
		}

		return this.#beginCapture(LocalMediaKind.Screen, undefined, (id) => this.#captureScreen(id));
	}

	disableCamera(): void
	{
		this.#abandon(LocalMediaKind.Camera);
	}

	disableMicrophone(): void
	{
		this.#abandon(LocalMediaKind.Microphone);
	}

	/** One capture gave the screen and its audio, and one call lets both of them go. */
	disableScreen(): void
	{
		this.#abandon(LocalMediaKind.Screen);
		this.#release(LocalMediaKind.ScreenAudio);
	}

	/**
	 * The track a surface currently holds - what a local preview renders, and what a transport is handed
	 * to publish. Absent while the surface is off: reading it obtains nothing and asks for no permission.
	 */
	getTrack(kind: LocalMediaKind): MediaStreamTrack | undefined
	{
		return this.#tracks.get(kind)?.track;
	}

	/** The devices the port counts as real; the source neither caches the list nor filters it further. */
	async listDevices(): Promise<Result<MediaDeviceInfo[], TransportError>>
	{
		if (this.#closed)
		{
			return err(contract(LocalMediaContractCode.Closed));
		}

		return this.#mediaDevices.enumerateDevices();
	}

	/**
	 * Idempotent. Stops every track it owns - the source is their owner, so no transport has to - and
	 * lets the port go. Nothing is reported to the listener after it, and no surface is enabled again.
	 */
	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#unsubscribeDeviceChange();
		[...this.#tracks.keys()].forEach((kind) => this.#release(kind));
		this.#mediaDevices.dispose();
	}

	async #enableUserMedia(
		kind: UserMediaKind,
		deviceId: string | undefined,
	): Promise<Result<MediaStreamTrack, TransportError>>
	{
		if (this.#closed)
		{
			return err(contract(LocalMediaContractCode.Closed));
		}

		const stored = this.#reusableTrack(kind, deviceId);

		if (stored !== undefined)
		{
			// the surface already holds what was asked for, which leaves a capture on its way superseded
			this.#pending.delete(kind);

			return ok(stored);
		}

		const pending = this.#pending.get(kind);

		if (pending !== undefined && servesDevice(pending.deviceId, deviceId))
		{
			// the same device is already being asked for: one request of the system answers both callers
			return pending.result;
		}

		return this.#beginCapture(kind, deviceId, (id) => this.#captureUserMedia(kind, deviceId, id));
	}

	async #captureUserMedia(
		kind: UserMediaKind,
		deviceId: string | undefined,
		id: number,
	): Promise<Result<MediaStreamTrack, TransportError>>
	{
		try
		{
			const result = await this.#mediaDevices.getUserMedia(userMediaConstraints(kind, deviceId));

			if (isErr(result))
			{
				return err(nameRefusedSurface(result.error, kind));
			}

			return this.#store(kind, deviceId, id, result.value);
		}
		finally
		{
			this.#forget(kind, id);
		}
	}

	async #captureScreen(id: number): Promise<Result<MediaStreamTrack, TransportError>>
	{
		try
		{
			const result = await this.#mediaDevices.getDisplayMedia({ video: true, audio: true });

			if (isErr(result))
			{
				return err(result.error);
			}

			return this.#storeCapture(result.value, id);
		}
		finally
		{
			this.#forget(LocalMediaKind.Screen, id);
		}
	}

	/**
	 * Takes the surface over for one attempt and runs it. Taking it over is what supersedes the attempt
	 * that held it before: an attempt counts for as long as the surface is registered to it, and one that
	 * lost the surface stops what it obtained instead of storing it.
	 */
	#beginCapture(
		kind: LocalMediaKind,
		deviceId: string | undefined,
		capture: (id: number) => Promise<Result<MediaStreamTrack, TransportError>>,
	): Promise<Result<MediaStreamTrack, TransportError>>
	{
		this.#captureCount++;

		const id = this.#captureCount;
		const result = capture(id);

		this.#pending.set(kind, { id, deviceId, result });

		return result;
	}

	/**
	 * The reason an attempt must not store what it obtained: the source was closed, or the surface it was
	 * about was commanded elsewhere while the platform was answering.
	 */
	#discardReason(kind: LocalMediaKind, id: number): TransportError | undefined
	{
		if (this.#closed)
		{
			return contract(LocalMediaContractCode.Closed);
		}

		if (this.#pending.get(kind)?.id !== id)
		{
			return cancelled();
		}

		return undefined;
	}

	/** Lets go of an attempt that is over, leaving alone the surface a later one has taken over. */
	#forget(kind: LocalMediaKind, id: number): void
	{
		if (this.#pending.get(kind)?.id === id)
		{
			this.#pending.delete(kind);
		}
	}

	/**
	 * Lets a surface go entirely: the track it holds is stopped, and a capture of it on its way stops
	 * counting, so what that capture obtains is stopped rather than switching the device back on.
	 */
	#abandon(kind: LocalMediaKind): void
	{
		this.#pending.delete(kind);
		this.#release(kind);
	}

	/** The stored track when it can serve the request, and nothing when the surface has to be obtained. */
	#reusableTrack(kind: LocalMediaKind, deviceId: string | undefined): MediaStreamTrack | undefined
	{
		const stored = this.#tracks.get(kind);

		if (stored === undefined)
		{
			return undefined;
		}

		if (stored.track.readyState === 'ended')
		{
			// the track died without the event reaching here; reusing it would publish silence
			this.#release(kind);

			if (kind === LocalMediaKind.Screen)
			{
				this.#endScreenAudio();
			}

			return undefined;
		}

		if (!servesDevice(stored.deviceId, deviceId))
		{
			return undefined;
		}

		return stored.track;
	}

	#store(
		kind: LocalMediaKind,
		deviceId: string | undefined,
		id: number,
		stream: MediaStream,
	): Result<MediaStreamTrack, TransportError>
	{
		const track = pickTrack(kind, stream);

		if (track === undefined)
		{
			stopAll(stream.getTracks());

			return err(contract(LocalMediaContractCode.MissingTrack));
		}

		// whatever else the stream carried is held by nobody, and an unheld track keeps the device busy
		stopAll(stream.getTracks().filter((other) => other !== track));

		const discarded = this.#discardReason(kind, id);

		if (discarded !== undefined)
		{
			// closed or commanded elsewhere while the platform was answering: released instead of stored
			track.stop();

			return err(discarded);
		}

		this.#hold(kind, deviceId, track);

		return ok(track);
	}

	/**
	 * Stores one screen capture: the video as the screen, and the audio it came with - where it came with
	 * any - as the surface beside it. Both belong to the same capture, so the previous audio goes whatever
	 * the new capture carries: an audio surface left over from a capture that is gone would be published
	 * as the sound of a screen nobody is sharing any more.
	 */
	#storeCapture(stream: MediaStream, id: number): Result<MediaStreamTrack, TransportError>
	{
		const screen = pickTrack(LocalMediaKind.Screen, stream);
		const screenAudio = pickTrack(LocalMediaKind.ScreenAudio, stream);

		if (screen === undefined)
		{
			stopAll(stream.getTracks());

			return err(contract(LocalMediaContractCode.MissingTrack));
		}

		stopAll(stream.getTracks().filter((other) => other !== screen && other !== screenAudio));

		const discarded = this.#discardReason(LocalMediaKind.Screen, id);

		if (discarded !== undefined)
		{
			// closed or let go of while the picker was open: the capture is released instead of stored
			stopAll(screenAudio === undefined ? [screen] : [screen, screenAudio]);

			return err(discarded);
		}

		this.#release(LocalMediaKind.ScreenAudio);

		if (screenAudio !== undefined)
		{
			this.#hold(LocalMediaKind.ScreenAudio, undefined, screenAudio);
		}

		this.#hold(LocalMediaKind.Screen, undefined, screen);

		return ok(screen);
	}

	/** Takes a track into a surface, letting go of whatever that surface was holding before it. */
	#hold(kind: LocalMediaKind, deviceId: string | undefined, track: MediaStreamTrack): void
	{
		this.#release(kind);
		this.#tracks.set(kind, { track, deviceId, unwatch: this.#watchEnd(kind, track) });
	}

	#watchEnd(kind: LocalMediaKind, track: MediaStreamTrack): () => void
	{
		const onEnded = (): void => this.#onTrackEnded(kind);

		track.addEventListener(TRACK_ENDED_EVENT, onEnded);

		return () => track.removeEventListener(TRACK_ENDED_EVENT, onEnded);
	}

	#onTrackEnded(kind: LocalMediaKind): void
	{
		const stored = this.#tracks.get(kind);

		if (stored === undefined)
		{
			return;
		}

		stored.unwatch();
		this.#tracks.delete(kind);

		if (kind === LocalMediaKind.Screen)
		{
			this.#endScreenAudio();
		}

		// the consumer may have closed the source from the end reported just above, and close is terminal
		if (this.#closed)
		{
			return;
		}

		this.#listener.onLocalTrackEnded(kind);
	}

	/**
	 * The capture is gone, so its audio goes with it - the same invariant a new capture is stored under,
	 * and the one a share stopped from the bar of the browser would otherwise break: an audio surface that
	 * outlived its capture is published as the sound of a screen nobody is sharing any more. The end is
	 * reported like any other, because the surface is gone for a consumer either way.
	 */
	#endScreenAudio(): void
	{
		if (!this.#tracks.has(LocalMediaKind.ScreenAudio))
		{
			return;
		}

		this.#release(LocalMediaKind.ScreenAudio);
		this.#listener.onLocalTrackEnded(LocalMediaKind.ScreenAudio);
	}

	/** Stops the track of a surface without reporting it: this end was asked for by the caller. */
	#release(kind: LocalMediaKind): void
	{
		const stored = this.#tracks.get(kind);

		if (stored === undefined)
		{
			return;
		}

		stored.unwatch();
		this.#tracks.delete(kind);
		stored.track.stop();
	}

	#onDeviceChange(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#listener.onDeviceListChanged();
	}
}
