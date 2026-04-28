import { DateFormat } from 'booking.const';
import { Segments } from 'booking.lib.segments';
import { SlotRanges } from 'booking.lib.slot-ranges';

import type { OccupancyItem, SlotRange } from './types';

let occupancyInstance: Occupancy | null = null;

export function createOccupancy(runAction: function): Occupancy
{
	if (occupancyInstance instanceof Occupancy)
	{
		return occupancyInstance;
	}

	occupancyInstance = new Occupancy(runAction);

	return occupancyInstance;
}

export class Occupancy
{
	#runAction: function = () => {};
	#timezone: string;
	#resources: { id: number, slotRanges: SlotRange[] }[];
	#requestCache: { [dateTs: number]: { [resourceId: number]: Promise } } = {};
	#requestedResourcesIds: { [dateTs: number]: Set } = {};
	#occupancy: { [dateTs: number]: { [resourceId: number]: OccupancyItem[] } } = {};

	constructor(runAction: function)
	{
		this.#runAction = runAction;
	}

	setResources(resources): this
	{
		this.#resources = resources;

		return this;
	}

	setTimezone(timezone: string): this
	{
		this.#timezone = timezone;

		return this;
	}

	async getOccupancy(ids: number[], dateTs: number): Promise<OccupancyItem[]>
	{
		const requestedResourcesIds = this.#requestedResourcesIds[dateTs];
		const unrequestedResourcesIds = ids.filter((id: number) => !requestedResourcesIds?.has(id));

		if (unrequestedResourcesIds.length > 0)
		{
			const request = this.#requestOccupancy(unrequestedResourcesIds, dateTs);

			this.#requestCache[dateTs] ??= {};
			unrequestedResourcesIds.forEach((resourceId: number) => {
				this.#requestCache[dateTs][resourceId] = request;
			});
		}

		await Promise.all(this.#getPromises(ids, dateTs));

		return this.#calculateOccupancy(ids, dateTs);
	}

	async #requestOccupancy(ids: number[], dateTs: number): Promise<void>
	{
		this.#occupancy[dateTs] ??= {};
		this.#requestedResourcesIds[dateTs] ??= new Set();
		ids.forEach((resourceId: number) => {
			this.#occupancy[dateTs][resourceId] ??= [];
			this.#requestedResourcesIds[dateTs].add(resourceId);
		});

		const { data: occupancy } = await this.#runAction('booking.api_v1.CrmForm.PublicForm.getOccupancy', {
			data: {
				ids,
				dateTs: Math.floor(dateTs / 1000),
			},
		});

		occupancy.forEach(({ resourcesIds, fromTs, toTs }) => {
			resourcesIds.forEach((resourceId: number) => {
				this.#occupancy[dateTs][resourceId]?.push({ fromTs, toTs, resourcesIds });
			});
		});
	}

	#getPromises(ids: number[], dateTs: number): Promise[]
	{
		return Object.keys(this.#requestCache[dateTs])
			.filter((resourceId: string) => ids.includes(Number(resourceId)))
			.map((resourceId: string) => this.#requestCache[dateTs][resourceId]);
	}

	#calculateOccupancy(resourcesIds: number[], dateTs: number): OccupancyItem[]
	{
		const segments = new Segments([[dateTs, new Date(dateTs).setDate(new Date(dateTs).getDate() + 1)]]);
		const resource = this.#resources.find(({ id }) => id === resourcesIds[0]);
		const selectedWeekDay = DateFormat.WeekDays[new Date(dateTs).getDay()];

		SlotRanges
			.applyTimezone(resource.slotRanges, dateTs, this.#timezone)
			.filter((slotRange: SlotRange) => slotRange.weekDays.includes(selectedWeekDay))
			.forEach((slotRange: SlotRange) => segments.subtract([
				new Date(dateTs).setMinutes(slotRange.from),
				new Date(dateTs).setMinutes(slotRange.to),
			]))
		;

		return resourcesIds
			.flatMap((resourceId: number) => this.#occupancy[dateTs][resourceId])
			.map(({ fromTs, toTs, resourcesIds: slotResourcesIds }) => {
				return {
					fromTs: fromTs * 1000,
					toTs: toTs * 1000,
					resourcesIds: slotResourcesIds,
				};
			});
	}

	clearCache(): void
	{
		this.#requestCache = {};
		this.#requestedResourcesIds = {};
	}
}
