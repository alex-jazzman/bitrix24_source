/* eslint-disable max-classes-per-file */
import { Browser, Type, Event } from 'main.core';
import { Hardware } from '../call_hardware';

const loadAccidentLogger = () => BX.Runtime.loadExtension('call.lib.accident-logger');

const SpeakerManagerEvent = {
	onSpeakerConfirmed: 'onSpeakerConfirmed',
	onSpeakerFallback: 'onSpeakerFallback',
};

class SpeakerStrategy
{
	// Whether setSinkId calls require an active user gesture (e.g. Safari).
	// Used to skip async device switching that would fail without interaction.
	requiresUserGesture = false;

	applySinkId(): Promise<void>
	{
		return Promise.resolve();
	}

	onRegister()
	{}

	logError(prefix, reason)
	{
		const error = reason instanceof Error ? reason : new Error(String(reason));
		const tag = this.constructor.name.replace('SpeakerStrategy', '').replace('Default', '');
		const tagPrefix = tag ? ` ${tag}` : '';
		error.message = `[SpeakerManager]${tagPrefix} ${prefix}: ${error.message}`;
		loadAccidentLogger()
			.then(({ accidentLogger }) => accidentLogger?.addLog(error, 'speakerManager'))
			.catch(() => {});
	}
}

class DefaultSpeakerStrategy extends SpeakerStrategy
{
	#playingHandlers = new WeakMap();

	applySinkId(audioElement, deviceId): Promise<void>
	{
		const stream = audioElement.srcObject;

		// Restart after setSinkId: the audio sink has changed but the
		// existing MediaStream may keep feeding the old output on some Chromium builds.
		// Detaching and re-attaching srcObject forces the browser to route audio
		// through the newly selected sink.
		return audioElement.setSinkId(deviceId)
			.catch((error) => {
				this.logError(`setSinkId(${deviceId})`, error);

				if (deviceId === '')
				{
					throw error;
				}

				return audioElement.setSinkId('')
					.catch((fallbackError) => {
						this.logError("setSinkId('')", fallbackError);

						throw fallbackError;
					})
					.then(() => {
						this.#restartPlayback(audioElement, stream, 0);

						throw error;
					});
			})
			.then(() => this.#restartPlayback(audioElement, stream, 0));
	}

	onRegister(audioElement, userId, getDesiredDeviceId)
	{
		const targetDeviceId = getDesiredDeviceId();

		this.applySinkId(audioElement, targetDeviceId).catch((error) => {
			this.logError('onRegister applySinkId', error);
		});

		const previousHandler = this.#playingHandlers.get(audioElement);
		if (previousHandler)
		{
			Event.unbind(audioElement, 'playing', previousHandler);
		}

		// Chromium race: pre-warm setSinkId() is async; RemoteMediaAdded may call play() before it settles,
		// so the first frames use the default sink. Re-apply the desired sink once playback actually starts.
		const onPlaying = () => {
			Event.unbind(audioElement, 'playing', onPlaying);
			this.#playingHandlers.delete(audioElement);
			const desired = getDesiredDeviceId();
			if (desired && audioElement.sinkId !== desired)
			{
				this.applySinkId(audioElement, desired).catch((error) => {
					this.logError('onRegister playing applySinkId', error);
				});
			}
		};

		this.#playingHandlers.set(audioElement, onPlaying);
		Event.bind(audioElement, 'playing', onPlaying);
	}

	#restartPlayback(audioElement, stream, attempt)
	{
		if (!stream)
		{
			return;
		}

		// eslint-disable-next-line no-param-reassign
		audioElement.srcObject = null;
		// eslint-disable-next-line no-param-reassign
		audioElement.srcObject = stream;

		audioElement.play()
			.catch((error) => {
				if (error?.name === 'AbortError' && attempt < 3)
				{
					const delay = (attempt + 1) * 500;
					setTimeout(() => this.#restartPlayback(audioElement, stream, attempt + 1), delay);
				}
				else
				{
					this.logError(`play() failed after ${attempt + 1} attempts`, error);
				}
			});
	}
}

class SafariSpeakerStrategy extends SpeakerStrategy
{
	requiresUserGesture = true;

	applySinkId(audioElement, deviceId): Promise<void>
	{
		if (!navigator.userActivation?.isActive)
		{
			console.warn('Safari: no user gesture, skipping setSinkId');

			const error = new Error('Safari: no user gesture, skipping setSinkId');

			return Promise.reject(error);
		}

		return audioElement.setSinkId(deviceId)
			.catch((error) => {
				this.logError(`setSinkId(${deviceId})`, error);

				throw error;
			});
	}
}

class FallbackSpeakerStrategy extends SpeakerStrategy
{
	#warned = false;

	applySinkId(): Promise<void>
	{
		if (!this.#warned)
		{
			this.#warned = true;
			console.warn('setSinkId not supported');
		}

		return Promise.resolve();
	}
}

function createStrategy(): SpeakerStrategy
{
	if (!SpeakerManager.supportsOutputSelection())
	{
		return new FallbackSpeakerStrategy();
	}

	if (Browser.isSafari())
	{
		return new SafariSpeakerStrategy();
	}

	return new DefaultSpeakerStrategy();
}

export class SpeakerManager
{
	static Event = SpeakerManagerEvent;

	static supportsOutputSelection(): boolean
	{
		return Type.isFunction(window.HTMLMediaElement)
			&& 'setSinkId' in HTMLMediaElement.prototype;
	}

	#strategy;
	#currentDeviceId = '';
	#audioElements = new Map();
	#sequenceId = 0;
	#callbacks = {};

	constructor(config = {})
	{
		this.#strategy = createStrategy();
		this.#callbacks = {
			onSpeakerConfirmed: config.onSpeakerConfirmed || (() => {}),
			onSpeakerFallback: config.onSpeakerFallback || (() => {}),
		};
	}

	get currentDeviceId(): string
	{
		return this.#currentDeviceId;
	}

	get requiresUserGesture(): boolean
	{
		return this.#strategy.requiresUserGesture;
	}

	applySinkIdToAll(deviceId): Promise<mixed>
	{
		if (this.#audioElements.size === 0)
		{
			return Promise.resolve();
		}

		const promises = [];
		for (const [, audioElement] of this.#audioElements)
		{
			promises.push(this.#strategy.applySinkId(audioElement, deviceId).catch((error) => {
				this.#strategy.logError(`setSpeakerId fallback setSpeakerId(${deviceId})`, error);

				throw error;
			}));
		}

		return Promise.allSettled(promises);
	}

	setSpeakerId(deviceId): Promise<void>
	{
		const effectiveId = deviceId || '';
		if (effectiveId === this.#currentDeviceId)
		{
			return Promise.resolve();
		}

		this.#currentDeviceId = effectiveId;
		Hardware.defaultSpeaker = this.#currentDeviceId;
		const seq = ++this.#sequenceId;

		return this.applySinkIdToAll(effectiveId).then((results) => {
			if (seq !== this.#sequenceId)
			{
				return;
			}

			const anyFailed = results?.some((r) => r.status === 'rejected') ?? false;
			if (anyFailed)
			{
				this.#currentDeviceId = '';
				Hardware.defaultSpeaker = this.#currentDeviceId;

				// eslint-disable-next-line consistent-return
				return this.applySinkIdToAll(this.#currentDeviceId)
					.then(() => {
						if (seq === this.#sequenceId)
						{
							this.#callbacks.onSpeakerFallback(this.#currentDeviceId);
						}
					});
			}

			this.#callbacks.onSpeakerConfirmed(this.#currentDeviceId);
		});
	}

	registerAudioElement(userId, audioElement)
	{
		this.#audioElements.set(String(userId), audioElement);

		if (!this.#currentDeviceId)
		{
			return;
		}

		this.#strategy.onRegister(audioElement, userId, () => this.#currentDeviceId);
	}

	unregisterAudioElement(userId)
	{
		this.#audioElements.delete(String(userId));
	}

	onDeviceLost(lostDeviceId): Promise<void>
	{
		if (this.#currentDeviceId !== lostDeviceId)
		{
			return Promise.resolve();
		}

		this.#currentDeviceId = '';
		Hardware.defaultSpeaker = this.#currentDeviceId;

		if (this.#strategy.requiresUserGesture)
		{
			this.#callbacks.onSpeakerFallback(this.#currentDeviceId);

			return Promise.resolve();
		}

		const seq = ++this.#sequenceId;

		return this.applySinkIdToAll(this.#currentDeviceId).then(() => {
			if (seq === this.#sequenceId)
			{
				this.#callbacks.onSpeakerFallback(this.#currentDeviceId);
			}
		});
	}

	onDeviceAdded(deviceId, isForce = true): Promise<void>
	{
		if (this.#strategy.requiresUserGesture)
		{
			if (deviceId !== this.#currentDeviceId)
			{
				this.#currentDeviceId = isForce ? deviceId : '';
				Hardware.defaultSpeaker = this.#currentDeviceId;
				this.#callbacks.onSpeakerConfirmed(this.#currentDeviceId);
			}

			return Promise.resolve();
		}

		return this.setSpeakerId(deviceId);
	}

	destroy()
	{
		this.#audioElements.clear();
		this.#callbacks = {};
		this.#sequenceId++;
	}
}
