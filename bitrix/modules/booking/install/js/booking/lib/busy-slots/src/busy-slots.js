import { Core } from 'booking.core';
import { BusySlot, DateFormat, Model, Grid } from 'booking.const';
import { SlotRanges } from 'booking.lib.slot-ranges';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import { resourcesDateCache } from 'booking.lib.resources-date-cache';
import { cellService } from 'booking.lib.cell';
import { Duration } from 'booking.lib.duration';
import type { BookingModel, OverbookingMap } from 'booking.model.bookings';
import type { ResourceModel, SlotRange } from 'booking.model.resources';
import type { Intersections } from 'booking.model.interface';

import { getIntersectionBusySlots } from './lib';
import type { BusySlotDto, Range } from './types';

export type { BusySlotDto };

const minBookingViewMs = 15 * 60 * 1000;

class BusySlots
{
	#busySlots: BusySlotDto[] = [];

	#getBookings(dateTs: number): BookingModel[]
	{
		return Core.getStore().getters[`${Model.Bookings}/getByDateAndResources`](
			dateTs,
			this.#resourcesIds,
		);
	}

	#getIntersectingBookings(resourcesIds: number[], dateTs: number): BookingModel[]
	{
		return Core.getStore().getters[`${Model.Bookings}/getByDateAndResources`](
			dateTs,
			resourcesIds,
		);
	}

	get #isWeekMode(): boolean
	{
		return Core.getStore().getters[`${Model.Interface}/isWeekMode`];
	}

	get #selectedDateTs(): number
	{
		return Core.getStore().getters[`${Model.Interface}/selectedDateTs`];
	}

	get #selectedFirstDayPeriodTs(): number
	{
		return Core.getStore().getters[`${Model.Interface}/selectedFirstDayPeriodTs`];
	}

	get #offset(): number
	{
		return Core.getStore().getters[`${Model.Interface}/offset`];
	}

	get #timezone(): number
	{
		return Core.getStore().getters[`${Model.Interface}/timezone`];
	}

	get #resourcesIds(): number[]
	{
		return Core.getStore().getters[`${Model.Interface}/resourcesIds`];
	}

	get #intersections(): Intersections
	{
		if (this.#draggedBooking)
		{
			const draggedIds = [...this.#draggedBooking.resourcesIds];
			const notDraggedIds = draggedIds.filter((id: number) => id !== this.#draggedBookingResourceId);

			const resourceIntersections = Object.fromEntries(
				[...this.#resourcesIds].map((id: number) => [id, notDraggedIds]),
			);
			const draggedIntersections = Object.fromEntries(
				notDraggedIds.map((id: number) => [id, draggedIds]),
			);

			return {
				...resourceIntersections,
				...draggedIntersections,
			};
		}

		return Core.getStore().getters[`${Model.Interface}/intersections`];
	}

	get #draggedBooking(): BookingModel | null
	{
		return Core.getStore().getters[`${Model.Bookings}/getById`](this.#draggedBookingId) ?? null;
	}

	get #draggedBookingId(): number
	{
		return (
			Core.getStore().getters[`${Model.Interface}/draggedBookingId`]
			|| Core.getStore().getters[`${Model.Interface}/resizedBookingId`]
		);
	}

	get #draggedBookingResourceId(): number
	{
		return Core.getStore().getters[`${Model.Interface}/draggedBookingResourceId`];
	}

	#getPeriodDates(): number[]
	{
		if (this.#isWeekMode)
		{
			return Array.from(
				{ length: Grid.Duration.Week },
				(_, i) => this.#selectedFirstDayPeriodTs + i * Duration.getUnitDurations().d,
			);
		}

		return [this.#selectedDateTs];
	}

	async loadBusySlots(): Promise<void>
	{
		if (this.#resourcesIds.length === 0)
		{
			return;
		}

		const dates = this.#getPeriodDates();

		await this.#loadIntersections(dates);

		void Core.getStore().dispatch(`${Model.Interface}/clearDisabledBusySlots`);
		void Core.getStore().dispatch(`${Model.Interface}/clearBusySlots`);

		const resourcesWithIntersections = Object.keys(this.#intersections)
			.flatMap((key: string) => {
				const resourceId = Number(key);

				if (resourceId > 0)
				{
					return resourceId;
				}

				return this.#resourcesIds;
			})
		;

		this.#busySlots = dates.flatMap((dateTs) => [
			...this.#resourcesIds.flatMap((resourceId) => this.#calculateOffHoursBusySlots(resourceId, dateTs)),
			...resourcesWithIntersections.flatMap((resourceId) => this.#calculateIntersectionBusySlots(resourceId, dateTs)),
		]);

		return Core.getStore().dispatch(`${Model.Interface}/upsertBusySlotMany`, this.#busySlots);
	}

	async #loadIntersections(dates: number[]): Promise<void>
	{
		const selectedResourceIds = [...new Set(Object.values(this.#intersections).flat())];

		await Promise.all(dates.map(async (dateTs) => {
			const dateTsSeconds = dateTs / 1000;
			const loadedResourcesIds = new Set(resourcesDateCache.getIdsByDateTs(dateTsSeconds));
			const idsToLoad = selectedResourceIds.filter((id: number) => !loadedResourcesIds.has(id));

			await resourceDialogService.loadByIds(idsToLoad, dateTsSeconds);
		}));
	}

	#calculateOffHoursBusySlots(resourceId: number, dateTs: number): BusySlotDto[]
	{
		const resource: ResourceModel = this.#getResource(resourceId);
		if (resource.slotRanges.length === 0)
		{
			return [];
		}

		const weekDay = DateFormat.WeekDays[new Date(dateTs + this.#offset).getDay()];

		const bookingRanges = this.#getBookings(dateTs)
			.filter((booking: BookingModel) => booking.resourcesIds.includes(resourceId))
			.map((booking: BookingModel) => this.#calculateMinutesRange(booking, dateTs))
		;

		const slotRanges = SlotRanges
			.applyTimezone(resource.slotRanges, dateTs, this.#timezone)
			.filter((slotRange: SlotRange) => slotRange.weekDays.includes(weekDay))
		;

		const freeRanges = this.filterSlotRanges([...slotRanges, ...bookingRanges]);

		const busyRanges = [0, ...freeRanges.flatMap(({ from, to }) => [from, to]), 24 * 60]
			.reduce((acc, minutes, index) => {
				const chunkIndex = Math.floor(index / 2);

				acc[chunkIndex] ??= [];
				acc[chunkIndex].push(minutes);

				return acc;
			}, [])
		;

		return busyRanges.filter(([from, to]) => to - from > 0).map(([from, to]): BusySlotDto => {
			const fromTs = new Date(dateTs).setMinutes(from);
			const toTs = new Date(dateTs).setMinutes(to);
			const id = cellService.generateId(resourceId, fromTs, toTs);
			const type = BusySlot.OffHours;

			return { id, fromTs, toTs, resourceId, type };
		});
	}

	#calculateIntersectionBusySlots(resourceId: number, dateTs: number): BusySlotDto[]
	{
		const resource: ResourceModel = this.#getResource(resourceId);
		if (resource.slotRanges.length === 0)
		{
			return [];
		}

		const intersectingResourcesIds = [
			...(this.#intersections[0] ?? []),
			...(this.#intersections[resourceId] ?? []),
		];

		const bookingRanges = this.#getBookings(dateTs)
			.filter((booking: BookingModel) => booking.resourcesIds.includes(resourceId))
			.map((booking: BookingModel) => this.#calculateMinutesRange(booking, dateTs));

		const intersectingBookings = this.#getIntersectingBookings(intersectingResourcesIds, dateTs)
			.filter((booking: BookingModel) => {
				const notCurrentResource = !booking.resourcesIds.includes(resourceId);
				const isNotDragged = booking.id !== this.#draggedBookingId;

				return notCurrentResource && isNotDragged;
			});

		const intersectingBookingRanges = intersectingBookings
			.map((booking: BookingModel) => this.#calculateMinutesRange(booking, dateTs))
			.filter((ir) => {
				return bookingRanges
					.filter((br) => br.from <= ir.from && ir.to <= br.to)
					.length < 2;
			});

		if (intersectingBookingRanges.length === 0)
		{
			return [];
		}

		const busyRanges = intersectingBookingRanges.flatMap((intersectingRange) => {
			return this.#subtractRanges(intersectingRange, bookingRanges);
		});

		return getIntersectionBusySlots({
			resourceId,
			busyRanges,
			overbookingMap: this.#getOverbookingMap(),
			selectedDateTs: dateTs,
			intersectingBookings,
			intersectingResourcesIds,
		});
	}

	#calculateMinutesRange(booking: BookingModel, dateTs: number): Range
	{
		const date = new Date(dateTs);
		const dateFromTs = Math.max(date.getTime(), booking.dateFromTs) + this.#offset;
		const bookingViewToTs = Math.max(booking.dateToTs, booking.dateFromTs + minBookingViewMs);
		const dateToTs = Math.min(date.setDate(date.getDate() + 1), bookingViewToTs) + this.#offset;

		const dateFrom = new Date(dateFromTs);
		const dateTo = new Date(dateToTs);
		const to = dateTo.getHours() * 60 + dateTo.getMinutes();

		return {
			from: dateFrom.getHours() * 60 + dateFrom.getMinutes(),
			to: to === 0 ? 60 * 24 : to,
			id: booking.id,
		};
	}

	#subtractRanges(range, bookingRanges): Range[]
	{
		let remainingRanges = [{ ...range }];

		bookingRanges.forEach((bookingRange) => {
			remainingRanges = remainingRanges.flatMap((remainingRange) => {
				if (this.#rangesOverlap(remainingRange, bookingRange))
				{
					const parts = [];
					if (remainingRange.from < bookingRange.from)
					{
						parts.push({
							from: remainingRange.from,
							to: bookingRange.from,
							id: remainingRange.id,
						});
					}

					if (remainingRange.to > bookingRange.to)
					{
						parts.push({
							from: bookingRange.to,
							to: remainingRange.to,
							id: remainingRange.id,
						});
					}

					if (parts.length > 0)
					{
						return parts;
					}
				}

				return [remainingRange];
			});
		});

		return remainingRanges;
	}

	#rangesOverlap(range1, range2): boolean
	{
		return range1.from < range2.to && range2.from < range1.to;
	}

	filterSlotRanges(slotRanges: { from: number, to: number }[]): { from: number, to: number }[]
	{
		return slotRanges
			.map(({ from, to }) => ({ from, to }))
			.sort((a, b) => a.from - b.from)
			.reduce((acc, { from, to }) => {
				const last = acc.length - 1;
				if (acc[last] && acc[last].to >= from)
				{
					if (acc[last].to <= to)
					{
						acc[last].to = to;
					}
				}
				else
				{
					acc.push({ from, to });
				}

				return acc;
			}, [])
			.filter(({ from, to }) => to - from > 0);
	}

	#getResource(resourceId: number): ResourceModel
	{
		return Core.getStore().getters[`${Model.Resources}/getById`](resourceId);
	}

	#getOverbookingMap(): OverbookingMap
	{
		return Core.getStore().getters[`${Model.Bookings}/overbookingMap`];
	}
}

export const busySlots = new BusySlots();
