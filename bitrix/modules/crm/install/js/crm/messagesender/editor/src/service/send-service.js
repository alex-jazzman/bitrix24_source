import { type Receiver } from 'crm.messagesender';
import { ajax as Ajax, type JsonObject, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';
import { type Channel, type From } from '../editor';
import { type MessageModel } from '../model/message-model';
import { type Template } from '../model/templates-model';
import { type AnalyticsService } from './analytics-service';
import { type Logger } from './logger';

type Params = {
	logger: Logger,
	store: Store,
	messageModel: MessageModel,
	eventEmitter: EventEmitter,
	analyticsService: AnalyticsService,
};

export class SendService
{
	#logger: Logger;
	#store: Store;
	#messageModel: MessageModel;
	#emitter: EventEmitter;
	#analyticsService: AnalyticsService;

	constructor(params: Params)
	{
		this.#logger = params.logger;
		this.#store = params.store;
		this.#messageModel = params.messageModel;
		this.#emitter = params.eventEmitter;
		this.#analyticsService = params.analyticsService;
	}

	sendMessage(): Promise<void>
	{
		if (this.#store.getters['application/isProgress'])
		{
			this.#logger.warn('sendMessage: already in progress');

			return Promise.resolve();
		}

		void this.#store.dispatch('application/setProgress', { isSending: true });

		const channel: Channel = this.#store.getters['channels/current'];
		const from: From = this.#store.getters['channels/from'];
		const receiver: Receiver = this.#store.getters['channels/receiver'];

		const params = this.#prepareParams(channel, from, receiver);

		return new Promise((resolve, reject) => {
			Ajax.runAction('crm.activity.sms.send', {
				data: {
					ownerTypeId: this.#store.state.application.context.entityTypeId,
					ownerId: this.#store.state.application.context.entityId,
					params,
				},
			})
				.then(resolve)
				.catch(reject)
			;
		}).then(() => {
			this.#analyticsService.onSend();
			this.#messageModel.clearState();
			void this.#store.dispatch('application/resetAlert');
			this.#emitter.emit('crm:messagesender:editor:onSendSuccess');
		}).catch((response) => {
			this.#logger.error('sendMessage: error', { response });

			throw response;
		}).finally(() => {
			void this.#store.dispatch('application/setProgress', { isSending: false });
		});
	}

	#prepareParams(channel: Channel, from: From, receiver: Receiver): JsonObject
	{
		if (channel.backend.senderCode === 'bitrix24')
		{
			return this.#prepareNotificationParams(channel, from, receiver);
		}

		if (channel.isTemplatesBased)
		{
			return this.#prepareTemplateParams(channel, from, receiver);
		}

		return this.#prepareCustomTextParams(channel, from, receiver);
	}

	#prepareNotificationParams(channel: Channel, from: From, receiver: Receiver): JsonObject
	{
		return {
			...this.#prepareCommonParams(channel, from, receiver),
			signedTemplate: this.#store.state.application.notificationTemplate.signed,
		};
	}

	#prepareTemplateParams(channel: Channel, from: From, receiver: Receiver): JsonObject
	{
		const template: ?Template = this.#store.getters['templates/current'];

		return {
			...this.#prepareCommonParams(channel, from, receiver),
			body: this.#store.getters['message/body'],
			template: template.ID,
			templateOriginalId: template.ORIGINAL_ID,
			isTemplateWithPlaceholders: Type.isPlainObject(template.PLACEHOLDERS),
			isReplacePlaceholders: true,
			isPlaceholdersInDisplayFormat: false,
		};
	}

	#prepareCustomTextParams(channel: Channel, from: From, receiver: Receiver): JsonObject
	{
		return {
			...this.#prepareCommonParams(channel, from, receiver),
			body: this.#store.getters['message/body'],
			paymentId: this.#store.state.message.paymentId,
			shipmentId: this.#store.state.message.shipmentId,
			source: this.#store.state.message.source,
			compilationProductIds: this.#store.state.message.compilationProductIds,
			isReplacePlaceholders: true,
			isPlaceholdersInDisplayFormat: true,
		};
	}

	#prepareCommonParams(channel: Channel, from: From, receiver: Receiver): JsonObject
	{
		return {
			senderId: channel.backend.id,
			from: from.id,
			to: receiver.address.value,
			entityTypeId: receiver.addressSource.entityTypeId,
			entityId: receiver.addressSource.entityId,
		};
	}
}
