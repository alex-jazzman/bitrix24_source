import { SlotRanges } from 'booking.lib.slot-ranges';
import { DateTimeFormat } from 'main.date';

import type { OccupancyItem, ResourceSlot, SlotRange } from '../types';

const MAX_STEP_MINUTES = 30;
const SLOT_START_OFFSET_MINUTES = 3;

export class SlotsCreator
{
	#date: Date;
	#resourceOccupancies: OccupancyItem[];
	#slotRanges: SlotRange[];
	#resourceId: ?number;
	#timezone: string;

	constructor(params: SlotCreatorParams): void
	{
		this.#date = params.date;
		this.#resourceOccupancies = params.resourceOccupancy || [];
		this.#slotRanges = params.slotRanges;
		this.#resourceId = params.resourceId || null;
		this.#timezone = params.timezone;
	}

	get #timeFormat(): string
	{
		const isAmPmMode = new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' })
			.resolvedOptions()
			.hour12;

		return isAmPmMode ? 'h:i a' : 'H:i';
	}

	get #occupancies(): OccupancyItem[]
	{
		return this.#resourceId === null
			? this.#resourceOccupancies
			: this.#resourceOccupancies.filter(({ resourcesIds }) => resourcesIds.includes(this.#resourceId));
	}

	calcResourceSlots(): ResourceSlot
	{
		const nowTs = Date.now();
		const slots: ResourceSlot[] = [];

		SlotRanges
			.applyTimezone(this.#slotRanges, this.#date.getTime(), this.#timezone)
			.filter((slotRange) => slotRange.weekDays.includes(this.#date.getDay()))
			.sort((a, b) => a.from - b.from)
			.forEach((slotRange) => {
				const slotsFromTs = new Set();
				const slotDurationMs = slotRange.slotSize * 60 * 1000;
				const step = slotRange.slotSize < MAX_STEP_MINUTES ? slotRange.slotSize : MAX_STEP_MINUTES;
				const stepDurationMs = step * 60 * 1000;

				let fromTs = this.#convertMinutesToTs(this.#date, slotRange.from);
				if (fromTs < nowTs)
				{
					fromTs = this.#roundSlotStart(nowTs, step);
				}

				const rangeTs: [number, number] = [fromTs, this.#convertMinutesToTs(this.#date, slotRange.to)];

				const slotOutOfRange = (slotFromTs: number, slotToTs: number): boolean => {
					return slotFromTs <= nowTs || slotFromTs < rangeTs[0] || slotToTs > rangeTs[1];
				};

				while (fromTs < rangeTs[1])
				{
					const toTs = fromTs + slotDurationMs;

					if (slotOutOfRange(fromTs, toTs))
					{
						fromTs += stepDurationMs;
						continue;
					}

					if (this.#checkIsOccupiedSlot(fromTs, toTs))
					{
						this.#getOccupancyBorderSlots(fromTs, toTs, slotDurationMs, slotOutOfRange)
							.forEach((slotFromTs) => slotsFromTs.add(slotFromTs));

						fromTs += stepDurationMs;
						continue;
					}

					slotsFromTs.add(fromTs);
					fromTs += stepDurationMs;
				}

				[...slotsFromTs].forEach((slotFromTs) => {
					slots.push(this.#createSlot(slotFromTs, slotDurationMs));
				});
			});

		return slots;
	}

	#convertMinutesToTs(date: Date, minutes: number): number
	{
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		d.setMinutes(minutes);

		return d.getTime();
	}

	#roundSlotStart(slotStartTs: number, slotDurationMinutes: number): number
	{
		const slotStartDate = new Date(slotStartTs);
		let k: number = Math.ceil(slotStartDate.getMinutes() / slotDurationMinutes);

		if (k * slotDurationMinutes - slotStartDate.getMinutes() <= SLOT_START_OFFSET_MINUTES)
		{
			k += 1;
		}

		const roundedDate = new Date(slotStartDate);
		roundedDate.setMinutes(k * slotDurationMinutes);

		slotStartDate.setMinutes(roundedDate.getMinutes());

		return slotStartDate.getTime();
	}

	#createSlot(fromTs: number, duration: number): ResourceSlot
	{
		return {
			fromTs,
			toTs: fromTs + duration,
			label: DateTimeFormat.format(this.#timeFormat, new Date(fromTs)),
		};
	}

	#checkIsOccupiedSlot(fromTs: number, toTs: number): boolean
	{
		return this.#occupancies.some((occupancy) => {
			return (
				(fromTs >= occupancy.fromTs && fromTs < occupancy.toTs)
				|| (toTs > occupancy.fromTs && toTs <= occupancy.toTs)
			);
		});
	}

	#getOccupiedSlot(slot: { fromTs: number, toTs: number }, resourceOccupancy: OccupancyItem[]): ?OccupancyItem
	{
		return resourceOccupancy.find((occupancy) => {
			return (
				(slot.fromTs >= occupancy.fromTs && slot.fromTs < occupancy.toTs)
				|| (slot.toTs > occupancy.fromTs && slot.toTs <= occupancy.toTs)
			);
		});
	}

	#getOccupancyBorderSlots(fromTs: number, toTs: number, slotSizeTs: number, slotOutOfRange: () => boolean): number[]
	{
		const borderSlotsFromTs: number[] = [];

		const occupiedSlot = this.#getOccupiedSlot({ fromTs, toTs }, this.#occupancies);

		if (!occupiedSlot)
		{
			return borderSlotsFromTs;
		}

		const leftSlot = [occupiedSlot.fromTs - slotSizeTs, occupiedSlot.fromTs];
		if (!this.#checkIsOccupiedSlot(leftSlot[0], leftSlot[1]) && !slotOutOfRange(leftSlot[0], leftSlot[1]))
		{
			borderSlotsFromTs.push(leftSlot[0]);
		}

		const rightSlot = [occupiedSlot.toTs, occupiedSlot.toTs + slotSizeTs];
		if (!this.#checkIsOccupiedSlot(rightSlot[0], rightSlot[1]) && !slotOutOfRange(rightSlot[0], rightSlot[1]))
		{
			borderSlotsFromTs.push(rightSlot[0]);
		}

		return borderSlotsFromTs;
	}
}

type SlotCreatorParams = {
	date: Date;
	resourceOccupancy?: OccupancyItem[];
	slotRanges: SlotRange[];
	resourceId: ?number;
	timezone: string;
}
