/**
 * @module timeman/work-reports/presentation
 */
jn.define('timeman/work-reports/presentation', (require, exports, module) => {
	const { RecordReportTypeEnum } = require('timeman/work-reports/enum');

	/**
	 * Only settings can tell the ai reports mode of the portal. A caller that has none knows nothing
	 * about the mode, which is not the same as the mode being off, so nothing is turned off for it.
	 *
	 * @param {ReportSettings} [settings]
	 * @returns {boolean}
	 */
	function isAiReportsOff(settings)
	{
		return Boolean(settings) && settings.isAiReportsEnabled !== true;
	}

	/**
	 * @param {ReportSettings} [settings]
	 * @returns {RecordReportPresentationFlags}
	 */
	function flagsFromSettings(settings)
	{
		if (!settings?.isAiReportsEnabled)
		{
			return { hasGpt: false, hasAutoReport: false };
		}

		if (settings.hasAiReportAccess)
		{
			return { hasGpt: true, hasAutoReport: false };
		}

		return { hasGpt: false, hasAutoReport: true };
	}

	/**
	 * @param {RecordReportTypeEnum} recordType
	 * @param {ReportSettings} [settings]
	 * @returns {RecordReportPresentationFlags}
	 */
	function getReportCardFlags(recordType, settings)
	{
		if (isAiReportsOff(settings))
		{
			return { hasGpt: false, hasAutoReport: false };
		}

		if (recordType?.equal(RecordReportTypeEnum.AI_REPORT))
		{
			return { hasGpt: true, hasAutoReport: false };
		}

		if (recordType?.equal(RecordReportTypeEnum.ROBOT_REPORT))
		{
			return { hasGpt: false, hasAutoReport: true };
		}

		return flagsFromSettings(settings);
	}

	/**
	 * @param {ReportSettings} [settings]
	 * @returns {RecordReportPresentationFlags}
	 */
	function getReportBannerFlags(settings)
	{
		return flagsFromSettings(settings);
	}

	module.exports = {
		getReportCardFlags,
		getReportBannerFlags,
	};
});
