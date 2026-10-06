import { mapGetters } from 'ui.vue3.vuex';
import { Ears } from 'ui.ears';

import { Model } from 'booking.const';

import { DragMixin } from '../../lib/drag-mixin/drag-mixin';

import { NowLine } from '../grid/now-line/now-line';
import { DaysPanel } from './days-panel/days-panel';
import { NavigationPanel } from './navigation-panel/navigation-panel';
import { DayColumnPopup } from './day-column-popup/day-column-popup';
import { Row } from './row/row';
import { Bookings } from './bookings/bookings';
import { DragDelete } from '../grid-day/drag-delete/drag-delete';
import { ScalePanel } from '../grid/scale-panel/scale-panel';
import { type DayColumnPopupParams } from './day-column-popup/types';

import './grid-week.css';

// @vue/component
export const GridWeek = {
	name: 'BookingGridWeek',
	components: {
		DaysPanel,
		NavigationPanel,
		DayColumnPopup,
		Row,
		NowLine,
		Bookings,
		ScalePanel,
		DragDelete,
	},
	mixins: [DragMixin],
	data(): { dayColumnPopupParams: DayColumnPopupParams | null }
	{
		return {
			dayColumnPopupParams: null,
		};
	},
	computed: {
		...mapGetters({
			resourcesIds: `${Model.Interface}/resourcesIds`,
			scroll: `${Model.Interface}/scroll`,
			editingBookingId: `${Model.Interface}/editingBookingId`,
			editingWaitListItemId: `${Model.Interface}/editingWaitListItemId`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
			isLoaded: `${Model.Interface}/isLoaded`,
		}),
	},
	watch: {
		scroll(value): void
		{
			this.$refs.rowContainer.scrollTop = value;
		},
		isLoaded(isLoaded): void
		{
			if (isLoaded)
			{
				this.setupDrag();
			}
		},
		isFeatureEnabled(): void
		{
			this.setupDrag();
		},
		editingBookingId(): void
		{
			this.setupDrag();
		},
		editingWaitListItemId(): void
		{
			this.setupDrag();
		},
	},
	mounted(): void
	{
		this.ears = new Ears({
			container: this.$refs.rowContainer,
			smallSize: true,
			className: 'booking-booking-grid-week-ears',
		}).init();

		if (this.isLoaded)
		{
			this.setupDrag();
		}
	},
	beforeUnmount(): void
	{
		this.closeDayColumnPopup();
		this.ears?.destroy();
		this.ears = null;
	},
	methods: {
		async openDayColumnPopup(params: DayColumnPopupParams): Promise<void>
		{
			await this.$store.dispatch(`${Model.Interface}/setSelectedDateTs`, params.dateTs);

			this.dayColumnPopupParams = params;
		},
		closeDayColumnPopup(): void
		{
			this.dayColumnPopupParams = null;
			void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
		},
		updateEars(): void
		{
			this.ears?.toggleEars();
		},
	},
	template: `
		<NavigationPanel/>
		<div class="booking-booking__week-grid-wrapper">
			<div
				id="booking-booking-grid-wrap"
				class="booking-booking__week-grid-table booking-horizontal-scroll-bar booking-vertical-scroll-bar"
				ref="rowContainer"
				@scroll="$store.dispatch('interface/setScroll', $refs.rowContainer.scrollTop)"
			>
				<NowLine/>
				<DaysPanel/>
				<TransitionGroup
					name="booking-transition-resource"
					@after-leave="updateEars"
					@after-enter="updateEars"
				>
					<template v-for="resourceId of resourcesIds" :key="resourceId">
						<Row :resourceId="resourceId" @openDayColumnPopup="openDayColumnPopup"/>
					</template>
				</TransitionGroup>
				<Bookings/>
				<div class="booking-booking_add-resource-container"></div>
			</div>
			<ScalePanel :withZoom="false"/>
			<DragDelete/>
		</div>
		<DayColumnPopup
			v-if="dayColumnPopupParams"
			:bindElement="dayColumnPopupParams.bindElement"
			:dateTs="dayColumnPopupParams.dateTs"
			:resourceId="dayColumnPopupParams.resourceId"
			@close="closeDayColumnPopup"
		/>
	`,
};
