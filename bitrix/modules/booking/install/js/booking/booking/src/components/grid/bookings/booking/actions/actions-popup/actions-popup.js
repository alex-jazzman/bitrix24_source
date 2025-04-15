// @vue/component

import { ActionsPopup, FullForm } from 'booking.component.actions-popup';
import type { PopupMakerItem, PopupOptions } from 'booking.component.actions-popup';
import type { BookingModel } from 'booking.model.bookings';

import { BookingClient } from './client/client';
import { BookingDeal } from './deal/deal';
import { BookingDocument } from './document/document';
import { BookingMessage } from './message/message';
import { BookingConfirmation } from './confirmation/confirmation';
import { BookingVisit } from './visit/visit';
import { Overbooking } from './overbooking/overbooking';
import { Waitlist } from './waitlist/waitlist';
import { BookingRemoveBtn } from './remove-btn/remove-btn';
import { ActionsPopupActionEnum } from './model';
import type { ActionsPopupOptions } from './types';

export type { ActionsPopupOptions };

type ActionsPopupData = {
	soonTmp: boolean,
};

export const BookingActionsPopup = {
	name: 'BookingActionsPopup',
	emits: ['close'],
	props: {
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		bookingId: {
			type: [Number, String],
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
		/**
		 * @type ActionsPopupOptions
		 */
		options: {
			type: Object,
			default: null,
		},
	},
	data(): ActionsPopupData
	{
		return {
			soonTmp: false,
		};
	},
	computed: {
		config(): PopupOptions
		{
			return {
				offsetLeft: this.bindElement.offsetWidth,
				offsetTop: -200,
			};
		},
		contentStructure(): Array<PopupMakerItem | Array<PopupMakerItem>>
		{
			return [
				{
					id: ActionsPopupActionEnum.client,
					props: {
						bookingId: this.bookingId,
					},
					component: BookingClient,
				},
				[
					{
						id: ActionsPopupActionEnum.deal,
						props: {
							bookingId: this.bookingId,
						},
						component: BookingDeal,
					},
					{
						id: ActionsPopupActionEnum.document,
						props: {
							bookingId: this.bookingId,
						},
						component: BookingDocument,
					},
				],
				{
					id: ActionsPopupActionEnum.message,
					props: {
						bookingId: this.bookingId,
					},
					component: BookingMessage,
				},
				{
					id: ActionsPopupActionEnum.confirmation,
					props: {
						bookingId: this.bookingId,
					},
					component: BookingConfirmation,
				},
				{
					id: ActionsPopupActionEnum.visit,
					props: {
						bookingId: this.bookingId,
					},
					component: BookingVisit,
				},
				{
					id: ActionsPopupActionEnum.fullForm,
					props: {
						bookingId: this.bookingId,
					},
					component: FullForm,
				},
			];
		},
		booking(): BookingModel
		{
			return this.$store.getters['bookings/getById'](this.bookingId);
		},
	},
	components: {
		ActionsPopup,
		BookingClient,
		BookingDeal,
		BookingDocument,
		BookingMessage,
		BookingConfirmation,
		BookingVisit,
		FullForm,
		Overbooking,
		Waitlist,
		BookingRemoveBtn,
	},
	template: `
		<ActionsPopup
			:popupId="bookingId"
			:bindElement="bindElement"
			:contentStructure="contentStructure"
			:popupOptions="config"
			@close="$emit('close')"
		>
			<template #footer>
				<Overbooking
					v-if="!options?.overbooking?.hidden"
					:bookingId
					:resourceId
					:disabled="Boolean(options?.overbooking?.disabled)"
					@close="$emit('close')"
				/>
				<template v-if="soonTmp">
					<Waitlist :bookingId/>
				</template>
				<BookingRemoveBtn :bookingId @close="$emit('close')"/>
			</template>
		</ActionsPopup>
	`,
};
