import { getPlainText } from 'crm.template.editor';
import { Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';

import type { Channel, NotificationTemplate } from '../editor';
import { type Logger } from '../service/logger';
import type { Template } from './templates-model';

type MessageState = {
	text: string,
	// something like 'message scenario'. set when content providers are used and influences flow on backend
	source: ?string,
	paymentId: ?number,
	shipmentId: ?number,
	compilationProductIds: ?Array<number>,
};

export class MessageModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'message';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): MessageState
	{
		return {
			text: String(this.getVariable('text', '') ?? ''),
			source: null,
			paymentId: null,
			shipmentId: null,
			compilationProductIds: null,
		};
	}

	getGetters(): GetterTree<MessageState>
	{
		return {
			/** @function message/body */
			body: (state, getters, rootState, rootGetters): string => {
				const channel: Channel = rootGetters['channels/current'];

				if (channel?.backend.senderCode === 'bitrix24')
				{
					const notificationTemplate = rootState.application.notificationTemplate;
					if (Type.isNil(notificationTemplate))
					{
						return '';
					}

					return this.#compileNotificationBody(notificationTemplate);
				}

				if (!channel?.isTemplatesBased)
				{
					return state.text.trim();
				}

				const template: ?Template = rootGetters['templates/current'];
				if (Type.isNil(template))
				{
					return '';
				}

				return this.#compileTemplateBody(template);
			},
			/** @function message/isReadyToSend */
			isReadyToSend: (state, getters, rootState, rootGetters): boolean => {
				if (
					Type.isNil(rootGetters['channels/current'])
					|| Type.isNil(rootGetters['channels/from'])
					|| Type.isNil(rootGetters['channels/receiver'])
				)
				{
					return false;
				}

				const channel: Channel = rootGetters['channels/current'];
				if (channel.backend.senderCode === 'bitrix24')
				{
					return Type.isStringFilled(rootState.application.notificationTemplate?.code);
				}

				return Type.isStringFilled(getters.body);
			},
		};
	}

	#compileNotificationBody(notificationTemplate: NotificationTemplate): string
	{
		let text = notificationTemplate.translation?.TEXT || '';
		for (const placeholder of notificationTemplate.placeholders || [])
		{
			if (!Type.isNil(placeholder.value))
			{
				text = text.replace(`#${placeholder.name}#`, placeholder.value);
			}
			else if (!Type.isNil(placeholder.caption))
			{
				text = text.replace(`#${placeholder.name}#`, placeholder.caption);
			}
		}

		return text;
	}

	#compileTemplateBody(template: Template): string
	{
		// todo position
		// todo tight coupling with template editor
		return getPlainText(
			template.PREVIEW,
			template.PLACEHOLDERS?.PREVIEW ?? [],
			template.FILLED_PLACEHOLDERS ?? [],
		);
	}

	getActions(): ActionTree<MessageState>
	{
		return {
			/** @function message/setText */
			setText: (store, payload: {text: string}) => {
				const { text } = payload;
				if (!Type.isString(text))
				{
					this.#logger.warn('setText: text should be a string', { payload });

					return;
				}

				store.commit('setText', {
					text,
				});
			},
			/** @function message/setSource */
			setSource: (store, payload: {source: string}) => {
				const { source } = payload;
				if (!Type.isStringFilled(source))
				{
					this.#logger.warn('setSource: source should be a string', { payload });

					return;
				}

				store.commit('setSource', {
					source,
				});
			},
			/** @function message/setPaymentId */
			setPaymentId: (store, payload: {paymentId: number}) => {
				const { paymentId } = payload;
				if (!Type.isInteger(paymentId))
				{
					this.#logger.warn('setPaymentId: paymentId should be an int', { payload });

					return;
				}

				store.commit('setPaymentId', {
					paymentId,
				});
			},
			/** @function message/setShipmentId */
			setShipmentId: (store, payload: {shipmentId: number}) => {
				const { shipmentId } = payload;
				if (!Type.isInteger(shipmentId))
				{
					this.#logger.warn('setShipmentId: shipmentId should be an int', { payload });

					return;
				}

				store.commit('setShipmentId', {
					shipmentId,
				});
			},
			/** @function message/setCompilationProductIds */
			setCompilationProductIds: (store, payload: {compilationProductIds: Array<number>}) => {
				const { compilationProductIds } = payload;
				if (!Type.isArray(compilationProductIds))
				{
					this.#logger.warn(
						'setCompilationProductIds: compilationProductIds should be an array',
						{ payload },
					);

					return;
				}

				if (compilationProductIds.some((id) => !Type.isInteger(id)))
				{
					this.#logger.warn(
						'setCompilationProductIds: compilationProductIds should contain only integers',
						{ payload },
					);

					return;
				}

				store.commit('setCompilationProductIds', {
					compilationProductIds,
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<MessageState>
	{
		return {
			setText: (state, payload) => {
				state.text = payload.text;
			},
			setSource: (state, payload) => {
				state.source = payload.source;
			},
			setPaymentId: (state, payload) => {
				state.paymentId = payload.paymentId;
			},
			setShipmentId: (state, payload) => {
				state.shipmentId = payload.shipmentId;
			},
			setCompilationProductIds: (state, payload) => {
				state.compilationProductIds = payload.compilationProductIds;
			},
		};
	}
}
