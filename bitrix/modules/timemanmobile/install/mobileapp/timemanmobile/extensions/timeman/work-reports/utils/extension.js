/**
 * @module timeman/work-reports/utils
 */
jn.define('timeman/work-reports/utils', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Moment } = require('utils/date');
	const { dayMonth } = require('utils/date/formats');
	const { Duration } = require('utils/date/duration');
	const { ReportTypeEnum } = require('timeman/work-reports/enum');
	const { inAppUrl } = require('in-app-url');

	const { DAY: DAY_MS } = Duration.getLengthFormat();
	// +1 day offset: dateFrom/dateTo include full boundary days (00:00 → 23:59).
	const DAY_PERIOD_MAX_MS = DAY_MS * (1 + 1);
	const WEEK_PERIOD_MAX_MS = DAY_MS * (7 + 1);

	/**
	 * @param {Date} [date]
	 * @returns {string}
	 */
	function formatDate(date)
	{
		if (!date)
		{
			return '';
		}

		return new Moment(date).format(dayMonth());
	}

	/**
	 * @param {number} dateFrom
	 * @param {number} dateTo
	 * @returns {string}
	 */
	function formatPeriod(dateFrom, dateTo)
	{
		if (!dateFrom || !dateTo)
		{
			return '';
		}

		const from = Moment.createFromTimestamp(dateFrom);
		const to = Moment.createFromTimestamp(dateTo);

		const sameDay = from.date.getDate() === to.date.getDate()
			&& from.date.getMonth() === to.date.getMonth()
			&& from.date.getFullYear() === to.date.getFullYear();

		if (sameDay)
		{
			return from.format(dayMonth());
		}

		if (from.date.getMonth() === to.date.getMonth())
		{
			return `${from.date.getDate()} - ${to.format(dayMonth())}`;
		}

		return `${from.format(dayMonth())} - ${to.format(dayMonth())}`;
	}

	/**
	 * @param {number} dateFrom
	 * @param {number} dateTo
	 * @returns {ReportTypeEnum}
	 */
	function resolvePeriodType(dateFrom, dateTo)
	{
		const diffMs = (dateTo - dateFrom) * 1000;

		if (diffMs <= DAY_PERIOD_MAX_MS)
		{
			return ReportTypeEnum.DAY;
		}

		if (diffMs <= WEEK_PERIOD_MAX_MS)
		{
			return ReportTypeEnum.WEEK;
		}

		return ReportTypeEnum.MONTH;
	}

	/**
	 * @param {ReportTypeEnum|null|undefined} reportType
	 * @returns {boolean}
	 */
	function isMeaningfulReportType(reportType)
	{
		return ReportTypeEnum.has(reportType) && !reportType.equal(ReportTypeEnum.NONE);
	}

	/**
	 * @param {DerivePeriodOptions} options
	 * @returns {{ type: ReportTypeEnum, label: string } | null}
	 */
	function derivePeriod({ dateFrom, dateTo, reportType } = {})
	{
		const hasType = isMeaningfulReportType(reportType);

		if (!dateFrom || !dateTo)
		{
			return hasType ? { type: reportType, label: '' } : null;
		}

		const type = hasType
			? reportType
			: resolvePeriodType(dateFrom, dateTo);

		return {
			type,
			label: formatPeriod(dateFrom, dateTo),
		};
	}

	/**
	 * @param {DialogSheetOptions} options
	 * @returns {Promise<PageManager>}
	 */
	function openDialogSheet({ title, component, height, parentWidget })
	{
		const options = { component };

		if (title)
		{
			options.titleParams = {
				text: title,
				type: 'dialog',
			};
		}

		return new BottomSheet(options)
			.setParentWidget(parentWidget)
			.setMediumPositionHeight(height)
			.disableOnlyMediumPosition()
			.enableAdoptHeightByKeyboard()
			.enableResizeContent()
			.disableContentSwipe()
			.open();
	}

	/**
	 * @param {unknown} value
	 * @returns {number[]}
	 */
	function normalizeUserIds(value)
	{
		if (!Array.isArray(value))
		{
			return [];
		}

		return value.map(Number).filter((id) => id > 0);
	}

	/**
	 * @param {{ url: string }} [params]
	 * @returns {Promise<void>}
	 */
	async function openReportLink({ url } = {})
	{
		if (!url)
		{
			return;
		}

		inAppUrl.open(url);
	}

	module.exports = {
		openDialogSheet,
		formatDate,
		formatPeriod,
		derivePeriod,
		normalizeUserIds,
		openReportLink,
	};
});
