import { Core } from 'im.v2.application.core';
import { Type } from 'main.core';
import { BuilderModel } from 'ui.vue3.vuex';

import { formatFieldsWithConfig } from '../../../utils/validate';
import { messagesFieldsConfig } from './field-config';

import type { JsonObject } from 'main.core';
import type { ImModelCopilotPrompt, ImModelCopilotRole, ImModelCopilotRoleCode } from 'im.v2.model';
import type { GetterTree, ActionTree, MutationTree } from 'ui.vue3.vuex';

type MessagesState = {
	collection: { [key: number]: ImModelCopilotRoleCode }
}

type CopilotMessage = {
	role: string,
	prompts: ImModelCopilotPrompt[],
}

/* eslint-disable no-param-reassign */
export class MessagesModel extends BuilderModel
{
	getState(): MessagesState
	{
		return {
			collection: {},
		};
	}

	getElementState(): CopilotMessage
	{
		return {
			id: 0,
			roleCode: '',
			prompts: [],
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function copilot/messages/getRole */
			getRole: (state) => (messageId: number): ?ImModelCopilotRole => {
				const message = state.collection[messageId];
				if (!message)
				{
					return Core.getStore().getters['copilot/roles/getDefault'];
				}

				return Core.getStore().getters['copilot/roles/getByCode'](message.roleCode);
			},
			/** @function copilot/messages/getPrompts */
			getPrompts: (state) => (messageId: number): ImModelCopilotPrompt[] => {
				const message = state.collection[messageId];
				if (!message)
				{
					return [];
				}

				// снапшот, снятый на момент приёма (см. action add); фолбэк на живую
				// роль, если снапшот пуст (роли ещё не подъехали к моменту add)
				if (Type.isArrayFilled(message.prompts))
				{
					return message.prompts;
				}

				return Core.getStore().getters['copilot/roles/getPrompts'](message.roleCode);
			},
			getAvatar: (state, getters) => (messageId: number): string => {
				const role = getters.getRole(messageId);
				if (!role)
				{
					return '';
				}

				return Core.getStore().getters['copilot/roles/getAvatar'](role.code);
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function copilot/messages/add */
			add: (store, payload) => {
				if (!Type.isArrayFilled(payload))
				{
					return;
				}

				payload.forEach((message) => {
					const preparedMessage = {
						...this.getElementState(),
						...this.formatFields(message),
					};
					// снапшот промптов роли на момент приёма: фиксируем набор из этого же
					// ответа, чтобы позднейшая перезапись глобальной роли (при заходе в
					// проектный чат) не протекала в баннер этого сообщения
					preparedMessage.prompts = Core.getStore().getters['copilot/roles/getPrompts'](preparedMessage.roleCode);
					store.commit('add', preparedMessage);
				});
			},
		};
	}

	getMutations(): MutationTree
	{
		return {
			add: (state, payload) => {
				state.collection[payload.id] = payload;
			},
		};
	}

	formatFields(fields: JsonObject): JsonObject
	{
		return formatFieldsWithConfig(fields, messagesFieldsConfig);
	}
}
