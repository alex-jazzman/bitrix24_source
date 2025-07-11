import { mapGetters } from 'ui.vue3.vuex';

import { AhaMoment, DateFormat, HelpDesk, Model } from 'booking.const';
import { ahaMoments } from 'booking.lib.aha-moments';
import { busySlots } from 'booking.lib.busy-slots';
import type { ResourceModel } from 'booking.model.resources';
import type { BookingModel } from 'booking.model.bookings';

import { BatteryIcon, BATTERY_ICON_HEIGHT, BATTERY_ICON_WIDTH } from './battery-icon/battery-icon';
import { WorkloadPopup } from './workload-popup/workload-popup';
import './resource-workload.css';

type BookingDuration = {
	dateFromTs: number,
	dateToTs: number,
	duration: number,
};

// @vue/component
export const ResourceWorkload = {
	name: 'ResourceWorkload',
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		scale: {
			type: Number,
			default: 1,
		},
		isGrid: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			isPopupShown: false,
		};
	},
	computed: {
		...mapGetters({
			selectedDateTs: 'interface/selectedDateTs',
			fromHour: 'interface/fromHour',
			toHour: 'interface/toHour',
		}),
		workLoadPercent(): number
		{
			if (this.slotsCount === 0)
			{
				return 0;
			}

			const slotsDuration = this.slotSize * this.slotsCount;

			return this.bookings.reduce((acc, booking: BookingDuration) => {
				return acc + Math.round(booking.duration * 100 / slotsDuration);
			}, 0);
		},
		slotSize(): number
		{
			return this.resource.slotRanges[0].slotSize ?? 60;
		},
		slotsCount(): number
		{
			const selectedDate = new Date(this.selectedDateTs);
			const selectedWeekDay = DateFormat.WeekDays[selectedDate.getDay()];
			const slotRanges = busySlots.filterSlotRanges(
				this.resource.slotRanges.filter((slotRange) => {
					return slotRange.weekDays.includes(selectedWeekDay);
				}),
			);

			return Math.floor(slotRanges.reduce((sum, slotRange) => {
				return sum + (slotRange.to - slotRange.from) / this.slotSize;
			}, 0));
		},
		bookings(): BookingDuration[]
		{
			const dateTs = this.selectedDateTs;

			return this.$store.getters[`${Model.Bookings}/getByDateAndResources`](dateTs, [this.resourceId])
				.map((booking: BookingModel) => {
					return {
						dateFromTs: booking.dateFromTs,
						dateToTs: booking.dateToTs,
						duration: (booking.dateToTs - booking.dateFromTs) / 60000,
					};
				});
		},
		bookingCount(): number
		{
			return this.bookings.length;
		},
		bookingsDuration(): number
		{
			return this.bookings.reduce((acc, booking: BookingDuration) => {
				return acc + booking.duration;
			}, 0);
		},
		resource(): ResourceModel
		{
			return this.$store.getters['resources/getById'](this.resourceId);
		},
		batteryIconOptions(): { height: number, width: number }
		{
			return {
				height: Math.round(BATTERY_ICON_HEIGHT * this.scale),
				width: Math.round(BATTERY_ICON_WIDTH * this.scale),
			};
		},
		bookingsCount(): number
		{
			return this.bookings.length;
		},
	},
	methods: {
		onMouseEnter(): void
		{
			this.showTimeout = setTimeout(() => this.showPopup(), 100);
		},
		onMouseLeave(): void
		{
			clearTimeout(this.showTimeout);
			this.closePopup();
		},
		showPopup(): void
		{
			this.isPopupShown = true;
		},
		closePopup(): void
		{
			this.isPopupShown = false;
		},
		async showAhaMoment(): Promise<void>
		{
			ahaMoments.setPopupShown(AhaMoment.ResourceWorkload);
			await ahaMoments.show({
				id: 'booking-resource-workload',
				title: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TITLE'),
				text: this.loc('BOOKING_AHA_RESOURCE_WORKLOAD_TEXT'),
				article: HelpDesk.AhaResourceWorkload,
				target: this.$refs.container,
			});

			ahaMoments.setShown(AhaMoment.ResourceWorkload);
		},
	},
	watch: {
		bookingsCount(newCount: number, previousCount: number): void
		{
			if (this.isGrid && newCount > previousCount && ahaMoments.shouldShow(AhaMoment.ResourceWorkload))
			{
				void this.showAhaMoment();
			}
		},
	},
	components: {
		BatteryIcon,
		WorkloadPopup,
	},
	template: `
		<div
			class="booking-booking-header-resource-workload"
			data-element="booking-resource-workload"
			:data-id="resourceId"
			ref="container"
			@click="showPopup"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<BatteryIcon
				:percent="workLoadPercent"
				:data-id="resourceId"
				:height="batteryIconOptions.height"
				:width="batteryIconOptions.width"
			/>
		</div>
		<WorkloadPopup
			v-if="isPopupShown"
			:resourceId="resourceId"
			:slotsCount="slotsCount"
			:bookingCount="Math.ceil(bookingsDuration / slotSize)"
			:workLoadPercent="workLoadPercent"
			:bindElement="$refs.container"
			@close="closePopup"
		/>
	`,
};
