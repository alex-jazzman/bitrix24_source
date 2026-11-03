import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { RestMethod, TranscriptionStatus } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

import { type TranscriptionResponse } from '../types/message';

// How long a voice message waits for a transcription result before the wait is called off (Q-3 of
// the feature). The result is delivered by a fire-once pull event from a queue the messenger does
// not control, so a lost or endlessly delayed one would leave the spinner running forever.
const TRANSCRIPTION_WATCHDOG_TIMEOUT = 5 * 60 * 1000;
const TRANSCRIPTION_TIMEOUT_ERROR_CODE = 'TRANSCRIPTION_TIMEOUT';

// the timers stand beside the service and not inside a player: a watchdog kept by the component
// showing the wait measures how long that component stayed mounted, and a message scrolled out of
// the list would start its five minutes over on every return to the screen
const watchdogTimers: Map<number, number> = new Map();

export class TranscribeService
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	transcribe(fileId: number, messageId: number): Promise<TranscriptionResponse>
	{
		Logger.warn('TranscribeService: transcribe:', fileId);

		const payload = {
			data: {
				messageId,
				fileId,
			},
		};

		void this.#store.dispatch('files/setTranscription', {
			fileId,
			status: TranscriptionStatus.PENDING,
			transcriptText: null,
			errorCode: null,
		});

		this.#armWatchdog(fileId);

		return runAction(RestMethod.imV2DiskFileTranscribe, payload)
			.then((result) => {
				void this.#store.dispatch('files/setTranscription', result);
			})
			.catch((errors: RunActionError[]) => {
				const [firstError] = errors;
				void this.#store.dispatch('files/setTranscription', {
					fileId,
					status: TranscriptionStatus.ERROR,
					transcriptText: null,
					errorCode: firstError?.code,
				});

				console.error('TranscribeService: transcribe error:', errors);
			});
	}

	#armWatchdog(fileId: number): void
	{
		clearTimeout(watchdogTimers.get(fileId));

		const timerId = setTimeout(
			() => this.#giveUpWaiting(fileId, timerId),
			TRANSCRIPTION_WATCHDOG_TIMEOUT,
		);
		watchdogTimers.set(fileId, timerId);
	}

	// a result reaches the model from this request, from a pull event or from another chat the record
	// was forwarded to, so the timer asks the model on its own instead of being called off from each
	// of those places
	#giveUpWaiting(fileId: number, timerId: number): void
	{
		if (watchdogTimers.get(fileId) !== timerId)
		{
			return;
		}

		watchdogTimers.delete(fileId);

		if (this.#store.getters['files/getTranscription'](fileId)?.status !== TranscriptionStatus.PENDING)
		{
			return;
		}

		// playback is untouched: only the transcription state turns into an explicit error
		void this.#store.dispatch('files/setTranscription', {
			fileId,
			status: TranscriptionStatus.ERROR,
			transcriptText: null,
			errorCode: TRANSCRIPTION_TIMEOUT_ERROR_CODE,
		});
	}
}
