import { Event, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { reactive } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { DesktopApi } from 'im.v2.lib.desktop-api';
import { Logger } from 'im.v2.lib.logger';
import {
	CALL_START_EVENTS,
	Capability,
	CapabilityResolver,
	TargetFormat,
	type CapabilityValue,
} from 'im.v2.lib.voice-recorder';

import { MIN_RECORDING_MS } from '../const/recording-limits';
import { RecordingErrorCode, RecordingState, RecordingStopReason } from '../const/recording-state';
import { FormatEncoder } from './format-encoder';
import { RecordingBroadcast } from './recording-broadcast';

const EVENT_NAMESPACE = 'BX.Messenger.v2.VoiceRecordingSession';

const TICK_INTERVAL = 200;

const MILLISECONDS_IN_SECOND = 1000;

// a refusal without a prompt comes back at once: nobody was asked, so the block is a standing one
const PROMPT_DELAY = 300;

const DENIED_ERROR_NAMES = new Set(['NotAllowedError', 'PermissionDeniedError', 'SecurityError']);

const MISSING_DEVICE_ERROR_NAMES = new Set(['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError']);

const ACTIVE_STATES = new Set([RecordingState.recording, RecordingState.paused]);

export type RecordingSessionState = {
	recordingState: $Values<typeof RecordingState>,
	stopReason: $Values<typeof RecordingStopReason> | null,
	errorCode: $Values<typeof RecordingErrorCode> | null,
};

export class RecordingSession extends EventEmitter
{
	static events = {
		onTick: 'onTick',
		onStopped: 'onStopped',
		onError: 'onError',
	};

	#state: RecordingSessionState;
	#capability: ?CapabilityValue = null;
	#stream: ?MediaStream = null;
	#recorder: ?MediaRecorder = null;
	#broadcast: ?RecordingBroadcast = null;
	#chunks: Blob[] = [];
	#accumulatedMs: number = 0;
	#maxDurationMs: ?number = null;
	#startedAt: ?number = null;
	#tickTimer: ?number = null;
	// the tick runs more often than a second, and a tick that changes nothing on the screen is dropped
	#publishedSecond: number = 0;
	// the minimum length of a record falls inside the first second, and the consumer holds the actions
	// of a recording by it, so its crossing is published apart from the whole seconds
	#hasReachedMinimum: boolean = false;
	// the conversion is the most expensive step of the session, and this flag stops it between stages
	#isGivenUp: boolean = false;
	#startAttemptId: number = 0;

	constructor()
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		this.#state = reactive({
			recordingState: RecordingState.idle,
			stopReason: null,
			errorCode: null,
		});
	}

	getState(): RecordingSessionState
	{
		return this.#state;
	}

	// every interval here is measured with the monotonic clock: a system clock moved by the user, by NTP
	// or by the laptop waking up would jump the shown duration and trip the stop by the limit at once
	getDurationMs(): number
	{
		const runningMs = this.#startedAt === null ? 0 : performance.now() - this.#startedAt;

		return this.#accumulatedMs + runningMs;
	}

	async start(): Promise<void>
	{
		if (this.#state.recordingState !== RecordingState.idle)
		{
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

		this.#capability = await CapabilityResolver.resolve();
		if (
			startAttemptId !== this.#startAttemptId
			|| this.#state.recordingState !== RecordingState.requesting
		)
		{
			return;
		}

		if (this.#capability === Capability.unavailable)
		{
			// whether recording is offered at all is the consumer's call; a session started anyway records nothing
			this.#stopWatchingInterruptions();
			this.#state.recordingState = RecordingState.idle;

			return;
		}

		const stream = await this.#requestStream();
		if (!stream)
		{
			return;
		}

		this.#stream = stream;

		try
		{
			this.#recorder = this.#createRecorder(stream);
			this.#recorder.start();
		}
		catch (error)
		{
			// a recorder the browser refuses to build or to start is the device saying no to this tab,
			// and the stream assigned above is released by the failure alone
			Logger.error('RecordingSession: the recorder of the browser did not start', error);
			this.#fail(RecordingErrorCode.deviceBusy);

			return;
		}

		this.#startedAt = performance.now();
		this.#state.recordingState = RecordingState.recording;
		this.#startTicking();
		this.#watchInterruptions();
	}

	// the recorder keeps the fragment it has already written, so what was recorded before the pause stays
	pause(): void
	{
		if (this.#state.recordingState !== RecordingState.recording)
		{
			return;
		}

		this.#recorder.pause();
		this.#accumulateElapsed();
		this.#stopTicking();
		this.#state.recordingState = RecordingState.paused;
	}

	resume(): void
	{
		if (this.#state.recordingState !== RecordingState.paused)
		{
			return;
		}

		this.#recorder.resume();
		this.#startedAt = performance.now();
		this.#state.recordingState = RecordingState.recording;
		this.#startTicking();
	}

	stop(): void
	{
		this.#finish(null);
	}

	stopExternally(reason: $Values<typeof RecordingStopReason>): void
	{
		this.#finish(reason);
	}

	cancel(): void
	{
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

	#finish(reason: $Values<typeof RecordingStopReason> | null): void
	{
		if (this.#state.recordingState === RecordingState.requesting)
		{
			// the hold ended before the browser answered: there is no fragment to keep
			this.cancel();

			return;
		}

		if (!ACTIVE_STATES.has(this.#state.recordingState))
		{
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

	async #requestStream(): Promise<?MediaStream>
	{
		const requestedAt = performance.now();

		try
		{
			// one channel is asked for and not demanded: the ceiling of the client conversion stage is
			// counted per channel, and a stereo device would spend three times that on the same
			// recording. An `exact` here would answer with OverconstrainedError instead, which this
			// very method reads as a microphone that is not there at all
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: { channelCount: { ideal: 1 } },
			});

			if (this.#state.recordingState !== RecordingState.requesting)
			{
				stream.getTracks().forEach((track) => track.stop());

				return null;
			}

			return stream;
		}
		catch (error)
		{
			if (this.#state.recordingState === RecordingState.requesting)
			{
				this.#fail(this.#getAccessErrorCode(error, performance.now() - requestedAt));
			}

			return null;
		}
	}

	#getAccessErrorCode(error: Error, answeredIn: number): $Values<typeof RecordingErrorCode>
	{
		if (MISSING_DEVICE_ERROR_NAMES.has(error.name))
		{
			return RecordingErrorCode.deviceNotFound;
		}

		if (!DENIED_ERROR_NAMES.has(error.name))
		{
			// the device was found but never started - the same situation the busy device state describes
			return RecordingErrorCode.deviceBusy;
		}

		if (DesktopApi.isDesktop())
		{
			// the desktop application never asks the user itself: a refusal there comes from the system
			return RecordingErrorCode.accessDeniedBySystem;
		}

		return answeredIn < PROMPT_DELAY
			? RecordingErrorCode.accessDeniedPermanently
			: RecordingErrorCode.accessDeniedInSession;
	}

	#createRecorder(stream: MediaStream): MediaRecorder
	{
		const options = this.#capability === Capability.nativeTarget ? { mimeType: TargetFormat.mimeType } : {};
		const recorder = new MediaRecorder(stream, options);

		Event.bind(recorder, 'dataavailable', this.#onDataAvailable);
		Event.bind(recorder, 'stop', this.#onRecorderStop);
		Event.bind(recorder, 'error', this.#onRecorderError);

		return recorder;
	}

	// the events are dropped before the stop, so the take of a released recorder is never published
	#releaseRecorder(): void
	{
		const recorder = this.#recorder;
		if (!recorder)
		{
			return;
		}

		this.#recorder = null;
		Event.unbind(recorder, 'dataavailable', this.#onDataAvailable);
		Event.unbind(recorder, 'stop', this.#onRecorderStop);
		Event.unbind(recorder, 'error', this.#onRecorderError);

		if (recorder.state !== 'inactive')
		{
			recorder.stop();
		}
	}

	#releaseStream(): void
	{
		this.#stream?.getTracks().forEach((track) => track.stop());
		this.#stream = null;
	}

	async #publishRecording(mimeType: string): Promise<void>
	{
		const recorded = new Blob(this.#chunks, { type: mimeType });
		this.#chunks = [];

		const converted = this.#capability === Capability.clientEncode
			? await FormatEncoder.encode(recorded, {
				durationMs: this.#accumulatedMs,
				isCancelled: () => this.#isGivenUp,
			})
			: null;

		// given up while it was converting: whatever ended the panel has already dropped this record
		if (this.#isGivenUp)
		{
			return;
		}

		this.emit(RecordingSession.events.onStopped, {
			blob: converted ?? recorded,
			// the whole seconds are what the message of the chat carries, the milliseconds are what
			// the minimum length of a record is answered by: rounding hides a record below it
			durationMs: this.#accumulatedMs,
			durationSeconds: Math.round(this.#accumulatedMs / MILLISECONDS_IN_SECOND),
			isTargetFormat: Boolean(converted) || this.#capability === Capability.nativeTarget,
		});
	}

	#fail(code: $Values<typeof RecordingErrorCode>): void
	{
		this.#stopTicking();
		this.#stopWatchingInterruptions();
		this.#releaseRecorder();
		this.#releaseStream();
		this.#resetProgress();

		this.#state.errorCode = code;
		this.#state.recordingState = RecordingState.error;
		this.emit(RecordingSession.events.onError, { code });
	}

	#resetProgress(): void
	{
		this.#chunks = [];
		this.#accumulatedMs = 0;
		this.#startedAt = null;
		this.#publishedSecond = 0;
		this.#hasReachedMinimum = false;
	}

	#accumulateElapsed(): void
	{
		if (this.#startedAt === null)
		{
			return;
		}

		this.#accumulatedMs += performance.now() - this.#startedAt;
		this.#startedAt = null;
	}

	// the limit is the portal's alone: a default of the client would disagree with the server the
	// moment the setting changes, so a portal that names none gets no limit here either
	#readMaxDurationMs(): ?number
	{
		const { voiceMessage = {} } = Core.getApplicationData();
		const maxDurationSeconds = Text.toNumber(voiceMessage.maxDurationSeconds);

		return maxDurationSeconds > 0 ? maxDurationSeconds * MILLISECONDS_IN_SECOND : null;
	}

	#getRemainingMs(durationMs: number): ?number
	{
		return this.#maxDurationMs === null ? null : Math.max(this.#maxDurationMs - durationMs, 0);
	}

	#startTicking(): void
	{
		this.#tickTimer = setInterval(this.#onTick, TICK_INTERVAL);
	}

	#stopTicking(): void
	{
		if (this.#tickTimer === null)
		{
			return;
		}

		clearInterval(this.#tickTimer);
		this.#tickTimer = null;
	}

	// a call takes the microphone whoever asked for it first, so the session steps aside from the
	// moment it starts asking - the recording it would produce could not be made anyway
	#watchCalls(): void
	{
		CALL_START_EVENTS.forEach((eventName) => EventEmitter.subscribe(eventName, this.#onCallStarted));
	}

	// every listener lives exactly as long as the recording: a warning left behind would come up on
	// every ordinary reload of the page
	#watchInterruptions(): void
	{
		Event.bind(window, 'beforeunload', this.#onBeforeUnload);

		// announced only once the microphone is granted: an earlier announce would end the recording
		// of another tab for a recording that never happens
		this.#broadcast = new RecordingBroadcast(this.#onOtherTabStart);
		this.#broadcast.announceStart();
	}

	#stopWatchingInterruptions(): void
	{
		CALL_START_EVENTS.forEach((eventName) => EventEmitter.unsubscribe(eventName, this.#onCallStarted));
		Event.unbind(window, 'beforeunload', this.#onBeforeUnload);
		this.#broadcast?.close();
		this.#broadcast = null;
	}

	#onTick = (): void => {
		const durationMs = this.getDurationMs();
		const remainingMs = this.#getRemainingMs(durationMs);
		const second = Math.floor(durationMs / MILLISECONDS_IN_SECOND);
		const hasReachedMinimum = durationMs >= MIN_RECORDING_MS;

		// the interval serves the stop by the limit; the interface counts in whole seconds, plus the
		// tick the minimum length of a record is reached at, which falls inside the first of them
		if (second !== this.#publishedSecond || hasReachedMinimum !== this.#hasReachedMinimum)
		{
			this.#publishedSecond = second;
			this.#hasReachedMinimum = hasReachedMinimum;
			this.emit(RecordingSession.events.onTick, { durationMs, remainingMs });
		}

		// the fragment recorded up to the limit is kept: what to do with it is still decided by the user
		if (remainingMs === 0)
		{
			this.stopExternally(RecordingStopReason.durationLimit);
		}
	};

	#onDataAvailable = (event: BlobEvent): void => {
		if (event.data.size > 0)
		{
			this.#chunks.push(event.data);
		}
	};

	#onRecorderStop = (): void => {
		const { mimeType } = this.#recorder;

		this.#releaseRecorder();
		this.#releaseStream();
		this.#publishRecording(mimeType);
	};

	#onRecorderError = (): void => {
		// a recorder that dies mid-flight means the device stopped giving audio to this tab
		this.#fail(RecordingErrorCode.deviceBusy);
	};

	// the call takes the microphone whichever side started it, and the fragment stays ready in the panel
	#onCallStarted = (): void => {
		this.stopExternally(RecordingStopReason.callStarted);
	};

	// the recording started last wins: refusing it would leave the microphone with a tab out of sight
	#onOtherTabStart = (): void => {
		this.stopExternally(RecordingStopReason.otherTab);
	};

	// the record lives in this tab alone and is restored nowhere, so the browser asks first
	#onBeforeUnload = (event: BeforeUnloadEvent): void => {
		event.preventDefault();
		// part of the engines still read the legacy field instead of the prevented default
		// eslint-disable-next-line no-param-reassign
		event.returnValue = '';
	};
}
