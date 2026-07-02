import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { BusySlot as BusySlotType, Model } from 'booking.const';
import { gridFactory } from 'booking.lib.grid';

import { UiBusySlot } from '../../../grid/bookings/ui-busy-slot/ui-busy-slot';
import './busy-slot.css';

const { mapGetters: mapInterfaceGetters } = createNamespacedHelpers(Model.Interface);
const { mapGetters: mapFilterGetters } = createNamespacedHelpers(Model.Filter);

// @vue/component
export const BusySlot = {
	name: 'BusySlot',
	components: {
		UiBusySlot,
	},
	props: {
		busySlot: {
			type: Object,
			required: true,
		},
	},
	computed: {
		...mapInterfaceGetters({
			disabledBusySlots: 'disabledBusySlots',
			isEditingBookingMode: 'isEditingBookingMode',
			isDragMode: 'isDragMode',
		}),
		...mapFilterGetters({
			isFilterMode: 'isFilterMode',
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		enabledOverbookingFeature(): boolean
		{
			return this.$store.state[Model.Interface].enabledFeature.bookingOverbooking;
		},
		left(): number
		{
			return this.grid.calculateLeft(this.busySlot.resourceId);
		},
		top(): number
		{
			return this.grid.calculateTop(this.busySlot.fromTs);
		},
		height(): number
		{
			return this.grid.calculateHeight(this.busySlot.fromTs, this.busySlot.toTs);
		},
		positionStyle(): Object
		{
			return {
				'--left': this.left + 'px',
				'--top': this.top + 'px',
				'--height': this.height + 'px',
			};
		},
		isVisible(): boolean
		{
			return this.left >= 0;
		},
		isDisabled(): boolean
		{
			const isDragOffHours = this.isDragMode && this.busySlot.type === BusySlotType.OffHours;
			const isDragOverbooking = this.isDragMode && this.busySlot.type === BusySlotType.IntersectionOverbooking;

			if (this.isFilterMode || isDragOffHours || isDragOverbooking)
			{
				return true;
			}

			return this.busySlot.id in this.disabledBusySlots;
		},
	},
	methods: {
		onClick(): void
		{
			if (
				this.isFilterMode
				|| this.isEditingBookingMode
				|| this.busySlot.type === BusySlotType.IntersectionOverbooking
				|| (!this.enabledOverbookingFeature && this.busySlot.type === BusySlotType.Intersection)
			)
			{
				return;
			}

			void this.$store.dispatch(`${Model.Interface}/addDisabledBusySlot`, this.busySlot);
		},
	},
	template: `
		<UiBusySlot
			:busySlot="busySlot"
			:positionStyle="positionStyle"
			:isDisabled="isDisabled"
			:isVisible="isVisible"
			@click="onClick"
		/>
	`,
};
