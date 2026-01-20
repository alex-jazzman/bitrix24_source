import { PopupOptions } from 'main.popup';
import { Button as UiButton, ButtonSize, ButtonColor } from 'booking.component.button';
import { Popup } from 'booking.component.popup';

import 'ui.icon-set.actions';

// @vue/component
export const CancelPopup = {
	name: 'CancelPopup',
	components: {
		Popup,
		UiButton,
	},
	props: {
		booking: {
			type: Object,
			required: true,
		},
		showPopup: {
			type: Boolean,
			required: true,

		},
	},
	emits: ['bookingCanceled', 'popupClosed'],
	data(): Object
	{
		return {
			ButtonSize,
			ButtonColor,
			btnWaiting: false,
		};
	},
	computed: {
		popupId(): string
		{
			return `booking-confirm-page-popup-${this.booking.id}`;
		},
		popupConfig(): PopupOptions
		{
			return {
				className: 'booking-confirm-page-popup',
				offsetLeft: 0,
				offsetTop: 0,
				overlay: true,
				borderRadius: '5px',
			};
		},
	},
	watch: {
		booking:
			{
				handler(booking)
				{
					if (booking.isDeleted === true)
					{
						this.btnWaiting = false;
						this.closePopup();
					}
				},
				deep: true,
			},
	},
	methods: {
		cancelBookingHandler(): void
		{
			this.btnWaiting = true;
			this.$emit('bookingCanceled');
		},
		closePopup(): void
		{
			this.$emit('popupClosed');
		},
	},
	template: `
		<Popup
			v-if="showPopup"
			:id="popupId"
			:config="popupConfig"
			@close="closePopup"
		>
			<div class="cancel-booking-popup-content">
				<div class="cancel-booking-popup-content-title">{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_TILE') }}</div>
				<div class="cancel-booking-popup-content-text">{{ loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_TEXT') }}</div>
				<div class="cancel-booking-popup-content-buttons">
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_NO')"
						:size="ButtonSize.EXTRA_SMALL"
						:color="ButtonColor.LIGHT_BORDER"
						:buttonClass="'cancel-booking-popup-content-buttons-no'"
						@click="closePopup"
					/>
					<UiButton
						:text="loc('BOOKING_CONFIRM_PAGE_MESSAGEBOX_BTN_YES')"
						:size="ButtonSize.EXTRA_SMALL"
						:buttonClass="'cancel-booking-popup-content-buttons-yes'"
						:waiting="btnWaiting"
						@click="cancelBookingHandler"
					/>
				</div>
			</div>
		</Popup>
	`,
};
