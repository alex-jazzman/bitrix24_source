import { mapGetters } from 'ui.vue3.vuex';

import { DateTimeFormat } from 'main.date';
import { Model } from 'booking.const';
import { Popup } from 'booking.component.popup';
import { Utils } from 'booking.lib.utils';

import type { PopupOptions } from 'main.popup';

import './preview-popup.css';

// @vue/component
export const BookingPreviewPopup = {
	name: 'BookingPreviewPopup',
	components: {
		Popup,
	},
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		bookingId: {
			type: [Number, String],
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		dateFromTs: {
			type: Number,
			required: true,
		},
		dateToTs: {
			type: Number,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			offset: `${Model.Interface}/offset`,
		}),
		popupId(): string
		{
			return `booking-preview-popup-${this.bookingId}`;
		},
		dateFormatted(): string
		{
			const dateFormat = DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT');
			const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

			const fromSeconds = (this.dateFromTs + this.offset) / 1000;
			const toSeconds = (this.dateToTs + this.offset) / 1000;

			const dateFrom = DateTimeFormat.format(dateFormat, fromSeconds);
			const timeFrom = DateTimeFormat.format(timeFormat, fromSeconds);
			const timeTo = DateTimeFormat.format(timeFormat, toSeconds);

			if (this.isSameDay)
			{
				return this.loc('BOOKING_BOOKING_PREVIEW_POPUP_SAME_DAY', {
					'#DATE#': dateFrom,
					'#TIME_FROM#': timeFrom,
					'#TIME_TO#': timeTo,
				});
			}

			const dateTo = DateTimeFormat.format(
				dateFormat,
				(this.dateToTs + this.offset) / 1000,
			);

			return this.loc('BOOKING_BOOKING_PREVIEW_POPUP_DIFF_DAY', {
				'#DATE_FROM#': dateFrom,
				'#TIME_FROM#': timeFrom,
				'#DATE_TO#': dateTo,
				'#TIME_TO#': timeTo,
			});
		},
		config(): PopupOptions
		{
			return {
				className: 'booking-preview-popup-container',
				bindElement: this.bindElement,
				minWidth: 170,
				offsetTop: 0,
				offsetLeft: this.bindElement.getBoundingClientRect().width / 2,
				background: '#2878ca',
				padding: 0,
				bindOptions: {
					forceBindPosition: true,
					position: 'bottom',
				},
				angle: {
					position: 'top',
				},
				angleBorderRadius: 'var(--ui-border-radius-2xs) 0',
				autoHide: false,
				closeByEsc: false,
			};
		},
		isSameDay(): boolean
		{
			return Utils.time.isSameDay(this.dateFromTs, this.dateToTs, this.offset);
		},
	},
	template: `
		<Popup
			:id="popupId"
			:config="config"
		>
			<div class="booking-preview-popup">
				<div class="booking-preview-popup__client">{{ title }}</div>
				<div class="booking-preview-popup__date">{{ dateFormatted }}</div>
			</div>
		</Popup>
	`,
};
