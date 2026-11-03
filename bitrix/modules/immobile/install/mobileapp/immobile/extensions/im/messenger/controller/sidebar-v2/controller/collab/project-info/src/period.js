/**
 * @module im/messenger/controller/sidebar-v2/controller/collab/project-info/src/period
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab/project-info/src/period', (require, exports, module) => {
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');

	/**
	 * Project period as a single line: a full range, an open start or an open finish.
	 *
	 * @param {string|null} dateStart calendar date in YYYY-MM-DD format
	 * @param {string|null} dateFinish calendar date in YYYY-MM-DD format
	 * @return {string} empty string means no date is set at all
	 */
	function formatProjectPeriod(dateStart, dateFinish)
	{
		const start = formatDate(dateStart);
		const finish = formatDate(dateFinish);

		// A project that starts and ends on the same day has one date, not a range from a day to
		// itself: the two halves of that range read as a mistake in the data.
		if (start !== '' && start === finish)
		{
			return start;
		}

		if (start !== '' && finish !== '')
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DATE_RANGE', {
				'#START#': start,
				'#FINISH#': finish,
			});
		}

		if (start !== '')
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DATE_FROM', { '#DATE#': start });
		}

		if (finish !== '')
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_PROJECT_INFO_DATE_TO', { '#DATE#': finish });
		}

		return '';
	}

	/**
	 * @param {string|null} value calendar date in YYYY-MM-DD format
	 * @return {string} empty string for a date that is not set
	 */
	function formatDate(value)
	{
		if (typeof value !== 'string')
		{
			return '';
		}

		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
		if (!match)
		{
			return '';
		}

		const [, year, month, day] = match;
		const date = new Date(Number(year), Number(month) - 1, Number(day));
		if (
			date.getFullYear() !== Number(year)
			|| date.getMonth() !== Number(month) - 1
			|| date.getDate() !== Number(day)
		)
		{
			return '';
		}

		return DateFormatter.getDate(date);
	}

	module.exports = { formatProjectPeriod };
});
