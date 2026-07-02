import { type Store } from 'ui.vue3.vuex';
import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { DatePeriod, type DatePeriodTs } from 'booking.lib.date-period';
import { bookingService } from 'booking.lib.booking';
import { Duration } from 'booking.lib.duration';
import { SlotRanges } from 'booking.lib.slot-ranges';

import { type BookingModel } from 'booking.model.bookings';
import { type ResourceModel, type SlotRange } from 'booking.model.resources';

export type ResourceWorkloadStats = {
	slotsCount: number,
	busySlotsCount: number,
};

export class ResourceWorkloadService
{
	calculate(resourceId: number): ResourceWorkloadStats | null
	{
		const resource = this.#getResourceById(resourceId);
		if (!resource)
		{
			return null;
		}

		const period = this.#getCurrentPeriod();
		if (!period)
		{
			return null;
		}

		return this.#calculateStats(
			period,
			resource,
			this.#getResourceBookings(resourceId, period),
		);
	}

	#calculateStats(
		period: DatePeriodTs,
		resource: ResourceModel,
		bookings: BookingModel[],
	): ResourceWorkloadStats | null
	{
		if (!resource?.slotRanges?.length)
		{
			return null;
		}

		const slotSizeMs = (resource.slotRanges[0]?.slotSize ?? 0) * Duration.getUnitDurations().i;
		if (slotSizeMs <= 0)
		{
			return {
				slotsCount: 0,
				busySlotsCount: 0,
			};
		}

		const workTimeDuration = this.#getWorkTimeDuration(period, resource);
		const bookingsDuration = bookings.reduce((sum: number, booking: BookingModel) => {
			return sum + bookingService.getVisibleDuration(booking, period);
		}, 0);

		const busySlotsCount = Math.ceil(bookingsDuration / slotSizeMs);
		const slotsCount = Math.floor(workTimeDuration / slotSizeMs);

		return {
			slotsCount,
			busySlotsCount,
		};
	}

	#getCurrentPeriod(): DatePeriodTs | null
	{
		const period = DatePeriod.createByCurrentGridMode();

		return {
			fromTs: period.fromTs * 1000,
			toTs: period.toTs * 1000,
		};
	}

	#getResourceById(resourceId: number): ResourceModel | null
	{
		return this.#store.getters[`${Model.Resources}/getById`](resourceId) || null;
	}

	#getResourceBookings(resourceId: number, period: DatePeriodTs): BookingModel[]
	{
		return this.#store.getters[`${Model.Bookings}/getByInterval`](period.fromTs, period.toTs)
			.filter((booking: BookingModel) => booking.resourcesIds.includes(resourceId))
		;
	}

	#getWorkTimeDuration(period: DatePeriodTs, resource: ResourceModel): number
	{
		return this.#getResourceWorkingPeriods(period, resource)
			.reduce((sum: number, workingPeriod: DatePeriodTs) => {
				return sum + DatePeriod.getDuration(workingPeriod);
			}, 0)
		;
	}

	#getResourceWorkingPeriods(period: DatePeriodTs, resource: ResourceModel): DatePeriodTs[]
	{
		return DatePeriod.merge(
			DatePeriod
				.getDates({
					fromTs: period.fromTs / 1000,
					toTs: period.toTs / 1000,
				})
				.map((dayTs: number) => dayTs * 1000)
				.flatMap((dayStartTs: number) => {
					const dayPeriod = {
						fromTs: dayStartTs,
						toTs: dayStartTs + Duration.getUnitDurations().d,
					};

					return this.#getWorkingSlotRanges(dayPeriod, resource)
						.map((slotRange: SlotRange) => this.#slotRangeToDatePeriod(dayPeriod.fromTs, slotRange))
					;
				}),
		);
	}

	#getWorkingSlotRanges(period: DatePeriodTs, resource: ResourceModel): SlotRange[]
	{
		return SlotRanges
			.applyTimezone(resource.slotRanges, period.fromTs, this.#timezone)
			.filter((slotRange: SlotRange) => slotRange.weekDays.includes(this.#getWeekDay(period)))
		;
	}

	#getWeekDay(period: DatePeriodTs): string
	{
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			timeZone: this.#timezone,
		}).format(period.fromTs);
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

	get #store(): Store
	{
		return Core.getStore();
	}

	get #timezone(): string
	{
		return this.#store.getters[`${Model.Interface}/timezone`];
	}
}

export const resourceWorkloadService: ResourceWorkloadService = new ResourceWorkloadService();
