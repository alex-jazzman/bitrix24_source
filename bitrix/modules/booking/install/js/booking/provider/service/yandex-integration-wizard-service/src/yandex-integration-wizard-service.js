import type { Store } from 'ui.vue3.vuex';

import { IntegrationMapItemCode, Model } from 'booking.const';
import { Core } from 'booking.core';
import { apiClient } from 'booking.lib.api-client';
import type { YandexIntegrationModel } from 'booking.model.yandex-integration-wizard';

import { mapDtoToModel, mapModelToDto } from './mappers';

class YandexIntegrationWizardService
{
	async loadData(): Promise<void>
	{
		try
		{
			const dto = await apiClient.post('YandexIntegration.getConfiguration', {});
			const model: YandexIntegrationModel = mapDtoToModel(dto);

			const wizardModel = Model.YandexIntegrationWizard;

			const actions: Promise<void>[] = [
				this.$store.dispatch(`${wizardModel}/setIntegration`, model),
				this.$store.dispatch(`${wizardModel}/setLoaded`, true),
				this.$store.dispatch(`${wizardModel}/setResources`, {
					resources: model.resources,
					skipCalculateChanges: true,
				}),
			];

			// only if were saved before
			if (model.isResourceSkuRelationsSaved)
			{
				actions.push(
					this.$store.dispatch(`${wizardModel}/setCabinetLink`, {
						link: model.cabinetLink,
						skipCalculateChanges: true,
					}),
					this.$store.dispatch(`${wizardModel}/setTimezone`, {
						timezone: model.timezone,
						skipCalculateChanges: true,
					}),
				);
			}

			const results = await Promise.allSettled(actions);
			const resultsRejected = results.filter((result) => result.status === 'rejected');
			const errorMessages = resultsRejected.map((result) => result.reason.message);

			if (errorMessages.length > 0)
			{
				console.error('YandexIntegrationWizardService loadData store errorMessages:', errorMessages);

				return {
					success: false,
					model,
					errorMessages,
				};
			}

			return {
				success: true,
				model,
			};
		}
		catch (apiError)
		{
			console.error('YandexIntegrationWizardService loadData API apiError:', apiError);
			const errorMessage = `API call failed: ${apiError.message}`;

			return {
				success: false,
				errorMessages: [errorMessage],
			};
		}
	}

	async updateIntegration(model: YandexIntegrationModel): Promise<void>
	{
		const configuration = await mapModelToDto(model);
		const updatedModel: YandexIntegrationModel = await apiClient.post(
			'YandexIntegration.saveConfiguration',
			{ configuration },
		);

		const yiwModel = Model.YandexIntegrationWizard;

		await Promise.all([
			this.$store.dispatch(`${yiwModel}/setIntegration`, updatedModel),
			this.$store.dispatch(`${yiwModel}/setStatus`, updatedModel.status),
			this.$store.dispatch(`${Model.SaleChannels}/setIntegrationStatus`, {
				code: IntegrationMapItemCode.YANDEX,
				status: updatedModel.status,
			}),
			this.$store.dispatch(`${yiwModel}/setResourceSkuRelationsSaved`, true),
			this.$store.dispatch(`${yiwModel}/resetFormDataChanges`),
		]);
	}

	async deactivateIntegration(): Promise<void>
	{
		const updatedModel: YandexIntegrationModel = await apiClient.post(
			'YandexIntegration.deactivate',
			{},
		);

		await Promise.all([
			this.$store.dispatch(
				`${Model.YandexIntegrationWizard}/setStatus`,
				updatedModel.status,
			),
			this.$store.dispatch(`${Model.SaleChannels}/setIntegrationStatus`, {
				code: IntegrationMapItemCode.YANDEX,
				status: updatedModel.status,
			}),
		]);
	}

	async dropCounterIntegration(): Promise<void>
	{
		try
		{
			const responseDropCounter = await apiClient.post('YandexIntegration.dropCounter', {});

			return {
				success: true,
				responseDropCounter,
			};
		}
		catch (apiError)
		{
			console.error('YandexIntegrationWizardService dropCounterIntegration API apiError:', apiError);
			const errorMessage = `API call failed: ${apiError.message}`;

			return {
				success: false,
				errorMessages: [errorMessage],
			};
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const yandexIntegrationWizardService = new YandexIntegrationWizardService();
