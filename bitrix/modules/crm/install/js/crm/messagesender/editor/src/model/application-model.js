import { Type } from 'main.core';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import { BuilderModel } from 'ui.vue3.vuex';
import { type ContentProvider, type Layout, type NotificationTemplate, type PromoBanner, type Scene } from '../editor';
import { type Logger } from '../service/logger';
import { makeFrozenClone } from './helpers';

type ApplicationState = {
	context: Readonly<{
		entityTypeId: ?number,
		entityId: ?number,
		categoryId: ?number,
		userId: ?number,
	}>,
	contentProviders: Readonly<{[key: string]: ContentProvider}>,
	notificationTemplate?: Readonly<NotificationTemplate>,
	promoBanners?: Readonly<Array<PromoBanner>>,
	layout: Readonly<Layout>,
	scene: Readonly<Scene>,
	progress: ProgressState,
	alert: AlertState,
};

export type ProgressState = {
	isSending: boolean,
	isLoading: boolean,
};

export type AlertState = {
	error: string,
};

export class ApplicationModel extends BuilderModel
{
	#logger: Logger;

	getName(): string
	{
		return 'application';
	}

	setLogger(logger: Logger): this
	{
		this.#logger = logger;

		return this;
	}

	getState(): ApplicationState
	{
		return {
			context: makeFrozenClone(this.getVariable('context', {})),
			contentProviders: makeFrozenClone(this.getVariable('contentProviders', {})),
			notificationTemplate: makeFrozenClone(this.getVariable('notificationTemplate', null)),
			promoBanners: makeFrozenClone(this.getVariable('promoBanners', null)),
			layout: makeFrozenClone(this.getVariable('layout', {
				isHeaderShown: true,
				isFooterShown: true,
				isSendButtonShown: true,
				isCancelButtonShown: true,
				isMessagePreviewShown: true,
				isContentProvidersShown: true,
				isEmojiButtonShown: true,
				isMessageTextReadOnly: false,
				padding: 'var(--ui-space-inset-lg)',
			})),
			scene: makeFrozenClone(this.getVariable('scene', { id: '' })),
			progress: {
				isSending: false,
				isLoading: false,
			},
			alert: {
				error: '',
			},
		};
	}

	getGetters(): GetterTree<ApplicationState>
	{
		return {
			/** @function application/isProgress */
			isProgress: (state): boolean => {
				for (const value of Object.values(state.progress))
				{
					if (value)
					{
						return true;
					}
				}

				return false;
			},
		};
	}

	getActions(): ActionTree<ApplicationState>
	{
		return {
			/** @function application/actualizeState */
			actualizeState: (store, payload: ApplicationState) => {
				store.commit('actualizeState', makeFrozenClone(payload));
			},
			/** @function application/setProgress */
			setProgress: (store, payload: ProgressState) => {
				const allowedKeys = new Set(['isSending', 'isLoading']);

				const filteredPayload = {};
				for (const key of Object.keys(payload))
				{
					if (allowedKeys.has(key))
					{
						filteredPayload[key] = payload[key];
					}
				}

				for (const [key, value] of Object.entries(filteredPayload))
				{
					if (!Type.isBoolean(value))
					{
						this.#logger.warn(`setProgress: ${key} should be boolean`, { payload });

						return;
					}
				}

				store.commit('updateProgress', {
					progress: filteredPayload,
				});
			},
			/** @function application/setAlert */
			setAlert: (store, payload: { error: string }) => {
				if (!Type.isString(payload.error))
				{
					this.#logger.warn('setError: error should be string', { payload });

					return;
				}

				store.commit('actualizeState', { alert: { error: payload.error } });
			},
			resetAlert: (store) => {
				store.commit('actualizeState', {
					alert: {
						error: '',
					},
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree<ApplicationState>
	{
		return {
			actualizeState: (state, payload) => {
				for (const [key, value] of Object.entries(payload))
				{
					if (key in state)
					{
						state[key] = value;
					}
				}
			},
			updateProgress: (state, payload: {progress: ProgressState}) => {
				state.progress = { ...state.progress, ...payload.progress };
			},
		};
	}
}
