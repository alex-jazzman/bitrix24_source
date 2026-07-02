import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { busySlots } from 'booking.lib.busy-slots';
import { bookingService } from 'booking.lib.booking';
import type { BookingModel } from 'booking.model.bookings';
import type { Cell } from 'booking.model.interface';

import {
	createBookingModelUi,
	splitBookingsByResourceId,
	getResourceBookingUiGroups,
} from '../../grid/bookings/libs';
import { BusySlot } from './busy-slot/busy-slot';
import { DayPlacementSlot } from './placement-slot/placement-slot';
import { QuickFilterLine } from './quick-filter-line/quick-filter-line';
import { BookingDay } from './booking/booking';
import { CreateRestrictionOverlay } from './create-restriction-overlay/create-restriction-overlay';

import type { BookingUiDuration, BookingModelUi } from '../../grid/booking-base/types';

import './bookings.css';

const { mapGetters: mapBookingsGetters } = createNamespacedHelpers(Model.Bookings);
const { mapGetters: mapInterfaceGetters } = createNamespacedHelpers(Model.Interface);
const { mapGetters: mapFilterGetters } = createNamespacedHelpers(Model.Filter);

// @vue/component
export const Bookings = {
	name: 'BookingsDay',
	components: {
		BusySlot,
		DayPlacementSlot,
		QuickFilterLine,
		BookingDay,
		CreateRestrictionOverlay,
	},
	data(): { nowTs: number }
	{
		return {
			nowTs: Date.now(),
		};
	},
	computed: {
		...mapBookingsGetters({
			overbookingMap: 'overbookingMap',
		}),
		...mapInterfaceGetters({
			resourcesIds: 'resourcesIds',
			selectedDateTs: 'selectedDateTs',
			selectedPlacementSlots: 'selectedPlacementSlots',
			hoveredPlacementSlot: 'hoveredPlacementSlot',
			busySlots: 'busySlots',
			isFeatureEnabled: 'isFeatureEnabled',
			editingBookingId: 'editingBookingId',
			embedItems: 'embedItems',
			draggedBookingId: 'draggedBookingId',
		}),
		...mapFilterGetters({
			filteredBookingsIds: 'filteredBookingsIds',
			isFilterMode: 'isFilterMode',
			quickFilter: 'quickFilter',
		}),
		resourcesHash(): string
		{
			const resources = this.$store.getters[`${Model.Resources}/getByIds`](this.resourcesIds)
				.map(({ id, slotRanges }) => ({ id, slotRanges }))
			;

			return JSON.stringify(resources);
		},
		bookingsHash(): string
		{
			const bookings = this.bookings
				.map(({ id, dateFromTs, dateToTs }) => ({ id, dateFromTs, dateToTs }))
			;

			return JSON.stringify(bookings);
		},
		bookings(): BookingModelUi[]
		{
			const dateTs = this.selectedDateTs;

			let bookings = [];
			if (this.isFilterMode)
			{
				bookings = this.$store.getters[`${Model.Bookings}/getByDateAndIds`](dateTs, this.filteredBookingsIds);
			}
			else
			{
				bookings = this.$store.getters[`${Model.Bookings}/getByDateAndResources`](dateTs, this.resourcesIds);
			}

			return bookings.flatMap((booking) => {
				return booking.resourcesIds
					.filter((resourceId: number) => this.resourcesIds.includes(resourceId))
					.map((resourceId: number) => {
						return createBookingModelUi(resourceId, booking, this.overbookingMap.get(booking.id));
					});
			}).sort((a, b) => {
				if (a.resourcesIds[0] !== b.resourcesIds[0])
				{
					return b.resourcesIds[0] - a.resourcesIds[0];
				}

				if (a.dateFromTs !== b.dateFromTs)
				{
					return a.dateFromTs - b.dateFromTs;
				}

				return b.overbooking - a.overbooking;
			});
		},
		cells(): Cell[]
		{
			const cells = [...Object.values(this.selectedPlacementSlots), this.hoveredPlacementSlot];
			const dateFromTs = this.selectedDateTs;
			const dateToTs = new Date(dateFromTs).setDate(new Date(dateFromTs).getDate() + 1);

			return cells.filter((cell: Cell) => cell && cell.toTs > dateFromTs && dateToTs > cell.fromTs);
		},
		quickFilterHours(): number[]
		{
			const activeHours = new Set(Object.values(this.quickFilter.active));

			return Object.values(this.quickFilter.hovered).filter((hour) => !activeHours.has(hour));
		},
		resourceBookings(): Map<number, BookingModelUi>
		{
			return splitBookingsByResourceId(this.bookings);
		},
		resourceBookingsUiGroupsMap(): Map<number, BookingUiDuration[]>
		{
			return getResourceBookingUiGroups(this.resourceBookings);
		},
		embedEditingMode(): boolean
		{
			return (
				this.isFeatureEnabled
				&& (
					this.editingBookingId > 0
					|| (this.embedItems?.length ?? 0) > 0
				)
			);
		},
		draggedBooking(): BookingModel | null
		{
			if (!this.draggedBookingId)
			{
				return null;
			}

			return this.bookings.find(({ id }) => id === this.draggedBookingId) || null;
		},
	},
	watch: {
		selectedDateTs(): void
		{
			void busySlots.loadBusySlots();
		},
		bookingsHash(): void
		{
			void busySlots.loadBusySlots();
		},
		resourcesHash(): void
		{
			void busySlots.loadBusySlots();
		},
	},
	mounted(): void
	{
		this.nowTsIntervalId = setInterval(() => {
			this.nowTs = Date.now();
		}, 5 * 1000);
	},
	beforeUnmount(): void
	{
		clearInterval(this.nowTsIntervalId);
	},
	methods: {
		generateBookingKey(booking: BookingModel): string
		{
			return bookingService.generateKey(booking);
		},
		getBookingUiGroupsByResourceId(resourceId: number): BookingUiDuration[]
		{
			return this.resourceBookingsUiGroupsMap.get(resourceId) || [];
		},
	},
	template: `
		<div
			class="booking-booking-bookings"
			:class="{
				'embed-editing-mode': embedEditingMode,
			}"
		>
			<div class="booking-booking-bookings__busy-slots">
				<template v-for="busySlot of busySlots" :key="busySlot.id">
					<BusySlot
						:busySlot="busySlot"
					/>
				</template>
			</div>
			<div class="booking-booking-bookings__items">
				<TransitionGroup name="booking-transition-booking">
					<template v-for="booking of bookings" :key="generateBookingKey(booking)">
						<BookingDay
							:bookingId="booking.id"
							:resourceId="booking.resourcesIds[0]"
							:nowTs
							:bookingUiGroups="getBookingUiGroupsByResourceId(booking.resourcesIds[0])"
						/>
					</template>
				</TransitionGroup>
			</div>
			<template v-for="resourceId of resourcesIds" :key="'restriction-' + resourceId">
				<CreateRestrictionOverlay
					:resourceId="resourceId"
				/>
			</template>
			<template v-for="cell of cells" :key="cell.id">
				<DayPlacementSlot
					:cell="cell"
					:draggedBooking="draggedBooking"
				/>
			</template>
			<template v-for="hour of quickFilterHours" :key="hour">
				<QuickFilterLine
					:hour="hour"
				/>
			</template>
		</div>
	`,
};
