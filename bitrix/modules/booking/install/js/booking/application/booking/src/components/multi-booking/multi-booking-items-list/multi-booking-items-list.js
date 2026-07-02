// @vue/component

import { Ears } from 'ui.ears';
import { Model } from 'booking.const';
import { MultiBookingItem } from './multi-booking-item';
import './multi-booking-items-list.css';

export const MultiBookingItemsList = {
	name: 'MultiBookingItemsList',
	components: {
		MultiBookingItem,
	},
	emits: ['remove-selected'],
	computed: {
		selectedPlacementSlots(): Object
		{
			return this.$store.getters[`${Model.Interface}/selectedPlacementSlots`];
		},
		selectedCellsCount(): number
		{
			return Object.keys(this.selectedPlacementSlots).length;
		},
	},
	mounted()
	{
		this.ears = new Ears({
			container: this.$refs.wrapper,
			smallSize: true,
			className: 'booking--multi-booking--items-ears',
			noScrollbar: true,
		}).init();
	},
	watch: {
		selectedCellsCount: {
			handler(): void
			{
				setTimeout(() => this.ears.toggleEars(), 0);
			},
		},
	},
	template: `
		<div class="booking--multi-booking--book-list">
			<div ref="wrapper" class="booking--multi-booking--books-wrapper">
				<MultiBookingItem
					v-for="cell in selectedPlacementSlots"
					:key="cell.id"
					:id="cell.id"
					:from-ts="cell.fromTs"
					:to-ts="cell.toTs"
					:resource-id="cell.resourceId"
					@remove-selected="$emit('remove-selected', $event)"/>
			</div>
		</div>
	`,
};
