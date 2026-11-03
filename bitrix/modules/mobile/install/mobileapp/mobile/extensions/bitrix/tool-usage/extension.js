/**
 * @module tool-usage
 */
jn.define('tool-usage', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');

	const extensionData = jnExtensionData.get('tool-usage');

	const TOOL_USAGE_PREFIX = 'tool_usage:tool_';
	const PERIOD_EVENT_PREFIX = 'tool_usage:period_';
	const MENU_SET_EVENT = 'tool_usage:menu_set';
	const MENU_BANNER_SHOWN_EVENT = 'tool_usage:menu_banner_shown';
	const REPLACEMENT_EVENT = 'tool_usage:menu_replaced';
	const REPLACEMENT_SHOWN_EVENT = 'tool_usage:replacement_shown';

	const PERIOD_DAYS = [30, 60, 90, 120];

	const ALLOWED_TOOL_IDS = new Set(extensionData?.allowedToolIds ?? []);

	const IS_TRACKING_AVAILABLE = extensionData?.isTrackingAvailable ?? false;

	const CRM_CUSTOM_SECTION_PREFIX = 'crm_custom_section-';

	const ToolUsageSources = {
		BOTTOM_NAVIGATION: 'bottomNavigation',
		MENU: 'menu',
	};

	/**
	 * @class ToolUsage
	 */
	class ToolUsage
	{
		/**
		 * @typedef {Object} ToolUsagePeriod
		 * @property {number} days Length of the period in days (one of 30, 60, 90, 120)
		 * @property {number} savedTs Unix timestamp (seconds) when period data was stored
		 * @property {number} targetTs Unix timestamp (seconds) when period expires
		 */

		/**
		 * @typedef {Object.<string, {count: number}>} ToolUsageSourcesMap
		 * A map keyed by sourceId where each value contains a counter.
		 */

		/**
		 * @return {Promise<ToolUsagePeriod|null>} Resolves with the current period or null if none.
		 */
		static async getCurrentPeriod()
		{
			await Tourist.ready();

			for (const days of [...PERIOD_DAYS].reverse())
			{
				const periodEventId = ToolUsage.#getPeriodEventId(days);
				const context = Tourist.getContext(periodEventId) ?? null;

				if (context)
				{
					const savedTs = Type.isNumber(context.savedTs) ? context.savedTs : null;
					const targetTs = Type.isNumber(context.targetTs) ? context.targetTs : null;

					return { days, savedTs, targetTs };
				}
			}

			return null;
		}

		/**
		 * @param {number} days Period length in days.
		 * @return {string} Event id.
		 */
		static #getPeriodEventId(days)
		{
			return `${PERIOD_EVENT_PREFIX}${days}`;
		}

		/**
		 * @param {ToolUsagePeriod|null} [period] Period object or null.
		 * @return {boolean} True if no period provided or target timestamp reached.
		 */
		static isPeriodExpired(period = null)
		{
			if (!period)
			{
				return true;
			}

			const targetTs = Type.isNumber(period.targetTs) ? Number(period.targetTs) : null;
			if (targetTs === null)
			{
				return true;
			}

			const nowSec = Math.round(Date.now() / 1000);

			return nowSec >= targetTs;
		}

		/**
		 * @param {number} currentDays Current period length in days.
		 * @return {number} Next period length (or same largest length).
		 */
		static getNextPeriodDays(currentDays)
		{
			if (!Type.isNumber(currentDays))
			{
				return PERIOD_DAYS[0];
			}

			return PERIOD_DAYS.find((days) => days > currentDays) || PERIOD_DAYS[PERIOD_DAYS.length - 1];
		}

		/**
		 * @param {number} days Period length in days.
		 * @return {Promise<ToolUsagePeriod>} Newly created period object.
		 */
		static async getNextPeriod(days)
		{
			const eventId = ToolUsage.#getPeriodEventId(days);
			const nowSec = Math.round(Date.now() / 1000);
			const targetTs = nowSec + 30 * 24 * 60 * 60; // Always +30 days

			await Tourist.remember(eventId, { context: { savedTs: nowSec, targetTs } });

			return { days, savedTs: nowSec, targetTs };
		}

		/**
		 * @param {string} toolId Tool identifier (must be allowed, see ALLOWED_TOOL_IDS).
		 * @param {string} sourceId Source identifier (e.g. ToolUsageSources.MENU).
		 * @param {ToolUsagePeriod|null} [period] Current period; if omitted current timestamp is used to anchor counting.
		 * @return {Promise<void>}
		 * @throws {Error} If toolId or sourceId are empty strings.
		 */
		static async registerShow(toolId, sourceId, period = null)
		{
			if (!Type.isStringFilled(toolId))
			{
				throw new Error('ToolUsage: "toolId" must be a non-empty string');
			}

			if (!Type.isStringFilled(sourceId))
			{
				throw new Error('ToolUsage: "source" must be a non-empty string');
			}

			const preparedToolId = String(toolId);

			if (!ToolUsage.isAvailableToolId(preparedToolId))
			{
				return;
			}

			await Tourist.ready();

			const eventId = `${TOOL_USAGE_PREFIX}${preparedToolId}`;
			const currentContext = Tourist.getContext(eventId) ?? {};

			const nowSec = Math.round(Date.now() / 1000);
			const periodSavedTs = Type.isNumber(period?.savedTs) ? period.savedTs : nowSec;

			const firstVisitTs = Type.isNumber(currentContext.firstVisitTs) ? currentContext.firstVisitTs : nowSec;
			const lastPeriodSavedTs = Type.isNumber(currentContext.periodSavedTs) ? currentContext.periodSavedTs : 0;

			let sources = currentContext.sources;

			// Reset stats if period changed
			if (periodSavedTs > lastPeriodSavedTs)
			{
				sources = {};
			}

			sources = ToolUsage.#prepareToolSource(sources, sourceId);

			const newContext = {
				sources,
				firstVisitTs,
				periodSavedTs,
			};

			await Tourist.remember(eventId, { context: newContext });
		}

		/**
		 * @return {Promise<void>}
		 */
		static async registerMenuSet()
		{
			await Tourist.ready();
			await Tourist.remember(MENU_SET_EVENT);
		}

		/**
		 * @param {string} toolId Tool identifier.
		 * @return {boolean} True if tracking enabled for this tool id.
		 */
		static isAvailableToolId(toolId)
		{
			if (!ToolUsage.isTrackingAvailable())
			{
				return false;
			}

			return ALLOWED_TOOL_IDS.has(toolId) || toolId.startsWith(CRM_CUSTOM_SECTION_PREFIX);
		}

		/**
		 * Guests and collabers cannot set up their own bottom menu, so nothing is tracked for them.
		 *
		 * @return {boolean} True if usage tracking is enabled for the current user.
		 */
		static isTrackingAvailable()
		{
			return IS_TRACKING_AVAILABLE;
		}

		/**
		 * @private
		 * @param {ToolUsageSourcesMap|undefined|null} currentSources Existing sources map.
		 * @param {string} sourceId Source identifier.
		 * @return {ToolUsageSourcesMap} New sources map copy with updated count.
		 */
		static #prepareToolSource(currentSources, sourceId)
		{
			const sources = isEmpty(currentSources) ? {} : { ...currentSources };

			const currentSourceData = isEmpty(sources[sourceId]) ? {} : { ...sources[sourceId] };

			let currentToolCount = Type.isNumber(currentSourceData.count) ? currentSourceData.count : 0;

			currentToolCount += 1;

			sources[sourceId] = {
				count: currentToolCount,
			};

			return sources;
		}

		/**
		 * Marks preset banner as shown.
		 * @return {Promise<void>}
		 */
		static async onMenuBannerShown()
		{
			await Tourist.ready();
			await Tourist.remember(MENU_BANNER_SHOWN_EVENT);
		}

		/**
		 * Marks menu preset as changed/customized.
		 * @return {Promise<void>}
		 */
		static async onChangePreset()
		{
			await Tourist.ready();
			await Tourist.remember(MENU_SET_EVENT);
		}

		/**
		 * @return {Promise<boolean>}
		 */
		static async shouldShowReplacementBanner()
		{
			await Tourist.ready();

			if (ToolUsage.#isMenuCustomized())
			{
				return false;
			}

			if (ToolUsage.#isReplacementBannerAlreadyShown())
			{
				return false;
			}

			if (!ToolUsage.#hasReplacementEvent())
			{
				return false;
			}

			return true;
		}

		/**
		 * Marks replacement banner as shown.
		 * @return {Promise<void>}
		 */
		static async onReplacementBannerShown()
		{
			await Tourist.ready();
			await Tourist.remember(REPLACEMENT_SHOWN_EVENT);
		}

		/**
		 * Must be called after Tourist.ready().
		 * @private
		 * @return {boolean}
		 */
		static #isMenuCustomized()
		{
			return !Tourist.firstTime(MENU_SET_EVENT);
		}

		/**
		 * Must be called after Tourist.ready().
		 * @private
		 * @return {boolean}
		 */
		static #isReplacementBannerAlreadyShown()
		{
			return !Tourist.firstTime(REPLACEMENT_SHOWN_EVENT);
		}

		/**
		 * Must be called after Tourist.ready().
		 * @private
		 * @return {boolean}
		 */
		static #hasReplacementEvent()
		{
			return !Tourist.firstTime(REPLACEMENT_EVENT);
		}
	}

	module.exports = {
		ToolUsage,
		ToolUsageSources,
		TOOL_USAGE_PREFIX,
		CRM_CUSTOM_SECTION_PREFIX,
	};
});
