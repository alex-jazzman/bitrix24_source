import { mapGetters } from 'ui.vue3.vuex';

import { BookingCard } from 'booking.component.booking-card';
import { Model } from 'booking.const';
import { isRealId } from 'booking.lib.is-real-id';

import { WaitListItemActions } from './actions/actions';
import { WaitListItemAddClient } from './add-client/add-client';
import { WaitListCardDataService } from './lib/card-data/wait-list-card-data-service';

import './wait-list-item.css';

// @vue/component
export const WaitListItem = {
	name: 'WaitListItem',
	components: {
		BookingCard,
		WaitListItemActions,
		WaitListItemAddClient,
	},
	props: {
		/** @type {WaitListItemModel} */
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			editingWaitListItemId: `${Model.Interface}/editingWaitListItemId`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			isWaitListItemCreatedFromEmbed: `${Model.Interface}/isWaitListItemCreatedFromEmbed`,
			animationPause: `${Model.Interface}/animationPause`,
			isMenuOpenedForWaitListItem: `${Model.Interface}/isMenuOpenedForWaitListItem`,
			isWeekMode: `${Model.Interface}/isWeekMode`,
		}),
		cardDataService(): WaitListCardDataService
		{
			return new WaitListCardDataService(this.item.id);
		},
		isReal(): boolean
		{
			return isRealId(this.item.id);
		},
		disabled(): boolean
		{
			return this.isEditingBookingMode && this.editingWaitListItemId !== this.item.id;
		},
		hasAccent(): boolean
		{
			return this.editingWaitListItemId === this.item.id
				|| this.isWaitListItemCreatedFromEmbed(this.item.id)
				|| this.isMenuOpenedForWaitListItem(this.item.id)
			;
		},
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-container');
		},
	},
	template: `
		<BookingCard
			:classes="[
				'booking-wait-list-item',
				{
					'booking--draggable-item': this.isReal,
					'--not-real': !this.isReal,
					'--disabled': disabled,
					'--accent': hasAccent,
					'no-transition': animationPause,
				},
			]"
			:disabled
			:dataAttributes
			:cardDataService
			:isMinimalView="true"
		>
			<template #lower-content-row>
				<div class="booking--wait-list-item--space"></div>
			</template>
			<template #add-client-button>
				<WaitListItemAddClient :cardDataService/>
			</template>
			<template #actions>
				<WaitListItemActions :waitListItem="item"/>
			</template>
		</BookingCard>
	`,
};
