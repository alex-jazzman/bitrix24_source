/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, ui_a11y, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_typography_vue, ui_vue3, im_v2_component_textarea, im_v2_lib_analytics, im_v2_lib_utils, im_v2_provider_service_uploading, main_core_events, im_v2_application_core, im_v2_lib_desktopApi, im_v2_lib_logger, im_v2_lib_voiceRecorder, im_v2_lib_helpdesk, im_v2_component_elements_player) {
	'use strict';

	// a record shorter than this is committed with a duration of zero seconds, and the player of such a
	// message plays nothing: neither the stop nor the send of the panel turns a recording into a record
	// before it holds that much, and a release of the hold below it leaves the recording running
	const MIN_RECORDING_MS = 800;

	const RecordingState = {
		idle: 'idle',
		requesting: 'requesting',
		recording: 'recording',
		paused: 'paused',
		stopped: 'stopped',
		error: 'error'
	};

	// a stop nobody asked for: the recorded fragment stays ready, the panel explains what interrupted it
	const RecordingStopReason = {
		otherTab: 'otherTab',
		callStarted: 'callStarted',
		durationLimit: 'durationLimit'
	};

	// each code is fixed in a different place, so each one gets a text of its own in the panel
	const RecordingErrorCode = {
		accessDeniedInSession: 'accessDeniedInSession',
		accessDeniedPermanently: 'accessDeniedPermanently',
		deviceNotFound: 'deviceNotFound',
		deviceBusy: 'deviceBusy',
		accessDeniedBySystem: 'accessDeniedBySystem'
	};

	// aac-lc always carries this many samples in one frame, so one frame is one sample of the container
	const SAMPLES_PER_FRAME = 1024;
	const UNDETERMINED_LANGUAGE = 0x55C4;
	const IDENTITY_MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
	const BYTES_IN_UINT32 = 4;
	const BOX_HEADER_LENGTH = 8;

	// the chunk offset box closes the sample table, and the table closes every box above it up to the
	// movie: size, type, version with flags, the number of entries and the single entry itself
	const CHUNK_OFFSET_BOX_LENGTH = 20;

	// a single byte of length covers a descriptor payload below 128 bytes, and the descriptors of an
	// audio-only esds stay far below that: a longer one needs the multi-byte form of the length
	const MAX_DESCRIPTOR_PAYLOAD = 127;
	const MICROSECONDS_IN_SECOND = 1_000_000;

	// the samples of the whole recording stay in memory for the length of the stage: at the target rate
	// a minute of them costs about 11 MiB, so ten minutes is where the server stage becomes the cheaper
	// way to the target format
	const MAX_ENCODED_DURATION_MS = 600_000;

	// the encoder is fed the recording in slices, because it copies every slice it is handed: a copy of
	// the whole recording would double the cost of the stage on its own
	const SLICE_SECONDS = 10;

	// slices are not handed over faster than they are taken: a queue left to grow holds exactly the copy
	// of the whole recording the slicing was meant to avoid
	const MAX_QUEUED_SLICES = 2;

	// how often an engine that never learned the dequeue event is asked about its queue instead
	const QUEUE_POLL_MS = 10;
	const zeros = count => new Uint8Array(count);
	const bytes = (...values) => new Uint8Array(values);
	const uint16 = value => bytes(value >>> 8 & 0xFF, value & 0xFF);
	const uint32 = value => bytes(value >>> 24 & 0xFF, value >>> 16 & 0xFF, value >>> 8 & 0xFF, value & 0xFF);
	const ascii = text => new Uint8Array([...text].map(char => char.codePointAt(0)));
	const concat = parts => {
		const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
		let offset = 0;
		parts.forEach(part => {
			result.set(part, offset);
			offset += part.length;
		});
		return result;
	};
	const uint32Array = values => {
		const result = new Uint8Array(values.length * BYTES_IN_UINT32);
		const view = new DataView(result.buffer);
		values.forEach((value, index) => view.setUint32(index * BYTES_IN_UINT32, value));
		return result;
	};
	const toBytes = source => {
		return ArrayBuffer.isView(source) ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength) : new Uint8Array(source);
	};
	const box = (type, parts) => {
		const payload = concat(parts);
		return concat([uint32(payload.length + BOX_HEADER_LENGTH), ascii(type), payload]);
	};

	// every box of an audio-only container is a version 0 one, so only the flags are worth passing
	const fullBox = (type, flags, parts = []) => {
		return box(type, [bytes(0, flags >>> 16 & 0xFF, flags >>> 8 & 0xFF, flags & 0xFF), ...parts]);
	};
	const descriptor = (tag, parts) => {
		const payload = concat(parts);
		if (payload.length > MAX_DESCRIPTOR_PAYLOAD) {
			// a length written in one byte would describe a different stream, and a container carrying
			// it plays nowhere: the stage gives up instead, and the recording goes to the server one
			throw new Error('the descriptor does not fit a single-byte length');
		}
		return concat([bytes(tag, payload.length), payload]);
	};
	const nextPoll = () => new Promise(resolve => {
		setTimeout(resolve, QUEUE_POLL_MS);
	});

	// a timer is clamped to about a second in a background tab, which would stretch a long
	// recording by that clamp once per slice; the encoder reports the freed queue itself. An engine
	// without the event is still polled: a wait for an event that never arrives would hold the stage
	const hasDequeueEvent = encoder => 'ondequeue' in encoder;
	class FormatEncoder {
		// the second stage of format delivery. A stage that cannot finish returns null: such a recording
		// goes to the server stage instead of leaving a broken file in the chat
		static async encode(source, context = {}) {
			const {
				durationMs = 0,
				isCancelled = () => false
			} = context;
			if (durationMs > MAX_ENCODED_DURATION_MS) {
				return null;
			}
			try {
				const samples = await this.#decodeToTargetSamples(source);
				if (isCancelled()) {
					return null;
				}
				const {
					frames,
					codecDescription
				} = await this.#encodeFrames(samples, isCancelled);
				if (isCancelled() || frames.length === 0 || !codecDescription) {
					return null;
				}
				return new Blob(this.#buildFileParts(frames, codecDescription), {
					type: im_v2_lib_voiceRecorder.TargetFormat.mimeType
				});
			} catch {
				return null;
			}
		}

		// decoding runs at the target sample rate and channel count, so the encoder gets exactly what it expects
		static async #decodeToTargetSamples(source) {
			const {
				sampleRate,
				numberOfChannels
			} = im_v2_lib_voiceRecorder.TargetFormat.codecConfig;
			const decoded = await new OfflineAudioContext(numberOfChannels, 1, sampleRate).decodeAudioData(await source.arrayBuffer());

			// decoding brings the target sample rate but leaves the channels the recording was made with:
			// the second pass is for mixing down alone, so an already mono recording skips it and its copy
			if (decoded.numberOfChannels === numberOfChannels) {
				return decoded.getChannelData(0);
			}
			const context = new OfflineAudioContext(numberOfChannels, decoded.length, sampleRate);
			const player = context.createBufferSource();
			player.buffer = decoded;
			player.connect(context.destination);
			player.start();
			const rendered = await context.startRendering();
			return rendered.getChannelData(0);
		}
		static async #encodeFrames(samples, isCancelled) {
			const {
				sampleRate,
				numberOfChannels
			} = im_v2_lib_voiceRecorder.TargetFormat.codecConfig;
			const frames = [];
			let codecDescription = null;
			let failure = null;
			// an encoder that died takes nothing off its queue any more, so the wait for room in it is
			// woken by the failure as well - otherwise the stage would stand on an event never to come
			let wakeQueueWait = null;
			const encoder = new AudioEncoder({
				output: (chunk, metadata) => {
					const frame = new Uint8Array(chunk.byteLength);
					chunk.copyTo(frame);
					frames.push(frame);

					// the codec description comes once, with the first frame - the container stores it as is
					const description = metadata?.decoderConfig?.description;
					if (description && !codecDescription) {
						codecDescription = toBytes(description);
					}
				},
				error: error => {
					failure = error;
					wakeQueueWait?.();
				}
			});
			encoder.configure(im_v2_lib_voiceRecorder.TargetFormat.codecConfig);
			const isStopped = () => Boolean(failure) || isCancelled();
			const takesDequeueEvent = hasDequeueEvent(encoder);
			const awaitQueueChange = () => {
				if (!takesDequeueEvent) {
					return nextPoll();
				}
				return new Promise(resolve => {
					const stopWaiting = () => {
						main_core.Event.unbind(encoder, 'dequeue', stopWaiting);
						wakeQueueWait = null;
						resolve();
					};
					wakeQueueWait = stopWaiting;
					main_core.Event.bind(encoder, 'dequeue', stopWaiting);
				});
			};

			// an engine that reports no queue size takes the slices as fast as it can, which is how the
			// stage worked before it was sliced at all
			const awaitFreeQueue = async () => {
				while (encoder.encodeQueueSize > MAX_QUEUED_SLICES && !isStopped()) {
					// eslint-disable-next-line no-await-in-loop
					await awaitQueueChange();
				}
			};

			// the slices end on frame boundaries: an encoder that pads what it is given up to a whole
			// frame would otherwise leave a gap of silence inside the recording on every slice
			const sliceLength = Math.floor(sampleRate * SLICE_SECONDS / SAMPLES_PER_FRAME) * SAMPLES_PER_FRAME;
			for (let offset = 0; offset < samples.length && !isStopped(); offset += sliceLength) {
				const slice = samples.subarray(offset, Math.min(offset + sliceLength, samples.length));
				const audioData = new AudioData({
					format: 'f32-planar',
					sampleRate,
					numberOfChannels,
					numberOfFrames: slice.length,
					// where a slice belongs in the recording is read off its timestamp and nothing else
					timestamp: Math.round(offset / sampleRate * MICROSECONDS_IN_SECOND),
					data: slice
				});
				encoder.encode(audioData);
				audioData.close();

				// eslint-disable-next-line no-await-in-loop
				await awaitFreeQueue();
			}
			if (isCancelled()) {
				// nobody is waiting for this record any more: what is queued is dropped, not finished
				encoder.close();
				return {
					frames: [],
					codecDescription: null
				};
			}
			await encoder.flush();
			encoder.close();
			if (failure) {
				throw failure;
			}
			return {
				frames,
				codecDescription
			};
		}
		static #buildFileParts(frames, codecDescription) {
			const fileType = box('ftyp', [ascii('M4A '), uint32(0), ascii('M4A mp42isom')]);
			const movie = this.#buildMovie(frames, codecDescription);
			const payloadLength = frames.reduce((size, frame) => size + frame.length, 0);
			const mediaHeader = concat([uint32(payloadLength + BOX_HEADER_LENGTH), ascii('mdat')]);
			this.#writeMediaOffset(movie, fileType.length + movie.length + BOX_HEADER_LENGTH);

			// handed over in parts: a Blob takes them as they are, so the payload is never copied
			return [fileType, movie, mediaHeader, ...frames];
		}

		// the table keeps its size whatever offset it holds, so the movie is built once with a zero offset
		// and the real one - known only after the movie is measured - is written into its last entry
		static #writeMediaOffset(movie, mediaOffset) {
			const tail = movie.subarray(movie.length - CHUNK_OFFSET_BOX_LENGTH);
			const boxType = String.fromCodePoint(...tail.subarray(BYTES_IN_UINT32, BOX_HEADER_LENGTH));
			if (boxType !== 'stco') {
				// a layout that stopped ending with the chunk offset box would be written past its bytes
				throw new Error('the movie does not end with the chunk offset box');
			}
			movie.set(uint32(mediaOffset), movie.length - BYTES_IN_UINT32);
		}
		static #buildMovie(frames, codecDescription) {
			const {
				sampleRate
			} = im_v2_lib_voiceRecorder.TargetFormat.codecConfig;
			const duration = frames.length * SAMPLES_PER_FRAME;
			const movieHeader = fullBox('mvhd', 0, [zeros(8), uint32(sampleRate), uint32(duration), uint32(0x00010000), uint16(0x0100), zeros(10), uint32Array(IDENTITY_MATRIX), zeros(24), uint32(2)]);
			const trackHeader = fullBox('tkhd', 0x000007, [zeros(8), uint32(1), zeros(4), uint32(duration), zeros(8), zeros(4), uint16(0x0100), zeros(2), uint32Array(IDENTITY_MATRIX), zeros(8)]);
			const mediaHeader = fullBox('mdhd', 0, [zeros(8), uint32(sampleRate), uint32(duration), uint16(UNDETERMINED_LANGUAGE), zeros(2)]);
			const handler = fullBox('hdlr', 0, [zeros(4), ascii('soun'), zeros(12), ascii('SoundHandler'), zeros(1)]);
			const dataInfo = box('dinf', [fullBox('dref', 0, [uint32(1), fullBox('url ', 1)])]);
			const sampleTable = this.#buildSampleTable(frames, codecDescription);
			const mediaInfo = box('minf', [fullBox('smhd', 0, [zeros(4)]), dataInfo, sampleTable]);
			return box('moov', [movieHeader, box('trak', [trackHeader, box('mdia', [mediaHeader, handler, mediaInfo])])]);
		}
		static #buildSampleTable(frames, codecDescription) {
			const sizes = frames.map(frame => frame.length);
			return box('stbl', [fullBox('stsd', 0, [uint32(1), this.#buildSampleDescription(codecDescription)]), fullBox('stts', 0, [uint32(1), uint32(frames.length), uint32(SAMPLES_PER_FRAME)]), fullBox('stsc', 0, [uint32(1), uint32(1), uint32(frames.length), uint32(1)]), fullBox('stsz', 0, [uint32(0), uint32(frames.length), uint32Array(sizes)]),
			// the offset of the payload is known only once the movie is built, and it is written in then
			fullBox('stco', 0, [uint32(1), uint32(0)])]);
		}
		static #buildSampleDescription(codecDescription) {
			const {
				sampleRate,
				numberOfChannels,
				bitrate
			} = im_v2_lib_voiceRecorder.TargetFormat.codecConfig;
			const decoderConfig = descriptor(0x04, [
			// mpeg-4 audio in an audio elementary stream, with the decoder buffer of a voice bitstream
			bytes(0x40, 0x15), bytes(0x00, 0x18, 0x00), uint32(bitrate), uint32(bitrate), descriptor(0x05, [codecDescription])]);
			const elementaryStream = fullBox('esds', 0, [descriptor(0x03, [uint16(1), bytes(0), decoderConfig, descriptor(0x06, [bytes(0x02)])])]);
			return box('mp4a', [zeros(6), uint16(1), zeros(8), uint16(numberOfChannels), uint16(16), zeros(4),
			// the sample rate of an audio entry is a 16.16 fixed point number
			uint32(sampleRate * 0x10000), elementaryStream]);
		}
	}

	// a channel of its own, apart from the player's one: there an announcement means "stop playing",
	// here it means "stop and keep what was recorded"
	const CHANNEL_NAME = 'im-voice-recording';
	const RECORDING_STARTED = 'recordingStarted';
	class RecordingBroadcast {
		#channel;
		#senderId = main_core.Text.getRandom();
		#onOtherTabStart;
		constructor(onOtherTabStart) {
			this.#onOtherTabStart = onOtherTabStart;
			this.#channel = this.#openChannel();
		}
		announceStart() {
			this.#channel?.postMessage({
				type: RECORDING_STARTED,
				senderId: this.#senderId
			});
		}
		close() {
			this.#channel?.close();
		}
		#openChannel() {
			try {
				const channel = new BroadcastChannel(CHANNEL_NAME);
				channel.onmessage = this.#onMessage;
				return channel;
			} catch {
				return null;
			}
		}
		#onMessage = event => {
			const message = event.data;
			if (message?.type !== RECORDING_STARTED || message.senderId === this.#senderId) {
				return;
			}
			this.#onOtherTabStart();
		};
	}

	const EVENT_NAMESPACE = 'BX.Messenger.v2.VoiceRecordingSession';
	const TICK_INTERVAL = 200;
	const MILLISECONDS_IN_SECOND$1 = 1000;

	// a refusal without a prompt comes back at once: nobody was asked, so the block is a standing one
	const PROMPT_DELAY = 300;
	const DENIED_ERROR_NAMES = new Set(['NotAllowedError', 'PermissionDeniedError', 'SecurityError']);
	const MISSING_DEVICE_ERROR_NAMES = new Set(['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError']);
	const ACTIVE_STATES = new Set([RecordingState.recording, RecordingState.paused]);
	class RecordingSession extends main_core_events.EventEmitter {
		static events = {
			onTick: 'onTick',
			onStopped: 'onStopped',
			onError: 'onError'
		};
		#state;
		#capability = null;
		#stream = null;
		#recorder = null;
		#broadcast = null;
		#chunks = [];
		#accumulatedMs = 0;
		#maxDurationMs = null;
		#startedAt = null;
		#tickTimer = null;
		// the tick runs more often than a second, and a tick that changes nothing on the screen is dropped
		#publishedSecond = 0;
		// the minimum length of a record falls inside the first second, and the consumer holds the actions
		// of a recording by it, so its crossing is published apart from the whole seconds
		#hasReachedMinimum = false;
		// the conversion is the most expensive step of the session, and this flag stops it between stages
		#isGivenUp = false;
		#startAttemptId = 0;
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#state = ui_vue3.reactive({
				recordingState: RecordingState.idle,
				stopReason: null,
				errorCode: null
			});
		}
		getState() {
			return this.#state;
		}

		// every interval here is measured with the monotonic clock: a system clock moved by the user, by NTP
		// or by the laptop waking up would jump the shown duration and trip the stop by the limit at once
		getDurationMs() {
			const runningMs = this.#startedAt === null ? 0 : performance.now() - this.#startedAt;
			return this.#accumulatedMs + runningMs;
		}
		async start() {
			if (this.#state.recordingState !== RecordingState.idle) {
				return;
			}
			const startAttemptId = ++this.#startAttemptId;
			this.#resetProgress();
			this.#isGivenUp = false;
			this.#maxDurationMs = this.#readMaxDurationMs();
			this.#state.stopReason = null;
			this.#state.errorCode = null;
			this.#state.recordingState = RecordingState.requesting;

			// the calls are watched from the question about the microphone onwards, and not from the
			// answer to it: the browser asks the user, the user takes as long as they take, and a call
			// that started meanwhile would have gone by before anybody was listening for it
			this.#watchCalls();
			this.#capability = await im_v2_lib_voiceRecorder.CapabilityResolver.resolve();
			if (startAttemptId !== this.#startAttemptId || this.#state.recordingState !== RecordingState.requesting) {
				return;
			}
			if (this.#capability === im_v2_lib_voiceRecorder.Capability.unavailable) {
				// whether recording is offered at all is the consumer's call; a session started anyway records nothing
				this.#stopWatchingInterruptions();
				this.#state.recordingState = RecordingState.idle;
				return;
			}
			const stream = await this.#requestStream();
			if (!stream) {
				return;
			}
			this.#stream = stream;
			try {
				this.#recorder = this.#createRecorder(stream);
				this.#recorder.start();
			} catch (error) {
				// a recorder the browser refuses to build or to start is the device saying no to this tab,
				// and the stream assigned above is released by the failure alone
				im_v2_lib_logger.Logger.error('RecordingSession: the recorder of the browser did not start', error);
				this.#fail(RecordingErrorCode.deviceBusy);
				return;
			}
			this.#startedAt = performance.now();
			this.#state.recordingState = RecordingState.recording;
			this.#startTicking();
			this.#watchInterruptions();
		}

		// the recorder keeps the fragment it has already written, so what was recorded before the pause stays
		pause() {
			if (this.#state.recordingState !== RecordingState.recording) {
				return;
			}
			this.#recorder.pause();
			this.#accumulateElapsed();
			this.#stopTicking();
			this.#state.recordingState = RecordingState.paused;
		}
		resume() {
			if (this.#state.recordingState !== RecordingState.paused) {
				return;
			}
			this.#recorder.resume();
			this.#startedAt = performance.now();
			this.#state.recordingState = RecordingState.recording;
			this.#startTicking();
		}
		stop() {
			this.#finish(null);
		}
		stopExternally(reason) {
			this.#finish(reason);
		}
		cancel() {
			this.#isGivenUp = true;
			this.#stopTicking();
			this.#stopWatchingInterruptions();
			this.#releaseRecorder();
			this.#releaseStream();
			this.#resetProgress();
			this.#state.stopReason = null;
			this.#state.errorCode = null;
			this.#state.recordingState = RecordingState.idle;
		}
		#finish(reason) {
			if (this.#state.recordingState === RecordingState.requesting) {
				// the hold ended before the browser answered: there is no fragment to keep
				this.cancel();
				return;
			}
			if (!ACTIVE_STATES.has(this.#state.recordingState)) {
				return;
			}
			this.#accumulateElapsed();
			this.#stopTicking();
			// the warning about closing the tab belongs to a running recording, not to a finished record
			this.#stopWatchingInterruptions();
			this.#state.stopReason = reason;
			this.#state.recordingState = RecordingState.stopped;
			this.#recorder.stop();
		}
		async #requestStream() {
			const requestedAt = performance.now();
			try {
				// one channel is asked for and not demanded: the ceiling of the client conversion stage is
				// counted per channel, and a stereo device would spend three times that on the same
				// recording. An `exact` here would answer with OverconstrainedError instead, which this
				// very method reads as a microphone that is not there at all
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: {
						channelCount: {
							ideal: 1
						}
					}
				});
				if (this.#state.recordingState !== RecordingState.requesting) {
					stream.getTracks().forEach(track => track.stop());
					return null;
				}
				return stream;
			} catch (error) {
				if (this.#state.recordingState === RecordingState.requesting) {
					this.#fail(this.#getAccessErrorCode(error, performance.now() - requestedAt));
				}
				return null;
			}
		}
		#getAccessErrorCode(error, answeredIn) {
			if (MISSING_DEVICE_ERROR_NAMES.has(error.name)) {
				return RecordingErrorCode.deviceNotFound;
			}
			if (!DENIED_ERROR_NAMES.has(error.name)) {
				// the device was found but never started - the same situation the busy device state describes
				return RecordingErrorCode.deviceBusy;
			}
			if (im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
				// the desktop application never asks the user itself: a refusal there comes from the system
				return RecordingErrorCode.accessDeniedBySystem;
			}
			return answeredIn < PROMPT_DELAY ? RecordingErrorCode.accessDeniedPermanently : RecordingErrorCode.accessDeniedInSession;
		}
		#createRecorder(stream) {
			const options = this.#capability === im_v2_lib_voiceRecorder.Capability.nativeTarget ? {
				mimeType: im_v2_lib_voiceRecorder.TargetFormat.mimeType
			} : {};
			const recorder = new MediaRecorder(stream, options);
			main_core.Event.bind(recorder, 'dataavailable', this.#onDataAvailable);
			main_core.Event.bind(recorder, 'stop', this.#onRecorderStop);
			main_core.Event.bind(recorder, 'error', this.#onRecorderError);
			return recorder;
		}

		// the events are dropped before the stop, so the take of a released recorder is never published
		#releaseRecorder() {
			const recorder = this.#recorder;
			if (!recorder) {
				return;
			}
			this.#recorder = null;
			main_core.Event.unbind(recorder, 'dataavailable', this.#onDataAvailable);
			main_core.Event.unbind(recorder, 'stop', this.#onRecorderStop);
			main_core.Event.unbind(recorder, 'error', this.#onRecorderError);
			if (recorder.state !== 'inactive') {
				recorder.stop();
			}
		}
		#releaseStream() {
			this.#stream?.getTracks().forEach(track => track.stop());
			this.#stream = null;
		}
		async #publishRecording(mimeType) {
			const recorded = new Blob(this.#chunks, {
				type: mimeType
			});
			this.#chunks = [];
			const converted = this.#capability === im_v2_lib_voiceRecorder.Capability.clientEncode ? await FormatEncoder.encode(recorded, {
				durationMs: this.#accumulatedMs,
				isCancelled: () => this.#isGivenUp
			}) : null;

			// given up while it was converting: whatever ended the panel has already dropped this record
			if (this.#isGivenUp) {
				return;
			}
			this.emit(RecordingSession.events.onStopped, {
				blob: converted ?? recorded,
				// the whole seconds are what the message of the chat carries, the milliseconds are what
				// the minimum length of a record is answered by: rounding hides a record below it
				durationMs: this.#accumulatedMs,
				durationSeconds: Math.round(this.#accumulatedMs / MILLISECONDS_IN_SECOND$1),
				isTargetFormat: Boolean(converted) || this.#capability === im_v2_lib_voiceRecorder.Capability.nativeTarget
			});
		}
		#fail(code) {
			this.#stopTicking();
			this.#stopWatchingInterruptions();
			this.#releaseRecorder();
			this.#releaseStream();
			this.#resetProgress();
			this.#state.errorCode = code;
			this.#state.recordingState = RecordingState.error;
			this.emit(RecordingSession.events.onError, {
				code
			});
		}
		#resetProgress() {
			this.#chunks = [];
			this.#accumulatedMs = 0;
			this.#startedAt = null;
			this.#publishedSecond = 0;
			this.#hasReachedMinimum = false;
		}
		#accumulateElapsed() {
			if (this.#startedAt === null) {
				return;
			}
			this.#accumulatedMs += performance.now() - this.#startedAt;
			this.#startedAt = null;
		}

		// the limit is the portal's alone: a default of the client would disagree with the server the
		// moment the setting changes, so a portal that names none gets no limit here either
		#readMaxDurationMs() {
			const {
				voiceMessage = {}
			} = im_v2_application_core.Core.getApplicationData();
			const maxDurationSeconds = main_core.Text.toNumber(voiceMessage.maxDurationSeconds);
			return maxDurationSeconds > 0 ? maxDurationSeconds * MILLISECONDS_IN_SECOND$1 : null;
		}
		#getRemainingMs(durationMs) {
			return this.#maxDurationMs === null ? null : Math.max(this.#maxDurationMs - durationMs, 0);
		}
		#startTicking() {
			this.#tickTimer = setInterval(this.#onTick, TICK_INTERVAL);
		}
		#stopTicking() {
			if (this.#tickTimer === null) {
				return;
			}
			clearInterval(this.#tickTimer);
			this.#tickTimer = null;
		}

		// a call takes the microphone whoever asked for it first, so the session steps aside from the
		// moment it starts asking - the recording it would produce could not be made anyway
		#watchCalls() {
			im_v2_lib_voiceRecorder.CALL_START_EVENTS.forEach(eventName => main_core_events.EventEmitter.subscribe(eventName, this.#onCallStarted));
		}

		// every listener lives exactly as long as the recording: a warning left behind would come up on
		// every ordinary reload of the page
		#watchInterruptions() {
			main_core.Event.bind(window, 'beforeunload', this.#onBeforeUnload);

			// announced only once the microphone is granted: an earlier announce would end the recording
			// of another tab for a recording that never happens
			this.#broadcast = new RecordingBroadcast(this.#onOtherTabStart);
			this.#broadcast.announceStart();
		}
		#stopWatchingInterruptions() {
			im_v2_lib_voiceRecorder.CALL_START_EVENTS.forEach(eventName => main_core_events.EventEmitter.unsubscribe(eventName, this.#onCallStarted));
			main_core.Event.unbind(window, 'beforeunload', this.#onBeforeUnload);
			this.#broadcast?.close();
			this.#broadcast = null;
		}
		#onTick = () => {
			const durationMs = this.getDurationMs();
			const remainingMs = this.#getRemainingMs(durationMs);
			const second = Math.floor(durationMs / MILLISECONDS_IN_SECOND$1);
			const hasReachedMinimum = durationMs >= MIN_RECORDING_MS;

			// the interval serves the stop by the limit; the interface counts in whole seconds, plus the
			// tick the minimum length of a record is reached at, which falls inside the first of them
			if (second !== this.#publishedSecond || hasReachedMinimum !== this.#hasReachedMinimum) {
				this.#publishedSecond = second;
				this.#hasReachedMinimum = hasReachedMinimum;
				this.emit(RecordingSession.events.onTick, {
					durationMs,
					remainingMs
				});
			}

			// the fragment recorded up to the limit is kept: what to do with it is still decided by the user
			if (remainingMs === 0) {
				this.stopExternally(RecordingStopReason.durationLimit);
			}
		};
		#onDataAvailable = event => {
			if (event.data.size > 0) {
				this.#chunks.push(event.data);
			}
		};
		#onRecorderStop = () => {
			const {
				mimeType
			} = this.#recorder;
			this.#releaseRecorder();
			this.#releaseStream();
			this.#publishRecording(mimeType);
		};
		#onRecorderError = () => {
			// a recorder that dies mid-flight means the device stopped giving audio to this tab
			this.#fail(RecordingErrorCode.deviceBusy);
		};

		// the call takes the microphone whichever side started it, and the fragment stays ready in the panel
		#onCallStarted = () => {
			this.stopExternally(RecordingStopReason.callStarted);
		};

		// the recording started last wins: refusing it would leave the microphone with a tab out of sight
		#onOtherTabStart = () => {
			this.stopExternally(RecordingStopReason.otherTab);
		};

		// the record lives in this tab alone and is restored nowhere, so the browser asks first
		#onBeforeUnload = event => {
			event.preventDefault();
			// part of the engines still read the legacy field instead of the prevented default
			// eslint-disable-next-line no-param-reassign
			event.returnValue = '';
		};
	}

	const ICON_SIZE$1 = 24;

	// the article walking the user through the browsers and the desktop application is named here and
	// nowhere else: it is written by the support team, and its identifier is a placeholder until then
	const HELP_ARTICLE_CODE = '00000000';

	// the button stays out of the screen while the code above is a placeholder: an offer leading to an
	// article that does not exist is worse than no offer. Flip to true once the article is written
	const HELP_ARTICLE_AVAILABLE = false;

	// every refusal is repaired in a place of its own, so every refusal names that place itself. The
	// help article is offered only where a permission stands in the way: a missing or occupied
	// device is not repaired through settings at all
	const AccessStateView = {
		[RecordingErrorCode.accessDeniedInSession]: {
			icon: ui_iconSet_api_vue.Outline.MICROPHONE_OFF,
			titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_SESSION_TITLE',
			textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_SESSION_TEXT',
			withHelp: true
		},
		[RecordingErrorCode.accessDeniedPermanently]: {
			icon: ui_iconSet_api_vue.Outline.LOCK_2,
			titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_FOREVER_TITLE',
			textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_FOREVER_TEXT',
			withHelp: true
		},
		[RecordingErrorCode.deviceNotFound]: {
			icon: ui_iconSet_api_vue.Outline.MICROPHONE_OFF,
			titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_NOT_FOUND_TITLE',
			textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_NOT_FOUND_TEXT',
			withHelp: false
		},
		[RecordingErrorCode.deviceBusy]: {
			icon: ui_iconSet_api_vue.Outline.MICROPHONE_OFF,
			titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_BUSY_TITLE',
			textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DEVICE_BUSY_TEXT',
			withHelp: false
		},
		[RecordingErrorCode.accessDeniedBySystem]: {
			icon: ui_iconSet_api_vue.Outline.DESKTOP_MACOS,
			titlePhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_BY_SYSTEM_TITLE',
			textPhrase: 'IM_TEXTAREA_VOICE_RECORDER_DENIED_BY_SYSTEM_TEXT',
			withHelp: true
		}
	};

	// the announcer of the page drops what a message has past its own limit, and the way out of a
	// refusal stands at the end of the text: the parts are separated here and read out one by one
	const ANNOUNCEMENT_SEPARATOR = '\n';

	// announced with the very words shown on the screen: a state read out differently confuses
	const getAccessStateAnnouncement = code => {
		const {
			titlePhrase,
			textPhrase
		} = AccessStateView[code];
		return [main_core.Loc.getMessage(titlePhrase), main_core.Loc.getMessage(textPhrase)].join(ANNOUNCEMENT_SEPARATOR);
	};

	// @vue/component
	const AccessState = {
		name: 'VoiceRecordingAccessState',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			code: {
				type: String,
				required: true
			}
		},
		emits: ['close'],
		computed: {
			ICON_SIZE: () => ICON_SIZE$1,
			view() {
				return AccessStateView[this.code];
			},
			title() {
				return this.loc(this.view.titlePhrase);
			},
			text() {
				return this.loc(this.view.textPhrase);
			},
			withHelp() {
				return HELP_ARTICLE_AVAILABLE;
			},
			helpText() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_HELP');
			},
			// the visible text leans on the description next to it, which a pass over the controls alone
			// never reaches: the accessible name says what the button leads to on its own
			helpLabel() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_HELP_LABEL');
			},
			closeText() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_ACCESS_CLOSE');
			}
		},
		methods: {
			openHelpArticle() {
				im_v2_lib_helpdesk.openHelpdeskArticle(HELP_ARTICLE_CODE);
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-voice-recording-access" data-testid="im-textarea-recording-access">
			<div class="bx-im-voice-recording-access__message">
				<div class="bx-im-voice-recording-access__icon">
					<BIcon :name="view.icon" :size="ICON_SIZE" />
				</div>
				<div class="bx-im-voice-recording-access__text">
					<TextMd
						accent
						tag="div"
						data-testid="im-textarea-recording-access-title"
					>{{ title }}</TextMd>
					<TextSm
						tag="div"
						class="bx-im-voice-recording-access__description"
						data-testid="im-textarea-recording-access-text"
					>{{ text }}</TextSm>
				</div>
			</div>
			<div class="bx-im-voice-recording-access__actions">
				<button
					v-if="withHelp"
					:aria-label="helpLabel"
					class="bx-im-voice-recording-access__help"
					type="button"
					tabindex="0"
					data-testid="im-textarea-recording-access-help"
					@click="openHelpArticle"
				>
					<TextSm>{{ helpText }}</TextSm>
				</button>
				<button
					class="bx-im-voice-recording-access__close"
					type="button"
					tabindex="0"
					data-testid="im-textarea-recording-access-close"
					@click="$emit('close')"
				>
					<TextSm>{{ closeText }}</TextSm>
				</button>
			</div>
		</div>
	`
	};

	const ICON_SIZE = 20;

	// @vue/component
	const LockIndicator = {
		name: 'VoiceRecordingLockIndicator',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			isArmed: {
				type: Boolean,
				default: false
			}
		},
		emits: ['lock'],
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ICON_SIZE: () => ICON_SIZE,
			lockHint() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_LOCK');
			}
		},
		created() {
			this.bounds = null;
		},
		methods: {
			readBounds() {
				this.bounds = this.$el.getBoundingClientRect();
			},
			containsPointer(event) {
				if (!this.bounds) {
					return false;
				}
				const {
					top,
					right,
					bottom,
					left
				} = this.bounds;
				return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<button
			:title="lockHint"
			:aria-label="lockHint"
			:class="{ '--armed': isArmed }"
			class="bx-im-voice-recording-lock"
			type="button"
			tabindex="0"
			data-testid="im-textarea-recording-lock"
			@click="$emit('lock')"
		>
			<BIcon :name="OutlineIcons.ARROW_TOP_M" :size="ICON_SIZE" />
			<BIcon :name="OutlineIcons.LOCK_M" :size="ICON_SIZE" />
		</button>
	`
	};

	const PLAYBACK_ICON_SIZE = 26;

	// @vue/component
	const RecordingPreview = {
		name: 'VoiceRecordingPreview',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextSm: ui_system_typography_vue.TextSm,
			Timeline: im_v2_component_elements_player.Timeline
		},
		props: {
			blob: {
				type: Blob,
				required: true
			},
			durationSeconds: {
				type: Number,
				required: true
			}
		},
		data() {
			return {
				sourceUrl: '',
				isPlaying: false,
				isLoaded: false,
				hasPlaybackError: false,
				timeCurrent: 0
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			PLAYBACK_ICON_SIZE: () => PLAYBACK_ICON_SIZE,
			playbackIcon() {
				return this.isPlaying ? ui_iconSet_api_vue.Outline.PAUSE_M : ui_iconSet_api_vue.Outline.PLAY_M;
			},
			playbackHint() {
				return this.isPlaying ? this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_PAUSE') : this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_PLAY');
			},
			metaInfo() {
				const time = this.isPlaying ? this.durationSeconds - this.timeCurrent : this.durationSeconds;
				return `${im_v2_lib_utils.Utils.file.formatFileSize(this.blob.size)}, ${im_v2_lib_utils.Utils.date.formatMediaDurationTime(time)}`;
			},
			playbackErrorText() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_PLAYBACK_ERROR');
			}
		},
		created() {
			// the record is not a message yet: it is heard from the local file and never enters the
			// playback queue of the chat
			this.sourceUrl = URL.createObjectURL(this.blob);
		},
		beforeUnmount() {
			URL.revokeObjectURL(this.sourceUrl);
		},
		methods: {
			async togglePlayback() {
				if (this.isPlaying) {
					this.source().pause();
					return;
				}
				try {
					await this.source().play();
				} catch (error) {
					im_v2_lib_logger.Logger.error('VoiceRecordingPreview: playback of the record failed', error);
					this.onPlaybackError();
				}
			},
			onPlaybackError() {
				this.hasPlaybackError = true;
			},
			onTimeUpdate() {
				// the recorder writes no duration into its fragment, so the length of the record is the one
				// the session counted, and the position of the element can run past it
				this.timeCurrent = Math.min(this.source().currentTime, this.durationSeconds);
			},
			onEnded() {
				this.source().currentTime = 0;
				this.timeCurrent = 0;
			},
			source() {
				return this.$refs.source;
			},
			loc(phraseCode) {
				return this.$Bitrix.Loc.getMessage(phraseCode);
			}
		},
		template: `
		<div class="bx-im-voice-recording-preview" data-testid="im-textarea-recording-preview">
			<button
				:title="playbackHint"
				:aria-label="playbackHint"
				class="bx-im-voice-round-button"
				type="button"
				tabindex="0"
				data-testid="im-textarea-recording-playback"
				@click="togglePlayback"
			>
				<BIcon :name="playbackIcon" :size="PLAYBACK_ICON_SIZE" />
			</button>
			<div class="bx-im-voice-recording-preview__track">
				<Timeline
					:loaded="isLoaded"
					:timeCurrent="timeCurrent"
					:timeTotal="durationSeconds"
					:withSeeking="false"
					stretched
				/>
				<!-- a record the browser cannot read is still sent from here, so the meta names the
					 failure instead of leaving a playback button that does nothing -->
				<TextSm
					v-if="hasPlaybackError"
					class="bx-im-voice-recording-preview__meta --error"
					data-testid="im-textarea-recording-playback-error"
				>{{ playbackErrorText }}</TextSm>
				<TextSm
					v-else
					class="bx-im-voice-recording-preview__meta"
					data-testid="im-textarea-recording-meta"
				>{{ metaInfo }}</TextSm>
			</div>
			<audio
				:src="sourceUrl"
				ref="source"
				class="bx-im-voice-recording-preview__source"
				preload="metadata"
				data-testid="im-textarea-recording-source"
				@error="onPlaybackError"
				@loadedmetadata="isLoaded = true"
				@timeupdate="onTimeUpdate"
				@play="isPlaying = true"
				@pause="isPlaying = false"
				@ended="onEnded"
			></audio>
		</div>
	`
	};

	const ACTION_ICON_SIZE = 24;
	const MAIN_ACTION_ICON_SIZE = 26;
	const MILLISECONDS_IN_SECOND = 1000;

	// only the warning lead time: the duration limit itself comes from the portal
	const LIMIT_WARNING_MS = 10000;
	const StopReasonAnnouncement = {
		[RecordingStopReason.durationLimit]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LIMIT_REACHED',
		[RecordingStopReason.callStarted]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_CALL_STOP',
		[RecordingStopReason.otherTab]: 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_OTHER_TAB_STOP'
	};
	const SendFailureText = {
		[im_v2_provider_service_uploading.VoiceSendFailure.noSpace]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_NO_SPACE',
		[im_v2_provider_service_uploading.VoiceSendFailure.tooLarge]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_TOO_LARGE',
		[im_v2_provider_service_uploading.VoiceSendFailure.network]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_NETWORK',
		[im_v2_provider_service_uploading.VoiceSendFailure.unknown]: 'IM_TEXTAREA_VOICE_RECORDER_SEND_ERROR_COMMON'
	};

	// @vue/component
	const RecordingPanel = {
		name: 'VoiceRecordingPanel',
		components: {
			AccessState,
			BIcon: ui_iconSet_api_vue.BIcon,
			LockIndicator,
			RecordingPreview,
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm,
			VoiceRecorderButton: im_v2_component_textarea.VoiceRecorderButton
		},
		props: {
			dialogId: {
				type: String,
				required: true
			},
			isLockedOnStart: {
				type: Boolean,
				default: false
			},
			// whether a pointer stood behind the start; the panel answers by it where the initial focus
			// goes and nothing else, and the length of the recording is measured by the session
			isStartedFromPointer: {
				type: Boolean,
				default: false
			},
			// a record handed back by a failed send: the panel opens on it and starts no session of its own
			initialRecord: {
				type: Object,
				default: null
			},
			sendFailure: {
				type: String,
				default: ''
			}
		},
		emits: ['recorded', 'close'],
		data() {
			return {
				session: null,
				durationMs: 0,
				remainingMs: null,
				isCancelArmed: false,
				isLockArmed: false,
				isLocked: this.isLockedOnStart,
				record: this.initialRecord,
				isSendingOnRelease: false
			};
		},
		computed: {
			OutlineIcons: () => ui_iconSet_api_vue.Outline,
			ACTION_ICON_SIZE: () => ACTION_ICON_SIZE,
			MAIN_ACTION_ICON_SIZE: () => MAIN_ACTION_ICON_SIZE,
			recordingState() {
				return this.session?.getState().recordingState ?? RecordingState.idle;
			},
			stopReason() {
				return this.session?.getState().stopReason ?? null;
			},
			errorCode() {
				return this.session?.getState().errorCode ?? null;
			},
			hasAccessError() {
				return this.errorCode !== null;
			},
			hasRecord() {
				return this.record !== null;
			},
			hasSendFailure() {
				return this.sendFailure !== '';
			},
			sendFailureText() {
				return this.loc(SendFailureText[this.sendFailure] ?? SendFailureText[im_v2_provider_service_uploading.VoiceSendFailure.unknown]);
			},
			isRecordingOver() {
				return this.recordingState === RecordingState.stopped;
			},
			isHoldGesture() {
				return !this.isLocked && !this.hasRecord;
			},
			// the keyboard and the accessibility API both open the panel already locked and with no
			// pointer behind it: there is no hold to release and no hand on a pointer to work around
			isStartWithoutPointer() {
				return this.isLockedOnStart && !this.hasRecord && !this.isStartedFromPointer;
			},
			// counted by the same duration the timer of the panel shows, so the states of the actions
			// never disagree with the time the user reads; the session publishes that duration at the
			// minimum as well as on every whole second
			isTooShortToKeep() {
				if (this.hasRecord) {
					return this.record.durationMs < MIN_RECORDING_MS;
				}

				// a recording the browser has not started yet is not a short one: there is nothing for the
				// minimum to measure until the first fragment is written
				if (this.recordingState !== RecordingState.recording && !this.isPaused) {
					return false;
				}
				return this.durationMs < MIN_RECORDING_MS;
			},
			isPaused() {
				return this.recordingState === RecordingState.paused;
			},
			isLockedRecording() {
				return this.isLocked && this.recordingState === RecordingState.recording;
			},
			duration() {
				return im_v2_lib_utils.Utils.date.formatMediaDurationTime(this.durationMs / MILLISECONDS_IN_SECOND);
			},
			// a portal with no limit reports no remainder, so the warning never comes
			isLimitApproaching() {
				return !this.hasRecord && this.remainingMs !== null && this.remainingMs <= LIMIT_WARNING_MS;
			},
			// the notice is spelled out and not left to the colour of the timer alone
			limitLeftText() {
				const remainingSeconds = Math.ceil(this.remainingMs / MILLISECONDS_IN_SECOND);
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_LIMIT_LEFT', {
					'#TIME#': im_v2_lib_utils.Utils.date.formatMediaDurationTime(remainingSeconds)
				});
			},
			panelLabel() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_PANEL');
			},
			pausedLabel() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_PAUSED');
			},
			// the timer is left out on purpose: a text that changes on every tick makes a screen reader unusable
			stateAnnouncement() {
				if (this.hasAccessError) {
					return getAccessStateAnnouncement(this.errorCode);
				}
				if (this.hasSendFailure) {
					return `${this.sendFailureText}. ${this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_READY')}`;
				}
				if (this.hasRecord) {
					// a record below the minimum is offered no sending, so the announcement names that
					// instead of the record ready to be sent
					if (this.isTooShortToKeep) {
						return this.tooShortText;
					}
					return this.loc(StopReasonAnnouncement[this.stopReason] ?? 'IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_READY');
				}
				if (this.isPaused) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_PAUSED');
				}

				// the wait for the answer of the browser is as long as the user makes it, so it is named
				if (this.recordingState === RecordingState.requesting) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_REQUESTING');
				}
				if (this.recordingState !== RecordingState.recording) {
					return '';
				}
				if (this.isLimitApproaching) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LIMIT_SOON');
				}
				return this.isLocked ? this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_LOCKED') : this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_RECORDING');
			},
			// a refusal is read out at once: it has to be repaired before anything else goes on
			isAnnouncementUrgent() {
				return this.hasAccessError || this.hasSendFailure;
			},
			// the hint names what the release will actually do, and its branches stand in the order the
			// release itself runs them: the cancel, then the minimum, then the send
			releaseHint() {
				if (this.isCancelArmed) {
					return this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_CANCEL');
				}
				return this.isTooShortToKeep ? this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_LOCK') : this.loc('IM_TEXTAREA_VOICE_RECORDER_HINT_SEND');
			},
			cancelHint() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_CANCEL');
			},
			pauseHint() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_PAUSE');
			},
			resumeHint() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_RESUME');
			},
			// the stop, the send and the announcement of a record are refused by one and the same
			// minimum, so all three name it with one text and none of them names an action
			tooShortText() {
				return this.loc('IM_TEXTAREA_VOICE_RECORDER_TOO_SHORT');
			},
			// a refused action names the reason in its own accessible name instead of only greying out
			stopHint() {
				return this.isTooShortToKeep ? this.tooShortText : this.loc('IM_TEXTAREA_VOICE_RECORDER_STOP');
			},
			sendHint() {
				return this.isTooShortToKeep ? this.tooShortText : this.loc('IM_TEXTAREA_VOICE_RECORDER_SEND');
			}
		},
		watch: {
			// immediate on purpose: the announcer region outlives the panel, so a panel that opens with a
			// text already in it is read out all the same
			stateAnnouncement: {
				handler(announcement) {
					if (announcement === '') {
						return;
					}
					this.announce(announcement, this.isAnnouncementUrgent ? 'assertive' : 'polite');
				},
				immediate: true
			},
			recordingState(state) {
				// every end of a session passes through idle, so the panel asks for its way out here alone
				if (state === RecordingState.idle) {
					this.$emit('close');
					return;
				}

				// the panel stays to name the refusal, and the hold behind it decides nothing any more
				if (state === RecordingState.error) {
					this.stopWaitingForRelease();
				}
			},
			hasRecord(hasRecord) {
				// the stop button leaves with the recording: focus standing on it moves to the send button
				if (!hasRecord || !this.$el.contains(document.activeElement)) {
					return;
				}
				void this.$nextTick(() => this.$refs.send?.focus());
			},
			// the notice adds a row and moves everything above it, so the cached boxes are read again
			isLimitApproaching() {
				void this.$nextTick(this.readGestureBounds);
			},
			// the actions of the recording leave with it: focus standing on one of them moves to the panel
			hasAccessError(hasError) {
				if (!hasError || !this.$el.contains(document.activeElement)) {
					return;
				}
				void this.$nextTick(() => this.$el.focus());
			}
		},
		created() {
			// read for the pointer alone and never rendered, so it stays out of the reactive state
			this.cancelBounds = null;

			// compared by identity and never rendered, so it stays out of the reactive state as well
			this.recordOfOwnSession = null;

			// a session started over a record that came back would ask for the microphone a second time
			if (this.hasRecord) {
				return;
			}

			// markRaw keeps the private fields of the session reachable: a reactive proxy would break them
			this.session = ui_vue3.markRaw(new RecordingSession());
			this.session.subscribe(RecordingSession.events.onTick, this.onTick);
			this.session.subscribe(RecordingSession.events.onStopped, this.onStopped);
			void this.session.start();
		},
		mounted() {
			this.takeInitialFocus();

			// a panel that opens locked, or on a record that came back, has no hold standing behind it
			if (this.isLocked || this.hasRecord) {
				return;
			}

			// the release ends the recording wherever the pointer is by then, and the button it started on
			// is hidden with the field, so the document is listened to and not the button
			main_core.Event.bind(document, 'pointerup', this.onPointerUp);
			main_core.Event.bind(document, 'pointercancel', this.onPointerCancel);
			main_core.Event.bind(document, 'pointermove', this.onPointerMove);
			main_core.Event.bind(window, 'resize', this.readGestureBounds);
		},
		beforeUnmount() {
			this.stopWaitingForRelease();
			if (!this.session) {
				return;
			}
			this.session.unsubscribe(RecordingSession.events.onTick, this.onTick);
			this.session.unsubscribe(RecordingSession.events.onStopped, this.onStopped);
			// frees the microphone stream whatever state the recording is left in
			this.session.cancel();
		},
		methods: {
			// the announcer cuts a message at its own limit, so a state that comes in parts is read part by
			// part; the priority is named by the caller and belongs to the opening part alone, because an
			// urgent one drops whatever is being read
			announce(announcement, priority = 'polite') {
				const [opening, ...rest] = announcement.split(ANNOUNCEMENT_SEPARATOR);
				ui_a11y.LiveAnnouncer.announce(opening, priority);
				rest.forEach(part => ui_a11y.LiveAnnouncer.announce(part, 'polite'));
			},
			onTick(event) {
				const {
					durationMs,
					remainingMs
				} = event.getData();
				this.durationMs = durationMs;
				this.remainingMs = remainingMs;
			},
			onStopped(event) {
				const record = event.getData();
				this.recordOfOwnSession = record;
				if (this.isSendingOnRelease) {
					this.handOverRecord(record);
					return;
				}

				// every other end keeps the record in the panel: what is sent is decided by the user
				this.stopWaitingForRelease();
				this.record = record;
			},
			onPointerUp(event) {
				if (this.isRecordingOver) {
					this.stopWaitingForRelease();
					return;
				}

				// dropping a record is irreversible, so the release answers by the box of the moment and
				// not by the cached one, which the panel may have outgrown while the hold was running
				this.readGestureBounds();
				if (this.isPointerOverCancel(event)) {
					this.session.cancel();
					return;
				}
				if (this.isPointerOverLock(event) || this.isReleaseTooEarlyToSend()) {
					this.onLock();
					return;
				}

				// the release is the send itself, and the panel closes on the answer of the session
				this.isSendingOnRelease = true;
				this.session.stop();
			},
			// the gesture ended before there was anything to send, so it counts as a click on the
			// microphone and the recording goes on with nothing to hold
			isReleaseTooEarlyToSend() {
				// the browser is still asking for the microphone, and it takes as long as the user makes
				// it: the length of such a gesture says nothing about the length of the record
				if (this.recordingState !== RecordingState.recording) {
					return true;
				}

				// one check of the threshold covers both cases, a short click of the microphone and a hold
				// that recorded too little, and it is the same one the actions of the panel are held by
				return this.isTooShortToKeep;
			},
			onPointerCancel() {
				if (this.isRecordingOver) {
					this.stopWaitingForRelease();
					return;
				}

				// an interrupted gesture is not a release: nothing was recorded on purpose, nothing is sent
				this.session.cancel();
			},
			// the pointer of the hold stays captured by the button it went down on, so the trash button gets
			// no enter event of its own: its coordinates are what answers where the pointer is
			onPointerMove(event) {
				if (event.buttons === 0) {
					return;
				}

				// the panel takes the place of the field only once the field is hidden, which happens after
				// this panel is mounted: the first move is the earliest moment the box is worth reading,
				// and it is read there once and not on every move that follows
				if (!this.cancelBounds) {
					this.readGestureBounds();
				}
				this.isCancelArmed = this.isPointerOverCancel(event);
				this.isLockArmed = this.isPointerOverLock(event);
			},
			readGestureBounds() {
				this.readCancelBounds();
				this.$refs.lock?.readBounds();
			},
			// the box lights the button up on the way to it; what the release does is decided by a box of
			// its own, so a cache the panel outgrew costs a highlight and never a record
			readCancelBounds() {
				this.cancelBounds = this.$refs.cancel?.getBoundingClientRect() ?? null;
			},
			isPointerOverCancel(event) {
				if (!this.cancelBounds) {
					return false;
				}
				const {
					top,
					right,
					bottom,
					left
				} = this.cancelBounds;
				return event.clientX >= left && event.clientX <= right && event.clientY >= top && event.clientY <= bottom;
			},
			isPointerOverLock(event) {
				return this.$refs.lock?.containsPointer(event) ?? false;
			},
			onLock() {
				if (this.isLocked) {
					return;
				}

				// the recording is no longer tied to the gesture, so the release stops meaning anything
				this.stopWaitingForRelease();

				// the indicator leaves with the hold: focus that reached it moves to the panel and not nowhere
				const keepsFocus = this.$el.contains(document.activeElement);
				this.isLocked = true;
				if (keepsFocus) {
					void this.$nextTick(() => this.$el.focus());
				}
			},
			pauseRecording() {
				this.session.pause();
			},
			resumeRecording() {
				this.session.resume();
			},
			// the guard and not the `disabled` attribute: a refused action stays reachable to name its own
			// reason, and a screen reader announces nothing about a disabled button
			stopRecording() {
				// the name and the state of the button under the focus are not read again when they change,
				// so a refusal is named at the press itself
				if (this.isTooShortToKeep) {
					this.announce(this.tooShortText);
					return;
				}
				this.session.stop();
			},
			// the trash button of the panel and the Esc of the composer, which reaches this very method
			cancelRecording() {
				// assertive: the cancel makes every announcement about the recording still waiting in the
				// queue untrue, and an urgent one both drops what is being read and goes first
				this.announce(this.loc('IM_TEXTAREA_VOICE_RECORDER_ANNOUNCE_CANCELLED'), 'assertive');

				// a panel opened on a record that came back has no session to end, so it asks for the way out
				if (!this.session) {
					this.$emit('close');
					return;
				}
				this.session.cancel();
			},
			sendRecord() {
				if (this.isTooShortToKeep) {
					this.announce(this.tooShortText);
					return;
				}
				this.handOverRecord(this.record);
			},
			handOverRecord(record) {
				this.$emit('recorded', record);
				this.$emit('close');
				// counted last: nothing about analytics stands between the record and the chat
				this.countRecord(record);
			},
			// the record of its own session is the only one this panel counts, and counting takes it: a
			// record that came back from a failed send was counted by the panel that recorded it
			countRecord(record) {
				// the panel keeps its record in the reactive state: identity is compared behind that view
				if (ui_vue3.toRaw(record) !== this.recordOfOwnSession) {
					return;
				}
				this.recordOfOwnSession = null;
				im_v2_lib_analytics.Analytics.getInstance().voiceRecorder.onRecordSent({
					dialogId: this.dialogId,
					durationSeconds: record.durationSeconds,
					isLocked: this.isLocked
				});
			},
			hasFocusFallenToPage() {
				const {
					activeElement,
					body
				} = document;
				return !activeElement || activeElement === body;
			},
			hasFocusOnCoveredField() {
				return this.hasFocusFallenToPage() || Boolean(this.$el.parentElement?.contains(document.activeElement));
			},
			takeInitialFocus() {
				// a start with no pointer has no hold to release: focus goes on to the action that ends
				// the recording. A start from the pointer leaves focus on the panel instead - the user is
				// working with the pointer, and the stop button must not come under their hand. A panel
				// rendered without that button takes the focus the way every other path does
				if (this.isStartWithoutPointer && this.$refs.stop) {
					this.$refs.stop.focus();
					return;
				}
				this.takeFocusFromCoveredField();
			},
			// the field is merely hidden, so focus left on it would strand the user off the screen; focus
			// the user put anywhere else is left alone. The root of the panel takes no action of its own,
			// so a space bar meant for the text of the field sends nothing from here
			takeFocusFromCoveredField() {
				if (this.hasFocusOnCoveredField()) {
					this.$el.focus();
				}
			},
			stopWaitingForRelease() {
				main_core.Event.unbind(document, 'pointerup', this.onPointerUp);
				main_core.Event.unbind(document, 'pointercancel', this.onPointerCancel);
				main_core.Event.unbind(document, 'pointermove', this.onPointerMove);
				main_core.Event.unbind(window, 'resize', this.readGestureBounds);
				this.isCancelArmed = false;
				this.isLockArmed = false;
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			:aria-label="panelLabel"
			class="bx-im-voice-recording-panel"
			data-testid="im-textarea-recording-panel"
			role="group"
			tabindex="-1"
		>
			<AccessState v-if="hasAccessError" :code="errorCode" @close="$emit('close')" />
			<template v-else>
				<div class="bx-im-voice-recording-panel__main">
					<RecordingPreview
						v-if="hasRecord"
						:blob="record.blob"
						:durationSeconds="record.durationSeconds"
					/>
					<div
						v-else
						class="bx-im-voice-recording-panel__status"
						data-testid="im-textarea-recording-status"
					>
						<!-- the recording mark has no design system component of its own -->
						<div
							:class="{ '--paused': isPaused }"
							class="bx-im-voice-recording-panel__dot"
						></div>
						<TextMd
							:class="{ '--warning': isLimitApproaching }"
							class="bx-im-voice-recording-panel__timer"
							data-testid="im-textarea-recording-timer"
						>{{ duration }}</TextMd>
						<!-- both states are spelled out: a mark that differs only in colour is read by nobody -->
						<TextSm
							v-if="isPaused"
							class="bx-im-voice-recording-panel__state"
							data-testid="im-textarea-recording-state"
						>{{ pausedLabel }}</TextSm>
						<TextSm
							v-if="isLimitApproaching"
							class="bx-im-voice-recording-panel__limit"
							data-testid="im-textarea-recording-limit"
						>{{ limitLeftText }}</TextSm>
					</div>
					<LockIndicator
						v-if="isHoldGesture"
						:isArmed="isLockArmed"
						ref="lock"
						@lock="onLock"
					/>
				</div>
				<TextSm
					v-if="hasSendFailure"
					class="bx-im-voice-recording-panel__failure"
					data-testid="im-textarea-recording-send-failure"
				>{{ sendFailureText }}</TextSm>
				<div class="bx-im-voice-recording-panel__actions">
					<button
						:title="cancelHint"
						:aria-label="cancelHint"
						:class="{ '--armed': isCancelArmed }"
						ref="cancel"
						class="bx-im-voice-recording-panel__cancel"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-cancel"
						@click="cancelRecording"
					>
						<BIcon :name="OutlineIcons.TRASHCAN" :size="ACTION_ICON_SIZE" />
					</button>
					<!-- a locked recording has no hold left to release: the hint would name a gesture that is over -->
					<TextSm
						v-if="isHoldGesture"
						class="bx-im-voice-recording-panel__hint"
						data-testid="im-textarea-recording-hint"
					>{{ releaseHint }}</TextSm>
					<!-- pause and resume share one place: the button under the pointer must not move on every press -->
					<button
						v-if="isLockedRecording"
						:title="pauseHint"
						:aria-label="pauseHint"
						class="bx-im-voice-recording-panel__action"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-pause"
						@click="pauseRecording"
					>
						<BIcon :name="OutlineIcons.PAUSE_M" :size="ACTION_ICON_SIZE" />
					</button>
					<button
						v-else-if="isPaused"
						:title="resumeHint"
						:aria-label="resumeHint"
						class="bx-im-voice-recording-panel__action"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-resume"
						@click="resumeRecording"
					>
						<BIcon :name="OutlineIcons.RECORD_ON" :size="ACTION_ICON_SIZE" />
					</button>
					<!-- the place of the microphone holds the main action through all states of the panel -->
					<VoiceRecorderButton v-if="isHoldGesture" isRecording />
					<!-- aria-disabled and not disabled: a refused action stays reachable and names its
						 reason through the title and the label, and a screen reader announces nothing
						 about a disabled button -->
					<button
						v-else-if="hasRecord"
						:title="sendHint"
						:aria-label="sendHint"
						:aria-disabled="isTooShortToKeep ? 'true' : undefined"
						:class="{ '--disabled': isTooShortToKeep }"
						ref="send"
						class="bx-im-voice-round-button"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-send"
						@click="sendRecord"
					>
						<BIcon :name="OutlineIcons.SEND" :size="MAIN_ACTION_ICON_SIZE" />
					</button>
					<button
						v-else
						:title="stopHint"
						:aria-label="stopHint"
						:aria-disabled="isTooShortToKeep ? 'true' : undefined"
						:class="{ '--disabled': isTooShortToKeep }"
						ref="stop"
						class="bx-im-voice-round-button"
						type="button"
						tabindex="0"
						data-testid="im-textarea-recording-stop"
						@click="stopRecording"
					>
						<BIcon :name="OutlineIcons.STOP_M" :size="MAIN_ACTION_ICON_SIZE" />
					</button>
				</div>
			</template>
		</div>
	`
	};

	exports.RecordingPanel = RecordingPanel;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.UI.Accessibility, BX.UI.IconSet, window, BX.UI.System.Typography.Vue, BX.Vue3, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Event, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Component.Elements);
//# sourceMappingURL=recording.bundle.js.map
