/* eslint-disable no-param-reassign */
import { BuilderModel } from 'ui.vue3.vuex';
import { YandexCabinetIdExtractor } from 'booking.provider.service.yandex-integration-wizard-service';
import { IntegrationMapItemStatus, Model } from 'booking.const';
import { ResourceModel } from 'booking.model.resources';

import type { ActionTree, GetterTree, MutationTree } from 'ui.vue3.vuex';
import type {
	YandexIntegrationModel,
	YandexIntegrationSettings,
	YandexIntegrationWizardState,
	setCabinetLinkPayload,
	setResourcesPayload,
	setTimezonePayload,
} from './types';

import { getEmptyIntegration } from './lib';

export class YandexIntegrationWizardModel extends BuilderModel
{
	getName(): string
	{
		return Model.YandexIntegrationWizard;
	}

	getState(): YandexIntegrationWizardState
	{
		return {
			integration: getEmptyIntegration(),
			resources: [],
			cabinetLink: '',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			hasInvalidCabinetLink: false,
			hasInvalidResources: false,

			wasTimezoneChanged: false,
			wasResourcesChanged: false,
			wasCabinetLinkChanged: false,

			isFetching: false,
			isLoaded: false,
		};
	}

	getGetters(): GetterTree<YandexIntegrationWizardState, any>
	{
		return {
			/** @function yandex-integration-wizard/getUpdatedIntegration */
			getUpdatedIntegration: (state): YandexIntegrationModel => {
				const resources = state.resources.filter(({ skusYandex }) => skusYandex.length > 0);

				return {
					...state.integration,
					resources,
					cabinetLink: state.cabinetLink,
					timezone: state.timezone,
				};
			},
			/** @function yandex-integration-wizard/getIntegrationSettings */
			getIntegrationSettings: (state): YandexIntegrationSettings => {
				return state.integration.settings;
			},
			/** @function yandex-integration-wizard/isConnected */
			isConnected: (state): YandexIntegrationModel => {
				return [
					IntegrationMapItemStatus.CONNECTED,
					IntegrationMapItemStatus.IN_PROGRESS,
				].includes(state.integration.status);
			},
			/** @function yandex-integration-wizard/getResources */
			getResources: (state): ResourceModel[] => state.resources,
			/** @function yandex-integration-wizard/getCabinetLink */
			getCabinetLink: (state): string => state.cabinetLink,
			/** @function yandex-integration-wizard/getTimezone */
			getTimezone: (state): string => state.timezone,
			/** @function yandex-integration-wizard/hasInvalidCabinetLink */
			hasInvalidCabinetLink: (state): boolean => state.hasInvalidCabinetLink,
			/** @function yandex-integration-wizard/hasInvalidResources */
			hasInvalidResources: (state): boolean => state.hasInvalidResources,
			/** @function yandex-integration-wizard/wasChanged */
			hasFormDataChanges: (state): boolean => {
				return state.wasTimezoneChanged || state.wasResourcesChanged || state.wasCabinetLinkChanged;
			},
			/** @function yandex-integration-wizard/isFetching */
			isFetching: (state): boolean => state.isFetching,
			/** @function yandex-integration-wizard/isLoaded */
			isLoaded: (state): boolean => state.isLoaded,
			/** @function yandex-integration-wizard/hasInvalidFormData */
			isFormDataValid: (state, getters) => {
				return getters.isCabinetLinkValid
					&& getters.isResourcesValid
					&& getters.isTimezoneValid;
			},
			/** @function yandex-integration-wizard/isTimezoneValid */
			isTimezoneValid: (state): boolean => {
				return (state.timezone !== '');
			},
			/** @function yandex-integration-wizard/isCabinetLinkValid */
			isCabinetLinkValid: (state): boolean => {
				const pattern = YandexCabinetIdExtractor.cabinetLinkPattern;

				return pattern.test(state.cabinetLink);
			},
			/** @function yandex-integration-wizard/isResourcesValid */
			isResourcesValid: (state): boolean => {
				const hasInvalidResource = state.resources.every(
					({ skusYandex }) => (skusYandex.length === 0),
				);

				return (state.resources.length > 0) && !hasInvalidResource;
			},
		};
	}

	getActions(): ActionTree<YandexIntegrationWizardState, any>
	{
		return {
			/** @function yandex-integration-wizard/setIntegration */
			setIntegration({ commit }, integration: YandexIntegrationModel): void
			{
				commit('setIntegration', integration);
			},
			/** @function yandex-integration-wizard/setTimezone */
			setTimezone({ commit, state }, { timezone, skipCalculateChanges = false }: setTimezonePayload): void
			{
				if (!skipCalculateChanges)
				{
					commit('wasTimezoneChanged', timezone !== state.integration.timezone);
				}

				commit('setTimezone', timezone);
			},
			/** @function yandex-integration-wizard/setResources */
			setResources({ commit, state }, { resources, skipCalculateChanges = false }: setResourcesPayload): void
			{
				if (!skipCalculateChanges)
				{
					// For optimization, consider any changes to be different from the current value
					commit('wasResourcesChanged', true);
				}

				commit('setResources', resources);
			},
			/** @function yandex-integration-wizard/setCabinetLink */
			setCabinetLink({ commit, state }, { link, skipCalculateChanges = false }: setCabinetLinkPayload): void
			{
				if (!skipCalculateChanges)
				{
					commit('wasCabinetLinkChanged', link !== state.integration.cabinetLink);
				}

				commit('setCabinetLink', link);
			},
			/** @function yandex-integration-wizard/setStatus */
			setStatus({ commit }, status: $Values<IntegrationMapItemStatus>): void
			{
				commit('setStatus', status);
			},
			/** @function yandex-integration-wizard/setResourceSkuRelationsSaved */
			setResourceSkuRelationsSaved({ commit }, isSaved: boolean): void
			{
				commit('setResourceSkuRelationsSaved', isSaved);
			},
			/** @function yandex-integration-wizard/setInvalidCabinetLink */
			setInvalidCabinetLink({ commit }, isInvalid: boolean): void
			{
				commit('setInvalidCabinetLink', isInvalid);
			},
			/** @function yandex-integration-wizard/setInvalidResources */
			setInvalidResources({ commit }, isInvalid: boolean): void
			{
				commit('setInvalidResources', isInvalid);
			},
			/** @function yandex-integration-wizard/setFetching */
			setFetching({ commit }, isFetching: boolean): void
			{
				commit('setFetching', isFetching);
			},
			/** @function yandex-integration-wizard/setLoaded */
			setLoaded({ commit }, isLoaded: boolean): void
			{
				commit('setLoaded', isLoaded);
			},
			/** @function yandex-integration-wizard/updateResourcesSkusYandex */
			updateResourcesSkusYandex({ commit }, resources: any[]): void
			{
				// For optimization, consider any changes to be different from the current value
				commit('wasResourcesChanged', true);
				commit('updateResourcesSkusYandex', resources);
			},
			/** @function yandex-integration-wizard/validateFormData */
			validateFormData({ dispatch }): void
			{
				dispatch('validateCabinetLink');
				dispatch('validateResources');
			},
			/** @function yandex-integration-wizard/validateCabinetLink */
			validateCabinetLink({ commit, getters }): void
			{
				commit('setInvalidCabinetLink', !getters.isCabinetLinkValid);
			},
			/** @function yandex-integration-wizard/validateResources */
			validateResources({ commit, getters }): void
			{
				commit('setInvalidCabinetLink', !getters.isResourcesValid);
			},
			resetFormDataChanges({ commit }): void
			{
				commit('resetFormDataChanges');
			},
		};
	}

	getMutations(): MutationTree<YandexIntegrationWizardState>
	{
		return {
			setIntegration(state: YandexIntegrationWizardState, integration: YandexIntegrationModel): void
			{
				state.integration = integration;
			},
			setResources(state: YandexIntegrationWizardState, resources: ResourceModel[]): void
			{
				state.resources = resources;
			},
			setCabinetLink(state: YandexIntegrationWizardState, link: string): void
			{
				state.cabinetLink = link;
			},
			setTimezone(state: YandexIntegrationWizardState, timezone: string): void
			{
				state.timezone = timezone;
			},
			setStatus(state: YandexIntegrationWizardState, status: $Values<IntegrationMapItemStatus>): void
			{
				state.integration.status = status;
			},
			setResourceSkuRelationsSaved(state: YandexIntegrationWizardState, isSaved: boolean): void
			{
				state.integration.isResourceSkuRelationsSaved = isSaved;
			},
			setInvalidCabinetLink(state: YandexIntegrationWizardState, isInvalid: boolean): void
			{
				state.hasInvalidCabinetLink = isInvalid;
			},
			setInvalidResources(state: YandexIntegrationWizardState, isInvalid: boolean): void
			{
				state.hasInvalidResources = isInvalid;
			},
			wasTimezoneChanged(state: YandexIntegrationWizardState, wasChanged: boolean): void
			{
				state.wasTimezoneChanged = wasChanged;
			},
			wasResourcesChanged(state: YandexIntegrationWizardState, wasChanged: boolean): void
			{
				state.wasResourcesChanged = wasChanged;
			},
			wasCabinetLinkChanged(state: YandexIntegrationWizardState, wasChanged: boolean): void
			{
				state.wasCabinetLinkChanged = wasChanged;
			},
			setFetching(state: YandexIntegrationWizardState, isFetching: boolean): void
			{
				state.isFetching = isFetching;
			},
			setLoaded(state: YandexIntegrationWizardState, isLoaded: boolean): void
			{
				state.isLoaded = isLoaded;
			},
			updateResourcesSkusYandex(state: YandexIntegrationWizardState, resources: any[]): void
			{
				const newResourcesIds = new Set(resources.map(({ id }) => id));
				const stateResources = state.resources.filter(({ id }) => newResourcesIds.has(id));

				for (const resource of resources)
				{
					const stateResource = stateResources.find(({ id }) => id === resource.id);
					if (stateResource)
					{
						stateResource.skusYandex = resource.skusYandex;
					}
					else
					{
						stateResources.push(resource);
					}
				}

				state.resources = stateResources;
			},
			resetFormDataChanges(state: YandexIntegrationWizardState): void
			{
				state.wasTimezoneChanged = false;
				state.wasResourcesChanged = false;
				state.wasCabinetLinkChanged = false;
			},
		};
	}
}
