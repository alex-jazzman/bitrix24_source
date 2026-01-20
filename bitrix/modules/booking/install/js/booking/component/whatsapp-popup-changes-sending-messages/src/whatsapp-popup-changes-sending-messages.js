import type { PopupOptions } from 'main.popup';
import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapGetters } from 'ui.vue3.vuex';

import { Option, Model } from 'booking.const';
import { Popup } from 'booking.component.popup';
import { optionService } from 'booking.provider.service.option-service';

import './style.css';

// @ vue/component
export const WhatsappPopupChangesSendingMessages = {
	name: 'WhatsAppPopupChangesSendingMessages',
	components: {
		Popup,
		UiButton,
	},
	setup(): { ButtonSize: typeof ButtonSize }
	{
		return {
			ButtonSize,
		};
	},
	computed: {
		...mapGetters({
			shouldShowWhatsAppEmergency: `${Model.Interface}/shouldShowWhatsAppEmergency`,
		}),
		popupId(): string
		{
			return 'booking-whatsapp-changes-sending-messages';
		},
		config(): PopupOptions
		{
			return {
				width: 590,
				closeIcon: true,
				overlay: true,
				padding: 24,
				className: 'booking-whatsapp-changes-sending-messages',
				events: {
					onPopupAfterClose: async (): Promise<void> => {
						await this.closePopup();
					},
				},
			};
		},
		title(): string
		{
			return this.loc('BOOKING_WHATSAPP_CHANGES_SENDING_TITLE');
		},
		description(): string
		{
			return this.loc('BOOKING_WHATSAPP_CHANGES_SENDING_DESCRIPTION');
		},
	},
	methods: {
		async closePopup(): Promise<void>
		{
			await Promise.all([
				this.$store.dispatch(`${Model.Interface}/setShouldShowWhatsAppEmergency`, !this.shouldShowWhatsAppEmergency),
				optionService.setBool(Option.whatsAppEmergencyNotified, !this.shouldShowWhatsAppEmergency),
			]);
		},
	},
	template: `
		<Popup
			:id="popupId"
			:config
			ref="popup"
		>
			<div class="booking-whatsapp-csm__wrapper">
				<div class="booking-whatsapp-csm__content">
					<div class="booking-whatsapp-csm__content_title">
						{{ title }}
					</div>
					<div class="booking-whatsapp-csm__content_description">
						{{ description }}
					</div>
					<div class="booking-whatsapp-csm__icon"></div>
				</div>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('BOOKING_WHATSAPP_CHANGES_SENDING_BTN')"
					@click="closePopup"
				/>
			</div>
		</Popup>
	`,
};
