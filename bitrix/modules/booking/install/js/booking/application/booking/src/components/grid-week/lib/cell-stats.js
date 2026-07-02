import type { Store } from 'ui.vue3.vuex';

import { Core } from 'booking.core';
import { DateFormat, Model } from 'booking.const';
import { DatePeriod } from 'booking.lib.date-period';
import { SlotRanges } from 'booking.lib.slot-ranges';
import { Duration } from 'booking.lib.duration';
import { bookingService } from 'booking.lib.booking';

import type { DatePeriodTs } from 'booking.lib.date-period';
import type { BookingModel } from 'booking.model.bookings';
import type { Cell, CellStats } from 'booking.model.interface';
import type { ResourceModel, SlotRange } from 'booking.model.resources';

type SlotsStats = {
	busySlotsCount: number,
	freeSlotsCount: number,
};

class CellStatsService
{
	calculate(cell: Cell): CellStats | null
	{
		const resource = this.#getResourceById(cell.resourceId);
		if (!resource)
		{
			return null;
		}

		const period: DatePeriodTs = { fromTs: cell.fromTs + this.#offset, toTs: cell.toTs + this.#offset };
		const bookings: BookingModel[] = this.#getCellBookings(cell.resourceId, period);

		return this.#calculateStats(period, resource, bookings);
	}

	#getResourceById(resourceId: number): ResourceModel | null
	{
		return this.#store.getters[`${Model.Resources}/getById`](resourceId) || null;
	}

	#getCellBookings(resourceId: number, period: DatePeriodTs): BookingModel[]
	{
		const localFromTs = period.fromTs - this.#offset;
		const localToTs = period.toTs - this.#offset;

		return this.#store.getters[`${Model.Bookings}/getByInterval`](localFromTs, localToTs)
			.filter((booking: BookingModel) => booking.resourcesIds.includes(resourceId))
			.map((booking: BookingModel) => ({
				...booking,
				dateFromTs: booking.dateFromTs + this.#offset,
				dateToTs: booking.dateToTs + this.#offset,
			}))
		;
	}

	#calculateStats(period: DatePeriodTs, resource: ResourceModel, bookings: BookingModel[]): CellStats | null
	{
		if (!resource?.slotRanges?.length)
		{
			return null;
		}

		const workingTimePeriods = this.#getResourceWorkingPeriods(period, resource);
		const bookingPeriods = DatePeriod.merge(
			bookings.map((booking) => bookingService.getVisiblePeriod(booking, period)),
		);

		let busySlotsCount = 0;
		let freeSlotsCount = 0;

		const slotSizeMs = (resource.slotRanges[0]?.slotSize ?? 0) * Duration.getUnitDurations().i;

		for (const workingPeriod of workingTimePeriods)
		{
			const stats = this.#countSlots(workingPeriod, slotSizeMs, bookingPeriods);

			busySlotsCount += stats.busySlotsCount;
			freeSlotsCount += stats.freeSlotsCount;
		}

		return {
			busySlotsCount,
			freeSlotsCount,
		};
	}

	#getResourceWorkingPeriods(period: DatePeriodTs, resource: ResourceModel): DatePeriodTs[]
	{
		const workingSlotRanges = this.#getWorkingSlotRanges(period, resource);

		return DatePeriod.merge(
			workingSlotRanges.map((slotRange: SlotRange) => this.#slotRangeToDatePeriod(period.fromTs, slotRange)),
		);
	}

	#getWeekDay(period: DatePeriodTs): string
	{
		return DateFormat.WeekDays[new Date(period.fromTs + this.#offset).getDay()];
	}

	#getWorkingSlotRanges(period: DatePeriodTs, resource: ResourceModel): SlotRange[]
	{
		return SlotRanges
			.applyTimezone(resource.slotRanges, period.fromTs, this.#timezone)
			.filter((slotRange: SlotRange) => slotRange.weekDays.includes(this.#getWeekDay(period)))
		;
	}

	#slotRangeToDatePeriod(dayTs: number, slotRange: { from: number, to: number }): DatePeriodTs
	{
		const fromDate = new Date(dayTs);
		const toDate = new Date(dayTs);
		fromDate.setHours(0, slotRange.from, 0, 0);
		toDate.setHours(0, slotRange.to, 0, 0);

		return {
			fromTs: fromDate.getTime(),
			toTs: toDate.getTime(),
		};
	}

	#countSlots(workingPeriod: DatePeriodTs, slotSizeMs: number, bookingPeriods: DatePeriodTs[]): SlotsStats
	{
		if (slotSizeMs <= 0)
		{
			return {
				busySlotsCount: 0,
				freeSlotsCount: 0,
			};
		}

		const totalSlotsCount = Math.floor(DatePeriod.getDuration(workingPeriod) / slotSizeMs);
		let freeSlotsCount = 0;
		let freeFromTs = workingPeriod.fromTs;

		for (const bookingPeriod of bookingPeriods)
		{
			if (bookingPeriod.toTs <= workingPeriod.fromTs)
			{
				continue;
			}

			if (bookingPeriod.fromTs >= workingPeriod.toTs)
			{
				break;
			}

			const busyPeriod = DatePeriod.intersect(workingPeriod, bookingPeriod);
			freeSlotsCount += Math.floor(Math.max(0, busyPeriod.fromTs - freeFromTs) / slotSizeMs);
			freeFromTs = Math.max(freeFromTs, busyPeriod.toTs);
		}

		freeSlotsCount += Math.floor(Math.max(0, workingPeriod.toTs - freeFromTs) / slotSizeMs);

		return {
			busySlotsCount: totalSlotsCount - freeSlotsCount,
			freeSlotsCount,
		};
	}

	get #offset(): number
	{
		return this.#store.getters[`${Model.Interface}/offset`];
	}

	get #timezone(): string
	{
		return this.#store.getters[`${Model.Interface}/timezone`];
	}

	get #store(): Store
	{
		return Core.getStore();
	}
}

export const cellStatsService: CellStatsService = new CellStatsService();
