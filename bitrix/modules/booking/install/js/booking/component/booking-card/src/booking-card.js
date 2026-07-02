import { DisabledPopup as BookingCardDisabledPopup } from './components/disabled-popup/disabled-popup';
import { Title as BookingCardTitle } from './components/title/title';
import { Note as BookingCardNote } from './components/note/note';
import { Profit as BookingCardProfit } from './components/profit/profit';
import { Communication as BookingCardCommunication } from './components/communication/communication';
import { CrmButton as BookingCardCrmButton } from './components/crm-button/crm-button';
import { Source as BookingCardSource } from './components/source/source';
import { AddClient as BookingCardAddClient } from './components/add-client/add-client';

import './booking-card.css';

// @vue/component
export const BookingCard = {
	name: 'BookingCard',
	components: {
		BookingCardTitle,
		BookingCardNote,
		BookingCardProfit,
		BookingCardCommunication,
		BookingCardCrmButton,
		BookingCardSource,
		BookingCardAddClient,
		BookingCardDisabledPopup,
	},
	provide(): Object
	{
		return {
			cardDataService: this.cardDataService,
		};
	},
	props: {
		/** @type { AbstractCardDataService } */
		cardDataService: {
			type: Object,
			required: true,
		},
		classes: {
			type: [String, Object, Array],
			default: '',
		},
		styles: {
			type: [String, Object, Array],
			default: '',
		},
		dataAttributes: {
			type: Object,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		isMinimalView: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['communicationMouseenter'],
	data(): Object
	{
		return {
			isDisabledPopupShown: false,
		};
	},
	computed: {
		hasClient(): boolean
		{
			return Boolean(this.cardDataService.primaryClient);
		},
	},
	methods: {
		onBookingCardClick(event: PointerEvent): void
		{
			if (this.disabled)
			{
				this.isDisabledPopupShown = true;
				event.stopPropagation();
			}
		},
	},
	template: `
		<div
			class="booking-booking-card__container"
			:class="classes"
			:style="styles"
			v-bind="dataAttributes"
			@click.capture="onBookingCardClick"
		>
			<div class="booking-booking-card__padding">
				<slot name="start"/>
				<div class="booking-booking-card__inner">
					<div v-if="isMinimalView"
						class="booking-booking-card__content"
					>
						<div class="booking-booking-card__row booking-booking-card__upper-row">
							<div class="booking-booking-card__title-container">
								<BookingCardTitle/>
								<BookingCardNote :bindElement="() => $el"/>
							</div>
							<slot name="upper-content-row"/>
							<BookingCardProfit/>
						</div>
						<div class="booking-booking-card__row booking-booking-card__lower-row">
							<slot name="lower-content-row"/>
							<div v-if="hasClient" class="booking-booking-card__buttons">
								<BookingCardSource/>
								<BookingCardCommunication @mouseenter="$emit('communicationMouseenter')"/>
								<BookingCardCrmButton/>
							</div>
							<template v-else>
								<slot name="add-client-button"/>
							</template>
						</div>
					</div>
					<slot name="actions"></slot>
				</div>
			</div>
			<slot name="resize"/>
			<BookingCardDisabledPopup
				v-if="isDisabledPopupShown"
				:popupId="'booking-booking-card-disabled-popup-' + cardDataService.itemId"
				:bindElement="() => $el"
				@close="isDisabledPopupShown = false"
			/>
		</div>
	`,
};
