import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { Core } from 'booking.core';
import { mainPageService } from 'booking.provider.service.main-page-service';
import { yandexIntegrationWizardService } from 'booking.provider.service.yandex-integration-wizard-service';

import { YandexIntegrationWizardLayout } from './layout/layout';
import { YandexIntegrationWizardLayoutHeader } from './header/yandex-header';
import { YandexIntegrationWizardLayoutFooter } from './footer/footer';
import { YandexIntegrationWizardSettingsResource } from './settings-resource/settings-resource';
import { YandexIntegrationWizardCabinetLink } from './cabinet-link/cabinet-link';
import { YandexIntegrationWizardTimeZone } from './timezone/timezone';
import { YandexIntegrationWizardDeactivateButton } from './deactivate-button/deactivate-button';

const { mapGetters, mapActions } = createNamespacedHelpers(Model.YandexIntegrationWizard);

// @vue/component
export const App = {
	name: 'YandexIntegrationWizardApp',
	components: {
		YandexIntegrationWizardLayout,
		YandexIntegrationWizardLayoutHeader,
		YandexIntegrationWizardLayoutFooter,
		YandexIntegrationWizardCabinetLink,
		YandexIntegrationWizardSettingsResource,
		YandexIntegrationWizardTimeZone,
		YandexIntegrationWizardDeactivateButton,
	},
	computed: {
		...mapGetters(['isLoaded']),
	},
	async beforeMount(): Promise<void>
	{
		await this.loadWizardData();
	},
	methods: {
		...mapActions(['setFetching']),
		async loadWizardData(): Promise<void>
		{
			if (this.isLoaded)
			{
				return;
			}

			try
			{
				this.setFetching(true);

				const responseLoadData = await yandexIntegrationWizardService.loadData();

				if (responseLoadData?.success === true)
				{
					await this.dropCounterIntegration();
				}
			}
			catch (error)
			{
				console.error('Loading wizard data error', error);
			}
			finally
			{
				this.setFetching(false);
			}
		},
		async dropCounterIntegration(): Promise<void>
		{
			const counterMapsYa = Number(Core.getStore()?.state?.counters?.counters?.newYandexMaps);
			if (!counterMapsYa)
			{
				return;
			}

			const responseDropCounter = await yandexIntegrationWizardService.dropCounterIntegration();

			if (responseDropCounter?.success === true)
			{
				await mainPageService.fetchCounters();
			}
		},
	},
	template: `
		<YandexIntegrationWizardLayout>
			<template #header>
				<YandexIntegrationWizardLayoutHeader/>
			</template>

			<YandexIntegrationWizardCabinetLink/>
			<YandexIntegrationWizardSettingsResource/>
			<YandexIntegrationWizardTimeZone/>
			<YandexIntegrationWizardDeactivateButton/>

			<template #footer>
				<YandexIntegrationWizardLayoutFooter/>
			</template>
		</YandexIntegrationWizardLayout>
	`,
};
