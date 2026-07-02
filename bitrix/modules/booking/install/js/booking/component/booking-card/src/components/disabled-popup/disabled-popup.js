import { Event } from 'main.core';
import { Popup } from 'booking.component.popup';

import './disabled-popup.css';

// @vue/component
export const DisabledPopup = {
	name: 'BookingCardDisabledPopup',
	components: {
		Popup,
	},
	props: {
		popupId: {
			type: String,
			required: true,
		},
		bindElement: {
			type: Function,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		config(): PopupOptions
		{
			return {
				className: 'booking-booking-disabled-popup',
				bindElement: this.bindElement(),
				width: this.bindElement().offsetWidth,
				offsetTop: -10,
				bindOptions: {
					forceBindPosition: true,
					position: 'top',
				},
				autoHide: true,
				darkMode: true,
			};
		},
	},
	mounted(): void
	{
		this.adjustPosition();
		setTimeout(() => this.closePopup(), 3000);
		Event.bind(document, 'scroll', this.adjustPosition, true);
	},
	beforeUnmount(): void
	{
		Event.unbind(document, 'scroll', this.adjustPosition, true);
	},
	methods: {
		adjustPosition(): void
		{
			this.$refs.popup.adjustPosition();
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Popup
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-card__disabled-popup_content">
				{{ loc('BOOKING_BOOKING_YOU_CANNOT_EDIT_THIS_BOOKING') }}
			</div>
		</Popup>
	`,
};
