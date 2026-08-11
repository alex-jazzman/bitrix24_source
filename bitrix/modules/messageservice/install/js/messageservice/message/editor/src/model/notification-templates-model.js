import { Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';
import { type NotificationTemplate } from '../editor';
import { type Logger } from '../service/logger';
import { makeFrozenClone } from './helpers';

type NotificationTemplatesState = {
	collection: NotificationTemplate[],
	selectedCode: ?string,
};

export class NotificationTemplatesModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'notificationTemplates';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): NotificationTemplatesState
	{
		return {
			collection: makeFrozenClone(this.getVariable('collection', [])),
			selectedCode: null,
		};
	}

	getGetters(): GetterTree<NotificationTemplatesState>
	{
		return {
			/** @function notificationTemplates/current */
			current: (state): ?NotificationTemplate => {
				if (state.collection.length === 0)
				{
					return null;
				}

				if (Type.isNil(state.selectedCode))
				{
					return state.collection[0];
				}

				return state.collection.find((t) => t.code === state.selectedCode) || state.collection[0];
			},
			/** @function notificationTemplates/body */
			body: (state, getters): string => {
				const notificationTemplate: ?NotificationTemplate = getters.current;

				let text = notificationTemplate?.translation?.TEXT || '';
				for (const placeholder of notificationTemplate?.placeholders || [])
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
			},
			/** @function notificationTemplates/hasMultiple */
			hasMultiple: (state): boolean => {
				return state.collection.length > 1;
			},
		};
	}

	getActions(): ActionTree<NotificationTemplatesState>
	{
		return {
			/** @function notificationTemplates/setSelected */
			setSelected: (store, payload: { code: string }) => {
				const { code } = payload;
				if (!Type.isStringFilled(code))
				{
					this.#logger.warn('setSelected: code should be a non-empty string', { payload });

					return;
				}

				const exists = store.state.collection.some((t) => t.code === code);
				if (!exists)
				{
					this.#logger.warn('setSelected: template with given code not found', { payload });

					return;
				}

				store.commit('setSelected', { code });
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<NotificationTemplatesState>
	{
		return {
			setSelected: (state, { code }) => {
				state.selectedCode = code;
			},
		};
	}
}
