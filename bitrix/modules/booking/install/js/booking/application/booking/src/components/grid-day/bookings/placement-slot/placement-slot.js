import { mapGetters } from 'ui.vue3.vuex';

import { Grid, Model } from 'booking.const';
import { checkBookingIntersection } from 'booking.lib.check-booking-intersection';
import { MaxInteractionBookingDurationsMs } from 'booking.lib.drag';
import { GridFactory, gridTokens, GridTokenKey, type GridBase } from 'booking.lib.grid';

import { BaseCell } from '../../../grid/base-cell/base-cell';
import { UiRestrictionPopup } from '../../../grid/bookings/ui-restriction-popup/ui-restriction-popup';

import './placement-slot.css';

/**
 * @typedef {Object} Cell
 * @property {string} id
 * @property {number} fromTs
 * @property {number} toTs
 * @property {number} resourceId
 * @property {boolean} boundedToBottom
 *
 * @vue/component
 */
export const DayPlacementSlot = {
	name: 'DayPlacementSlot',
	components: {
		BaseCell,
		UiRestrictionPopup,
	},
	inject: {
		gridContext: {
			default: null,
		},
	},
	props: {
		/** @type {Cell} */
		cell: {
			type: Object,
			required: true,
		},
		draggedBooking: {
			type: Object,
			default: null,
		},
	},
	data(): { overbookingPositionsInCell: string[] }
	{
		return {
			overbookingPositionsInCell: [],
		};
	},
	computed: {
		...mapGetters({
			overbookingMap: `${Model.Bookings}/overbookingMap`,
		}),
		grid(): GridBase
		{
			return GridFactory.getGrid(this.gridContext);
		},
		isWeekMode(): boolean
		{
			if (this.gridContext)
			{
				return this.gridContext.gridMode === Grid.Mode.Week;
			}

			return this.$store.getters[`${Model.Interface}/isWeekMode`];
		},
		zoom(): number
		{
			if (this.gridContext)
			{
				return this.gridContext.zoom;
			}

			return this.$store.getters[`${Model.Interface}/zoom`];
		},
		left(): number
		{
			const left = this.grid.calculateLeft(this.cell.resourceId);
			const overbookingPositions = this.overbookingPositionsInCell;
			if (overbookingPositions.length > 1)
			{
				return -1;
			}

			if (overbookingPositions.length === 0 || overbookingPositions[0])
			{
				return left;
			}

			return left + this.grid.calculateWidth(this.width);
		},
		top(): number
		{
			return this.grid.calculateTop(this.cell.fromTs);
		},
		height(): number
		{
			const fromTs = this.cell.fromTs;
			const draggedBookingDuration = this.draggedBooking
				? this.draggedBooking.dateToTs - this.draggedBooking.dateFromTs
				: Infinity;
			const toTs = draggedBookingDuration < this.cell.toTs - fromTs
				? fromTs + draggedBookingDuration
				: this.cell.toTs;

			return this.grid.calculateHeight(fromTs, toTs);
		},
		width(): number
		{
			const dayCellWidth = gridTokens.get(GridTokenKey.DayCellWidth);

			return this.overbookingPositionsInCell.length === 0 ? dayCellWidth : dayCellWidth / 2;
		},
		isRestricted(): boolean
		{
			return (this.cell.toTs - this.cell.fromTs) > MaxInteractionBookingDurationsMs;
		},
		isRestrictionPopupVisible(): boolean
		{
			return this.restrictionPopupEnabled && this.isRestricted && !this.isWeekMode;
		},
		restrictionPopupEnabled(): boolean
		{
			return this.gridContext?.restrictionPopupEnabled ?? true;
		},
		isVisible(): boolean
		{
			return this.left >= 0 && (!this.isRestricted || this.isRestrictionPopupVisible);
		},
		popupId(): string
		{
			return `booking-day-restriction-popup-${this.cell.resourceId}-${this.cell.fromTs}`;
		},
		isCompact(): boolean
		{
			return this.height < 40 || this.zoom < 0.8;
		},
	},
	mounted(): void
	{
		this.calcOverbookingPositionsInCell();
	},
	methods: {
		calcOverbookingPositionsInCell(): void
		{
			const resourceId = this.cell.resourceId;
			const cellTimespan = {
				dateFromTs: this.cell.fromTs,
				dateToTs: this.cell.toTs,
			};
			const positions: string[] = [];

			for (const [, overbooking] of this.overbookingMap)
			{
				const resourceOverbooking = overbooking.items.find((item) => item.resourceId === resourceId);
				if (
					resourceOverbooking
					&& checkBookingIntersection(overbooking.booking, cellTimespan)
					&& !positions.includes(resourceOverbooking?.shifted)
				)
				{
					positions.push(resourceOverbooking?.shifted);
				}

				if (positions.length > 2)
				{
					break;
				}
			}

			this.overbookingPositionsInCell = positions;
		},
	},
	template: `
		<div
			v-if="isVisible"
			class="booking-booking-selected-cell"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
				'--width': width + 'px',
			}"
			@mouseleave="$store.dispatch('interface/setHoveredPlacementSlot', null)"
		>
			<UiRestrictionPopup
				v-if="isRestrictionPopupVisible"
				:message="loc('BOOKING_BOOKING_DAY_CELL_RESTRICTION')"
				:popupId="popupId"
			/>
			<BaseCell
				v-else
				:cell="cell"
				:compact="isCompact"
				:className="{ '--overbooking': overbookingPositionsInCell.length > 0 }"
			/>
		</div>
	`,
};
