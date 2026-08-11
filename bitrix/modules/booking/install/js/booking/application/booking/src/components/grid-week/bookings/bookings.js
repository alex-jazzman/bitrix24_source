import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { busySlots } from 'booking.lib.busy-slots';
import { gridFactory } from 'booking.lib.grid';
import { bookingService } from 'booking.lib.booking';
import { Duration } from 'booking.lib.duration';

import type { DatePeriodTs } from 'booking.lib.date-period';
import type { BookingModel } from 'booking.model.bookings';
import type { Cell } from 'booking.model.interface';

import {
	createBookingModelUi,
	splitBookingsByResourceId,
	getResourceBookingUiGroups,
} from '../../grid/bookings/libs';
import { InsufficientZoomMinVisibleDurationMs, InsufficientZoomThreshold } from '../const';
import { weekCellService } from '../lib/cell';
import { WeekBusySlot } from './busy-slot/busy-slot';
import { BookingWeek } from './booking/booking';
import { WeekPlacementSlot } from './placement-slot/placement-slot';

import type { BookingUiGroup, BookingModelUi } from '../../grid/booking-base/types';

import './bookings.css';

const { mapGetters: mapBookingsGetters } = createNamespacedHelpers(Model.Bookings);
const { mapGetters: mapInterfaceGetters } = createNamespacedHelpers(Model.Interface);
const { mapGetters: mapFilterGetters } = createNamespacedHelpers(Model.Filter);

// @vue/component
export const Bookings = {
	name: 'BookingsWeek',
	components: {
		BookingWeek,
		WeekBusySlot,
		WeekPlacementSlot,
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
			selectedFirstDayPeriodTs: 'selectedFirstDayPeriodTs',
			hoveredPlacementSlot: 'hoveredPlacementSlot',
			busySlots: 'busySlots',
			selectedPlacementSlots: 'selectedPlacementSlots',
			zoom: 'zoom',
		}),
		...mapFilterGetters({
			filteredBookingsIds: 'filteredBookingsIds',
			isFilterMode: 'isFilterMode',
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
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
				.map(({ id, dateFromTs, dateToTs, resourcesIds }) => ({
					id,
					dateFromTs,
					dateToTs,
					resourcesIds,
				}))
			;

			return JSON.stringify(bookings);
		},
		busySlotsWithDayIndex(): Object
		{
			return this.busySlots.map((slot) => ({
				slot,
				dayIndex: this.grid.getDayIndex(slot.fromTs),
			}));
		},
		bookings(): BookingModelUi[]
		{
			const { fromTs, toTs } = this.visiblePeriod;

			let bookings = [];
			if (this.isFilterMode)
			{
				bookings = this.$store.getters[`${Model.Bookings}/getByInterval`](fromTs, toTs)
					.filter((booking) => this.filteredBookingsIds.includes(booking.id));
			}
			else
			{
				bookings = this.$store.getters[`${Model.Bookings}/getByInterval`](fromTs, toTs)
					.filter((booking: BookingModel) => {
						return this.resourcesIds.some((id: number) => booking.resourcesIds.includes(id));
					});
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
		visibleBookingsMap(): Map<string, BookingModelUi>
		{
			const visibleBookingsMap: Map<string, BookingModelUi> = new Map();

			for (const booking of this.bookings)
			{
				if (
					this.shouldFilterByMinVisibleBookingDuration
					&& !bookingService.isVisibleByMinDuration(
						booking,
						this.visiblePeriod,
						InsufficientZoomMinVisibleDurationMs,
					)
				)
				{
					continue;
				}

				visibleBookingsMap.set(bookingService.generateKey(booking), booking);
			}

			return visibleBookingsMap;
		},
		shouldFilterByMinVisibleBookingDuration(): boolean
		{
			return this.zoom < InsufficientZoomThreshold;
		},
		resourceBookingsUiGroupsMap(): Map<number, BookingUiGroup[]>
		{
			const visibleBookingsByResourceId = splitBookingsByResourceId([
				...this.visibleBookingsMap.values(),
			]);

			return getResourceBookingUiGroups(visibleBookingsByResourceId);
		},
		visiblePeriod(): DatePeriodTs
		{
			return {
				fromTs: this.selectedFirstDayPeriodTs,
				toTs: this.selectedFirstDayPeriodTs + Duration.getUnitDurations().w,
			};
		},
		placementSlots(): Cell[]
		{
			const selected = Object.values(this.selectedPlacementSlots);
			const hovered = this.hoveredPlacementSlot;

			if (hovered && !this.selectedPlacementSlots[hovered.id] && weekCellService.isCreationAvailable(hovered))
			{
				return [...selected, hovered];
			}

			return selected;
		},
	},
	watch: {
		selectedFirstDayPeriodTs(): void
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
		overbookingMap(): void
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
		getBookingUiGroupsByResourceId(resourceId: number): BookingUiGroup[]
		{
			return this.resourceBookingsUiGroupsMap.get(resourceId) || [];
		},
	},
	template: `
		<TransitionGroup name="booking-transition-booking">
			<template v-for="[bookingKey, booking] of visibleBookingsMap" :key="bookingKey">
				<BookingWeek
					:bookingId="booking.id"
					:resourceId="booking.resourcesIds[0]"
					:nowTs
					:bookingUiGroups="getBookingUiGroupsByResourceId(booking.resourcesIds[0])"
				/>
			</template>
		</TransitionGroup>
		<template v-for="{ slot, dayIndex } of busySlotsWithDayIndex" :key="slot.id">
			<WeekBusySlot
				:busySlot="slot"
				:dayIndex="dayIndex"
			/>
		</template>
		<template v-for="cell of placementSlots" :key="cell.id">
			<WeekPlacementSlot
				:cell="cell"
			/>
		</template>
	`,
};
