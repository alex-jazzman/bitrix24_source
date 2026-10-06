import { MediaStreamsKinds } from './sdk/const';
import { Hardware } from './call_hardware';

// A request that was superseded by a newer one is rejected with this error name so clients can tell
// it apart from a genuine media-acquisition failure and skip the fallback capture.
export const STREAM_MANAGER_SUPERSEDED = 'StreamManagerError_superseded';

class StreamManager
{
	#streams;
	#tracks;
	#trackRequests;
	#requestSeq;
	#micRequestChain;
	#isLegacyDesktop: Boolean;

	constructor()
	{
		this.#streams = {};
		this.#tracks = {};
		this.#trackRequests = {};
		this.#requestSeq = {};
		this.#micRequestChain = null;
		this.#isLegacyDesktop = window?.BXDesktopSystem?.GetProperty('versionParts')?.[3] < 78;
	}

	getLocalStream(mediaStreamKind): ?MediaStreamTrack
	{
		return this.#tracks[mediaStreamKind]?.track || null;
	}

	setLocalStream(mediaStreamKind, track): void
	{
		this.#tracks[mediaStreamKind] = { track };
	}

	clearStream(mediaStreamKind): void
	{
		delete this.#tracks[mediaStreamKind];
		delete this.#trackRequests[mediaStreamKind];
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
		const trackRequest = this.#trackRequests[mediaStreamKind];
		const hasLocalTrack = Boolean(this.#tracks[mediaStreamKind]);
		if (trackRequest)
		{
			const requestSeq = this.#requestSeq[mediaStreamKind];
			trackRequest.promise?.then(() => {
				// Skip a deferred stop if a newer request superseded the one it was
				// scheduled for, so it can't kill a freshly requested track.
				if (this.#requestSeq[mediaStreamKind] === requestSeq)
				{
					this.stopStream(mediaStreamKind);
				}
			})?.catch(() => {
				// The original request rejected (superseded/failed) - it produced no track to stop, and its
				// own consumer already handled the rejection. Swallow it so it isn't an unhandled rejection.
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

		if (
			mediaStreamKind === MediaStreamsKinds.Microphone
			&& !trackRequest
			&& !hasLocalTrack
			&& Hardware.noiseSuppressionInputStream
		)
		{
			// What holds the device is the noise suppression graph, not the cache entry: #tracks keeps only the
			// graph's processed output, while the raw mic lives in noiseSuppressionInputStream. A capture that
			// fails erases its cache entry without touching the graph an earlier capture left behind, so the
			// branch above finds nothing to reap and the raw mic stays captured with nobody consuming it. Here
			// no capture is in flight to adopt that graph and no track is cached, so this teardown is its last
			// owner. It cannot mute a live publication: every caller reaches this only after stopping its own
			// stream. A raw-fallback mic (the graph failed to init) leaves no input stream, so it is untouched.
			Hardware.stopNoiseSuppression();
		}

		if (mediaStreamKind === MediaStreamsKinds.Microphone && !trackRequest)
		{
			// Drop the mic capture chain at this teardown boundary so the next session starts a fresh chain,
			// but only when no mic capture is in flight (trackRequest was falsy on entry). Resetting while a
			// capture is still running would let a new capture run in parallel against the shared
			// NoiseSuppression graph, losing the serialization the chain provides (an old late getUserMedia
			// could close the AudioContext / stop the new raw track). A truly hung in-flight capture is not
			// force-broken here (needs NS-session cancellation). Mid device-switch this is reached only from
			// CallApi.#releaseStream, and only for a call that leaves needToStopStreams on - the plain engine
			// turns it off for the CallApi it creates, so its switch never passes through here.
			this.#micRequestChain = null;
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

		// Seq captured per kind when this request is registered below. Every completion handler
		// checks it so a late old request (divergent constraints run in parallel) can never mutate
		// the current #tracks/#trackRequests - it only stops its own now-stale result.
		const requestSeq = {};

		// Microphone captures share one NoiseSuppressionService (a single AudioContext / input stream /
		// destination). Running divergent-constraint captures truly in parallel lets a new capture tear
		// down and recreate that graph via stopNoiseSuppression()/turn() while an older turn() is still
		// mutating it - which can stop the new input or return a dead processed track. The seq-guard only
		// protects state at settle time, not the NS graph mutation during the in-flight turn(). So chain
		// each new mic capture on the previous one's settle: the NS reconfiguration is never concurrent,
		// and last-request-wins still holds (the newest constraints run last, and older settled captures
		// are seq-stale so they cannot mutate current state).
		let mediaRequest;
		if (newConstraints.audio)
		{
			const previousMicRequest = this.#micRequestChain ?? Promise.resolve();
			mediaRequest = previousMicRequest.then(() => {
				// Skip a dead intermediate selection: if a newer mic request already superseded this one
				// before its turn to run, don't capture/reconfigure NS at all - return a no-op so the
				// newest request is not delayed behind a request nobody wants anymore.
				const micSuperseded = !this.#isCurrentRequest(MediaStreamsKinds.Microphone, requestSeq);
				const videoSuperseded = !newConstraints.video || !this.#isCurrentRequest(MediaStreamsKinds.Camera, requestSeq);
				if (micSuperseded && videoSuperseded)
				{
					return null;
				}

				return Hardware.getUserMedia(newConstraints);
			});
			this.#micRequestChain = mediaRequest.catch(() => {});
		}
		else
		{
			mediaRequest = Hardware.getUserMedia(newConstraints);
		}

		const streamPromise = new Promise((resolve, reject) => {
			mediaRequest
				.then((stream) => {
					if (!stream)
					{
						// This mic capture was skipped as superseded-before-launch. Report it as a superseded
						// no-op (not a media failure) so the client does not run a fallback.
						reject({ name: STREAM_MANAGER_SUPERSEDED, message: 'Media request superseded before capture' });
						return;
					}

					const videoTrack = stream.getVideoTracks()?.[0];
					const audioTrack = stream.getAudioTracks()?.[0];

					// FINAL partial-supersede contract: supersede-drop applies ONLY to a single-kind request (a
					// standalone device switch) - a stale one is dropped so the switch's stale capture no-ops. A
					// multi-kind (combined initial) request always resolves with every track it captured; a kind of it
					// that a newer standalone switch superseded is left in the resolved stream (the switch replaces that
					// kind at the consumer). Each current kind is committed to #tracks (the reuse cache reaped by
					// stopStream); a superseded kind is not cached - its newer owner caches its own.
					const capturedKindCount = (videoTrack ? 1 : 0) + (audioTrack ? 1 : 0);
					const isDeviceSwitch = capturedKindCount === 1;
					const videoSuperseded = Boolean(videoTrack) && !this.#isCurrentRequest(MediaStreamsKinds.Camera, requestSeq);
					const audioSuperseded = Boolean(audioTrack) && !this.#isCurrentRequest(MediaStreamsKinds.Microphone, requestSeq);

					if (videoTrack)
					{
						if (!videoSuperseded)
						{
							this.#tracks[MediaStreamsKinds.Camera]?.track?.stop();
							this.#tracks[MediaStreamsKinds.Camera] = {
								track: videoTrack,
								constraints: constraints.video,
							};
							delete this.#trackRequests[MediaStreamsKinds.Camera];
						}
						else if (isDeviceSwitch)
						{
							stream.removeTrack(videoTrack);
							videoTrack.stop();
						}
					}

					if (audioTrack)
					{
						if (!audioSuperseded)
						{
							if (audioTrack.id !== this.#tracks[MediaStreamsKinds.Microphone]?.track.id)
							{
								this.#tracks[MediaStreamsKinds.Microphone]?.track?.stop();
							}

							// The cache entry is refreshed even when the track is the same object: with noise
							// suppression the processed track survives a device switch, and its constraints are what
							// the next request is deduplicated against - stale ones would hand back the old device.
							this.#tracks[MediaStreamsKinds.Microphone] = {
								track: audioTrack,
								constraints: constraints.audio,
							};

							delete this.#trackRequests[MediaStreamsKinds.Microphone];
						}
						else if (isDeviceSwitch)
						{
							stream.removeTrack(audioTrack);

							// audioTrack is only the processed OUTPUT; the raw mic lives in noiseSuppressionInputStream.
							// That output belongs to the noise suppression graph, not to this request: while the graph
							// still hands it out, disposing of it is the next capture's job - it replaces the graph and
							// releases the raw mic behind it. A raw-fallback track (the graph failed to init) has no
							// graph behind it, so it is this request's to stop.
							if (!Hardware.noiseSuppressionOutputStream?.getTrackById(audioTrack.id))
							{
								audioTrack.stop();
							}
						}
					}

					const remainingTracks = stream.getTracks();
					if (remainingTracks.length === 0)
					{
						// A single-kind (device-switch) request whose only kind was superseded: report a superseded no-op
						// (not a media failure) so the consumer does not run a fallback; the newer request owns that kind.
						reject({ name: STREAM_MANAGER_SUPERSEDED, message: 'Media request superseded' });
						return;
					}

					resolve(remainingTracks);
				})
				.catch((error) => {
					let anyCurrent = false;

					if (newConstraints.video)
					{
						if (this.#isCurrentRequest(MediaStreamsKinds.Camera, requestSeq))
						{
							anyCurrent = true;
							delete this.#tracks[MediaStreamsKinds.Camera];
							delete this.#trackRequests[MediaStreamsKinds.Camera];
						}
					}

					if (newConstraints.audio)
					{
						if (this.#isCurrentRequest(MediaStreamsKinds.Microphone, requestSeq))
						{
							anyCurrent = true;
							delete this.#tracks[MediaStreamsKinds.Microphone];
							delete this.#trackRequests[MediaStreamsKinds.Microphone];
						}
					}

					// getUserMedia is atomic: on failure no kind was captured. Report SUPERSEDED only when
					// EVERY requested kind was already superseded (each is re-delivered by its newer owner, so
					// the consumer must not fall back). If any requested kind is still current, its genuine
					// failure must propagate so that kind's consumer can fall back / report it.
					reject(anyCurrent ? error : { name: STREAM_MANAGER_SUPERSEDED, message: 'Media request superseded' });
				});
		});

		if (newConstraints.video)
		{
			requestSeq[MediaStreamsKinds.Camera] = this.#setTrackRequest(MediaStreamsKinds.Camera, streamPromise, newConstraints.video);
		}

		if (newConstraints.audio)
		{
			requestSeq[MediaStreamsKinds.Microphone] = this.#setTrackRequest(MediaStreamsKinds.Microphone, streamPromise, newConstraints.audio);
		}

		promises.push(streamPromise);

		return promises;
	}

	#setTrackRequest(kind, promise, constraints): number
	{
		this.#requestSeq[kind] = (this.#requestSeq[kind] || 0) + 1;
		this.#trackRequests[kind] = { promise, constraints };

		return this.#requestSeq[kind];
	}

	#isCurrentRequest(kind, requestSeq): boolean
	{
		// A kind absent from the snapshot was not registered by this request, so it is not stale.
		return requestSeq[kind] === undefined || this.#requestSeq[kind] === requestSeq[kind];
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

		this.#setTrackRequest(MediaStreamsKinds.Screen, streamPromise, undefined);
		this.#setTrackRequest(MediaStreamsKinds.ScreenAudio, streamPromise, undefined);

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
			// Reuse an in-flight request only when its constraints match; a request
			// for a different device must not receive the previous device's promise.
			if (this.#isSameConstraints(constraints, trackRequest.constraints))
			{
				return trackRequest.promise;
			}

			return null;
		}

		const localTrack = this.#tracks[kind];
		const isSameConstraints = this.#isSameConstraints(constraints, localTrack?.constraints);
		const isInputTrackLived = kind !== MediaStreamsKinds.Microphone
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
