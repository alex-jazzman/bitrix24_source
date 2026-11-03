/**
 * @module im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector
 */
jn.define('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');

	const {
		GreetingLastShownStore,
	} = require('im/messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector/last-shown-store');

	/**
	 * @typedef {object} GreetingItem
	 * @property {number} id
	 * @property {string} text
	 * @property {?string} timeRange
	 * @property {string[]} days
	 */

	/**
	 * @typedef {object} GreetingSelectorOptions
	 * @property {function(): number} [random]
	 * @property {function(): ?number} [getLastId]
	 * @property {function(number): void} [saveLastId]
	 * @property {number[]} [weekHolidays]
	 */

	const GreetingWindow = {
		morning: 'morning',
		day: 'day',
		evening: 'evening',
		night: 'night',
	};

	const GreetingDayTag = {
		mon: 'mon',
		fri: 'fri',
		weekend: 'weekend',
		none: 'none',
	};

	const EASTER_EGG_CHANCE = 0.1;
	// Date.getDay() convention; used until the portal work week arrives from the server
	const DEFAULT_WEEK_HOLIDAYS = [6, 0];

	let defaultStore = null;

	function getDefaultStore()
	{
		if (defaultStore === null)
		{
			defaultStore = new GreetingLastShownStore();
		}

		return defaultStore;
	}

	/**
	 * @class GreetingSelector
	 * @desc Picks a greeting phrase for the empty BitrixGPT screens by local device time and weekday.
	 * Randomness and storage access are injectable, so the selection is deterministic in tests.
	 */
	class GreetingSelector
	{
		/**
		 * @param {GreetingItem[]} pool
		 * @param {GreetingSelectorOptions} [options]
		 */
		constructor(pool, options = {})
		{
			this.pool = Type.isArrayFilled(pool) ? pool : GreetingSelector.getFallbackPool();
			this.random = Type.isFunction(options.random) ? options.random : Math.random;
			this.weekHolidays = Type.isArrayFilled(options.weekHolidays)
				? options.weekHolidays
				: DEFAULT_WEEK_HOLIDAYS;
			this.getLastIdCallback = options.getLastId;
			this.saveLastIdCallback = options.saveLastId;
		}

		// in-build pool for a cold start without the server one: keeps the empty screen from losing its only text
		static getFallbackPool()
		{
			return [
				{ id: -1, text: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_GREETING_FALLBACK_MORNING'), timeRange: GreetingWindow.morning, days: [] },
				{ id: -2, text: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_GREETING_FALLBACK_DAY'), timeRange: GreetingWindow.day, days: [] },
				{ id: -3, text: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_GREETING_FALLBACK_EVENING'), timeRange: GreetingWindow.evening, days: [] },
				{ id: -4, text: Loc.getMessage('IMMOBILE_MESSENGER_COPILOT_GREETING_FALLBACK_NIGHT'), timeRange: GreetingWindow.night, days: [] },
			].filter((item) => Type.isStringFilled(item.text));
		}

		// strict window borders: morning [6,12), day [12,17), evening [17,21), night [21,24) and [0,6)
		static windowFor(hour)
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
		static dayTagFor(weekday, weekHolidays = DEFAULT_WEEK_HOLIDAYS)
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
		 * @param {Date} [now]
		 * @return {string}
		 */
		select(now = new Date())
		{
			if (!Type.isArrayFilled(this.pool))
			{
				return '';
			}

			const branch = this.selectBranch(now);
			const candidates = this.excludeLast(branch);
			const chosen = candidates[Math.floor(this.random() * candidates.length)];

			this.storeLastId(chosen.id);

			return chosen.text;
		}

		/**
		 * @private
		 */
		selectBranch(now)
		{
			const eggs = this.pool.filter((item) => this.isEasterEgg(item));
			if (this.random() < EASTER_EGG_CHANCE && eggs.length > 0)
			{
				return eggs;
			}

			const window = GreetingSelector.windowFor(now.getHours());
			const dayTag = GreetingSelector.dayTagFor(now.getDay(), this.weekHolidays);

			const windowItems = this.pool.filter((item) => item.timeRange === window);
			const dayItems = this.pool.filter(
				(item) => dayTag !== GreetingDayTag.none && Type.isArray(item.days) && item.days.includes(dayTag),
			);

			const branch = [...windowItems, ...dayItems];

			return branch.length > 0 ? branch : this.pool;
		}

		/**
		 * @private
		 */
		isEasterEgg(item)
		{
			return !Type.isStringFilled(item.timeRange) && !Type.isArrayFilled(item.days);
		}

		// single exclude-last rule for both branches: drop the last shown, unless it is the only candidate
		/**
		 * @private
		 */
		excludeLast(branch)
		{
			const lastId = this.readLastId();
			const candidates = branch.filter((item) => item.id !== lastId);

			return candidates.length > 0 ? candidates : branch;
		}

		/**
		 * @private
		 */
		readLastId()
		{
			try
			{
				if (Type.isFunction(this.getLastIdCallback))
				{
					return this.getLastIdCallback();
				}

				return getDefaultStore().getLastId();
			}
			catch (e)
			{
				// storage is optional; selection still works without exclude-last
				return null;
			}
		}

		/**
		 * @private
		 */
		storeLastId(id)
		{
			try
			{
				if (Type.isFunction(this.saveLastIdCallback))
				{
					this.saveLastIdCallback(id);

					return;
				}

				getDefaultStore().saveLastId(id);
			}
			catch (e)
			{
				// storage is optional; ignore write failures
			}
		}
	}

	module.exports = {
		GreetingSelector,
		GreetingWindow,
		GreetingDayTag,
	};
});
