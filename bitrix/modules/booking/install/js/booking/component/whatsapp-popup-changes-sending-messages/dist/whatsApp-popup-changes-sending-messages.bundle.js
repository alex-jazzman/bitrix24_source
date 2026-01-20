/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports,ui_vue3_components_button,ui_vue3_vuex,booking_const,booking_component_popup,booking_provider_service_optionService) {
	'use strict';

	// @ vue/component
	const WhatsappPopupChangesSendingMessages = {
	  name: 'WhatsAppPopupChangesSendingMessages',
	  components: {
	    Popup: booking_component_popup.Popup,
	    UiButton: ui_vue3_components_button.Button
	  },
	  setup() {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      shouldShowWhatsAppEmergency: `${booking_const.Model.Interface}/shouldShowWhatsAppEmergency`
	    }),
	    popupId() {
	      return 'booking-whatsapp-changes-sending-messages';
	    },
	    config() {
	      return {
	        width: 590,
	        closeIcon: true,
	        overlay: true,
	        padding: 24,
	        className: 'booking-whatsapp-changes-sending-messages',
	        events: {
	          onPopupAfterClose: async () => {
	            await this.closePopup();
	          }
	        }
	      };
	    },
	    title() {
	      return this.loc('BOOKING_WHATSAPP_CHANGES_SENDING_TITLE');
	    },
	    description() {
	      return this.loc('BOOKING_WHATSAPP_CHANGES_SENDING_DESCRIPTION');
	    }
	  },
	  methods: {
	    async closePopup() {
	      await Promise.all([this.$store.dispatch(`${booking_const.Model.Interface}/setShouldShowWhatsAppEmergency`, !this.shouldShowWhatsAppEmergency), booking_provider_service_optionService.optionService.setBool(booking_const.Option.whatsAppEmergencyNotified, !this.shouldShowWhatsAppEmergency)]);
	    }
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
	`
	};

	exports.WhatsappPopupChangesSendingMessages = WhatsappPopupChangesSendingMessages;

}((this.BX.Booking.Component = this.BX.Booking.Component || {}),BX.Vue3.Components,BX.Vue3.Vuex,BX.Booking.Const,BX.Booking.Component,BX.Booking.Provider.Service));
//# sourceMappingURL=whatsApp-popup-changes-sending-messages.bundle.js.map
