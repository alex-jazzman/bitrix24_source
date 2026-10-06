import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BuilderModel, type ActionTree, type GetterTree, type MutationTree } from 'ui.vue3.vuex';

import { Layout, EventType } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';

import { SettingsModel } from './nested-modules/settings/settings';
import { TariffRestrictionsModel } from './nested-modules/tariff-restrictions/tariff-restrictions';
import { type Layout as ImModelLayout } from '../type/layout';

type ApplicationState = { layout: ImModelLayout };

export class ApplicationModel extends BuilderModel
{
	getName(): string
	{
		return 'application';
	}

	getNestedModules(): { [moduleName: string]: BuilderModel }
	{
		return {
			settings: SettingsModel,
			tariffRestrictions: TariffRestrictionsModel,
		};
	}

	getState(): ApplicationState
	{
		return {
			layout: {
				name: Layout.chat,
				entityId: '',
				contextId: 0,
				params: {},
			},
		};
	}

	getGetters(): GetterTree
	{
		return {
			/** @function application/getLayout */
			getLayout: (state): ImModelLayout => {
				return state.layout;
			},
			/** @function application/isChatOpen */
			isChatOpen: (state) => (dialogId: string): boolean => {
				if (!LayoutManager.getInstance().isChatLayout(state.layout.name))
				{
					return false;
				}

				return state.layout.entityId === dialogId.toString();
			},
			isLinesChatOpen: (state) => (dialogId: string): boolean => {
				if (state.layout.name !== Layout.openlines && state.layout.name !== Layout.openlinesV2)
				{
					return false;
				}

				return state.layout.entityId === dialogId.toString();
			},
			/** @function application/areNotificationsOpen */
			areNotificationsOpen: (state) => {
				return state.layout.name === Layout.notification;
			},
		};
	}

	getActions(): ActionTree
	{
		return {
			/** @function application/setLayout */
			setLayout: (store, payload: Partial<ImModelLayout>) => {
				const { name, entityId = '', contextId = 0, params = {} } = payload;
				if (!Type.isStringFilled(name))
				{
					return;
				}

				const previousLayout = { ...store.state.layout };

				const newLayout = {
					name: this.validateLayout(name),
					entityId,
					contextId,
					params,
				};

				if (this.#isSameLayout(previousLayout, newLayout))
				{
					newLayout.params = { ...previousLayout.params, ...newLayout.params };
				}

				EventEmitter.emit(EventType.layout.onLayoutChange, {
					from: previousLayout,
					to: newLayout,
				});

				if (this.#isSameLayoutPayload(previousLayout, newLayout))
				{
					return;
				}

				store.commit('updateLayout', {
					layout: newLayout,
				});
			},
		};
	}

	/* eslint-disable no-param-reassign */
	getMutations(): MutationTree
	{
		return {
			updateLayout: (state, payload) => {
				state.layout = { ...state.layout, ...payload.layout };
			},
		};
	}

	validateLayout(name: string): string
	{
		if (!LayoutManager.getInstance().isValidLayout(name))
		{
			return Layout.chat;
		}

		return name;
	}

	#isSameLayoutPayload(previousLayout: ImModelLayout, newLayout: ImModelLayout): boolean
	{
		return this.#isSameLayout(previousLayout, newLayout)
			&& previousLayout.entityId === newLayout.entityId
			&& JSON.stringify(previousLayout.params) === JSON.stringify(newLayout.params);
	}

	#isSameLayout(previousLayout: ImModelLayout, newLayout: ImModelLayout): boolean
	{
		return previousLayout.name === newLayout.name;
	}
}
