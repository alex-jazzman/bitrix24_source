import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { gridFactory } from 'booking.lib.grid';
import { checkBookingIntersection } from 'booking.lib.check-booking-intersection';

import { BaseCell } from '../../../grid/base-cell/base-cell';
import './placement-slot.css';
import { MaxDurationMsCompactCell } from '../../const';

// @vue/component
export const WeekPlacementSlot = {
	name: 'WeekPlacementSlot',
	components: {
		BaseCell,
	},
	props: {
		cell: {
			type: Object,
			required: true,
		},
	},
	data(): Object
	{
		return {
			overbookingPositionsInCell: [],
		};
	},
	computed: {
		...mapGetters({
			isHoveredPlacementSlotFixed: `${Model.Interface}/isHoveredPlacementSlotFixed`,
			hoveredPlacementSlot: `${Model.Interface}/hoveredPlacementSlot`,
			selectedPlacementSlots: `${Model.Interface}/selectedPlacementSlots`,
			overbookingMap: `${Model.Bookings}/overbookingMap`,
		}),
		grid(): GridBase
		{
			return gridFactory.getGrid();
		},
		dayIndex(): number
		{
			return this.grid.getDayIndex(this.cell.fromTs);
		},
		left(): number
		{
			return this.grid.calculateLeft(this.dayIndex, this.cell.fromTs);
		},
		fullHeight(): number
		{
			return this.grid.calculateHeight();
		},
		hasOverbooking(): boolean
		{
			return this.overbookingPositionsInCell.length === 1;
		},
		isBothHalvesOccupied(): boolean
		{
			return this.overbookingPositionsInCell.length > 1;
		},
		isOverbookingOnTop(): boolean
		{
			return this.hasOverbooking && !this.overbookingPositionsInCell[0];
		},
		top(): number
		{
			const baseTop = this.grid.calculateTop(this.cell.resourceId);

			if (this.isOverbookingOnTop)
			{
				return baseTop + this.fullHeight / 2;
			}

			return baseTop;
		},
		width(): number
		{
			return this.grid.calculateWidth(this.cell.fromTs, this.cell.toTs);
		},
		height(): number
		{
			if (this.hasOverbooking)
			{
				return this.fullHeight / 2;
			}

			return this.fullHeight;
		},
		positionStyle(): Object
		{
			return {
				'--left': `${this.left}px`,
				'--top': `${this.top}px`,
				'--width': `${this.width}px`,
				'--height': `${this.height}px`,
			};
		},
		isVisible(): boolean
		{
			return this.left >= 0 && !this.isBothHalvesOccupied;
		},
		isSelected(): boolean
		{
			return this.cell.id in this.selectedPlacementSlots;
		},
		isHoveredCell(): boolean
		{
			return this.hoveredPlacementSlot?.id === this.cell.id;
		},
		isFixed(): boolean
		{
			return this.isSelected || (this.isHoveredCell && this.isHoveredPlacementSlotFixed);
		},
		isCompact(): boolean
		{
			const cellDuration = this.cell.toTs - this.cell.fromTs;

			return cellDuration < MaxDurationMsCompactCell;
		},
	},
	watch: {
		cell: {
			handler(): void
			{
				this.calcOverbookingPositionsInCell();
			},
			immediate: true,
		},
		overbookingMap(): void
		{
			this.calcOverbookingPositionsInCell();
		},
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
				const resourceOverbooking = overbooking.items.find(
					(item) => item.resourceId === resourceId,
				);
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
		onCellClick(): void
		{
			if (!this.isSelected && !this.isHoveredPlacementSlotFixed)
			{
				void this.$store.dispatch(`${Model.Interface}/fixHoveredPlacementSlot`);
			}
		},
		onMouseLeave(event: MouseEvent): void
		{
			if (!this.isHoveredCell)
			{
				return;
			}

			if (this.isSelected || this.isHoveredPlacementSlotFixed)
			{
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);

				return;
			}

			const enteredRowCell = event.relatedTarget?.closest('.booking-booking__booking__week-grid_row-cell');
			if (!enteredRowCell)
			{
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
			}
		},
	},
	template: `
		<div
			v-if="isVisible"
			class="booking-booking-week-selected-cell"
			:class="{ '--fixed': isFixed }"
			:style="positionStyle"
			@click.stop="onCellClick"
			@mouseleave="onMouseLeave"
		>
			<BaseCell
				:cell="cell"
				:fixed="isFixed"
				:compact="isCompact"
				:className="{ '--overbooking': hasOverbooking }"
			/>
		</div>
	`,
};
