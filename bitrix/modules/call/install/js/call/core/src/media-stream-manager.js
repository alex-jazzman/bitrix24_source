import { CallSettingsManager } from 'call.lib.settings-manager';
import { MediaStreamsKinds } from './call_api';
import { Hardware } from './call_hardware';

class StreamManager
{
	#streams;
	#tracks;
	#trackRequests;
	#isLegacyDesktop: Boolean;

	constructor()
	{
		this.#streams = {};
		this.#tracks = {};
		this.#trackRequests = {};
		this.#isLegacyDesktop = window?.BXDesktopSystem?.GetProperty('versionParts')?.[3] < 78;
	}

	getLocalStream(mediaStreamKind): ?MediaStreamTrack
	{
		return this.#tracks[mediaStreamKind]?.track || null;
	}

	async getUserMedia(constraints): Promise<MediaStream>
	{
		const promises = this.#getUserMedia(constraints);

		return this.#processGetUserMediaPromises(promises);
	}

	async getUserScreen(): Promise<MediaStream>
	{
		const promises = this.#getUserScreen();

		return this.#processGetUserMediaPromises(promises);
	}

	stopStream(mediaStreamKind): void
	{
		if (this.#trackRequests[mediaStreamKind])
		{
			this.#trackRequests[mediaStreamKind]?.then(() => {
				this.stopStream(mediaStreamKind);
			});
			delete this.#trackRequests[mediaStreamKind];
		}

		if (this.#tracks[mediaStreamKind])
		{
			if (mediaStreamKind === MediaStreamsKinds.Microphone)
			{
				Hardware.stopNoiseSuppression();
			}
			this.#tracks[mediaStreamKind].track.stop();
			delete this.#tracks[mediaStreamKind];
		}
	}

	#processGetUserMediaPromises(promises): Promise<MediaStream>
	{
		return Promise.allSettled(promises)
			.then((results) => {
				const tracks = new Map();

				results.forEach((result) => {
					if (result.reason)
					{
						throw result.reason;
					}

					result.value.forEach((track) => {
						tracks.set(track.id, track);
					});
				});

				if (tracks.size > 0)
				{
					return new MediaStream([...tracks.values()]);
				}

				throw {name: 'StreamManagerError_getUserMedia', message: 'Could not get any media stream'};
			});
	}

	#getUserMedia(constraints): Promise<?MediaStreamTrack>[]
	{
		const promises = [];
		const newConstraints = { video: false, audio: false };
		const videoPromise = this.#getMediaPromise(constraints.video, MediaStreamsKinds.Camera);
		const audioPromise = this.#getMediaPromise(constraints.audio, MediaStreamsKinds.Microphone);

		if (videoPromise)
		{
			promises.push(videoPromise);
		}
		else if (constraints.video)
		{
			newConstraints.video = constraints.video;
		}

		if (audioPromise)
		{
			promises.push(audioPromise);
		}
		else if (constraints.audio)
		{
			newConstraints.audio = constraints.audio;
		}

		if (promises.length === (Number(Boolean(constraints.video)) + Number(Boolean(constraints.audio))))
		{
			return promises;
		}

		const streamPromise = new Promise((resolve, reject) => {
			Hardware.getUserMedia(newConstraints)
				.then((stream) => {
					const videoTrack = stream.getVideoTracks()?.[0];
					const audioTrack = stream.getAudioTracks()?.[0];

					if (videoTrack)
					{
						this.#tracks[MediaStreamsKinds.Camera]?.track?.stop();
						this.#tracks[MediaStreamsKinds.Camera] = {
							track: videoTrack,
							constraints: constraints.video,
						};
						delete this.#trackRequests[MediaStreamsKinds.Camera];
					}

					if (audioTrack)
					{
						if (audioTrack.id !== this.#tracks[MediaStreamsKinds.Microphone]?.track.id)
						{
							this.#tracks[MediaStreamsKinds.Microphone]?.track?.stop();
							this.#tracks[MediaStreamsKinds.Microphone] = {
								track: audioTrack,
								constraints: constraints.audio,
							};
						}
						delete this.#trackRequests[MediaStreamsKinds.Microphone];
					}

					resolve(stream.getTracks());
				})
				.catch((error) => {
					if (newConstraints.video)
					{
						delete this.#tracks[MediaStreamsKinds.Camera];
						delete this.#trackRequests[MediaStreamsKinds.Camera];
					}

					if (newConstraints.audio)
					{
						delete this.#tracks[MediaStreamsKinds.Microphone];
						delete this.#trackRequests[MediaStreamsKinds.Microphone];
					}

					reject(error);
				});
		});

		if (newConstraints.video)
		{
			this.#trackRequests[MediaStreamsKinds.Camera] = streamPromise;
		}

		if (newConstraints.audio)
		{
			this.#trackRequests[MediaStreamsKinds.Microphone] = streamPromise;
		}

		promises.push(streamPromise);

		return promises;
	}

	#getUserScreen(): Promise<?MediaStreamTrack>[]
	{
		const promises = [];
		let streamRequest = null;
		const videoPromise = this.#getMediaPromise(undefined, MediaStreamsKinds.Screen);
		const audioPromise = this.#getMediaPromise(undefined, MediaStreamsKinds.ScreenAudio);

		if (videoPromise)
		{
			promises.push(videoPromise);
		}

		if (audioPromise)
		{
			promises.push(audioPromise);
		}

		if (promises.length > 0)
		{
			return promises;
		}

		const screenConstraints = this.#getScreenConstraints();

		if (this.#isLegacyDesktop)
		{
			streamRequest = Hardware.getUserMedia(screenConstraints);
		}
		else if (navigator.mediaDevices.getDisplayMedia)
		{
			streamRequest = navigator.mediaDevices.getDisplayMedia(screenConstraints);
		}
		else
		{
			const error = {
				message: 'Screen sharing is not supported',
			};
			promises.push(Promise.reject(error));

			return promises;
		}

		const streamPromise = new Promise((resolve, reject) => {
			streamRequest
				.then((stream) => {
					const videoTrack = stream.getVideoTracks()?.[0];
					const audioTrack = stream.getAudioTracks()?.[0];

					if (videoTrack)
					{
						this.#tracks[MediaStreamsKinds.Screen]?.track?.stop();
						this.#tracks[MediaStreamsKinds.Screen] = {
							track: videoTrack,
						};
						delete this.#trackRequests[MediaStreamsKinds.Screen];
					}

					if (audioTrack)
					{
						this.#tracks[MediaStreamsKinds.ScreenAudio]?.track?.stop();
						this.#tracks[MediaStreamsKinds.ScreenAudio] = {
							track: audioTrack,
						};
						delete this.#trackRequests[MediaStreamsKinds.ScreenAudio];
					}

					resolve(stream.getTracks());
				})
				.catch((error) => {
					delete this.#tracks[MediaStreamsKinds.Screen];
					delete this.#tracks[MediaStreamsKinds.ScreenAudio];
					delete this.#trackRequests[MediaStreamsKinds.Screen];
					delete this.#trackRequests[MediaStreamsKinds.ScreenAudio];

					reject(error);
				});
		});

		this.#trackRequests[MediaStreamsKinds.Screen] = streamPromise;
		this.#trackRequests[MediaStreamsKinds.ScreenAudio] = streamPromise;

		promises.push(streamPromise);

		return promises;
	}

	#isSameConstraints(constraintsA, constraintsB): boolean
	{
		if (!constraintsA && !constraintsB)
		{
			return true;
		}

		if (!constraintsA || !constraintsB)
		{
			return false;
		}

		const keys1 = Object.keys(constraintsA);
		const keys2 = Object.keys(constraintsB);

		if (keys1.length !== keys2.length)
		{
			return false;
		}

		for (const key of keys1)
		{
			if (JSON.stringify(constraintsA[key]) !== JSON.stringify(constraintsB[key]))
			{
				return false;
			}
		}

		return true;
	}

	#getMediaPromise(constraints, kind): ?Promise<?MediaStreamTrack>
	{
		const trackRequest = this.#trackRequests[kind];

		if (constraints && trackRequest)
		{
			return trackRequest;
		}

		const localTrack = this.#tracks[kind];
		const isSameConstraints = this.#isSameConstraints(constraints, localTrack?.constraints);
		const isInputTrackLived = !CallSettingsManager.noiseSuppressionEnabled
			|| kind !== MediaStreamsKinds.Microphone
			|| (Hardware.noiseSuppressionInputStream
				&& Hardware.noiseSuppressionInputStream.getAudioTracks().length > 0
				&& Hardware.noiseSuppressionInputStream.getAudioTracks()[0].readyState === 'live');
		if (
			localTrack?.track?.readyState === 'live'
			&& isInputTrackLived
			&& isSameConstraints
		)
		{
			return Promise.resolve([localTrack.track]);
		}

		return null;
	}

	#getScreenConstraints(): MediaStreamConstraints
	{
		const screenShareWidth = 1920;
		const screenShareHeight = 1080;

		if (this.#isLegacyDesktop)
		{
			return {
				video: {
					mandatory: {
						chromeMediaSource: 'screen',
						maxWidth: screenShareWidth,
						maxHeight: screenShareHeight,
						maxFrameRate: 5,
					},
				},
			};
		}

		return {
			video: {
				cursor: 'always',
				width: {
					ideal: screenShareWidth,
				},
				height: {
					ideal: screenShareHeight,
				},
			},
			systemAudio: 'include',
			audio: true,
		};
	}
}

export const CallStreamManager = new StreamManager();
