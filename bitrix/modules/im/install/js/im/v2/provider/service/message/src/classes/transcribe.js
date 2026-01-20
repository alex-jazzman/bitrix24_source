import { Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { RestMethod, TranscriptionStatus } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';

import type { TranscriptionResponse } from '../types/message';

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
}
