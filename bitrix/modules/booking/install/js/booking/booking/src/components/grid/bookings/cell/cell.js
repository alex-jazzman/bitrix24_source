import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { grid } from 'booking.lib.grid';
import { checkBookingIntersection } from 'booking.lib.check-booking-intersection';

import { BaseCell } from '../../base-cell/base-cell';
import './cell.css';

/**
 * @typedef {Object} Cell
 * @property {string} id
 * @property {number} fromTs
 * @property {number} toTs
 * @property {number} resourceId
 * @property {boolean} boundedToBottom
 */
export const Cell = {
	props: {
		/** @type {Cell} */
		cell: {
			type: Object,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			overbookingMap: `${Model.Bookings}/overbookingMap`,
		}),
		overbookingPositionsInCell(): string[]
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

			return positions;
		},
		left(): number
		{
			const left = grid.calculateLeft(this.cell.resourceId);
			const overbookingPositions = this.overbookingPositionsInCell;
			if (overbookingPositions.length > 1)
			{
				return -1;
			}

			if (overbookingPositions.length === 0 || overbookingPositions[0])
			{
				return left;
			}

			return left + grid.calculateWidth(this.width);
		},
		top(): number
		{
			return grid.calculateTop(this.cell.fromTs);
		},
		height(): number
		{
			return grid.calculateHeight(this.cell.fromTs, this.cell.toTs);
		},
		width(): number
		{
			return this.overbookingPositionsInCell.length === 0 ? 280 : 280 / 2;
		},
	},
	components: {
		BaseCell,
	},
	template: `
		<div
			v-if="left >= 0"
			class="booking-booking-selected-cell"
			:style="{
				'--left': left + 'px',
				'--top': top + 'px',
				'--height': height + 'px',
				'--width': width + 'px',
			}"
			@mouseleave="$store.dispatch('interface/setHoveredCell', null)"
		>
			<BaseCell
				:cell="cell"
				:className="{ '--overbooking': overbookingPositionsInCell.length > 0 }"
			/>
		</div>
	`,
};
