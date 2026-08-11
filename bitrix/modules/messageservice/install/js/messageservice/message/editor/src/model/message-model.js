import { Type } from 'main.core';
import { type ActionTree, BuilderModel, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type Channel } from '../editor';
import { type Logger } from '../service/logger';

type MessageState = {
	text: string,
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
					return rootGetters['notificationTemplates/body'];
				}

				if (!channel?.isTemplatesBased)
				{
					return state.text.trim();
				}

				return rootGetters['templates/body'];
			},
			/** @function message/isReadyToSend */
			isReadyToSend: (state, getters, rootState, rootGetters): boolean => {
				if (
					Type.isNil(rootGetters['channels/current'])
					|| Type.isNil(rootGetters['channels/from'])
					|| Type.isNil(rootGetters['to/current'])
				)
				{
					return false;
				}

				const channel: Channel = rootGetters['channels/current'];
				if (channel.backend.senderCode === 'bitrix24')
				{
					return Type.isStringFilled(rootGetters['notificationTemplates/current']?.code);
				}

				return Type.isStringFilled(getters.body);
			},
		};
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
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<MessageState>
	{
		return {
			setText: (state, payload) => {
				state.text = payload.text;
			},
		};
	}
}
