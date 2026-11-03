/**
 * @module im/messenger/lib/date-navigation/src/rest
 */
jn.define('im/messenger/lib/date-navigation/src/rest', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/** Mirrors Bitrix\Im\V2\Message\DateNavigation\DateNavigationError. */
	const DateNavigationErrorCode = Object.freeze({
		notAvailable: 'DATE_NAVIGATION_NOT_AVAILABLE',
		wrongDateFormat: 'DATE_NAVIGATION_WRONG_DATE_FORMAT',
		wrongRange: 'DATE_NAVIGATION_WRONG_RANGE',
		wrongTimezone: 'DATE_NAVIGATION_WRONG_TIMEZONE',
		messageNotFound: 'DATE_NAVIGATION_MESSAGE_NOT_FOUND',
	});

	/**
	 * @class DateNavigationRest
	 */
	class DateNavigationRest
	{
		/**
		 * @param {DateNavigationCalendarParams} params
		 * @return {Promise<DateNavigationCalendar>}
		 */
		static async getCalendar(params)
		{
			const { calendar } = await runAction(RestMethod.imV2ChatMessageDateNavigationGetCalendar, {
				data: params,
			});

			return calendar;
		}

		/**
		 * @param {DateNavigationResolveParams} params
		 * @return {Promise<DateNavigationResolvedDate>}
		 */
		static async resolveDate(params)
		{
			const { resolvedDate } = await runAction(RestMethod.imV2ChatMessageDateNavigationResolveDate, {
				data: params,
			});

			return resolvedDate;
		}

		/**
		 * The transport rejects with the error list of the server, but a request that never reached
		 * it rejects with a bare failure - and then there is no code to show.
		 *
		 * @param {unknown} errors
		 * @return {string|number|null}
		 */
		static getErrorCode(errors)
		{
			if (!Type.isArrayFilled(errors))
			{
				return null;
			}

			return errors[0]?.code ?? null;
		}
	}

	module.exports = { DateNavigationRest, DateNavigationErrorCode };
});
