import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName, Model } from 'booking.const';
import { yandexIntegrationWizardService } from 'booking.provider.service.yandex-integration-wizard-service';

import { ConfirmButton } from './confirm-button';
import { CancelButton } from './cancel-button';

import './footer.css';

const { mapGetters, mapActions } = createNamespacedHelpers(Model.YandexIntegrationWizard);

// @vue/component
export const YandexIntegrationWizardLayoutFooter = {
	name: 'YandexIntegrationWizardLayoutFooter',
	components: {
		ConfirmButton,
		CancelButton,
	},
	computed: {
		...mapGetters({
			isFetching: 'isFetching',
			isConnected: 'isConnected',
			hasChanges: 'hasFormDataChanges',
			updatedIntegration: 'getUpdatedIntegration',
			isFormDataValid: 'isFormDataValid',
		}),
		confirmButtonText(): string
		{
			return this.isConnected
				? this.loc('YANDEX_WIZARD_FOOTER_SAVE_BUTTON')
				: this.loc('YANDEX_WIZARD_FOOTER_СONNECT_BUTTON');
		},
	},
	methods: {
		...mapActions([
			'setFetching',
			'validateFormData',
		]),
		async onConfirmButtonClick(): void
		{
			await this.validateFormData();

			if (this.isFormDataValid)
			{
				await this.updateIntegration();
			}
		},
		async updateIntegration(): void
		{
			this.setFetching(true);

			const wasConnected = this.isConnected;
			const updateIntegrationResult = await yandexIntegrationWizardService.updateIntegration(
				this.updatedIntegration
			);

			if (!updateIntegrationResult.success)
			{
				const publicError = updateIntegrationResult.errors.find((errorItem) => errorItem.customData.isPublic);
				const { Notifier } = await Runtime.loadExtension('ui.notification-manager');

				Notifier.notifyViaBrowserProvider({
					id: 'booking-yiw-update-error',
					text: publicError?.message || this.loc('YANDEX_WIZARD_UPDATE_ERROR'),
				});

				this.setFetching(false);

				return;
			}

			if (this.isConnected && !wasConnected)
			{
				await this.showConfetti();
			}

			this.closeWizard();
			this.setFetching(false);
		},
		closeWizard(): void
		{
			EventEmitter.emit(EventName.CloseYandexIntegrationWizard);
		},
		async showConfetti(): Promise<void>
		{
			const { Confetti } = await Runtime.loadExtension('ui.confetti');

			return Confetti.fire({
				particleCount: 400,
				spread: 100,
				zIndex: (BX.SidePanel.Instance.getTopSlider().getZindex() + 1),
				origin: {
					y: 0.75,
					x: 0.75,
				},
			});
		},
	},
	template: `
		<div
			v-show="!isFetching && (!isConnected || hasChanges)"
			class="booking-yiw__footer"
		>
			<ConfirmButton
				:buttonText="confirmButtonText"
				:disabled="!isFormDataValid"
				@click="onConfirmButtonClick()"
			/>
			<CancelButton @click="closeWizard()"/>
		</div>
	`,
};
