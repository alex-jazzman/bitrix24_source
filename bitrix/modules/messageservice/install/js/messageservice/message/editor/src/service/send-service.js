import { type AjaxResponse, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';
import { type MessageModel } from '../model/message-model';
import { type AnalyticsService } from './analytics-service';
import { type Logger } from './logger';
import { type PreferencesService } from './preferences-service';
import { type SaveFlowService } from './save-flow-service';

type Params = {
	logger: Logger,
	store: Store,
	messageModel: MessageModel,
	eventEmitter: EventEmitter,
	analyticsService: AnalyticsService,
	preferencesService: PreferencesService,
	saveFlowService: SaveFlowService,
};

export class SendService
{
	#logger: Logger;
	#store: Store;
	#messageModel: MessageModel;
	#emitter: EventEmitter;
	#analyticsService: AnalyticsService;
	#preferencesService: PreferencesService;
	#saveFlowService: SaveFlowService;

	constructor(params: Params)
	{
		this.#logger = params.logger;
		this.#store = params.store;
		this.#messageModel = params.messageModel;
		this.#emitter = params.eventEmitter;
		this.#analyticsService = params.analyticsService;
		this.#preferencesService = params.preferencesService;
		this.#saveFlowService = params.saveFlowService;
	}

	sendMessage(): Promise<void>
	{
		if (this.#store.getters['application/isProgress'])
		{
			this.#logger.warn('sendMessage: already in progress');

			return Promise.resolve();
		}

		void this.#store.dispatch('application/setProgress', { isSending: true });

		// Snapshot the save-flow state before transport handlers run, so an
		// onSend handler can't mutate the editor before it is captured. It is
		// synchronous, isolates its own errors, and never blocks the async send.
		this.#saveFlowService.handleSendAttempt();

		return this.#emitter.emitAsync('onSend')
			.then((eventResults: AjaxResponse[]) => {
				const successResult = eventResults.find((x) => Type.isPlainObject(x) && x.status === 'success');
				if (successResult)
				{
					return;
				}

				const errorResult = eventResults.find((x) => Type.isPlainObject(x) && x.status === 'error' && Type.isArrayFilled(x.errors));
				if (errorResult)
				{
					throw errorResult;
				}

				throw new Error('sendMessage: all handlers failed without specific errors');
			})
			.then(() => {
				this.#analyticsService.onSend();
				this.#messageModel.clearState();
				void this.#store.dispatch('application/resetAlert');
				this.#emitter.emit('onSendSuccess');

				const channel = this.#store.getters['channels/current'];
				const from = this.#store.getters['channels/from'];
				if (channel && from)
				{
					this.#preferencesService.saveChannelLastUsedFrom(channel, from.id);
				}
			})
			.catch((result) => {
				this.#logger.error('sendMessage: error', { result });

				throw result;
			})
			.finally(() => {
				void this.#store.dispatch('application/setProgress', { isSending: false });
			});
	}
}
