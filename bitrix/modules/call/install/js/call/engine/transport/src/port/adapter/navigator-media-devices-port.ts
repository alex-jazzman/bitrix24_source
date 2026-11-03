import { err, ok } from '../../error/result';
import type { Result } from '../../error/result';
import type { DeniedError, TransportError } from '../../error/transport-error';
import type { ClockPort } from '../clock-port';
import type { MediaDevicesPort } from '../media-devices-port';

/**
 * The slice of `navigator.mediaDevices` this adapter drives, injected instead of read off a global:
 * that is what makes the normalization below testable without a browser and without a permission.
 *
 * Every member is optional on purpose - a host without the media API is a case the port answers, so
 * the type has to admit the absence instead of promising a method that is not there.
 */
export type MediaDevicesPrimitive = {
	getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
	getDisplayMedia?: (constraints?: DisplayMediaStreamOptions) => Promise<MediaStream>,
	enumerateDevices?: () => Promise<MediaDeviceInfo[]>,
	addEventListener?: (type: string, listener: () => void) => void,
	removeEventListener?: (type: string, listener: () => void) => void,
};

export type NavigatorMediaDevicesPortOptions = {
	/** `navigator.mediaDevices` in production; absent in a host that carries no media API at all. */
	mediaDevices?: MediaDevicesPrimitive,
	clock: ClockPort,
};

/** One change of the device set makes the primitive fire several times; only the last one is passed on. */
const DEVICE_CHANGE_DEBOUNCE_MS = 500;
const DEVICE_CHANGE_EVENT = 'devicechange';

/** Error names of the platform: they are read here and never leave this file. */
const OVERCONSTRAINED_ERROR = 'OverconstrainedError';
const USER_MEDIA_DENIAL_ERRORS = ['NotAllowedError', 'PermissionDeniedError'];
const SCREEN_PICKER_DENIAL_ERRORS = ['NotAllowedError', 'AbortError'];

/** Vocabulary of `denied` this port produces: the refusals a caller tells apart without a message. */
const DENIED_USER_MEDIA = 'user-media';
const DENIED_SCREEN_PICKER = 'screen-picker';
const DENIED_UNSUPPORTED = 'unsupported';

/** Labels of software devices that are not hardware; the set confirmed by the legacy call stack. */
const VIRTUAL_DEVICE_LABELS = ['(virtual)', 'zoomaudiodevice', 'microsoft teams audio', 'bitrixaudio'];

/** Alias Windows adds for the default communication device: the same hardware listed a second time. */
const DUPLICATE_DEVICE_ID = 'communications';
const AUDIO_DEVICE_KINDS = ['audioinput', 'audiooutput'];

type UnknownRecord = { [field: string]: unknown };

/**
 * A list is not one, unlike the record predicate of the wire readers: what is read here is an error
 * of the platform and a constraint object, and neither of them is ever an array.
 */
function isPlainRecord(value: unknown): value is UnknownRecord
{
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function denied(reason: string): DeniedError
{
	return { kind: 'denied', reason };
}

function readErrorName(error: unknown): string | undefined
{
	if (!isPlainRecord(error))
	{
		return undefined;
	}

	return typeof error.name === 'string' ? error.name : undefined;
}

/** The constraint the platform blamed, and only when it blamed one: elsewhere no relaxation happens. */
function readOverconstrainedName(error: unknown): string | undefined
{
	if (readErrorName(error) !== OVERCONSTRAINED_ERROR || !isPlainRecord(error))
	{
		return undefined;
	}

	return typeof error.constraint === 'string' ? error.constraint : undefined;
}

type TrackConstraints = MediaStreamConstraints['audio'];

function relaxTrack(track: TrackConstraints, constraintName: string): TrackConstraints
{
	if (!isPlainRecord(track))
	{
		return track;
	}

	const constraint = track[constraintName];

	if (!isPlainRecord(constraint) || !('exact' in constraint))
	{
		return track;
	}

	const { exact, ...rest } = constraint;

	return { ...track, [constraintName]: { ...rest, ideal: exact } };
}

/**
 * Demotes `exact` of the named constraint to `ideal` in both tracks. Returns the constraints it was
 * given - the same object, by identity - when there was no such `exact`, which is how the caller
 * tells that a retry would repeat the very same request.
 */
function relaxExactToIdeal(
	constraints: MediaStreamConstraints,
	constraintName: string | undefined,
): MediaStreamConstraints
{
	if (constraintName === undefined || constraintName === '')
	{
		return constraints;
	}

	const audio = relaxTrack(constraints.audio, constraintName);
	const video = relaxTrack(constraints.video, constraintName);

	if (audio === constraints.audio && video === constraints.video)
	{
		return constraints;
	}

	return { ...constraints, audio, video };
}

/** A refused camera or microphone is a typed outcome; anything else the platform threw is a failure. */
function classifyUserMediaError(error: unknown): TransportError
{
	const name = readErrorName(error);

	if (name !== undefined && USER_MEDIA_DENIAL_ERRORS.includes(name))
	{
		return denied(DENIED_USER_MEDIA);
	}

	return { kind: 'network', cause: error };
}

function isRealDevice(device: MediaDeviceInfo): boolean
{
	if (!AUDIO_DEVICE_KINDS.includes(device.kind))
	{
		return true;
	}

	if (device.deviceId === DUPLICATE_DEVICE_ID)
	{
		return false;
	}

	const label = device.label.toLowerCase();

	return !VIRTUAL_DEVICE_LABELS.some((virtualLabel) => label.includes(virtualLabel));
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
export class NavigatorMediaDevicesPort implements MediaDevicesPort
{
	#mediaDevices: MediaDevicesPrimitive | undefined;
	#clock: ClockPort;
	#listeners: Set<() => void> = new Set();
	#detachPrimitive: (() => void) | undefined = undefined;
	#cancelDebounce: (() => void) | undefined = undefined;
	#disposed: boolean = false;

	constructor(options: NavigatorMediaDevicesPortOptions)
	{
		this.#mediaDevices = options.mediaDevices;
		this.#clock = options.clock;
	}

	async getUserMedia(constraints: MediaStreamConstraints): Promise<Result<MediaStream>>
	{
		const primitive = this.#mediaDevices;

		if (primitive?.getUserMedia === undefined)
		{
			return err(denied(DENIED_UNSUPPORTED));
		}

		const request = primitive.getUserMedia.bind(primitive);

		try
		{
			return ok(await request(constraints));
		}
		catch (error)
		{
			const relaxed = relaxExactToIdeal(constraints, readOverconstrainedName(error));

			if (relaxed === constraints)
			{
				return err(classifyUserMediaError(error));
			}

			try
			{
				return ok(await request(relaxed));
			}
			catch (retryError)
			{
				// one retry and no more: a second refusal is the answer, relaxed or not
				return err(classifyUserMediaError(retryError));
			}
		}
	}

	async getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<Result<MediaStream>>
	{
		const primitive = this.#mediaDevices;

		if (primitive?.getDisplayMedia === undefined)
		{
			return err(denied(DENIED_UNSUPPORTED));
		}

		try
		{
			return ok(await primitive.getDisplayMedia(constraints));
		}
		catch (error)
		{
			const name = readErrorName(error);

			if (name !== undefined && SCREEN_PICKER_DENIAL_ERRORS.includes(name))
			{
				return err(denied(DENIED_SCREEN_PICKER));
			}

			return err({ kind: 'network', cause: error });
		}
	}

	async enumerateDevices(): Promise<Result<MediaDeviceInfo[]>>
	{
		const primitive = this.#mediaDevices;

		if (primitive?.enumerateDevices === undefined)
		{
			return err(denied(DENIED_UNSUPPORTED));
		}

		try
		{
			const devices = await primitive.enumerateDevices();

			return ok(devices.filter((device) => isRealDevice(device)));
		}
		catch (error)
		{
			return err({ kind: 'network', cause: error });
		}
	}

	/** The primitive is listened to from the first subscriber on, and let go of in `dispose()`. */
	subscribeDeviceChange(listener: () => void): () => void
	{
		if (this.#disposed)
		{
			return () => {};
		}

		this.#listeners.add(listener);
		this.#attachPrimitive();

		return () => {
			this.#listeners.delete(listener);
		};
	}

	dispose(): void
	{
		this.#disposed = true;

		this.#cancelDebounce?.();
		this.#cancelDebounce = undefined;

		this.#detachPrimitive?.();
		this.#detachPrimitive = undefined;

		this.#listeners.clear();
	}

	#attachPrimitive(): void
	{
		const primitive = this.#mediaDevices;

		if (this.#detachPrimitive !== undefined || primitive?.addEventListener === undefined)
		{
			return;
		}

		const handler = (): void => this.#onPrimitiveDeviceChange();

		primitive.addEventListener(DEVICE_CHANGE_EVENT, handler);
		this.#detachPrimitive = () => primitive.removeEventListener?.(DEVICE_CHANGE_EVENT, handler);
	}

	#onPrimitiveDeviceChange(): void
	{
		this.#cancelDebounce?.();
		this.#cancelDebounce = this.#clock.scheduleOnce(() => {
			this.#cancelDebounce = undefined;
			[...this.#listeners].forEach((listener) => listener());
		}, DEVICE_CHANGE_DEBOUNCE_MS);
	}
}
