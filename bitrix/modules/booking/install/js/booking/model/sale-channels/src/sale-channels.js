/* eslint-disable no-param-reassign */
import { BuilderModel } from 'ui.vue3.vuex';
import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import type { SaleChannelsState, FormsMenu, IntegrationItem, SetIntegrationStatusPayload } from './types';

export class SaleChannels extends BuilderModel
{
	getName(): string
	{
		return Model.SaleChannels;
	}

	getState(): SaleChannelsState
	{
		return {
			formsMenu: {
				canEdit: false,
				createFormLink: '',
				formsListLink: '',
				formList: [],
			},
			integrations: [],
			isFetching: false,
			isLoaded: false,
		};
	}

	getGetters(): GetterTree<SaleChannelsState, any>
	{
		return {
			/** @function sale-channels/getFormsMenu */
			getFormsMenu: (state): FormsMenu => state.formsMenu,
			/** @function sale-channels/getIntegrations */
			getIntegrations: (state): IntegrationItem[] => state.integrations,
			/** @function sale-channels/isFetching */
			isFetching: (state): boolean => state.isFetching,
			/** @function sale-channels/isLoaded */
			isLoaded: (state): boolean => state.isLoaded,
		};
	}

	getActions(): ActionTree<SaleChannelsState, any>
	{
		return {
			/** @function sale-channels/setFormsMenu */
			setFormsMenu({ commit }, formsMenu: FormsMenu): void
			{
				commit('setFormsMenu', formsMenu);
			},
			/** @function sale-channels/setIntegrations */
			setIntegrations({ commit }, integrations: IntegrationItem[]): void
			{
				commit('setIntegrations', integrations);
			},
			/** @function sale-channels/setIntegrationStatus */
			setIntegrationStatus({ commit }, payload: SetIntegrationStatusPayload): void
			{
				commit('setIntegrationStatus', payload);
			},
			/** @function sale-channels/setFetching */
			setFetching({ commit }, isFetching: boolean): void
			{
				commit('setFetching', isFetching);
			},
			/** @function sale-channels/setLoaded */
			setLoaded({ commit }, isLoaded: boolean): void
			{
				commit('setLoaded', isLoaded);
			},
		};
	}

	getMutations(): MutationTree<SaleChannelsState>
	{
		return {
			setFormsMenu(state: SaleChannelsState, formsMenu: FormsMenu): void
			{
				state.formsMenu = formsMenu;
			},
			setIntegrations(state: SaleChannelsState, integrations: IntegrationItem[]): void
			{
				state.integrations = integrations;
			},
			setIntegrationStatus(state: SaleChannelsState, { code, status }: SetIntegrationStatusPayload): void
			{
				const integrationItem = state.integrations.find(
					(integration: IntegrationItem): boolean => integration.code === code,
				);

				if (integrationItem)
				{
					integrationItem.status = status;
				}
			},
			setFetching(state: SaleChannelsState, isFetching: boolean): void
			{
				state.isFetching = isFetching;
			},
			setLoaded(state: SaleChannelsState, isLoaded: boolean): void
			{
				state.isLoaded = isLoaded;
			},
		};
	}
}
