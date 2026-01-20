import { type FilledPlaceholder } from 'crm.template.editor';
import { Runtime, Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';
import { type Channel } from '../editor';
import { type Logger } from '../service/logger';
import { makeFrozenClone } from './helpers';

type TemplatesState = {
	collection: { [contextId: string]: Template[] },
	selected: { [channelId: string]: number },
};

export type Template = {
	ID: string,
	ORIGINAL_ID: number,
	TITLE: string,
	HEADER?: string,
	FOOTER?: string,
	PREVIEW?: string,
	PLACEHOLDERS?: Array,
	FILLED_PLACEHOLDERS?: Array,
};

const POSITION = 'PREVIEW';
const MAX_COLLECTION_SIZE = 100;

/**
 * This model uses in-browser DB for caching and can contain data from other (previous) instances of the application.
 * Be careful.
 */
export class TemplatesModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'templates';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): TemplatesState
	{
		return {
			collection: {},
			selected: {},
		};
	}

	getGetters(): GetterTree<TemplatesState>
	{
		return {
			/** @function templates/listForChannel */
			listForChannel: (state, getters, rootState, rootGetters): Template[] => {
				const chan = rootGetters['channels/current'];
				if (!chan?.isTemplatesBased)
				{
					return [];
				}

				return state.collection[getters.cacheContextId] ?? [];
			},
			/** @function templates/current */
			current: (state, getters, rootState, rootGetters): ?Template => {
				const list = getters.listForChannel;

				const templateOriginalId = state.selected[rootGetters['channels/current']?.id];
				if (Type.isNil(templateOriginalId))
				{
					return list[0];
				}

				return list.find((template) => template.ORIGINAL_ID === templateOriginalId) || list[0];
			},
			/** @function templates/cacheContextId */
			cacheContextId: (state, getters, rootState, rootGetters): string => {
				const chan: Channel = rootGetters['channels/current'];
				if (Type.isNil(chan))
				{
					return '';
				}
				const context: JsonObject = rootState.application.context;

				const parts = [
					chan.backend.senderCode,
					chan.backend.id,
					context.entityTypeId,
					context.entityId,
					context.categoryId,
				];

				return parts.filter((part) => !Type.isNil(part)).join('_');
			},
		};
	}

	getActions(): ActionTree<TemplatesState>
	{
		return {
			/** @function templates/addTemplates */
			addTemplates: (store, payload: { templates: Template[] }) => {
				const { templates } = payload;
				if (!Type.isArray(templates))
				{
					this.#logger.warn('addTemplates: templates should be a empty array', { payload });

					return;
				}

				if (Object.keys(store.state.collection).length >= MAX_COLLECTION_SIZE)
				{
					// dont overflow browser DB and memory
					store.commit('clearCollection');
				}

				store.commit('addTemplates', {
					contextId: store.getters.cacheContextId,
					templates: Runtime.clone(templates),
				});

				this.saveState(store.state);
			},
			/** @function templates/setTemplate */
			setTemplate: (store, payload: { templateOriginalId: number }) => {
				const { templateOriginalId } = payload;
				if (!Type.isInteger(templateOriginalId) || templateOriginalId <= 0)
				{
					this.#logger.warn('setTemplate: templateOriginalId should be a positive int', { payload });

					return;
				}

				const chan = store.rootGetters['channels/current'];
				if (Type.isNil(chan))
				{
					this.#logger.warn('setTemplate: no current channel');

					return;
				}

				if (!chan.isTemplatesBased)
				{
					this.#logger.warn('setTemplate: channel is not templates based', { payload });

					return;
				}

				store.commit('select', {
					channelId: chan.id,
					templateOriginalId,
				});

				this.saveState(store.state);
			},
			/** @function templates/setFilledPlaceholder */
			setFilledPlaceholder: (store, payload: { filledPlaceholder: FilledPlaceholder }) => {
				const { filledPlaceholder } = payload;
				if (!Type.isPlainObject(filledPlaceholder))
				{
					this.#logger.warn('setFilledPlaceholder: filledPlaceholder should be a valid object', { payload });

					return;
				}

				const template = store.getters.current;
				if (!template)
				{
					this.#logger.warn('setFilledPlaceholder: current template is not set', { payload });

					return;
				}

				const isPlaceholderExists = template.PLACEHOLDERS[POSITION].includes(filledPlaceholder.PLACEHOLDER_ID);
				if (!isPlaceholderExists)
				{
					this.#logger.warn(
						'setFilledPlaceholder: filledPlaceholder.PLACEHOLDER_ID references non-existent placeholder',
						{
							payload,
						},
					);

					return;
				}

				store.commit('upsertFilledPlaceholder', {
					contextId: store.getters.cacheContextId,
					templateOriginalId: template.ORIGINAL_ID,
					filledPlaceholder: makeFrozenClone(filledPlaceholder),
				});

				this.saveState(store.state);
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<TemplatesState>
	{
		return {
			addTemplates: (state, { contextId, templates }) => {
				state.collection[contextId] = templates;
			},
			clearCollection: (state) => {
				state.collection = {};
			},
			select: (state, { channelId, templateOriginalId }) => {
				state.selected[channelId] = templateOriginalId;
			},
			upsertFilledPlaceholder: (state, { contextId, templateOriginalId, filledPlaceholder }) => {
				const templates = state.collection[contextId];

				const template = templates.find((t) => t.ORIGINAL_ID === templateOriginalId);

				template.FILLED_PLACEHOLDERS ??= [];
				template.FILLED_PLACEHOLDERS = template.FILLED_PLACEHOLDERS.filter(
					(fp) => fp.PLACEHOLDER_ID !== filledPlaceholder.PLACEHOLDER_ID,
				);
				template.FILLED_PLACEHOLDERS.push(filledPlaceholder);
			},
		};
	}
}
