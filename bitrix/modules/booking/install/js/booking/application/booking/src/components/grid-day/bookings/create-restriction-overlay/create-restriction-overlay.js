import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { gridFactory } from 'booking.lib.grid';
import { type ResourceModel } from 'booking.model.resources';
import { MaxInteractionBookingDurationsMs } from 'booking.lib.drag';

import { UiRestrictionPopup } from '../../../grid/bookings/ui-restriction-popup/ui-restriction-popup';

import './create-restriction-overlay.css';

// @vue/component
export const CreateRestrictionOverlay = {
	name: 'CreateRestrictionOverlay',
	components: {
		UiRestrictionPopup,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
	},
	data(): { isHovered: boolean }
	{
		return {
			isHovered: false,
		};
	},
	computed: {
		...mapGetters({
			selectedDateTs: `${Model.Interface}/selectedDateTs`,
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		resource(): ResourceModel
		{
			return this.$store.getters[`${Model.Resources}/getById`](this.resourceId);
		},
		slotSizeMs(): number
		{
			return (this.resource.slotRanges[0]?.slotSize ?? 60) * 60 * 1000;
		},
		isRestricted(): boolean
		{
			return this.slotSizeMs > MaxInteractionBookingDurationsMs;
		},
		dayStartTs(): number
		{
			return this.selectedDateTs;
		},
		dayEndTs(): number
		{
			const date = new Date(this.selectedDateTs);

			return date.setDate(date.getDate() + 1);
		},
		left(): number
		{
			return this.grid.calculateLeft(this.resourceId);
		},
		top(): number
		{
			return this.grid.calculateTop(this.dayStartTs);
		},
		height(): number
		{
			return this.grid.calculateHeight(this.dayStartTs, this.dayEndTs);
		},
		popupId(): string
		{
			return `booking-day-creation-restriction-${this.resourceId}`;
		},
	},
	methods: {
		onMouseEnter(): void
		{
			this.isHovered = true;
		},
		onMouseLeave(): void
		{
			this.isHovered = false;
		},
	},
	template: `
		<div
			v-if="isRestricted && left >= 0"
			class="booking-booking-create-restriction-overlay"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
			}"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
		>
			<UiRestrictionPopup
				v-if="isHovered"
				:message="loc('BOOKING_BOOKING_DAY_CELL_RESTRICTION')"
				:popupId="popupId"
			/>
		</div>
	`,
};
