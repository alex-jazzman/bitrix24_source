import { Type } from 'main.core';

import { LocalStorageManager } from 'im.v2.lib.local-storage';

export type GreetingItem = {
	id: number,
	text: string,
	timeRange: ?string,
	days: string[],
};

type GreetingSelectorOptions = {
	random?: () => number,
	getLastId?: () => ?number,
	saveLastId?: (id: number) => void,
	weekHolidays?: number[],
};

export const GreetingWindow = {
	morning: 'morning',
	day: 'day',
	evening: 'evening',
	night: 'night',
};

export const GreetingDayTag = {
	mon: 'mon',
	fri: 'fri',
	weekend: 'weekend',
	none: 'none',
};

const EASTER_EGG_CHANCE = 0.1;
const LAST_GREETING_STORAGE_KEY = 'ai-assistant-greeting-last-id';
// Date.getDay() convention; used until the portal work week arrives from the server
const DEFAULT_WEEK_HOLIDAYS = [6, 0];

/**
 * Picks a greeting phrase for the empty BitrixGPT chat screen by local browser time and weekday.
 * Randomness and storage access are injectable, so the selection is deterministic in tests.
 */
export class GreetingSelector
{
	#pool: GreetingItem[];
	#random: () => number;
	#weekHolidays: number[];
	#getLastId: ?() => ?number;
	#saveLastId: ?(id: number) => void;

	constructor(pool: GreetingItem[], options: GreetingSelectorOptions = {})
	{
		this.#pool = Type.isArrayFilled(pool) ? pool : [];
		this.#random = Type.isFunction(options.random) ? options.random : Math.random;
		this.#weekHolidays = Type.isArrayFilled(options.weekHolidays) ? options.weekHolidays : DEFAULT_WEEK_HOLIDAYS;
		this.#getLastId = options.getLastId;
		this.#saveLastId = options.saveLastId;
	}

	// strict window borders: morning [6,12), day [12,17), evening [17,21), night [21,24) and [0,6)
	static windowFor(hour: number): string
	{
		if (hour >= 6 && hour < 12)
		{
			return GreetingWindow.morning;
		}

		if (hour >= 12 && hour < 17)
		{
			return GreetingWindow.day;
		}

		if (hour >= 17 && hour < 21)
		{
			return GreetingWindow.evening;
		}

		return GreetingWindow.night;
	}

	// JS weekday: 0=Sunday..6=Saturday. Weekend follows the portal work week, mon/fri stay tied to their weekdays
	static dayTagFor(weekday: number, weekHolidays: number[] = DEFAULT_WEEK_HOLIDAYS): string
	{
		if (weekday === 1)
		{
			return GreetingDayTag.mon;
		}

		if (weekday === 5)
		{
			return GreetingDayTag.fri;
		}

		const holidays = Type.isArrayFilled(weekHolidays) ? weekHolidays : DEFAULT_WEEK_HOLIDAYS;
		if (holidays.includes(weekday))
		{
			return GreetingDayTag.weekend;
		}

		return GreetingDayTag.none;
	}

	/**
	 * Empty pool -> empty string (blank render, not a static fallback line).
	 */
	select(now: Date = new Date()): string
	{
		if (!Type.isArrayFilled(this.#pool))
		{
			return '';
		}

		const branch = this.#selectBranch(now);
		const candidates = this.#excludeLast(branch);
		const chosen = candidates[Math.floor(this.#random() * candidates.length)];

		this.#storeLastId(chosen.id);

		return chosen.text;
	}

	#selectBranch(now: Date): GreetingItem[]
	{
		const eggs = this.#pool.filter((item) => this.#isEasterEgg(item));
		if (this.#random() < EASTER_EGG_CHANCE && eggs.length > 0)
		{
			return eggs;
		}

		const window = GreetingSelector.windowFor(now.getHours());
		const dayTag = GreetingSelector.dayTagFor(now.getDay(), this.#weekHolidays);

		const windowItems = this.#pool.filter((item) => item.timeRange === window);
		const dayItems = this.#pool.filter(
			(item) => dayTag !== GreetingDayTag.none && Type.isArray(item.days) && item.days.includes(dayTag),
		);

		const branch = [...windowItems, ...dayItems];

		return branch.length > 0 ? branch : this.#pool;
	}

	#isEasterEgg(item: GreetingItem): boolean
	{
		return !Type.isStringFilled(item.timeRange) && !Type.isArrayFilled(item.days);
	}

	// single exclude-last rule for both branches: drop the last shown, unless it is the only candidate
	#excludeLast(branch: GreetingItem[]): GreetingItem[]
	{
		const lastId = this.#readLastId();
		const candidates = branch.filter((item) => item.id !== lastId);

		return candidates.length > 0 ? candidates : branch;
	}

	#readLastId(): ?number
	{
		try
		{
			if (Type.isFunction(this.#getLastId))
			{
				return this.#getLastId();
			}

			return LocalStorageManager.getInstance().get(LAST_GREETING_STORAGE_KEY, null);
		}
		catch
		{
			// storage is optional; selection still works without exclude-last
			return null;
		}
	}

	#storeLastId(id: number): void
	{
		try
		{
			if (Type.isFunction(this.#saveLastId))
			{
				this.#saveLastId(id);

				return;
			}

			LocalStorageManager.getInstance().set(LAST_GREETING_STORAGE_KEY, id);
		}
		catch
		{
			// storage is optional; ignore write failures
		}
	}
}
