import { createNamespacedHelpers } from 'ui.vue3.vuex';
import { EventEmitter } from 'main.core.events';
import { Runtime } from 'main.core';
import { EventName, Model } from 'booking.const';
import { ButtonSize, ButtonColor, Button } from 'booking.component.button';
import { yandexIntegrationWizardService } from 'booking.provider.service.yandex-integration-wizard-service';

import { DeactivateConfirmation } from './deactivate-confirmation';

import './deactivate-button.css';

const { mapGetters, mapActions } = createNamespacedHelpers(Model.YandexIntegrationWizard);

// @vue/component
export const YandexIntegrationWizardDeactivateButton = {
	name: 'YandexIntegrationWizardDeactivateButton',
	components: {
		UiButton: Button,
	},
	setup(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
		};
	},
	computed: {
		...mapGetters(['isConnected']),
	},
	methods: {
		...mapActions(['setFetching']),
		async showDeactivateConfirmation(): void
		{
			const isDeactivationConfirmed = await DeactivateConfirmation.confirm();
			if (!isDeactivationConfirmed)
			{
				return;
			}

			await this.deactivateIntegration();
		},
		async deactivateIntegration(): void
		{
			this.setFetching(true);

			try
			{
				await yandexIntegrationWizardService.deactivateIntegration();
				EventEmitter.emit(EventName.CloseYandexIntegrationWizard);
			}
			catch (error)
			{
				console.error('Deactivate integration error', error);

				const { Notifier } = await Runtime.loadExtension('ui.notification-manager');

				Notifier.notifyViaBrowserProvider({
					id: 'booking-yiw-update-error',
					text: this.loc('YANDEX_WIZARD_UPDATE_ERROR'),
				});
			}
			finally
			{
				this.setFetching(false);
			}
		},
	},
	template: `
		<div v-if="isConnected" class="booking-yiw__deactivate-button_container">
			<UiButton
				class="booking-yiw__deactivate-button"
				:text="loc('YANDEX_WIZARD_DEACTIVATE_BUTTON')"
				noCaps
				@click="showDeactivateConfirmation()"
			/>
		</div>
	`,
};
