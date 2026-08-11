import { mapGetters } from 'ui.vue3.vuex';
import { Event } from 'main.core';

import { BusySlot as BusySlotType, DateFormat, DraggedElementKind, Model } from 'booking.const';
import { cellService } from 'booking.lib.cell';
import { SlotRanges } from 'booking.lib.slot-ranges';
import { Duration } from 'booking.lib.duration';
import { gridTokens, GridTokenKey } from 'booking.lib.grid';

import { type ResourceModel } from 'booking.model.resources';
import { type Cell, type HoveredPlacementSlot } from 'booking.model.interface';

import { weekCellService } from '../../lib/cell';
import { cellStatsService } from '../../lib/cell-stats';
import { CellStatsOverlay } from './cell-stats-overlay/cell-stats-overlay';

import './cell.css';

// @vue/component
export const WeekGridCell = {
	name: 'WeekGridCell',
	components: {
		CellStatsOverlay,
	},
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		dayStartTs: {
			type: Number,
			required: true,
		},
	},
	data(): Object
	{
		return {
			hoveredHour: 0,
			isHourTracking: false,
		};
	},
	computed: {
		...mapGetters({
			selectedFirstDayPeriodTs: `${Model.Interface}/selectedFirstDayPeriodTs`,
			hoveredPlacementSlot: `${Model.Interface}/hoveredPlacementSlot`,
			isHoveredPlacementSlotFixed: `${Model.Interface}/isHoveredPlacementSlotFixed`,
			offset: `${Model.Interface}/offset`,
			zoom: `${Model.Interface}/zoom`,
			isFilterMode: `${Model.Filter}/isFilterMode`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			resizedBookingId: `${Model.Interface}/resizedBookingId`,
			draggedDataTransfer: `${Model.Interface}/draggedDataTransfer`,
			overbookingMap: `${Model.Bookings}/overbookingMap`,
			draggedBookingId: `${Model.Interface}/draggedBookingId`,
			timezone: `${Model.Interface}/timezone`,
			disabledBusySlots: `${Model.Interface}/disabledBusySlots`,
		}),
		draggedElementId(): number
		{
			return this.draggedDataTransfer.id;
		},
		isBookingDragged(): boolean
		{
			return this.draggedDataTransfer.kind === DraggedElementKind.Booking;
		},
		id(): string
		{
			return cellService.generateId(this.resourceId, this.dayStartTs, this.dayEndTs);
		},
		dayEndTs(): number
		{
			return this.dayStartTs + Duration.getUnitDurations().d;
		},
		cell(): HoveredPlacementSlot | null
		{
			return this.isHovered
				? this.hoveredPlacementSlot
				: null
			;
		},
		isHovered(): boolean
		{
			return this.hoveredPlacementSlot?.id === this.id;
		},
		needShowStatsOverlay(): boolean
		{
			return this.isHovered && (this.cell?.stats !== null);
		},
		resource(): ResourceModel
		{
			return this.$store.getters[`${Model.Resources}/getById`](this.resourceId);
		},
		isInteractionAvailable(): boolean
		{
			return !(
				this.isFilterMode
				|| this.resizedBookingId
				|| (this.isEditingBookingMode && !this.draggedDataTransfer.id)
			);
		},
		isCreationAvailable(): boolean
		{
			return weekCellService.isCreationAvailableForSlotSize(this.slotSize);
		},
		slotSize(): number
		{
			return this.resource?.slotRanges?.[0]?.slotSize ?? 60;
		},
		slotDuration(): number
		{
			return this.slotSize * Duration.getUnitDurations().i;
		},
		hoveredTs(): number
		{
			return this.dayStartTs + this.hoveredHour * Duration.getUnitDurations().H;
		},
		colliding(): { fromTs: number, toTs: number }[]
		{
			return this.$store.getters[`${Model.Interface}/getColliding`](
				this.resourceId,
				this.excludeBookingColliding,
			);
		},
		freeSpace(): { fromTs: number, toTs: number }
		{
			return this.getFreeSpaceForTs(this.hoveredTs);
		},
		weekDay(): string
		{
			return DateFormat.WeekDays[new Date(this.dayStartTs + this.offset).getDay()];
		},
		resourceWorkRange(): { from: number, to: number } | null
		{
			const slotRanges = SlotRanges
				.applyTimezone(this.resource?.slotRanges ?? [], this.dayStartTs, this.timezone)
				.filter((range) => range.weekDays.includes(this.weekDay));

			if (slotRanges.length === 0)
			{
				return null;
			}

			return {
				from: Math.min(...slotRanges.map((r) => r.from)),
				to: Math.max(...slotRanges.map((r) => r.to)),
			};
		},
		isNonWorkingTime(): boolean
		{
			if (!this.resourceWorkRange)
			{
				return false;
			}

			if (this.resourceWorkRange.from >= this.resourceWorkRange.to)
			{
				return false;
			}

			const hoveredMinutes = this.hoveredHour * 60;
			const isOutsideWorkRange = hoveredMinutes < this.resourceWorkRange.from
				|| hoveredMinutes >= this.resourceWorkRange.to;

			if (!isOutsideWorkRange)
			{
				return false;
			}

			return !this.isOffHoursDisabled();
		},
		hasEnoughFreeSpace(): boolean
		{
			const { fromTs: freeFrom, toTs: freeTo } = this.freeSpace;

			return (freeFrom !== freeTo) && (freeTo - freeFrom >= this.slotDuration);
		},
		createdFromTs(): number
		{
			const desired = this.hoveredTs;
			const { fromTs: freeFrom, toTs: freeTo } = this.freeSpace;

			if (!this.hasEnoughFreeSpace)
			{
				return desired;
			}

			const maxAllowed = freeTo - this.slotDuration;

			return Math.max(freeFrom, Math.min(desired, maxAllowed));
		},
		createdToTs(): number
		{
			return this.createdFromTs + this.slotDuration;
		},
	},
	watch: {
		draggedElementId(id: number): void
		{
			if (!id)
			{
				this.stopHourTracking();
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
			}
		},
	},
	created(): void
	{
		this.cellStatsTimeoutId = null;
	},
	beforeUnmount(): void
	{
		this.stopHourTracking();
		clearTimeout(this.cellStatsTimeoutId);
	},
	methods: {
		syncHoveredCell(): void
		{
			if (this.isBookingDragged)
			{
				return;
			}

			if (!this.isCreationAvailable)
			{
				const hoveredCell = {
					id: cellService.generateId(this.resourceId, this.dayStartTs, this.dayEndTs),
					fromTs: this.dayStartTs,
					toTs: this.dayEndTs,
					resourceId: this.resourceId,
				};

				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, hoveredCell);
				this.syncHoveredCellStats(hoveredCell);

				return;
			}

			if (!this.hasEnoughFreeSpace || this.isNonWorkingTime)
			{
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);

				return;
			}

			void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, {
				id: cellService.generateId(this.resourceId, this.createdFromTs, this.createdToTs),
				fromTs: this.createdFromTs,
				toTs: this.createdToTs,
				resourceId: this.resourceId,
			});
		},
		syncHoveredCellStats(cell: Cell): void
		{
			this.cellStatsTimeoutId = setTimeout(() => {
				if (this.hoveredPlacementSlot?.id !== cell.id)
				{
					this.cellStatsTimeoutId = null;

					return;
				}

				const stats = cellStatsService.calculate(cell);
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlotStats`, stats);

				this.cellStatsTimeoutId = null;
			}, 400);
		},
		isOffHoursDisabled(): boolean
		{
			if (this.draggedElementId)
			{
				return true;
			}

			return Object.values(this.disabledBusySlots).some((busySlot) => {
				return busySlot.type === BusySlotType.OffHours
					&& busySlot.resourceId === this.resourceId
					&& this.hoveredTs >= busySlot.fromTs
					&& this.hoveredTs < busySlot.toTs;
			});
		},
		getFreeSpaceForTs(ts: number): { fromTs: number, toTs: number }
		{
			let maxFrom = this.dayStartTs - this.slotDuration;
			let minTo = Infinity;

			for (const { fromTs, toTs } of this.colliding)
			{
				if (ts >= fromTs && ts < toTs)
				{
					return { fromTs: toTs, toTs };
				}

				if (toTs <= ts)
				{
					maxFrom = Math.max(maxFrom, toTs);
				}

				if (fromTs > ts)
				{
					minTo = Math.min(minTo, fromTs);
				}
			}

			return { fromTs: maxFrom, toTs: minTo };
		},
		computeFromTsForHour(hour: number): number | null
		{
			const desired = this.dayStartTs + hour * Duration.getUnitDurations().H;
			const { fromTs: freeFrom, toTs: freeTo } = this.getFreeSpaceForTs(desired);

			if (freeFrom === freeTo || freeTo - freeFrom < this.slotDuration)
			{
				return null;
			}

			const maxAllowed = freeTo - this.slotDuration;

			return Math.max(freeFrom, Math.min(desired, maxAllowed));
		},
		excludeBookingColliding(booking): boolean
		{
			if (booking.id === this.draggedBookingId)
			{
				return true;
			}

			const overbooking = this.overbookingMap.get(booking.id);

			return overbooking && overbooking.items.some((item) => item.resourceId === this.resourceId);
		},
		getHourFromMouseEvent(event: MouseEvent): number
		{
			const rect = this.$el.getBoundingClientRect();
			const offsetX = event.clientX - rect.left;
			const hour = Math.floor(offsetX / (gridTokens.get(GridTokenKey.WeekHourWidth) * this.zoom));

			return Math.max(0, Math.min(23, hour));
		},
		isMouseInCell(event: MouseEvent): boolean
		{
			const rect = this.$el.getBoundingClientRect();

			return (
				event.clientX >= rect.left
				&& event.clientX < rect.right
				&& event.clientY >= rect.top
				&& event.clientY < rect.bottom
			);
		},
		onMouseEnter(event: MouseEvent): void
		{
			if (!this.isInteractionAvailable || this.isHoveredPlacementSlotFixed)
			{
				return;
			}

			this.stopHourTracking();

			this.hoveredHour = this.getHourFromMouseEvent(event);
			this.syncHoveredCell();

			if (this.isCreationAvailable)
			{
				this.startHourTracking();
			}
		},
		startHourTracking(): void
		{
			if (this.isHourTracking)
			{
				return;
			}

			this.isHourTracking = true;
			Event.bind(document, 'mousemove', this.onDocumentHourMove);
		},
		stopHourTracking(): void
		{
			if (!this.isHourTracking)
			{
				return;
			}

			this.isHourTracking = false;
			Event.unbind(document, 'mousemove', this.onDocumentHourMove);
		},
		onDocumentHourMove(event: MouseEvent): void
		{
			if (this.isHoveredPlacementSlotFixed)
			{
				this.stopHourTracking();

				return;
			}

			if (!this.isMouseInCell(event))
			{
				if (this.hoveredPlacementSlot?.resourceId === this.resourceId)
				{
					void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
				}

				return;
			}

			if (!this.isInteractionAvailable)
			{
				return;
			}

			const newHour = this.getHourFromMouseEvent(event);

			if (newHour === this.hoveredHour && this.hoveredPlacementSlot !== null)
			{
				return;
			}

			const newFromTs = this.computeFromTsForHour(newHour);
			if (this.hoveredPlacementSlot !== null && (newFromTs === null || newFromTs === this.createdFromTs))
			{
				return;
			}

			this.hoveredHour = newHour;
			this.syncHoveredCell();
		},
		onMouseLeave(event: MouseEvent): void
		{
			if (this.isHoveredPlacementSlotFixed)
			{
				this.stopHourTracking();

				return;
			}

			if (event.relatedTarget?.closest('.booking-booking-week-selected-cell'))
			{
				return;
			}

			this.stopHourTracking();
			void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
		},
		onMouseUp(): void
		{
			if (Boolean(this.draggedElementId) && !this.isCreationAvailable)
			{
				this.stopHourTracking();
				void this.$store.dispatch(`${Model.Interface}/setHoveredPlacementSlot`, null);
			}
		},
	},
	template: `
		<div
			class="booking-booking__booking__week-grid_row-cell"
			@mouseenter="onMouseEnter"
			@mouseleave="onMouseLeave"
			@mouseup.capture="onMouseUp"
		>
			<CellStatsOverlay
				v-if="needShowStatsOverlay"
				:cell
			/>
		</div>
	`,
};
