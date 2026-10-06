import { Type } from 'main.core';
import { type ActionTree, BuilderModel, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { type Channel } from '../editor';
import { type Logger } from '../service/logger';

// Sentinel for the "used template" slot when the clean-scenario invariant is
// broken (editor was not empty before insert, or a second template was
// inserted). It is intentionally a plain string so it survives store cloning
// and never collides with a real template object (which is always an object).
export const AMBIGUOUS_USED_TEMPLATE = 'ambiguous';

export type UsedTemplate = {
	id: number,
	title: string,
	isForeign: boolean,
	bodyAtInsert: string,
};

export const SaveFlowDecision = Object.freeze({
	None: 'none',
	UpdateToast: 'updateToast',
	SaveToast: 'saveToast',
});

type MessageState = {
	text: string,
	usedTemplate: UsedTemplate | typeof AMBIGUOUS_USED_TEMPLATE | null,
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
			usedTemplate: null,
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
			/** @function message/saveFlowDecision */
			saveFlowDecision: (state, getters): $Values<typeof SaveFlowDecision> => {
				const used = state.usedTemplate;
				if (Type.isNil(used) || used === AMBIGUOUS_USED_TEMPLATE)
				{
					return SaveFlowDecision.None;
				}

				if (used.isForeign)
				{
					return SaveFlowDecision.SaveToast;
				}

				if (getters.body === used.bodyAtInsert)
				{
					return SaveFlowDecision.None;
				}

				return SaveFlowDecision.UpdateToast;
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
			/**
			 * Record a template insertion for the save-flow. The clean
			 * scenario (empty editor + first template) keeps a snapshot; any other
			 * insert marks the state AMBIGUOUS so no toast is shown later.
			 *
			 * @function message/onTemplateInsert
			 */
			onTemplateInsert: (store, payload: {
				id: number,
				title: string,
				isForeign: boolean,
				bodyAtInsert: string,
				wasEmptyBeforeInsert: boolean,
			}) => {
				const { id, title, isForeign, bodyAtInsert, wasEmptyBeforeInsert } = payload;

				if (wasEmptyBeforeInsert && Type.isNil(store.state.usedTemplate))
				{
					store.commit('setUsedTemplate', {
						usedTemplate: {
							id,
							title,
							isForeign: Boolean(isForeign),
							bodyAtInsert: String(bodyAtInsert ?? ''),
						},
					});

					return;
				}

				store.commit('setUsedTemplate', { usedTemplate: AMBIGUOUS_USED_TEMPLATE });
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
			setUsedTemplate: (state, payload) => {
				state.usedTemplate = payload.usedTemplate;
			},
		};
	}
}
