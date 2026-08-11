import { Runtime, Type } from 'main.core';
import { type FilledPlaceholder, getPlainText } from 'messageservice.template.editor';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';
import { type Channel } from '../editor';
import { type Logger } from '../service/logger';
import { makeFrozenClone } from './helpers';

type TemplatesState = {
	collection: { [channelId: string]: Template[] },
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
				const chan: ?Channel = rootGetters['channels/current'];
				if (!chan?.isTemplatesBased)
				{
					return [];
				}

				return state.collection[chan.id] ?? [];
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
			/** @function templates/body */
			body: (state, getters): string => {
				const template: ?Template = getters.current;
				if (!template)
				{
					return '';
				}

				// todo position
				// todo tight coupling with template editor
				return getPlainText(
					template.PREVIEW,
					template.PLACEHOLDERS?.PREVIEW ?? [],
					template.FILLED_PLACEHOLDERS ?? [],
				);
			},
			shouldLoad: (state, getters, rootState, rootGetters): boolean => {
				const chan: ?Channel = rootGetters['channels/current'];
				if (!chan || !chan.isTemplatesBased)
				{
					return false;
				}

				return !Object.hasOwn(state.collection, chan.id);
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

				store.commit('addTemplates', {
					channelId: store.rootGetters['channels/current']?.id,
					templates: Runtime.clone(templates),
				});
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
					channelId: store.rootGetters['channels/current']?.id,
					templateOriginalId: template.ORIGINAL_ID,
					filledPlaceholder: makeFrozenClone(filledPlaceholder),
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<TemplatesState>
	{
		return {
			addTemplates: (state, { channelId, templates }) => {
				state.collection[channelId] = templates;
			},
			select: (state, { channelId, templateOriginalId }) => {
				state.selected[channelId] = templateOriginalId;
			},
			upsertFilledPlaceholder: (state, { channelId, templateOriginalId, filledPlaceholder }) => {
				const templates = state.collection[channelId];

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
